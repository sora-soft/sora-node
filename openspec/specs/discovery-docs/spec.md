## 新增需求

### 需求:服务发现概览文档
文档站必须提供 `/discovery/overview` 页面，介绍服务发现机制的作用、RamDiscovery 和 ETCDDiscovery 两种实现的对比（适用场景、依赖、选举支持），以及如何配置和接入。

#### 场景:选择服务发现实现
- **当** 用户阅读服务发现概览页面
- **那么** 用户能够根据对比表判断：单进程开发用 RamDiscovery，生产集群用 ETCDDiscovery（需要 etcd 服务），并知道各自的配置方式
