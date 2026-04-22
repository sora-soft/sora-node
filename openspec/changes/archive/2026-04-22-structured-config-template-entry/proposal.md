## 为什么

Component install script 的 `appendToConfigTemplate` helper 要求开发者手写 `#define()` DSL 字符串和手动缩进的 YAML 字符串。`defines` 是 string[]，开发者必须掌握 `#define(key,type,hint)` 的微型语法（包括 select 类型的 `[a|b|c]` 格式）；`content` 是 string，开发者必须精确控制多行缩进，并且 `$()` 变量引用在模板字符串中需要转义。心智负担过重，容易出错。

## 变更内容

- **BREAKING** `ConfigTemplateEntry` 接口重构：`defines` 从 `string[]` 改为 `DefineField[]` 结构体数组，`content` 从 `string` 改为 `Record<string, any>` 对象，移除 `section` 字段（由 content 的顶层 key 自描述）
- sora-cli 新增 `DefineField` → `#define()` 字符串的拼装逻辑
- sora-cli 新增 `Record<string, any>` → YAML 字符串的序列化逻辑（使用 js-yaml dump + 后处理去除 `$()` 值周围的引号）
- 同步更新所有现有 component install.js（redis、database、etcd）以使用新接口

## 功能 (Capabilities)

### 新增功能
- `structured-config-template-entry`: 将 `ConfigTemplateEntry` 的 `defines` 和 `content` 从字符串抽象为结构化接口，由 sora-cli 负责拼装 `#define()` DSL 和 YAML 序列化

### 修改功能

## 影响

- `packages/sora-cli/src/lib/ComponentInstallerTypes.ts` — `ConfigTemplateEntry` 接口定义
- `packages/sora-cli/src/lib/ConfigTemplateInserter.ts` — `appendToConfigTemplateEntry` 方法逻辑
- `packages/sora-cli/src/lib/InstallHelpers.ts` — `appendToConfigTemplate` helper 签名
- `packages/redis-component/bin/install.js` — 迁移到新接口
- `packages/database-component/bin/install.js` — 迁移到新接口
- `packages/etcd-component/bin/install.js` — 迁移到新接口
