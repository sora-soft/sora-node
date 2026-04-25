## ADDED Requirements

### Requirement:DatabaseMigrateCommandWorker template
database-component 包 MUST 在 `bin/templates/DatabaseMigrateCommandWorker.ts.art` 提供通用化的 Worker 模板。模板 MUST 无项目特异性依赖，所有项目相关的 import 路径通过模板变量注入。

#### Scenario:Template variables
- **When** 模板被渲染
- **Then** MUST 支持以下模板变量：
  - `comImportPath`: ComponentName 的相对 import 路径
  - `workerNameImportPath`: WorkerName 的相对 import 路径
  - `workerNameEnum`: WorkerName enum 的名称（默认 `WorkerName`）
  - `componentName`: 数据库组件的名称（如 `business-database`）

### Requirement:Template uses no project-specific imports
模板 MUST NOT import 任何项目特有的模块（如 AppError、Application、ErrorCode、UserError、Types）。所有外部依赖 MUST 来自 npm 包或 framework。

#### Scenario:Error handling
- **When** Worker 中需要抛出错误
- **Then** MUST 使用原生 `Error` 类，不使用项目的 AppError/UserError

#### Scenario:Logging
- **When** Worker 中需要输出日志
- **Then** MUST 使用 `Runtime.frameLogger`（来自 `@sora-soft/framework`），不使用项目的 Application.appLog

#### Scenario:Config interface
- **When** Worker 需要读取 sora.json 配置
- **Then** MUST 内联定义 `interface ISoraConfig`，包含 `migration: string`、`dist: string`、`root: string` 字段，不 import 项目的 Types.ts

### Requirement:Worker supports five migration subcommands
模板渲染生成的 Worker MUST 支持 5 个子命令：`generate`、`sync`、`migrate`、`revert`、`drop`。

#### Scenario:generate subcommand
- **When** Worker 收到 `generate` 命令
- **Then** MUST 为 options.components 中每个 component 创建 TypeORM migration 文件，输出到 `<root>/<migration>/<componentName>/` 目录

#### Scenario:sync subcommand
- **When** Worker 收到 `sync` 命令
- **Then** MUST 使用 `synchronize: true` 直接同步 entity schema 到数据库

#### Scenario:migrate subcommand
- **When** Worker 收到 `migrate` 命令
- **Then** MUST 从 `<dist>/<migration>/<componentName>/` 加载 `.js` migration 文件并执行

#### Scenario:revert subcommand
- **When** Worker 收到 `revert` 命令
- **Then** MUST 撤销最后一次 migration

#### Scenario:drop subcommand
- **When** Worker 收到 `drop` 命令
- **Then** MUST 删除整个数据库

### Requirement:Template distributed with database-component
模板文件 MUST 位于 `@sora-soft/database-component` 包的 `bin/templates/` 目录下，随包一起分发。install script 通过 `__dirname` 或 `import.meta.url` 定位模板文件。

#### Scenario:Template accessible from install script
- **When** install.js 在 `bin/install.js` 中调用 `helpers.addWorkerToProject()`
- **Then** 模板路径 MUST 解析为同包内 `bin/templates/DatabaseMigrateCommandWorker.ts.art` 的绝对路径
