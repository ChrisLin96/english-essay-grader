/**
 * OCR 文字识别模块
 * 使用 Tesseract.js 在浏览器中识别图片中的英文。
 * 注意：本地 OCR 对印刷体尚可，对手写体/低质量拍照较弱；
 *       主路径是 AI 视觉识别（见 app.js 的 ocrImageToText），本模块仅作兜底。
 */
const OCR = (() => {
  let worker = null;
  let initialized = false;

  /**
   * 初始化 Tesseract Worker
   */
  async function init(progressCallback) {
    if (initialized && worker) return worker;
    if (typeof Tesseract === 'undefined') {
      throw new Error('Tesseract.js 未加载');
    }
    try {
      worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (progressCallback && m.status) {
            progressCallback({ status: m.status, progress: m.progress || 0 });
          }
        },
      });
      // 针对一段/一页作文文本，使用「统一文本块」分割模式（psm=6）更稳
      try { await worker.setParameters({ tessedit_pageseg_mode: 6 }); } catch (e) {}
      initialized = true;
      return worker;
    } catch (e) {
      console.error('Tesseract init error:', e);
      throw new Error('OCR 初始化失败：' + e.message);
    }
  }

  // 把 Blob/File/dataURL 载入为 canvas（保留原始尺寸，便于后续增强）
  function loadToCanvas(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const isBlob = src instanceof Blob || src instanceof File;
      const url = isBlob ? URL.createObjectURL(src) : src;
      img.onload = () => {
        if (isBlob) URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => {
        if (isBlob) URL.revokeObjectURL(url);
        reject(new Error('图片加载失败'));
      };
      img.src = url;
    });
  }

  // 灰度 + 对比度增强：显著提升 Tesseract 对低质量/拍照/扫描图的表现
  function enhanceCanvas(canvas, contrast = 1.5) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      g = (g - 128) * contrast + 128;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      d[i] = d[i + 1] = d[i + 2] = g;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  /**
   * 识别图片中的英文（含灰度+对比度预处理）
   */
  async function recognize(image, progressCallback) {
    try {
      await init(progressCallback);
      if (!worker) throw new Error('Worker 初始化失败');
      const canvas = await loadToCanvas(image);
      enhanceCanvas(canvas);
      const { data } = await worker.recognize(canvas);
      return cleanText(data.text || '');
    } catch (e) {
      console.error('OCR recognize error:', e);
      throw new Error('OCR 识别失败：' + e.message);
    }
  }

  /**
   * 清理识别出的文本
   */
  function cleanText(text) {
    if (!text) return '';
    let cleaned = text;
    // 合并同一段落内的换行（处理单词被换行截断的情况）
    cleaned = cleaned.replace(/([a-zA-Z0-9,.])\n([a-zA-Z])/g, '$1 $2');
    // 合并多余空白
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();
    return cleaned;
  }

  /**
   * 终止 worker 释放内存
   */
  async function terminate() {
    if (worker) {
      try { await worker.terminate(); } catch (e) {}
      worker = null;
      initialized = false;
    }
  }

  /**
   * 从 File 对象读取为 dataURL
   */
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsDataURL(file);
    });
  }

  /**
   * 压缩/预处理图片：
   * - 提高分辨率上限与质量，让 AI 视觉看得更清；
   * - 白底（避免透明 PNG 变黑）+ 轻度对比度增强（对本地 OCR 有帮助）。
   */
  async function compressImage(file, maxWidth = 2000, quality = 0.9) {
    if (!file.type.startsWith('image/')) return file;
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const ratio = Math.min(1, maxWidth / img.width);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        // 轻度增强（对 AI 视觉影响小，对本地 OCR 略有帮助）
        try {
          ctx.filter = 'contrast(1.2) brightness(1.03)';
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';
        } catch (e) {}
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  }

  return { recognize, terminate, fileToDataURL, compressImage };
})();

window.OCR = OCR;
