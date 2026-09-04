---
"@sora-soft/http-support": minor
"@sora-soft/account-cluster-template": patch
---

WebSocketListener 构造函数新增 koa 参数用于在同端口处理普通 http 请求（如健康检查），并暴露 httpServer getter；修复 shutdown 时未显式关闭 httpServer 导致端口泄漏的问题。模板中 ws listener 与 http listener 共享同一个 koa 实例
