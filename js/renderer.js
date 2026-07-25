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

    document.getElementById('essayTitle').textContent = title;

    const wordCount = countWords(text);
    document.getElementById('wordCount').textContent = wordCount;

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

    renderEssayText(text, corrections);
    renderCommentList(corrections);
    renderLegend(corrections);
    renderOverall(overall);
    renderScores(scores, maxScores);
    bindCorrectionsInteraction();
  }

  /**
   * 统计英文单词数
   */
  function countWords(text) {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }

  /**
   * 渲染原文，按 corrections 标注错误位置
   */
  function renderEssayText(text, corrections) {
    const container = document.getElementById('essayText');
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    let html = '';
    paragraphs.forEach((para, pIdx) => {
      html += '<p>' + highlightParagraph(para, corrections) + '</p>';
    });
    container.innerHTML = html;
  }

  /**
   * 在一个段落中标记错误位置
   */
  function highlightParagraph(para, corrections) {
    if (!corrections.length) return escapeHtml(para);

    const matches = findMatchesInParagraph(para, corrections);
    if (!matches.length) return escapeHtml(para);

    matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    const merged = mergeOverlaps(matches);

    let html = '';
    let cursor = 0;
    merged.forEach(m => {
      if (m.start > cursor) {
        html += escapeHtml(para.slice(cursor, m.start));
      }
      const markClass = 'error-mark';
      const colorVars = `style="--mark-color:${m.color};--mark-bg:${hexToRgba(m.color, 0.12)};--mark-bg-strong:${hexToRgba(m.color, 0.26)}"`;
      html += `<span class="${markClass}" ${colorVars} data-correction-id="${m.id}" data-start="${m.start}" data-end="${m.end}">`;
      html += `<span class="error-num">${m.id}</span>`;
      html += escapeHtml(para.slice(m.start, m.end));
      html += '</span>';
      cursor = m.end;
    });
    if (cursor < para.length) {
      html += escapeHtml(para.slice(cursor));
    }
    return html;
  }

  /**
   * 在段落中查找错误位置
   */
  function findMatchesInParagraph(para, corrections) {
    const matches = [];
    let paraOffset = 0;

    corrections.forEach(c => {
      let start = -1, end = -1;

      if (typeof c.start === 'number' && typeof c.end === 'number') {
        if (c.start >= paraOffset && c.end <= paraOffset + para.length) {
          start = c.start - paraOffset;
          end = c.end - paraOffset;
        }
      }

      if (start < 0 && c.original) {
        const idx = para.indexOf(c.original);
        if (idx >= 0) {
          start = idx;
          end = idx + c.original.length;
        }
      }

      if (start >= 0 && end > start) {
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
        return;
      }
      result.push(m);
    });
    return result;
  }

  /**
   * 构建单条批注卡片的内部 HTML
   */
  function buildCommentInner(c) {
    const color = colorForType(c.type);
    const cat = TYPE_COLORS.find(t => t.color === color) || TYPE_COLORS[TYPE_COLORS.length - 1];
    const opts = TYPE_COLORS.map(t =>
      `<option value="${t.key}" ${t.key === cat.key ? 'selected' : ''}>${t.label}</option>`
    ).join('');
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
   */
  function renderCommentList(corrections) {
    const list = document.getElementById('commentList');
    if (!corrections.length) {
      list.innerHTML = '<div class="comment-empty-msg">🎉 没有发现错误，作文非常棒！</div>';
      return;
    }

    list.innerHTML = corrections.map(c => {
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
   */
  function renderLegend(corrections) {
    const bar = document.getElementById('legendBar');
    if (!bar) return;
    if (!corrections || !corrections.length) {
      bar.hidden = true;
      return;
    }
    const seen = new Map();
    corrections.forEach(c => {
      const color = colorForType(c.type);
      const label = (TYPE_COLORS.find(t => t.color === color) || TYPE_COLORS[TYPE_COLORS.length - 1]).label;
      if (!seen.has(label)) seen.set(label, color);
    });
    let html = '<span class="legend-title">标注类型</span>';
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
   */
  function renderScores(scores, maxScores) {
    const scoreCardsContainer = document.getElementById('scoreCards');

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

    function getMax(key) {
      if (maxScores && maxScores[key] != null) return maxScores[key];
      return maxScores && maxScores._default != null ? maxScores._default : 100;
    }

    const defaultMax = getMax('_default');

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
   */
  function humanizeKey(key) {
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
    return key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  }

  /**
   * 绑定错误标注和批注的交互
   */
  function bindCorrectionsInteraction() {
    document.querySelectorAll('.error-mark').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.correctionId;
        scrollToComment(id);
        highlightPair(id);
      });
    });

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
