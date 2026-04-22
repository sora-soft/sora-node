### 需求:模板项目结构
系统必须提供 `apps/base-cluster-template/` 项目，包含完整的项目骨架：package.json、tsconfig.json、sora.json、Dockerfile、bin/cli.js、eslint.config.mjs、.gitignore、.npmignore、run/config.template.yml。

#### 场景:项目可通过 sora new 创建
- **当** 用户执行 `sora new my-app` 并选择 `@sora-soft/base-cluster-template`
- **那么** 系统下载并解压模板到 my-app 目录，包含所有必要文件

#### 场景:项目可通过 Docker 构建
- **当** 用户在项目根目录执行 `docker build .`
- **那么** Docker 构建成功，产出包含编译后代码的运行时镜像

### 需求:HttpGatewayService
系统必须提供 HttpGatewayService，对外暴露 HTTP 和 WebSocket 监听器，通过 ForwardRoute 将请求按 service 名称转发到内部 TCP 服务。HttpGatewayService 的启动过程中必须连接 etcd 组件并注册 BusinessProvider。

#### 场景:HTTP 请求转发到 Business 服务
- **当** 外部客户端通过 HTTP 发送请求，service 字段指向 Business 服务
- **那么** HttpGatewayService 通过 ForwardRoute 将请求转发到 BusinessService 的 TCP 监听器，并返回响应

#### 场景:WebSocket 通知转发
- **当** 外部客户端通过 WebSocket 发送通知，service 字段指向 Business 服务
- **那么** HttpGatewayService 通过 ForwardRoute 将通知转发到 BusinessService，不返回响应

#### 场景:转发不存在的服务
- **当** 请求的 service 字段指向未注册的服务名称
- **那么** HttpGatewayService 返回 `ERR_RPC_SERVICE_NOT_FOUND` 错误

### 需求:BusinessService
系统必须提供 BusinessService，通过 TCP 监听器接收 RPC 请求，使用 BusinessHandler 处理业务方法。BusinessService 的启动过程中必须连接 etcd 组件。

#### 场景:处理 ping 请求
- **当** BusinessService 收到 `ping` 方法调用
- **那么** 返回包含时间戳的响应

### 需求:ForwardRoute 纯转发模式
ForwardRoute 必须实现纯透传转发，不包含认证逻辑。转发过程中必须注入网关通用头（`rpc-gateway-id`、`rpc-gateway-session`），禁止依赖任何业务层模块（AccountWorld、AccountToken 等）。

#### 场景:请求转发时注入网关头
- **当** ForwardRoute 转发一个 RPC 请求
- **那么** 转发的请求头中包含 `rpc-gateway-id`（网关服务实例 ID）和 `rpc-gateway-session`（当前会话标识）

#### 场景:不包含认证逻辑
- **当** ForwardRoute 处理任何请求
- **那么** 不进行 token 解析、不查询用户会话、不注入认证相关头（`rpc-account-id`、`rpc-authorization`）

### 需求:组件层仅 etcd
Com 类必须仅注册 EtcdComponent。禁止注册 Redis、Database、AliCloud 等组件。

#### 场景:Com 仅包含 etcd 组件
- **当** 系统调用 `Com.register()`
- **那么** 仅有 ComponentName.Etcd 和对应的 EtcdComponent 被注册到 Runtime

### 需求:配置模板
config.template.yml 必须包含 etcd 组件配置和两个服务（http-gateway、business）的监听器配置。禁止包含 Redis、MySQL、AliCloud 的配置项。

#### 场景:配置模板包含必要变量
- **当** 用户执行 `sora config -t ./run/config.template.yml -d ./run/config.yml`
- **那么** 交互式提示仅包含 projectScope、host、exposeHost、portRangeMin、portRangeMax、etcdHost、alias 变量

### 需求:sora.json 项目配置
sora.json 必须指向正确的 service、handler 目录路径和注册入口。worker 相关路径保留（为后续 `sora generate:command` 支持），但初始项目不含任何 Worker 文件。

#### 场景:sora generate:service 可用
- **当** 用户在基于此模板的项目中执行 `sora generate:service my-service`
- **那么** CLI 在 app/service/ 目录生成服务文件，并更新 ServiceName 枚举和 ServiceRegister
