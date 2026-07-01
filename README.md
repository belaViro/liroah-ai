<h1 align="center">liroah-ai</h1>

<p align="center">A LiRoah-branded coding-agent harness built on Pi Agent Harness.</p>

<p align="center">
  <img alt="status" src="https://img.shields.io/badge/status-active-black?style=flat-square" />
  <img alt="node" src="https://img.shields.io/badge/node-%3E%3D22.19-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
</p>

`liroah-ai` is a second-stage development branch of [Pi Agent Harness](https://github.com/earendil-works/pi-mono). It keeps Pi's terminal-first coding agent core, while adding LiRoah-specific workflow polish, permission controls, Windows shell discovery, and future gateway-oriented harness work.

> Current status: the coding-agent base and local interaction improvements are active. The `liroah-api` aggregation gateway adapter is still a roadmap item, not a completed integration.

## Contents

- [What It Is](#what-it-is)
- [Implemented](#implemented)
- [Roadmap](#roadmap)
- [Quick Start](#quick-start)
- [Runtime Controls](#runtime-controls)
- [Windows Bash Discovery](#windows-bash-discovery)
- [Customization Surface](#customization-surface)
- [Repository Layout](#repository-layout)
- [Development](#development)
- [Upstream](#upstream)
- [License](#license)

## What It Is

`liroah-ai` is not only a rename of Pi. It is a harness-oriented fork for experimenting with coding-agent behavior while preserving Pi's core interaction model:

- terminal TUI first
- persistent coding sessions
- built-in `read`, `bash`, `edit`, `write`, `grep`, `find`, and `ls` tools
- project instructions through `AGENTS.md`
- local extensions, prompts, skills, and themes
- model/provider flexibility inherited from Pi

The project direction is practical: improve the agent shell, file-editing, permission, prompt, and evaluation workflow before hiding those mechanics behind larger product abstractions.

## Implemented

| Area | Current Behavior |
|------|------------------|
| Coding agent base | Inherits Pi's interactive coding agent, session model, tool execution, prompt/template/skill loading, and TUI components. |
| Tool permission gate | Project-local extension at `.pi/extensions/tool-permission-gate.ts` prompts before `bash`, `edit`, and `write` tool calls. It supports allow once, allow for session, and deny. |
| Startup experience | Interactive startup header uses a moving ANSI pixel animation. It enters from the left, exits to the right, then returns to a centered static display. |
| Animation controls | `PI_STARTUP_LOGO_INTERVAL_MS` controls frame cadence. `PI_STARTUP_LOGO_DURATION_MS` is numeric-only and capped at `10000ms`. |
| Windows shell discovery | Windows now follows a Claude Code-style Git Bash lookup: derive `bin\bash.exe` from `git.exe`, skip Windows/WSL bash stubs, and allow `LIROAH_GIT_BASH_PATH` override. |
| Version-check control | `PI_SKIP_VERSION_CHECK=1` disables the startup update notice. `PI_OFFLINE=1` disables all startup network operations. |
| Changelog discipline | Package changes are recorded under `packages/coding-agent/CHANGELOG.md` in the `[Unreleased]` section. |

## Roadmap

### liroah-api Gateway Adapter

The planned gateway direction is to connect the agent runtime to `liroah-api` without leaking gateway-specific details into the core agent workflow.

Planned concerns:

- unified upstream model access
- gateway-side auth, quota, rate limiting, and cost accounting
- routing, retry, fallback, and degradation strategy
- provider differences hidden behind stable agent-facing contracts
- compatibility with existing Pi model and session behavior

### Harness Engineering

The harness direction focuses on improving coding reliability without changing the base model:

- better context organization for repository-scale tasks
- safer tool invocation and user approval paths
- repeatable debugging, testing, and review workflows
- reusable agent orchestration experiments
- evaluation fixtures for coding regressions

## Quick Start

Install dependencies without lifecycle scripts:

```bash
npm install --ignore-scripts
```

Run project checks:

```bash
npm run check
```

Start the local interactive CLI from this repository:

```powershell
.\pi-test.ps1
```

On Unix-like shells:

```bash
./pi-test.sh
```

Disable the startup version check for a single PowerShell launch:

```powershell
$env:PI_SKIP_VERSION_CHECK="1"; .\pi-test.ps1
```

## Runtime Controls

| Variable | Purpose |
|----------|---------|
| `PI_SKIP_VERSION_CHECK=1` | Skip the startup `Update Available` notice. |
| `PI_OFFLINE=1` | Disable startup network operations, including update checks and telemetry. |
| `PI_STARTUP_LOGO_INTERVAL_MS` | Frame cadence for the startup pixel animation. Default is `220ms`; values are clamped to `10..1000ms`. |
| `PI_STARTUP_LOGO_DURATION_MS` | Total movement duration for the startup animation. Numeric-only, default `3000ms`, max `10000ms`; `0` makes it static. |
| `LIROAH_GIT_BASH_PATH` | Optional Windows override for Git Bash, for example `D:\Tools\Git\bin\bash.exe`. |

## Windows Bash Discovery

The `bash` tool expects a POSIX-style shell. On Windows, Git Bash is the preferred lightweight shell because it ships with Git for Windows and supports common commands such as `ls`, `grep`, `sed`, `find`, and `mkdir -p`.

Resolution order:

1. `shellPath` from settings
2. `LIROAH_GIT_BASH_PATH`
3. Git Bash derived from discovered `git.exe`
4. default Git for Windows paths under `Program Files`
5. PATH fallback for Cygwin/MSYS2-style `bash.exe`

PATH fallback skips Windows/WSL stubs such as:

```text
C:\Windows\System32\bash.exe
C:\Windows\Sysnative\bash.exe
C:\Users\<user>\AppData\Local\Microsoft\WindowsApps\bash.exe
```

This avoids accidentally starting a broken or unrelated WSL entrypoint when Git Bash is available elsewhere.

## Customization Surface

| Surface | Location | Use |
|---------|----------|-----|
| Extensions | `.pi/extensions/` | TypeScript hooks, tools, commands, UI, permission gates. |
| Prompts | `.pi/prompts/` | Reusable prompt templates. |
| Skills | `.pi/skills/` or `.agents/skills/` | Reusable task workflows and agent instructions. |
| System prompt override | `.pi/SYSTEM.md` | Replace the default system prompt for this project. |
| System prompt append | `.pi/APPEND_SYSTEM.md` | Append project-specific behavior without replacing the default prompt. |
| Context rules | `AGENTS.md` | Durable repository instructions for coding agents. |

The local permission gate extension is intentionally project-local. It demonstrates how LiRoah-specific behavior can live in the extension surface before being promoted into core code.

## Repository Layout

| Package | Role |
|---------|------|
| `packages/ai` | Multi-provider model and API compatibility layer inherited from Pi. |
| `packages/agent` | Agent runtime, message flow, tools, and harness primitives. |
| `packages/coding-agent` | Interactive CLI, TUI integration, extensions, settings, sessions, and package docs. |
| `packages/tui` | Terminal UI components and rendering engine. |

Some package names still use upstream Pi naming. Renaming should follow the actual release strategy rather than cosmetic churn.

## Development

Use these commands from the repository root:

```bash
npm run check
./test.sh
```

Targeted package tests can be run from `packages/coding-agent`:

```bash
node node_modules/vitest/dist/cli.js --run test/shell-resolution.test.ts
```

Rules of thumb:

- Run `npm run check` after code changes.
- Use focused tests for changed behavior.
- Do not run full build or full test unless the task requires it.
- Keep unrelated generated or local files out of commits.

## Upstream

`liroah-ai` is based on Pi Agent Harness. Upstream docs remain useful for understanding the inherited architecture and extension model.

- Website: <https://pi.dev>
- Upstream repository: <https://github.com/earendil-works/pi-mono>
- Package README: [`packages/coding-agent/README.md`](packages/coding-agent/README.md)

## License

MIT
