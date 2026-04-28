## 1. 项目配置

- [x] 1.1 安装 jest 和 @jest/globals 到 packages/framework/devDependencies，在根目录执行 `pnpm install`
- [x] 1.2 创建 packages/framework/jest.config.js，配置 testMatch 指向 dist-test/、extensionsToTreatAsEsm、空 transform、testEnvironment: node、testTimeout: 30000
- [x] 1.3 修改 packages/framework/tsconfig.test.json，添加 `"outDir": "./dist-test"` 和 `"rootDir": "./src"`
- [x] 1.4 在 packages/framework/package.json 添加 scripts：`build:test`、`test`、`test:only`
- [x] 1.5 将 `dist-test/` 添加到 packages/framework/.gitignore（如果未忽略）

## 2. 测试文件迁移（import 替换）

- [x] 2.1 批量替换 47 个测试文件的 `from 'vitest'` → `from '@jest/globals'`（保持解构的 API 名称不变）
- [x] 2.2 在 TraceContext.test.ts 中将 `vi.fn()` → `jest.fn()`，import 中 `vi` → `jest`
- [x] 2.3 在 ConsoleOutput.test.ts 中将 `vi.spyOn()` → `jest.spyOn()`，import 中 `vi` → `jest`，`ReturnType<typeof vi.spyOn>` → `ReturnType<typeof jest.spyOn>`
- [x] 2.4 移除 3 处 `expect(value, 'message')` 的第二参数（Utility.test.ts 2 处、Retry.test.ts 1 处）

## 3. 验证

- [x] 3.1 执行 `npm run build:test`，确认 tsc 编译成功，dist-test/ 生成正确的 JS 文件
- [x] 3.2 执行 `npm test`，确认所有单元测试通过
- [x] 3.3 执行集成测试确认通过（FullStackRpc、TCPRoundTrip、RuntimeShutdown、ServiceLifecycle、SingletonFailover）
- [x] 3.4 全局搜索 `from 'vitest'` 确认零匹配
