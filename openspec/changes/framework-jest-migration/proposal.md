## Why

packages/framework 的 47 个测试文件使用 `vitest` API 编写，但 vitest 依赖 vite 作为内部变换引擎，无法支持项目所需的 ts-patch 编译管线（typia transform、typia-decorator transform、version-transform）。测试框架从未安装和配置过，测试无法运行。

项目使用纯 ESM（`type: module`、`module: NodeNext`、`verbatimModuleSyntax`）+ ts-patch 装饰器/typia 变换，需要一种与 ts-patch 兼容的测试方案。

## What Changes

- **新增** jest + `@jest/globals` 作为测试框架，替代 vitest
- **新增** "先编译再测试" 工作流：使用 tsc（经 ts-patch）将源码和测试文件一起编译到 `dist-test/`，然后 jest 直接运行编译后的 JS
- **修改** 47 个测试文件的 import 语句：`from 'vitest'` → `from '@jest/globals'`
- **修改** 2 个测试文件的 mock API：`vi.fn()` / `vi.spyOn()` → `jest.fn()` / `jest.spyOn()`
- **修改** 3 处 `expect(value, message)` 调用（jest 不支持第二参数）
- **修改** `tsconfig.test.json`：增加 `outDir: ./dist-test`，确保测试文件被编译
- **新增** `jest.config.js` 配置文件
- **新增** `package.json` 测试相关脚本和 devDependencies
- **移除** 对 vitest 的依赖（当前未安装，但代码中引用了它）

## Capabilities

### New Capabilities

- `jest-test-runner`: jest 测试框架集成，包括编译-后测试工作流、ESM 支持、jest 配置、以及测试脚本的完整可运行测试环境

### Modified Capabilities

（无 — 这是新增测试基础设施，不影响现有生产代码的行为规范）

## Impact

- **代码**: `packages/framework/src/` 下 47 个 `*.test.ts` 文件的 import 和 mock API 调用
- **配置**: `packages/framework/tsconfig.test.json`、新增 `jest.config.js`、`package.json` scripts 和 devDependencies
- **依赖**: 新增 `jest`、`@jest/globals`；移除对 vitest 的代码引用
- **构建**: 新增 `dist-test/` 编译输出目录（加入 `.gitignore`）
- **CI/CD**: 测试命令变为 `npm run build:test && node --experimental-vm-modules ./node_modules/.bin/jest`
- **运行时要求**: Node.js >= 22（已有要求），`--experimental-vm-modules` 标志
