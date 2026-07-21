/**
 * 示例数据 - 复刻图中的"How Can We Relieve Pressure?"作文批改
 */
const SampleData = (() => {
  // 图中作文原文（已按段落分割）
  const essayText = `Today, we always under the pressure from our heavy study, teachers, parents and even ourselves, which is not good for our physical and mental health. Faced with great pressure, it is hard for us to focus on our health and study. Besides, it may result in worse situation and we can't sleep well at night.

To relieve pressure, we should face the pressure positively. In addition, you'd better share your pressure with your friends, teachers and parents who may understand and offer you some helpful suggestions. Last but not least, doing exercises is a good way to relieve pressure.

In a words, it is very important for us to reduce our pressure.`;

  // 图中的批注数据 - 使用 original 字符串匹配
  const corrections = [
    {
      id: 1,
      type: '用词不当',
      typeTag: '用词不当',
      original: 'we always under the pressure',
      corrected: 'we are always under the pressure',
      comment: "开篇点题，'always'和'even'用词精准，强调了压力的普遍性和严重性。",
      suggestion: '建议在 always 前加 be 动词',
    },
    {
      id: 2,
      type: '语法错误',
      typeTag: '语法错误',
      original: 'Faced with',
      corrected: 'Faced with',
      comment: "'Faced with'用法地道，'focus on'精准表达了压力带来的困扰。",
      suggestion: '此处用法正确，可圈可点',
    },
    {
      id: 3,
      type: '搭配错误',
      typeTag: '搭配错误',
      original: 'worse situation',
      corrected: 'a worse situation',
      comment: "使用'worse situation'形象地描绘了压力的不良后果，'sleep well'用词贴切。",
      suggestion: 'situation 此处可数，应加冠词 a',
    },
    {
      id: 4,
      type: '句式问题',
      typeTag: '句式问题',
      original: 'we should face the pressure positively',
      corrected: 'we should face the pressure positively',
      comment: '提出解决策略，positively 强调了积极面对压力的重要性。',
      suggestion: '句式自然流畅，可以更好',
    },
    {
      id: 5,
      type: '搭配建议',
      typeTag: '搭配建议',
      original: "share your pressure with your friends",
      corrected: "share your pressure with your friends",
      comment: "you'd better 建议句型使用熟练，'understand'和'offer'展现了分享压力的好处。",
      suggestion: '表达地道，可保留',
    },
    {
      id: 6,
      type: '用词建议',
      typeTag: '用词建议',
      original: 'doing exercises',
      corrected: 'doing exercise',
      comment: "'Last but not least'承上启下，'doing exercises'作为减压方式，实用具体。",
      suggestion: 'exercise 表示抽象锻炼时不可数',
    },
    {
      id: 7,
      type: '小错误',
      typeTag: '小错误',
      original: 'In a words',
      corrected: 'In a word',
      comment: '应为 \'In a word\'，小错误但不影响整体理解，强调了减压的重要性。',
      suggestion: 'In a word 是固定搭配',
    },
  ];

  // 总评
  const overallComment = `这篇作文如一股清流，直接而深刻地探讨了如何缓解压力。每个段落都紧扣主题，用词精准，特别是你对于积极面对压力和分享压力的看法，让人眼前一亮。最后的小小笔误，老师相信你下次定能避免，继续加油，期待你更多佳作！`;

  // 评分
  const scores = {
    grammar: 82,
    vocabulary: 88,
    logic: 92,
    total: 87,
  };

  return {
    title: 'How Can We Relieve Pressure?',
    text: essayText,
    corrections,
    overall: overallComment,
    scores,
  };
})();

window.SampleData = SampleData;
