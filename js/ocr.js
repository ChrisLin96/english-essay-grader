/**
 * OCR 文字识别模块
 * 使用 Tesseract.js 在浏览器中识别图片中的英文
 */
const OCR = (() => {
  let worker = null;
  let initialized = false;

  /**
   * 初始化 Tesseract Worker
   * 下载语言包，首次使用会下载约 10MB 的 eng.traineddata
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
            progressCallback({
              status: m.status,
              progress: m.progress || 0,
            });
          }
        },
      });
      initialized = true;
      return worker;
    } catch (e) {
      console.error('Tesseract init error:', e);
      throw new Error('OCR 初始化失败：' + e.message);
    }
  }

  /**
   * 识别图片中的英文
   * @param {string|HTMLImageElement|File|Blob} image - 图片源
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<string>} 识别出的英文文本
   */
  async function recognize(image, progressCallback) {
    try {
      await init(progressCallback);
      if (!worker) throw new Error('Worker 初始化失败');

      const { data } = await worker.recognize(image);
      return cleanText(data.text || '');
    } catch (e) {
      console.error('OCR recognize error:', e);
      throw new Error('OCR 识别失败：' + e.message);
    }
  }

  /**
   * 清理识别出的文本
   * - 修正常见 OCR 错误（如 "0" → "o"，"1" → "l" 等）
   * - 修正段落换行
   */
  function cleanText(text) {
    if (!text) return '';
    let cleaned = text;

    // 合并同一段落内的换行
    cleaned = cleaned.replace(/([a-z,.])\n([a-zA-Z])/g, '$1 $2');

    // 合并多余空白
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // 修剪
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * 终止 worker 释放内存
   */
  async function terminate() {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {}
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
   * 压缩图片（用于加快 OCR）
   */
  async function compressImage(file, maxWidth = 1600, quality = 0.85) {
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const ratio = Math.min(1, maxWidth / img.width);
        const w = img.width * ratio;
        const h = img.height * ratio;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  }

  return { recognize, terminate, fileToDataURL, compressImage };
})();

window.OCR = OCR;
