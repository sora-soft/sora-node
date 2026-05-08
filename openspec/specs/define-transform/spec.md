## 新增需求

### 需求:define-transform 必须通过 defines 配置注入编译时常量
transformer 必须接受 `defines` plugin option，其值为一个对象，键为标识符名称（如 `"__VERSION__"`），值为来源描述。transformer 必须遍历 AST，将所有匹配的顶级 `Identifier` 节点替换为对应来源的值字面量。替换必须在编译阶段完成。

#### 场景:多个常量同时注入
- **当** 配置了 `"defines": { "__VERSION__": { "pkg": "version" }, "__DEBUG__": { "literal": false } }`
- **那么** `__VERSION__` 必须被替换为 package.json 的 version 字符串，`__DEBUG__` 必须被替换为 `false`

#### 场景:属性访问不被替换
- **当** 源文件包含 `obj.__VERSION__`（属性访问表达式）
- **那么** 该表达式禁止被替换，必须保持原样

#### 场景:属性赋值左侧不被替换
- **当** 源文件包含 `const __VERSION__ = "manual"` 中的 `__VERSION__` 作为声明名
- **那么** 该标识符禁止被替换，必须保持原样

#### 场景:QualifiedName 右侧不被替换
- **当** 源文件包含 `NS.__VERSION__`
- **那么** 该表达式禁止被替换，必须保持原样

### 需求:define-transform 必须支持 pkg 来源
当 defines 中的值为对象 `{ "pkg": "<field>" }` 时，transformer 必须从 package.json 的顶层字段读取值，产生 string 类型字面量。字段不存在时必须抛出错误中断编译。

#### 场景:从 package.json 读取 version
- **当** 配置了 `{ "__VERSION__": { "pkg": "version" } }` 且 package.json 包含 `"version": "2.1.0"`
- **那么** `__VERSION__` 必须被替换为字符串 `"2.1.0"`

#### 场景:字段不存在时报错
- **当** 配置了 `{ "__FOO__": { "pkg": "nonexistent" } }` 且 package.json 不包含 `nonexistent` 字段
- **那么** 编译必须失败并抛出明确的错误信息

#### 场景:string 简写语法
- **当** 配置了 `{ "__VERSION__": "version" }`（值为纯字符串）
- **那么** 必须等价于 `{ "__VERSION__": { "pkg": "version" } }`，从 package.json 读取 version 字段

### 需求:define-transform 必须支持 env 来源
当 defines 中的值为对象 `{ "env": "<key>" }` 时，transformer 必须从 `process.env` 读取值，产生 string 类型字面量。环境变量缺失时必须替换为空字符串 `""`。

#### 场景:环境变量存在
- **当** 配置了 `{ "__NODE_ENV__": { "env": "NODE_ENV" } }` 且 `process.env.NODE_ENV` 为 `"production"`
- **那么** `__NODE_ENV__` 必须被替换为字符串 `"production"`

#### 场景:环境变量缺失
- **当** 配置了 `{ "__NODE_ENV__": { "env": "NODE_ENV" } }` 且 `process.env.NODE_ENV` 为 `undefined`
- **那么** `__NODE_ENV__` 必须被替换为空字符串 `""`

### 需求:define-transform 必须支持 literal 来源
当 defines 中的值为对象 `{ "literal": <value> }` 时，transformer 必须将 value 直接映射为对应的 AST 字面量节点。支持 string、number、boolean（true/false）、null 四种类型。

#### 场景:boolean false
- **当** 配置了 `{ "__DEBUG__": { "literal": false } }`
- **那么** `__DEBUG__` 必须被替换为 `false`（FalseKeyword）

#### 场景:boolean true
- **当** 配置了 `{ "__ENABLED__": { "literal": true } }`
- **那么** `__ENABLED__` 必须被替换为 `true`（TrueKeyword）

#### 场景:number
- **当** 配置了 `{ "__MAX__": { "literal": 3 } }`
- **那么** `__MAX__` 必须被替换为数字 `3`（NumericLiteral）

#### 场景:null
- **当** 配置了 `{ "__NULL__": { "literal": null } }`
- **那么** `__NULL__` 必须被替换为 `null`（NullKeyword）

#### 场景:string literal
- **当** 配置了 `{ "__GREETING__": { "literal": "hello" } }`
- **那么** `__GREETING__` 必须被替换为字符串 `"hello"`

### 需求:define-transform 必须支持 packagePath 选项
transformer 必须接受 `packagePath` plugin option（与 `defines` 平级），用于指定 package.json 的路径。未配置时必须从 tsconfig.json 所在目录查找 package.json。

#### 场景:指定 packagePath
- **当** 配置了 `{ "transform": ".../define-transform", "packagePath": "../package.json", "defines": { "__VERSION__": { "pkg": "version" } } }`
- **那么** 必须从指定路径读取 package.json

#### 场景:未配置 packagePath
- **当** 未配置 `packagePath` 选项
- **那么** 必须从 tsconfig.json 所在目录的 package.json 读取

### 需求:define-transform 必须导出标准 ts.TransformerFactory
transformer 必须导出 `(program: ts.Program, options: object) => ts.TransformerFactory<ts.SourceFile>` 签名的函数，兼容 ts-patch 插件注册机制。

#### 场景:ts-patch 注册
- **当** tsconfig.json 的 plugins 数组包含 `{ "transform": "./scripts/define-transform", "defines": { "__VERSION__": { "pkg": "version" } } }`
- **那么** ts-patch 必须能正确加载并执行该 transformer

## 修改需求

## 移除需求
