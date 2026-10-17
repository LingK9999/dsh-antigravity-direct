# dsh-antigravity-direct

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-blue.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.3.2-green.svg)](package.json)

**dsh-antigravity-direct** 是专为 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 打造的本地直连代理核心插件。

它在本地启动高性能回环代理服务（默认 `127.0.0.1:8790`），将标准 OpenAI `/v1/chat/completions` 协议无缝转换为 Google Antigravity（Cloud Code PA）的 `v1internal` 协议，使 DSH 能够以原生级体验调用 **Gemini 3.8 / 3.1** 与 **Claude 4.6** 等高配云端模型。

---

## ✨ 核心特性

- 🔄 **协议双向实时转接**：
  - OpenAI `/v1/chat/completions`（流式/非流式）⇄ Google Antigravity `generateContent` / `streamGenerateContent`。
  - 完整适配流式思考过程（Reasoning/Thinking Stream）、多模态图文输入（Vision）与原生工具调用（Function Calling / Tools）。
- 📊 **双模型池额度可视化仪表盘**：
  - 在 DSH 设置面板「Antigravity 直连」中提供原生 UI。
  - 独立监控 **GEMINI 模型池** 与 **CLAUDE / GPT 模型池**。
  - 实时展示 5 小时会话限额与每周限额的双重进度条、剩余百分比、相对刷新时间及精准重置时刻。
- 🌐 **网络代理运行时热切换**：
  - 面板内置「网络代理设置 (HTTP / HTTPS Proxy)」卡片。
  - 支持免重启动态保存与切换代理地址（默认 `http://127.0.0.1:7890`，留空即走直连）。
  - 内置即时端点连通性测试与延迟探测。
- 🛡️ **长文本与工具调用多重防御**：
  - **路径降级与防政策误判**：自动净化 Tool Result 中的绝对路径与包裹标签，避免上游政策层审查误触。
  - **工具语法防截断与闭合保护**：超长上下文生成时，深度防御残缺工具语法泄露与 JSON 尾部碎屑。
  - **长思考保活心跳**：内置 TCP Keep-Alive 与指数退避重试，杜绝深度思考下的 502 / Socket Hang Up。
- 👥 **多账号管理与无缝切换**：
  - 支持多 Google 账号 OAuth 凭据轮换与状态持久化。
  - 支持在 Web 界面一键发起 OAuth 登录授权或移除失效账号。

---

## 📦 支持的模型矩阵

| 模型 ID | 展示名称 | 上下文窗口 | 最大输出 Token | 核心特性 |
| :--- | :--- | :--- | :--- | :--- |
| `gemini-3.8-flash` | Gemini 3.8 Flash | 300,000 | 128,000 | 极速响应、多模态、支持 Low/Medium/High 思考 |
| `gemini-3.8-flash-high` | Gemini 3.8 Flash (High) | 300,000 | 128,000 | 强化深度推理、复杂长文本创作 |
| `gemini-3.1-pro-high` | Gemini 3.1 Pro (Agent) | 300,000 | 128,000 | Agent 规划、高难度工具调用 |
| `claude-sonnet-4-6` | Claude Sonnet 4.6 | 200,000 | 64,000 | 代码架构、复杂逻辑重构、稳定输出 |
| `claude-opus-4-6-thinking` | Claude Opus 4.6 | 200,000 | 64,000 | 极致文学创作与长程严谨推理 |

---

## 🚀 安装指引

> ⚠️ **关于 DSH 桌面端安装的重要提示**：  
> 在 DSH 官方桌面客户端（Electron 架构）中，`desktop` profile 受到官方内核独占保护，在终端中直接运行 `dsh plugin --profile desktop add ...` 会被内核闸门拦截并报错：  
> `error: profile "desktop" is managed exclusively by the Electron application`  
> 因此，请根据你的使用环境选择以下对应的安装方式：

### 方式一：DSH Desktop 桌面端一键安装（推荐）

1. 克隆或下载本仓库代码到本地任意目录：
   ```sh
   git clone https://github.com/LingK9999/dsh-antigravity-direct.git
   ```
2. 进入目录，直接运行内置的一键安装脚本即可：
   ```powershell
   cd dsh-antigravity-direct
   powershell -ExecutionPolicy Bypass -File .\install.ps1
   ```
   *脚本会自动完成插件目录部署、依赖同步与 profile bundles 注册，完成后重启 DSH Desktop 即可生效。*

### 方式二：DSH 客户端「插件市场 / 设置页」安装

若你的客户端安装了 `dshmarket`（插件市场）或支持在图形界面安装插件：
1. 打开 DSH 界面中的 **「设置」→「插件」**（或 **DSH 插件市场**）。
2. 在搜索或安装框中填入本仓库名：
   ```text
   github:LingK9999/dsh-antigravity-direct
   ```
3. 点击安装并重启 DSH。

### 方式三：命令行 Web Profile 安装（适用于 `dsh web` 纯网页端用户）

如果你使用的是在终端通过 `dsh web` 启动的非桌面端环境：

```sh
dsh plugin --profile web add github:LingK9999/dsh-antigravity-direct
```

---

## ⚙️ 配置与使用

### 1. 注册 Provider 配置

插件随 DSH 启动时会在本地启动端口 `8790` 的回环服务。你需要将 Antigravity 模型注册进 DSH 配置文件：

在 `~/.dsh/profiles/desktop/cordis.patch.yml`（或对应 profile 的配置文件）中，找到 `llm-pi-ai` 插件的 `config.providers` 节点，添加以下内容：

```yaml
      antigravity:
        displayName: Antigravity直连
        apiKeyEnv: GEMINI_API_KEY
        api: openai-completions
        baseURL: http://127.0.0.1:8790/v1
        models:
          - id: gemini-3.8-flash
            name: gemini-3.8-flash
            contextWindow: 300000
            maxTokens: 128000
            reasoningEfforts:
              low: low
              medium: medium
              high: high
            input: [text, image]
          - id: gemini-3.8-flash-high
            name: gemini-3.8-flash-high
            contextWindow: 300000
            maxTokens: 128000
            reasoningEfforts:
              low: low
              medium: medium
              high: high
            input: [text, image]
          - id: gemini-3.1-pro-high
            name: gemini-3.1-pro (agent)
            contextWindow: 300000
            maxTokens: 128000
            reasoningEfforts:
              low: low
              medium: medium
              high: high
            input: [text, image]
          - id: claude-sonnet-4-6
            name: claude-sonnet-4-6
            contextWindow: 200000
            maxTokens: 64000
            input: [text, image]
          - id: claude-opus-4-6-thinking
            name: claude-opus-4-6
            contextWindow: 200000
            maxTokens: 64000
            input: [text, image]
```

*(详见仓库内的 [`provider-config-snippet.yml`](provider-config-snippet.yml) 完整范例)*

### 2. 账号凭据导入与登录

插件默认自动扫描以下目录下的 OAuth 凭据文件（含有 `refresh_token` 的 JSON）：
- 默认目录：`~/.dsh/credentials/antigravity/*.json`
- 自定义环境变量：可通过 `AG_CREDS_DIR` 指定凭据文件夹，或通过 `AG_CREDS` 指定单凭据文件。

同时，你也能够在 DSH 设置页内点击 **「登录新账号」**，通过浏览器 OAuth 流程直接完成凭据绑定。

---

## 🛠️ 高级环境变量

| 变量名 | 说明 | 默认值 |
| :--- | :--- | :--- |
| `AG_PORT` | 本地回环代理端口 | `8790` |
| `AG_PROXY` | 向上游发起请求时使用的 HTTP/SOCKS 代理 | `http://127.0.0.1:7890` |
| `AG_CREDS_DIR` | 自定义凭据目录 | `~/.dsh/credentials/antigravity` |
| `AG_BASE` | 上游 Antigravity 端点 | `https://daily-cloudcode-pa.googleapis.com` |

---

## 📂 目录结构

```text
dsh-antigravity-direct/
├── client.js                  # 浏览器端 UI 面板（双模型池额度仪表盘、网络代理配置、账号管理）
├── cordis.patch.yml           # Cordis 服务注入清单
├── index.js                   # 插件入口（生命周期管理、本地 RPC 通道挂载）
├── install.ps1                # 桌面端一键安装脚本（自动处理 Electron desktop profile 写入）
├── package.json               # 插件清单与元数据定义
├── provider-config-snippet.yml# Provider 快捷配置模板
├── sanitize-rules.json        # 政策审查防御与改写规则
├── LICENSE                    # MIT 开源授权协议
├── README.md                  # 说明文档
└── lib/
    ├── proxy-core.js          # 直连代理核心（协议转接、长文本/工具流防御、Token 刷新）
    └── vendor/                # 纯净内置依赖包
```

---

## 📄 License

本项目采用 [MIT License](LICENSE) 开源授权。
