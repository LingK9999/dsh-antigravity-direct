# dsh-antigravity-direct

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-blue.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.4.0-green.svg)](package.json)

**dsh-antigravity-direct** 是专为 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 打造的本地直连代理核心插件。

它在本地启动高性能回环代理服务（默认 `127.0.0.1:8790`），将标准 OpenAI `/v1/chat/completions` 与 `/v1/models` 协议无缝转换为 Google Antigravity（Cloud Code PA）的内部协议，使 DSH 能够以原生级体验调用 **Gemini 3.8 / 3.5 / 3.1**、**Claude 4.6 (Thinking)** 与 **GPT-OSS** 等最新高配云端模型。

---

## ✨ 核心特性

- 🔄 **OpenAI 协议双向无缝转接**：
  - 标准 OpenAI `/v1/chat/completions`（流式/非流式）⇄ Google Antigravity `generateContent` / `streamGenerateContent`。
  - 完整适配流式思考过程（Reasoning/Thinking Stream）、多模态图文输入（Vision）与原生工具调用（Function Calling / Tools）。
- ⚡ **最新模型列表自动发现与一键同步 (v0.4.0 重磅)**：
  - 本地代理开放 OpenAI 标准 `/v1/models` 端点，实时拉取 Google Antigravity 官方最新可用模型清单。
  - 精确解析模型上下文字符窗口（最高 1,000,000 Token）、单次生成上限与思考预算参数。
  - 在 DSH 设置面板提供 **「⚡ 一键同步至 DSH 选择器」**，智能将最新模型写入 Web 与 Desktop profile 配置，聊天界面即可直接下拉切换任意最新模型！
- 🛡️ **长上下文、代码编写与复杂工具调用的高可用断联防御 (v0.4.0 优化)**：
  - **工具语法白名单与严谨匹配**：基于当前会话实际声明的工具动态校验，彻底杜绝编写代码时将普通代码块（如 `package.json`、Markdown、Python 代码字典等）误判为工具调用导致的正文截断断联。
  - **流式心跳注入保活**：上游长时间思考或网络间歇期，持续向下游客户端注入静默空增量（Empty Delta），防止客户端因读超时而意外断联。
  - **历史工具超大写入参数自动瘦身**：检测到历史多轮对话中存在超大代码文件写入等巨型参数时自动瘦身截断，大幅降低请求体积，避免触发上游政策网关负载限制与 502 错误。
  - **底层网络代理连接池强化**：HttpsProxyAgent 启用 `keepAlive: true`、长达 300 秒空闲保活与 64 并发连接复用，告别 TCP 死锁。
  - **路径降级与政策误判防护**：自动净化 Tool Result 中的绝对路径，避免上游政策审查层误判为外部文件载入攻击。
- 📊 **双模型池额度可视化仪表盘**：
  - 在 DSH 设置面板「Antigravity 直连」中提供原生 UI。
  - 独立监控 **GEMINI 模型池** 与 **CLAUDE / GPT 模型池**。
  - 实时展示 5 小时会话限额与每周限额的双重进度条、剩余百分比、相对刷新时间及精准重置时刻。
- 🌐 **网络代理运行时热切换**：
  - 面板内置「网络代理设置 (HTTP / HTTPS Proxy)」卡片。
  - 支持免重启动态保存与切换代理地址（默认 `http://127.0.0.1:7890`，留空即走直连）。
  - 内置即时端点连通性测试与延迟探测。
- 👥 **多账号管理与无缝切换**：
  - 支持多 Google 账号 OAuth 凭据轮换与状态持久化。
  - 支持在 Web 界面一键发起 OAuth 登录授权或移除失效账号。

---

## 📦 支持的部分模型矩阵

通过插件内置的模型发现机制，上游可用模型均可动态同步。常见模型如下：

| 模型 ID | 展示名称 | 上下文窗口 | 最大输出 Token | 核心特性 |
| :--- | :--- | :--- | :--- | :--- |
| `gemini-3.8-flash-high` | Gemini 3.8 Flash (High) | 1,048,576 | 65,536 | 极速响应、深度推理、100万超大上下文、多模态 |
| `gemini-3.8-flash-medium` | Gemini 3.8 Flash (Medium) | 1,048,576 | 65,536 | 平衡推理速度与输出深度 |
| `gemini-3.8-flash-low` | Gemini 3.8 Flash (Low) | 1,048,576 | 65,536 | 极速日常对话与代码生成 |
| `claude-sonnet-4-6` | Claude Sonnet 4.6 (Thinking) | 250,000 | 64,000 | 顶级代码架构、复杂重构、自带思考过程 |
| `claude-opus-4-6-thinking` | Claude Opus 4.6 (Thinking) | 250,000 | 64,000 | 极致长程逻辑、文学创作与深度思考 |
| `gpt-oss-120b-medium` | GPT-OSS 120B (Medium) | 131,072 | 32,768 | 开源大模型标杆、通用问答与代码推理 |
| `gemini-2.5-pro` | Gemini 2.5 Pro | 1,048,576 | 65,535 | 经典高精度专业模型、多模态解析 |
| `gemini-3-flash-agent` | Gemini 3.5 Flash (High) | 1,048,576 | 65,536 | Agent 工具链编排专用模型 |

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

## ⚙️ 模型配置与自动同步

### 方式一：面板一键同步（最简推荐）

插件启动后，进入 DSH 左侧 **「设置」→「Antigravity 直连」**：
1. 查看当前检测到的上游可用模型列表。
2. 点击 **「⚡ 一键同步至 DSH 选择器」** 按钮。
3. 插件会自动更新你的配置文件（支持 Desktop 与 Web Profile），无需手动编辑 YAML，聊天窗口即刻可直接切换使用！

### 方式二：手动配置 Provider

若需要手动定义模型或定制化参数，可以在 `~/.dsh/profiles/<profile>/cordis.patch.yml` 中找到 `llm-pi-ai` 插件的 `config.providers` 节点，添加以下配置：

```yaml
      antigravity:
        displayName: Antigravity直连
        apiKeyEnv: GEMINI_API_KEY
        api: openai-completions
        baseURL: http://127.0.0.1:8790/v1
        models:
          - id: gemini-3.8-flash-high
            name: Gemini 3.8 Flash (High)
            contextWindow: 1048576
            maxTokens: 65536
            input: [text, image]
            reasoningEfforts:
              low: low
              medium: medium
              high: high
            compat:
              supportsDeveloperRole: false
              supportsReasoningEffort: true
              thinkingFormat: openai
              thinkingTokenBudgetField: thinking_token_budget
          - id: claude-sonnet-4-6
            name: Claude Sonnet 4.6 (Thinking)
            contextWindow: 250000
            maxTokens: 64000
            input: [text, image]
            reasoningEfforts:
              low: low
              medium: medium
              high: high
            compat:
              supportsDeveloperRole: false
              supportsReasoningEffort: true
              thinkingFormat: openai
              thinkingTokenBudgetField: thinking_token_budget
```

*(详见仓库内的 [`provider-config-snippet.yml`](provider-config-snippet.yml) 完整范例)*

---

## 🔑 账号凭据导入与登录

插件默认自动扫描以下目录下的 OAuth 凭据文件（含有 `refresh_token` 的 JSON）：
- 默认目录：`~/.dsh/credentials/antigravity/*.json`
- 自定义环境变量：可通过 `AG_CREDS_DIR` 指定凭据文件夹，或通过 `AG_CREDS` 指定单凭据文件。

同时，你也能够在 DSH 设置页内点击 **「添加账号（Google 登录）」**，通过浏览器 OAuth 流程直接完成凭据绑定。

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
├── client.js                  # 浏览器端 UI 面板（模型列表与一键同步、双模型池额度仪表盘、网络代理配置、账号管理）
├── cordis.patch.yml           # Cordis 服务注入清单
├── index.js                   # 插件入口（生命周期管理、本地 RPC 通道挂载）
├── install.ps1                # 桌面端一键安装脚本（自动处理 Electron desktop profile 写入）
├── package.json               # 插件清单与元数据定义 (v0.4.0)
├── provider-config-snippet.yml# Provider 快捷配置模板（含思考能力参数）
├── sanitize-rules.json        # 政策审查防御与改写规则
├── LICENSE                    # MIT 开源授权协议
├── README.md                  # 说明文档
└── lib/
    ├── proxy-core.js          # 直连代理核心（协议转接、/v1/models 发现、长文本/工具流断联防御、Token 刷新）
    └── vendor/                # 纯净内置依赖包
```

---

## 📄 License

本项目采用 [MIT License](LICENSE) 开源授权。
