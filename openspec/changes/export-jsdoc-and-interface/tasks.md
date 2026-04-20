## 1. JSDoc 工具函数

- [ ] 1.1 创建 `src/lib/exporter/jsdoc-utils.ts`，提取 `stripSoraTagsFromComment` 并新增 `extractJSDocText(node, sourceFile)` 和 `transferJSDoc(sourceNode, targetNode, sourceFile)` 函数
- [ ] 1.2 在 `transformer.ts` 中删除旧的 `stripSoraTagsFromComment` 和 `SORA_TAGS`，改为从 `jsdoc-utils.ts` 导入

## 2. Class → Interface 转换 (transformer.ts)

- [ ] 2.1 修改 `transformRouteClass`：输出 `createInterfaceDeclaration`，方法用 `createMethodSignature`，构造函数/非 route 方法删除，保留 extends heritage，丢弃 implements，移除 declare modifier
- [ ] 2.2 修改 `transformEntityClass`：输出 `createInterfaceDeclaration`，属性用 `createPropertySignature`，删除所有方法和构造函数，移除 declare modifier
- [ ] 2.3 修改 `transformGenericClass`：输出 `createInterfaceDeclaration`，只保留属性（`createPropertySignature`），删除所有方法和构造函数，移除 declare modifier

## 3. JSDoc 转移 (transformer.ts)

- [ ] 3.1 在 `transformRouteClass` 中：对顶层 interface 声明和每个 route 方法签名调用 `transferJSDoc`
- [ ] 3.2 在 `transformEntityClass` 中：对顶层 interface 声明和每个属性签名调用 `transferJSDoc`
- [ ] 3.3 在 `transformGenericClass` 中：对顶层 interface 声明和每个属性签名调用 `transferJSDoc`
- [ ] 3.4 在 `transformEnum` 中：对顶层 enum 声明和每个 enum 成员调用 `transferJSDoc`
- [ ] 3.5 在 `transformInterface` 中：对顶层 interface 声明和每个 member 调用 `transferJSDoc`
- [ ] 3.6 在 `transformTypeAlias` 中：对顶层 type 声明调用 `transferJSDoc`

## 4. Class → Interface 转换 (type-resolver.ts)

- [ ] 4.1 修改 `collectResolvedDeclaration` 的 class 分支：输出 `createInterfaceDeclaration`，只保留 public 非 static 属性（`createPropertySignature`），删除方法和构造函数，保留 extends、丢弃 implements

## 5. JSDoc 转移 (type-resolver.ts)

- [ ] 5.1 在 `collectResolvedDeclaration` 的 interface 分支添加 `transferJSDoc`（顶层 + members）
- [ ] 5.2 在 `collectResolvedDeclaration` 的 type alias 分支添加 `transferJSDoc`（顶层）
- [ ] 5.3 在 `collectResolvedDeclaration` 的 enum 分支添加 `transferJSDoc`（顶层 + members）
- [ ] 5.4 在 `collectResolvedDeclaration` 的 class 分支（已改 interface）添加 `transferJSDoc`（顶层 + properties）
- [ ] 5.5 在 `resolveTypeFromDeclaration` 的各分支同样添加 `transferJSDoc`

## 6. 验证

- [ ] 6.1 编译 `sora-cli` 确保无类型错误
- [ ] 6.2 在测试项目中运行 `export:api` 命令，验证输出文件中：class 全部转为 interface、JSDoc 保留且 sora tags 已删除
