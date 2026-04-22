## 上下文

Component install script 通过 `appendToConfigTemplate` helper 向 `config.template.yml` 插入 `#define` 变量声明和 YAML 配置片段。当前接口要求开发者手写两种字符串：

1. `defines: string[]` — `#define(key,type,hint)` DSL，包括 `select:[a|b|c]` 格式
2. `content: string` — 手动缩进的多行 YAML，`$()` 变量引用需要转义

现有消费者：redis-component、database-component、etcd-component 的 `bin/install.js`。

sora-cli 已引入 `js-yaml`（`ConfigTemplateInserter.ts`）。

## 目标 / 非目标

**目标：**
- 将 `defines` 从 `string[]` 改为 `DefineField[]` 结构体数组，消除 `#define()` DSL 的手动拼写
- 将 `content` 从 `string` 改为 `Record<string, any>`，消除手动缩进和转义
- 移除 `section` 字段，由 content 的顶层 key 自描述插入位置
- sora-cli 负责将结构化数据拼装为最终的 `#define()` 字符串和 YAML 文本
- 同步迁移所有现有 install.js

**非目标：**
- 不改变 config.template.yml 的文件格式和 `#define` DSL 本身（最终文件内容不变）
- 不改变 `appendToConfigTemplate` 以外的 helper 接口
- 不支持嵌套 section 插入（content 顶层 key 对应 template 的一级 section）

## 决策

### D1: DefineField 接口设计

```typescript
interface DefineField {
  name: string;
  type: 'string' | 'number' | 'password' | 'host-ip' | 'select';
  hint: string;
  choices?: string[];  // type === 'select' 时必填
}
```

选择理由：字段与 `#define(key,type,hint)` 一一对应，`choices` 独立为可选数组比 `select:[a|b|c]` 字符串更自描述。

考虑过的替代方案：将 `type` 和 `choices` 合并为联合类型（`{ type: 'select', options: string[] } | { type: Exclude<Type, 'select'> }`）— 过度设计，当前简单的可选 `choices` 足够。

### D2: content 使用 Record<string, any>，移除 section

```typescript
interface ConfigTemplateEntry {
  defines: DefineField[];
  content: Record<string, any>;
}
```

content 的每个顶层 key 对应 config.template.yml 中的一个 section（如 `components`、`services`、`logging`）。sora-cli 遍历顶层 key，对每个 section 执行去重检查和插入。

选择理由：
- 自描述 — 不需要额外的 `section` 字段来指定插入位置
- 灵活 — 一次调用可同时操作多个 section
- 开发者写的是 JS 对象而非 YAML 字符串，消除缩进和转义负担

### D3: YAML 序列化策略

使用 `js-yaml.dump()` 将 content 对象转为 YAML 文本，然后后处理去除 `$(...)` 值周围的引号。

js-yaml 默认会对包含 `$()` 的字符串加单引号（如 `'$(redis_url)'`），而 config.template.yml 中需要无引号的 `$(redis_url)`。后处理方案：用正则 `/'?\$\([^)]+\)'?/g` 去除 `$()` 值周围的引号。

选择理由：后处理简单可靠，无需自定义 js-yaml schema。也可使用 `yaml.dump` 的 `quotingType` 和 `forceQuotes` 选项尝试控制，但正则后处理更明确。

### D4: `*` 可选标记由开发者在 content key 中手写

如 `'username*': '$(db_username)'`，sora-cli 原样保留 key 名（包括 `*`）。

选择理由：`*` 是 YAML key 上的标记，不是 define 的属性，语义上属于 content 层面。让开发者在 key 中直接表达最直观。

### D5: DefineField → #define 字符串拼装

sora-cli 内部新增拼装逻辑：
- 非 select 类型：`#define(${name},${type},${hint})`
- select 类型：`#define(${name},select:[${choices.join('|')}],${hint})`

拼装后的字符串传入现有的 `appendDefines()` 去重逻辑，无需修改去重机制。

## 风险 / 权衡

- **yaml.dump 格式差异** → js-yaml 的序列化风格可能与手写 YAML 有细微差异（如空行、列表格式）。缓解：现有 template 文件通过 string splicing 插入而非 full round-trip，只有新增片段经过 yaml.dump。
- **BREAKING 变更** → 所有现有 install.js 必须同步迁移。缓解：只有 3 个消费者，一次性迁移成本低。
- **content 深层嵌套的 yaml.dump 输出** → 复杂嵌套对象序列化后缩进可能不符合 template 的 2-space 风格。缓解：yaml.dump 默认 indent=2，且片段会被 `insertSectionEntry` 再包一层缩进。
