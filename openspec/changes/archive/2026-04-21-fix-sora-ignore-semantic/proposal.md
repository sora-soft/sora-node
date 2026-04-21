## 为什么

sora-cli 的注解系统存在两个语义问题：

1. **`@soraIgnore` 依赖 `@soraTargets`**：`readMemberIgnore()` 通过 `readModes()` 从 `@soraTargets` 读取忽略范围，导致两个注解职责耦合。`@soraIgnore` 应该自包含，通过自身参数指定在哪些 target 下被忽略（无参 = 全部 target）。

2. **`@method` 被错误清理**：`JSDocUtils.ts` 中的 `soraTags` 列表包含了 `'method'`，导致 `@method` 在 `export:api` 输出中被移除。清理规则应该是"以 `@sora` 开头的标签"，`@method` 是用户有意义的注解应予保留。

## 变更内容

- **BREAKING**: `@soraIgnore` 不再从 `@soraTargets` 读取 modes，改为通过自身参数指定忽略的 target 列表
- `@soraIgnore` 无参数 = 在所有 target 下忽略
- `@soraIgnore web` = 仅在 web target 下忽略
- `@soraIgnore web,admin` = 在 web 和 admin target 下忽略
- `JSDocUtils` 的标签清理规则改为匹配 `@sora` 前缀，不再使用固定列表
- `@method` 不再被清理，将保留在 `export:api` 输出中

## 功能 (Capabilities)

### 新增功能

- `sora-ignore-target-param`: `@soraIgnore` 通过自身参数指定 target 列表，不再依赖 `@soraTargets`

### 修改功能

- `jsdoc-tag-cleanup`: 标签清理规则从固定列表改为 `@sora` 前缀匹配，`@method` 不再被清理

## 影响

- `src/lib/exporter/AnnotationReader.ts` — `readMemberIgnore()` 方法
- `src/lib/exporter/JSDocUtils.ts` — `soraTags` 清理规则
- 使用 `@soraIgnore` 的用户代码需同步修改注解写法
- 文档更新
