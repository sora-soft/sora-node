---
"@sora-soft/etcd-discovery": patch
---

修复 ETCDDiscovery 启停未配对调用 EtcdComponent 的 start/stop，导致组件引用计数只增不减、组件无法真正断开的问题
