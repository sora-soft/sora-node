## 为什么

现有模板体系存在缺口：`http-server-template` 是单进程极简模板（RamDiscovery，无组件），`account-cluster-template` 是完整认证业务集群（Redis + MySQL + etcd + AliCloud）。缺少一个**中等复杂度的通用集群起步模板**——包含双服务（网关 + 业务）、etcd 服务发现，但不带任何特定业务逻辑和重型依赖。新项目基于此模板可以快速搭建集群骨架，再按需添加组件和业务。

## 变更内容

- 新增 `apps/base-cluster-template/` 项目，包含两个服务：
  - `HttpGatewayService`：HTTP + WebSocket 网关，通过 `ForwardRoute` 将请求转发到内部 TCP 服务（模式照抄 `account-cluster-template`，去掉认证/Traefik 耦合）
  - `BusinessService`：TCP 业务服务，带示例 `BusinessHandler`（ping/echo 方法展示完整 RPC 调用链路）
- 组件层仅包含 `EtcdComponent`（用于服务发现）
- 包含 Dockerfile、config.template.yml、sora.json 等完整项目配置
- 更新 `packages/sora-cli/src/commands/new.ts` 中的模板列表，添加 `@sora-soft/base-cluster-template` 选项

## 功能 (Capabilities)

### 新增功能
- `base-cluster-template`: 通用双服务集群模板项目，包含 HttpGateway + Business 服务的完整 RPC 转发链路、etcd 服务发现、ForwardRoute 纯转发模式、Dockerfile 和配置模板

### 修改功能
- `sora-cli`: CLI `sora new` 命令的模板选择列表中新增 `base-cluster-template` 条目

## 影响

- **新增代码**：`apps/base-cluster-template/` 完整项目（约 20+ 文件）
- **修改代码**：`packages/sora-cli/src/commands/new.ts` 添加一行模板记录
- **依赖**：`@sora-soft/framework`、`@sora-soft/http-support`、`@sora-soft/etcd-component`、`@sora-soft/etcd-discovery`、`@sora-soft/typia-decorator`（不含 redis-component、database-component）
- **不受影响**：现有模板项目和框架包无任何改动
