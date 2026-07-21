/**
 * 主应用入口
 */
(function() {
  'use strict';

  // ===========================
  // 评分标准模板
  // ===========================
  const RUBRIC_TEMPLATES = {
    'middle-school': `语法（30分）：句子结构基本正确，无明显语法错误（主谓一致、时态、冠词等）
词汇（25分）：用词基本准确，能表达意思，避免严重用词错误
逻辑（25分）：内容连贯，有一定论证，段落过渡自然
格式（20分）：字数≥80词，段落分明，书写规范`,
    'high-school': `语法（30分）：句子结构多样且正确，无语法错误（时态、语态、虚拟语气、从句等）
词汇（25分）：词汇丰富准确，有高级词汇运用，避免重复和低级词汇
逻辑（20分）：论证有力，逻辑严密，论据充分，段落过渡流畅
表达（15分）：有亮点句型，句式多样，过渡词运用得当
格式（10分）：字数≥120词，3段以上结构，书写规范`,
    'college': `语法（25分）：语法精准无误，句式复杂多样，体现大学水平
词汇（25分）：用词精确地道，学术词汇运用恰当，表达准确有力
逻辑（20分）：论证深入有层次，论据充分，批判性思维体现
连贯（15分）：衔接手段丰富，段落逻辑衔接自然，行文流畅
创新（15分）：观点有独创性，表达有个人风格，超越模板化写作`,
    'ielts': `Task Achievement（25分）：任务完成度，观点清晰，回应题目所有要求
Coherence & Cohesion（25分）：连贯与衔接，段落结构合理，逻辑连接词使用恰当
Lexical Resource（25分）：词汇资源，词汇丰富准确，搭配地道，有学术词汇
Grammatical Range（25分）：语法范围与准确性，句式多样，语法无错误

评分标准：每项0-9分，总分取平均分（0-9分制）
重点：雅思写作强调逻辑论证和学术表达`,
    'toefl': `独立写作评分标准（0-5分制）：

Development（30分）：论点发展充分，有具体例证和细节支撑
Organization（25分）：结构清晰，段落分明，过渡自然
Language Use（25分）：语言使用准确，句式多样，表达自然流畅
Coherence（20分）：论证连贯，逻辑严密，观点前后一致

重点：托福写作强调逻辑清晰和例证充分，语言流畅度`,
    'ket': `剑桥 KET（Key English Test）写作评分标准：

Content（30分）：内容完整，回应题目所有要求，信息传达清晰
Communicative Achievement（30分）：沟通效果，读者能理解写作意图，语言功能使用恰当
Organization（20分）：组织结构，段落分明，衔接手段基本正确，逻辑连贯
Language（20分）：语言质量，基础语法基本正确（简单句为主），常用词汇使用恰当，拼写标点基本无误

字数要求：25-35词（Part 7短消息）或35-45词（Part 8故事续写）
重点：KET 注重基本沟通能力，不要求复杂句式和高级词汇，简单句表达清楚即可`,
    'pet': `剑桥 PET（B1 Preliminary）写作评分标准：

Content（25分）：内容完整充分，回应题目所有要点，观点明确有细节支撑
Communicative Achievement（25分）：沟通效果，表达清晰有条理，读者容易理解，语言功能使用得当（如建议、描述、观点表达）
Organization（25分）：组织结构，段落结构合理，衔接手段使用恰当（however, although等），逻辑连贯流畅
Language（25分）：语言质量，语法基本正确（允许少量错误不影响理解），词汇丰富度提升，句式有变化（简单句+并列句+少量复合句），拼写标点基本正确

字数要求：100词左右
重点：PET 要求能写出连贯的短文，有观点和论据，句式开始多样化`,
    'fce': `剑桥 FCE（B2 First）写作评分标准：

Content（25分）：内容全面深入，完全回应题目要求，观点有深度有细节，论证有力
Communicative Achievement（25分）：沟通效果，表达流畅自然，风格得体（正式/非正式随文体变化），读者阅读体验良好
Organization（25分）：组织结构，段落分明逻辑严密，衔接手段丰富多样（however, nevertheless, in addition等），开头结尾有吸引力
Language（25分）：语言质量，语法准确度高（时态、语态、虚拟语气等），词汇丰富地道（有高级词汇和搭配），句式多样复杂（定语从句、状语从句、非谓语动词等）

字数要求：140-190词
重点：FCE 要求学术型写作能力，句式多样、词汇丰富、论证深入，是英语进阶的重要里程碑`,
    'toefl-junior': `TOEFL Junior（初中级托福）写作评分标准：

Quality of Ideas（30分）：观点质量，观点清晰合理，有具体细节和例证支撑，内容与题目相关
Organization（25分）：组织结构，开头有明确主题句，段落有逻辑发展，过渡词使用恰当，结尾总结到位
Quality of Language（25分）：语言质量，语法基本正确（允许少量不影响理解的错误），词汇使用恰当有变化，句式有一定多样性
Coherence & Cohesion（20分）：连贯与衔接，论证前后一致，段落之间逻辑衔接自然，整体行文流畅

字数要求：无硬性字数限制，建议 150-250词
重点：TOEFL Junior 侧重学术写作基础能力，强调观点清晰和逻辑组织，语言要求比 FCE 低一些`,
  };

  /**
   * 更新评分标准区域的 UI 状态（显示文件名、清除按钮）
   */
  function updateRubricState() {
    const input = $('rubricInput');
    const clearBtn = $('rubricClearBtn');
    if (input.value.trim()) {
      clearBtn.hidden = false;
    } else {
      clearBtn.hidden = true;
      $('rubricFileName').textContent = '';
    }
  }

  /**
   * 处理评分标准文件上传
   */
  async function handleRubricFile(file) {
    // 图片文件放宽到 5MB，文本文件仍限制 1MB
    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxSize) {
      toast(isImage ? '图片不能超过 5MB' : '评分标准文件不能超过 1MB', 'warning');
      return;
    }

    try {
      let text = '';

      if (isImage) {
        // 图片文件：OCR 识别
        $('rubricFileName').textContent = file.name + '（识别中...）';
        updateRubricState();
        toast('正在识别图片中的文字...', 'info', 5000);
        try {
          const compressed = await OCR.compressImage(file, 1200, 0.8);
          text = await OCR.recognize(compressed, (m) => {
            if (m.status === 'recognizing text') {
              const pct = Math.round((m.progress || 0) * 100);
              $('rubricFileName').textContent = file.name + `（识别中 ${pct}%）`;
            }
          });
        } catch (ocrErr) {
          console.error('OCR error:', ocrErr);
          toast('图片识别失败：' + ocrErr.message + '，可改用文本手动输入', 'error', 5000);
          $('rubricFileName').textContent = '';
          return;
        }
      } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        // txt/md 文件直接读取
        text = await readFileAsText(file);
      } else if (file.name.endsWith('.csv')) {
        // CSV 文件直接读取
        text = await readFileAsText(file);
      } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        // doc/docx - 尝试读取纯文本（简化处理）
        toast('Word 文件请先另存为 txt 格式', 'warning');
        return;
      } else {
        // 其他文件尝试当文本读取
        text = await readFileAsText(file);
      }

      if (!text.trim()) {
        toast(isImage ? '图片中未识别到文字，请确认图片清晰' : '文件内容为空', 'warning');
        $('rubricFileName').textContent = '';
        return;
      }

      $('rubricInput').value = text;
      $('rubricFileName').textContent = file.name + '（已识别）';
      updateRubricState();
      toast(`已加载评分标准「${file.name}」${isImage ? '（图片已 OCR）' : ''}`, 'success');
    } catch (e) {
      toast('文件读取失败：' + e.message, 'error');
      $('rubricFileName').textContent = '';
    }
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  // ===========================
  // 状态
  // ===========================
  const state = {
    currentEssay: null,        // 当前批改数据
    pendingImage: null,        // 待识别图片
    pendingText: '',           // 用户输入/OCR 后的文本
    isProcessing: false,       // 是否正在批改
  };

  // ===========================
  // DOM 元素
  // ===========================
  const $ = (id) => document.getElementById(id);

  const els = {
    backBtn: $('backBtn'),
    settingsBtn: $('settingsBtn'),
    emptyState: $('emptyState'),
    emptyStartBtn: $('emptyStartBtn'),
    emptyTypeBtn: $('emptyTypeBtn'),
    emptyDemoBtn: $('emptyDemoBtn'),
    essayResult: $('essayResult'),
    loadingState: $('loadingState'),
    loadingText: $('loadingText'),
    appFooter: $('appFooter'),
    fab: $('fabBtn'),
    toast: $('toast'),
    toastMsg: $('toastMsg'),
    toastIcon: $('toastIcon'),
    settingsDrawer: $('settingsDrawer'),
    providerSelect: $('providerSelect'),
    apiKeyInput: $('apiKeyInput'),
    baseUrlInput: $('baseUrlInput'),
    baseUrlGroup: $('baseUrlGroup'),
    modelGroup: $('modelGroup'),
    modelInput: $('modelInput'),
    styleSelect: $('styleSelect'),
    testApiBtn: $('testApiBtn'),
    saveSettingsBtn: $('saveSettingsBtn'),
    viewToggleBtn: $('viewToggleBtn'),
    exportBtn: $('exportBtn'),
    shareBtn: $('shareBtn'),
    overallHelp: $('overallHelp'),
    helpModal: $('helpModal'),
  };

  // ===========================
  // 工具：Toast
  // ===========================
  let toastTimer = null;
  function toast(msg, type = 'info', duration = 2400) {
    if (toastTimer) clearTimeout(toastTimer);
    els.toast.hidden = false;
    els.toastMsg.textContent = msg;
    els.toast.className = 'toast';
    if (type !== 'info') els.toast.classList.add(type);

    const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
    els.toastIcon.textContent = icons[type] || icons.info;

    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, duration);
  }

  // ===========================
  // 视图切换
  // ===========================
  function showState(name) {
    els.emptyState.hidden = name !== 'empty';
    els.essayResult.hidden = name !== 'result';
    els.loadingState.hidden = name !== 'loading';
    els.appFooter.hidden = name !== 'result';
    els.fab.hidden = name !== 'result';
  }

  // ===========================
  // 加载示例
  // ===========================
  function loadSample() {
    const data = {
      title: SampleData.title,
      text: SampleData.text,
      corrections: SampleData.corrections,
      overall: SampleData.overall,
      scores: SampleData.scores,
    };
    state.currentEssay = data;
    Storage.Current.set(data);
    Renderer.render(data);
    showState('result');
  }

  // ===========================
  // 设置抽屉
  // ===========================
  function openSettings() {
    const settings = Storage.Settings.get();
    els.providerSelect.value = settings.provider;
    els.apiKeyInput.value = settings.apiKey;
    els.baseUrlInput.value = settings.baseUrl;
    els.modelInput.value = settings.model;
    els.styleSelect.value = settings.style;
    $('rubricInput').value = settings.rubric || '';
    updateProviderFields(settings.provider);
    updateRubricState();
    els.settingsDrawer.hidden = false;
  }

  function closeSettings() {
    els.settingsDrawer.hidden = true;
  }

  function updateProviderFields(provider) {
    const config = AIGrader.getProviderConfig(provider);
    const isPreset = provider !== 'gemini' && provider !== 'custom';
    const isCustom = provider === 'custom';
    const isGemini = provider === 'gemini';

    // 预设服务商：隐藏 baseUrl/model（自动填好）
    // Gemini：也隐藏（走专属 API）
    // 自定义：全部显示
    els.baseUrlGroup.hidden = !isCustom;
    els.modelGroup.hidden = !isCustom;

    // 自动填充预设值（用户之前没改过的才自动填）
    if (isPreset && config.baseUrl) {
      els.baseUrlInput.value = config.baseUrl;
    }
    if (isPreset && config.model) {
      els.modelInput.value = config.model;
    }

    // 更新 API Key placeholder
    const keyPrefix = config.keyPrefix || 'sk-';
    els.apiKeyInput.placeholder = keyPrefix ? `${keyPrefix}...` : 'API Key...';

    // 更新服务商提示（获取 Key 链接 + 备注）
    const hintEl = document.getElementById('providerHint');
    if (hintEl) {
      if (config.keyUrl) {
        hintEl.innerHTML = `<a href="${config.keyUrl}" target="_blank" rel="noopener" class="provider-link">获取 ${config.name} API Key →</a>`;
      } else {
        hintEl.innerHTML = '';
      }
      if (config.note) {
        hintEl.innerHTML += `<span style="display:block;margin-top:4px;font-size:12px;color:var(--text-muted);">${config.note}</span>`;
      }
    }
  }

  function saveSettings() {
    const settings = {
      provider: els.providerSelect.value,
      apiKey: els.apiKeyInput.value.trim(),
      baseUrl: els.baseUrlInput.value.trim(),
      model: els.modelInput.value.trim(),
      style: els.styleSelect.value,
      rubric: $('rubricInput').value.trim(),
    };
    Storage.Settings.save(settings);
    closeSettings();
    toast('设置已保存', 'success');
  }

  async function testApi() {
    const settings = {
      provider: els.providerSelect.value,
      apiKey: els.apiKeyInput.value.trim(),
      baseUrl: els.baseUrlInput.value.trim(),
      model: els.modelInput.value.trim(),
    };
    if (!settings.apiKey) {
      toast('请先填写 API Key', 'warning');
      return;
    }
    toast('正在测试...', 'info', 3000);
    try {
      const result = await AIGrader.testConnection(settings);
      toast('连接成功！', 'success');
      console.log('Test result:', result);
    } catch (e) {
      toast('连接失败：' + e.message, 'error', 4000);
    }
  }

  // ===========================
  // 输入对话框（拍照/上传/输入）
  // ===========================
  function openInputDialog(defaultTab = 'upload') {
    // 创建对话框 DOM
    const dialog = document.createElement('div');
    dialog.className = 'input-dialog';
    dialog.id = 'inputDialog';
    dialog.innerHTML = `
      <div class="input-panel">
        <div class="input-header">
          <h2>新建批改</h2>
          <button class="drawer-close" data-action="close" aria-label="关闭">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="input-tabs">
          <button class="input-tab ${defaultTab === 'upload' ? 'active' : ''}" data-tab="upload">📷 拍照/上传</button>
          <button class="input-tab ${defaultTab === 'text' ? 'active' : ''}" data-tab="text">✏️ 输入文本</button>
        </div>
        <div class="input-body">
          <div class="tab-pane ${defaultTab === 'upload' ? 'active' : ''}" data-pane="upload">
            <div class="upload-zone" id="uploadZone">
              <input type="file" id="fileInput" accept="image/*" capture="environment">
              <div class="upload-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div class="upload-title">点击拍照或上传图片</div>
              <div class="upload-desc">支持 JPG/PNG，文件大小不超过 10MB</div>
              <div class="upload-actions">
                <label class="upload-action-btn" data-mode="camera">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  拍照
                </label>
                <label class="upload-action-btn" data-mode="gallery">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  相册
                </label>
              </div>
            </div>
            <div id="ocrProgress" class="ocr-progress" hidden>
              <div class="spinner"></div>
              <span id="ocrProgressText">正在识别图片文字...</span>
            </div>
          </div>
          <div class="tab-pane ${defaultTab === 'text' ? 'active' : ''}" data-pane="text">
            <textarea
              class="text-input-area"
              id="textInput"
              placeholder="在此输入或粘贴你的英语作文...&#10;&#10;提示：&#10;- 输入完整作文以获得更准确的批改&#10;- 段落之间用空行分隔"
            ></textarea>
            <div class="text-input-toolbar">
              <span id="inputWordCount">0 词</span>
              <button class="btn btn-text" id="clearTextBtn">清空</button>
            </div>
          </div>
        </div>
        <div class="input-footer">
          <button class="btn btn-secondary" data-action="close">取消</button>
          <button class="btn btn-primary" id="submitGradeBtn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            开始批改
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    bindInputDialog(dialog);
  }

  function closeInputDialog() {
    const dialog = document.getElementById('inputDialog');
    if (dialog) dialog.remove();
  }

  function bindInputDialog(dialog) {
    // 关闭
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target.dataset.action === 'close') {
        closeInputDialog();
      }
    });

    // Tab 切换
    dialog.querySelectorAll('.input-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const name = tab.dataset.tab;
        dialog.querySelectorAll('.input-tab').forEach(t => t.classList.toggle('active', t === tab));
        dialog.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === name));
      });
    });

    // 拍照/相册切换
    dialog.querySelectorAll('.upload-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = btn.dataset.mode;
        const input = $('fileInput');
        if (mode === 'camera') {
          input.setAttribute('capture', 'environment');
        } else {
          input.removeAttribute('capture');
        }
        input.click();
      });
    });

    // 文件选择
    const fileInput = $('fileInput');
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await handleImageSelected(file, dialog);
    });

    // 拖拽
    const zone = $('uploadZone');
    ;['dragover', 'dragenter'].forEach(evt => {
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });
    });
    ;['dragleave', 'drop'].forEach(evt => {
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
      });
    });
    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        await handleImageSelected(file, dialog);
      }
    });

    // 文本输入统计
    const textInput = $('textInput');
    const wordCountEl = $('inputWordCount');
    textInput.addEventListener('input', () => {
      const count = Renderer.countWords(textInput.value);
      wordCountEl.textContent = `${count} 词`;
    });

    // 清空文本
    $('clearTextBtn').addEventListener('click', () => {
      textInput.value = '';
      wordCountEl.textContent = '0 词';
      textInput.focus();
    });

    // 提交批改
    $('submitGradeBtn').addEventListener('click', async () => {
      await submitGrade(dialog);
    });
  }

  async function handleImageSelected(file, dialog) {
    if (file.size > 10 * 1024 * 1024) {
      toast('图片不能超过 10MB', 'warning');
      return;
    }

    // 压缩图片
    showOcrProgress(dialog, '正在准备图片...');
    const compressed = await OCR.compressImage(file);

    // OCR 识别
    showOcrProgress(dialog, '正在识别英文... 0%');
    try {
      const text = await OCR.recognize(compressed, (m) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round((m.progress || 0) * 100);
          showOcrProgress(dialog, `正在识别英文... ${pct}%`);
        } else if (m.status) {
          showOcrProgress(dialog, `${m.status}...`);
        }
      });

      hideOcrProgress(dialog);

      if (!text.trim()) {
        toast('识别结果为空，请检查图片', 'warning');
        return;
      }

      // 把识别结果填到文本输入框，并切换到文本 Tab 供用户编辑
      dialog.querySelector('.input-tab[data-tab="text"]').click();
      const textInput = $('textInput');
      textInput.value = text;
      textInput.dispatchEvent(new Event('input'));
      toast(`识别完成，共 ${Renderer.countWords(text)} 词`, 'success');
    } catch (e) {
      hideOcrProgress(dialog);
      toast(e.message, 'error', 4000);
    }
  }

  function showOcrProgress(dialog, text) {
    const el = $('ocrProgress');
    el.hidden = false;
    $('ocrProgressText').textContent = text;
  }

  function hideOcrProgress(dialog) {
    const el = $('ocrProgress');
    if (el) el.hidden = true;
  }

  async function submitGrade(dialog) {
    const activePane = dialog.querySelector('.tab-pane.active');
    let text = '';

    if (activePane.dataset.pane === 'text') {
      text = $('textInput').value.trim();
    } else {
      // 上传模式但还没 OCR
      text = state.pendingText || '';
    }

    if (!text) {
      toast('请先输入作文内容', 'warning');
      return;
    }

    if (text.length < 20) {
      toast('作文太短了，至少 20 个字符', 'warning');
      return;
    }

    const settings = Storage.Settings.get();
    if (!settings.apiKey) {
      toast('请先在设置中配置 API Key', 'warning', 3000);
      closeInputDialog();
      setTimeout(openSettings, 200);
      return;
    }

    closeInputDialog();
    await startGrading(text, settings);
  }

  // ===========================
  // 批改流程
  // ===========================
  async function startGrading(text, settings) {
    state.isProcessing = true;
    state.pendingText = text;
    showState('loading');

    const messages = [
      'AI 正在仔细阅读你的作文...',
      '正在分析语法和用词...',
      '正在思考改进建议...',
      '即将完成...',
    ];
    let msgIdx = 0;
    const msgTimer = setInterval(() => {
      els.loadingText.textContent = messages[msgIdx % messages.length];
      msgIdx++;
    }, 2000);

    try {
      const result = await AIGrader.grade(text, settings);
      clearInterval(msgTimer);

      // 自动定位错误位置
      const corrections = locateCorrections(text, result.corrections);

      const data = {
        title: extractTitle(text) || '我的英语作文',
        text,
        corrections,
        overall: result.overall,
        scores: result.scores,
      };

      state.currentEssay = data;
      Storage.Current.set(data);
      Storage.History.add({
        title: data.title,
        text: data.text,
        corrections: data.corrections,
        overall: data.overall,
        scores: data.scores,
      });

      Renderer.render(data);
      showState('result');
      toast('批改完成！', 'success');
    } catch (e) {
      clearInterval(msgTimer);
      console.error('Grade error:', e);
      showState('empty');
      toast(e.message, 'error', 4000);
    } finally {
      state.isProcessing = false;
    }
  }

  /**
   * 在文本中定位 AI 返回的每个错误的字符位置
   */
  function locateCorrections(text, corrections) {
    if (!corrections || !corrections.length) return [];

    // 先尝试用 original 字段匹配
    const located = [];
    const used = new Set(); // 记录已使用的位置

    corrections.forEach(c => {
      if (!c.original) {
        located.push({ ...c, start: 0, end: 0 });
        return;
      }
      // 找所有出现位置，跳过已用过的
      let idx = -1;
      let searchFrom = 0;
      while (true) {
        const found = text.indexOf(c.original, searchFrom);
        if (found < 0) break;
        const rangeKey = `${found}-${found + c.original.length}`;
        if (!used.has(rangeKey)) {
          used.add(rangeKey);
          idx = found;
          break;
        }
        searchFrom = found + 1;
      }

      if (idx >= 0) {
        located.push({ ...c, start: idx, end: idx + c.original.length });
      } else {
        // 模糊匹配：忽略大小写和首尾空格
        const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
        const normTarget = norm(c.original);
        let pos = 0;
        let fuzzyFound = -1;
        while (pos < text.length) {
          const slice = text.slice(pos, pos + c.original.length + 5);
          if (norm(slice).startsWith(normTarget.slice(0, 20))) {
            // 简化版：找原文足够长的前缀
            const slice2 = text.slice(pos, pos + c.original.length);
            if (norm(slice2) === normTarget) {
              const rangeKey = `${pos}-${pos + c.original.length}`;
              if (!used.has(rangeKey)) {
                used.add(rangeKey);
                fuzzyFound = pos;
                break;
              }
            }
          }
          pos++;
        }
        if (fuzzyFound >= 0) {
          located.push({ ...c, start: fuzzyFound, end: fuzzyFound + c.original.length });
        } else {
          located.push({ ...c, start: 0, end: 0 });
        }
      }
    });

    return located;
  }

  /**
   * 从作文内容中提取标题（第一行或第一句）
   */
  function extractTitle(text) {
    const firstLine = text.split('\n').find(l => l.trim());
    if (!firstLine) return null;
    const trimmed = firstLine.trim();
    if (trimmed.length > 60) return null;
    return trimmed;
  }

  // ===========================
  // 导出
  // ===========================
  async function doExport() {
    if (!state.currentEssay) {
      toast('没有可导出的内容', 'warning');
      return;
    }
    try {
      toast('正在生成图片...', 'info', 2000);
      const blob = await Exporter.exportToImage($('essayResult'));
      Exporter.download(blob);
      toast('已下载到本地', 'success');
    } catch (e) {
      console.error(e);
      toast('导出失败：' + e.message, 'error');
    }
  }

  // ===========================
  // 分享
  // ===========================
  function doShare() {
    if (!state.currentEssay) {
      toast('没有可分享的内容', 'warning');
      return;
    }

    const shareData = Exporter.generateShareData({
      title: state.currentEssay.title,
      text: state.currentEssay.text,
      corrections: state.currentEssay.corrections,
      overall: state.currentEssay.overall,
      scores: state.currentEssay.scores,
    });

    const sheet = document.createElement('div');
    sheet.className = 'share-sheet';
    sheet.innerHTML = `
      <div class="share-panel">
        <h3 class="share-title">分享批改结果</h3>
        <div class="share-options">
          <div class="share-option" data-action="image">
            <div class="share-icon image">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div class="share-label">导出图片</div>
          </div>
          <div class="share-option" data-action="copy">
            <div class="share-icon copy">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <div class="share-label">复制链接</div>
          </div>
          <div class="share-option" data-action="wechat">
            <div class="share-icon wechat">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8.5 4C4.5 4 1 6.7 1 10.2c0 2 1 3.7 2.7 4.9L3 17l2.3-1.2c.8.2 1.6.3 2.5.3.3 0 .6 0 .8-.1-.2-.5-.3-1.1-.3-1.7 0-3 3-5.5 6.7-5.5h.5C14.5 6.5 11.8 4 8.5 4zM6 8.5c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm5 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/><path d="M22.5 14.5c0-2.7-2.8-4.9-6.2-4.9-3.6 0-6.5 2.2-6.5 4.9 0 2.7 2.9 4.9 6.5 4.9.7 0 1.4-.1 2-.3l1.7.9-.5-1.5c1.8-1 3-2.4 3-4zM14 13.5c-.4 0-.8-.3-.8-.8s.4-.8.8-.8.8.3.8.8-.4.8-.8.8zm5 0c-.4 0-.8-.3-.8-.8s.4-.8.8-.8.8.3.8.8-.4.8-.8.8z"/></svg>
            </div>
            <div class="share-label">微信</div>
          </div>
          <div class="share-option" data-action="text">
            <div class="share-icon" style="background: linear-gradient(135deg, #10B981, #059669);">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </div>
            <div class="share-label">分享文本</div>
          </div>
        </div>
        <button class="share-cancel">取消</button>
      </div>
    `;
    document.body.appendChild(sheet);

    sheet.addEventListener('click', async (e) => {
      if (e.target === sheet || e.target.classList.contains('share-cancel')) {
        sheet.remove();
        return;
      }
      const action = e.target.closest('.share-option')?.dataset.action;
      if (!action) return;

      if (action === 'image') {
        sheet.remove();
        await doExport();
      } else if (action === 'copy') {
        try {
          await navigator.clipboard.writeText(shareData.url);
          toast('链接已复制', 'success');
        } catch {
          toast('复制失败，请手动复制', 'error');
        }
        sheet.remove();
      } else if (action === 'wechat') {
        toast('请使用浏览器菜单的分享功能分享到微信', 'info', 3500);
      } else if (action === 'text') {
        try {
          await navigator.clipboard.writeText(shareData.text);
          toast('分享文本已复制', 'success');
        } catch {
          toast('复制失败', 'error');
        }
        sheet.remove();
      }
    });
  }

  // ===========================
  // 鼓励气泡
  // ===========================
  function showEncouragement() {
    const messages = [
      '老师相信你下次能做得更好！',
      '坚持练习，英语进步会非常快～',
      '敢于写作就是最大的进步！',
      '继续加油，期待看到你的更多佳作！',
      '小小的错误不可怕，积累起来就是大进步！',
    ];
    const text = messages[Math.floor(Math.random() * messages.length)];

    // 移除旧气泡
    document.querySelectorAll('.bubble-help').forEach(b => b.remove());

    const bubble = document.createElement('div');
    bubble.className = 'bubble-help';
    bubble.textContent = text;
    document.body.appendChild(bubble);

    const rect = els.overallHelp.getBoundingClientRect();
    bubble.style.top = (rect.top - bubble.offsetHeight - 10) + 'px';
    bubble.style.left = Math.max(8, rect.left - 80) + 'px';

    setTimeout(() => bubble.remove(), 3000);
  }

  // ===========================
  // 事件绑定
  // ===========================
  function bindEvents() {
    // 返回
    els.backBtn.addEventListener('click', () => {
      if (els.essayResult.hidden) {
        // 在空状态
        return;
      }
      if (confirm('确定要返回吗？当前批改结果会保留在历史中')) {
        showState('empty');
        Storage.Current.clear();
      }
    });

    // 设置
    els.settingsBtn.addEventListener('click', openSettings);
    document.querySelectorAll('[data-close-drawer]').forEach(el => {
      el.addEventListener('click', closeSettings);
    });
    els.providerSelect.addEventListener('change', (e) => {
      updateProviderFields(e.target.value);
    });
    els.saveSettingsBtn.addEventListener('click', saveSettings);
    els.testApiBtn.addEventListener('click', testApi);

    // 评分标准：文件上传
    $('rubricFileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await handleRubricFile(file);
    });

    // 评分标准：模板快速填入
    $('rubricTemplates').addEventListener('click', (e) => {
      const btn = e.target.closest('.rubric-template-btn');
      if (!btn) return;
      const templateKey = btn.dataset.template;
      const template = RUBRIC_TEMPLATES[templateKey];
      if (template) {
        $('rubricInput').value = template;
        updateRubricState();
        // 高亮当前模板按钮
        $('rubricTemplates').querySelectorAll('.rubric-template-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.template === templateKey);
        });
        toast(`已填入「${btn.textContent}」评分标准`, 'success');
      }
    });

    // 评分标准：清除
    $('rubricClearBtn').addEventListener('click', () => {
      $('rubricInput').value = '';
      $('rubricFileName').textContent = '';
      $('rubricClearBtn').hidden = true;
      $('rubricTemplates').querySelectorAll('.rubric-template-btn').forEach(b => b.classList.remove('active'));
    });

    // 空状态按钮
    els.emptyStartBtn.addEventListener('click', () => openInputDialog('upload'));
    els.emptyTypeBtn.addEventListener('click', () => openInputDialog('text'));
    els.emptyDemoBtn.addEventListener('click', loadSample);

    // FAB - 新建
    els.fab.addEventListener('click', () => openInputDialog('upload'));

    // 底部操作
    els.exportBtn.addEventListener('click', doExport);
    els.shareBtn.addEventListener('click', doShare);
    els.viewToggleBtn.addEventListener('click', () => {
      // 切换图片/分栏视图
      const grid = document.querySelector('.correction-grid');
      if (grid) grid.classList.toggle('image-view');
      toast(grid.classList.contains('image-view') ? '已切换为图片视图' : '已切换为分栏视图', 'info', 1500);
    });

    // 鼓励
    els.overallHelp.addEventListener('click', showEncouragement);

    // 帮助弹窗
    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', () => {
        if (els.helpModal) els.helpModal.hidden = true;
      });
    });
  }

  // ===========================
  // 启动
  // ===========================
  function init() {
    bindEvents();

    // 恢复当前批改结果
    const current = Storage.Current.get();
    if (current && current.text) {
      state.currentEssay = current;
      Renderer.render(current);
      showState('result');
      return;
    }

    // 处理 URL 参数 ?id=xxx 加载历史
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      const record = Storage.History.get(id);
      if (record) {
        state.currentEssay = record;
        Storage.Current.set(record);
        Renderer.render(record);
        showState('result');
        return;
      }
    }

    // 默认空状态
    showState('empty');

    // 首次访问显示欢迎 toast
    if (!localStorage.getItem('eg_visited')) {
      setTimeout(() => {
        toast('点击"查看示例效果"体验一下 ✨', 'info', 3500);
        localStorage.setItem('eg_visited', '1');
      }, 800);
    }
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
