## 新增需求

### 需求:组件系统概览文档
文档站必须提供 `/components/overview` 页面，介绍 Component 抽象的生命周期（setOptions → connect → disconnect）、注册方式（`Runtime.registerComponent`）、连接方式（`worker.connectComponent`）和访问方式（`Runtime.getComponent`）。

#### 场景:理解组件接入模式
- **当** 用户阅读组件系统概览页面
- **那么** 用户能够理解组件的注册-连接-使用三步流程，以及引用计数机制确保组件在多个 Worker 间共享安全

### 需求:Redis 组件文档
文档站必须提供 `/components/redis` 页面，介绍 RedisComponent 的安装、配置（URL、数据库、认证）、基本使用（client 访问、setJSON/getJSON）和分布式锁（createLock）。

#### 场景:接入 Redis
- **当** 用户阅读 Redis 组件文档
- **那么** 用户能够安装 `@sora-soft/redis-component`、配置连接参数、在 Worker 中连接并使用 Redis 客户端、创建分布式锁

### 需求:Database 组件文档
文档站必须提供 `/components/database` 页面，介绍 DatabaseComponent 的安装、配置、Entity 定义、WhereBuilder 的使用，以及 TypeORM 集成方式。

#### 场景:接入数据库
- **当** 用户阅读 Database 组件文档
- **那么** 用户能够安装 `@sora-soft/database-component`、定义 TypeORM Entity、配置连接参数、使用 WhereBuilder 构建类型安全的查询

### 需求:etcd 组件文档
文档站必须提供 `/components/etcd` 页面，介绍 EtcdComponent 的安装、配置、基本使用（client 访问、持久化键值），以及分布式锁（lock）和选举（Election）功能。

#### 场景:接入 etcd
- **当** 用户阅读 etcd 组件文档
- **那么** 用户能够安装 `@sora-soft/etcd-component`、配置连接参数、使用持久化键值存储、创建分布式锁和选举
