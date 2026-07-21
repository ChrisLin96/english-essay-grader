/**
 * 导出模块
 * 支持将批改结果导出为图片
 */
const Exporter = (() => {
  /**
   * 将批改结果 DOM 转换为图片
   * @param {HTMLElement} element - 要导出的元素
   * @param {Object} options - 配置
   * @returns {Promise<Blob>} PNG Blob
   */
  async function exportToImage(element, options = {}) {
    if (typeof html2canvas === 'undefined') {
      throw new Error('html2canvas 库未加载');
    }

    const { scale = 2, bgColor = '#ffffff' } = options;

    // 添加导出模式类
    document.body.classList.add('export-mode');

    try {
      const canvas = await html2canvas(element, {
        scale,
        backgroundColor: bgColor,
        useCORS: true,
        logging: false,
        windowWidth: 720,
      });

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('图片生成失败'));
        }, 'image/png');
      });
    } finally {
      document.body.classList.remove('export-mode');
    }
  }

  /**
   * 触发下载
   */
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `英语作文批改-${formatDate()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * 复制图片到剪贴板
   */
  async function copyToClipboard(blob) {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('当前浏览器不支持剪贴板图片');
    }
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob }),
    ]);
  }

  /**
   * 生成分享链接（保存到本地存储，跨设备无法访问）
   * 注：纯前端无法实现真正跨设备分享
   */
  function generateShareData(data) {
    const id = Storage.History.add(data);
    return {
      id,
      url: location.origin + location.pathname + '?id=' + id,
      text: `我用 AI 批改了英语作文《${data.title || '我的作文'}》，总分 ${data.scores?.total || '--'}，查看批改结果：${location.origin + location.pathname + '?id=' + id}`,
    };
  }

  function formatDate() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  return { exportToImage, download, copyToClipboard, generateShareData };
})();

window.Exporter = Exporter;
