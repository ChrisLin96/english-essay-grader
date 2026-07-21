/**
 * 批改结果渲染器
 * 负责把结构化的批改数据渲染成界面
 */
const Renderer = (() => {
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
    } = data;

    // 更新标题
    document.getElementById('essayTitle').textContent = title;

    // 字数统计
    const wordCount = countWords(text);
    document.getElementById('wordCount').textContent = wordCount;

    // 渲染原文（带错误标注）
    renderEssayText(text, corrections);

    // 渲染批注列表
    renderCommentList(corrections);

    // 渲染总评
    renderOverall(overall);

    // 渲染评分卡
    renderScores(scores);

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
      // 错误标记
      html += `<span class="error-mark" data-correction-id="${m.id}" data-start="${m.start}" data-end="${m.end}">`;
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
        matches.push({ id: c.id, start, end });
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
   * 渲染批注列表（右侧）
   */
  function renderCommentList(corrections) {
    const list = document.getElementById('commentList');
    if (!corrections.length) {
      list.innerHTML = '<div class="comment-item"><div class="comment-content">🎉 没有发现错误，作文非常棒！</div></div>';
      return;
    }

    list.innerHTML = corrections.map(c => {
      // 优先用真实的 start/end，没有就传 0（不影响显示）
      const start = c.start || 0;
      const end = c.end || 0;
      return `
        <div class="comment-item" data-correction-id="${c.id}" data-start="${start}" data-end="${end}">
          ${c.typeTag ? `<span class="comment-tag">${escapeHtml(c.typeTag)}</span>` : ''}
          <div class="comment-content">${escapeHtml(c.comment || '')}</div>
        </div>
      `;
    }).join('');
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
  function renderScores(scores) {
    const scoreCardsContainer = document.getElementById('scoreCards');

    // 评分维度的中文映射
    const SCORE_LABELS = {
      grammar: '语法',
      vocabulary: '词汇',
      logic: '逻辑',
      total: '总分',
      // 雅思
      taskAchievement: '任务完成',
      coherence: '连贯衔接',
      lexicalResource: '词汇资源',
      grammaticalRange: '语法范围',
      // 托福
      development: '论点发展',
      organization: '结构组织',
      languageUse: '语言使用',
      // 大学
      coherence_1: '连贯',
      innovation: '创新',
      expression: '表达',
      format: '格式',
    };

    // 判断是否是默认四维评分
    const keys = Object.keys(scores);
    const isDefault = keys.length === 4 && keys.includes('grammar') && keys.includes('vocabulary') && keys.includes('logic') && keys.includes('total');

    if (isDefault) {
      // 默认四维：使用原有 HTML 结构
      document.getElementById('scoreGrammar').textContent = scores.grammar ?? '--';
      document.getElementById('scoreVocab').textContent = scores.vocabulary ?? '--';
      document.getElementById('scoreLogic').textContent = scores.logic ?? '--';
      document.getElementById('scoreTotal').textContent = scores.total ?? '--';
      // 确保 scoreCards 使用默认 HTML
      scoreCardsContainer.innerHTML = buildDefaultScoreCardsHTML(scores);
    } else {
      // 自定义维度：动态生成评分卡
      scoreCardsContainer.innerHTML = buildDynamicScoreCardsHTML(scores, SCORE_LABELS);
    }
  }

  /**
   * 构建默认四维评分卡 HTML
   */
  function buildDefaultScoreCardsHTML(scores) {
    return `
      <div class="score-card">
        <div class="score-value">${scores.grammar ?? '--'}</div>
        <div class="score-label">语法</div>
      </div>
      <div class="score-card">
        <div class="score-value">${scores.vocabulary ?? '--'}</div>
        <div class="score-label">词汇</div>
      </div>
      <div class="score-card">
        <div class="score-value">${scores.logic ?? '--'}</div>
        <div class="score-label">逻辑</div>
      </div>
      <div class="score-card score-card-main">
        <div class="score-value">${scores.total ?? '--'}</div>
        <div class="score-label">总分</div>
      </div>
    `;
  }

  /**
   * 构建动态评分维度评分卡 HTML
   */
  function buildDynamicScoreCardsHTML(scores, labels) {
    const keys = Object.keys(scores);
    // 最后一个维度作为"总分"（如果是 total 的话）
    const totalKey = keys.find(k => k.toLowerCase() === 'total');
    const otherKeys = keys.filter(k => k !== totalKey);

    let html = '';

    // 其他维度
    otherKeys.forEach(key => {
      const label = labels[key] || humanizeKey(key);
      html += `
        <div class="score-card">
          <div class="score-value">${scores[key] ?? '--'}</div>
          <div class="score-label">${escapeHtml(label)}</div>
        </div>
      `;
    });

    // 总分卡（高亮）
    if (totalKey) {
      html += `
        <div class="score-card score-card-main">
          <div class="score-value">${scores[totalKey] ?? '--'}</div>
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

    // 批注 → 错误
    document.querySelectorAll('.comment-item').forEach(el => {
      el.addEventListener('click', () => {
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

  return { render, countWords, escapeHtml };
})();

window.Renderer = Renderer;
