## 上下文

sora-monorepo 是一个基于 TypeScript 的微服务框架，包含核心框架 (`@sora-soft/framework`)、多个组件包、CLI 工具和项目模板。当前缺少面向用户的系统文档，新用户和框架用户只能通过阅读源码了解框架。

本变更新增 `docs/` 目录到 monorepo 根目录，使用 VitePress 1.6.4 构建中文文档站，通过 GitHub Actions 部署到 GitHub Pages。文档内容以手写指南为主，API Reference 通过 typedoc 自动生成。

## 目标 / 非目标

**目标：**
- 提供新用户可跟随的快速开始教程（基于 `sora new` 脚手架）
- 系统阐述框架核心概念（Runtime/Node/Service/Worker/Component 层级）
- 覆盖 RPC 通信、服务发现、组件、高级特性、CLI 等专题
- 自动生成 `@sora-soft/framework` 的 API Reference
- 通过 GitHub Actions 自动部署到 GitHub Pages

**非目标：**
- 不提供英文或国际化版本（仅中文）
- 不包含项目模板的详细文档（仅提供链接指向各模板 README）
- 不介绍 ConfigLoader（在项目模板中介绍）
- 不覆盖除 framework 外的其他包的 API Reference
- 不实现搜索功能（后续可加）
- 不建立文档贡献流程

## 决策

### 1. 文档框架：VitePress 1.6.4

**选择：** VitePress 1.6.4  
**替代方案：** Docusaurus、Docsify、VuePress  
**理由：** VitePress 是 Vue 生态中主流的静态文档生成器，构建速度快、配置简洁、Markdown 支持完善、内置响应式布局。1.6.4 是当前稳定版本。

### 2. API Reference 生成方式：typedoc + typedoc-plugin-markdown

**选择：** typedoc + typedoc-plugin-markdown 生成 Markdown，嵌入 VitePress  
**替代方案：** 手写 API 文档、使用 VitePress 插件直接渲染 JSON  
**理由：** framework 包已依赖 typedoc，可复用现有基础设施。生成的 Markdown 放入 `docs/api/` 目录，由 VitePress 统一构建和渲染。

### 3. 文档目录结构

```
docs/
├── .vitepress/config.ts       ← VitePress 配置（侧边栏、导航栏、主题）
├── package.json               ← vitepress 依赖 + 构建脚本
├── index.md                   ← 首页 hero
├── guide/                     ← 指南（3 篇）
├── rpc/                       ← RPC 通信（4 篇）
├── discovery/                 ← 服务发现（1 篇）
├── components/                ← 组件（4 篇）
├── advanced/                  ← 高级（4 篇）
├── cli/                       ← CLI（2 篇）
├── api/                       ← typedoc 生成（.gitignore）
└── templates.md               ← 项目模板链接
```

**侧边栏分组：** 指南 / RPC 通信 / 服务发现 / 组件 / 高级 / CLI / API Reference

### 4. typedoc 输出处理

- typedoc 输出到 `docs/api/` 目录
- `docs/api/` 加入 `.gitignore`，不提交到仓库
- VitePress 侧边栏为 API Reference 配置自动扫描 `docs/api/` 目录
- 构建流程：先运行 typedoc 生成，再运行 vitepress build

### 5. 部署方案：GitHub Actions → GitHub Pages

**选择：** GitHub Actions 构建，部署到 `gh-pages` 分支  
**替代方案：** 直接从 `docs/` 目录部署  
**理由：** `gh-pages` 分支保持主分支干净，构建产物不污染仓库。需要在 `docs/api/` 先生成 typedoc 输出再构建 VitePress，CI 流程更灵活。

**CI 流程：**
1. 触发：push 到 main 分支，或手动触发
2. 安装依赖
3. 构建 framework 包（typedoc 需要编译后的代码）
4. 运行 typedoc 生成 API Reference 到 `docs/api/`
5. 运行 `vitepress build`
6. 部署 `docs/.vitepress/dist/` 到 `gh-pages` 分支

### 6. 文档语言

全部使用中文编写。代码示例中的类名、方法名、变量名保持英文。

### 7. docs/ 的 package.json 独立管理

`docs/` 目录拥有独立的 `package.json`，不通过 pnpm workspace 与其他包关联。文档构建和框架构建解耦。

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| typedoc 生成的 Markdown 格式可能与 VitePress 渲染不完全兼容 | 构建后人工检查，必要时配置 typedoc 输出选项调整格式 |
| API Reference 可能非常长，影响侧边栏可用性 | 使用 VitePress 的 sidebar 折叠配置，API Reference 默认折叠 |
| 文档与代码同步维护成本 | typedoc 自动生成部分保持同步；手写部分通过 CI 检查链接有效性（后续可加） |
| 框架 API 变更时文档可能滞后 | 在 CI 中加入 typedoc 构建步骤，确保每次 CI 都生成最新 API Reference |
