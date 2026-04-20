## Why

sora-cli 使用 `@Export` 装饰器标记需要导出的类型声明，但 TypeScript 的实验性装饰器不支持 enum、interface、type alias。enum 上使用装饰器会触发 `TS(1206): Decorators are not valid here` 编译错误和 ESLint 报错。当前 enum 通过 AST fallback hack 勉强工作，但 interface 和 type alias 完全无法显式标记导出意图，只能依赖 TypeResolver 的隐式自动发现——如果它们不被任何已导出类型引用，就会遗漏。

JSDoc 标注是 TypeScript 原生支持的注释语法，适用于所有声明类型（class、enum、interface、type alias、method、property），是天然的全类型标记方案。

## What Changes

- **移除** `packages/framework` 中的 `Export` 装饰器类及其所有导出
- **移除** `packages/sora-cli` 中的 `DecoratorReader`，替换为基于 JSDoc 的 `AnnotationReader`
- **新增** 三个 JSDoc tag：`@soraExport`、`@soraTargets`、`@soraIgnore`
- **扩展** Collector 和 Transformer 以支持 interface 和 type alias 的显式导出
- **简化** `ExportPlan` 类型结构，将原 `generics` + `enums` 统一为 `simple` 通用导出
- **迁移** `apps/example` 中所有 `@Export.*` 用法为 JSDoc 标注
- **BREAKING**: 所有使用 `@Export` 装饰器的下游项目必须迁移到 JSDoc 标注

## Capabilities

### New Capabilities
- `jsdoc-export-annotations`: JSDoc 标注驱动的导出标记系统，替代 `@Export` 装饰器。定义 `@soraExport`、`@soraTargets`、`@soraIgnore` 三个 tag 的语法、语义和解析规则，覆盖所有声明类型。

### Modified Capabilities
- `api-export-pipeline`: Collector 和 Transformer 的输入从装饰器 AST 切换为 JSDoc 标注；`ExportPlan` 结构简化；Transformer 新增 interface/type alias 的通用导出能力；成员级 ignore 信息改为 Transformer 阶段直接从 JSDoc 读取。

## Impact

- `packages/framework`: 删除 `Export` 类，移除 index.ts 中的导出
- `packages/sora-cli`: 重写 `decorator-reader.ts` → 新建 `annotation-reader.ts`；修改 `collector.ts`、`transformer.ts`、`types.ts`
- `apps/example`: 所有使用 `@Export` 的文件需迁移为 JSDoc；移除 `import { Export }` 语句
- 下游项目: 需将 `@Export.route()` / `@Export.entity()` / `@Export.declare()` / `@Export.ignore()` 迁移为对应的 JSDoc 标注
- `tsconfig.json`: `experimentalDecorators` 和 `emitDecoratorMetadata` 不再因 Export 装饰器而必须启用（但 `@Route.method` 等运行时装饰器仍需要）
