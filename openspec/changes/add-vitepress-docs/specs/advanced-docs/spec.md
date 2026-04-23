## 新增需求

### 需求:单例服务与选举文档
文档站必须提供 `/advanced/singleton` 页面，介绍 SingletonService 和 SingletonWorker 的使用场景、选举机制（campaign/resign/observer）和 etcd/RAM 两种选举实现的差异。

#### 场景:创建单例服务
- **当** 用户阅读单例服务文档
- **那么** 用户能够理解 SingletonService 在集群中只运行一个实例、通过选举竞选领导权、在领导权丢失时自动停止

### 需求:参数验证文档
文档站必须提供 `/advanced/validation` 页面，介绍 `@guard` 装饰器与 typia AOT 的编译时类型校验机制，包括配置方式（ts-patch）和使用示例。

#### 场景:添加参数校验
- **当** 用户阅读参数验证文档
- **那么** 用户能够在方法参数上使用 `@guard` 装饰器、配置 ts-patch 编译转换、理解运行时自动生成的 typia.assert 校验

### 需求:上下文与作用域文档
文档站必须提供 `/advanced/context-scope` 页面，介绍 Context 系统（AsyncLocalStorage）、Scope 层级（RootScope → WorkerScope → ComponentScope），以及 `Context.scopeClass`、`Context.find` 等核心 API。

#### 场景:理解作用域链
- **当** 用户阅读上下文与作用域文档
- **那么** 用户能够理解作用域链从 RootScope 到 WorkerScope 到 ComponentScope 的层级关系、`Context.find` 向上查找的机制、scopeClass 自动绑定上下文的用法

### 需求:可观测性文档
文档站必须提供 `/advanced/observability` 页面，介绍 Logger 系统（CategoryLogger、输出管道、日志级别）和 W3C 分布式追踪（TraceContext、traceparent 头、RPC 自动传播）。

#### 场景:接入日志和追踪
- **当** 用户阅读可观测性文档
- **那么** 用户能够使用 CategoryLogger 记录分类日志、理解 RPC 调用中 traceparent 头的自动传播、了解如何在处理器中获取当前 TraceContext
