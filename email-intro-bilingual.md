# English Essay Grader —— 英语作文 AI 批改工具介绍邮件（中英对照）

---

**邮件主题 / Subject**
English Essay Grader：一款免费的英语作文 AI 批改网页工具 / English Essay Grader: A Free Web-Based AI Tool for Grading English Essays

---

各位老师、各位同事：

Dear teachers and colleagues,

## 一、这是什么 / What it is

这是一款纯网页的英语作文批改工具，无需安装软件、无需后台服务器。你贴入学生作文（或拍照上传），AI 会在原文上用红圈标出错误，并在右侧给出中文批注和修改建议，最后给出分项评分与总评。老师还可以手动修改批注和分数。

This is a web-based English essay grading tool — no software install and no backend server required. You paste a student's essay (or upload a photo), and the AI marks errors with red circles directly on the original text, provides Chinese annotations and revision suggestions on the right, and produces per-dimension scores plus an overall comment. Teachers can also manually edit the annotations and scores.

## 二、怎么用 / How to use

1. 打开应用网页（活动当天我会提供地址，或部署到你自己的空间）。
   Open the web app (I will share the link at the session, or you can deploy it to your own space).

2. 在「设置」里填入你自己的大模型 API Key（获取方式见第三节）。只需填一次，保存在你自己的浏览器里，不会上传到任何服务器。
   In **Settings**, enter your own LLM API Key (see Section 3 for how to get one). You only need to do this once; it is stored in your own browser and is never uploaded to any server.

3. 回到主页，把学生作文粘贴进输入框，或点「拍照 / 上传」识别图片，然后点「开始批改」。
   Back on the home page, paste the student's essay into the box, or tap "Photo / Upload" to recognize an image, then click "Start Grading".

4. 系统生成左右对照的批改结果：左侧是带红圈标注的原文，右侧是中文批注、修改建议、分项评分（内容 / 达成度 / 结构 / 语言）与总评。
   The system produces a side-by-side result: the original text with red-circle markings on the left, and Chinese annotations, revision suggestions, per-dimension scores (Content / Communicative Achievement / Organization / Language) and an overall comment on the right.

5. 如需调整，点「编辑」修改批注或分数；确认无误后点「导出 PDF」，即可打印或保存成 PDF 发给学生。
   To adjust, click "Edit" to modify annotations or scores. When satisfied, click "Export PDF" to print or save a PDF to share with the student.

## 三、如何获取大模型的 API Key / How to get the LLM API Key

应用支持多家大模型，你只需任选一家并填入它的 Key 即可。

The app works with several LLM providers. Just pick one and paste its key.

### A) 通义千问（默认推荐，同时支持批改和看图识别）
### A) Tongyi Qianwen / Qwen (recommended default; supports both grading and image recognition)

- 打开 https://dashscope.console.aliyun.com/
- 注册 / 登录阿里云账号，进入「API Key 管理」创建一个 Key
- 复制该 Key，在应用「设置」里选择服务商「通义千问」并粘贴
- Open https://dashscope.console.aliyun.com/
- Register / log in with your Alibaba Cloud account, go to "API Key Management" and create a key
- Copy the key, choose provider "Tongyi Qianwen / Qwen" in the app Settings and paste it

### B) DeepSeek（纯文本批改，不支持看图）
### B) DeepSeek (text grading only; no image recognition)

- 打开 https://platform.deepseek.com/
- 注册 / 登录，在「API keys」页面创建一个 Key
- 在应用「设置」里选择服务商「DeepSeek」并粘贴
- Open https://platform.deepseek.com/
- Register / log in, create a key on the "API keys" page
- Choose provider "DeepSeek" in the app Settings and paste it

### C) Google Gemini（有免费额度）
### C) Google Gemini (free tier available)

- 打开 https://aistudio.google.com/apikey
- 用 Google 账号登录，点「Create API Key」生成一个 Key
- 在应用「设置」里选择服务商「Gemini」并粘贴
- Open https://aistudio.google.com/apikey
- Log in with your Google account and click "Create API Key" to generate one
- Choose provider "Gemini" in the app Settings and paste it

> 备注 / Note：API Key 是你个人在对应平台申请的，调用费用由该平台按用量收取。应用本身免费，且不收集、不上传任何作文或 Key 数据。

> The API Key is yours, applied from the provider platform; usage fees are charged by that platform based on consumption. The app itself is free and collects / uploads no essays or key data.

## 四、结尾 / Closing

欢迎在介绍会上直接试用，有任何问题随时找我。

Feel free to try it during the session, and reach out to me anytime with questions.

---

*（本邮件不含"单词听写"模块介绍。）*
*(This email does not cover the "word dictation" module.)*
