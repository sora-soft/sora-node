# @sora-soft/framework API 参考

> 版本：2.0.0

分布式微服务框架，提供 RPC、服务生命周期管理、服务发现、领导者选举、结构化日志和分布式追踪。

## 模块

### 核心

Sora 应用的基础构建块。

| 类 | 说明 |
|---|---|
| [`Runtime`](./classes/Runtime.md) | 全局单例，管理框架生命周期——启动、关闭、服务/Worker/组件注册 |
| [`Node`](./classes/Node.md) | 代表整个进程的顶层服务。注册服务/Worker 工厂，提供远程管理 RPC |
| [`Service`](./classes/Service.md) | 暴露 RPC 的服务抽象基类。管理监听器和服务发现集成 |
| [`Worker`](./classes/Worker.md) | 后台 Worker 抽象基类。管理生命周期、任务执行、组件连接 |
| [`Component`](./classes/Component.md) | 可插拔基础设施（数据库、缓存等）的抽象基类。引用计数生命周期 |
| [`SingletonService`](./classes/SingletonService.md) | 带领导者选举的服务——集群范围内仅运行一个实例 |
| [`SingletonWorker`](./classes/SingletonWorker.md) | 带领导者选举的 Worker——集群范围内仅运行一个实例 |

### RPC

类型安全的远程调用系统，支持装饰器路由、中间件和自动 Provider 管理。

| 类 / 类型 | 说明 |
|---|---|
| [`Route`](./classes/Route.md) | RPC 处理器定义的基类。使用 `@Route.method` 和 `@Route.notify` 装饰器 |
| [`Provider<T>`](./classes/Provider.md) | 类型安全的 RPC 客户端代理。通过 `provider.rpc(id).method(payload)` 调用远程服务 |
| [`Broadcaster<T>`](./classes/Broadcaster.md) | 按方法名向多个已连接客户端广播通知 |
| [`Connector`](./classes/Connector.md) | 出站 RPC 连接（客户端侧）的抽象基类 |
| [`Listener`](./classes/Listener.md) | 入站 RPC 端点（服务端侧）的抽象基类 |
| [`PacketHandler`](./classes/PacketHandler.md) | 处理入站原始 RPC 数据包的静态工具 |
| [`ProviderManager`](./classes/ProviderManager.md) | RPC Provider 和连接器工厂的中央注册表 |
| [`ProviderStrategy`](./classes/ProviderStrategy.md) | 发送者选择策略的接口 |
| [`ProviderAllConnectStrategy`](./classes/ProviderAllConnectStrategy.md) | 默认策略——连接所有匹配的监听器，加权随机选择 |
| [`Codec<T>`](./classes/Codec.md) | 数据包序列化编解码器的抽象基类 |
| [`Request<T>`](./classes/Request.md) | RPC 请求包包装器 |
| [`Response<T>`](./classes/Response.md) | RPC 响应包包装器 |
| [`Notify<T>`](./classes/Notify.md) | RPC 通知包包装器（发送即忘记） |
| [`RawPacket<T>`](./classes/RawPacket.md) | 所有 RPC 数据包类型的抽象基类 |

### 传输层

具体的传输实现。

| 类 | 说明 |
|---|---|
| [`TCPConnector`](./classes/TCPConnector.md) | Connector 的 TCP 实现，支持帧封装、压缩和编解码协商 |
| [`TCPListener`](./classes/TCPListener.md) | Listener 的 TCP 实现，支持端口范围扫描 |

### 上下文

基于 `AsyncLocalStorage` 的异步上下文传播，为日志和追踪提供作用域链。

| 类 | 说明 |
|---|---|
| [`Context`](./classes/Context.md) | 作用域管理的静态 API——`run()`、`current()`、`find()`、`bind()`、`wrap()` |
| [`Scope<T>`](./classes/Scope.md) | 上下文作用域的抽象基类，包含存储、父链和堆栈跟踪 |
| [`RootScope`](./classes/RootScope.md) | 顶层作用域单例 |
| [`WorkerScope`](./classes/WorkerScope.md) | 绑定到 Worker/Service 实例的作用域 |
| [`ComponentScope`](./classes/ComponentScope.md) | 绑定到 Component 实例的作用域 |

### 服务发现

用于集群感知服务注册和查找的抽象服务发现接口。

| 类 | 说明 |
|---|---|
| [`Discovery`](./classes/Discovery.md) | 定义完整服务发现契约的抽象类。具体实现参见 `@sora-soft/etcd-discovery` 和 `@sora-soft/ram-discovery` |

### 选举

| 类 | 说明 |
|---|---|
| [`Election`](./classes/Election.md) | 抽象领导者选举接口。通过 `Discovery.createElection()` 创建 |

### 日志

支持可配置输出管道的结构化日志。

| 类 | 说明 |
|---|---|
| [`Logger`](./classes/Logger.md) | 主日志器，支持级别输出、堆栈捕获和错误集成 |
| [`LoggerOutput`](./classes/LoggerOutput.md) | 日志输出目标的抽象基类 |
| [`ConsoleOutput`](./classes/ConsoleOutput.md) | 带 chalk 彩色格式化的控制台输出 |
| [`FrameworkLogger`](./classes/FrameworkLogger.md) | 框架内部预配置的日志器实例 |
| [`RPCLogger`](./classes/RPCLogger.md) | RPC 子系统预配置的日志器实例 |

### 追踪

兼容 W3C Trace Context 的分布式追踪。

| 类 | 说明 |
|---|---|
| [`Trace`](./classes/Trace.md) | `AsyncLocalStorage<TraceContext>` 的静态包装器 |
| [`TraceContext`](./classes/TraceContext.md) | 完整的 W3C 追踪上下文，包含 trace ID、span ID、标志位和计时 |
| [`TraceState`](./classes/TraceState.md) | W3C tracestate 头的实现 |
| [`RpcClientTraceContext`](./classes/RpcClientTraceContext.md) | 出站 RPC 调用的追踪上下文 |
| [`RpcServerTraceContext`](./classes/RpcServerTraceContext.md) | 入站 RPC 请求的追踪上下文 |
| [`InnerTraceContext`](./classes/InnerTraceContext.md) | 内部（非 RPC）操作的追踪上下文 |

### 工具库

框架中使用的通用异步工具。

| 类 | 说明 |
|---|---|
| [`ExError`](./classes/ExError.md) | 扩展 Error，带 code、level、args。所有框架错误的基类 |
| [`LifeCycle<T>`](./classes/LifeCycle.md) | 泛型状态机，通过 RxJS `BehaviorSubject` 发射状态变更 |
| [`Executor`](./classes/Executor.md) | 并发异步任务执行器 |
| [`QueueExecutor`](./classes/QueueExecutor.md) | 串行（排队）异步任务执行器 |
| [`Retry<T>`](./classes/Retry.md) | 可配置重试，支持固定或指数退避 |
| [`Waiter<T>`](./classes/Waiter.md) | Promise 关联——用于 RPC 请求/响应匹配 |
| [`Ref`](./classes/Ref.md) | 简单引用计数器，带可观察的计数值 |
| [`LifeRef<T>`](./classes/LifeRef.md) | 带生命周期回调的引用计数器（首次 add 时启动，最后一次 minus 时停止） |
| [`Timer`](./classes/Timer.md) | 受管理的 setTimeout 包装器 |
| [`Time`](./classes/Time.md) | 基于 Promise 的超时工具 |
| [`SubscriptionManager`](./classes/SubscriptionManager.md) | RxJS 订阅生命周期管理 |
| [`LabelFilter`](./classes/LabelFilter.md) | 基于标签的服务发现匹配过滤器 |
| [`ErrorTracer`](./classes/ErrorTracer.md) | 用于增强异步错误堆栈跟踪的装饰器 |
| [`Utility`](./classes/Utility.md) | 静态工具方法——深拷贝、随机选择、时间格式化等 |

### 错误

以 `ExError` 为根的框架错误层次结构。

| 类 | 说明 |
|---|---|
| [`FrameworkError`](./classes/FrameworkError.md) | 框架内部错误，使用 `FrameworkErrorCode` |
| [`RPCError`](./classes/RPCError.md) | RPC 传输错误 |
| [`RPCResponseError`](./classes/RPCResponseError.md) | 从远端 RPC `IPayloadError` 重建的错误 |
| [`RouteError`](./classes/RouteError.md) | 路由级别错误（方法未找到等） |
| [`ConnectorError`](./classes/ConnectorError.md) | 连接器特定错误 |
| [`TCPError`](./classes/TCPError.md) | TCP 传输错误 |
| [`TraceError`](./classes/TraceError.md) | 追踪错误 |
| [`RetryError`](./classes/RetryError.md) | 重试耗尽错误 |
| [`TimeoutError`](./classes/TimeoutError.md) | 超时错误 |

## 许可证

WTFPL
