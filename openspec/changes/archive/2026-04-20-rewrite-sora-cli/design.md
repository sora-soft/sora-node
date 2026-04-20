## Context

当前 `packages/sora-cli` 基于 commander，所有命令在 `index.ts` 单文件注册，核心逻辑堆积在 `lib/Command.ts`（~386行）。类型导出功能 `build:api-declare` 有三个并存的实现（`DTS.ts`、`DTSFile.ts`、`TSFile.ts`），实际使用 `DTSFile.ts`，依赖 ts-morph 通过 `emitToMemory` 生成 `.d.ts` 后再做后处理。

导出目标的发现完全基于约定：
- `handlerDir` 下的所有继承 `Route` 的类 → 自动导出 public 方法
- `databaseDir` 下的所有类 → 自动导出 public 属性
- `sora.json` 中 `serviceNameEnum` / `userErrorCodeEnum` / `customEnum` 指定枚举

这种约定驱动方式无法精确控制哪些类/方法需要导出，也不支持按客户端类型分组导出。

约束：
- monorepo 结构（pnpm workspace），sora-cli 作为内部工具包
- framework 是核心运行时包，新增装饰器必须不影响运行时行为
- TypeScript 项目，使用实验性装饰器（`experimentalDecorators` + `reflect-metadata`）

## Goals / Non-Goals

**Goals:**
- 用 oclif 框架重建 sora-cli，获得清晰的命令结构和插件化能力
- 用装饰器驱动替代约定驱动，精确控制导出目标
- 支持按模式（target）分组导出，每个模式生成独立 `.ts` 文件
- 用原生 TypeScript Compiler API 替代 ts-morph，减少依赖
- 简化 sora.json 配置

**Non-Goals:**
- 不改变 generate 系列命令的核心功能（service/worker/handler/database 生成）
- 不改变 framework 的运行时行为
- 不处理前端客户端如何使用导出文件的构建流程
- 不实现装饰器的参数验证（装饰器是纯标记，不做运行时检查）

## Decisions

### D1: oclif 作为 CLI 框架

**选择**: oclif (Open CLI Framework)

**替代方案**:
- commander（当前）: 缺乏命令自动发现、项目结构不规范
- yargs: 配置冗长，不如 oclif 结构化
- cac: 轻量但生态小

**理由**: oclif 原生支持 `command:subcommand` 模式（对应 `export:api`、`generate:service`），有标准的项目结构（`src/commands/`），支持 TypeScript 开箱即用，且被大型项目验证（Heroku CLI）。

### D2: 原生 TypeScript Compiler API 替代 ts-morph

**选择**: `typescript` 原生 API（`ts.createProgram`, `ts.TypeChecker`, `ts.factory`）

**替代方案**:
- ts-morph（当前）: 高层封装方便但引入额外依赖，且项目已有三套实现表明 ts-morph 的抽象不够合适

**理由**: 
1. 减少依赖（`typescript` 已是 devDependency）
2. 原生 API 对装饰器 AST 节点的访问更直接
3. `ts.factory` 提供完整的 AST 构建能力
4. 避免 ts-morph 对项目结构的假设与 monorepo 不兼容的问题

### D3: 装饰器放在 framework 包，以类静态方法组织

**选择**: `@sora-soft/framework` 导出 `Export` 类，装饰器为 `Export.route`, `Export.entity`, `Export.declare`, `Export.ignore` 静态方法

**替代方案**:
- 独立函数 `ExportRouteAPI`, `ExportEntityAPI` 等: 不一致，与 framework 中 `Route.method`/`Route.notify` 的风格不统一
- 独立包 `@sora-soft/sora-api-types`: 职责分离更干净，但增加维护成本

**理由**: 与 `Route.method`/`Route.notify` 保持一致的 API 风格（类静态方法作为装饰器工厂）。所有 Export 相关装饰器统一在 `Export` 命名空间下，语义清晰。用户项目已依赖 framework，无需额外安装。

### D4: 三种导出策略装饰器

**选择**: `@Export.route` / `@Export.entity` / `@Export.declare` 三种类装饰器，`@Export.ignore` 成员装饰器

**理由**: 三种导出目标需要完全不同的处理策略：
- Route 类：只导出 `@Route.method`/`@Route.notify` 标记的方法，只保留第一个参数
- Entity 类：只导出 public 属性，移除方法和构造函数
- 通用类/枚举：导出所有 public 成员

统一在 `Export` 类下以静态方法组织，与 `Route.method`/`Route.notify` 保持一致的 API 模式。

### D5: 装饰器 import 精确解析

**选择**: 通过 `ts.SourceFile` 的 `importDeclarations` 追踪装饰器来源模块

**理由**: 同名标识符可能来自不同包（如用户自定义 `Route` 类）。精确解析确保只识别 framework 的 `Route.method` 和 `Export.route` 等。实现上通过遍历 sourceFile 的 import 语句，匹配 `moduleSpecifier` 为 `@sora-soft/framework`。`Export.route` 在 AST 中为 `PropertyAccessExpression`，与 `Route.method` 解析逻辑一致。

### D6: 输出文件命名

**选择**: `{basePath}.ts`（全量）/ `{basePath}.{target}.ts`（按模式）

**示例**: `apiDeclarationOutput: "../dist-api-declaration/api"` → `api.ts`, `api.web.ts`, `api.admin.ts`

**理由**: 简洁，可预测，便于客户端项目选择性引用。

### D7: Export Pipeline 分阶段架构

**选择**: 6 阶段流水线 — ProgramBuilder → Collector → Transformer → TypeResolver → Emitter

**理由**: 每个阶段职责单一，可独立测试。Collector 做装饰器发现和过滤，Transformer 做 AST 转换，TypeResolver 做依赖解析。这与当前 DTSFile.ts 中发现、转换、解析混合在一起的方式形成对比。

## Risks / Trade-offs

**[类型依赖解析复杂度]** → 原生 TS API 的 TypeResolver 需要处理大量边界情况（泛型、条件类型、映射类型、循环引用）。缓解：参考当前 DTSFile.ts 已验证的逻辑，用 `checker.getTypeAtLocation()` + `symbol.declarations` 递归解析，内置类型（Promise, Date, Array 等）排除。

**[装饰器语法限制]** → TypeScript 实验性装饰器不支持 interface/type alias 装饰。缓解：interface 和 type 通过 TypeResolver 自动从依赖链中收集，无需装饰器标记。

**[sora.json 迁移]** → 移除 4 个配置字段是 breaking change。缓解：新 CLI 启动时检测到已移除字段时给出 warning 而不是报错，给用户迁移时间。

**[装饰器必须带括号]** → `@Export.declare` 无括号不被支持。缓解：这是明确的设计决策（modes 参数必须有），CLI 检测到无括号的装饰器时跳过该声明并给出提示。
