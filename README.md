# 📝 英语作文批改 · Essay Grader

一个基于 Web 的英语作文批改应用，使用 AI 大模型进行智能批改，复刻图中所示的批改体验。

## ✨ 功能特性

- 📷 **多种输入方式** - 拍照、上传图片、直接输入文本
- 🤖 **AI 智能批改** - 支持 Google Gemini（免费）和 OpenAI 兼容 API
- 🔍 **浏览器 OCR** - 基于 Tesseract.js，识别完全在本地完成
- 🎯 **结构化标注** - 用红色圆圈标出错误位置，右侧显示中文批注
- 📊 **多维度评分** - 语法、词汇、逻辑、总分
- 💾 **历史记录** - 所有批改结果保存在本地，可随时回看
- 📤 **导出图片** - 一键导出为高清 PNG 图片
- 📱 **响应式设计** - 完美适配手机和电脑浏览器

## 🚀 快速开始

### 1. 获取 API Key

**推荐：Google Gemini（免费）**
- 访问 https://aistudio.google.com/app/apikey
- 登录 Google 账号，创建 API Key
- 免费层：每分钟 15 次请求，每天 1500 次

**备选：OpenAI 兼容 API**
- 支持 DeepSeek、通义千问、月之暗面、ChatGLM 等
- 填入对应平台的 API Key、Base URL、模型名

### 2. 配置应用

打开应用后：
1. 点击右上角 ⚙️ 设置按钮
2. 填入 API Key
3. 点击「测试连接」确认可用
4. 保存设置

### 3. 开始批改

- 点击「拍照/上传图片」或「直接输入文本」
- 等待 AI 分析（通常 5-15 秒）
- 查看逐句批注和总评

## 🛠️ 技术栈

- 纯静态前端：HTML + CSS + Vanilla JavaScript（无框架）
- OCR：Tesseract.js 5.x
- 导出：html2canvas 1.4
- 存储：localStorage（无后端）

## 📁 项目结构

```
.
├── index.html          # 主页面
├── css/
│   ├── main.css        # 主样式
│   └── components.css  # 组件样式
├── js/
│   ├── app.js          # 主应用
│   ├── storage.js      # 本地存储
│   ├── sample-data.js  # 示例数据
│   ├── ocr.js          # OCR 模块
│   ├── ai-grader.js    # AI 批改
│   ├── renderer.js     # 结果渲染
│   └── exporter.js     # 导出
└── README.md
```

## 🔒 隐私

- 所有 API Key 仅保存在你的浏览器 localStorage
- OCR 识别在浏览器本地完成，图片不上传
- 作文内容和批改结果保存在本地
- 不向任何第三方服务（除 AI API）发送数据

## 📄 License

MIT
