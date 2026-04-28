## Context

packages/framework 是 sora-node 的核心框架包，包含 47 个测试文件（`*.test.ts`），覆盖 utility、RPC、TCP、trace、logger、context 等模块。测试文件使用 vitest API 编写（`describe/it/expect`、`vi.fn()`、`vi.spyOn()`），但 vitest 从未安装。

项目使用纯 ESM + ts-patch 编译管线：
- `"type": "module"`、`"module": "NodeNext"`、`verbatimModuleSyntax: true`
- ts-patch 注入 3 个 TypeScript 编译插件：typia transform、typia-decorator transform、version-transform
- vitest 依赖 vite 做内部变换，无法复用 ts-patch 管线

Node.js 版本要求 >= 22。

## Goals / Non-Goals

**Goals:**
- 让 47 个测试文件可运行
- 保持与 ts-patch 编译管线完全兼容
- 最小化源码改动（机械替换为主）
- 支持 ESM 模块加载
- 单元测试和集成测试都能运行

**Non-Goals:**
- 不修改生产代码
- 不改变测试的断言逻辑或测试覆盖范围
- 不引入 snapshot testing 或其他 jest 高级特性
- 不配置 coverage 工具（后续可加）
- 不影响其他 packages 的测试配置

## Decisions

### Decision 1: "先编译再测试" 而非 ts-jest on-the-fly

**选择**: 用 tsc（经 ts-patch）将源码和测试一起编译到 `dist-test/`，再由 jest 运行编译后的 JS。

**替代方案**: 使用 ts-jest 在测试运行时即时编译 TypeScript。

**理由**: ts-jest 需要额外配置 astTransformers 或依赖全局 ts-patch 状态来处理 typia/typia-decorator/version-transform，配置复杂且容易出问题。编译后测试将 ts-patch 完全限定在编译阶段，测试框架完全不感知 TypeScript，架构清晰。

```
src/**/*.ts + src/**/*.test.ts
        │
        ▼  tsc (ts-patch)
  dist-test/**/*.js + dist-test/**/*.test.js
        │
        ▼  jest (纯 JS，无 transform)
  测试结果
```

### Decision 2: jest 而非 node --test

**选择**: jest + `@jest/globals`

**替代方案**: Node.js 内置 `node --test`

**理由**: 现有 47 个测试文件使用 `describe/it/expect().toBe()` 风格，与 jest API 几乎完全兼容。`node --test` 的 assert API 风格不同（`assert.strictEqual`），需要重写所有断言。jest 仅需替换 import 来源和少数 mock 调用。

### Decision 3: ESM 原生输出 + --experimental-vm-modules

**选择**: 保持 ESM 编译输出，使用 `--experimental-vm-modules` 运行 jest。

**替代方案**: 为测试单独编译为 CJS（关闭 verbatimModuleSyntax，设置 module: CommonJS）。

**理由**: 保持测试编译产物与生产编译产物一致，避免 CJS 模式下装饰器 + reflect-metadata + .js 后缀 import 的兼容性风险。Node 22 的 `--experimental-vm-modules` 已足够稳定。

### Decision 4: @jest/globals 显式 import

**选择**: 每个测试文件显式 `import { describe, expect, it } from '@jest/globals'`。

**替代方案**: 依赖 jest 全局变量 + `@types/jest`。

**理由**: 与当前 vitest 的显式 import 风格一致，TypeScript 类型安全，无全局污染。

### Decision 5: jest.config.js (ESM)

**选择**: 使用 `jest.config.js`（ESM export default 格式），与项目 `"type": "module"` 一致。

**理由**: 最小配置，指定 testMatch 指向 `dist-test/`，无 transform。

## Risks / Trade-offs

**jest ESM 模式的成熟度** → `--experimental-vm-modules` 在 Node 22 下已被广泛使用，jest 30 对 ESM 支持完善。如果遇到问题，可退回 jest 29 或切换到 CJS 编译输出。

**集成测试超时** → FullStackRpc、TCPRoundTrip 等集成测试有大量 `wait(500)` 调用。设置 `testTimeout: 30000`，必要时对特定测试单独设超时。

**编译-测试两步流程** → 每次改测试都需要重新编译。通过 `build:test` 脚本简化操作，开发时可用 `test:only` 跳过编译直接运行上次编译结果。

**`expect(value, message)` 不可用** → 3 处使用 vitest 的 `expect(cond, 'msg').toBe(true)` 模式。jest 不支持第二参数。直接移除消息参数，失败时 jest 仍会输出值信息。如需更精确的错误信息，可拆分为多个具名断言。
