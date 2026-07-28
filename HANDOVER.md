# 英语作文批改 Web 应用 — 项目交接文档 (Handover)

> 更新日期：2026-07-28
> 项目目录：`C:\Users\Administrator\WorkBuddy\2026-07-21-11-03-21`
> GitHub 仓库：`github.com/ChrisLin96/english-essay-grader`（分支 `master`）
> 部署地址（CloudStudio 沙箱，长期稳定）：`https://c5c24b6ac4534b13a759a8668288ee5b.app.codebuddy.work`

---

## 一、项目概览

一个**纯静态**的英语作文 AI 批改 + 单词听写 Web 应用，面向 PA/老师群体做介绍会演示。无后端、无数据库，全部逻辑跑在浏览器里。

| 维度 | 说明 |
|------|------|
| 技术栈 | HTML + CSS + 原生 JS（Vanilla，无框架），`js/app.js` 顶层 IIFE 包裹，**不可拆文件** |
| 核心功能 | ① 作文 AI 批改：红圈标注错误 + 中文批注 + 总评评分；② 单词听写：拍照/多选/手动输入 + AI 朗读 |
| AI 批改 | OpenAI 兼容 API（通义/智谱/DeepSeek 等）+ Google Gemini（免费层） |
| 图片/OCR | Tesseract.js 浏览器端识别；支持视觉的服务商可 AI 直接看图识字 |
| 导出 | 浏览器原生打印 → 矢量 PDF（仅 PDF，已删除图片导出） |
| 存储 | localStorage（设置、历史记录、学生姓名、听写文本、布局宽度） |
| 评分体系 | 内置 KET / PET / FCE 三套标准（RUBRIC_TEMPLATES） |

---

## 二、必须保持的工作 ✅（做得好，继续维护）

### 架构与关键决策
1. **纯静态、无后端、localStorage 存储**
   零依赖部署，任意静态服务器/沙箱拖进去即用。符合"长期稳定可访问、国内可达"诉求。**不要引入后端。**

2. **API Key 不内置（安全策略已落地）**
   已彻底删除"内置共享 Key"机制。用户必须在「设置 - API Key」自填（存 localStorage），无 Key 时明确提示。config.js 不再有 `builtinApiKey` / `builtinProvider`。**绝不能恢复内置共享 Key。**

3. **单服务商 + 单 Key**
   批改与 AI 看图识字已合并为「一个 AI 服务商 + 一个 Key」（默认 `qwen` 多模态，可同时批改+看图）。**不要把看图拆回成独立的"图片识别服务商"区块。**

4. **左右对照布局（原文左 / 批注右）**
   批改结果始终左右对称两栏，移动端也保持左右。已删掉"切换图片视图"按钮（原是 no-op）。**保持此布局。**

### 批改与评分
5. **FCE 用剑桥官方 0–5 量规**
   Content / Communicative Achievement / Organization / Language 四维各 5 分，**总分 20（非 15）**。FCE 模板总行已注明"满分非 15 分"。**保持此口径，不要改回 15 分。**

6. **老师可编辑批注（编辑态）**
   批改后点「✎ 编辑」可改批注正文/修改建议/类型/增删、改总评、改各子维度分数（0–100）；**总分只读、按各子维度平均分自动重算**（标签显示「·自动」），退出时写回历史。保持此逻辑。

7. **分隔条 + 宽度持久化**
   原文/批注之间可拖动分隔条调两栏宽度，比例存 `localStorage` 的 `eg_layout_colLeft`，跨渲染保留。保持。

### 单词听写模块
8. **AI 语音朗读默认开启、开关隐藏**
   `useAiTts = true`，`#dictAiTts` 用内联 `style="display:none"` 隐藏（用户无需切换）。通义走 DashScope CosyVoice，OpenAI/自定义网关走 `/v1/audio/speech`，不支持则静默回退浏览器 Web Speech API。间隔 1–10s、语速 0.5–1.5× 可调。**不要把该开关重新显示给用户**（用户明确只要隐藏）。

9. **拍照 / 多选 + 识别后跳手动**
   「📷 拍照」（调摄像头）与「🖼️ 选择图片（可多选）」两按钮；多张图逐张识别合并填入；识别后自动 `setDictInput('manual')` 方便修改。保持。

10. **标签顺序：拍照在前、手动在后**
    两个标签已对调（拍照置左且默认 active），手动置右。保持。

### 导出与交互
11. **PDF 走浏览器原生 `window.print()` 矢量输出**
    桌面+移动端统一。已删除 jsPDF+html2canvas 自绘路径。保留矢量打印，**不要回退到图片型 PDF**。

12. **移动端用页面内对话框替代 `window.prompt/confirm`**
    微信 WebView 会禁用原生 prompt/confirm，重命名/删除历史已改用 `openPromptDialog` / `openConfirmDialog`。保持。

### 部署与推送
13. **GitHub 推送走本地连接器代理 MCP**
    地址 `http://127.0.0.1:55373/mcp`（带鉴权头 `Authorization` + `X-WorkBuddy-Session-Id`，取自环境变量 `CODEBUDDY_MCP_CONFIG`）。文件内容**必须从磁盘读取，绝不手敲内联**（大文件会被截断）。**不要再用 `DeferExecuteTool` 的 `mcp__github__push_files` 内联大文件。**

14. **部署用 CloudStudio 沙箱**（稳定地址见顶部）。

---

## 三、不要再继续的工作 ❌（已否决 / 已废弃）

1. **不要做「导出标注图」**（把红圈+中文批注画回原图导出 PNG）
   用户 2026-07-27 明确否决。不要再主动提议或加入口。

2. **不要再试图让 DeepSeek 看图**
   DeepSeek API 是纯文本，`api.deepseek.com` 不接受 `image_url`（网页版能看图为网页自带多模态，API 未开放）。此前两次"DeepSeek 原生支持视觉"的误判**已作废**。要 AI 看图必须用 qwen-vl-max / glm-4v / 硅基流动 / yi-vision / Gemini / OpenAI-4o 等视觉模型。

3. **不要为 DeepSeek 配 CORS 代理**
   用户网络能直连 DeepSeek，CORS 不是其问题，代理多余。`baseUrlOverrides.deepseek` 保持占位符 `PASTE_YOUR_PROXY_URL_HERE`。

4. **不要恢复"独立看图模型服务商"区块**（已合并回单服务商，见二.3）。

5. **不要再回退到 jsPDF+html2canvas 桌面端图片型 PDF**（保持矢量打印，见二.11）。

6. **不要恢复"切换图片视图"按钮**（no-op，已删）。

7. **不要把 AI 朗读开关重新显示**（保持隐藏默认开，见二.8）。

8. **EdgeOne Makers 默认域名不是长期公开地址**
   默认域名返回 401 需 `eo_token`（约 3h 有效）。Gitee Pages 需实名认证（1–3 工作日）。**不要误以为这俩是"永久公开国内地址"。** 长期稳方案 = 自定义域名 + EdgeOne（含大陆 ICP 备案 1–3 周）。当前 CloudStudio 沙箱地址才是当前稳定入口。

9. **不要使用原生 `window.prompt/confirm`**（移动端微信 WebView 失效，见二.12）。

---

## 四、关键技术事实（踩坑记忆）

- **DeepSeek 纯文本；qwen 多模态可同时批改+看图。** 选纯文本服务商时，AI 看图为自动回退本地 OCR（Tesseract，仅英文，弱）。
- **国内视觉服务商 CORS 实测可直连**：qwen(dashscope)=`*`、glm=反射源、siliconflow=`*`、yi=`*`。
- **AI 批改/看图整合为单服务商 + 单 Key。** 设置界面不提供模型选择。
- **文件结构**：`index.html` + `css/(main,components,print).css` + `js/(app, ai-grader, ocr, renderer, storage, pdf-export).js`。`app.js` 顶层 IIFE，不能拆 `<script>` 分片推送。
- **GitHub 推送**：`github_push_files` 的 `content` 是原始文本（非 base64），`files:[{path, content}]`，无需 sha（自动更新）；删孤儿用 `github_delete_file`。
- **无自动化测试**：全部靠手工验证，改动 JS 后建议手动走一遍：填 Key → 批改 → 看标注 → 导出 PDF → 历史加载 → 听写拍照/多选/朗读。

---

## 五、活动（介绍会）前 Check-list

- [ ] 打开 CloudStudio 部署地址，确认在线且能正常批改/听写
- [ ] 确认演示用 API Key 已填好、网络可达（优先通义千问走「拍照即改」）
- [ ] 准备样例作文（可拍照/粘贴）+ 单词听写样图（可多选演示）
- [ ] 试打一次 PDF，确认分页与红圈渲染正常
- [ ] 演示机浏览器固定 Chrome/Edge（矢量打印依赖浏览器管线）
- [ ] 确认听写「AI 朗读」开关已隐藏、默认开启

---

## 六、后续维护指引

### 推代码到 GitHub（不依赖用户 PAT）
走本地连接器代理 MCP（端口 `127.0.0.1:55373/mcp`），文件内容**必须从磁盘读取，绝不能内联手敲**：
1. 从环境变量 `CODEBUDDY_MCP_CONFIG` 取 `mcpServers['connector-proxy'].headers` 里的 `Authorization` + `X-WorkBuddy-Session-Id`。
2. 走 MCP 流程：`initialize` → `notifications/initialized` → `tools/call` `github_push_files`，`files:[{path, content: fs.readFileSync(full,'utf8')}]`。
3. 删除孤儿文件用 `github_delete_file`。
（详细流程见项目记忆 `MEMORY.md` 的「推送到 GitHub」一节。）

### 改完代码后重新部署
- CloudStudio：重新上传目录到 sandbox 即可（当前稳定地址见顶部）。
- 本地语法检查：`node --check js/app.js && node --check js/ai-grader.js`。

### 关键文件速查
| 文件 | 作用 |
|------|------|
| `index.html` | 页面结构、设置面板、历史面板、听写标签 |
| `js/app.js` | 主逻辑（IIFE 包裹，**不可拆分**）；含 dictation 状态机 |
| `js/ai-grader.js` | AI 服务商表 `PROVIDERS`、批改/看图/AI-TTS 逻辑 |
| `js/renderer.js` | 红圈标注、左右两栏渲染、`SCORE_LABELS` |
| `js/config.js` | `baseUrlOverrides`（CORS 代理占位符，与 Key 无关） |
| `css/main.css` / `css/print.css` | 样式 / 打印导出 |

---

*交接人备注：项目已具备完整可演示能力（作文批改 + 单词听写）。主要风险在「部署地址临时 + Key 依赖 + DeepSeek 不看图」三点，活动前按第五节 Check-list 走一遍即可。最新一轮已加入听写多图选择/拍照、识别后跳手动、AI 朗读默认隐藏开启、FCE 20 分制、老师编辑态。*
