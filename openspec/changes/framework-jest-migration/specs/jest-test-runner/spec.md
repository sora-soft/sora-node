## ADDED Requirements

### Requirement: Jest Test Framework Integration
packages/framework 必须使用 jest 作为测试运行器。所有测试文件必须从 `@jest/globals` 导入测试 API。系统禁止依赖 vitest。

#### Scenario: Test imports resolve to jest
- **When** a test file contains `import { describe, expect, it } from '@jest/globals'`
- **Then** the test runner must execute the test using jest's implementation of these APIs

#### Scenario: Mock API uses jest
- **When** a test requires mock functions
- **Then** the test must use `jest.fn()` and `jest.spyOn()` from `@jest/globals`, and must not use `vi.fn()` or `vi.spyOn()`

### Requirement: Compile-Then-Test Workflow
测试必须通过两步流程运行：先用 tsc（经 ts-patch）编译源码和测试文件到 `dist-test/`，再用 jest 运行编译后的 JS 文件。jest 必须不执行任何 TypeScript 变换。

#### Scenario: Build step produces test-ready JS
- **When** `tsc -p tsconfig.test.json` is executed
- **Then** all `src/**/*.ts` and `src/**/*.test.ts` files must be compiled to `dist-test/**/*.js` and `dist-test/**/*.test.js`
- **And** the compiled output must include typia-generated code, decorator metadata, and version string injection via ts-patch

#### Scenario: Jest runs compiled JS without transform
- **When** jest is invoked with `node --experimental-vm-modules`
- **Then** jest must load and execute files from `dist-test/**/*.test.js`
- **And** no TypeScript transform or ts-jest must be configured

#### Scenario: Relative imports resolve correctly
- **When** a compiled test file imports `'./Utility.js'` or `'../../Enum.js'`
- **Then** the import must resolve to the corresponding file within `dist-test/`

### Requirement: ESM Support
测试运行环境必须支持 ESM 模块加载。编译产物必须保持 ESM 格式。测试必须通过 `--experimental-vm-modules` 标志启动。

#### Scenario: ESM test files execute correctly
- **When** a test file uses `import`/`export` syntax in the compiled JS output
- **Then** jest must correctly load and execute the ESM module

#### Scenario: reflect-metadata loads before tests
- **When** a test file starts with `import 'reflect-metadata'`
- **Then** reflect-metadata must be loaded and its polyfill active before any decorator-dependent code runs

### Requirement: Test Configuration Files
packages/framework 必须包含 `jest.config.js` 和更新后的 `tsconfig.test.json`。

#### Scenario: jest.config.js configuration
- **When** jest loads `jest.config.js`
- **Then** `testMatch` must target `dist-test/**/*.test.js`
- **And** `extensionsToTreatAsEsm` must include `.js`
- **And** `transform` must be empty (no transform needed)
- **And** `testEnvironment` must be `node`
- **And** `testTimeout` must accommodate integration tests (at least 30000ms)

#### Scenario: tsconfig.test.json outputs to dist-test
- **When** `tsconfig.test.json` is used for compilation
- **Then** `outDir` must be `./dist-test`
- **And** test files (`*.test.ts`) must not be excluded
- **And** the config must extend the base tsconfig including typia plugins

### Requirement: Test Scripts in package.json
packages/framework 的 `package.json` 必须提供构建测试和运行测试的脚本。

#### Scenario: Build and run tests
- **When** `npm test` is executed
- **Then** it must compile test files via `tsc -p tsconfig.test.json` and then run jest with `--experimental-vm-modules`

#### Scenario: Run tests without rebuild
- **When** `npm run test:only` is executed
- **Then** it must run jest directly on the existing `dist-test/` output without recompiling

### Requirement: No Vitest Dependencies
所有对 vitest 的引用必须从代码中移除。vitest 禁止作为依赖项安装。

#### Scenario: No vitest imports remain
- **When** searching all `*.test.ts` files for the string `from 'vitest'`
- **Then** zero matches must be found

#### Scenario: expect second argument removed
- **When** a test previously used `expect(value, 'message').toBe(true)`
- **Then** it must be changed to `expect(value).toBe(true)` without the second argument
