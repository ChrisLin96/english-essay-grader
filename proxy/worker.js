/**
 * Cloudflare Worker —— DeepSeek CORS 代理
 *
 * 用途：纯静态前端在大陆网络下，浏览器直连 api.deepseek.com 会被跨域(CORS)拦截；
 *       本 Worker 在服务端转发请求并补上 CORS 头，解决该问题。
 *
 * 【重要】部署到 Cloudflare 编辑器时：
 *   请先用 Ctrl+A 全选并【清空】编辑器里默认模板的所有代码，
 *   再【完整粘贴】本文件的全部内容（确保只有一个 export default），然后点 Deploy。
 *   若文件里出现两个 export default，会报
 *   "Identifier 'default' has already been declared" 语法错误。
 *
 * 部署步骤：
 *   1. 登录 https://dash.cloudflare.com → Workers & Pages → Create application → Create Worker
 *   2. 清空默认代码，粘贴本文件全部内容 → Deploy
 *   3. 记下分配的地址，如 https://ds-proxy.<子域>.workers.dev
 *   4. 在应用的 js/config.js 里把 baseUrlOverrides.deepseek 改成上面的地址
 *
 * 安全：仅转发到 api.deepseek.com，不存储 Key。生产环境建议把 ALLOWED_ORIGIN
 *      改为你的 CloudStudio 域名以限制来源。
 */

const UPSTREAM = 'https://api.deepseek.com';
const ALLOWED_ORIGIN = '*';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 预检请求（CORS 跨域前的 OPTIONS）
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 转发到上游：保留原始 path（如 /chat/completions）与查询参数
    const target = UPSTREAM + url.pathname + url.search;

    // 复制请求头并去掉 host（避免上游校验失败；不要直接 request.headers.delete，
    // 因为 Request 的 headers 不可变会抛错）
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (key.toLowerCase() === 'host') continue;
      headers.set(key, value);
    }

    const upstreamRequest = new Request(target, {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'follow',
    });

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(upstreamRequest);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: '代理转发失败：' + err.message }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          },
        }
      );
    }

    // 补回 CORS 头后返回给前端
    const outHeaders = new Headers(upstreamResponse.headers);
    outHeaders.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: outHeaders,
    });
  },
};
