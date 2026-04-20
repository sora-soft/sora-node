## ADDED Requirements

### 需求:oclif 项目结构
新的 sora-cli 必须基于 oclif 框架构建，使用标准 oclif 项目结构。命令定义在 `src/commands/` 目录下，支持冒号分隔的子命令（如 `export:api`, `generate:service`）。共享逻辑放在 `src/lib/` 目录下。

#### 场景:命令注册
- **当** 用户安装新 sora-cli 并运行 `sora --help`
- **那么** 显示所有可用命令：`new`, `config`, `export:api`, `generate:service`, `generate:handler`, `generate:worker`, `generate:database`

#### 场景:子命令路由
- **当** 用户运行 `sora export:api --target=web`
- **那么** oclif 路由到 `src/commands/export/api.ts` 中的命令类

### 需求:generate:service 命令迁移
新 sora-cli 必须保留 `generate:service` 命令的功能：根据 `sora.json` 配置生成 Service 文件、注册枚举值、注册到 ServiceRegister。使用 art-template 模板引擎。

#### 场景:生成 Service
- **当** 用户运行 `sora generate:service -n auth`
- **那么** 在 `serviceDir` 下生成 `AuthService.ts`，在 `serviceNameEnum` 枚举中注册，在 `serviceRegister` 中调用 `register()`

#### 场景:带 Handler 的 Service
- **当** 用户运行 `sora generate:service -n auth --with-handler`
- **那么** 同时生成对应的 Handler 文件

#### 场景:Dry-run 模式
- **当** 用户运行 `sora generate:service -n auth --dry-run`
- **那么** 显示将要生成的文件但不写入磁盘

### 需求:generate:handler 命令迁移
新 sora-cli 必须保留 `generate:handler` 命令：在 `handlerDir` 下生成 Handler 文件（从模板）。注意：虽然 export:api 不再依赖 `handlerDir`，但 generate:handler 仍需要知道 handler 文件的存放位置。`handlerDir` 保留在 sora.json 中仅供 generate 命令使用。

#### 场景:生成 Handler
- **当** 用户运行 `sora generate:handler -n auth`
- **那么** 在 `handlerDir` 下生成 `AuthHandler.ts`

### 需求:generate:worker 命令迁移
新 sora-cli 必须保留 `generate:worker` 命令的功能：生成 Worker 文件、注册枚举值、注册到 WorkerRegister。

#### 场景:生成 Worker
- **当** 用户运行 `sora generate:worker -n scheduler`
- **那么** 在 `workerDir` 下生成 `SchedulerWorker.ts`，在 `workerNameEnum` 枚举中注册，在 `workerRegister` 中调用 `register()`

### 需求:generate:database 命令迁移
新 sora-cli 必须保留 `generate:database` 命令的功能：生成或扩展数据库实体文件，支持组件注入。

#### 场景:新建数据库文件
- **当** 用户运行 `sora generate:database -n Account -f Account`
- **那么** 在 `databaseDir` 下创建 `Account.ts`（从模板生成）

#### 场景:扩展已有数据库文件
- **当** 目标文件已存在
- **那么** 在文件末尾追加新的实体类定义

#### 场景:带组件注入
- **当** 用户运行 `sora generate:database -n Account -f Account -c business`
- **那么** 在 Com 类中注册该实体到对应组件

### 需求:config 命令迁移
新 sora-cli 必须保留 `config` 命令：基于模板文件生成配置文件，支持变量定义和交互式填写。

#### 场景:生成配置文件
- **当** 用户运行 `sora config -t template.json -d dist.json`
- **那么** 解析模板中的变量定义，交互式收集值，生成配置文件

### 需求:new 命令迁移
新 sora-cli 必须保留 `new` 命令：从 Git 仓库克隆模板项目，交互式填写项目信息。

#### 场景:创建新项目
- **当** 用户运行 `sora new my-project`
- **那么** 克隆模板仓库，交互式收集项目信息，生成 package.json

### 需求:sora.json 配置简化
新 sora.json 必须移除以下字段：`handlerDir`（仅 generate:handler 需要，改为从命令参数或保留）、`databaseDir`（改为 generate:database 命令参数或保留）、`userErrorCodeEnum`、`customEnum`。保留 `handlerDir` 和 `databaseDir` 仅供 generate 命令使用。

#### 场景:移除 customEnum
- **当** export:api 扫描源码
- **那么** 不再从 sora.json 的 `customEnum` 读取枚举列表，而是通过 `@Export.declare()` 装饰器标记

#### 场景:移除 userErrorCodeEnum
- **当** 用户需要导出错误码枚举
- **那么** 在枚举上添加 `@Export.declare()` 装饰器，而非通过 sora.json 配置

### 需求:旧 sora-cli 保留为参考
现有 `packages/sora-cli` 必须重命名为 `packages/sora-cli-back`，仅作为功能需求和代码参考。新 `packages/sora-cli` 为全新创建。

#### 场景:旧代码保留
- **当** 开发者需要参考旧实现
- **那么** 可以查看 `packages/sora-cli-back` 中的代码
