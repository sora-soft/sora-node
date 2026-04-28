## 1. 基础设施准备

- [x] 1.1 根 package.json 新增 `ts-patch` 到 devDependencies，新增 `"prepare": "ts-patch install"` 到 scripts
- [x] 1.2 创建 `scripts/version-transform/` 目录，实现 ts-patch transformer：从 package.json 读取版本号，将 AST 中匹配的 `__VERSION__` Identifier 替换为 StringLiteral，支持 `identifier` 和 `packagePath` plugin options
- [x] 1.3 更新 `tsconfig.base.json`：在 `plugins` 数组中注册 `{ "transform": "typia/lib/transform" }`、`{ "transform": "@sora-soft/typia-decorator/transform" }`、`{ "transform": "../../scripts/version-transform", "identifier": "__VERSION__" }`
- [x] 1.4 运行 `pnpm install && pnpm run prepare`，确认 ts-patch 成功安装补丁

## 2. typia-decorator 包清理

- [x] 2.1 删除 `packages/typia-decorator/src/unplugin/` 整个目录
- [x] 2.2 更新 `packages/typia-decorator/package.json`
- [x] 2.3 更新 `packages/typia-decorator/tsconfig.json`：确认 `plugins` 为空数组（该包自身不需要 typia/typia-decorator/version transform）

## 3. 叶子包迁移（无内部依赖的包）

- [x] 3.1 迁移 `packages/ram-discovery`
- [x] 3.2 迁移 `packages/etcd-discovery`
- [x] 3.3 迁移 `packages/http-support`

## 4. 组件包迁移（依赖 framework 的包）

- [x] 4.1 迁移 `packages/database-component`
- [x] 4.2 迁移 `packages/etcd-component`
- [x] 4.3 迁移 `packages/redis-component`

## 5. framework 包迁移

- [x] 5.1 迁移 `packages/framework`

## 6. App 模板迁移

- [x] 6.1 迁移 `apps/http-server-template`
- [x] 6.2 迁移 `apps/base-cluster-template`
- [x] 6.3 迁移 `apps/account-cluster-template`

## 7. 根级别清理

- [x] 7.1 删除根 `vite.config.base.ts`
- [x] 7.2 更新根 `package.json`
- [x] 7.3 sora-cli 不需要改动（已使用纯 tsc），确认其 tsconfig.json 不受 base plugins 影响（已有 `plugins: []`）
- [x] 7.4 运行 `pnpm install` 确认依赖树干净，无遗漏的 vite 相关包

## 8. 全量验证

- [x] 8.1 对所有包运行 `tsc`，确认全部编译通过
- [x] 8.2 检查各包 dist/ 输出：确认 .js、.d.ts、.js.map 文件均正确生成，exports 路径全部可解析
- [x] 8.3 抽查几个包的 `__VERSION__` 替换结果，确认版本号正确注入
