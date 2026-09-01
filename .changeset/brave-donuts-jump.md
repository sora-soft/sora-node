---
"@sora-soft/etcd-discovery": patch
---

修复 unregisterNode 误用 endpointPrefix 导致节点无法注销、且可能误删 endpoint 的问题
