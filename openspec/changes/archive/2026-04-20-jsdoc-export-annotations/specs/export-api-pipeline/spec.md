## MODIFIED Requirements

### 需求:装饰器发现与分类
export:api 必须遍历 Program 中所有 SourceFile 的顶层声明，通过 `ts.getJSDocTags()` 识别 `@soraExport` JSDoc tag。对于每个声明，根据 `@soraExport` 的参数分类为 `route`、`entity` 或 `simple`（通用）。同一声明上有多个 `@soraExport` tag 必须报错。`@soraTargets` tag 用于提取 target 模式列表。

#### 场景:识别 route 策略
- **当** 一个类的 JSDoc 包含 `@soraExport route`
- **那么** 该类被分类为 route 策略

#### 场景:识别 entity 策略
- **当** 一个类的 JSDoc 包含 `@soraExport entity`
- **那么** 该类被分类为 entity 策略

#### 场景:识别通用导出
- **当** 一个声明（class/enum/interface/type alias）的 JSDoc 包含 `@soraExport`（无参数）
- **那么** 该声明被分类为 simple 通用导出

#### 场景:重复标记报错
- **当** 一个类的 JSDoc 同时包含多个 `@soraExport` tag
- **那么** export:api 必须报错并提示"一个声明只能有一个 @soraExport 标记"

#### 场景:标记不继承
- **当** 父类有 `@soraExport route` 但子类没有
- **那么** 子类不被识别为导出目标

#### 场景:interface 和 type alias 支持
- **当** 一个 interface 或 type alias 声明上方的 JSDoc 包含 `@soraExport`
- **那么** 该声明被识别为导出目标，按通用策略处理

### 需求:模式过滤
export:api 必须根据 `@soraTargets` tag 和 `--target` 选项过滤导出目标。过滤规则如下：
- 无 `@soraTargets` → 全模式，任何 target 都导出
- `@soraTargets` 非空且指定了 `--target` → 仅当 target 在列表中时导出
- `@soraTargets` 非空且未指定 `--target`（全量） → 导出
- `@soraIgnore` 无 `@soraTargets` → 永远忽略
- `@soraIgnore` 搭配 `@soraTargets` 且指定 `--target` → target 在列表中时忽略
- `@soraIgnore` 搭配 `@soraTargets` 且未指定 `--target`（全量） → 不忽略

#### 场景:全模式声明在所有 target 下导出
- **当** 声明有 `@soraExport` 但无 `@soraTargets`，运行 `--target=web`
- **那么** 该声明在 web 模式下导出

#### 场景:有限模式声明在匹配 target 下导出
- **当** 声明有 `@soraExport route` + `@soraTargets admin`，运行 `--target=admin`
- **那么** 该声明被导出

#### 场景:有限模式声明在不匹配 target 下跳过
- **当** 声明有 `@soraExport route` + `@soraTargets admin`，运行 `--target=web`
- **那么** 该声明不被导出

#### 场景:有限模式声明在全量导出时包含
- **当** 声明有 `@soraExport route` + `@soraTargets admin`，运行无 `--target`
- **那么** 该声明在全量文件中被导出

#### 场景:@soraIgnore 无 @soraTargets 永远排除
- **当** 成员有 `@soraIgnore` 但无 `@soraTargets`，运行任意 target 或无 target
- **那么** 该成员不被导出

#### 场景:@soraIgnore 搭配 @soraTargets 在匹配时排除
- **当** 成员有 `@soraIgnore` + `@soraTargets web`，运行 `--target=web`
- **那么** 该成员不被导出

#### 场景:@soraIgnore 搭配 @soraTargets 在全量时不排除
- **当** 成员有 `@soraIgnore` + `@soraTargets web`，运行无 `--target`
- **那么** 该成员在全量文件中被导出

### 需求:Generic 策略转换
对于 `@soraExport`（无参数）标记的声明，export:api 必须：
1. 对于 class：导出所有 public 方法和属性（排除 private / protected / static / constructor），使用 `export declare class` 格式
2. 对于 enum：原样导出，添加 `export declare` 修饰符
3. 对于 interface：原样导出
4. 对于 type alias：原样导出
5. 所有声明类型：输出中剥离 `@soraExport`、`@soraTargets`、`@soraIgnore` 标签

#### 场景:通用 class 导出
- **当** 通用 class 有 public 方法 `getName(): string` 和 public 属性 `value: number`
- **那么** 两者都被导出

#### 场景:enum 原样导出
- **当** enum 有 `@soraExport` 标记
- **那么** 输出为 `export declare enum ServiceName { Auth = 'auth', Game = 'game' }`

#### 场景:interface 原样导出
- **当** interface 有 `@soraExport` 标记
- **那么** 输出为 `export interface ICustomEvent { type: string; data: unknown }`

#### 场景:type alias 原样导出
- **当** type alias 有 `@soraExport` 标记
- **那么** 输出为 `export type Status = 'active' | 'inactive'`

### 需求:Route 策略转换
对于 `@soraExport route` 标记的类，export:api 必须：
1. 只导出带 `@Route.method` 或 `@Route.notify` 装饰器的方法（通过 import 精确识别，此行为不变）
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

### 需求:Entity 策略转换
对于 `@soraExport entity` 标记的类，export:api 必须：
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
