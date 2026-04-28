## 新增需求

### 需求:Transform 必须复用现有 processSourceFile 逻辑
tsc transformer 入口（`src/transform/index.ts`）必须调用 `src/transform/visitor.ts` 中现有的 `processSourceFile` 函数，不得重新实现 `@guard` 装饰器的解析和代码注入逻辑。

#### 场景:@guard 方法被正确变换
- **当** 源文件包含带 `@guard` 参数装饰器的方法，且该方法参数有类型注解
- **那么** transform 后的方法体开头必须包含 typia `assert()` 调用，`@guard` 装饰器必须被移除，必要的 import 语句必须被注入

#### 场景:无 @guard 的文件被跳过
- **当** 源文件不包含 `@guard` 字符串或不包含 `typia-decorator` 字符串
- **那么** transform 必须立即返回原始 sourceFile，不执行额外处理

### 需求:类型信息被正确解析
tsc transformer 模式下，`ts.Program` 由编译器直接提供。transform 必须通过编译器提供的 `program.getTypeChecker()` 正确解析类型信息以驱动 transform。

#### 场景:跨文件类型引用
- **当** `@guard` 参数的类型是跨文件引用的 interface（如从 `../interface/index.js` 导入）
- **那么** transform 必须正确解析该类型并生成对应的 assert 代码

### 需求:增量编译缓存
tsc transformer 模式下，编译器管理整个编译过程的文件加载和缓存，不需要 transformer 自行实现磁盘缓存。

#### 场景:tsc 增量编译
- **当** 启用 tsc 增量编译（`incremental: true` 或 `composite: true`）
- **那么** 未变更的文件禁止被重复 transform

### 需求:SourceMap 由 tsc 原生生成
tsc 原生支持 sourceMap 生成（通过 `compilerOptions.sourceMap: true`），transformer 不需要自行生成 sourcemap。tsc 会在应用所有 transformer 后生成正确的 sourcemap。

#### 场景:sourcemap 正确性
- **当** 编译后的文件在 Node.js 中运行并通过 `source-map-support` 报错
- **那么** 错误堆栈必须显示原始 TypeScript 源码位置

### 需求:禁止依赖 unplugin 相关的 peerDependencies
禁止声明 unplugin、magic-string、diff-match-patch-es、@rollup/pluginutils、pathe、pkg-types、find-cache-dir、consola 等 unplugin 相关依赖为 peerDependencies。

#### 场景:安装时 peer 依赖清理
- **当** 用户安装 `@sora-soft/typia-decorator`
- **那么** 禁止发出关于 unplugin、magic-string 等 unplugin 相关依赖的 peer dependency 缺失警告

### 需求:现有 transform 导出必须保持不变
`./transform` 和 `./runtime` 导出路径的行为和接口禁止有任何变更。

#### 场景:tspc 编译继续工作
- **当** 下游包通过 ts-patch 使用 `@sora-soft/typia-decorator/transform` 作为 compiler plugin
- **那么** 行为必须与移除 unplugin 之前完全一致

## 修改需求

## 移除需求
