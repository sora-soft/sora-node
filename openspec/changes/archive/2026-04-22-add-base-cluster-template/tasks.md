## 1. 项目骨架

- [x] 1.1 创建 `apps/base-cluster-template/` 目录结构，包含 `bin/`、`run/`、`src/app/`、`src/lib/` 子目录
- [x] 1.2 创建 `package.json`，包名 `@sora-soft/base-cluster-template`，bin 名 `base-server`，依赖 framework、http-support、etcd-component、etcd-discovery、typia-decorator 及通用工具库（不含 redis-component、database-component）
- [x] 1.3 创建 `tsconfig.json`，继承 `../../tsconfig.base.json`，outDir `./dist`，rootDir `./src`
- [x] 1.4 创建 `sora.json`，配置 serviceDir、handlerDir、workerDir、serviceNameEnum、serviceRegister、componentNameEnum、comClass 等路径
- [x] 1.5 创建 `bin/cli.js`，commander CLI 入口，支持 `run [container|server]` 和 `command` 子命令
- [x] 1.6 创建 `.gitignore`、`.npmignore`、`eslint.config.mjs`（继承根配置）、`LICENSE`

## 2. 基础库层 (lib)

- [x] 2.1 创建 `src/lib/Com.ts`，仅注册 EtcdComponent，ComponentName 枚举仅有 Etcd
- [x] 2.2 创建 `src/lib/Provider.ts`，注册 TCPConnector + WebSocketConnector，定义 `business` Provider 指向 ServiceName.Business
- [x] 2.3 创建 `src/lib/Const.ts`，定义 ForwardRPCHeader（RPC_GATEWAY_SESSION、RPC_GATEWAY_ID）
- [x] 2.4 创建 `src/lib/Enum.ts`，定义 ConfigFileType 枚举
- [x] 2.5 创建 `src/lib/ConfigLoader.ts`，从 account 模板复制（YAML/JSON/HTTP 配置加载 + Proxy 私钥隐藏）
- [x] 2.6 创建 `src/lib/FileLogger.ts`，从 account 模板复制（基于 moment 的按日滚动文件日志）
- [x] 2.7 创建 `src/lib/Utility.ts`，从 account 模板复制（Hash、Random、Util 工具类）
- [x] 2.8 创建 `src/lib/route/ForwardRoute.ts`，简化版：纯 RPC 转发，注入网关通用头（rpc-gateway-id、rpc-gateway-session），去掉 AccountWorld/AuthRPCHeader 认证逻辑，保留 OPCode.Request 和 OPCode.Notify 分支及错误处理

## 3. 应用层核心

- [x] 3.1 创建 `src/app/AppError.ts`，ExError 子类，AppError 类型
- [x] 3.2 创建 `src/app/AppLogger.ts`，Logger 子类，identify 为 'app'
- [x] 3.3 创建 `src/app/ErrorCode.ts`，AppErrorCode 枚举（ErrUnknown、ErrLoadConfig、ErrConfigNotFound、ErrCommandNotFound、ErrServiceNotCreated、ErrWorkerNotCreated、ErrComponentNotFound、ErrServerInternal）和空 UserErrorCode 枚举
- [x] 3.4 创建 `src/app/UserError.ts`，ExError 子类，ErrorLevel.Expected
- [x] 3.5 创建 `src/app/Application.ts`，ETCDDiscovery，三种启动模式（startContainer、startServer、startCommand），组件加载，ServiceRegister/WorkerRegister 初始化

## 4. 服务层

- [x] 4.1 创建 `src/app/service/common/ServiceName.ts`，枚举值 HttpGateway = 'http-gateway'、Business = 'business'
- [x] 4.2 创建 `src/app/service/common/ServiceRegister.ts`，注册 HttpGatewayService 和 BusinessService
- [x] 4.3 创建 `src/app/service/HttpGatewayService.ts`，照抄 account 模式：连接 etcd 组件、注册 business Provider、创建 ForwardRoute、安装 HTTPListener + WebSocketListener，去掉 Traefik 和 AccountWorld 依赖
- [x] 4.4 创建 `src/app/service/BusinessService.ts`，TCP 服务：连接 etcd 组件、创建 BusinessHandler、安装 TCPListener（JsonBufferCodec）
- [x] 4.5 创建 `src/app/handler/BusinessHandler.ts`，示例 handler：一个 `ping` 方法（@Route.method + @guard），返回 `{ timestamp: Date.now() }`

## 5. Worker 占位与入口

- [x] 5.1 创建 `src/app/worker/common/WorkerName.ts`，空枚举
- [x] 5.2 创建 `src/app/worker/common/WorkerRegister.ts`，空 init()
- [x] 5.3 创建 `src/index.ts`，导出 container/server/command 三个启动函数

## 6. 配置与容器化

- [x] 6.1 创建 `run/config.template.yml`，#define 变量仅 projectScope、host、exposeHost、portRangeMin、portRangeMax、etcdHost、alias；services 包含 http-gateway（httpListener + websocketListener）和 business（tcpListener）；components 仅 etcd；workers 为空对象
- [x] 6.2 创建 `Dockerfile`，多阶段构建（node:18-alpine），全局安装 base-server，标准卷挂载

## 7. CLI 更新

- [x] 7.1 修改 `packages/sora-cli/src/commands/new.ts`，在 templates 数组中 http-server 和 account 之间插入 `{pkg: '@sora-soft/base-cluster-template', desc: '带网关与业务服务的通用集群模板'}`

## 8. 验证

- [x] 8.1 在 base-cluster-template 目录执行 `pnpm install` 确认依赖解析成功
- [x] 8.2 执行 `npm run build` 确认 TypeScript 编译通过
- [x] 8.3 执行 `npm run lint` 确认 ESLint 通过
