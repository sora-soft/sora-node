## 1. 类型定义重构

- [x] 1.1 重构 `types.ts`：将 `ExportPlan` 中的 `generics` + `enums` 合并为 `simple: ExportSimpleInfo[]`；新增 `ExportSimpleInfo` 类型（filePath, name, kind: 'class'|'enum'|'interface'|'type', modes）；从 `ExportClassInfo` 中移除 `methodDecorations` 和 `propertyDecorations` 字段

## 2. AnnotationReader 实现

- [x] 2.1 新建 `annotation-reader.ts`：实现 `AnnotationReader` 类，使用 `ts.getJSDocTags()` 解析 `@soraExport`、`@soraTargets`、`@soraIgnore` 三个 tag
- [x] 2.2 实现 `readDeclaration()` 方法：接受 class/enum/interface/type alias 声明节点，返回 `{ type?: 'route'|'entity', modes: string[] }` 或 null（无 @soraExport 时）
- [x] 2.3 实现重复 `@soraExport` 检测：同一声明出现多个 `@soraExport` tag 时抛出错误

## 3. Collector 改造

- [x] 3.1 修改 `collector.ts`：将 `DecoratorReader` 替换为 `AnnotationReader`
- [x] 3.2 扩展 `visitSourceFile`：新增对 `InterfaceDeclaration` 和 `TypeAliasDeclaration` 的扫描，有 `@soraExport` 时归入 `simple` 分类
- [x] 3.3 修改 `filterByTarget`：适配新的 `ExportPlan` 结构（`simple` 替代 `generics` + `enums`）

## 4. Transformer 改造

- [x] 4.1 移除 `transformGenericClass` 中的 `methodDecorations` / `propertyDecorations` 查表逻辑，改为遍历成员时直接通过 `ts.getJSDocTags(member)` 读取 `@soraIgnore` 和 `@soraTargets`
- [x] 4.2 新增 `transformInterface()` 方法：将 `InterfaceDeclaration` 原样输出，加 `export` 修饰符（如果原声明没有），剥离 `@soraExport` / `@soraTargets` 标签
- [x] 4.3 新增 `transformTypeAlias()` 方法：将 `TypeAliasDeclaration` 原样输出，加 `export` 修饰符，剥离自定义标签
- [x] 4.4 修改 `transformEnum()`：剥离 `@soraExport` / `@soraTargets` 标签
- [x] 4.5 修改 `transformRouteClass()` 和 `transformEntityClass()` 中的成员 ignore 逻辑：从 JSDoc 读取 `@soraIgnore` + `@soraTargets`，替代旧的 `methodDecorations.modes` / `propertyDecorations.modes` 查表
- [x] 4.6 保留 `isRouteMethod()` 方法不变（仍通过 `@Route.method` / `@Route.notify` 装饰器识别）
- [x] 4.7 实现输出注释中 `@soraExport` / `@soraTargets` / `@soraIgnore` 标签的剥离逻辑

## 5. Framework 清理

- [x] 5.1 删除 `packages/framework/src/lib/export/Export.ts`
- [x] 5.2 从 `packages/framework/src/index.ts` 中移除 `export * from './lib/export/Export.js'`

## 6. 删除旧代码

- [x] 6.1 删除 `packages/sora-cli/src/lib/exporter/decorator-reader.ts`

## 7. Example 迁移

- [x] 7.1 迁移 `apps/example/src/app/ErrorCode.ts`：`@Export.declare()` → `@soraExport`，移除 `import { Export }`
- [x] 7.2 迁移 `apps/example/src/app/service/common/ServiceName.ts`：`@Export.declare()` → `@soraExport`，移除 `import { Export }`
- [x] 7.3 迁移 `apps/example/src/app/handler/AuthHandler.ts`：`@Export.route(['web'])` → `@soraExport route` + `@soraTargets web`，移除 `import { Export }`
- [x] 7.4 迁移 `apps/example/src/app/database/Account.ts`：`@Export.entity()` → `@soraExport entity`，移除 `import { Export }`
- [x] 7.5 迁移 `apps/example/src/app/database/Auth.ts`：`@Export.entity()` → `@soraExport entity`，移除 `import { Export }`

## 8. 验证

- [x] 8.1 运行 `sora export:api`，对比迁移前后生成的声明文件内容一致（除标签格式外）
- [x] 8.2 运行 sora-cli 的现有测试（如有），确保全部通过
- [x] 8.3 确认 `apps/example` 项目编译无报错（`tsc --noEmit`）
