## 新增需求

### 需求:GitHub Actions 构建工作流
系统必须在 `.github/workflows/` 中创建文档构建工作流，在 push 到 main 分支时自动：安装依赖 → 构建 framework → 运行 typedoc → 运行 vitepress build → 部署到 gh-pages 分支。

#### 场景:推送触发自动部署
- **当** 代码推送到 main 分支
- **那么** GitHub Actions 工作流自动触发，完成文档构建并将产物部署到 gh-pages 分支，GitHub Pages 反映最新文档

### 霰求:typedoc 输出排除版本控制
`docs/api/` 目录必须添加到 `.gitignore`，typedoc 生成的文件不提交到仓库。

#### 场景:git 状态检查
- **当** 运行 typedoc 生成 API 文档后执行 `git status`
- **那么** `docs/api/` 目录下的文件不出现在未跟踪文件列表中
