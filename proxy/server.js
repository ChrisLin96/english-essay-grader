/**
 * Node.js 版 DeepSeek CORS 代理
 *
 * 用途：与 worker.js 相同——解决大陆网络下浏览器直连 api.deepseek.com 的 CORS / 网络问题。
 *       差别：运行在你自己的服务器上（国内 / 香港节点均可直连 DeepSeek），需 Node.js 运行。
 *
 * 运行：
 *   1. 把本文件上传到服务器
 *   2. 安装 Node.js（>= 16 即可）
 *   3. 运行：  node server.js
 *      （可选）PORT=9000 node server.js  指定端口
 *      （可选）ALLOWED_ORIGIN=https://你的域名 node server.js  限制来源
 *   4. 用 Nginx / Caddy 为该端口配置 HTTPS 域名（浏览器要求以 https 调用，否则混合内容被拦）
 *   5. 应用「设置 → DeepSeek」的 baseUrl 填：https://你的域名
 *
 * 安全：
 *   - 仅转发到 api.deepseek.com，不存储任何 Key
 *   - 建议把 ALLOWED_ORIGIN 设为你的 CloudStudio 域名，避免被他人滥用
 */

const http = require('http');
const https = require('https');

const UPSTREAM_HOST = 'api.deepseek.com';
const LISTEN_PORT = process.env.PORT || 8787;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const server = http.createServer((req, res) => {
  // 处理 CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const options = {
    hostname: UPSTREAM_HOST,
    path: req.url, // 透传路径，例如 /chat/completions
    method: req.method,
    headers: { ...req.headers, host: UPSTREAM_HOST },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers, ...CORS_HEADERS };
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.writeHead(502, {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    });
    res.end(JSON.stringify({ error: '代理转发失败：' + e.message }));
  });

  req.pipe(proxyReq);
});

server.listen(LISTEN_PORT, () => {
  console.log(`DeepSeek 代理已启动：http://localhost:${LISTEN_PORT}`);
  console.log(`允许的来源(ALLOWED_ORIGIN)：${ALLOWED_ORIGIN}`);
});
