## 新增需求

### 需求:CLI 命令手册文档
文档站必须提供 `/cli/commands` 页面，列出 sora CLI 的所有命令（new、generate:service、generate:worker、generate:command、add:component、export:api、export:doc、config），包含用法、参数和示例。

#### 场景:查阅 CLI 命令
- **当** 用户阅读 CLI 命令手册
- **那么** 用户能够找到任意 sora 命令的用法说明、参数列表和代码示例

### 需求:sora.json 配置文档
文档站必须提供 `/cli/sora-json` 页面，说明 `sora.json` 配置文件的用途和每个字段的含义（root、dist、serviceDir、serviceNameEnum、serviceRegister、handlerDir、workerDir、apiDeclarationOutput、docOutput、configTemplates 等）。

#### 场景:理解 sora.json 字段
- **当** 用户阅读 sora.json 配置页面
- **那么** 用户能够理解每个字段的用途（路径、枚举引用格式 `path#export`）、哪些命令依赖哪些字段
