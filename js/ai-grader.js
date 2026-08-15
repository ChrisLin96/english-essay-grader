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
      visionModel: 'gemini-1.5-flash',
      models: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-2.0-pro'],
      keyUrl: 'https://aistudio.google.com/app/apikey',
      keyPrefix: '',
      free: true,
      note: '免费层：每天 1500 次请求。Gemini 全系列均支持图片识别（看图识字）。',
    },
    deepseek: {
      name: 'DeepSeek 深度求索',
      type: 'openai',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      visionModel: 'deepseek-v4-flash',
      models: ['deepseek-v4-flash', 'deepseek-v4-pro'],
      keyUrl: 'https://platform.deepseek.com/api_keys',
      keyPrefix: 'sk-',
      free: false,
      vision: false,  // ⚠️ DeepSeek 的 API 是纯文本，不支持图片识别（官方无视觉模型）
      note: '性价比极高，文本批改能力强。但其 API 仅支持文字、不支持图片识别——「AI 看图识字」会自动回退本地 OCR。若想用 AI 看图，请在设置里把服务商换成通义千问等支持视觉的。base_url 为 https://api.deepseek.com（不带 /v1）。',
    },
    qwen: {
      name: '通义千问（阿里云）',
      type: 'openai',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-vl-max',
      visionModel: 'qwen-vl-max',
      models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-vl-max', 'qwen2.5-vl-72b-instruct'],
      keyUrl: 'https://dashscope.console.aliyun.com/apiKey',
      keyPrefix: 'sk-',
      free: false,
      tts: true,
      ttsStyle: 'dashscope',            // 走 DashScope 专属 CosyVoice / Qwen-Audio-TTS 接口，非 OpenAI 格式
      ttsModel: 'qwen-audio-3.0-tts-flash',
      ttsVoice: 'longanhuan_v3.6',
      note: '国内稳定，免费额度较多。默认使用 qwen-vl-max（支持图片识别），并支持 AI 语音合成（CosyVoice / Qwen-Audio-TTS，听写默认即用自然语音）。',
    },
    moonshot: {
      name: 'Moonshot 月之暗面（Kimi）',
      type: 'openai',
      baseUrl: 'https://api.moonshot.cn/v1',
      model: 'moonshot-v1-8k-vision-preview',
      visionModel: 'moonshot-v1-8k-vision-preview',
      models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
      keyUrl: 'https://platform.moonshot.cn/console/api-keys',
      keyPrefix: 'sk-',
      free: false,
      note: '默认使用 moonshot-v1-8k-vision-preview（支持图片识别）。',
    },
    chatglm: {
      name: 'ChatGLM 智谱清言',
      type: 'openai',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4v-plus',
      visionModel: 'glm-4v-plus',
      models: ['glm-4-flash', 'glm-4-plus', 'glm-4v-plus'],
      keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
      keyPrefix: '',
      free: false,
      note: '默认使用 glm-4v-plus（支持图片识别）。',
    },
    yi: {
      name: '零一万物 Yi',
      type: 'openai',
      baseUrl: 'https://api.lingyiwanwu.com/v1',
      model: 'yi-vision',
      visionModel: 'yi-vision',
      models: ['yi-lightning', 'yi-medium'],
      keyUrl: 'https://platform.lingyiwanwu.com/apikeys',
      keyPrefix: '',
      free: false,
      note: '默认使用 yi-vision（支持图片识别）。',
    },
    baichuan: {
      name: '百川智能',
      type: 'openai',
      baseUrl: 'https://api.baichuan-ai.com/v1',
      model: 'Baichuan4-Vision',
      visionModel: 'Baichuan4-Vision',
      models: ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan4-Turbo'],
      keyUrl: 'https://platform.baichuan-ai.com/console/apikey',
      keyPrefix: 'sk-',
      free: false,
      note: '默认使用 Baichuan4-Vision（支持图片识别）。',
    },
    minimax: {
      name: 'MiniMax 海螺 AI',
      type: 'openai',
      baseUrl: 'https://api.minimax.chat/v1',
      model: 'MiniMax-VL-01',
      visionModel: 'MiniMax-VL-01',
      models: ['MiniMax-Text-01', 'MiniMax-VL-01'],
      keyUrl: 'https://platform.minimaxi.com/user-center/api-keys',
      keyPrefix: '',
      free: false,
      note: '默认使用 MiniMax-VL-01（支持图片识别）。',
    },
    siliconflow: {
      name: '硅基流动 SiliconFlow',
      type: 'openai',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'Qwen/Qwen2.5-VL-72B-Instruct',
      visionModel: 'Qwen/Qwen2.5-VL-72B-Instruct',
      keyUrl: 'https://cloud.siliconflow.cn/account/ak',
      keyPrefix: 'sk-',
      free: false,
      note: '聚合多模型平台，默认使用 Qwen2.5-VL-72B-Instruct（支持图片识别）。',
    },
    openai: {
      name: 'OpenAI',
      type: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      visionModel: 'gpt-4o-mini',
      models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o1-mini', 'o3-mini'],
      keyUrl: 'https://platform.openai.com/api-keys',
      keyPrefix: 'sk-',
      free: false,
      tts: true,
      ttsStyle: 'openai',
      ttsModel: 'tts-1',
      ttsVoice: 'alloy',
      note: '效果最好但成本较高。默认使用 gpt-4o-mini（支持图片识别），并支持 AI 语音合成（TTS）。',
    },
    custom: {
      name: '自定义',
      type: 'openai',
      baseUrl: '',
      model: 'gpt-4o-mini',
      visionModel: 'gpt-4o-mini',
      keyUrl: '',
      keyPrefix: '',
      free: false,
      tts: true,
      ttsStyle: 'openai',
      ttsModel: 'tts-1',
      ttsVoice: 'alloy',
      note: '填写 OpenAI 兼容协议的 Base URL；默认使用 gpt-4o-mini（支持图片识别），可在 ai-grader.js 调整。若网关代理了 /v1/audio/speech 即可用于 AI 朗读。',
    },
  };

  /**
   * 获取预设服务商配置
   */
  function getProviderConfig(providerId) {
    const base = PROVIDERS[providerId] || PROVIDERS.custom;
    const cfg = window.APP_CONFIG || {};
    const overrides = cfg.baseUrlOverrides || {};
    const ov = overrides[providerId];
    if (ov && String(ov).trim() && ov !== 'PASTE_YOUR_PROXY_URL_HERE') {
      return { ...base, baseUrl: ov.trim().replace(/\/+$/, '') };
    }
    return base;
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
  // 解析最终生效的设置：模型默认使用支持图片识别的视觉模型；API Key 必须来自用户设置
  function resolveSettings(settings) {
    const providerConfig = getProviderConfig(settings.provider);
    // 默认使用支持图片识别的模型；用户/旧设置若已指定则尊重之
    const model = (settings.model || '').trim() || providerConfig.visionModel || providerConfig.model;
    return { ...settings, model };
  }

  async function grade(text, settings) {
    if (!text || !text.trim()) {
      throw new Error('作文内容为空');
    }
    const resolved = resolveSettings(settings);
    if (!resolved.apiKey) {
      throw new Error('未配置 API Key：请先在「设置」中填写你自己的 Key');
    }

    // 用预设配置补全 baseUrl 和 model
    const providerConfig = getProviderConfig(resolved.provider);
    const mergedSettings = {
      ...resolved,
      provider: providerConfig.type,
      baseUrl: resolved.baseUrl || providerConfig.baseUrl,
      model: resolved.model || providerConfig.model,
    };

    const prompt = buildPrompt(text, resolved.style || 'standard', resolved.rubric || '');
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
   * 多模态大模型识别图片中的文字（替代/增强 Tesseract OCR）
   * 优先用 Gemini / 支持视觉的 OpenAI 兼容模型直接"看图识字"，
   * 识别质量（尤其手写体、拍照、歪斜图）远胜本地 Tesseract。
   * @param {string} dataUrl - 图片 dataURL（含 base64）
   * @param {Object} settings - { provider, apiKey, baseUrl, model }
   * @returns {Promise<string>} 识别出的文本
   */
  async function recognizeImage(dataUrl, settings) {
    const resolved = resolveSettings(settings);
    if (!resolved.apiKey) {
      throw new Error('未配置 API Key：请先在「设置」中填写你自己的 Key');
    }
    const providerConfig = getProviderConfig(resolved.provider);
    // 纯文本服务商（如 DeepSeek）的 API 看不到图片，明确报错，由上层回退本地 OCR 并提示。
    if (providerConfig.vision === false) {
      throw new Error(`所选服务商「${providerConfig.name}」的 API 仅支持文字、不支持图片识别。请改用通义千问、智谱、硅基流动、Gemini 等支持视觉的服务商，或继续使用本地 OCR 兜底。`);
    }
    const merged = {
      ...resolved,
      provider: providerConfig.type,
      providerId: resolved.provider,   // 保留原始服务商 id（用于判断是否为 DeepSeek 等）
      baseUrl: resolved.baseUrl || providerConfig.baseUrl,
      // 看图识字强制使用服务商自带的视觉模型（如 qwen-vl-max），不依赖 user 为批改选的纯文本模型
      model: providerConfig.visionModel || providerConfig.model,
    };
    const mime = (dataUrl.match(/^data:([^;]+);base64,/) || [])[1] || 'image/jpeg';
    const b64 = dataUrl.split(',')[1] || '';

    const prompt = '请识别这张图片中的英文文本。要求：\n' +
      '1. 逐字照抄原文，保留大小写、标点、换行与段落结构；\n' +
      '2. 不要翻译、不要改写、不要纠正拼写或语法错误、不要添加任何解释；\n' +
      '3. 如果是手写体，请尽力辨认每个字母，不确定的字符用「?」标注，不要臆测；\n' +
      '4. 仅输出图片里实际出现的文字内容，不要输出任何额外说明。';

    if (merged.provider === 'gemini') {
      return await callGeminiVision(prompt, merged, mime, b64);
    }
    // OpenAI 兼容：直接尝试图片识别。支持视觉的模型（GPT-4o、DeepSeek V4、
    // 通义 VL、智谱 GLM-4V 等）会正常返回；纯文本模型会报错，由上层回退本地 Tesseract。
    return await callOpenAICompatibleVision(prompt, merged, dataUrl);
  }

  /**
   * 多模态大模型识别图片中的「单词 / 句子」，专为单词听写设计。
   * 与 recognizeImage（返回整段文本）不同：这里要求 AI 把每个单词/句子单独成行输出，
   * 方便直接作为听写条目（每行一条）。支持中英文，自动按图片顺序编号输出。
   * @param {string} dataUrl - 图片 dataURL（含 base64）
   * @param {Object} settings - { provider, apiKey, baseUrl }
   * @returns {Promise<string>} 每行一个单词/句子的多行文本
   */
  async function recognizeDictationItems(dataUrl, settings) {
    const resolved = resolveSettings(settings);
    if (!resolved.apiKey) {
      throw new Error('未配置 API Key：请先在「设置」中填写你自己的 Key');
    }
    const providerConfig = getProviderConfig(resolved.provider);
    // 纯文本服务商（如 DeepSeek）的 API 看不到图片，明确报错，由上层回退本地 OCR。
    if (providerConfig.vision === false) {
      throw new Error(`所选服务商「${providerConfig.name}」的 API 仅支持文字、不支持图片识别。请改用通义千问、智谱、硅基流动、Gemini 等支持视觉的服务商，或继续使用本地 OCR 兜底。`);
    }
    const merged = {
      ...resolved,
      provider: providerConfig.type,
      providerId: resolved.provider,
      baseUrl: resolved.baseUrl || providerConfig.baseUrl,
      model: providerConfig.visionModel || providerConfig.model,
    };
    const mime = (dataUrl.match(/^data:([^;]+);base64,/) || [])[1] || 'image/jpeg';
    const b64 = dataUrl.split(',')[1] || '';

    const prompt = '请识别这张图片中的单词或句子，用于制作「单词听写」词表。要求：\n' +
      '1. 支持中文和英文：中文按词语或短句识别，英文按单词或句子识别；\n' +
      '2. 每个单词或句子【单独占一行】，按图片中出现的先后顺序逐行输出；\n' +
      '3. 不要加序号、不要加编号、不要加任何解释或标点修饰；\n' +
      '4. 若一行内有多个由标点或换行分隔的独立词，请拆成独立行；但保持固定搭配/短语完整（如 "in front of" 不要拆开）；\n' +
      '5. 仅输出这些行，其它内容一律不要。';

    if (merged.provider === 'gemini') {
      return await callGeminiVision(prompt, merged, mime, b64);
    }
    return await callOpenAICompatibleVision(prompt, merged, dataUrl);
  }

  async function callGeminiVision(prompt, settings, mime, b64) {
    const model = settings.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mime, data: b64 } },
          ],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
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
      throw new Error('Gemini 识别失败：' + msg);
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  }

  async function callOpenAICompatibleVision(prompt, settings, dataUrl) {
    const baseUrl = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = settings.model || 'gpt-4o-mini';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    // 组装请求体。thinking 参数只发给 DeepSeek：V4 默认开启思考模式，看图识字无需推理，
    // 关闭后答案落在 content；其他 OpenAI 兼容服务商（如 OpenAI 官方）不认识该字段可能报错。
    const body = {
      model,
      messages: [
        { role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUrl } },
        ] },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    };
    if (settings.providerId === 'deepseek') {
      body.thinking = { type: 'disabled' };
    }
    let response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      if (e && e.name === 'AbortError') {
        throw new Error('请求超时（60 秒无响应）：可能是网络慢或图片过大，请换更小/更清晰的图片重试');
      }
      // 网络层失败：最常见是浏览器跨域(CORS)被拦，或网络不可达
      throw new Error('网络请求失败（可能被跨域/CORS 拦截或网络不可达）：' + (e.message || e));
    }
    clearTimeout(timer);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || `HTTP ${response.status}`;
      throw new Error('API 识别失败：' + msg);
    }
    const data = await response.json();
    const msg = data.choices?.[0]?.message || {};
    const content = (msg.content || '').trim();
    const reasoning = (msg.reasoning_content || '').trim();
    // 兼容两种返回：常规 content，或思考模式下的 reasoning_content；
    // 两者皆空说明模型确实没返回文字（如模型不支持看图、或返回异常），明确抛出便于排查，避免静默回退。
    if (!content && !reasoning) {
      const preview = JSON.stringify(data).slice(0, 600);
      throw new Error('API 返回了空内容，原始响应：' + preview);
    }
    return content || reasoning;
  }

  /**
   * 判断当前服务商是否支持 AI 语音合成（TTS）。
   * 仅显式声明 tts:true 的服务商可用（如 OpenAI、自定义网关、通义千问）。
   * @param {string} providerId
   * @returns {boolean}
   */
  function supportsTTS(providerId) {
    const cfg = getProviderConfig(providerId);
    return !!(cfg && cfg.tts);
  }

  /**
   * AI 语音合成（TTS）：根据服务商走不同接口，把文字转成语音音频，
   * 返回可直接给 <audio> 播放的 dataURL（或 DashScope 返回的临时音频 URL）。
   * - ttsStyle==='openai'：OpenAI 兼容 /v1/audio/speech（OpenAI、自定义网关）
   * - ttsStyle==='dashscope'：通义千问 DashScope SpeechSynthesizer（CosyVoice / Qwen-Audio-TTS）
   * 不支持的服务商由上层回退浏览器朗读。
   * @param {string} text - 要朗读的文字（中英文均可）
   * @param {Object} settings - { provider, apiKey, baseUrl?, speed? }
   * @returns {Promise<string>} 音频 dataURL 或 URL
   */
  async function textToSpeech(text, settings) {
    if (!text || !text.trim()) throw new Error('待朗读文本为空');
    const providerConfig = getProviderConfig(settings.provider);
    if (!providerConfig.tts) {
      throw new Error(`所选服务商「${providerConfig.name}」暂不支持 AI 语音合成。请改用浏览器朗读，或换成支持 TTS 的服务商。`);
    }
    const apiKey = (settings.apiKey || '').trim();
    if (!apiKey) throw new Error('未配置 API Key：请先在「设置」中填写你自己的 Key');
    if (providerConfig.ttsStyle === 'dashscope') {
      return await dashscopeTTS(text, settings, providerConfig);
    }
    // 默认：OpenAI 兼容 /v1/audio/speech
    const baseUrl = (settings.baseUrl || providerConfig.baseUrl).replace(/\/$/, '');
    const url = `${baseUrl}/audio/speech`;
    const body = {
      model: providerConfig.ttsModel || 'tts-1',
      voice: providerConfig.ttsVoice || 'alloy',
      input: text,
      response_format: 'mp3',
    };
    if (settings.speed && !isNaN(settings.speed)) {
      body.speed = Math.max(0.25, Math.min(4.0, settings.speed));
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        msg = j.error?.message || msg;
      } catch (e) { /* ignore */ }
      throw new Error('AI 语音合成失败：' + msg);
    }
    const blob = await res.blob();
    return await blobToDataURL(blob);
  }

  /**
   * 通义千问 DashScope 语音合成（CosyVoice / Qwen-Audio-TTS）。
   * 接口：POST https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer
   * 返回音频可能为 base64（audio.data）或临时链接（audio.url），二者都兼容。
   */
  async function dashscopeTTS(text, settings, cfg) {
    const apiKey = (settings.apiKey || '').trim();
    if (!apiKey) throw new Error('未配置 API Key');
    const url = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer';
    const body = {
      model: cfg.ttsModel || 'qwen-audio-3.0-tts-flash',
      input: {
        text,
        voice: cfg.ttsVoice || 'longanhuan_v3.6',
        format: 'mp3',
        sample_rate: 24000,
      },
    };
    if (settings.speed && !isNaN(settings.speed)) {
      body.input.rate = Math.max(0.5, Math.min(2.0, settings.speed));
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        msg = j.message || j.code || JSON.stringify(j);
      } catch (e) { /* ignore */ }
      throw new Error('通义语音合成失败：' + msg);
    }
    const data = await res.json();
    const audio = data.output && data.output.audio;
    if (!audio) throw new Error('通义语音合成返回异常：' + JSON.stringify(data).slice(0, 300));
    // 优先用内联 base64；否则用临时链接（尝试转 dataURL 以便缓存，跨域失败则直接用链接播放）
    if (audio.data && audio.data.length) {
      return 'data:audio/mp3;base64,' + audio.data;
    }
    if (audio.url) {
      try {
        const blob = await fetch(audio.url).then(r => r.blob());
        return await blobToDataURL(blob);
      } catch (e) {
        return audio.url;
      }
    }
    throw new Error('通义语音合成未返回音频数据');
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('音频读取失败'));
      reader.readAsDataURL(blob);
    });
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
    const resolved = resolveSettings(settings);
    if (!resolved.apiKey) {
      throw new Error('请先填写 API Key');
    }
    const providerConfig = getProviderConfig(resolved.provider);
    const mergedSettings = {
      ...resolved,
      provider: providerConfig.type,
      baseUrl: resolved.baseUrl || providerConfig.baseUrl,
      model: resolved.model || providerConfig.model,
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

  return { grade, testConnection, getProviderConfig, getProviders, recognizeImage, recognizeDictationItems, supportsTTS, textToSpeech };
})();

window.AIGrader = AIGrader;
