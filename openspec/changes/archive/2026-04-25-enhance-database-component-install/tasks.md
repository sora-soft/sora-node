## 1. Config.ts — ISoraConfig 接口扩展

- [x] 1.1 在 `packages/sora-cli/src/lib/Config.ts` 的 `ISoraConfig` 接口中添加 `configTemplates?: { server?: string; command?: string }` 字段和 `migration?: string` 字段
- [x] 1.2 在 `packages/sora-cli/src/lib/ComponentInstallerTypes.ts` 的 `ComponentInstallContext` 接口中添加 `packageDir: string` 字段（用于定位模板文件）

## 2. InstallHelpers — 新增通用 helper 方法

- [x] 2.1 在 `packages/sora-cli/src/lib/InstallHelpers.ts` 中实现 `mergePackageScripts(scripts: Record<string, string>)`：读取项目 package.json，合并 scripts，冲突时 warn 跳过，通过 FileTree 缓冲
- [x] 2.2 在 `InstallHelpers.ts` 中实现 `mergePackageDependencies(deps: { dependencies: Record<string, string> })`：检查 dependencies 和 devDependencies，只添加不存在的到 dependencies，通过 FileTree 缓冲
- [x] 2.3 在 `InstallHelpers.ts` 中实现 `appendToCommandConfigTemplate(key: string, data: Record<string, any>)`：从 sora.json 的 `configTemplates.command` 读取路径（默认 `run/config-command.template.yml`），文件存在则追加，不存在则创建最小化模板
- [x] 2.4 在 `InstallHelpers.ts` 中实现 `addWorkerToProject(options)`：渲染 art-template 模板 → 写入 Worker 文件 → CodeInserter 插入 WorkerName enum → CodeInserter 插入 WorkerRegister import + register 调用。import 路径用 `Utility.resolveImportPath()` 计算
- [x] 2.5 在 `ComponentInstallerTypes.ts` 的 `InstallHelpers` 接口中添加上述 4 个方法的类型签名

## 3. InstallHelpers — findConfigTemplate 改进

- [x] 3.1 修改 `InstallHelpers.findConfigTemplate()` 优先从 `soraConfig.sora.configTemplates?.server` 读取路径，仅在未配置时回退到硬编码默认值

## 4. generate 命令 — 使用 configTemplates

- [x] 4.1 修改 `commands/generate/worker.ts` 的 config template prompt 默认值，从 `this.soraConfig.sora.configTemplates?.server` 读取（fallback 现有硬编码值）
- [x] 4.2 修改 `commands/generate/service.ts` 同上
- [x] 4.3 修改 `commands/generate/command.ts` 的 prompt 默认值，从 `this.soraConfig.sora.configTemplates?.command` 读取

## 5. sora config — --all 模式

- [x] 5.1 在 `commands/config.ts` 中添加 `--all` flag，当设置时遍历 `sora.json` 的 `configTemplates`，对每个模板调用 `generateConfigFile()`，输出路径从模板路径推导（移除 `.template.` 部分）
- [x] 5.2 当 `--all` 指定的模板文件不存在时输出 warn 并跳过，不中断整体流程

## 6. DatabaseMigrateCommandWorker 模板

- [x] 6.1 创建 `packages/database-component/bin/templates/DatabaseMigrateCommandWorker.ts.art` 模板文件，通用化所有 import（Runtime.frameLogger 替代 Application.appLog，Error 替代 AppError/UserError，内联 ISoraConfig interface，模板变量 `comImportPath`/`workerNameImportPath`/`workerNameEnum`/`componentName`）
- [x] 6.2 模板中保留 5 个子命令（generate/sync/migrate/revert/drop）的完整实现逻辑

## 7. database-component install.js 增强

- [x] 7.1 修改 `packages/database-component/bin/install.js` 的 `action()` 函数，在现有 Phase 1 之后新增 Phase 2：调用 `helpers.addWorkerToProject()` 生成 DatabaseMigrateCommandWorker 并注册 Worker（模板路径从 `ctx.packageDir` 定位，templateData 包含从 sora.json 推导的 import 路径）
- [x] 7.2 在 Phase 2 之后新增 Phase 3：调用 `helpers.mergePackageScripts()` 添加 5 个 migrate scripts（migrate:sync/migrate/migrate:drop/migrate:revert/migrate:generate）
- [x] 7.3 在 Phase 3 中调用 `helpers.mergePackageDependencies()` 添加 camelcase/mkdirp/moment 依赖（带版本范围）
- [x] 7.4 在 Phase 3 中调用 `helpers.appendToCommandConfigTemplate()` 添加 `workers.database-migrate-command` 配置段（包含 components 列表引用用户输入的 componentName）
- [x] 7.5 在 action() 末尾通过 `helpers.log()` 输出提示信息，告知用户需运行 `npm install` 安装新添加的依赖

## 8. Template apps — sora.json 更新

- [x] 8.1 在 `apps/account-cluster-template/sora.json` 中添加 `configTemplates: { server: "run/config.template.yml", command: "run/config-command.template.yml" }`
- [x] 8.2 在 `apps/http-server-template/sora.json` 中添加 `configTemplates: { server: "run/config.template.yml", command: "run/config-command.template.yml" }`
- [x] 8.3 在 `apps/base-cluster-template/sora.json` 中添加 `configTemplates: { server: "run/config.template.yml" }`（无 command 模板）

## 9. 验证

- [x] 9.1 构建验证：确保 `pnpm build` 在 sora-cli 和 database-component 包上成功
- [x] 9.2 TypeScript 编译：确保 `Config.ts`、`InstallHelpers.ts`、`ComponentInstallerTypes.ts` 类型检查通过
