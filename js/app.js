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

Content（5分）：是否紧扣题目，表达是否清晰，信息是否完整
Organization（5分）：文章的组织是否合理，段落划分是否清晰，逻辑是否连贯
Language（5分）：语法的准确性、词汇的丰富度以及句子结构的多样性

总分：15分（三个维度各5分）
重点：KET 注重基本沟通能力，不要求复杂句式和高级词汇，简单句表达清楚即可`,
    'pet': `剑桥 PET（B1 Preliminary）写作评分标准：

Content（5分）：评估考生是否完成任务，是否涵盖所有写作要点。内容的完整性直接影响得分，字数不足可能导致信息遗漏，字数过多则可能包含无关内容
Communicative Achievement（5分）：关注写作的语气和文体是否恰当。考生需要根据题目要求选择合适的表达方式，确保信息传达清晰且符合情境要求
Organization（5分）：考查文章的结构是否清晰，逻辑是否连贯。良好的组织能够帮助读者更好地理解文章内容，字数过多或过少都可能影响文章的连贯性
Language（5分）：评估词汇和语法的准确性。考生需要展示一定的词汇量和语法知识，避免简单句的堆砌和重复错误的出现

总分：20分（四个维度各5分）
重点：PET 要求能写出连贯的短文，有观点和论据，句式开始多样化`,
    'fce': `剑桥 FCE（B2 First）写作评分标准：

Content（5分）：评估作文是否有效回应题目要求，内容是否完整且相关。
  5分：全部内容与题目要求相关，目标读者完全理解
  4分：大部分内容相关，少量无关信息
  3分：存在一些无关信息，基本能被理解
  2分：内容缺失较多，理解困难
  1分：内容与题目要求完全无关，难以理解
  0分：无内容或完全不相关

Communicative Achievement（5分）：评估写作风格是否合适、得体，是否能有效传达意图。
  5分：用得体、有效的方式吸引读者，清晰传达复杂思想
  4分：有效吸引读者，清晰传达意图
  3分：基本能吸引读者，传达意图
  2分：表达不够清晰，吸引力不足
  1分：表达混乱，难以理解
  0分：无交流效果

Organization（5分）：评估作文的结构是否清晰、逻辑是否连贯。
  5分：组织良好，连接手段丰富，整体效果佳
  4分：组织较好，逻辑清晰
  3分：基本组织，逻辑有时不清晰
  2分：组织较差，逻辑混乱
  1分：无组织，难以理解
  0分：完全无组织

Language（5分）：评估词汇和语法的准确性和丰富性。
  5分：词汇丰富，语法准确，表达流畅
  4分：词汇和语法基本准确，表达清晰
  3分：存��一些错误，但不影响理解
  2分：错误较多，影响理解
  1分：错误频繁，难以理解
  0分：完全无法理解

总分：20分（四个维度各5分）
重点：FCE 要求学术型写作能力，句式多样、词汇丰富、论证深入`,
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
    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxSize) {
      toast(isImage ? '图片不能超过 5MB' : '评分标准文件不能超过 1MB', 'warning');
      return;
    }

    try {
      let text = '';

      if (isImage) {
        $('rubricFileName').textContent = file.name + '（识别中...）';
        updateRubricState();
        toast('正在识别图片中的文字...', 'info', 5000);
        try {
          const res = await ocrImageToText(file, (msg) => {
            $('rubricFileName').textContent = file.name + `（${msg}）`;
          });
          text = res.text;
          if (res.engine === 'tesseract' && res.aiError) {
            toast('AI 识别失败（' + res.aiError + '），已用本地识别（准确率较低）', 'warning', 9000);
          } else if (res.engine === 'tesseract') {
            toast('AI 未触发，已用本地识别（准确率较低，请确认已填 API Key）', 'warning', 6000);
          }
        } catch (ocrErr) {
          console.error('OCR error:', ocrErr);
          toast('图片识别失败：' + ocrErr.message + '，可改用文本手动输入', 'error', 5000);
          $('rubricFileName').textContent = '';
          return;
        }
      } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        text = await readFileAsText(file);
      } else if (file.name.endsWith('.csv')) {
        text = await readFileAsText(file);
      } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        toast('Word 文件请先另存为 txt 格式', 'warning');
        return;
      } else {
        text = await readFileAsText(file);
      }

      if (!text.trim()) {
        toast(isImage ? '图片中未识别到文字，请确认图片清晰' + (res.aiError ? '（AI 报错：' + res.aiError + '）' : '') : '文件内容为空', 'warning', 9000);
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
    currentEssay: null,
    pendingImage: null,
    pendingText: '',
    isProcessing: false,
    annotationEditing: false,
  };

  // ===========================
  // DOM 元素
  // ===========================
  const $ = (id) => document.getElementById(id);

  const els = {
    backBtn: $('backBtn'),
    settingsBtn: $('settingsBtn'),
    emptyState: $('emptyState'),
    homeLayout: $('homeLayout'),
    historyList: $('historyList'),
    historyEmpty: $('historyEmpty'),
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
    styleSelect: $('styleSelect'),
    testApiBtn: $('testApiBtn'),
    saveSettingsBtn: $('saveSettingsBtn'),
    shareBtn: $('shareBtn'),
    annotationEditBtn: $('annotationEditBtn'),
    commentAddBar: $('commentAddBar'),
    addAnnotationBtn: $('addAnnotationBtn'),
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
    els.homeLayout.hidden = name !== 'empty';
    els.essayResult.hidden = name !== 'result';
    els.loadingState.hidden = name !== 'loading';
    els.appFooter.hidden = name !== 'result';
    els.fab.hidden = name !== 'result';
    if (name === 'empty') renderHistoryPanel();
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
      maxScores: { _default: 100 },
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
    els.apiKeyInput.value = settings.apiKey || '';
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

    const keyPrefix = config.keyPrefix || 'sk-';
    els.apiKeyInput.placeholder = keyPrefix ? `${keyPrefix}...` : 'API Key...';

    const hintEl = document.getElementById('providerHint');
    if (hintEl) {
      let html = '';
      if (config.keyUrl) {
        html += `<a href="${config.keyUrl}" target="_blank" rel="noopener" class="provider-link">获取 ${config.name} API Key →</a>`;
      }
      if (config.note) {
        html += `<span style="display:block;margin-top:4px;font-size:12px;color:var(--text-muted);">${config.note}</span>`;
      }
      hintEl.innerHTML = html;
    }
  }

  // 模型选择已从设置界面移除：默认使用支持图片识别的模型（见 ai-grader.js 的 visionModel）。
  // 批改与看图识字共用「AI 服务商」这一个选择。

  function saveSettings() {
    const settings = {
      provider: els.providerSelect.value,
      apiKey: (els.apiKeyInput.value || '').trim(),
      style: els.styleSelect.value,
      rubric: $('rubricInput').value.trim(),
    };
    Storage.Settings.save(settings);
    closeSettings();
    toast('设置已保存', 'success');
  }

  async function testApi() {
    const userKey = (els.apiKeyInput.value || '').trim();
    const settings = {
      provider: els.providerSelect.value,
      apiKey: userKey,
    };
    if (!settings.apiKey) {
      toast('请先在上方填写 API Key', 'warning');
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
        <div class="input-student">
          <label class="form-label" for="studentNameInput">学生姓名（选填）</label>
          <input type="text" class="form-input" id="studentNameInput" placeholder="例如：张三" autocomplete="off" maxlength="40">
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
    const sn = dialog.querySelector('#studentNameInput');
    if (sn) sn.value = Storage.Student.get();
    bindInputDialog(dialog);
  }

  function closeInputDialog() {
    const dialog = document.getElementById('inputDialog');
    if (dialog) dialog.remove();
  }

  // ===========================
  // 通用轻量对话框
  // ===========================
  function openPromptDialog({ title = '提示', value = '', placeholder = '', maxlength = 40, onConfirm }) {
    const mask = document.createElement('div');
    mask.className = 'prompt-mask';
    mask.innerHTML = `
      <div class="prompt-card">
        <div class="prompt-title">${Renderer.escapeHtml(title)}</div>
        <input type="text" class="prompt-input form-input" value="${Renderer.escapeHtml(value)}" placeholder="${Renderer.escapeHtml(placeholder)}" maxlength="${maxlength}">
        <div class="prompt-actions">
          <button class="btn btn-secondary" data-action="cancel">取消</button>
          <button class="btn btn-primary" data-action="ok">确定</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const input = mask.querySelector('.prompt-input');
    input.focus();
    input.select();
    const close = () => mask.remove();
    mask.addEventListener('click', (e) => {
      if (e.target === mask || e.target.dataset.action === 'cancel') close();
    });
    mask.querySelector('[data-action="ok"]').addEventListener('click', () => {
      const v = input.value.trim();
      close();
      if (onConfirm) onConfirm(v);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); mask.querySelector('[data-action="ok"]').click(); }
      else if (e.key === 'Escape') close();
    });
  }

  function openConfirmDialog({ title = '提示', message = '', confirmText = '确定', cancelText = '取消', danger = false, onConfirm }) {
    const mask = document.createElement('div');
    mask.className = 'prompt-mask';
    mask.innerHTML = `
      <div class="prompt-card">
        <div class="prompt-title">${Renderer.escapeHtml(title)}</div>
        <div class="prompt-message">${Renderer.escapeHtml(message)}</div>
        <div class="prompt-actions">
          <button class="btn btn-secondary" data-action="cancel">${Renderer.escapeHtml(cancelText)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="ok">${Renderer.escapeHtml(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const close = () => mask.remove();
    mask.addEventListener('click', (e) => {
      if (e.target === mask || e.target.dataset.action === 'cancel') close();
    });
    mask.querySelector('[data-action="ok"]').addEventListener('click', () => {
      close();
      if (onConfirm) onConfirm();
    });
  }

  function bindInputDialog(dialog) {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target.dataset.action === 'close') {
        closeInputDialog();
      }
    });

    dialog.querySelectorAll('.input-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const name = tab.dataset.tab;
        dialog.querySelectorAll('.input-tab').forEach(t => t.classList.toggle('active', t === tab));
        dialog.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === name));
      });
    });

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

    const fileInput = $('fileInput');
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await handleImageSelected(file, dialog);
    });

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

    const textInput = $('textInput');
    const wordCountEl = $('inputWordCount');
    textInput.addEventListener('input', () => {
      const count = Renderer.countWords(textInput.value);
      wordCountEl.textContent = `${count} 词`;
    });

    $('clearTextBtn').addEventListener('click', () => {
      textInput.value = '';
      wordCountEl.textContent = '0 词';
      textInput.focus();
    });

    $('submitGradeBtn').addEventListener('click', async () => {
      await submitGrade(dialog);
    });
  }

  async function handleImageSelected(file, dialog) {
    if (file.size > 10 * 1024 * 1024) {
      toast('图片不能超过 10MB', 'warning');
      return;
    }

    showOcrProgress(dialog, '正在准备图片...');
    try {
      const res = await ocrImageToText(file, (msg) => showOcrProgress(dialog, msg));
      const text = res.text;

      hideOcrProgress(dialog);

      if (!text.trim()) {
        toast('识别结果为空，请检查图片' + (res.aiError ? '（AI 报错：' + res.aiError + '）' : '') + '，可改用文本手动输入', 'warning', 9000);
        return;
      }

      if (res.engine === 'ai') {
        toast('✅ 已用 AI 视觉识别', 'success', 6000);
      } else if (res.engine === 'tesseract' && res.aiError) {
        toast('⚠️ AI 看图失败（' + res.aiError + '），已回退本地 OCR（准确率较低）', 'error', 10000);
      } else if (res.engine === 'tesseract') {
        toast('⚠️ AI 未触发，已用本地 OCR（准确率较低，请确认已填 Key）', 'warning', 6000);
      }

      dialog.querySelector('.input-tab[data-tab="text"]').click();
      const textInput = $('textInput');
      textInput.value = text;
      textInput.dispatchEvent(new Event('input'));
      toast(`识别完成（${res.engine === 'ai' ? 'AI' : '本地'}识别），共 ${Renderer.countWords(text)} 词`, 'success');
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

  async function ocrImageToText(file, onProgress) {
    const compressed = await OCR.compressImage(file, 1600, 0.85);
    const dataUrl = await OCR.fileToDataURL(compressed);
    const settings = Storage.Settings.get();

    const visionSettings = {
      provider: settings.provider,
      apiKey: (settings.apiKey || '').trim(),
    };
    let aiError = null;

    const runTesseract = async (note) => {
      onProgress && onProgress(note || '改用本地识别...');
      const t = await OCR.recognize(compressed, (m) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round((m.progress || 0) * 100);
          onProgress && onProgress(`正在识别英文... ${pct}%`);
        } else if (m.status) {
          onProgress && onProgress(`${m.status}...`);
        }
      });
      return t.trim();
    };

    if (visionSettings.apiKey) {
      try {
        onProgress && onProgress('正在用 AI 识别图片文字...');
        const aiText = await AIGrader.recognizeImage(dataUrl, visionSettings);
        if (aiText && aiText.trim()) {
          return { text: aiText.trim(), engine: 'ai' };
        }
        aiError = 'AI 返回了空内容';
      } catch (e) {
        console.warn('AI 看图识字失败，回退本地 OCR：', e.message);
        aiError = e.message;
      }
    } else {
      toast('未填写 API Key，已改用本地识别（准确率较低）。', 'warning', 7000);
    }

    try {
      const text = await runTesseract(aiError ? 'AI 识别失败，改用本地识别...' : undefined);
      return { text, engine: 'tesseract', aiError };
    } catch (e) {
      return { text: '', engine: 'tesseract', aiError: aiError || e.message };
    }
  }

  async function submitGrade(dialog) {
    const activePane = dialog.querySelector('.tab-pane.active');
    let text = '';

    if (activePane.dataset.pane === 'text') {
      text = $('textInput').value.trim();
    } else {
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

    const studentName = (dialog.querySelector('#studentNameInput')?.value || '').trim();
    Storage.Student.set(studentName);

    const settings = Storage.Settings.get();
    if (!settings.apiKey) {
      toast('请先在设置中填写 API Key', 'warning', 3000);
      closeInputDialog();
      setTimeout(openSettings, 200);
      return;
    }

    closeInputDialog();
    await startGrading(text, settings, studentName);
  }

  function parseMaxScores(rubric) {
    if (!rubric || !rubric.trim()) return null;
    const maxScores = {};
    const re = /([^\n（(]+)[（(](\d+)\s*分[）)]/g;
    let m;
    while ((m = re.exec(rubric)) !== null) {
      const name = m[1].trim().toLowerCase();
      const max = parseInt(m[2], 10);
      const keyMap = {
        '语法': 'grammar', '词汇': 'vocabulary', '逻辑': 'logic', '总分': 'total',
        '格式': 'format', '表达': 'expression', '连贯': 'coherence', '衔接': 'cohesion',
        '创新': 'innovation',
        'content': 'content',
        'communicative achievement': 'communicativeAchievement',
        'organization': 'organization', 'language': 'language',
        'task achievement': 'taskAchievement', 'coherence & cohesion': 'coherence',
        'lexical resource': 'lexicalResource', 'grammatical range': 'grammaticalRange',
        'development': 'development', 'language use': 'languageUse',
        'quality of ideas': 'qualityOfIdeas', 'quality of language': 'qualityOfLanguage',
      };
      const key = keyMap[name] || name.replace(/\s+/g, '_');
      maxScores[key] = max;
    }
    return Object.keys(maxScores).length > 0 ? maxScores : null;
  }
  async function startGrading(text, settings, studentName) {
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

      const corrections = locateCorrections(text, result.corrections);

      const maxScores = parseMaxScores(settings.rubric) || { _default: 100 };

      const data = {
        title: extractTitle(text) || '我的英语作文',
        text,
        corrections,
        overall: result.overall,
        scores: result.scores,
        maxScores,
        studentName: studentName || '',
      };

      state.currentEssay = data;
      Storage.Current.set(data);
      Storage.History.add({
        title: data.title,
        text: data.text,
        corrections: data.corrections,
        overall: data.overall,
        scores: data.scores,
        studentName: data.studentName,
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

  function locateCorrections(text, corrections) {
    if (!corrections || !corrections.length) return [];

    const located = [];
    const used = new Set();

    corrections.forEach(c => {
      if (!c.original) {
        located.push({ ...c, start: 0, end: 0 });
        return;
      }
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
        const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
        const normTarget = norm(c.original);
        let pos = 0;
        let fuzzyFound = -1;
        while (pos < text.length) {
          const slice = text.slice(pos, pos + c.original.length + 5);
          if (norm(slice).startsWith(normTarget.slice(0, 20))) {
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

  function extractTitle(text) {
    const firstLine = text.split('\n').find(l => l.trim());
    if (!firstLine) return null;
    const trimmed = firstLine.trim();
    if (trimmed.length > 60) return null;
    return trimmed;
  }

  // ===========================
  // 老师自定义批注（编辑模式）
  // ===========================
  function toggleAnnotationEditing() {
    state.annotationEditing = !state.annotationEditing;
    document.body.classList.toggle('annotation-editing', state.annotationEditing);
    els.annotationEditBtn.classList.toggle('active', state.annotationEditing);
    els.annotationEditBtn.textContent = state.annotationEditing ? '✓ 完成' : '✎ 编辑';
      if (!state.annotationEditing) {
        syncContentFromDOM();
        persistEdits();
        toast('批注已保存', 'success', 1500);
      }
      applyEditMode();
    }

  function applyEditMode() {
    document.querySelectorAll('#commentList .comment-content, #commentList .suggest-text').forEach(el => {
      el.setAttribute('contenteditable', state.annotationEditing ? 'true' : 'false');
    });
  }

  function syncContentFromDOM() {
    if (!state.currentEssay) return;
    document.querySelectorAll('#commentList .comment-content').forEach(el => {
      const cid = Number(el.dataset.cid);
      const c = (state.currentEssay.corrections || []).find(x => x.id === cid);
      if (c) c.comment = el.innerText.replace(/\n+$/, '');
    });
    document.querySelectorAll('#commentList .suggest-text').forEach(el => {
      const cid = Number(el.dataset.cid);
      const c = (state.currentEssay.corrections || []).find(x => x.id === cid);
      if (c) c.corrected = el.innerText.replace(/\n+$/, '').trim();
    });
  }

  function bindCommentEditing() {
    const list = document.getElementById('commentList');
    if (!list) return;

    list.addEventListener('input', (e) => {
      const content = e.target.closest('.comment-content');
      const suggest = e.target.closest('.suggest-text');
      if (content) {
        const cid = Number(content.dataset.cid);
        const c = (state.currentEssay.corrections || []).find(x => x.id === cid);
        if (c) {
          c.comment = content.innerText.replace(/\n+$/, '');
          persistEdits();
        }
      } else if (suggest) {
        const cid = Number(suggest.dataset.cid);
        const c = (state.currentEssay.corrections || []).find(x => x.id === cid);
        if (c) {
          c.corrected = suggest.innerText.replace(/\n+$/, '').trim();
          persistEdits();
        }
      }
    });

    list.addEventListener('change', (e) => {
      const sel = e.target.closest('.comment-type');
      if (!sel) return;
      const cid = Number(sel.dataset.cid);
      const c = (state.currentEssay.corrections || []).find(x => x.id === cid);
      if (!c) return;
      const cat = Renderer.getCategories().find(t => t.key === sel.value);
      if (cat) c.type = cat.label;
      persistEdits();
      Renderer.render(state.currentEssay);
      applyEditMode();
    });

    list.addEventListener('click', (e) => {
      const del = e.target.closest('.comment-del');
      if (!del) return;
      e.stopPropagation();
      const cid = Number(del.dataset.cid);
      state.currentEssay.corrections = (state.currentEssay.corrections || []).filter(x => x.id !== cid);
      persistEdits();
      Renderer.render(state.currentEssay);
      applyEditMode();
    });
  }

  function addAnnotation(original) {
    const cats = Renderer.getCategories();
    const bar = els.commentAddBar;
    const originalHint = original
      ? `<div class="add-original">📍 标记原文：<b>${Renderer.escapeHtml(original)}</b></div>`
      : '';
    bar.innerHTML = `
      <div class="add-form">
        ${originalHint}
        <select class="add-type" title="选择批注类型 / 颜色">
          ${cats.map(t => `<option value="${t.key}">${t.label}</option>`).join('')}
        </select>
        <textarea class="add-text" rows="3" placeholder="输入老师自定义的批注内容..."></textarea>
        <div class="add-actions">
          <button class="btn btn-text add-cancel">取消</button>
          <button class="btn btn-primary add-save">添加</button>
        </div>
      </div>`;
    bar.querySelector('.add-cancel').addEventListener('click', resetAddBar);
    bar.querySelector('.add-save').addEventListener('click', () => {
      const typeSel = bar.querySelector('.add-type');
      const textEl = bar.querySelector('.add-text');
      const text = textEl.value.trim();
      if (!text) { toast('请输入批注内容', 'warning'); return; }
      const cat = cats.find(t => t.key === typeSel.value) || cats[cats.length - 1];
      const corrections = state.currentEssay.corrections || [];
      const newId = corrections.reduce((m, c) => Math.max(m, c.id || 0), 0) + 1;
      const corr = { id: newId, type: cat.label, comment: text, edited: true };
      if (original) corr.original = original;
      corrections.push(corr);
      state.currentEssay.corrections = corrections;
      persistEdits();
      Renderer.render(state.currentEssay);
      applyEditMode();
      resetAddBar();
    });
    bar.querySelector('.add-text').focus();
  }

  let pendingSelectionText = '';
  function initSelectionAnnotation() {
    const btn = document.getElementById('selectionAddBtn');
    if (!btn) return;

    document.addEventListener('selectionchange', () => {
      if (!state.annotationEditing) { btn.hidden = true; pendingSelectionText = ''; return; }
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (!sel || sel.isCollapsed || !text) { btn.hidden = true; pendingSelectionText = ''; return; }
      const node = sel.anchorNode;
      const el = node ? (node.nodeType === 3 ? node.parentElement : node) : null;
      if (!el || !el.closest('.essay-text')) { btn.hidden = true; pendingSelectionText = ''; return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) { btn.hidden = true; return; }
      pendingSelectionText = text;
      btn.hidden = false;
      btn.style.top = Math.max(8, rect.top - 46) + 'px';
      btn.style.left = (rect.left + rect.width / 2) + 'px';
    });

    btn.addEventListener('mousedown', (e) => e.preventDefault());

    btn.addEventListener('click', () => {
      const txt = pendingSelectionText;
      btn.hidden = true;
      pendingSelectionText = '';
      if (window.getSelection) window.getSelection().removeAllRanges();
      if (txt) addAnnotation(txt);
    });
  }

  function resetAddBar() {
    els.commentAddBar.innerHTML = '<button class="comment-add-btn" id="addAnnotationBtn">+ 添加自定义批注</button>';
    document.getElementById('addAnnotationBtn').addEventListener('click', addAnnotation);
  }

  function persistEdits() {
    if (state.currentEssay) Storage.Current.set(state.currentEssay);
  }

  // ===========================
  // 分享
  // ===========================
  function generateShareData(data) {
    const id = Storage.History.add(data);
    return {
      id,
      url: location.origin + location.pathname + '?id=' + id,
      text: `我用 AI 批改了英语作文《${data.title || '我的作文'}》，总分 ${data.scores?.total || '--'}，查看批改结果：${location.origin + location.pathname + '?id=' + id}`,
    };
  }

  function doShare() {
    if (!state.currentEssay) {
      toast('没有可分享的内容', 'warning');
      return;
    }

    const shareData = generateShareData({
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

      if (action === 'copy') {
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
  // 历史记录面板
  // ===========================
  function formatHistoryDate(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function renderHistoryPanel() {
    const list = els.historyList;
    if (!list) return;
    const records = Storage.History.list();
    if (!records.length) {
      list.innerHTML = '';
      if (els.historyEmpty) els.historyEmpty.hidden = false;
      return;
    }
    if (els.historyEmpty) els.historyEmpty.hidden = true;
    list.innerHTML = records.map(r => {
      const wc = Renderer.countWords(r.text || '');
      const total = (r.scores && r.scores.total != null) ? r.scores.total : '--';
      const name = r.studentName ? ` · ${Renderer.escapeHtml(r.studentName)}` : '';
      return `
        <div class="history-item" data-id="${r.id}">
          <div class="history-item-main" data-action="load">
            <div class="history-item-title">${Renderer.escapeHtml(r.title || '未命名作文')}${name}</div>
            <div class="history-item-meta">${formatHistoryDate(r.createdAt)} · ${wc} 词 · 总分 ${total}</div>
          </div>
          <div class="history-item-actions">
            <button class="history-btn" data-action="rename" data-id="${r.id}" title="重命名">✎</button>
            <button class="history-btn history-btn-del" data-action="delete" data-id="${r.id}" title="删除">🗑</button>
          </div>
        </div>`;
    }).join('');
  }

  function loadHistoryRecord(id) {
    const record = Storage.History.get(id);
    if (!record) {
      toast('记录不存在或已被删除', 'warning');
      renderHistoryPanel();
      return;
    }
    state.currentEssay = record;
    Storage.Current.set(record);
    Renderer.render(record);
    showState('result');
  }

  function renameHistory(id) {
    const record = Storage.History.get(id);
    if (!record) return;
    openPromptDialog({
      title: '重命名批改记录',
      value: record.title || '',
      placeholder: '给这条批改记录起个名字',
      onConfirm: (newTitle) => {
        if (!newTitle) {
          toast('名称不能为空', 'warning');
          return;
        }
        Storage.History.rename(id, newTitle);
        renderHistoryPanel();
        toast('已重命名', 'success', 1500);
      },
    });
  }

  function deleteHistory(id) {
    openConfirmDialog({
      title: '删除记录',
      message: '确定删除这条历史记录吗？此操作不可撤销。',
      confirmText: '删除',
      danger: true,
      onConfirm: () => {
        Storage.History.remove(id);
        renderHistoryPanel();
      },
    });
  }

  function clearHistory() {
    openConfirmDialog({
      title: '清空历史',
      message: '确定清空全部历史记录吗？此操作不可撤销。',
      confirmText: '清空',
      danger: true,
      onConfirm: () => {
        Storage.History.clear();
        renderHistoryPanel();
      },
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
    els.backBtn.addEventListener('click', () => {
      if (els.essayResult.hidden) {
        return;
      }
      if (confirm('确定要返回吗？当前批改结果会保留在历史中')) {
        showState('empty');
        Storage.Current.clear();
      }
    });

    els.settingsBtn.addEventListener('click', openSettings);
    document.querySelectorAll('[data-close-drawer]').forEach(el => {
      el.addEventListener('click', closeSettings);
    });
    els.providerSelect.addEventListener('change', (e) => {
      updateProviderFields(e.target.value);
    });
    els.saveSettingsBtn.addEventListener('click', saveSettings);
    els.testApiBtn.addEventListener('click', testApi);

    $('rubricFileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await handleRubricFile(file);
    });

    $('rubricTemplates').addEventListener('click', (e) => {
      const btn = e.target.closest('.rubric-template-btn');
      if (!btn) return;
      const templateKey = btn.dataset.template;
      const template = RUBRIC_TEMPLATES[templateKey];
      if (template) {
        $('rubricInput').value = template;
        updateRubricState();
        $('rubricTemplates').querySelectorAll('.rubric-template-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.template === templateKey);
        });
        toast(`已填入「${btn.textContent}」评分标准`, 'success');
      }
    });

    $('rubricClearBtn').addEventListener('click', () => {
      $('rubricInput').value = '';
      $('rubricFileName').textContent = '';
      $('rubricClearBtn').hidden = true;
      $('rubricTemplates').querySelectorAll('.rubric-template-btn').forEach(b => b.classList.remove('active'));
    });

    els.emptyStartBtn.addEventListener('click', () => openInputDialog('upload'));
    els.emptyTypeBtn.addEventListener('click', () => openInputDialog('text'));
    els.emptyDemoBtn.addEventListener('click', loadSample);

    els.fab.addEventListener('click', () => openInputDialog('upload'));

    els.shareBtn.addEventListener('click', doShare);

    if (els.historyList) {
      els.historyList.addEventListener('click', (e) => {
        const item = e.target.closest('.history-item');
        if (!item) return;
        const id = item.dataset.id;
        const btn = e.target.closest('.history-btn');
        if (btn) {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === 'rename') renameHistory(id);
          else if (action === 'delete') deleteHistory(id);
          return;
        }
        loadHistoryRecord(id);
      });
    }
    const clearBtn = $('clearHistoryBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearHistory);

    els.annotationEditBtn.addEventListener('click', toggleAnnotationEditing);
    els.addAnnotationBtn.addEventListener('click', addAnnotation);
    bindCommentEditing();

    els.overallHelp.addEventListener('click', showEncouragement);

    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', () => {
        if (els.helpModal) els.helpModal.hidden = true;
      });
    });
  }

  // ===========================
  // 可拖动分隔条
  // ===========================
  function initSplitter() {
    const grid = document.getElementById('correctionGrid');
    const splitter = document.getElementById('gridSplitter');
    if (!grid || !splitter) return;

    const KEY = 'eg_layout_colLeft';
    const MIN = 20;
    const MAX = 80;
    const FALLBACK = 55;

    const currentPct = () => {
      const v = parseFloat(getComputedStyle(grid).getPropertyValue('--col-left'));
      return isNaN(v) ? FALLBACK : v;
    };

    const saved = parseFloat(localStorage.getItem(KEY));
    if (!isNaN(saved)) grid.style.setProperty('--col-left', saved + '%');

    let dragging = false;
    let startX = 0;
    let startPct = FALLBACK;
    let gridW = 1;

    splitter.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      gridW = grid.getBoundingClientRect().width || 1;
      startPct = currentPct();
      splitter.setPointerCapture(e.pointerId);
      splitter.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    splitter.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      let pct = startPct + (dx / gridW) * 100;
      pct = Math.max(MIN, Math.min(MAX, pct));
      grid.style.setProperty('--col-left', pct + '%');
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      splitter.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem(KEY, currentPct().toFixed(2));
    };
    splitter.addEventListener('pointerup', endDrag);
    splitter.addEventListener('pointercancel', endDrag);

    splitter.addEventListener('keydown', (e) => {
      let pct = currentPct();
      if (e.key === 'ArrowLeft') pct -= 2;
      else if (e.key === 'ArrowRight') pct += 2;
      else return;
      pct = Math.max(MIN, Math.min(MAX, pct));
      grid.style.setProperty('--col-left', pct + '%');
      localStorage.setItem(KEY, pct.toFixed(2));
      e.preventDefault();
    });
  }

  // ===========================
  // 启动
  // ===========================
  function init() {
    bindEvents();
    initSelectionAnnotation();
    initSplitter();

    const current = Storage.Current.get();
    if (current && current.text) {
      state.currentEssay = current;
      Renderer.render(current);
      showState('result');
      return;
    }

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

    showState('empty');

    if (!localStorage.getItem('eg_visited')) {
      setTimeout(() => {
        toast('点击"查看示例效果"体验一下 ✨', 'info', 3500);
        localStorage.setItem('eg_visited', '1');
      }, 800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
