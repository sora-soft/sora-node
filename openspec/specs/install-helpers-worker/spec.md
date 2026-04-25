## ADDED Requirements

### Requirement:addWorkerToProject helper
InstallHelpers MUST 提供 `addWorkerToProject(options)` 方法，封装 Worker 注册的完整流程：模板渲染、WorkerName enum 插入、WorkerRegister import/register 插入。

#### Scenario:Successful worker addition
- **When** install script 调用 `helpers.addWorkerToProject({templatePath, templateData, workerDir, workerFile, workerNameKey, workerNameValue, workerRegisterClass, workerRegisterMethod})`
- **Then** 系统 MUST 执行以下操作：
  1. 使用 art-template 渲染 `templatePath` 指定的模板文件，传入 `templateData`
  2. 将渲染结果写入 `<workerDir>/<workerFile>.ts`
  3. 在 `workerNameEnum` 指向的文件中，向对应 enum 插入 `{workerNameKey} = '{workerNameValue}'`
  4. 在 `workerRegister` 指向的文件中，添加 Worker 类的 import 语句
  5. 在 `workerRegister` 指向的 class 的 register 方法中，追加 `<WorkerClass>.register()` 调用

#### Scenario:WorkerName enum already has the key
- **When** `addWorkerToProject` 尝试插入一个已存在的 enum key
- **Then** 系统 MUST 报错 "Duplicate enum member '<key>' in enum '<enumName>'"

#### Scenario:WorkerRegister file not found
- **When** sora.json 中 `workerRegister` 指向的文件不存在
- **Then** 系统 MUST 报错并抛出描述性错误信息

### Requirement:Worker template rendering
`addWorkerToProject` MUST 使用 art-template 渲染 Worker 模板文件，模板文件路径由调用方提供（相对于组件包根目录）。渲染结果通过 FileTree 缓冲。

#### Scenario:Template with dynamic import paths
- **When** 模板包含 `<%- comImportPath %>` 和 `<%- workerNameImportPath %>` 占位符
- **Then** 系统 MUST 传入计算后的相对路径，生成正确的 import 语句

### Requirement:Worker import path calculation
`addWorkerToProject` MUST 自动从 sora.json 配置和 Worker 文件位置计算 import 路径。`comClass` 字段推导 ComponentName import 路径，`workerNameEnum` 字段推导 WorkerName import 路径。路径 MUST 使用 `Utility.resolveImportPath()` 计算。

#### Scenario:Paths computed from sora.json
- **When** sora.json 配置 `comClass: "lib/Com#Com"` 且 Worker 文件位于 `app/worker/DatabaseMigrateCommandWorker.ts`
- **Then** `comImportPath` MUST 为从 Worker 文件到 Com 文件的相对路径（如 `../../lib/Com.js`）
