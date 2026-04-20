## ADDED Requirements

### 需求:export:api 命令
系统必须提供 `sora export:api` CLI 命令。该命令读取 `sora.json` 中的 `root` 和 `apiDeclarationOutput` 配置，扫描项目源码，根据装饰器标记导出 TypeScript 类型声明文件。

#### 场景:基本调用
- **当** 用户运行 `sora export:api`
- **那么** 系统扫描 `root` 目录下所有 `.ts` 文件，生成全量导出文件 `{apiDeclarationOutput}.ts`

#### 场景:指定 target
- **当** 用户运行 `sora export:api --target=web --target=admin`
- **那么** 系统生成三个文件：`{apiDeclarationOutput}.ts`（全量）、`{apiDeclarationOutput}.web.ts`、`{apiDeclarationOutput}.admin.ts`

#### 场景:无任何装饰器标记
- **当** 项目中没有任何 `@Export.route` / `@Export.entity` / `@Export.declare` 标记的声明
- **那么** 生成的输出文件为空（仅包含自动生成注释头）

### 需求:文件扫描与 Program 创建
export:api 必须使用原生 TypeScript Compiler API 创建 `ts.Program`。扫描范围为 `sora.json` 中 `root` 指定的目录下所有 `.ts` 文件，排除 `node_modules` 和 `dist` 目录。使用项目自身的 `tsconfig.json` 的 `compilerOptions`。

#### 场景:创建 ts.Program
- **当** export:api 启动
- **那么** 系统读取项目 `tsconfig.json`，收集 root 目录下所有 `.ts` 文件，调用 `ts.createProgram` 创建程序实例

### 需求:装饰器发现与分类
export:api 必须遍历 Program 中所有 SourceFile 的顶层声明，通过精确 import 解析识别来自 `@sora-soft/framework` 的 `Export` 类装饰器。对于每个类，检测其装饰器并分类为 `route`、`entity`、`common` 或未标记。同一类上有多个 Export 装饰器必须报错。

#### 场景:识别 route 装饰器
- **当** 一个类有 `@Export.route()` 装饰器，且 `Export` 标识符通过 import 可追溯到 `@sora-soft/framework`
- **那么** 该类被分类为 route 策略

#### 场景:识别 entity 装饰器
- **当** 一个类有 `@Export.entity()` 装饰器
- **那么** 该类被分类为 entity 策略

#### 场景:识别 common 装饰器
- **当** 一个类或枚举有 `@Export.declare()` 装饰器
- **那么** 类被分类为 generic 策略，枚举被分类为 enum

#### 场景:重复装饰器报错
- **当** 一个类同时有 `@Export.route()` 和 `@Export.entity()` 装饰器
- **那么** export:api 必须报错并提示"一个类只能有一个 Export 装饰器"

#### 场景:非 framework 来源的 Export 不识别
- **当** 一个类有 `@Export.declare()` 但 `Export` 的 import 来源不是 `@sora-soft/framework`
- **那么** 该装饰器不被识别，类不被导出

#### 场景:装饰器不继承
- **当** 父类有 `@Export.route()` 但子类没有
- **那么** 子类不被识别为导出目标

### 需求:模式过滤
export:api 必须根据装饰器的 `modes` 参数和 `--target` 选项过滤导出目标。过滤规则如下：
- `modes` 为空数组 → 全模式，任何 target 都导出
- `modes` 非空且指定了 `--target` → 仅当 target 在 modes 中时导出
- `modes` 非空且未指定 `--target`（全量） → 导出
- `@Export.ignore()` 无参数 → 永远忽略
- `@Export.ignore([...])` 且指定 `--target` → target 在 ignore modes 中时忽略
- `@Export.ignore([...])` 且未指定 `--target`（全量） → 不忽略

#### 场景:全模式类在所有 target 下导出
- **当** `@Export.declare()` 无参数，运行 `--target=web`
- **那么** 该类在 web 模式下导出

#### 场景:有限模式类在匹配 target 下导出
- **当** `@Export.route(['admin'])`，运行 `--target=admin`
- **那么** 该类被导出

#### 场景:有限模式类在不匹配 target 下跳过
- **当** `@Export.route(['admin'])`，运行 `--target=web`
- **那么** 该类不被导出

#### 场景:有限模式类在全量导出时包含
- **当** `@Export.route(['admin'])`，运行无 `--target`
- **那么** 该类在全量文件中被导出

#### 场景:Export.ignore 无参数永远排除
- **当** 方法有 `@Export.ignore()`，运行任意 target 或无 target
- **那么** 该方法不被导出

#### 场景:Export.ignore 指定模式在匹配时排除
- **当** 方法有 `@Export.ignore(['web'])`，运行 `--target=web`
- **那么** 该方法不被导出

#### 场景:Export.ignore 指定模式在全量时不排除
- **当** 方法有 `@Export.ignore(['web'])`，运行无 `--target`
- **那么** 该方法在全量文件中被导出

### 需求:Route 策略转换
对于 `@Export.route` 标记的类，export:api 必须：
1. 只导出带 `@Route.method` 或 `@Route.notify` 装饰器的方法（通过 import 精确识别）
2. 每个方法只保留第一个参数（request body）
3. 移除 `extends` 继承子句
4. 移除构造函数
5. 移除所有属性
6. 移除所有装饰器
7. 使用 `declare class` 格式输出

#### 场景:Route 方法导出
- **当** Route 类中有 `@Route.method` 标记的方法 `async login(body: IReqLogin): Promise<IResLogin>`
- **那么** 输出为 `declare class AuthHandler { login(body: IReqLogin): Promise<IResLogin>; }`

#### 场景:Route 多参数方法只保留第一个
- **当** 方法签名为 `async info(body: void, account: Account, token: AccountToken)`
- **那么** 输出只保留 `info(body: void): Promise<...>`

#### 场景:无 Route.method 标记的方法不导出
- **当** Route 类中有方法但没有 `@Route.method` 或 `@Route.notify` 装饰器
- **那么** 该方法不出现在输出中

#### 场景:Route.notify 方法导出
- **当** 方法有 `@Route.notify` 装饰器
- **那么** 该方法按与 Route.method 相同规则导出（只保留第一个参数）

### 需求:Entity 策略转换
对于 `@Export.entity` 标记的类，export:api 必须：
1. 只导出 public 属性（排除 private / protected / static）
2. 移除所有方法
3. 移除构造函数
4. 移除所有装饰器
5. 使用 `declare class` 格式输出

#### 场景:Entity 属性导出
- **当** Entity 类有 `id: string;`, `name: string;`, `private secret: string;`
- **那么** 输出为 `declare class Account { id: string; name: string; }`，private 属性被移除

#### 场景:Entity 方法被移除
- **当** Entity 类有 `toJSON()` 方法
- **那么** 输出中不包含该方法

### 需求:Generic 策略转换
对于 `@Export.declare` 标记的通用类，export:api 必须：
1. 导出所有 public 方法和属性（排除 private / protected / static）
2. 移除所有装饰器
3. 使用 `declare class` 格式输出
4. 对于枚举，原样导出（移除装饰器）

#### 场景:通用类导出
- **当** 通用类有 public 方法 `getName(): string` 和 public 属性 `value: number`
- **那么** 两者都被导出

#### 场景:枚举原样导出
- **当** 枚举有 `@Export.declare()` 装饰器
- **那么** 输出为 `export declare enum ServiceName { Auth = 'auth', Game = 'game' }`

### 需求:类型依赖自动解析
export:api 必须自动解析被导出声明中引用的所有类型依赖。当导出的方法参数、返回值、属性引用了 interface、type alias、enum 或其他 class 时，这些类型声明必须被递归收集并包含在输出中。解析必须排除来自 `node_modules` 的类型（如 `Promise`, `Date`, `Array` 等）。

#### 场景:interface 自动收集
- **当** 导出的方法参数类型为 `IReqLogin`（一个 interface）
- **那么** `IReqLogin` 的完整声明被包含在输出中

#### 场景:嵌套类型递归解析
- **当** `IReqLogin` 引用了 `AccountType`（一个 enum）
- **那么** `AccountType` 也被包含在输出中

#### 场景:node_modules 类型排除
- **当** 返回类型为 `Promise<IResult>`
- **那么** `Promise` 不被包含，但 `IResult` 被包含

#### 场景:循环引用处理
- **当** 类型 A 引用 B，B 引用 A
- **那么** 系统不进入无限循环，两个类型都被正确导出

### 需求:输出文件生成
export:api 必须在文件头部添加自动生成注释 `// Auto-generated by sora export:api`。输出文件中不包含任何 import 语句（所有类型已内联）。每个声明都使用 `export` 关键字。

#### 场景:全量文件生成
- **当** 运行 `sora export:api`
- **那么** 生成 `{apiDeclarationOutput}.ts`，包含所有被标记且未被 Export.ignore() 排除的声明

#### 场景:指定 target 时同时生成全量
- **当** 运行 `sora export:api --target=web`
- **那么** 同时生成 `{apiDeclarationOutput}.ts`（全量）和 `{apiDeclarationOutput}.web.ts`（web 模式）

#### 场景:输出文件无 import
- **当** 生成的类型声明引用了其他项目内类型
- **那么** 这些类型的声明被内联到同一文件中，不使用 import 语句
