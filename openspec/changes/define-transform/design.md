## 上下文

当前项目使用 `scripts/version-transform/` 作为 ts-patch transformer，在编译时将 `__VERSION__` 标识符替换为从 package.json 读取的版本字符串。7 个包通过各自的 `version.d.ts` 声明此全局常量，4 个 tsconfig 注册了该 transformer。

该 transformer 仅支持单一来源（package.json#version）和单一替换目标。扩展到其他编译时常量（包名、环境变量、字面量）需要修改 transformer 代码本身。

约束：
- 必须兼容 ts-patch 的 `(program, options) => (ctx) => (sf) => SourceFile` 签名
- 运行在 Node.js 编译时环境，可使用 `fs`、`path`、`process.env`
- 当前项目无 `.env` 文件，环境变量使用极少

## 目标 / 非目标

**目标：**
- 通过 `defines` 配置驱动，支持多种编译时常量注入
- 支持 `pkg`（package.json 顶层字段）、`env`（process.env）、`literal`（字面量值）三种来源
- 支持所有 JSON 原始类型（string、number、boolean、null）的 AST 映射
- 支持 string 简写：`"version"` 等价于 `{ "pkg": "version" }`
- 保持与 ts-patch 完全兼容

**非目标：**
- 不支持 JSONPath 或嵌套字段访问（package.json 顶层字段足够）
- 不支持 git 信息或时间戳注入（避免外部依赖和增量编译一致性问题）
- 不支持 `.env` 文件解析（用 `env` 来源读 process.env 即可）
- 不支持跨文件作用域（所有 defines 全局生效）

## 决策

### Decision 1: 三种数据来源的配置格式

**选择**：使用对象区分来源类型

```jsonc
{
  "__VERSION__":      { "pkg": "version" },      // package.json 顶层字段
  "__PACKAGE_NAME__": { "pkg": "name" },
  "__NODE_ENV__":     { "env": "NODE_ENV" },     // process.env
  "__DEBUG__":        { "literal": false },       // 字面量
  "__MAX__":          { "literal": 3 }
}
```

**替代方案**：按前缀区分（如 `"pkg:version"`、`"env:NODE_ENV"`）— 可读性差，类型信息丢失。

**理由**：对象形式自描述、易于扩展新来源类型、TypeScript 校验友好。

### Decision 2: string 简写默认为 pkg 来源

**选择**：当 `defines` 的值为纯字符串时，等同于 `{ "pkg": "<string>" }`

```jsonc
{ "__VERSION__": "version" }  // 等价于 { "__VERSION__": { "pkg": "version" } }
```

**理由**：pkg 是最常用来源，简写减少视觉噪声。env 和 literal 不适用简写，因为语义不同。

### Decision 3: 值到 AST 节点的类型映射

**选择**：

| 值类型 | JSON 示例 | AST 工厂方法 |
|--------|-----------|-------------|
| string | `"2.1.0"` | `createStringLiteral` |
| number | `3` | `createNumericLiteral` |
| true | `true` | `createTrue()` |
| false | `false` | `createFalse()` |
| null | `null` | `createNull()` |

**特殊规则**：`pkg` 和 `env` 来源始终产生 string。只有 `literal` 来源可能产生其他类型。

### Decision 4: 环境变量缺失时替换为空字符串

**选择**：`process.env.XXX` 为 `undefined` 时，替换为 `""`（空字符串）。

**替代方案**：报错中断 — 过于严格，编译时常量应容错。

**理由**：与 Vite 的 `define` 行为一致，环境变量缺失不应阻断编译。

### Decision 5: pkg 字段缺失时报错

**选择**：package.json 中不存在指定字段时，抛出错误中断编译。

**理由**：`pkg` 来源是显式配置的，期望字段一定存在。静默替换为空字符串会隐藏配置错误。

### Decision 6: 保留 packagePath 顶层选项

**选择**：`packagePath` 作为 plugin 的顶层选项（与 `defines` 平级），指定 package.json 路径。默认从 tsconfig 所在目录查找。

**理由**：所有 `pkg` 来源共享同一个 package.json，无需每个定义单独指定路径。

## 风险 / 权衡

- **[风险] 简写语法的歧义** → 缓解：只有 string 类型值触发简写（视为 pkg），对象视为完整配置，number/boolean/null 不可能是简写（它们只能是 literal 值）。
- **[风险] 大量 defines 可能拖慢编译** → 缓解：实际项目中 defines 数量通常 < 10，AST 遍历开销可忽略。
- **[风险] 属性访问误替换** → 缓解：保留 version-transform 的安全检查逻辑（跳过 PropertyAssignment、PropertyDeclaration、PropertyAccessExpression、QualifiedName 的 name 位置）。
