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
  // 各服务商的 API Base URL 覆盖（部署者配置，普通用户无需在设置里填写）。
  // 用途：在大陆网络下，把请求指向你自己的 CORS 代理地址，从而绕过浏览器跨域限制。
  // 例： deepseek: 'https://你的代理地址（需 https）'
  // 保留占位符 PASTE_YOUR_PROXY_URL_HERE 或留空，表示使用各服务商内置的官方地址。
  baseUrlOverrides: {
    deepseek: 'PASTE_YOUR_PROXY_URL_HERE',
  },
};
