## Why

项目当前使用 Vite 作为构建工具，但 Vite 对纯后端 TypeScript 库项目是过度工程化的：

- Vite 的职责（ES 打包、.d.ts 生成、装饰器转译、define 替换）在 tsc + ts-patch 下全部可以原生完成
- tsconfig.base.json 已经配置了 `experimentalDecorators`、`emitDecoratorMetadata`、`declaration`，tsc 本身就能处理装饰器和类型声明
- `version.d.ts` 中的注释仍写着 "ts-patch 注入"，说明项目原本就使用 ts-patch，Vite 是后来引入的
- `sora-cli` 和 `typia-decorator` 从未使用 Vite，证明纯 tsc 路径完全可行
- 3 个 app 的 `vite.config.ts` 都内联了重复的 `createConfig` 函数，而非引用共享的 `vite.config.base.ts`，导致代码重复和漂移风险

移除 Vite 可以简化构建链路、减少依赖数量、消除打包器与 tsc 行为差异带来的潜在问题。

## What Changes

- **移除 Vite 构建管线**：所有 10 个包（7 packages + 3 apps）的 `build` 脚本从 `vite build` 改为 `tsc`
- **移除 `vite.config.base.ts`**：根级别的共享 Vite 配置不再需要
- **移除所有 `vite.config.ts`**：10 个包各自的 Vite 配置文件全部删除
- **移除 `vitest`**：framework 包的测试框架 vitest 移除，测试框架替代方案另行处理
- **移除 `@typia/unplugin`**：typia 的 Vite/esbuild 插件替换为 `@typia/transform`（tsc 原生 transformer）
- **移除 `vite-plugin-swc-transform`**：装饰器转译由 tsc 原生 `experimentalDecorators` + `emitDecoratorMetadata` 处理
- **移除 `vite-plugin-dts`**：.d.ts 生成由 tsc 原生 `declaration: true` 处理
- **移除 `@swc/core`**：不再需要 SWC 做装饰器转译
- **新增 `ts-patch`**：使 tsc 支持自定义 transformer 插件
- **新增自写 `version-transform`**：ts-patch transformer，替代 Vite 的 `define: { __VERSION__ }` 功能，编译时将 `__VERSION__` 标识符替换为 package.json 中的版本字符串
- **typia-decorator 移除 unplugin 入口**：删除 `src/unplugin/` 目录及相关 exports，只保留 `src/transform/` 的 tsc transformer 入口

## Capabilities

### New Capabilities
- `version-transform`: 自写 ts-patch transformer，在编译时将全局常量 `__VERSION__` 替换为 package.json 中的版本号字符串。替代 Vite 的 `define` 功能。

### Modified Capabilities
- `unplugin-guard-transform`: 从 unplugin（Vite/esbuild 插件）模式迁移为纯 tsc transformer 模式。typia-decorator 的 transform 入口不变（`src/transform/index.ts` 已导出标准 `ts.TransformerFactory`），但移除 unplugin 入口（`src/unplugin/` 目录及 `exports` 中的 `./unplugin/*` 路径）。

## Impact

- **所有 10 个包** 的 `package.json` 脚本和 devDependencies 需要修改
- **根 `package.json`** 需要移除 Vite 相关依赖，新增 ts-patch
- **`tsconfig.base.json`** 的 `plugins` 数组需要注册 3 个 transformer（typia、typia-decorator、version-transform）
- **`packages/typia-decorator`** 需要删除 `src/unplugin/` 目录并更新 `exports`、`peerDependencies`
- **46 个测试文件**（framework 包）使用 vitest API，暂时挂起不处理，后续单独迁移测试框架
- **输出结构**：tsc 输出保持 `src/ → dist/` 目录层级，经确认与现有 `exports` 路径匹配，无破坏性变更
