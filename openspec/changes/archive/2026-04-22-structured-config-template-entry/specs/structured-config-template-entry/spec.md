## MODIFIED Requirements

### Requirement:appendToConfigTemplate helper
`InstallHelpers` MUST 提供 `appendToConfigTemplate(entry: ConfigTemplateEntry)` 方法。`ConfigTemplateEntry` MUST 包含 `defines`（`DefineField[]`）和 `content`（`Record<string, any>`），不包含 `section` 字段。方法 MUST 将 `DefineField[]` 转换为 `#define()` 字符串后追加到文件顶部的 define 区域（去重），将 `content` 对象序列化为 YAML 后遍历其顶层 key 逐 section 插入。

`DefineField` MUST 包含 `name`（string）、`type`（`'string' | 'number' | 'password' | 'host-ip' | 'select'`）、`hint`（string），当 `type` 为 `'select'` 时 MUST 同时提供 `choices`（string[]）。

#### Scenario:Component config insertion with structured data
- **When** script 调用 `appendToConfigTemplate({defines: [{name: "redis_url", type: "string", hint: "Redis URL"}, {name: "redis_db", type: "number", hint: "Redis DB index"}], content: {components: {redis: {url: "$(redis_url)", database: "$(redis_db)"}}}})`
- **Then** config template 中 MUST 包含 `#define(redis_url,string,Redis URL)` 和 `#define(redis_db,number,Redis DB index)` 行，且 `components:` section 下 MUST 包含 `redis:` 条目及其子字段

#### Scenario:Select type define
- **When** script 提供 `defines: [{name: "db_type", type: "select", choices: ["mysql","postgres","sqlite"], hint: "DB type"}]`
- **Then** config template 中 MUST 包含 `#define(db_type,select:[mysql|postgres|sqlite],DB type)` 行

#### Scenario:Multiple sections in one call
- **When** script 调用 `appendToConfigTemplate({defines: [...], content: {components: {redis: {...}}, logging: {level: "debug"}}})`
- **Then** config template 的 `components:` section MUST 包含 `redis:` 条目，且 `logging:` section MUST 包含 `level: debug` 条目

#### Scenario:Define deduplication
- **When** script 追加的 `DefineField.name` 对应的变量名已存在于 config template 中
- **Then** 该 `#define` 行 MUST 被跳过，不重复添加

#### Scenario:YAML value with $() variable reference
- **When** script 的 content 中包含值为 `"$(redis_url)"` 的字段
- **Then** 序列化后的 YAML 中该值 MUST 为 `$(redis_url)`，禁止包含引号（如 `'$(redis_url)'`）

#### Scenario:Key with * suffix preserved
- **When** script 的 content 中包含 key `'password*'`
- **Then** 序列化后的 YAML 中该 key MUST 原样保留为 `password*`

### Requirement:appendToConfigTemplate helper method
`ConfigTemplateInserter` MUST 提供 `appendToConfigTemplate(templatePath, entry, log)` 静态方法。该方法 MUST 接受新的 `ConfigTemplateEntry`（包含 `defines`（`DefineField[]`）和 `content`（`Record<string, any>`））。方法内部 MUST 将 `DefineField[]` 转换为 `#define()` 字符串，将 `content` 序列化为 YAML 文本，然后执行 define 追加（去重）和逐 section 的 YAML 插入。

#### Scenario:Helper called from install script with structured data
- **When** 通过 helpers 调用 `appendToConfigTemplate({defines: [...DefineField...], content: {components: {...}}})`
- **Then** 文件 MUST 同时包含新增的 `#define` 行和新增的 section 内容，格式与手写 `#define()` 和 YAML 一致

### Requirement:Duplicate detection
Before inserting a new config entry, the system MUST parse the YAML content (excluding `#define` lines) using js-yaml and check whether the target key already exists under the target section. If it exists, the system MUST output a warning and skip insertion without erroring. When using structured `content`（`Record<string, any>`），section 名称 MUST 从 content 的顶层 key 推导，entry key MUST 从 content[section] 的第一层 key 推导。

#### Scenario:Component already exists in config
- **When** install script 提供 `content: {components: {database: {...}}}` 但 `components.database` 已存在于 config template
- **Then** 系统 MUST 输出警告并跳过插入
