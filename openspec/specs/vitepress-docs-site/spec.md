## 新增需求

### 需求:VitePress 文档站初始化
系统必须在 monorepo 根目录创建 `docs/` 目录，包含独立的 `package.json`（声明 vitepress@1.6.4 依赖）和 `.vitepress/config.ts` 配置文件。

#### 场景:安装和启动
- **当** 用户在 `docs/` 目录运行 `pnpm install && pnpm docs:dev`
- **那么** VitePress 开发服务器启动，可在浏览器访问文档站

### 需求:首页 Hero
文档站首页（`docs/index.md`）必须展示框架名称、描述、标语和"快速开始"行动按钮，使用 VitePress 的 frontmatter hero 布局。

#### 场景:访问首页
- **当** 用户访问文档站根路径
- **那么** 页面展示 hero 区域，包含框架名称 "sora"、描述文案和"快速开始"按钮链接到 `/guide/getting-started`

### 需求:导航栏配置
`.vitepress/config.ts` 必须配置顶部导航栏，包含"指南"、"RPC 通信"、"组件"、"API"等分组链接。

#### 场景:导航栏展示
- **当** 用户访问文档站任意页面
- **那么** 顶部导航栏显示分组链接，点击可跳转到对应章节首页

### 需求:侧边栏结构
`.vitepress/config.ts` 必须配置侧边栏，分为以下分组：指南、RPC 通信、服务发现、组件、高级、CLI、API Reference。每个分组包含其下属页面。

#### 场景:侧边栏导航
- **当** 用户访问任意文档页面
- **那么** 左侧侧边栏显示当前分组及其页面列表，当前页面高亮

### 需求:项目模板链接页
文档站必须包含一个 `templates.md` 页面，仅提供三个项目模板（http-server-template、base-cluster-template、account-cluster-template）的链接，指向各模板的 README。

#### 场景:访问模板页
- **当** 用户访问 `/templates` 页面
- **那么** 页面展示三个模板名称及其 GitHub 仓库 README 链接
