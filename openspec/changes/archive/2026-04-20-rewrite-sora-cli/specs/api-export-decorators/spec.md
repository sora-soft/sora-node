## ADDED Requirements

### 需求:Export 类导出
系统必须在 framework 包中导出 `Export` 类。该类包含四个静态方法作为装饰器工厂：`route`、`entity`、`common`、`ignore`。所有静态方法运行时必须为 no-op（空函数体），不影响任何运行时行为。该类必须通过 `@sora-soft/framework` 的主入口导出。

#### 场景:Export 类运行时无效果
- **当** 应用程序正常运行，使用了 `@Export.route()` 等装饰器
- **那么** Export 类的所有静态方法不执行任何逻辑，不修改目标类

### 需求:Export.route 装饰器
`Export.route` 必须是类装饰器工厂方法，接受一个可选的 `string[]` 参数 `modes`，用于指定导出模式。用于标记 Route 子类。

#### 场景:使用 Export.route 标记 Route 子类
- **当** 用户在继承 Route 的类上添加 `@Export.route()` 装饰器
- **那么** `sora export:api` 命令必须将该类识别为需要导出的 Route 类

#### 场景:使用 Export.route 指定模式
- **当** 用户在类上添加 `@Export.route(['web', 'admin'])`
- **那么** 该类仅在 `--target=web` 或 `--target=admin` 时被导出，全量导出时也包含

### 需求:Export.entity 装饰器
`Export.entity` 必须是类装饰器工厂方法，接受一个可选的 `string[]` 参数 `modes`。用于标记数据库实体类，导出时只保留 public 属性。

#### 场景:使用 Export.entity 标记实体类
- **当** 用户在数据库实体类上添加 `@Export.entity()` 装饰器
- **那么** `sora export:api` 必须将该类识别为实体类，导出时只保留 public 属性

#### 场景:Export.entity 指定模式
- **当** 用户添加 `@Export.entity(['admin'])`
- **那么** 该类仅在 `--target=admin` 或全量导出时被导出

### 需求:Export.declare 装饰器
`Export.declare` 必须是类装饰器工厂方法，接受一个可选的 `string[]` 参数 `modes`。用于标记通用类（导出所有 public 方法和属性）和枚举（原样导出）。

#### 场景:使用 Export.declare 标记枚举
- **当** 用户在枚举上添加 `@Export.declare()` 装饰器
- **那么** 该枚举在所有模式下被导出

#### 场景:使用 Export.declare 标记通用类
- **当** 用户在非 Route、非 Entity 的类上添加 `@Export.declare()`
- **那么** 该类的所有 public 方法和属性被导出

### 需求:Export.ignore 忽略装饰器
`Export.ignore` 必须是方法/属性装饰器工厂方法，接受一个可选的 `string[]` 参数 `modes`。用于标记在特定模式下不导出的类成员。

#### 场景:Export.ignore 无参数 — 永远忽略
- **当** 用户在方法或属性上添加 `@Export.ignore()` 装饰器（空参数）
- **那么** 该成员在任何模式（包括全量导出）下都不被导出

#### 场景:Export.ignore 指定模式
- **当** 用户添加 `@Export.ignore(['web'])`
- **那么** 该成员在 `--target=web` 时不导出，在其他模式和全量导出时正常导出

#### 场景:Export.ignore 无装饰器
- **当** 类成员上没有 `@Export.ignore` 装饰器
- **那么** 该成员的导出与否遵循类级别装饰器的策略

### 需求:装饰器必须使用调用语法
所有 Export 装饰器必须使用调用语法（带括号），例如 `@Export.declare()` 或 `@Export.route(['web'])`。无括号的写法（如 `@Export.declare`）不被支持。

#### 场景:无括号的装饰器不被识别
- **当** 用户在类上使用 `@Export.declare` 无括号语法
- **那么** `sora export:api` 不将该类识别为导出目标
