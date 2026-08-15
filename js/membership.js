/**
 * 会员模块（付费后才能使用 AI 批改）
 *
 * 启用条件：js/config.js 里 APP_CONFIG.MEMBERSHIP_BACKEND_URL 非空。
 * 未启用时，本模块完全不干预（app 走原有的「用户自填 API Key」流程）。
 *
 * 启用后：
 *  - 手机号登录 → 后端发 token（存 localStorage）
 *  - 批改走后端 /api/grade（后端校验会员 + 用后端的 Key 调 AI）
 *  - 会员过期/未开通时，弹「会员中心」引导登录/激活
 */
const Membership = (() => {
  const cfg = window.APP_CONFIG || {};
  const BACKEND = (cfg.MEMBERSHIP_BACKEND_URL || '').replace(/\/+$/, '');
  const PAY_QR = cfg.MEMBERSHIP_PAY_QR || '';
  const T_KEY = 'eg_member_token';
  const P_KEY = 'eg_member_phone';

  function isEnabled() { return !!BACKEND; }
  const getToken = () => localStorage.getItem(T_KEY) || '';
  const getPhone = () => localStorage.getItem(P_KEY) || '';

  // ---- 后端请求 ----
  async function api(path, method, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(BACKEND + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('请求失败 HTTP ' + res.status));
    return data;
  }

  async function login(phone) {
    const data = await api('/api/login', 'POST', { phone });
    localStorage.setItem(T_KEY, data.token);
    localStorage.setItem(P_KEY, data.phone || phone);
    return data;
  }

  function logout() {
    localStorage.removeItem(T_KEY);
    localStorage.removeItem(P_KEY);
  }

  async function status() {
    const t = getToken();
    if (!t) return { active: false, expiresAt: 0 };
    return await api('/api/status', 'GET', null, t);
  }

  async function activate(code) {
    return await api('/api/activate', 'POST', { code }, getToken());
  }

  async function grade(text, style, rubric) {
    return await api('/api/grade', 'POST', { text, style, rubric }, getToken());
  }

  // 批改统一入口：启用会员走后端，否则走原 AIGrader
  async function gradeOrDirect(text, settings) {
    if (isEnabled()) {
      return await grade(text, settings.style, settings.rubric);
    }
    return await window.AIGrader.grade(text, settings);
  }

  // ---- UI ----
  let modalResolve = null;
  let ui = null;

  function ensureUI() {
    if (ui) return;
    const style = document.createElement('style');
    style.textContent = `
      .member-modal { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; }
      .member-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.45); }
      .member-panel { position: relative; width: 92%; max-width: 380px; background: #fff; border-radius: 14px; padding: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
      .member-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
      .member-head h3 { font-size: 16px; margin: 0; }
      .member-close { border: none; background: none; font-size: 18px; cursor: pointer; color: #888; }
      .member-body p { font-size: 13px; color: #555; margin: 0 0 12px; line-height: 1.6; }
      .member-input { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; margin-bottom: 10px; box-sizing: border-box; }
      .member-input:focus { outline: none; border-color: #2563eb; }
      .member-btn { width: 100%; padding: 11px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; background: #2563eb; color: #fff; }
      .member-btn:disabled { opacity: 0.6; cursor: default; }
      .member-btn.secondary { background: #fff; color: #333; border: 1px solid #ddd; }
      .member-qr { text-align: center; margin: 8px 0 12px; }
      .member-qr img { width: 180px; height: 180px; border: 1px solid #eee; border-radius: 8px; }
      .member-qr .tip { font-size: 12px; color: #888; margin-top: 6px; }
      .member-status { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 8px; padding: 10px 12px; font-size: 13px; margin-bottom: 12px; }
      .member-status.expired { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
      .member-btn-link { display: block; margin: 10px auto 0; text-align: center; font-size: 12px; color: #888; background: none; border: none; cursor: pointer; }
      .member-btn-fab { position: fixed; right: 18px; bottom: 96px; z-index: 90; width: 44px; height: 44px; border-radius: 50%; border: none; background: #f59e0b; color: #fff; font-size: 20px; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; }
    `;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.className = 'member-modal';
    modal.id = 'memberModal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="member-mask" id="memberMask"></div>
      <div class="member-panel">
        <div class="member-head"><h3 id="memberTitle">会员中心</h3><button class="member-close" id="memberClose">✕</button></div>
        <div class="member-body" id="memberBody"></div>
      </div>`;
    document.body.appendChild(modal);

    const fab = document.createElement('button');
    fab.className = 'member-btn-fab';
    fab.id = 'memberFab';
    fab.title = '会员中心';
    fab.textContent = '🎫';
    document.body.appendChild(fab);

    ui = { modal, body: modal.querySelector('#memberBody'), title: modal.querySelector('#memberTitle'), fab };
    ui.fab.addEventListener('click', () => { openCenter(); });
    ui.modal.querySelector('#memberClose').addEventListener('click', () => { closeModal(); });
    ui.modal.querySelector('#memberMask').addEventListener('click', () => { closeModal(); });
  }

  function openModal() { ensureUI(); ui.modal.hidden = false; }
  function closeModal() {
    if (!ui) return;
    ui.modal.hidden = true;
    if (modalResolve) { const r = modalResolve; modalResolve = null; r(false); }
  }

  function fmtDate(ms) {
    if (!ms) return '—';
    const d = new Date(ms);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // 渲染登录表单
  function renderLogin() {
    ui.title.textContent = '登录';
    ui.body.innerHTML = `
      <p>请输入手机号（或任意账号），用于识别你的会员身份。</p>
      <input class="member-input" id="memberPhone" type="tel" placeholder="手机号 / 账号">
      <button class="member-btn" id="memberLoginBtn">登录</button>`;
    ui.body.querySelector('#memberLoginBtn').addEventListener('click', async () => {
      const phone = ui.body.querySelector('#memberPhone').value.trim();
      if (!phone) { ui.body.querySelector('#memberPhone').focus(); return; }
      const btn = ui.body.querySelector('#memberLoginBtn');
      btn.disabled = true; btn.textContent = '登录中...';
      try {
        await login(phone);
        if (modalResolve) { const r = modalResolve; modalResolve = null; r(true); }
        renderStatus();
      } catch (e) {
        btn.disabled = false; btn.textContent = '登录';
        alert('登录失败：' + e.message);
      }
    });
  }

  // 渲染开通 / 激活表单
  function renderActivate(expiresAt) {
    ui.title.textContent = '开通 / 续费会员';
    const expiredTip = (expiresAt && expiresAt > Date.now())
      ? `<div class="member-status">当前会员有效期至 ${fmtDate(expiresAt)}。续费将从到期日起顺延。</div>`
      : `<div class="member-status expired">${expiresAt ? '会员已于 ' + fmtDate(expiresAt) + ' 到期' : '尚未开通会员'}。开通后才能使用 AI 批改。</div>`;
    const qr = PAY_QR
      ? `<div class="member-qr"><img src="${PAY_QR}" alt="收款码"><div class="tip">请用微信/支付宝扫码付款，付款后联系老师获取激活码</div></div>`
      : `<div class="member-qr"><div class="tip" style="padding:20px 0">请付款后联系老师获取激活码</div></div>`;
    ui.body.innerHTML = `
      ${expiredTip}
      ${qr}
      <input class="member-input" id="memberCode" placeholder="输入激活码（如 XXXX-XXXX-XXXX）">
      <button class="member-btn" id="memberActivateBtn">激活</button>
      <button class="member-btn-link" id="memberLogoutBtn">退出登录</button>`;
    ui.body.querySelector('#memberActivateBtn').addEventListener('click', async () => {
      const code = ui.body.querySelector('#memberCode').value.trim();
      if (!code) { ui.body.querySelector('#memberCode').focus(); return; }
      const btn = ui.body.querySelector('#memberActivateBtn');
      btn.disabled = true; btn.textContent = '激活中...';
      try {
        await activate(code);
        if (modalResolve) { const r = modalResolve; modalResolve = null; r(true); }
        renderStatus();
      } catch (e) {
        btn.disabled = false; btn.textContent = '激活';
        alert('激活失败：' + e.message);
      }
    });
    ui.body.querySelector('#memberLogoutBtn').addEventListener('click', () => { logout(); renderLogin(); });
  }

  // 渲染已开通状态
  async function renderStatus() {
    ui.title.textContent = '会员中心';
    try {
      const s = await status();
      if (s.active) {
        ui.body.innerHTML = `
          <div class="member-status">✅ 会员有效</div>
          <p>当前账号：${escapeHtml(getPhone())}<br>会员有效期至：<b>${fmtDate(s.expiresAt)}</b></p>
          <button class="member-btn secondary" id="memberRenewBtn">续费 / 延长</button>
          <button class="member-btn-link" id="memberLogoutBtn2">退出登录</button>`;
        ui.body.querySelector('#memberRenewBtn').addEventListener('click', () => renderActivate(s.expiresAt));
        ui.body.querySelector('#memberLogoutBtn2').addEventListener('click', () => { logout(); renderLogin(); });
      } else {
        renderActivate(s.expiresAt || 0);
      }
    } catch (e) {
      logout();
      renderLogin();
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // 打开会员中心（点击会员按钮时）
  async function openCenter() {
    ensureUI();
    if (!getToken()) { renderLogin(); }
    else { await renderStatus(); }
    openModal();
  }

  // 供批改流程调用：确保已登录且会员有效
  async function ensureActive() {
    if (!isEnabled()) return true;
    if (!getToken()) {
      const ok = await showLoginAndWait();
      if (!ok) return false;
      try { const s = await status(); if (s.active) return true; }
      catch (e) { return false; }
      return await showActivateAndWait();
    }
    try {
      const s = await status();
      if (s.active) return true;
      return await showActivateAndWait();
    } catch (e) {
      return await showLoginAndWait();
    }
  }

  function showLoginAndWait() {
    return new Promise((resolve) => {
      ensureUI();
      renderLogin();
      openModal();
      modalResolve = resolve;
    });
  }

  function showActivateAndWait() {
    return new Promise((resolve) => {
      ensureUI();
      renderActivate(0);
      openModal();
      modalResolve = resolve;
    });
  }

  function init() {
    if (!isEnabled()) return;
    ensureUI();
    // 会员模式：隐藏设置里的 API Key 输入（用户无需填 Key，AI 由后端代理）
    const apiKeyGroup = document.getElementById('apiKeyGroup');
    if (apiKeyGroup) apiKeyGroup.style.display = 'none';
    // 静默恢复：有 token 则刷新状态（不打断）
    if (getToken()) { status().catch(() => {}); }
  }

  return { isEnabled, login, logout, status, activate, grade, gradeOrDirect, ensureActive, init, getToken, getPhone, openCenter };
})();

window.Membership = Membership;
