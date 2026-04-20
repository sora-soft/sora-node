## 1. 项目准备

- [x] 1.1 将 `packages/sora-cli` 重命名为 `packages/sora-cli-back`，更新 pnpm-workspace.yaml（如需要）
- [x] 1.2 使用 oclif 初始化新的 `packages/sora-cli` 项目结构（`src/commands/`, `src/lib/`, `bin/`）
- [x] 1.3 配置 package.json：设置 bin 入口、依赖项（oclif 核心、art-template、isomorphic-git、inquirer、chalk、ora、原生 typescript）、移除 ts-morph
- [x] 1.4 配置 tsconfig.json，继承 monorepo 的 tsconfig.base.json

## 2. Framework 装饰器实现

- [x] 2.1 在 `packages/framework/src/lib/export/` 下创建 `Export.ts`，实现 `Export` 类，包含 `route`、`entity`、`common`、`ignore` 四个静态方法作为装饰器工厂（运行时 no-op）
- [x] 2.2 在 `packages/framework/src/index.ts` 中添加导出路径

## 3. 基础库迁移

- [x] 3.1 迁移 `Config` 类到 `src/lib/config.ts`：加载 sora.json + tsconfig.json，适配新的配置字段（移除 customEnum、userErrorCodeEnum）
- [x] 3.2 迁移 `FileTree` / `FileNode` / `ScriptFileNode` 到 `src/lib/fs/`
- [x] 3.3 迁移 `Utility` 类到 `src/lib/utility.ts`
- [x] 3.4 迁移 AST 操作工具（`AST` 类中的 enum 插入、import 添加、代码插入等方法）到 `src/lib/ast/code-inserter.ts`，改用原生 ts API 重写
- [x] 3.5 迁移 art-template 模板文件到 `src/lib/template/`

## 4. Export API Pipeline — 装饰器读取层

- [x] 4.1 实现 `src/lib/exporter/types.ts`：定义所有类型接口（ExportClassInfo, MethodDecorationInfo, PropertyDecorationInfo, ExportPlan, RouteExportInfo, EntityExportInfo, GenericExportInfo 等）
- [x] 4.2 实现 `src/lib/exporter/decorator-reader.ts`：装饰器 AST 解析，包括 CallExpression / PropertyAccessExpression 模式匹配
- [x] 4.3 实现 import 精确解析：遍历 sourceFile 的 importDeclarations，追踪装饰器标识符到 `@sora-soft/framework` 模块

## 5. Export API Pipeline — 核心流水线

- [x] 5.1 实现 `src/lib/exporter/program-builder.ts`：扫描 root 目录收集 .ts 文件，创建 ts.Program 和 TypeChecker
- [x] 5.2 实现 `src/lib/exporter/collector.ts`：遍历所有 sourceFile，使用 DecoratorReader 发现并分类导出目标（识别 `Export.route`/`Export.entity`/`Export.declare`），应用模式过滤逻辑，检测重复装饰器报错
- [x] 5.3 实现 `src/lib/exporter/transformer.ts`：按策略转换 AST — Route 策略（识别 @Route.method/@Route.notify，只保留第一个参数）、Entity 策略（只保留 public 属性）、Generic 策略（public 方法和属性）、Enum 策略（原样），使用 ts.factory 创建新节点
- [x] 5.4 实现 `src/lib/exporter/type-resolver.ts`：递归解析类型依赖链，自动收集 interface / type alias / enum，排除 node_modules 内置类型，处理循环引用
- [x] 5.5 实现 `src/lib/exporter/emitter.ts`：按 target 分组生成输出文件，使用 ts.createPrinter 输出文本，支持全量 + 多 target 同时输出，添加文件头注释

## 6. oclif 命令实现

- [x] 6.1 实现 `src/base.ts`：oclif BaseCommand，封装 Config 加载和 FileTree 初始化逻辑
- [x] 6.2 实现 `src/commands/export/api.ts`：export:api 命令，串联 ProgramBuilder → Collector → Transformer → TypeResolver → Emitter，支持 `--target` 可选多值参数
- [x] 6.3 实现 `src/commands/generate/service.ts`：迁移 generate:service 逻辑，使用新的 Config 和 AST 工具
- [x] 6.4 实现 `src/commands/generate/handler.ts`：迁移 generate:handler 逻辑
- [x] 6.5 实现 `src/commands/generate/worker.ts`：迁移 generate:worker 逻辑
- [x] 6.6 实现 `src/commands/generate/database.ts`：迁移 generate:database 逻辑
- [x] 6.7 实现 `src/commands/config.ts`：迁移 config 命令逻辑
- [x] 6.8 实现 `src/commands/new.ts`：迁移 new 项目命令逻辑

## 7. 集成验证

- [x] 7.1 在 apps/example 中为 AuthHandler 添加 `@Export.route()` 装饰器，为数据库实体添加 `@Export.entity()`，为枚举添加 `@Export.declare()`
- [x] 7.2 更新 apps/example 的 sora.json：移除 handlerDir（仅保留供 generate:handler 使用）、databaseDir（仅保留供 generate:database 使用）、userErrorCodeEnum、customEnum
- [x] 7.3 运行 `sora export:api` 验证全量导出
- [x] 7.4 运行 `sora export:api --target=web --target=admin` 验证多模式导出
- [x] 7.5 验证 generate 系列命令（service, handler, worker, database）功能正常
