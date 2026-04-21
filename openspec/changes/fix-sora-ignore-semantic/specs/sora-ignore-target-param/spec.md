## ADDED Requirements

### 需求:@soraIgnore 通过自身参数指定忽略的 target 列表

`@soraIgnore` 注解必须直接从自身注释文本中解析 target 列表，禁止从 `@soraTargets` 读取忽略范围。注释文本以逗号分隔多个 target 名称。无参数时表示在所有 target 下忽略。

#### 场景:无参数忽略
- **当** 成员注解为 `@soraIgnore`（无参数）
- **那么** 该成员在所有 target 导出中被无条件忽略

#### 场景:指定 target 忽略
- **当** 成员注解为 `@soraIgnore web,admin`
- **那么** 该成员仅在 web 和 admin target 导出中被忽略，在其他 target 导出中保留

#### 场景:单个 target 忽略
- **当** 成员注解为 `@soraIgnore web`
- **那么** 该成员仅在 web target 导出中被忽略

#### 场景:与 @soraTargets 独立
- **当** 成员同时有 `@soraTargets web` 和 `@soraIgnore admin`
- **那么** `@soraTargets` 控制声明级别的 target 过滤，`@soraIgnore` 控制成员级别的忽略，两者互不影响

### 需求:标签清理仅移除 @sora 前缀的 JSDoc 标签

`export:api` 的输出必须仅清理以 `@sora` 开头的 JSDoc 标签（`@soraExport`、`@soraTargets`、`@soraIgnore`、`@soraPrefix`）。非 sora 前缀的标签（如 `@method`、`@description`）必须保留在输出中。

#### 场景:@method 保留
- **当** 源码方法有 `@method GET` 注解
- **那么** `export:api` 输出的对应接口方法 JSDoc 中保留 `@method GET`

#### 场景:@sora 前缀标签清理
- **当** 源码声明有 `@soraExport route` 和 `@soraTargets web`
- **那么** `export:api` 输出中这两个标签被移除，其他 JSDoc 内容保留
