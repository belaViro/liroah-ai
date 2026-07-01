<h1 align="center">liroah-ai</h1>

<p align="center">基于 Pi Agent Harness 的 LiRoah 品牌 coding agent 框架。</p>

<p align="center">
  <img alt="status" src="https://img.shields.io/badge/status-active-black?style=flat-square" />
  <img alt="node" src="https://img.shields.io/badge/node-%3E%3D22.19-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
</p>

`liroah-ai` 是 [Pi Agent Harness](https://github.com/earendil-works/pi-mono) 的二次开发分支。它保留 Pi 的终端优先 coding agent 核心，同时加入 LiRoah 相关的工作流打磨、权限控制、Windows shell 发现逻辑，以及面向网关的后续 harness 工作。

> 当前状态：coding-agent 基座和本地交互增强已经可用。`liroah-api` 聚合网关适配仍在路线图中，还不是完整集成。

## 目录

- [项目是什么](#项目是什么)
- [已实现](#已实现)
- [路线图](#路线图)
- [快速开始](#快速开始)
- [运行时控制](#运行时控制)
- [Windows Bash 发现](#windows-bash-发现)
- [可定制入口](#可定制入口)
- [仓库结构](#仓库结构)
- [开发](#开发)
- [上游](#上游)
- [许可证](#许可证)

## 项目是什么

`liroah-ai` 不只是 Pi 的改名版本。它是一个偏 harness 的分支，用来在保留 Pi 核心交互模型的前提下，试验和增强 coding-agent 行为：

- 以终端 TUI 为第一入口
- 持久化 coding 会话
- 内置 `read`、`bash`、`edit`、`write`、`grep`、`find` 和 `ls` 工具
- 通过 `AGENTS.md` 提供项目级指令
- 支持本地扩展、提示词、skills 和主题
- 继承 Pi 的模型与供应商灵活性

项目方向很直接：先把 agent 的 shell、文件编辑、权限、提示词和评测流程打磨好，再去做更高层的产品封装。

## 已实现

| 项目 | 当前行为 |
|------|----------|
| coding agent 基座 | 继承 Pi 的交互式 coding agent、会话模型、工具执行、提示词/模板/skill 加载以及 TUI 组件。 |
| 工具许可门禁 | 项目本地扩展 `.pi/extensions/tool-permission-gate.ts` 会在 `bash`、`edit`、`write` 工具调用前提示许可，支持允许一次、允许本次会话和拒绝。 |
| 计划模式 | 项目本地扩展 `.pi/extensions/plan-mode/` 提供只读探索模式：禁用 `edit`/`write` 工具，bash 受安全白名单限制，支持从 AI 回复提取 Plan 步骤并逐步执行跟踪。快捷键 `Ctrl+Alt+P` 或命令 `/plan` 切换，可用 `--plan` flag 启动时直接进入。 |
| 启动体验 | 交互式启动头部使用移动的 ANSI 像素动画，先从左侧进入，向右退出，最后回到居中静态显示。 |
| 动画控制 | `PI_STARTUP_LOGO_INTERVAL_MS` 控制帧频；`PI_STARTUP_LOGO_DURATION_MS` 只接受纯数字，并且上限为 `10000ms`。 |
| Windows shell 发现 | Windows 采用类似 Claude Code 的 Git Bash 查找方式：从 `git.exe` 推导 `bin\bash.exe`，跳过 Windows/WSL 的 bash stub，并允许用 `LIROAH_GIT_BASH_PATH` 覆盖。 |
| 版本检查控制 | `PI_SKIP_VERSION_CHECK=1` 可关闭启动时的更新提示；`PI_OFFLINE=1` 可关闭所有启动网络操作。 |
| 更新日志规范 | 包变更记录在 `packages/coding-agent/CHANGELOG.md` 的 `[Unreleased]` 段落下。 |

## 路线图

### liroah-api 网关适配器

规划中的网关方向，是把 agent 运行时接到 `liroah-api`，同时不把网关细节泄漏到核心 agent 工作流里。

计划关注点：

- 统一的上游模型接入
- 网关侧认证、配额、限流和成本统计
- 路由、重试、fallback 和降级策略
- 将供应商差异封装在稳定的 agent 接口之后
- 与现有 Pi 模型和会话行为保持兼容

### Harness 工程

Harness 方向的重点是在不改变基座模型的前提下提升编码可靠性：

- 更好的仓库级任务上下文组织
- 更安全的工具调用和用户许可路径
- 可重复的调试、测试和审查流程
- 可复用的 agent 编排实验
- 用于编码回归的评测样本

## 快速开始

安装依赖，但不执行生命周期脚本：

```bash
npm install --ignore-scripts
```

运行项目检查：

```bash
npm run check
```

从本仓库启动本地交互式 CLI：

```powershell
.\pi-test.ps1
```

在类 Unix shell 中：

```bash
./pi-test.sh
```

单次 PowerShell 启动时关闭版本检查：

```powershell
$env:PI_SKIP_VERSION_CHECK="1"; .\pi-test.ps1
```

## 运行时控制

| 变量 | 作用 |
|------|------|
| `PI_SKIP_VERSION_CHECK=1` | 跳过启动时的 `Update Available` 提示。 |
| `PI_OFFLINE=1` | 关闭启动阶段的网络操作，包括更新检查和遥测。 |
| `PI_STARTUP_LOGO_INTERVAL_MS` | 启动像素动画的帧间隔。默认 `220ms`，取值会被限制在 `10..1000ms`。 |
| `PI_STARTUP_LOGO_DURATION_MS` | 启动动画的总移动时长。只接受纯数字，默认 `3000ms`，最大 `10000ms`；`0` 表示静态显示。 |
| `LIROAH_GIT_BASH_PATH` | Windows 下可选的 Git Bash 覆盖路径，例如 `D:\Tools\Git\bin\bash.exe`。 |
| `--plan` | CLI flag，启动时直接进入计划模式（只读探索），适用于安全代码审查场景。 |

## Windows Bash 发现

`bash` 工具期望一个 POSIX 风格的 shell。在 Windows 上，优先使用 Git Bash，因为它随 Git for Windows 一起提供，并且支持 `ls`、`grep`、`sed`、`find`、`mkdir -p` 这类常用命令。

查找顺序：

1. 配置中的 `shellPath`
2. `LIROAH_GIT_BASH_PATH`
3. 从发现的 `git.exe` 推导 Git Bash
4. `Program Files` 下的默认 Git for Windows 路径
5. PATH 兜底查找 Cygwin/MSYS2 风格的 `bash.exe`

PATH 兜底会跳过 Windows/WSL 的 stub，例如：

```text
C:\Windows\System32\bash.exe
C:\Windows\Sysnative\bash.exe
C:\Users\<user>\AppData\Local\Microsoft\WindowsApps\bash.exe
```

这样可以避免在别处已经存在 Git Bash 时，却误启动一个损坏的或无关的 WSL 入口。

## 可定制入口

| 入口 | 位置 | 用途 |
|------|------|------|
| Extensions | `.pi/extensions/` | TypeScript hooks、工具、命令、UI、权限门禁。 |
| Prompts | `.pi/prompts/` | 可复用的提示词模板。 |
| Skills | `.pi/skills/` 或 `.agents/skills/` | 可复用的任务工作流和 agent 指令。 |
| 系统提示词覆盖 | `.pi/SYSTEM.md` | 替换本项目的默认系统提示词。 |
| 系统提示词追加 | `.pi/APPEND_SYSTEM.md` | 在不替换默认提示词的前提下追加项目特定行为。 |
| 上下文规则 | `AGENTS.md` | 给 coding agent 的仓库级持久指令。 |

这个本地权限门禁扩展刻意保持为项目级。它说明 LiRoah 特有行为可以先放在扩展入口里，再决定是否下沉到核心代码。

## 仓库结构

| 包 | 作用 |
|----|------|
| `packages/ai` | 继承自 Pi 的多供应商模型与 API 兼容层。 |
| `packages/agent` | Agent 运行时、消息流、工具和 harness 基础能力。 |
| `packages/coding-agent` | 交互式 CLI、TUI 集成、扩展、设置、会话和包级文档。 |
| `packages/tui` | 终端 UI 组件和渲染引擎。 |

部分包名仍然沿用上游 Pi 的命名。重命名应当跟随真实发布策略，而不是做纯粹的表面改动。

## 开发

在仓库根目录使用这些命令：

```bash
npm run check
./test.sh
```

可以在 `packages/coding-agent` 下运行针对性的包测试：

```bash
node node_modules/vitest/dist/cli.js --run test/shell-resolution.test.ts
```

基本规则：

- 代码改动后运行 `npm run check`。
- 变更某个行为时，优先跑针对性测试。
- 除非任务明确需要，否则不要跑完整 build 或完整 test。
- 不要把无关的生成文件或本地文件提交进去。

## 上游

`liroah-ai` 基于 Pi Agent Harness。上游文档仍然有助于理解继承下来的架构和扩展模型。

- 官网：<https://pi.dev>
- 上游仓库：<https://github.com/earendil-works/pi-mono>
- 包文档：[`packages/coding-agent/README.md`](packages/coding-agent/README.md)

## 许可证

MIT