## Context

当前 `sora add:component` 的 install script 机制（Phase 1）已能完成 Component 注册、配置模板、目录创建和 sora.json 字段合并。但 database-component 的完整使用场景远不止于此 —— 开发者还需要手动创建 `DatabaseMigrateCommandWorker`（228 行代码）、注册 Worker、添加 5 个 npm scripts、安装 3 个运行时依赖（camelcase/mkdirp/moment）、配置 command config 模板。

当前 CLI 中 config 模板路径全部硬编码（`run/config.template.yml`、`run/config-command.template.yml`），散布在 `InstallHelpers.findConfigTemplate()`、`generate:command`、`generate:worker`、`generate:service` 四处，无法通过 sora.json 声明。

## Goals / Non-Goals

**Goals:**
- 单次 `sora add:component @sora-soft/database-component` 完成所有数据库相关脚手架，零手动复制
- Helper 接口新增的能力是通用的 —— 其他 component 也可以注册 Worker、操作 package.json
- `DatabaseMigrateCommandWorker` 模板完全无项目特异性，import 路径从 sora.json 配置推导
- sora.json 的 `configTemplates` 字段让 config 模板路径可声明，消除硬编码
- `sora config --all` 支持一键生成所有配置
- 所有变更向后兼容，新字段 optional，已有项目无需修改

**Non-Goals:**
- 不自动运行 `npm install` —— 只修改 package.json 并提示用户手动执行
- 不将 `generate:command` 的逻辑作为子流程调用（避免耦合），但复用相同的 AST 操作模式
- 不改变 `sora new` 模板生成流程
- 不重构现有 install script 的 Phase 1 逻辑

## Decisions

### Decision 1: Helper 方法设计 —— 独立原子操作 vs 高层组合

**选择：独立原子操作**（`addWorkerToProject` 作为组合封装，但底层是 `addWorkerName` + `addWorkerRegister` + `writeFile` 的组合）

理由：`addWorkerToProject()` 封装了 WorkerName enum 插入 + WorkerRegister import/register 插入 + 模板渲染写入三个步骤，但对 install script 暴露为一个调用。内部使用已有的 `CodeInserter` AST 操作。同时暴露底层的 `addWorkerName()`、`addWorkerRegister()` 以备需要更细粒度控制的场景。

**备选方案：** 让 install.js 直接调用 `generate:command` 命令 —— 被排除，因为耦合两个子系统且 generate:command 会创建默认模板而非 database-component 专用模板。

### Decision 2: DatabaseMigrateCommandWorker 模板通用化策略

**选择：消除所有项目特异性依赖**

| 原始依赖 | 替代方案 |
|---------|---------|
| `AppError` + `AppErrorCode` | `new Error(...)` |
| `UserError` + `UserErrorCode` | `new Error(...)` |
| `Application.appLog` | `Runtime.frameLogger` (from `@sora-soft/framework`) |
| `ISoraConfig` (项目 Types.ts) | 内联 `interface ISoraConfig { migration: string; dist: string; root: string; }` |
| `ComponentName` (项目 Com.ts) | 模板变量 `<%- comImportPath %>` |
| `WorkerName` (项目 WorkerName.ts) | 模板变量 `<%- workerNameImportPath %>` |

模板只需要 4 个变量：`comImportPath`、`workerNameImportPath`、`workerNameEnum`、`componentName`。前两个从 sora.json 的 `comClass`/`workerNameEnum` 字段 + Worker 文件的相对路径计算得出。

### Decision 3: sora.json `configTemplates` 字段结构

**选择：optional 的 `{ server?: string, command?: string }`**

```json
{
  "configTemplates": {
    "server": "run/config.template.yml",
    "command": "run/config-command.template.yml"
  }
}
```

不使用数组形式，因为 server 和 command 在框架中有语义区分 —— server 用于应用启动配置，command 用于命令行 Worker 配置。

**备选方案：** 使用 `configTemplates: [{type: 'server', path: '...'}, ...]` 数组 —— 被排除，增加了不必要的复杂度，当前只有两种类型。

### Decision 4: Command config 模板不存在时的处理

**选择：由 install.js 创建最小化的 `config-command.template.yml`**

当 `configTemplates.command` 指定的文件不存在时，install script 创建包含以下内容的最小模板：
- 必要的 `#define` 变量（从 server config 模板复用 database 相关的 define）
- `components.<componentName>` 数据库配置段
- `workers.database-migrate-command` 配置段

同时向 sora.json 写入 `configTemplates.command` 路径。

### Decision 5: 依赖管理策略

**选择：修改 package.json + 提示用户运行 install**

`mergePackageDependencies()` 检查项目 package.json 的 `dependencies` 和 `devDependencies`，只添加不存在的依赖到 `dependencies`。通过 FileTree 缓冲。commit 后输出提示信息。

不自动执行 `npm install` —— 理由是 install 可能有网络问题或需要用户确认版本，保持 CLI 操作的确定性和可预测性。

### Decision 6: Worker 注册的 AST 操作

WorkerName enum 和 WorkerRegister 的修改复用 `CodeInserter` 已有的 `insertEnum`、`addImport`、`insertCodeInClassMethod` 方法。这些方法已通过 `generate:command` 验证可行。

模板变量计算：
- `comImportPath`：从 Worker 文件路径到 `comClass` 路径（去掉 `#Com` 部分）的相对路径，用 `Utility.resolveImportPath()` 计算
- `workerNameImportPath`：从 Worker 文件路径到 `workerNameEnum` 路径（去掉 `#WorkerName` 部分）的相对路径

## Risks / Trade-offs

**[AST 操作失败]** → WorkerName.ts 或 WorkerRegister.ts 如果格式不符合预期（非标准 enum/class），`CodeInserter` 会 throw。install.js 应在 `postMessage` 中提示如果 Worker 注册失败需手动添加。FileTree 事务保证会回滚所有变更。

**[模板 import 路径计算错误]** → `resolveImportPath` 依赖文件相对位置。如果 sora.json 中的路径配置与实际文件结构不一致，生成的 Worker 会有错误的 import。缓解：install.js 在写入前验证 sora.json 中引用的文件存在。

**[多 component 场景]** → 如果项目已有其他 Worker（如 AuthCommandWorker），WorkerName enum 和 WorkerRegister 的 AST 插入应该是 append 模式，不会覆盖已有内容。`CodeInserter` 已处理此情况。

**[package.json 合并冲突]** → 如果用户已有同名的 script key（如 `migrate`），`mergePackageScripts` 应跳过并 warn，不覆盖。这遵循 `mergeJSON` 现有的冲突处理模式。

**[config-command.template.yml 鸡生蛋问题]** → 全新项目可能从未创建过 command config 模板。通过 Decision 4 的最小化模板创建解决，但这意味着 `sora config` 命令对 command 模板的处理需要和 server 模板一样稳定。
