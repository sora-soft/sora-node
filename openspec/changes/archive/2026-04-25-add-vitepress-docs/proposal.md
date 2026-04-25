## 为什么

sora 框架是一套完整的微服务框架体系，涵盖 RPC 通信、服务发现、组件管理、分布式追踪等核心能力，但目前缺少面向用户的系统性文档。新用户无法快速理解框架全貌，现有用户查阅 API 和用法依赖源码，学习和使用成本高。需要一份基于 VitePress 的中文文档站，降低上手门槛并提供完整的参考手册。

## 变更内容

- 在 monorepo 根目录新增 `docs/` 目录，搭建 VitePress 1.6.4 文档站
- 编写面向新用户和框架用户的中文指南文档（快速开始、核心概念、服务生命周期）
- 编写 RPC 通信、服务发现、组件系统、高级特性、CLI 等专题文档（约 18 篇）
- 集成 typedoc + typedoc-plugin-markdown，从 `@sora-soft/framework` 源码自动生成 API Reference
- 配置 GitHub Actions 自动构建并部署到 GitHub Pages

## 功能 (Capabilities)

### 新增功能
- `vitepress-docs-site`: VitePress 文档站的搭建、配置、首页和主题
- `guide-docs`: 快速开始、核心概念、服务生命周期等入门指南
- `rpc-docs`: RPC 通信体系的专题文档（概览、路由、调用方、传输层）
- `discovery-docs`: 服务发现机制与选型文档
- `component-docs`: 组件系统及 Redis/Database/etcd 组件的使用文档
- `advanced-docs`: 单例选举、参数验证、上下文作用域、可观测性等高级文档
- `cli-docs`: sora CLI 命令手册和 sora.json 配置说明
- `api-reference`: 基于 typedoc 自动生成的 framework API 参考文档
- `docs-deployment`: GitHub Actions CI 构建与 GitHub Pages 部署配置

### 修改功能

（无现有功能需求变更）
