## 1. 接口重构

- [x] 1.1 在 `ComponentInstallerTypes.ts` 中新增 `DefineField` 接口（`name`, `type`, `hint`, `choices?`），修改 `ConfigTemplateEntry` 接口：移除 `section`，`defines` 改为 `DefineField[]`，`content` 改为 `Record<string, any>`
- [x] 1.2 在 `ConfigTemplateInserter.ts` 中新增 `DefineField` → `#define()` 字符串的拼装方法：非 select 类型拼 `#define(name,type,hint)`，select 类型拼 `#define(name,select:[a|b|c],hint)`
- [x] 1.3 在 `ConfigTemplateInserter.ts` 中新增 `Record<string, any>` → YAML 字符串的序列化方法：使用 `yaml.dump()` + 后处理去除 `$()` 值周围的引号

## 2. 核心逻辑改造

- [x] 2.1 重构 `appendToConfigTemplateEntry` 方法：接收新的 `ConfigTemplateEntry`，用拼装方法转换 defines，用序列化方法转换 content，遍历 content 顶层 key 逐 section 执行去重检查和插入
- [x] 2.2 修改去重检查逻辑：从 `content` 对象的顶层 key 推导 section 名称，从 `content[section]` 的第一层 key 推导 entry key
- [x] 2.3 修改 `InstallHelpers.ts` 中 `appendToConfigTemplate` 方法签名，适配新接口

## 3. 迁移现有 install.js

- [x] 3.1 迁移 `packages/redis-component/bin/install.js`：将 `defines` 和 `content` 改为结构化格式，移除 `section` 字段
- [x] 3.2 迁移 `packages/database-component/bin/install.js`：将 `defines` 和 `content` 改为结构化格式，移除 `section` 字段
- [x] 3.3 迁移 `packages/etcd-component/bin/install.js`：将 `defines` 和 `content` 改为结构化格式，移除 `section` 字段

## 4. 验证

- [x] 4.1 手动测试 redis-component install 脚本，验证生成的 config.template.yml 格式正确（`#define` 行和 YAML 内容与改造前一致）
- [x] 4.2 手动测试 database-component install 脚本，验证 select 类型 define、`*` 可选标记、多级嵌套 content 的正确性
- [x] 4.3 手动测试 etcd-component install 脚本，验证数组类型 content（hosts 列表）和纯值 content（ttl: 60）的正确性
