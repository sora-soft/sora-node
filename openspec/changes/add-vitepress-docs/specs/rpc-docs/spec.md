## 新增需求

### 需求:RPC 概览文档
文档站必须提供 `/rpc/overview` 页面，介绍 RPC 系统的三种通信模式：Request/Response（请求响应）、Notify（单向通知）、Broadcast（广播），以及 Listener/Connector/Provider/Route 四个核心角色。

#### 场景:理解 RPC 通信模型
- **当** 用户阅读 RPC 概览页面
- **那么** 用户能够理解三种模式的区别和适用场景，以及数据从 Provider 经过 Connector 到达 Listener 再到 Route 的完整流向

### 需求:路由文档
文档站必须提供 `/rpc/route` 页面，介绍如何使用 `@Route.method` 和 `@Route.notify` 装饰器注册 RPC 处理器，包括中间件注册（`Route.registerMiddleware`）和参数注入（`Route.registerProvider`）。

#### 场景:编写 Route 处理器
- **当** 用户阅读路由文档
- **那么** 用户能够创建一个继承 Route 的类、使用 `@Route.method` 注册方法处理器、使用 `@Route.notify` 注册通知处理器、为特定方法添加中间件

### 需求:Provider 调用方文档
文档站必须提供 `/rpc/provider` 页面，介绍 Provider 的创建、配置（标签过滤、策略选择），以及 `provider.rpc().method()`、`provider.notify().method()`、`provider.broadcast().method()` 三种调用方式。

#### 场景:使用 Provider 调用远程服务
- **当** 用户阅读 Provider 文档
- **那么** 用户能够创建 Provider 实例、通过标签过滤目标服务、使用 `rpc()` 发起请求并获取响应、使用 `notify()` 发送单向通知、使用 `broadcast()` 广播

### 需求:传输层文档
文档站必须提供 `/rpc/transport` 页面，介绍 TCP、HTTP、WebSocket 三种传输协议的使用方式、配置选项和选型建议。

#### 场景:选择传输协议
- **当** 用户阅读传输层文档
- **那么** 用户能够理解 TCP 适用于内部 RPC 高性能通信、HTTP 适用于对外 API 网关、WebSocket 适用于实时双向通信
