## 新增需求

### 需求:API Reference 自动生成
系统必须通过 typedoc + typedoc-plugin-markdown 从 `@sora-soft/framework` 源码自动生成 Markdown 格式的 API 参考文档，输出到 `docs/api/` 目录。

#### 场景:生成 API 文档
- **当** 在 `docs/` 目录运行 `pnpm docs:api` 命令
- **那么** typedoc 读取 framework 源码，生成 Markdown 文件到 `docs/api/` 目录，包含所有导出类、接口、枚举和类型的文档

### 需求:API Reference 集成到侧边栏
VitePress 侧边栏必须包含 API Reference 分组，自动扫描 `docs/api/` 目录下的文件生成侧边栏条目。

#### 场景:浏览 API 文档
- **当** 用户在文档站侧边栏点击 API Reference 分组
- **那么** 展示所有 framework 导出类型（类、接口、枚举）的列表，点击可查看详细文档
