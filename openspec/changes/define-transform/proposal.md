## 为什么

当前 `version-transform` 只能将 `package.json#version` 注入为编译时常量 `__VERSION__`。项目中已有多处需要编译时常量注入的场景（如包名、环境变量），但每新增一个常量就需要修改 transformer 代码或重复注册多个 transformer。需要一个通用的编译时常量注入器，通过配置驱动，支持多种数据来源。

## 变更内容

- **新增 `define-transform`**：替代 `version-transform`，支持通过 `defines` 配置从三种来源注入编译时常量：
  - `pkg`：从 `package.json` 顶层字段读取（如 version、name）
  - `env`：从 `process.env` 读取，缺失时替换为空字符串
  - `literal`：直接注入字面量值（支持 string、number、boolean、null）
- 支持 `packagePath` 选项指定 package.json 路径
- 支持 string 简写语法：`"version"` 等价于 `{ "pkg": "version" }`
- **BREAKING**：移除 `version-transform`，所有 tsconfig 中的 `identifier` 配置迁移为 `defines` 格式
- **BREAKING**：`version-transform` 相关的 spec 重写为 `define-transform` spec

## 功能 (Capabilities)

### 新增功能
- `define-transform`: 通用的 ts-patch 编译时常量注入 transformer，支持 pkg/env/literal 三种数据来源，通过 `defines` 配置驱动

### 修改功能
- `version-transform`: 整体替换为 `define-transform`，旧 spec 作废

## 影响

- `scripts/version-transform/` → 删除，由 `scripts/define-transform/` 替代
- `tsconfig.base.json`：plugins 配置格式变更
- `packages/ram-discovery/tsconfig.json`、`packages/http-support/tsconfig.json`、`packages/etcd-discovery/tsconfig.json`：plugins 配置格式变更
- `packages/*/src/version.d.ts`：不受影响（`declare const __VERSION__: string` 保持不变）
- `openspec/specs/version-transform/spec.md`：重写为 `openspec/specs/define-transform/spec.md`
