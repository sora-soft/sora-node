## Context

sora-cli 的 `export:api` 命令通过一个 5 阶段管线（ProgramBuilder → Collector → Transformer → TypeResolver → Emitter）将 TypeScript 源码中的类型声明导出为 API 声明文件。当前系统使用 `@Export` 装饰器（`@Export.route()`、`@Export.entity()`、`@Export.declare()`、`@Export.ignore()`）标记需要导出的声明，但这些装饰器在 `packages/framework` 中是纯 no-op，仅作为 CLI 静态分析的标记。

TypeScript 实验性装饰器的限制是根本性的：enum、interface、type alias 不支持装饰器语法。当前 enum 通过 AST fallback（手动遍历 `modifiers` 数组）勉强工作，但仍触发 TS(1206) 编译错误和 ESLint 报错。interface 和 type alias 完全无法标记，只能依赖 TypeResolver 的隐式类型引用发现。

## Goals / Non-Goals

**Goals:**
- 提供适用于所有声明类型（class、enum、interface、type alias、method、property）的统一标记方式
- 消除 enum 上的 TS(1206) 编译错误
- 使 interface 和 type alias 支持显式导出标记
- 统一"通用导出"语义：非 route/entity 的声明统一处理，不做额外特殊过滤
- 彻底移除 `Export` 装饰器类，减少 framework 包的 API 表面积

**Non-Goals:**
- 不改变 `@Route.method` / `@Route.notify` 的工作方式（它们有运行时语义，与导出标记无关）
- 不改变 TypeResolver 的自动发现机制（隐式发现仍然作为补充路径存在）
- 不改变 Emitter 的输出格式
- 不改变 `--target` 过滤的语义
- 不引入新的运行时依赖

## Decisions

### Decision 1: 使用 JSDoc 标注替代装饰器

**选择**: `@soraExport` / `@soraTargets` / `@soraIgnore` 三个自定义 JSDoc tag

**考虑的替代方案**:
- **单独配置文件**（如 `export.config.ts`）：声明与标记分离，维护负担大，容易不同步
- **命名约定**（如 `export` 前缀）：不够灵活，无法表达 route/entity 策略差异
- **只替换 enum，保留 class 装饰器**：两套标记机制并存，认知负担高

**理由**: JSDoc 是 TypeScript 原生支持的注释语法，适用于所有声明类型，不引入新依赖，且不改变运行时行为。

### Decision 2: 使用 `ts.getJSDocTags()` API 解析

**选择**: 直接使用 TypeScript compiler API 的 `ts.getJSDocTags(node)` 读取 JSDoc tag

**考虑的替代方案**:
- **正则匹配注释文本**：更灵活但不安全，容易误匹配
- **第三方 JSDoc 解析库**：引入不必要的依赖

**理由**: TypeScript compiler API 已经在 ProgramBuilder 阶段创建了 `ts.Program`，`ts.getJSDocTags()` 是现成可用的。自定义 tag 如 `@soraExport` 会作为 `ts.JSDocTag` 返回，`tagName.text` 为 `"soraExport"`，`comment` 部分可提取参数。

### Decision 3: 简化 ExportPlan 类型结构

**选择**: 将原来的 `generics: ExportClassInfo[]` + `enums: ExportEnumInfo[]` 统一为 `simple: ExportSimpleInfo[]`

```
Before:
  ExportPlan { routes, entities, generics, enums }

After:
  ExportPlan { routes, entities, simple }
```

**理由**: route 和 entity 有各自特殊的 transform 策略（route 只导出 RPC 方法、entity 只导出 public 属性），必须分开。其他所有类型（generic class、enum、interface、type alias）的 transform 逻辑都是"加 export declare，内容原样保留"，统一处理即可。

### Decision 4: 成员级 @soraIgnore 改为 Transformer 阶段直接读取

**选择**: Collector 不再收集 `methodDecorations` / `propertyDecorations`；Transformer 遍历成员时直接通过 `ts.getJSDocTags(member)` 读取 `@soraIgnore`

**理由**: 减少 Collector 和 Transformer 之间的数据耦合，每个阶段职责更清晰。Collector 只负责"哪些声明需要导出"，Transformer 负责具体成员的过滤。

### Decision 5: 生成文件中剥离 `@soraExport` / `@soraTargets` / `@soraIgnore` 标签

**选择**: Transformer 在输出时清理这些自定义 tag，保留其他 JSDoc 文档注释

**理由**: 这些 tag 是构建标记，不属于 API 声明。下游消费者不应看到构建内部标记。

### Decision 6: 通用 class 导出的 member 处理

**选择**: 通用 class 导出时保留所有 public method 和 property（跳过 private/protected/static/constructor），与现有 `transformGenericClass` 行为一致

**理由**: 用户选择"通用导出"就意味着导出全部公开 API，不需要像 route/entity 那样做选择性过滤。

## Risks / Trade-offs

**[Tag 名称迁移成本]** → 所有下游项目的 `@Export.*` 必须手动迁移为 JSDoc 标注，无法自动兼容。缓解：变更范围是纯机械替换，可以写简单的 codemod 辅助。

**[ts.getJSDocTags() 对自定义 tag 的解析行为]** → TypeScript 的 JSDoc 解析对非标准 tag 的 `comment` 字段格式可能在不同版本间有细微差异。缓解：在 AnnotationReader 中对 comment 做 trim() + normalize 处理；如果发现 API 不稳定，可退回到正则解析注释文本。

**[IDE 支持]** → `@soraExport` 是自定义 tag，IDE 不会提供自动补全或校验。缓解：可通过 `.vscode/settings.json` 的 `jsdoc.tags` 配置或 TSDoc 定义文件提供基本提示。

**[ExportPlan 结构变更]** → 将 `generics` + `enums` 合并为 `simple` 是破坏性类型变更。缓解：仅影响 sora-cli 内部，不影响外部 API。
