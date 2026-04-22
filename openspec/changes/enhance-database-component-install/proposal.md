## Why

`sora add:component @sora-soft/database-component` 目前只生成 Component 注册（Com.ts）、配置模板、migration 目录和 sora.json 字段。但一个可用的数据库组件还需要 `DatabaseMigrateCommandWorker`（处理 generate/sync/migrate/revert/drop 五个子命令）、对应的 package.json scripts、Worker 注册、以及 command config 模板。这些都需要开发者手动从 `account-cluster-template` 复制粘贴，容易出错且遗漏依赖。此外，config 模板路径在 CLI 中全部硬编码，sora.json 缺少声明式配置能力。

## What Changes

- **InstallHelpers 接口扩展**：新增 `addWorkerToProject()`、`mergePackageScripts()`、`mergePackageDependencies()`、`appendToCommandConfigTemplate()` 四个通用 helper 方法。
- **database-component install.js 增强**：Phase 2 生成 `DatabaseMigrateCommandWorker.ts`（从模板渲染）并注册 Worker；Phase 3 添加 package.json scripts、检查/添加运行时依赖、写入 command config 模板。
- **DatabaseMigrateCommandWorker 模板通用化**：移除项目特异性依赖（AppError/Application/ErrorCode/UserError/ISoraConfig），改为 framework Runtime 日志、原生 Error、内联 ISoraConfig interface，import 路径从 sora.json 配置推导。
- **sora.json 新增 `configTemplates` 字段**：声明式定义 server 和 command config 模板路径，替代 CLI 中的硬编码默认值。
- **`sora config` 命令增强**：支持 `--all` 模式，自动遍历 `configTemplates` 生成所有配置文件。
- **`generate:*` 命令改进**：prompt 默认值从 `configTemplates` 读取，而非硬编码。

## Capabilities

### New Capabilities
- `install-helpers-worker`: install script 中注册 Worker（WorkerName enum + WorkerRegister + 模板渲染）的 helper 能力
- `install-helpers-package-ops`: install script 中操作 package.json（scripts 合并、依赖检查与添加）的 helper 能力
- `install-helpers-command-config`: install script 中向 command config 模板追加配置的 helper 能力
- `config-templates-declaration`: sora.json 中声明式定义 config 模板路径，CLI 各命令从 sora.json 读取而非硬编码
- `database-migrate-worker-template`: 通用化的 DatabaseMigrateCommandWorker 模板，由 database-component 包分发

### Modified Capabilities
- `add-component-command`: install script 新增 Phase 2（Worker 生成）和 Phase 3（scripts/依赖/command config）

## Impact

- **sora-cli**: `Config.ts`（ISoraConfig 接口）、`InstallHelpers.ts`（4 个新方法）、`ComponentInstallerTypes.ts`（InstallHelpers 接口）、`commands/config.ts`（--all 模式）、`commands/generate/worker.ts`、`commands/generate/service.ts`、`commands/generate/command.ts`（读取 configTemplates）
- **database-component**: `bin/install.js`（大幅增强）、新增 `bin/templates/DatabaseMigrateCommandWorker.ts.art`
- **template apps**（account-cluster-template、http-server-template、base-cluster-template）：`sora.json` 添加 `configTemplates` 字段
- **无 BREAKING CHANGE**：所有新字段都是 optional，已有项目无需修改
