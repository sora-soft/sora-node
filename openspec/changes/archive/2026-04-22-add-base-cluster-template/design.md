## 上下文

当前 monorepo 有两个模板项目：
- `http-server-template`：单进程 HTTP 服务，RamDiscovery，零组件，适合最简起步
- `account-cluster-template`：完整认证业务集群，ETCDDiscovery + Redis + MySQL + AliCloud，深度耦合 account 领域逻辑

两者之间缺少一个**通用集群骨架**：有双服务（网关 + 业务）的 RPC 通信模式、有 etcd 服务发现、有 Dockerfile，但不带任何业务逻辑和重型组件。新项目需要一个"中等起步点"。

所有服务基于 `@sora-soft/framework` 的 Service/Listener/Provider/RPC 体系，使用 TypeScript + ESM + typia AOT 验证 + experimentalDecorators。

## 目标 / 非目标

**目标：**
- 提供一个可直接 `sora new` 使用的通用集群模板
- 展示 HttpGateway → Business 的完整 RPC 转发链路（ForwardRoute 模式）
- 组件层仅 etcd（服务发现必需），保持轻量
- 包含完整的项目配置（Dockerfile、config template、sora.json、tsconfig）
- ForwardRoute 保留网关通用头（`RPC_GATEWAY_ID`、`RPC_GATEWAY_SESSION`），去掉认证相关逻辑

**非目标：**
- 不包含任何业务逻辑（无 account、auth、permission）
- 不包含 Redis、MySQL、AliCloud 等重型组件
- 不包含 Worker / CommandWorker（用户可后续通过 `sora generate:command` 添加）
- 不包含 Traefik 集成
- 不修改 framework 或任何 packages 的代码

## 决策

### D1: ForwardRoute 简化策略 — 保留网关通用头，去掉认证

**选择**：从 account 的 ForwardRoute 剥离 `AccountWorld`、`AccountToken`、`AuthRPCHeader` 依赖，保留 `ForwardRPCHeader`（网关 ID/Session）和核心 RPC 转发逻辑。

**理由**：`ForwardRPCHeader` 是网关层的通用概念，不属于业务。保留它可以展示"网关如何传递上下文"这个核心模式。去掉认证后，ForwardRoute 变成纯透传，用户可以基于此自行添加认证中间件。

**替代方案**：完全删除 ForwardRoute，让 HttpGateway 自己处理请求 → 失去了"转发"这个网关核心模式的展示。

### D2: BusinessHandler 使用 ping/echo 示例

**选择**：BusinessHandler 提供一个 `ping` 方法（接收请求返回响应），展示 `@Route.method` + `@guard` 的完整用法。

**理由**：最简的"有输入有输出"示例，不涉及任何外部依赖，用户可以直接在此基础上添加业务方法。

### D3: 配置模板仅包含 etcd 和两个服务

**选择**：`config.template.yml` 的 `#define` 变量仅包含 projectScope、host、exposeHost、portRange、etcdHost、alias。components 仅有 etcd。services 包含 http-gateway 和 business。

**理由**：减少首次配置的认知负担。需要 Redis/MySQL 的用户可自行添加组件定义。

### D4: Dockerfile 与 account 保持一致模式

**选择**：多阶段构建（node:18-alpine），全局安装，标准卷挂载。命令名改为 `base-server`。

**理由**：与已有模板保持一致的容器化模式。

### D5: CLI 模板列表插入位置

**选择**：在 `templates` 数组中，将 base-cluster-template 放在 http-server 和 account 之间（索引 1）。

**理由**：复杂度递增排列：http(简单) → base(中等) → account(复杂)，用户选择时直觉友好。

## 风险 / 权衡

- **[ForwardRoute 过于简化]** → 用户拿到后可能需要自行加认证，但作为模板这比 account 的"先删后改"体验更好。缓解：代码注释中标注"可在此添加认证逻辑"。
- **[不含数据库意味着不能用 `sora generate:command` 做迁移]** → 这是预期行为，模板定位就是不带数据库。用户添加 database-component 后自然可以使用。
- **[package.json 的 bin 名为 `base-server`]** → 如果用户创建多个 base 模板项目会冲突，但与 account 模板行为一致（也是硬编码 `app-server`），用户在 `sora new` 时会重写 package.json。
