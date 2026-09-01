# @sora-soft/etcd-discovery

## 2.2.5

### Patch Changes

- 7ea31c3: 修复 ETCDDiscovery 启停未配对调用 EtcdComponent 的 start/stop，导致组件引用计数只增不减、组件无法真正断开的问题

## 2.2.4

### Patch Changes

- bf53f5a: 修复 unregisterNode 误用 endpointPrefix 导致节点无法注销、且可能误删 endpoint 的问题
- 92bd677: 修复 ETCDDiscovery 关闭时误释放 EtcdComponent 共享 lease 的问题，EtcdComponent 新增 createLease 接口，ETCDDiscovery 改为持有独享的私有 lease
- Updated dependencies [92bd677]
  - @sora-soft/etcd-component@2.2.4

## 2.2.3

### Patch Changes

- Updated dependencies
  - @sora-soft/framework@2.2.2
  - @sora-soft/etcd-component@2.2.3

## 2.2.2

### Patch Changes

- Updated dependencies
  - @sora-soft/framework@2.2.1
  - @sora-soft/etcd-component@2.2.2

## 2.2.1

### Patch Changes

- Updated dependencies [656d8b1]
  - @sora-soft/etcd-component@2.2.1

## 2.2.0

### Minor Changes

- 3eb0584: 放弃 vite 编译链，使用 ts-patch + jest 测试平台
- 7bed083: 重新使用 ts-patch 作为编译器

### Patch Changes

- Updated dependencies [ae9abda]
- Updated dependencies [3eb0584]
- Updated dependencies [7bed083]
  - @sora-soft/framework@2.2.0
  - @sora-soft/typia-decorator@2.2.0
  - @sora-soft/etcd-component@2.2.0

## 2.1.0

### Minor Changes

- a442c83: 修复 vite 编译报错的问题

### Patch Changes

- Updated dependencies [a442c83]
  - @sora-soft/typia-decorator@2.1.0
  - @sora-soft/etcd-component@2.1.0
  - @sora-soft/framework@2.1.0

## 2.0.4

### Patch Changes

- Updated dependencies
  - @sora-soft/framework@2.0.4
  - @sora-soft/etcd-component@2.0.4

## 2.0.3

### Patch Changes

- Updated dependencies [e658274]
- Updated dependencies [5adba31]
  - @sora-soft/framework@2.0.3
  - @sora-soft/etcd-component@2.0.3

## 2.0.2

### Patch Changes

- 5ade32f: 添加文档
- Updated dependencies [827dcd3]
- Updated dependencies [926d960]
- Updated dependencies [24c4d48]
  - @sora-soft/framework@2.0.2
  - @sora-soft/etcd-component@2.0.2
  - @sora-soft/typia-decorator@2.0.2
