## Why

sora-cli 的 `generate:service`、`generate:worker`、`generate:command` 命令在生成 TypeScript 源码文件后，开发者需要手动编辑 `config.template.yml` 或 `config-command.template.yml` 来添加对应的运行时配置段。这一步容易遗漏，且没有自动校验，导致运行时因缺少配置而报错。

## What Changes

- `generate:service` 命令在生成 TS 文件后，自动在 `config.template.yml` 的 `services:` 段插入对应的 listener 配置。
- `generate:worker` 命令在生成 TS 文件后，自动在 `config.template.yml` 的 `workers:` 段插入空配置 `{}`。
- `generate:command` 命令在生成 TS 文件后，自动在 `config-command.template.yml` 的 `workers:` 段插入空配置 `{}`。
- 三个命令均新增 `--config-template` CLI 参数，支持非交互指定模板路径；未指定时触发交互式询问，默认值分别为 `run/config.template.yml`（service/worker）和 `run/config-command.template.yml`（command）。
- 插入前使用 js-yaml 解析进行重复检测，如已存在则输出 warning 并跳过。

## Capabilities

### New Capabilities
- `auto-config-insert`: 在 generate 命令执行时，自动向 config 模板文件插入 service/worker 配置段，包含字符串定位插入、重复检测、listener-to-config 映射。

### Modified Capabilities
<!-- 无现有规范需要修改 -->

## Impact

- **packages/sora-cli/src/commands/generate/service.ts** — 新增 config 插入逻辑
- **packages/sora-cli/src/commands/generate/worker.ts** — 新增 config 插入逻辑
- **packages/sora-cli/src/commands/generate/command.ts** — 新增 config 插入逻辑
- **packages/sora-cli/src/lib/** — 新增 config 模板操作工具模块
- **packages/sora-cli/package.json** — 可能需要新增 js-yaml 依赖（如尚未安装）
