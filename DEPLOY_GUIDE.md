# 部署指南：给网站加上「付费会员」功能

> 目标：用户付费后才能使用 AI 批改，开通会员后**无需填 Key 直接批改**。
> 你的 AI Key 只放在后端，用户看不到、也不用填。

整体分 **4 步**，全部免费、无需备案、无需营业执照：

1. 注册 Cloudflare（免费）
2. 部署后端（会员 + AI 代理，约 15 分钟）
3. 部署前端 + 管理后台
4. 测试

---

## 第 0 步：准备两样东西

| 准备项 | 说明 |
|---|---|
| 一个 AI API Key | 例如通义千问（阿里云百炼 dashscope.console.aliyun.com）或 DeepSeek 的 Key。这是「你的 Key」，用户批改的费用从它扣 |
| 一个收款码图片 | 你的微信/支付宝收款码，拍成图，等会儿填进前端（可选，不填也能用） |

---

## 第 1 步：注册 Cloudflare

1. 打开 https://dash.cloudflare.com
2. 点「Sign up」用邮箱注册（免费）
3. 登录后进入后台

---

## 第 2 步：部署后端（Cloudflare Worker）

### 2.1 先创建 3 个 KV（数据库）

1. 左侧菜单点 **「Workers & Pages」** → 顶部切到 **「KV」** 标签
2. 点 **「Create a namespace」**，名字填 `USERS`，创建
3. 同样再创建两个：`CODES` 和 `AUTH`
4. 记下这 3 个 KV 各自的 **id**（一串小写字母数字，形如 `abcd1234...`）

### 2.2 创建 Worker 并粘贴代码

1. 左侧 **「Workers & Pages」** → 点 **「Create application」** → **「Create Worker」**
2. 名字填 `essay-grader-api`，点 **「Deploy」**（先创建一个空的）
3. 部署完成后点 **「Edit code」**（在线编辑器）
4. 把本项目 `worker/index.js` 的**全部内容**粘贴进去（覆盖默认代码）
5. 点右上角 **「Deploy」**

### 2.3 绑定 KV + 填环境变量

在 Worker 页面点 **「Settings」→「Variables」**：

**① KV Namespace Bindings**（点 Add binding，加 3 条）：

| Variable name | KV namespace |
|---|---|
| `USERS` | 选你创建的 USERS |
| `CODES` | 选你创建的 CODES |
| `AUTH` | 选你创建的 AUTH |

**② Environment Variables**（点 Add variable，加这几条）：

| 变量名 | 值 | 说明 |
|---|---|---|
| `ADMIN_PASSWORD` | 你自己设一个密码 | 管理后台登录密码，**务必改** |
| `AI_PROVIDER` | `qwen` | 或 `deepseek` / `openai` / `custom` |
| `AI_KEY` | 你的 AI Key | 例如 `sk-xxxx` |
| `AI_MODEL` | 留空 | 可选，留空用默认（qwen 默认 qwen-plus） |
| `AI_BASE_URL` | 留空 | 仅 `custom` 时填 |

> 说明：`AI_KEY` 是「秘密」，建议用同页的 **Secrets**（而非 Variables）添加，更安全。若图省事用 Variables 也可以，但别把仓库公开上传时带上真实 Key（本项目 `worker/index.js` 里没有 Key，Key 只在 Cloudflare 后台填）。

**③ 保存后回到 Worker 首页**，能看到你的 Worker 地址，形如：
`https://essay-grader-api.你的用户名.workers.dev`

**记下这个地址**，这是后端地址。

---

## 第 3 步：部署前端 + 管理后台

### 3.1 把后端地址填进前端

打开本项目的 `js/config.js`，找到这行：

```js
MEMBERSHIP_BACKEND_URL: '',
```

把它改成你的后端地址（**结尾不要带斜杠**）：

```js
MEMBERSHIP_BACKEND_URL: 'https://essay-grader-api.你的用户名.workers.dev',
```

（可选）如果你有收款码图片，填进下面这行，用户开通会员时就能看到收款码：

```js
MEMBERSHIP_PAY_QR: 'https://你的图片地址/收款码.png',
```

### 3.2 部署前端

两种方式任选：

- **方式 A（继续用 CloudStudio，最简单）**：把整个项目目录重新部署到 CloudStudio（和之前一样），地址不变。
- **方式 B（Cloudflare Pages）**：左侧 **「Workers & Pages」→ Create → Pages**，上传本项目文件夹，构建命令留空、输出目录留空（纯静态），部署后得到 `https://xxx.pages.dev`。

### 3.3 部署管理后台

管理后台就是项目里的 `admin.html` 一个文件，用浏览器打开它即可使用（也可以把它和前端一起部署，访问 `你的域名/admin.html`）。

**用法**：打开 `admin.html` → 顶部「① 后端地址」填你的 Worker 地址 → 保存 → 输入 `ADMIN_PASSWORD` 登录 → 就能「生成激活码」「查看用户」。

---

## 第 4 步：测试完整流程

1. 打开前端网页 → 右下角会多一个 **🎫 会员** 按钮
2. 点「拍照/上传」→ 会先弹「登录」，输入一个手机号 → 登录
3. 点「批改」→ 因为还没开通会员，会弹「开通会员」→ 显示收款码（若配置了）
4. 打开 `admin.html` → 登录 → 生成一个激活码（选 30 天）→ 复制
5. 回到前端，把激活码填入 → 点「激活」→ 提示成功
6. 再点「批改」→ 这次直接出结果（用的是后端的 Key，用户全程没填 Key）

---

## 常见问题

| 问题 | 解决 |
|---|---|
| 前端报「后端未配置 AI Key」 | 检查 Worker 的 `AI_KEY` 是否填了，`AI_PROVIDER` 是否填对 |
| 激活码提示无效 | 激活码要区分大小写不敏感（已处理）；确认是后台刚生成的、未用过 |
| 会员到期后还能用吗 | 不能。批改接口会返回「会员已到期」，用户需续费 |
| 想看谁快到期 | 打开 `admin.html` → 「用户列表」刷新 |
| 想改会员时长 | `admin.html` 生成激活码时可选 30/90/180/365 天 |
| 想改 AI 服务商 | Worker 环境变量 `AI_PROVIDER` 改成 `deepseek` 等，`AI_KEY` 换对应 Key |

---

## 成本提示（重要）

- 开通会员后用户「直接批改」的费用，**全部从你的 AI Key 扣**。
- 所以会员定价要覆盖 AI 成本：通义 `qwen-plus` 批改一篇约几厘钱，月卡几十元通常能覆盖。
- 图片 OCR（看图识字）目前用**浏览器本地识别**（免费），不走你的 Key，成本可控。
