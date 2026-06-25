# liroah-ai

`liroah-ai` is a secondary development project based on the open source [Pi Agent Harness](https://github.com/earendil-works/pi-mono). It keeps the core Pi agent experience as the baseline while extending the system for Liroah model gateway integration and coding-agent capability research.

## Project Positioning

The project has two main directions.

### liroah-api Gateway Adaptation

`liroah-ai` adapts Pi to the `liroah-api` aggregation gateway. The goal is to provide unified model access and gateway governance without leaking gateway details into the core agent workflow.

Expected capabilities include:

- Unified model access across upstream providers.
- Gateway-side authentication, quota, rate limit, and cost control.
- Model routing, fallback, retry, and degradation policies.
- Provider compatibility while preserving Pi's existing agent interaction model.

### Harness Engineering

`liroah-ai` keeps the base model unchanged and focuses on improving coding ability through agent framework work.

The harness direction includes:

- Better context organization for repository-level coding tasks.
- More reliable tool-use strategies for shell, file editing, tests, and review.
- Task decomposition and execution feedback loops.
- Reusable experiment infrastructure for coding-agent behavior.

## Supporting Evaluation System

Evaluation is an engineering support capability, not the main product direction. It should be used to verify whether gateway adaptation, harness changes, and coding-agent optimizations actually improve behavior.

The evaluation system should cover:

- Coding task regressions for bug fixes, edits, reviews, and test updates.
- Comparison across prompts, model routes, and tool strategies.
- Repeatable benchmark cases for harness experiments.
- Regression checks that protect the original Pi agent experience.

## Monorepo Packages

| Package | Description |
|---------|-------------|
| **[@earendil-works/pi-ai](packages/ai)** | Unified multi-provider LLM API layer |
| **[@earendil-works/pi-agent-core](packages/agent)** | Agent runtime with tool calling and state management |
| **[@earendil-works/pi-coding-agent](packages/coding-agent)** | Interactive coding-agent CLI |
| **[@earendil-works/pi-tui](packages/tui)** | Terminal UI library with differential rendering |

Package names may still contain upstream Pi naming while the secondary development work is in progress.

## Development

```bash
npm install --ignore-scripts
npm run check
./test.sh
./pi-test.sh
```

Notes:

- Run `npm run check` after code changes.
- Use `./test.sh` for the non-e2e test suite.
- Do not run full build or full test commands unless specifically needed.

## Upstream

This project is derived from Pi Agent Harness. Upstream documentation and design context remain useful for understanding the original runtime, package layout, and agent behavior.

- Website: <https://pi.dev>
- Upstream repository: <https://github.com/earendil-works/pi-mono>

## License

MIT
