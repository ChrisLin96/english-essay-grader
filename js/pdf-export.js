/**
 * 导出 PDF（统一矢量打印）
 * - 桌面端与移动端均使用浏览器原生打印（window.print），生成「矢量 PDF」，
 *   文字可选中、最清晰，且两端体验一致。
 * - 打印版式由 css/print.css 的 @media print 规则控制（含页眉机构名、两栏布局等）。
 * - 代价：浏览器会在页脚自动附加页面 URL（如 …app.codebuddy.work），无法用代码去除，
 *   需在打印对话框中手动取消勾选「页眉和页脚」。
 * - 纯独立模块：仅绑定 #pdfBtn，不修改 app.js / renderer.js 逻辑。
 */
(function () {
  'use strict';

  function hasResult() {
    const el = document.getElementById('essayResult');
    return el && !el.hidden && el.innerHTML.trim().length > 0;
  }

  function exportPdf() {
    if (!hasResult()) {
      if (typeof window.toast === 'function') {
        window.toast('请先完成一次批改，再导出 PDF', 'warning');
      }
      return;
    }
    // 桌面端与移动端统一走浏览器原生矢量打印
    window.print();
  }

  function init() {
    const btn = document.getElementById('pdfBtn');
    if (!btn) return;
    btn.addEventListener('click', exportPdf);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
