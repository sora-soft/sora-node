## 上下文

sora-cli 的注解系统存在两个语义问题：

1. **`@soraIgnore` 与 `@soraTargets` 耦合**：`AnnotationReader.readMemberIgnore()` 检测到 `@soraIgnore` 后调用 `readModes()` 从 `@soraTargets` 读取 target 列表，两个职责不同的注解被耦合。

2. **`@method` 被错误清理**：`JSDocUtils.ts:3` 的清理列表 `soraTags = new Set(['soraExport', 'soraTargets', 'soraIgnore', 'soraPrefix', 'method'])` 包含了 `method`，但 `@method` 不是 sora 专用标签，而是用户有意义的 HTTP 方法声明，不应在输出中被移除。

涉及两处重复的 `shouldIgnoreMember()` 实现：
- `src/lib/exporter/Transformer.ts`
- `src/lib/doc/DocTransformer.ts`

## 目标 / 非目标

**目标：**
- `@soraIgnore` 自身携带 target 参数，不依赖 `@soraTargets`
- 标签清理规则统一为 `@sora` 前缀匹配，`@method` 等非 sora 标签予以保留

**非目标：**
- 不修改 `@soraTargets` 本身的语义
- 不重构 `shouldIgnoreMember` 的重复实现（虽然存在，但不在本次范围）

## 决策

**决策 1：`@soraIgnore` 直接解析自身注释作为 target 列表**

`@soraIgnore web,admin` → 解析出 `['web', 'admin']`
`@soraIgnore`（无参数）→ 空数组 `[]`

`shouldIgnoreMember` 逻辑不变：
- `null` → 未标记 `@soraIgnore`，不忽略
- `[]` → 无参，无条件忽略
- `[...]` → 有参数，仅在匹配 target 时忽略

仅修改 `AnnotationReader.readMemberIgnore()` 的数据来源：从 `readModes(tags)` 改为直接解析 `@soraIgnore` 标签的注释文本。调用方（`shouldIgnoreMember`）无需任何修改。

**决策 2：标签清理改为 `@sora` 前缀匹配**

将 `JSDocUtils.ts` 中的 `soraTags` 固定列表替换为前缀判断：标签名以 `sora` 开头的才清理（`soraExport`、`soraTargets`、`soraIgnore`、`soraPrefix`）。`@method` 和 `@description` 不匹配此前缀，自然保留。

## 风险 / 权衡

- **[Breaking Change]** 已使用 `@soraIgnore` + `@soraTargets` 组合的代码需要改为 `@soraIgnore <targets>` 写法 → 在 release notes 中标注
- **[Behavior Change]** `@method` 将出现在 `export:api` 输出的 JSDoc 中。此前被清理，现在保留。这是正确行为，但已有的下游消费者可能需要注意
