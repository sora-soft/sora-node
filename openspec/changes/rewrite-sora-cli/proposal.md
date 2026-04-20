## Why

当前 sora-cli 基于 commander 框架，代码结构扁平（单文件命令注册），类型导出功能（`build:api-declare`）依赖 ts-morph 且通过约定（目录结构 + 继承链）自动发现导出目标，缺乏精确控制能力。随着项目复杂度增长，需要：

1. 更合理的 CLI 框架和项目结构（oclif）
2. 基于装饰器的精确类型导出控制，替代隐式约定
3. 支持按模式（target）分组导出，满足不同客户端需求
4. 简化 sora.json 配置，去除不再需要的字段

## What Changes

- **BREAKING**: 将现有 `packages/sora-cli` 重命名为 `packages/sora-cli-back`（仅作参考），创建全新的 `packages/sora-cli`
- **BREAKING**: 新 sora-cli 基于 oclif 框架，命令结构不变（`new`, `config`, `generate:service`, `generate:handler`, `generate:worker`, `generate:database`）
- **BREAKING**: `build:api-declare` 命令重构为 `export:api`，使用装饰器标记替代目录扫描 + 继承链推断
- **NEW**: 在 framework 包中导出 `Export` 类，包含 `@Export.route`, `@Export.entity`, `@Export.declare`, `@Export.ignore` 静态方法装饰器（运行时 no-op，仅供 CLI 分析）
- **NEW**: `export:api` 支持 `--target` 参数，可指定多个导出模式，每个模式生成独立输出文件
- **BREAKING**: 移除 sora.json 中的 `handlerDir`, `databaseDir`, `userErrorCodeEnum`, `customEnum` 字段
- 实现全部使用原生 TypeScript Compiler API，不引入 ts-morph

## Capabilities

### New Capabilities
- `api-export-decorators`: framework 包导出的 `Export` 类装饰器定义（`@Export.route`, `@Export.entity`, `@Export.declare`, `@Export.ignore`），作为类静态方法组织，运行时 no-op，包含 modes 参数语义
- `export-api-pipeline`: `export:api` 命令的完整流水线 — 文件扫描、装饰器发现、模式过滤、AST 转换、类型依赖解析、文件输出。使用原生 ts API 实现，支持多 target 输出
- `oclif-cli-structure`: 基于 oclif 的新 sora-cli 项目结构，包含 generate 系列命令和 config/new 命令的迁移

### Modified Capabilities
- *(无 — 所有变更通过新 capabilities 覆盖)*

## Impact

- **packages/sora-cli**: 完全重写，旧代码迁移至 sora-cli-back
- **packages/framework**: 新增 `Export` 类导出（`src/lib/export/Export.ts`），包含 route/entity/common/ignore 静态方法装饰器，需更新 `src/index.ts` 导出
- **sora.json 配置**: 移除 4 个字段（`handlerDir`, `databaseDir`, `userErrorCodeEnum`, `customEnum`），现有使用方需在代码中添加装饰器标记
- **apps/example**: AuthHandler 等类需添加 `@Export.route()` 装饰器，数据库实体需添加 `@Export.entity()`，枚举需添加 `@Export.declare()`
- **依赖变化**: sora-cli 移除 `ts-morph` 依赖，新增 `oclif` 相关依赖
