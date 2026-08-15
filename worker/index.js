/**
 * 英语作文批改 · 会员后端（Cloudflare Worker）
 *
 * 职责：
 *  1. 会员账号：手机号登录 → 发用户 token
 *  2. 激活码：管理员生成 → 用户激活 → 写入会员到期时间
 *  3. AI 批改代理：校验会员有效后，用后端的 AI Key 调 AI，返回结果（不把 Key 暴露给前端）
 *  4. 管理接口：管理员登录 / 生成激活码 / 查用户 / 查激活码
 *
 * 环境变量（在 Cloudflare 后台 Worker 设置里填，或 wrangler.toml [vars]）：
 *   ADMIN_PASSWORD  管理员后台密码（登录 admin.html 用）
 *   AI_PROVIDER     服务商：qwen | deepseek | openai | custom
 *   AI_KEY          你的 AI API Key（存在后端，绝不发给前端）
 *   AI_MODEL        可选，覆盖默认模型
 *   AI_BASE_URL     可选，覆盖默认 baseUrl（custom 时必填）
 *
 * KV 命名空间（wrangler.toml 绑定）：
 *   USERS  phone → 会员到期时间戳(ms)
 *   CODES  code → JSON { days, used, createdAt }
 *   AUTH   token → JSON { type: 'user'|'admin', phone?, createdAt }
 */

// ---- 服务商配置（批改用，文本模型即可）----
const PROVIDERS = {
  qwen: {
    type: 'openai',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
  deepseek: {
    type: 'openai',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  openai: {
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  custom: {
    type: 'openai',
    baseUrl: '',
    model: '',
  },
};

const STYLE_PROMPTS = {
  standard: '请像一位严谨的英语老师一样批改，指出语法、用词、搭配、逻辑等问题，并给出中肯的改进建议。',
  concise: '请只标注最关键的 3-5 个错误，简洁明了，重点突出。',
  encouraging: '请以鼓励为主，多肯定学生的优点，错误用温和的方式指出，适合初学者。',
  advanced: '请从高级表达、学术写作角度批改，提出向母语者水平提升的建议。',
};

// ---- 工具 ----
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}

function err(message, status = 400) {
  return json({ error: message }, status);
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆的 0/O/1/I
  const rnd = new Uint8Array(12);
  crypto.getRandomValues(rnd);
  let s = '';
  for (let i = 0; i < 12; i++) {
    s += chars[rnd[i] % chars.length];
    if (i === 3 || i === 7) s += '-';
  }
  return s; // 形如 XXXX-XXXX-XXXX
}

function genToken() {
  return crypto.randomUUID();
}

function normalizePhone(phone) {
  return String(phone || '').trim().replace(/\s+/g, '');
}

function getBearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

async function getAuth(env, token) {
  if (!token) return null;
  const raw = await env.AUTH.get(token);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

// ---- AI 批改 prompt 与解析（与前端 ai-grader.js 保持一致，保证结果结构兼容）----
function buildPrompt(text, style, rubric) {
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.standard;
  let rubricSection = '';
  let scoreFields = '';
  let scoreJson = '';
  let scoreLabels = '';

  if (rubric && rubric.trim()) {
    rubricSection = `\n## 用户自定义评分标准\n\n你必须严格按照以下评分标准来批改和评分：\n\n"""${rubric.trim()}"""\n\n**重要**：评分维度和权重必须与上述标准一致。`;
    scoreFields = '评分维度和权重必须与用户评分标准一致，按标准中定义的维度评分（0-100 或标准中指定的分数范围）。';
    scoreJson = 'scores 的维度必须与用户评分标准一致，如标准定义了 4 个维度就用 4 个维度，5 个就用 5 个，维度名称用英文 key。';
    scoreLabels = '必须与用户评分标准中的维度名称完全一致';
  } else {
    scoreFields = `语法（grammar）：0-100\n   - 词汇（vocabulary）：0-100\n   - 逻辑（logic）：0-100\n   - 总分（total）：0-100`;
    scoreJson = `"grammar": 85,\n    "vocabulary": 88,\n    "logic": 90,\n    "total": 87`;
    scoreLabels = '默认的语法/词汇/逻辑/总分四维评分';
  }

  return `你是一位经验丰富的英语老师，正在批改学生的英语作文。

${stylePrompt}
${rubricSection}

## 学生作文
"""
${text}
"""

## 批改要求

1. **找出所有错误和值得改进的地方**（语法、用词、搭配、句式、逻辑等），按出现顺序编号（1, 2, 3...）。
2. **对每个错误**：
   - 标注错误类型（如：语法错误、搭配错误、用词不当、句式问题、拼写错误 等）
   - 用中文写一段简短的批注（1-2 句话），既要指出问题，也要肯定亮点
   - 给出建议修改
3. **总评**：用中文写 80-150 字的整体评价，风格温暖鼓励，既要肯定优点也要指出不足。
4. **评分**：
   ${scoreFields}

## 重要规则

- **必须严格按以下 JSON 格式返回**，不要包含任何 JSON 之外的文字、不要用 \`\`\`json 等代码块包裹。
- **必须包含 original 字段**：标注错误对应的原文片段（从原文中精确复制，不要修改大小写或标点）。
- 如果没有错误，corrections 返回空数组。
- 中文批注要像老师手写评语一样自然有温度。
- ${scoreLabels}

## JSON 格式

{
  "corrections": [
    {
      "id": 1,
      "type": "用词不当",
      "original": "原文中错误的片段",
      "corrected": "建议修改后的版本（如果原句没问题可省略）",
      "comment": "中文批注，1-2 句话，自然有温度",
      "suggestion": "改进建议"
    }
  ],
  "overall": "整体评价，80-150 字",
  "scores": {
    ${scoreJson}
  }
}

现在请开始批改。`;
}

function parseResult(raw, rubric) {
  if (!raw) throw new Error('AI 返回为空');
  let jsonStr = String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const m = jsonStr.match(/\{[\s\S]*\}/);
  if (m) jsonStr = m[0];
  let data;
  try { data = JSON.parse(jsonStr); }
  catch (e) { throw new Error('AI 返回格式错误，请重试'); }

  const scores = data.scores || {};
  const defaultScores = {
    grammar: scores.grammar ?? 0,
    vocabulary: scores.vocabulary ?? 0,
    logic: scores.logic ?? 0,
    total: scores.total ?? 0,
  };
  const finalScores = (rubric && rubric.trim()) ? { ...scores } : defaultScores;

  return {
    corrections: (data.corrections || []).map((c, i) => ({
      id: c.id || i + 1,
      type: c.type || '其他',
      typeTag: c.type || '其他',
      original: c.original || '',
      corrected: c.corrected || '',
      comment: c.comment || '',
      suggestion: c.suggestion || '',
      start: 0,
      end: 0,
    })),
    overall: data.overall || '（暂无总评）',
    scores: finalScores,
  };
}

async function callAI(env, text, style, rubric) {
  const providerId = (env.AI_PROVIDER || 'qwen').trim().toLowerCase();
  const provider = PROVIDERS[providerId] || PROVIDERS.custom;
  const apiKey = (env.AI_KEY || '').trim();
  if (!apiKey) throw new Error('后端未配置 AI Key（请管理员在 Worker 设置里填写 AI_KEY）');

  const baseUrl = (env.AI_BASE_URL || provider.baseUrl || '').trim().replace(/\/+$/, '');
  const model = (env.AI_MODEL || provider.model || '').trim();
  if (!baseUrl) throw new Error('后端未配置 AI Base URL');
  if (!model) throw new Error('后端未配置 AI 模型');

  const prompt = buildPrompt(text, style || 'standard', rubric || '');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '你是一位经验丰富的英语老师，擅长批改学生作文，评语温暖有建设性。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try { const j = await response.json(); msg = j.error?.message || msg; } catch (e) {}
    throw new Error('AI 调用失败：' + msg);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return parseResult(content, rubric);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    // CORS 预检
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
      });
    }

    try {
      // ---- 公开：用户登录 ----
      if (path === '/api/login' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const phone = normalizePhone(body.phone);
        if (!phone || phone.length < 3 || phone.length > 40) {
          return err('请输入有效的手机号或账号');
        }
        const token = genToken();
        await env.AUTH.put(token, JSON.stringify({ type: 'user', phone, createdAt: Date.now() }));
        const expiresAt = parseInt(await env.USERS.get(phone) || '0', 10) || 0;
        const active = expiresAt > Date.now();
        return json({ token, active, expiresAt, phone });
      }

      // ---- 公开：查会员状态 ----
      if (path === '/api/status' && method === 'GET') {
        const auth = await getAuth(env, getBearerToken(request));
        if (!auth || auth.type !== 'user') return err('未登录', 401);
        const expiresAt = parseInt(await env.USERS.get(auth.phone) || '0', 10) || 0;
        return json({ active: expiresAt > Date.now(), expiresAt, phone: auth.phone });
      }

      // ---- 公开：激活会员 ----
      if (path === '/api/activate' && method === 'POST') {
        const auth = await getAuth(env, getBearerToken(request));
        if (!auth || auth.type !== 'user') return err('未登录', 401);
        const body = await request.json().catch(() => ({}));
        const code = String(body.code || '').trim().toUpperCase();
        if (!code) return err('请输入激活码');
        const raw = await env.CODES.get(code);
        if (!raw) return err('激活码无效');
        const c = JSON.parse(raw);
        if (c.used) return err('该激活码已被使用');
        const days = parseInt(c.days, 10) || 30;
        // 若当前会员未过期，则在原到期时间上顺延；否则从今天起算
        const now = Date.now();
        const cur = parseInt(await env.USERS.get(auth.phone) || '0', 10) || 0;
        const base = cur > now ? cur : now;
        const expiresAt = base + days * 86400000;
        await env.USERS.put(auth.phone, String(expiresAt));
        await env.CODES.put(code, JSON.stringify({ ...c, used: true, usedBy: auth.phone, usedAt: now }));
        return json({ ok: true, active: true, expiresAt, days });
      }

      // ---- 核心：AI 批改（会员校验 + 后端代理）----
      if (path === '/api/grade' && method === 'POST') {
        const auth = await getAuth(env, getBearerToken(request));
        if (!auth || auth.type !== 'user') return err('未登录', 401);
        const expiresAt = parseInt(await env.USERS.get(auth.phone) || '0', 10) || 0;
        if (expiresAt <= Date.now()) {
          return err('会员已到期，请续费后使用', 402);
        }
        const body = await request.json().catch(() => ({}));
        const text = String(body.text || '').trim();
        if (!text) return err('作文内容为空');
        const result = await callAI(env, text, body.style, body.rubric);
        return json(result);
      }

      // ---- 管理：登录 ----
      if (path === '/api/admin/login' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const pwd = String(body.password || '');
        if (!env.ADMIN_PASSWORD || pwd !== env.ADMIN_PASSWORD) {
          return err('密码错误', 401);
        }
        const token = 'adm_' + genToken();
        await env.AUTH.put(token, JSON.stringify({ type: 'admin', createdAt: Date.now() }));
        return json({ token });
      }

      // ---- 管理：生成激活码 ----
      if (path === '/api/admin/gencode' && method === 'POST') {
        const auth = await getAuth(env, getBearerToken(request));
        if (!auth || auth.type !== 'admin') return err('需要管理员权限', 401);
        const body = await request.json().catch(() => ({}));
        const days = parseInt(body.days, 10) || 30;
        const count = Math.min(100, Math.max(1, parseInt(body.count, 10) || 1));
        const codes = [];
        for (let i = 0; i < count; i++) {
          const code = genCode();
          await env.CODES.put(code, JSON.stringify({ days, used: false, createdAt: Date.now() }));
          codes.push(code);
        }
        return json({ codes, days });
      }

      // ---- 管理：查用户 ----
      if (path === '/api/admin/users' && method === 'GET') {
        const auth = await getAuth(env, getBearerToken(request));
        if (!auth || auth.type !== 'admin') return err('需要管理员权限', 401);
        const list = await env.USERS.list();
        const users = [];
        for (const k of list.keys) {
          const v = parseInt(await env.USERS.get(k.name), 10) || 0;
          users.push({ phone: k.name, expiresAt: v, active: v > Date.now() });
        }
        users.sort((a, b) => b.expiresAt - a.expiresAt);
        return json({ users });
      }

      // ---- 管理：查激活码 ----
      if (path === '/api/admin/codes' && method === 'GET') {
        const auth = await getAuth(env, getBearerToken(request));
        if (!auth || auth.type !== 'admin') return err('需要管理员权限', 401);
        const list = await env.CODES.list();
        const codes = [];
        for (const k of list.keys) {
          const v = JSON.parse(await env.CODES.get(k.name) || '{}');
          codes.push({ code: k.name, days: v.days, used: !!v.used, usedBy: v.usedBy || '', usedAt: v.usedAt || 0, createdAt: v.createdAt || 0 });
        }
        codes.sort((a, b) => b.createdAt - a.createdAt);
        return json({ codes });
      }

      return err('接口不存在', 404);
    } catch (e) {
      return err(e.message || '服务器错误', 500);
    }
  },
};
