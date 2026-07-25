# DeepSeek CORS 代理（解决大陆网络 + 浏览器跨域）

英语作文批改应用是纯静态前端，浏览器直连 `api.deepseek.com` 会被 **跨域(CORS)** 拦截；在大陆网络下直连 Gemini 也会被墙。本目录提供两个代理实现，让你在大陆也能用 DeepSeek（需账户有效余额，无永久免费模型）。

## 原理
前端把请求发给你的代理（可跨域 / 同源），代理**在服务端**带 Key 调用 `api.deepseek.com`（大陆可直连、快且便宜），再把结果回传并补上 CORS 头。

## 使用前：在 config.js 配置代理地址
设置界面已不暴露 Base URL（对学生更简洁）。部署者请在 `js/config.js` 的 `baseUrlOverrides.deepseek` 填入你的**代理地址**（替换占位符 `PASTE_YOUR_PROXY_URL_HERE`）。应用会自动读取它作为 DeepSeek 的请求地址。

---

## 方案 A：Cloudflare Worker（免费、自带 HTTPS，门槛最低）

1. 注册 https://dash.cloudflare.com/ （免费）
2. 左侧 Workers & Pages → Create → Worker → 粘贴 `worker.js` 内容 → Deploy
3. 记下分配的地址，如 `https://ds-proxy.<你的子域>.workers.dev`
4. config.js 里 `baseUrlOverrides.deepseek` 填这个地址
5. 点「测试连接」验证

⚠️ 注意：Cloudflare 在大陆部分地区可能被限速 / 不稳定。若体验差，改用方案 B。

---

## 方案 B：自有服务器（最稳，需一台国内 / 香港服务器）

1. 把 `server.js` 上传到服务器
2. 安装 Node.js，运行：`node server.js`（默认监听 8787，可用 `PORT=9000` 改端口）
3. 用 Nginx / Caddy 为该端口配置 **HTTPS 域名**（浏览器要求以 https 调用，否则混合内容被拦）
4. config.js 里 `baseUrlOverrides.deepseek` 填 `https://你的域名`
5. 点「测试连接」验证

安全：代理仅转发到 `api.deepseek.com`，不存储 Key；建议把 `ALLOWED_ORIGIN` 环境变量设为你的 CloudStudio 域名以限制来源。

---

## 验证
在 config.js 配好代理地址，并在设置里填好 DeepSeek Key → 点「测试连接」。返回成功即说明代理生效，之后批改、AI 看图识字都能正常用。
