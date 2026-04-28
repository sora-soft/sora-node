## MODIFIED Requirements

### 需求:Unplugin 导出必须支持 vite 和 esbuild
**移除此需求。** 包不再提供 unplugin 入口。所有 transform 功能通过 tsc transformer（`./transform` export）提供，由 ts-patch 驱动。

#### 场景:vite 配置中使用
- **当** 用户通过 ts-patch 在 tsconfig.json 中配置 `{ "transform": "@sora-soft/typia-decorator/transform" }`
- **那么** tsc 编译管道中必须对包含 `@guard` 装饰器的 TypeScript 文件执行 AST transform

#### 场景:esbuild 配置中使用
- **不适用** — unplugin/esbuild 入口已移除

### 需求:Transform 必须复用现有 processSourceFile 逻辑
无变更。tsc transformer 入口（`src/transform/index.ts`）继续调用 `src/transform/visitor.ts` 中的 `processSourceFile` 函数。

#### 场景:@guard 方法被正确变换
- **当** 源文件包含带 `@guard` 参数装饰器的方法，且该方法参数有类型注解
- **那么** transform 后的方法体开头必须包含 typia `assert()` 调用，`@guard` 装饰器必须被移除，必要的 import 语句必须被注入

#### 场景:无 @guard 的文件被跳过
- **当** 源文件不包含 `@guard` 字符串或不包含 `typia-decorator` 字符串
- **那么** transform 必须立即返回原始 sourceFile，不执行额外处理

### 需求:必须通过临时 ts.Program 获取 TypeChecker
此需求仅适用于 unplugin 模式。tsc transformer 模式下，`ts.Program` 由编译器直接提供，无需临时创建。

#### 场景:类型信息被正确解析
- **当** `@guard` 参数的类型是跨文件引用的 interface（如从 `../interface/index.js` 导入）
- **那么** transform 必须通过编译器提供的 `program.getTypeChecker()` 正确解析该类型并生成对应的 assert 代码

### 需求:必须实现磁盘缓存
此需求仅适用于 unplugin 模式（unplugin 每次调用只处理单个文件，需要缓存来避免重复创建 Program）。tsc transformer 模式下，编译器管理整个编译过程，缓存由 tsc 增量编译机制处理，不需要 transformer 自行实现缓存。

#### 场景:tsc 增量编译
- **当** 启用 tsc 增量编译（`incremental: true` 或 `composite: true`）
- **那么** 未变更的文件禁止被重复 transform

### 需求:必须生成 SourceMap
tsc 原生支持 sourceMap 生成（通过 `compilerOptions.sourceMap: true`），transformer 不需要自行生成 sourcemap。tsc 会在应用所有 transformer 后生成正确的 sourcemap。

#### 场景:sourcemap 正确性
- **当** 编译后的文件在 Node.js 中运行并通过 `source-map-support` 报错
- **那么** 错误堆栈必须显示原始 TypeScript 源码位置

### 需求:新增依赖必须声明为 peerDependencies
移除 unplugin 相关的 peerDependencies。以下依赖不再需要：unplugin、magic-string、diff-match-patch-es、@rollup/pluginutils、pathe、pkg-types、find-cache-dir、consola。

#### 场景:安装时 peer 依赖清理
- **当** 用户安装 `@sora-soft/typia-decorator`
- **那么** 禁止发出关于 unplugin、magic-string 等 unplugin 相关依赖的 peer dependency 缺失警告

### 需求:现有 transform 导出必须保持不变
`./transform` 和 `./runtime` 导出路径的行为和接口禁止有任何变更。

#### 场景:tspc 编译继续工作
- **当** 下游包通过 ts-patch 使用 `@sora-soft/typia-decorator/transform` 作为 compiler plugin
- **那么** 行为必须与移除 unplugin 之前完全一致

## REMOVED Requirements

### 需求:Unplugin 导出必须支持 vite 和 esbuild
**Reason**: 项目全面从 Vite/bundler 构建管线迁移到 tsc + ts-patch。不再有 bundler 层面的消费者，unplugin 入口已无用途。
**Migration**: 在 tsconfig.json 中注册 `{ "transform": "@sora-soft/typia-decorator/transform" }` 替代 unplugin/vite 和 unplugin/esbuild 入口。功能完全由 tsc transformer 覆盖。

### 需求:必须通过临时 ts.Program 获取 TypeChecker
**Reason**: tsc transformer 模式下 `ts.Program` 由编译器直接提供，无需 transformer 自行创建临时 Program。
**Migration**: 无需迁移，tsc 编译器自动提供完整的 Program 实例。

### 需求:必须实现磁盘缓存
**Reason**: tsc transformer 模式下，编译器管理整个编译过程的文件加载和缓存，不需要 transformer 自行实现磁盘缓存。
**Migration**: 使用 tsc 增量编译（`--incremental`）获得编译缓存。

### 需求:必须生成 SourceMap
**Reason**: tsc 原生支持 sourcemap 生成，transformer 不需要自行处理。
**Migration**: 设置 `compilerOptions.sourceMap: true` 即可。
