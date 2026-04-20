## ADDED Requirements

### 需求:@soraExport JSDoc Tag
系统必须支持 `@soraExport` JSDoc tag 作为声明级别的导出标记。`@soraExport` 后可跟可选参数 `route` 或 `entity`，分别表示 route 策略和 entity 策略。无参数表示通用导出策略。`@soraExport` 适用于 class、enum、interface、type alias 声明。

#### 场景:route 策略标记
- **当** 一个类声明上方的 JSDoc 包含 `@soraExport route`
- **那么** 该类被识别为 route 策略导出

#### 场景:entity 策略标记
- **当** 一个类声明上方的 JSDoc 包含 `@soraExport entity`
- **那么** 该类被识别为 entity 策略导出

#### 场景:通用导出标记
- **当** 一个声明上方的 JSDoc 包含 `@soraExport`（无参数）
- **那么** 该声明被识别为通用导出，不做任何策略相关的特殊过滤

#### 场景:enum 通用导出
- **当** 一个 enum 声明上方的 JSDoc 包含 `@soraExport`
- **那么** 该 enum 被导出为 `export declare enum`，所有 members 原样保留

#### 场景:interface 通用导出
- **当** 一个 interface 声明上方的 JSDoc 包含 `@soraExport`
- **那么** 该 interface 被原样导出

#### 场景:type alias 通用导出
- **当** 一个 type alias 声明上方的 JSDoc 包含 `@soraExport`
- **那么** 该 type alias 被原样导出

#### 场景:class 通用导出
- **当** 一个 class 声明上方的 JSDoc 包含 `@soraExport`（无参数）
- **那么** 该 class 导出所有 public 成员（排除 private/protected/static/constructor），使用 `export declare class` 格式

### 需求:@soraTargets JSDoc Tag
系统必须支持 `@soraTargets` JSDoc tag 用于指定目标模式过滤。`@soraTargets` 后跟逗号分隔的 target 名称（如 `@soraTargets web,admin`）。`@soraTargets` 可出现在声明级别或成员级别。

#### 场景:声明级别 target 过滤
- **当** 声明级别的 JSDoc 包含 `@soraTargets web`
- **那么** 该声明仅在 `--target=web` 或全量导出时被导出

#### 场景:多 target 过滤
- **当** 声明级别的 JSDoc 包含 `@soraTargets web,admin`
- **那么** 该声明在 `--target=web` 或 `--target=admin` 或全量导出时被导出

#### 场景:无 @soraTargets 等价于全模式
- **当** 声明有 `@soraExport` 但没有 `@soraTargets`
- **那么** 该声明在任何 target 和全量导出时都被导出

### 需求:@soraIgnore JSDoc Tag
系统必须支持 `@soraIgnore` JSDoc tag 用于成员级别的导出排除。`@soraIgnore` 出现在 class 的方法或属性上方的 JSDoc 中。可搭配 `@soraTargets` 指定仅特定 target 下忽略。

#### 场景:无参数 @soraIgnore 永远排除
- **当** 成员的 JSDoc 包含 `@soraIgnore`（无 @soraTargets）
- **那么** 该成员在任何 target 和全量导出下都不被导出

#### 场景:搭配 @soraTargets 指定 target 排除
- **当** 成员的 JSDoc 同时包含 `@soraIgnore` 和 `@soraTargets web`
- **那么** 该成员在 `--target=web` 时不导出，在其他 target 和全量导出时正常导出

#### 场景:搭配 @soraTargets 多 target 排除
- **当** 成员的 JSDoc 同时包含 `@soraIgnore` 和 `@soraTargets web,admin`
- **那么** 该成员在 `--target=web` 和 `--target=admin` 时都不导出

#### 场景:全量导出时 @soraIgnore 带指定 target 不排除
- **当** 成员的 JSDoc 同时包含 `@soraIgnore` 和 `@soraTargets web`，运行无 `--target`
- **那么** 该成员在全量文件中被导出

### 需求:Export 装饰器类移除
系统必须从 `@sora-soft/framework` 包中移除 `Export` 类及其所有导出。`Export.route`、`Export.entity`、`Export.declare`、`Export.ignore` 不再存在。

#### 场景:Export 类不可用
- **当** 用户尝试 `import { Export } from '@sora-soft/framework'`
- **那么** TypeScript 编译报错，`Export` 未导出

#### 场景:旧装饰器不报错但也不生效
- **当** 源码中残留 `@Export.route()` 装饰器（未迁移）
- **那么** 该装饰器作为普通函数调用运行时无效果，但 `sora export:api` 不将其识别为导出标记

### 需求:生成文件中剥离 soraExport 标签
输出声明文件中必须不包含 `@soraExport`、`@soraTargets`、`@soraIgnore` 标签。其他 JSDoc 文档注释必须保留。

#### 场景:自定义 tag 被清理
- **当** 源码中声明有 `/** @soraExport route @soraTargets web */`
- **那么** 输出声明文件中该注释不包含 `@soraExport` 和 `@soraTargets`

#### 场景:文档注释保留
- **当** 源码中声明有 `/** 用户信息 @soraExport entity */`
- **那么** 输出声明文件中保留 `/** 用户信息 */` 部分

### 需求:重复 @soraExport 报错
同一个声明上出现多个 `@soraExport` tag 必须报错。

#### 场景:重复标记
- **当** 一个类的 JSDoc 同时包含 `@soraExport route` 和 `@soraExport entity`
- **那么** export:api 必须报错并提示"一个声明只能有一个 @soraExport 标记"

### 需求:@soraExport 不继承
`@soraExport` 标记不通过继承传递。父类有 `@soraExport route` 不影响子类。

#### 场景:子类无标记不被导出
- **当** 父类有 `@soraExport route` 但子类没有 `@soraExport`
- **那么** 子类不被识别为导出目标

## REMOVED Requirements

### 需求:Export 类导出
**Reason**: 整个 `Export` 装饰器类被 JSDoc 标注系统取代。
**Migration**: 将 `@Export.route()` 替换为 `@soraExport route`，`@Export.entity()` 替换为 `@soraExport entity`，`@Export.declare()` 替换为 `@soraExport`，`@Export.ignore()` 替换为 `@soraIgnore`。模式参数通过 `@soraTargets` tag 指定。

### 需求:Export.route 装饰器
**Reason**: 被 `@soraExport route` JSDoc tag 取代。
**Migration**: `@Export.route(['web'])` → `/** @soraExport route @soraTargets web */`

### 需求:Export.entity 装饰器
**Reason**: 被 `@soraExport entity` JSDoc tag 取代。
**Migration**: `@Export.entity()` → `/** @soraExport entity */`

### 需求:Export.declare 装饰器
**Reason**: 被 `@soraExport`（无参数）JSDoc tag 取代。
**Migration**: `@Export.declare()` → `/** @soraExport */`

### 需求:Export.ignore 忽略装饰器
**Reason**: 被 `@soraIgnore` JSDoc tag 取代。
**Migration**: `@Export.ignore()` → `/** @soraIgnore */`；`@Export.ignore(['web'])` → `/** @soraIgnore @soraTargets web */`

### 需求:装饰器必须使用调用语法
**Reason**: 装饰器体系整体移除，此规则不再适用。JSDoc tag 语法无调用语法概念。
**Migration**: 不适用。
