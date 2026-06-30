# liroah-ai

`liroah-ai` 是基于开源项目 [Pi Agent Harness](https://github.com/earendil-works/pi-mono) 的二次开发版本。项目以保留 Pi 原有 Agent 核心体验为前提，围绕 `liroah-api` 聚合网关适配和 coding agent 能力增强继续演进。

## 项目定位

`liroah-ai` 不是简单改名版本，而是在 Pi 的基础上增加面向模型网关治理和 Agent 框架优化的二开能力。

项目主线包括两个方向。

### liroah-api 聚合网关适配

`liroah-ai` 将适配 `liroah-api` 聚合网关，在不改变核心 Agent 使用体验的前提下，实现统一模型接入与网关治理。

该方向关注：

- 统一接入不同上游模型与模型供应商。
- 支持网关侧认证、配额、限流和成本统计。
- 支持模型路由、重试、降级与 fallback 策略。
- 避免将网关差异泄漏到 Agent 核心逻辑中。
- 保持 Pi 既有 coding agent 交互方式和工作流稳定。

### Harness 工程

`liroah-ai` 将建设 harness 工程，用于优化 agent 框架本身。在不替换基座模型的前提下，通过工程策略增强 coding 能力。

该方向关注：

- 优化仓库级 coding 任务的上下文组织方式。
- 改进 shell、文件编辑、测试、代码审查等工具调用策略。
- 建立任务分解、执行反馈和结果复盘机制。
- 沉淀可复用的 agent 编排、实验和验证能力。
- 在框架层提升稳定性、可控性和可解释性。

## 启动界面定制

交互式 coding agent 的启动 Header 支持动态像素标题。当前默认使用参考自 [`klange/nyancat`](https://github.com/klange/nyancat) 的 ANSI 像素动画，替代原静态 `LIROAH` 大标题。

实现集中在 `packages/coding-agent/src/modes/interactive/interactive-mode.ts` 的启动 Logo 边界区：

- `STARTUP_LOGO_VARIANT` 控制当前标题方案，可在 `nyancat` 和 `liroah` 之间切换。
- 原 `LIROAH` 块字方案保留在 `LIROAH_LOGO_LINES` 和 `renderLiroahStartupLogo`，作为明确回退路径。
- `nyancat` 渲染使用完整列和上下半块字符压缩高度，避免动画帧切换时猫身像素缺失。
- Header 渲染阶段会按终端宽度居中，并在扩展 Header 接管或程序退出时暂停/清理动画定时器。

相关改动后建议运行：

```bash
npx biome check packages/coding-agent/src/modes/interactive/interactive-mode.ts
npx tsgo --noEmit -p tsconfig.json
./pi-test.ps1 --help
```
## 评测体系

评测体系是工程保障能力，不作为项目主线卖点。它用于验证网关适配、harness 改造和 coding 能力优化是否真的产生效果。

评测体系应覆盖：

- bug 修复、代码编辑、测试补充、代码审查等 coding 任务回归。
- 不同 prompt、模型路由和工具策略的对比实验。
- harness 优化前后的可重复 benchmark。
- 对 Pi 原有 Agent 体验的回归保护。

## Monorepo 包结构

| Package | Description |
|---------|-------------|
| **[@earendil-works/pi-ai](packages/ai)** | 统一多模型供应商 API 层 |
| **[@earendil-works/pi-agent-core](packages/agent)** | Agent 运行时、工具调用与状态管理 |
| **[@earendil-works/pi-coding-agent](packages/coding-agent)** | 交互式 coding agent CLI |
| **[@earendil-works/pi-tui](packages/tui)** | 支持差分渲染的终端 UI 库 |

当前部分包名仍保留上游 Pi 命名。二开过程中会根据实际发布策略逐步调整。

## 开发命令

```bash
npm install --ignore-scripts
npm run check
./test.sh
./pi-test.sh
```

说明：

- 代码改动后运行 `npm run check`。
- 非 e2e 测试使用 `./test.sh`。
- 除非明确需要，不运行完整 build 或完整 test 命令。

## 上游项目

本项目二开自 Pi Agent Harness。上游文档和设计仍可用于理解原始运行时、包结构和 Agent 行为。

- 官网：<https://pi.dev>
- 上游仓库：<https://github.com/earendil-works/pi-mono>

## License

MIT
