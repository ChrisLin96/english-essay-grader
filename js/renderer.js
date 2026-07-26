/**
 * 批改结果渲染器
 * 负责把结构化的批改数据渲染成界面
 */
const Renderer = (() => {
  /**
   * 错误类型 → 颜色分类（用于原文标注与右侧批注建议分色）
   * 原文标注与批注建议共用同一颜色，实现一一对应
   */
  const TYPE_COLORS = [
    { key: 'grammar',     color: '#EF4444', label: '语法', keywords: ['语法', '时态', '主谓', '单复数', '冠词', '语态', '虚拟', '从句', '词序', '一致'] },
    { key: 'spelling',    color: '#F59E0B', label: '拼写', keywords: ['拼写', '拼错'] },
    { key: 'vocabulary',  color: '#3B82F6', label: '词汇', keywords: ['用词', '词汇', '词性', '词义', '近义词', '选词'] },
    { key: 'collocation', color: '#10B981', label: '搭配', keywords: ['搭配', '固定搭配', '惯用'] },
    { key: 'sentence',    color: '#8B5CF6', label: '句式', keywords: ['句式', '句型', '表达', '句子结构', '语序', '结构', '改写'] },
    { key: 'logic',       color: '#06B6D4', label: '逻辑', keywords: ['逻辑', '连贯', '衔接', '过渡', '段落'] },
    { key: 'punctuation', color: '#EC4899', label: '标点', keywords: ['标点', '逗号', '句号', '引号', '分号'] },
    { key: 'other',       color: '#64748B', label: '其他', keywords: [] },
  ];

  /**
   * 根据错误类型返回对应的颜色（十六进制）
   */
  function colorForType(type) {
    if (!type) return TYPE_COLORS[TYPE_COLORS.length - 1].color;
    for (const cat of TYPE_COLORS) {
      if (cat.keywords.length && cat.keywords.some(k => type.includes(k))) {
        return cat.color;
      }
    }
    return TYPE_COLORS[TYPE_COLORS.length - 1].color;
  }

  /**
   * 把十六进制色转为 rgba（用于半透明高亮背景）
   */
  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * 渲染完整的批改结果
   * @param {Object} data - { title, text, corrections, overall, scores }
   */
  function render(data) {
    const {
      title = '英语作文批改',
      text = '',
      corrections = [],
      overall = '',
      scores = {},
      maxScores = {},
      studentName = '',
    } = data;

    // 更新标题
    document.getElementById('essayTitle').textContent = title;

    // 字数统计
    const wordCount = countWords(text);
    document.getElementById('wordCount').textContent = wordCount;

    // 学生姓名（屏幕与打印均显示）
    const resultStudent = document.getElementById('resultStudent');
    if (resultStudent) {
      if (studentName && studentName.trim()) {
        resultStudent.textContent = '学生：' + studentName.trim();
        resultStudent.hidden = false;
      } else {
        resultStudent.textContent = '';
        resultStudent.hidden = true;
      }
    }

    // 渲染原文全文（带错误标注，便于通读上下文）
    renderEssayText(text, corrections);

    // 渲染逐条批注列表（右栏，与左栏原文左右对称）
    renderCommentList(corrections);

    // 渲染颜色分类图例（一一对应说明）
    renderLegend(corrections);

    // 渲染总评
    renderOverall(overall);

    // 渲染评分卡
    renderScores(scores, maxScores);

    // 绑定交互
    bindCorrectionsInteraction();
  }

  /**
   * 统计英文单词数
   */
  function countWords(text) {
    if (!text) return 0;
    // 按空格分割，过滤空字符串
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }

  /**
   * 渲染原文，按 corrections 标注错误位置
   */
  function renderEssayText(text, corrections) {
    const container = document.getElementById('essayText');

    // 按段落分割
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

    let html = '';
    paragraphs.forEach((para, pIdx) => {
      html += '<p>' + highlightParagraph(para, corrections) + '</p>';
    });

    container.innerHTML = html;
  }

  /**
   * 在一个段落中标记错误位置
   * 算法：将段落中的所有错误区间合并，按位置顺序插入 span
   */
  function highlightParagraph(para, corrections) {
    if (!corrections.length) return escapeHtml(para);

    // 找出本段落内的错误（按 corrected / original 匹配，或按 start/end 范围）
    const matches = findMatchesInParagraph(para, corrections);
    if (!matches.length) return escapeHtml(para);

    // 排序：按 start 升序，重叠的按长度优先
    matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // 合并重叠区间（如果两个错误区间重叠，保留前者）
    const merged = mergeOverlaps(matches);

    // 构建 HTML
    let html = '';
    let cursor = 0;
    merged.forEach(m => {
      // 之前的普通文本
      if (m.start > cursor) {
        html += escapeHtml(para.slice(cursor, m.start));
      }
      // 错误标记：用该批注类型的颜色，原文标注与右侧批注共用同一颜色，完全一致
      const markClass = 'error-mark';
      const colorVars = `style="--mark-color:${m.color};--mark-bg:${hexToRgba(m.color, 0.12)};--mark-bg-strong:${hexToRgba(m.color, 0.26)}"`;
      html += `<span class="${markClass}" ${colorVars} data-correction-id="${m.id}" data-start="${m.start}" data-end="${m.end}">`;
      html += `<span class="error-num">${m.id}</span>`;
      html += escapeHtml(para.slice(m.start, m.end));
      html += '</span>';
      cursor = m.end;
    });
    // 剩余文本
    if (cursor < para.length) {
      html += escapeHtml(para.slice(cursor));
    }
    return html;
  }

  /**
   * 在段落中查找错误位置
   * 优先用 start/end，如果没有则用 original 文本匹配
   */
  function findMatchesInParagraph(para, corrections) {
    const matches = [];
    let paraOffset = 0;

    corrections.forEach(c => {
      let start = -1, end = -1;

      // 1) 如果有 start/end 且在段落内
      if (typeof c.start === 'number' && typeof c.end === 'number') {
        if (c.start >= paraOffset && c.end <= paraOffset + para.length) {
          start = c.start - paraOffset;
          end = c.end - paraOffset;
        }
      }

      // 2) 用 original 字符串匹配
      if (start < 0 && c.original) {
        const idx = para.indexOf(c.original);
        if (idx >= 0) {
          start = idx;
          end = idx + c.original.length;
        }
      }

      if (start >= 0 && end > start) {
        // 原文标注与批注建议共用同一类型颜色，一一对应
        const color = colorForType(c.type);
        matches.push({ id: c.id, start, end, color, type: c.type });
      }
    });

    return matches;
  }

  function mergeOverlaps(matches) {
    const result = [];
    matches.forEach(m => {
      const last = result[result.length - 1];
      if (last && m.start < last.end) {
        // 重叠，保留 last（更靠前）
        return;
      }
      result.push(m);
    });
    return result;
  }

  /**
   * 构建单条批注卡片的内部 HTML（工具条 + 正文 + 修改建议）
   * 同时用于「逐条左右配对」的右侧单元格
   */
  function buildCommentInner(c) {
    // 找到当前批注对应的分类（用于下拉框选中）
    const color = colorForType(c.type);
    const cat = TYPE_COLORS.find(t => t.color === color) || TYPE_COLORS[TYPE_COLORS.length - 1];
    const opts = TYPE_COLORS.map(t =>
      `<option value="${t.key}" ${t.key === cat.key ? 'selected' : ''}>${t.label}</option>`
    ).join('');
    // 「建议修改的句子」（corrected）始终渲染为可编辑区块：
    // - 有值时显示绿框建议；空值时显示占位提示，进入编辑模式后可补填。
    // 通过 .suggest-text（contenteditable，由 applyEditMode 切换）允许用户修改任意批注内容。
    const correctedTrim = (c.corrected || '').trim();
    const suggestHtml = `
      <div class="comment-suggest${correctedTrim ? '' : ' is-empty'}">
        <span class="suggest-label">修改建议</span>
        <span class="suggest-text" data-cid="${c.id}" contenteditable="false">${escapeHtml(c.corrected || '')}</span>
      </div>`;
    return `
      <div class="comment-toolbar">
        <select class="comment-type" data-cid="${c.id}" title="选择批注类型 / 颜色">
          ${opts}
        </select>
        <button class="comment-del" data-cid="${c.id}" title="删除此批注" aria-label="删除">✕</button>
      </div>
      <div class="comment-content" data-cid="${c.id}" contenteditable="false">${escapeHtml(c.comment || '')}</div>
      ${suggestHtml}`;
  }

  /**
   * 渲染「左右对称」两栏批注列表（右栏：逐条批注卡片）
   * 每张卡片左侧带与原文标注一致的编号徽标（来自 data-num，由 .comment-item::before 渲染），
   * 边框颜色也与左栏原文标注同色，实现左右一一对应。
   */
  function renderCommentList(corrections) {
    const list = document.getElementById('commentList');
    if (!corrections.length) {
      list.innerHTML = '<div class="comment-empty-msg">🎉 没有发现错误，作文非常棒！</div>';
      return;
    }

    list.innerHTML = corrections.map(c => {
      // 优先用真实的 start/end，没有就传 0（不影响显示）
      const start = c.start || 0;
      const end = c.end || 0;
      const color = colorForType(c.type);
      const colorVars = `style="--mark-color:${color};--mark-bg:${hexToRgba(color, 0.12)};--mark-bg-strong:${hexToRgba(color, 0.26)}"`;
      return `
        <div class="comment-item" ${colorVars} data-correction-id="${c.id}" data-start="${start}" data-end="${end}" data-num="${c.id}">
          ${buildCommentInner(c)}
        </div>`;
    }).join('');
  }

  /**
   * 渲染颜色分类图例
   * 展示本次批改中出现的批注类型与对应颜色，帮助理解「原文↔批注」的一一对应
   */
  function renderLegend(corrections) {
    const bar = document.getElementById('legendBar');
    if (!bar) return;
    if (!corrections || !corrections.length) {
      bar.hidden = true;
      return;
    }
    // 统计出现的分类（去重，保持首次出现顺序）
    const seen = new Map();
    corrections.forEach(c => {
      const color = colorForType(c.type);
      const label = (TYPE_COLORS.find(t => t.color === color) || TYPE_COLORS[TYPE_COLORS.length - 1]).label;
      if (!seen.has(label)) seen.set(label, color);
    });
    let html = '<span class="legend-title">标注类型</span>';
    // 原文标注与右侧批注共用此颜色，一一对应
    seen.forEach((color, label) => {
      html += `<span class="legend-item"><span class="legend-dot" style="background:${color}"></span>${escapeHtml(label)}</span>`;
    });
    bar.innerHTML = html;
    bar.hidden = false;
  }

  /**
   * 渲染总评
   */
  function renderOverall(overall) {
    document.getElementById('overallContent').textContent = overall || '（暂无总评）';
  }

  /**
   * 渲染评分卡
   * 支持动态维度（自定义评分标准可能有不同维度）
   */
  function renderScores(scores, maxScores) {
    const scoreCardsContainer = document.getElementById('scoreCards');

    // 评分维度的中文映射
    const SCORE_LABELS = {
      grammar: '语法',
      vocabulary: '词汇',
      logic: '逻辑',
      total: '总分',
      taskAchievement: '任务完成',
      coherence: '连贯衔接',
      lexicalResource: '词汇资源',
      grammaticalRange: '语法范围',
      development: '论点发展',
      organization: '结构组织',
      languageUse: '语言使用',
      coherence_1: '连贯',
      innovation: '创新',
      expression: '表达',
      format: '格式',
      content: '内容',
      language: '语言',
      communicativeAchievement: '交际能力',
    };

    // 获取各维度满分：优先用 maxScores，默认 100
    function getMax(key) {
      if (maxScores && maxScores[key] != null) return maxScores[key];
      return maxScores && maxScores._default != null ? maxScores._default : 100;
    }

    // 默认满分（用于显示）
    const defaultMax = getMax('_default');

    // 判断是否是默认四维评分
    const keys = Object.keys(scores);
    const isDefault = keys.length === 4 && keys.includes('grammar') && keys.includes('vocabulary') && keys.includes('logic') && keys.includes('total');

    if (isDefault) {
      scoreCardsContainer.innerHTML = buildDefaultScoreCardsHTML(scores, defaultMax);
    } else {
      scoreCardsContainer.innerHTML = buildDynamicScoreCardsHTML(scores, SCORE_LABELS, maxScores, defaultMax);
    }
  }

  /**
   * 构建默认四维评分卡 HTML
   */
  function buildDefaultScoreCardsHTML(scores, defaultMax) {
    // 所有评分卡只显示得分数字，不显示满分（/100）
    const fmtPlain = (val) => val != null ? `<span class="score-num">${val}</span>` : '<span class="score-num">--</span>';
    return `
      <div class="score-card">
        <div class="score-value">${fmtPlain(scores.grammar)}</div>
        <div class="score-label">语法</div>
      </div>
      <div class="score-card">
        <div class="score-value">${fmtPlain(scores.vocabulary)}</div>
        <div class="score-label">词汇</div>
      </div>
      <div class="score-card">
        <div class="score-value">${fmtPlain(scores.logic)}</div>
        <div class="score-label">逻辑</div>
      </div>
      <div class="score-card score-card-main">
        <div class="score-value">${fmtPlain(scores.total)}</div>
        <div class="score-label">总分</div>
      </div>
    `;
  }

  /**
   * 构建动态评分维度评分卡 HTML
   */
  function buildDynamicScoreCardsHTML(scores, labels, maxScores, defaultMax) {
    const keys = Object.keys(scores);
    const totalKey = keys.find(k => k.toLowerCase() === 'total');
    const otherKeys = keys.filter(k => k !== totalKey);

    function getMax(key) {
      if (maxScores && maxScores[key] != null) return maxScores[key];
      return defaultMax;
    }

    // 所有评分卡只显示得分数字，不显示满分（/100）
    const fmtPlain = (val) => val != null ? `<span class="score-num">${val}</span>` : '<span class="score-num">--</span>';

    let html = '';

    otherKeys.forEach(key => {
      const label = labels[key] || humanizeKey(key);
      html += `
        <div class="score-card">
          <div class="score-value">${fmtPlain(scores[key])}</div>
          <div class="score-label">${escapeHtml(label)}</div>
        </div>
      `;
    });

    if (totalKey) {
      html += `
        <div class="score-card score-card-main">
          <div class="score-value">${fmtPlain(scores[totalKey])}</div>
          <div class="score-label">${labels[totalKey] || '总分'}</div>
        </div>
      `;
    }

    return html;
  }

  /**
   * 把英文 key 转为可读中文标签
   * 例如 "taskAchievement" → "任务完成"
   */
  function humanizeKey(key) {
    // 尝试简单转换
    const map = {
      'taskAchievement': '任务完成',
      'coherence': '连贯',
      'cohesion': '衔接',
      'lexicalResource': '词汇',
      'grammaticalRange': '语法',
      'development': '发展',
      'organization': '组织',
      'languageUse': '语言',
      'innovation': '创新',
      'expression': '表达',
      'format': '格式',
    };
    if (map[key]) return map[key];
    // 通用处理：驼峰 → 词拆分
    return key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  }

  /**
   * 绑定错误标注和批注的交互
   * - 点击错误：滚动到对应批注并高亮
   * - 点击批注：滚动到对应错误并高亮
   */
  function bindCorrectionsInteraction() {
    // 错误 → 批注
    document.querySelectorAll('.error-mark').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.correctionId;
        scrollToComment(id);
        highlightPair(id);
      });
    });

    // 批注 → 错误（编辑模式下点击批注不跳转，允许就地编辑）
    document.querySelectorAll('.comment-item').forEach(el => {
      el.addEventListener('click', () => {
        if (document.body.classList.contains('annotation-editing')) return;
        const id = el.dataset.correctionId;
        scrollToError(id);
        highlightPair(id);
      });
    });
  }

  function scrollToComment(id) {
    const target = document.querySelector(`.comment-item[data-correction-id="${id}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function scrollToError(id) {
    const target = document.querySelector(`.error-mark[data-correction-id="${id}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function highlightPair(id) {
    document.querySelectorAll('.error-mark.active, .comment-item.active').forEach(el => {
      el.classList.remove('active');
    });
    const err = document.querySelector(`.error-mark[data-correction-id="${id}"]`);
    const cmt = document.querySelector(`.comment-item[data-correction-id="${id}"]`);
    if (err) err.classList.add('active');
    if (cmt) cmt.classList.add('active');
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return { render, countWords, escapeHtml, getCategories: () => TYPE_COLORS.map(t => ({ key: t.key, color: t.color, label: t.label })) };
})();

window.Renderer = Renderer;
