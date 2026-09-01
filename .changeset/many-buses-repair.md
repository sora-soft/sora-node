---
"@sora-soft/etcd-component": patch
"@sora-soft/etcd-discovery": patch
---

修复 ETCDDiscovery 关闭时误释放 EtcdComponent 共享 lease 的问题，EtcdComponent 新增 createLease 接口，ETCDDiscovery 改为持有独享的私有 lease
