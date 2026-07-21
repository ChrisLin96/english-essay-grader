/**
 * AI 批改模块
 * 支持 Google Gemini / DeepSeek / 通义千问 / Moonshot / ChatGLM / 零一万物 / 百川 / MiniMax / 硅基流动 / OpenAI / 自定义
 *
 * 提示词设计：让 AI 返回结构化 JSON，包含：
 * - corrections: 错误列表（位置、类型、中文批注、建议）
 * - overall: 总评
 * - scores: 评分
 */
const AIGrader = (() => {
  // 预设服务商配置表
  const PROVIDERS = {
    gemini: {
      name: 'Google Gemini',
      type: 'gemini',
      baseUrl: '',
      model: 'gemini-1.5-flash',
      keyUrl: 'https://aistudio.google.com/app/apikey',
      keyPrefix: '',
      free: true,
      note: '免费层：每天 1500 次请求',
    },
    deepseek: {
      name: 'DeepSeek 深度求索',
      type: 'openai',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      keyUrl: 'https://platform.deepseek.com/api_keys',
      keyPrefix: 'sk-',
      free: false,
      note: '性价比极高，约 1 元/百万 token',
    },
    qwen: {
      name: '通义千问（阿里云）',
      type: 'openai',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-turbo',
      keyUrl: 'https://dashscope.console.aliyun.com/apiKey',
      keyPrefix: 'sk-',
      free: false,
      note: '国内稳定，免费额度较多',
    },
    moonshot: {
      name: 'Moonshot 月之暗面（Kimi）',
      type: 'openai',
      baseUrl: 'https://api.moonshot.cn/v1',
      model: 'moonshot-v1-8k',
      keyUrl: 'https://platform.moonshot.cn/console/api-keys',
      keyPrefix: 'sk-',
      free: false,
      note: '长文本能力强',
    },
    chatglm: {
      name: 'ChatGLM 智谱清言',
      type: 'openai',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4-flash',
      keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
      keyPrefix: '',
      free: false,
      note: 'glm-4-flash 免费可用',
    },
    yi: {
      name: '零一万物 Yi',
      type: 'openai',
      baseUrl: 'https://api.lingyiwanwu.com/v1',
      model: 'yi-lightning',
      keyUrl: 'https://platform.lingyiwanwu.com/apikeys',
      keyPrefix: '',
      free: false,
      note: 'yi-lightning 免费额度',
    },
    baichuan: {
      name: '百川智能',
      type: 'openai',
      baseUrl: 'https://api.baichuan-ai.com/v1',
      model: 'Baichuan4',
      keyUrl: 'https://platform.baichuan-ai.com/console/apikey',
      keyPrefix: 'sk-',
      free: false,
      note: '中文理解优秀',
    },
    minimax: {
      name: 'MiniMax 海螺 AI',
      type: 'openai',
      baseUrl: 'https://api.minimax.chat/v1',
      model: 'MiniMax-Text-01',
      keyUrl: 'https://platform.minimaxi.com/user-center/api-keys',
      keyPrefix: '',
      free: false,
      note: '语音和文本双模态',
    },
    siliconflow: {
      name: '硅基流动 SiliconFlow',
      type: 'openai',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'deepseek-ai/DeepSeek-V3',
      keyUrl: 'https://cloud.siliconflow.cn/account/ak',
      keyPrefix: 'sk-',
      free: false,
      note: '聚合多模型平台，部分免费',
    },
    openai: {
      name: 'OpenAI',
      type: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      keyUrl: 'https://platform.openai.com/api-keys',
      keyPrefix: 'sk-',
      free: false,
      note: '效果最好但成本较高',
    },
    custom: {
      name: '自定义',
      type: 'openai',
      baseUrl: '',
      model: '',
      keyUrl: '',
      keyPrefix: '',
      free: false,
      note: '填写 OpenAI 兼容协议的 Base URL',
    },
  };

  /**
   * 获取预设服务商配置
   */
  function getProviderConfig(providerId) {
    return PROVIDERS[providerId] || PROVIDERS.custom;
  }

  /**
   * 获取所有预设服务商列表
   */
  function getProviders() {
    return PROVIDERS;
  }
  // 批改风格对应的提示词
  const STYLE_PROMPTS = {
    standard: '请像一位严谨的英语老师一样批改，指出语法、用词、搭配、逻辑等问题，并给出中肯的改进建议。',
    concise: '请只标注最关键的 3-5 个错误，简洁明了，重点突出。',
    encouraging: '请以鼓励为主，多肯定学生的优点，错误用温和的方式指出，适合初学者。',
    advanced: '请从高级表达、学术写作角度批改，提出向母语者水平提升的建议。',
  };

  /**
   * 调用 AI 批改
   * @param {string} text - 待批改的英文文本
   * @param {Object} settings - { provider, apiKey, baseUrl, model, style, rubric }
   * @returns {Promise<Object>} 批改结果
   */
  async function grade(text, settings) {
    if (!text || !text.trim()) {
      throw new Error('作文内容为空');
    }
    if (!settings.apiKey) {
      throw new Error('请先在设置中配置 API Key');
    }

    // 用预设配置补全 baseUrl 和 model
    const providerConfig = getProviderConfig(settings.provider);
    const mergedSettings = {
      ...settings,
      provider: providerConfig.type,
      baseUrl: settings.baseUrl || providerConfig.baseUrl,
      model: settings.model || providerConfig.model,
    };

    const prompt = buildPrompt(text, settings.style || 'standard', settings.rubric || '');
    let result;

    if (mergedSettings.provider === 'gemini') {
      result = await callGemini(prompt, mergedSettings);
    } else {
      result = await callOpenAICompatible(prompt, mergedSettings);
    }

    return parseResult(result, settings.rubric);
  }

  /**
   * 构造批改 prompt
   * @param {string} text - 学生作文
   * @param {string} style - 批改风格
   * @param {string} rubric - 用户自定义评分标准（可选）
   */
  function buildPrompt(text, style, rubric) {
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.standard;

    // 评分标准部分
    let rubricSection = '';
    let scoreFields = '';
    let scoreJson = '';
    let scoreLabels = '';

    if (rubric && rubric.trim()) {
      // 有自定义评分标准时，让 AI 按用户的标准来评分
      rubricSection = `\n## 用户自定义评分标准\n\n你必须严格按照以下评分标准来批改和评分：\n\n"""${rubric.trim()}"""\n\n**重要**：评分维度和权重必须与上述标准一致。`;
      scoreFields = '评分维度和权重必须与用户评分标准一致，按标准中定义的维度评分（0-100 或标准中指定的分数范围）。';
      scoreJson = 'scores 的维度必须与用户评分标准一致，如标准定义了 4 个维度就用 4 个维度，5 个就用 5 个，维度名称用英文 key。';
      scoreLabels = '必须与用户评分标准中的维度名称完全一致';
    } else {
      // 默认评分标准
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

  /**
   * 调用 Google Gemini API
   */
  async function callGemini(prompt, settings) {
    const model = settings.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || `HTTP ${response.status}`;
      throw new Error('Gemini API 错误：' + msg);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * 调用 OpenAI 兼容 API
   */
  async function callOpenAICompatible(prompt, settings) {
    const baseUrl = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = settings.model || 'gpt-4o-mini';
    const url = `${baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: '你是一位经验丰富的英语老师，擅长批改学生作文，评语温暖有建设性。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || `HTTP ${response.status}`;
      throw new Error('API 错误：' + msg);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * 解析 AI 返回的结果
   * 处理可能的 markdown 代码块包裹
   * @param {string} raw - AI 返回的原始文本
   * @param {string} rubric - 用户自定义评分标准（用于决定评分维度）
   */
  function parseResult(raw, rubric) {
    if (!raw) throw new Error('AI 返回为空');

    // 尝试提取 JSON
    let jsonStr = raw.trim();

    // 去掉 ```json ... ``` 包裹
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');

    // 如果还是找不到 { ... }，尝试提取
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON 解析失败:', raw);
      throw new Error('AI 返回格式错误，请重试或更换模型');
    }

    // 动态处理 scores：如果用户有自定义评分标准，scores 维度可能不同
    const scores = data.scores || {};

    // 如果有自定义评分标准但 scores 仍是默认四维，尝试兼容
    // 否则保留 AI 返回的任意维度
    const defaultScores = {
      grammar: scores.grammar ?? 0,
      vocabulary: scores.vocabulary ?? 0,
      logic: scores.logic ?? 0,
      total: scores.total ?? 0,
    };

    // 如果有自定义评分标准，使用 AI 返回的全部维度（动态）
    const finalScores = rubric && rubric.trim() ? { ...scores } : defaultScores;

    // 数据校验与补全
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

  /**
   * 测试 API 连接
   */
  async function testConnection(settings) {
    if (!settings.apiKey) {
      throw new Error('请先填写 API Key');
    }
    const providerConfig = getProviderConfig(settings.provider);
    const mergedSettings = {
      ...settings,
      provider: providerConfig.type,
      baseUrl: settings.baseUrl || providerConfig.baseUrl,
      model: settings.model || providerConfig.model,
    };
    const testPrompt = '请用 JSON 格式回复：{"ok": true}';
    let result;
    if (mergedSettings.provider === 'gemini') {
      result = await callGemini(testPrompt, mergedSettings);
    } else {
      result = await callOpenAICompatible(testPrompt, mergedSettings);
    }
    return { success: true, sample: result.slice(0, 100) };
  }

  return { grade, testConnection, getProviderConfig, getProviders };
})();

window.AIGrader = AIGrader;
