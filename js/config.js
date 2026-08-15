/**
 * 应用配置（可自由编辑，不影响核心逻辑）
 *
 * ⚠️ 关于 API Key：本应用不内置任何 Key。用户必须在「设置 - API Key」中
 * 填入自己的 Key（保存在本地浏览器 localStorage），否则 AI 批改 / 看图识字不可用。
 * 纯前端站点无法安全保管 Key，请勿在此处写入任何 Key。
 *
 * baseUrlOverrides：各服务商的 API Base URL 覆盖（部署者配置，普通用户无需在设置里填写）。
 * 用途：在大陆网络下，把请求指向你自己的 CORS 代理地址，从而绕过浏览器跨域限制。
 * 例： deepseek: 'https://你的代理地址（需 https）'
 * 保留占位符 PASTE_YOUR_PROXY_URL_HERE 或留空，表示使用各服务商内置的官方地址。
 */
window.APP_CONFIG = {
  // ============ 会员 / 付费（可选）============
  // 填上会员后端 Worker 的地址后，应用进入「付费会员」模式：
  //   - 用户用手机号登录，未开通会员则锁住 AI 批改
  //   - 批改改由后端代理（用后端的 AI Key），用户无需再填 Key
  // 留空（''）则完全关闭会员功能，走原有的「用户自填 API Key」免费模式。
  // 部署步骤见 DEPLOY_GUIDE.md。
  MEMBERSHIP_BACKEND_URL: '',
  // 收款码图片地址（可选）：显示在「开通会员」弹窗里，供用户扫码付款。
  // 可填图片 URL，例如 'https://你的图床/收款码.png'；留空则只显示文字提示。
  MEMBERSHIP_PAY_QR: '',

  // 各服务商的 API Base URL 覆盖（部署者配置，普通用户无需在设置里填写）。
  // 用途：在大陆网络下，把请求指向你自己的 CORS 代理地址，从而绕过浏览器跨域限制。
  // 例： deepseek: 'https://你的代理地址（需 https）'
  // 保留占位符 PASTE_YOUR_PROXY_URL_HERE 或留空，表示使用各服务商内置的官方地址。
  baseUrlOverrides: {
    deepseek: 'PASTE_YOUR_PROXY_URL_HERE',
  },
};
