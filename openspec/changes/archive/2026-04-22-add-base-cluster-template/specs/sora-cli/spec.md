## 修改需求

### 需求:模板选择列表包含 base-cluster-template
`packages/sora-cli/src/commands/new.ts` 中的 `templates` 常量数组必须包含 `@sora-soft/base-cluster-template` 条目，描述为"带网关与业务服务的通用集群模板"。插入位置必须在 http-server-template 和 account-cluster-template 之间。

#### 场景:交互式选择显示三个模板
- **当** 用户执行 `sora new my-app` 未指定模板参数
- **那么** 交互式列表按复杂度递增显示三个模板选项，base-cluster-template 排在第二位（http-server 之后、account-cluster 之前）

#### 场景:命令行直接指定模板
- **当** 用户执行 `sora new my-app @sora-soft/base-cluster-template`
- **那么** CLI 跳过模板选择提示，直接使用 base-cluster-template 创建项目
