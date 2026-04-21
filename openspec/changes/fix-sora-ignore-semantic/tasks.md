## 1. 修改注解解析

- [ ] 1.1 修改 `AnnotationReader.readMemberIgnore()`：从 `@soraIgnore` 标签注释文本中解析 target 列表（逗号分隔），不再调用 `readModes(tags)` 读取 `@soraTargets`

## 2. 修改标签清理规则

- [ ] 2.1 修改 `JSDocUtils.ts` 中的 `stripSoraTagsFromComment()`：将固定列表匹配改为前缀匹配，仅清理标签名以 `sora` 开头的标签，`@method` 不再被清理

## 3. 更新文档

- [ ] 3.1 更新 `docs/annotations.md` 中"输出清理"部分，反映新的清理规则

## 4. 验证

- [ ] 4.1 验证 `shouldIgnoreMember()` 在 `Transformer.ts` 和 `DocTransformer.ts` 中无需修改（逻辑本身不变，仅数据来源变了）
- [ ] 4.2 验证 `export:api` 输出中 `@method` 被保留、`@soraExport` 等被清理
- [ ] 4.3 验证 `export:api` 和 `export:doc` 命令对 `@soraIgnore` 新语义的正确性
