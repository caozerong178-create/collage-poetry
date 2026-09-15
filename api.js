// api.js — 模拟的图片/文本关键词提取工具（客户端演示用）

(function () {
  // 模拟从图片 dataURL 或 Blob 提取关键词。
  // 在真实项目中，请把此函数替换为调用后端 API 的实现。
  window.simulateKeywordExtraction = function (imageDataUrl) {
    return new Promise((resolve) => {
      // 模拟短暂延迟
      setTimeout(() => {
        // 简单的随机关键词集合（演示）
        const candidates = ['诗意', '清晨', '光影', '流浪', '思考', '梦境', '远方', '回忆', '时间', '永恒', '城市', '海洋', '天空', '孤独'];
        // 随机选 4-7 个
        const n = 4 + Math.floor(Math.random() * 4);
        const keywords = [];
        while (keywords.length < n) {
          const k = candidates[Math.floor(Math.random() * candidates.length)];
          if (!keywords.includes(k)) keywords.push(k);
        }
        resolve(keywords);
      }, 800 + Math.random() * 800);
    });
  };

  // 将文件（File）或 dataURL 转换成 dataURL（如果已经是 dataURL 则直接返回）
  window.fileToDataUrl = function (file) {
    return new Promise((resolve, reject) => {
      if (typeof file === 'string' && file.startsWith('data:')) return resolve(file);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 简单的文本关键词提取（演示版）
  // 支持中文和英文：
  // - 对英文按单词分割并统计词频（去停用词）
  // - 对中文按字或二元切分并统计
  window.extractKeywordsFromText = function (text, maxKeywords = 6) {
    if (!text || typeof text !== 'string') return [];

    // 清洗
    const cleaned = text.replace(/[\n\r]+/g, ' ').trim();
    if (!cleaned) return [];

    // 简单英文处理
    const englishWords = cleaned.match(/[A-Za-z]{2,}/g) || [];
    const chineseChars = cleaned.match(/[\u4e00-\u9fff]/g) || [];

    const scores = {};

    // 停用词（英文）
    const stopwords = new Set(['the','and','for','that','with','this','from','have','not','but','you','your','are','was','were','they','their','will','shall','can','could','should','a','an','in','on','at','by','of','to','is','it','as','be','or']);

    englishWords.forEach(w => {
      const key = w.toLowerCase();
      if (stopwords.has(key) || key.length < 3) return;
      scores[key] = (scores[key] || 0) + 1;
    });

    // 对中文，用单字与双字短语结合计数
    for (let i = 0; i < chineseChars.length; i++) {
      const unigram = chineseChars[i];
      scores[unigram] = (scores[unigram] || 0) + 1.0;
      if (i < chineseChars.length - 1) {
        const bigram = chineseChars[i] + chineseChars[i + 1];
        scores[bigram] = (scores[bigram] || 0) + 1.5; // 双字词权重略高
      }
    }

    // 还可以考虑按词位置给分（靠前的词略高） — 简化处理省略

    // 将 scores 转为数组并按得分/长度排序
    const entries = Object.entries(scores)
      .map(([k, v]) => ({ k, score: v }))
      .sort((a, b) => {
        // 优先得分，再按长度（偏好更长的词），最后按字典
        if (b.score !== a.score) return b.score - a.score;
        if (b.k.length !== a.k.length) return b.k.length - a.k.length;
        return a.k.localeCompare(b.k);
      });

    // 过滤掉非常短或不合理的候选
    const filtered = entries.map(e => e.k).filter(k => {
      if (/^[A-Za-z]+$/.test(k) && k.length < 3) return false;
      if (/^[\u4e00-\u9fff]+$/.test(k) && k.length === 1) return true; // 单字也可能有意义
      return true;
    });

    const result = Array.from(new Set(filtered)).slice(0, maxKeywords);
    return result;
  };

})();
