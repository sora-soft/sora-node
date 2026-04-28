## ADDED Requirements

### 需求:version-transform 必须在编译时替换 __VERSION__ 标识符
transformer 必须遍历 AST，将所有名为 `__VERSION__` 的顶级 `Identifier` 节点替换为从 package.json 读取的版本号字符串字面量。替换必须在编译阶段完成，生成的 JavaScript 代码中禁止包含 `__VERSION__` 引用。

#### 场景:标准版本替换
- **当** 源文件包含 `static version = __VERSION__;` 且 package.json 的 version 为 `"2.1.0"`
- **那么** 编译后的 JavaScript 必须输出 `static version = "2.1.0";`

#### 场景:多处引用全部替换
- **当** 源文件中有多处引用 `__VERSION__`
- **那么** 每一处都必须被替换为相同的版本字符串

#### 场景:属性访问不被替换
- **当** 源文件包含 `obj.__VERSION__`（属性访问表达式）
- **那么** 该表达式禁止被替换，必须保持原样

### 需求:version-transform 必须从 package.json 读取版本号
transformer 必须从插件配置指定的路径读取 package.json，或从当前工作目录向上查找 package.json。禁止硬编码版本号。

#### 场景:从配置路径读取
- **当** tsconfig plugin 配置了 `{ "transform": ".../version-transform", "packagePath": "../package.json" }`
- **那么** 必须从指定路径读取 version 字段

#### 场景:默认路径查找
- **当** 未配置 `packagePath` 选项
- **那么** 必须从 tsconfig.json 所在目录的 package.json 读取 version 字段

### 需求:version-transform 必须通过 tsconfig plugin option 支持自定义标识符名称
transformer 必须接受 `identifier` plugin option 来指定要替换的全局常量名称。默认值为 `"__VERSION__"`。

#### 场景:使用默认标识符
- **当** 未配置 `identifier` 选项
- **那么** transformer 必须替换 `__VERSION__` 标识符

#### 场景:使用自定义标识符
- **当** 配置了 `{ "transform": ".../version-transform", "identifier": "__APP_VERSION__" }`
- **那么** transformer 必须替换 `__APP_VERSION__` 标识符，禁止替换 `__VERSION__`

### 需求:version-transform 必须导出标准 ts.TransformerFactory
transformer 必须导出 `(program: ts.Program) => ts.TransformerFactory<ts.SourceFile>` 签名的函数，兼容 ts-patch 插件注册机制。

#### 场景:ts-patch 注册
- **当** tsconfig.json 的 plugins 数组包含 `{ "transform": "./scripts/version-transform" }`
- **那么** ts-patch 必须 能正确加载并执行该 transformer
