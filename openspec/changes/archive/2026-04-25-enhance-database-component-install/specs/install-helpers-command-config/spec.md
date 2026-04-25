## ADDED Requirements

### Requirement:appendToCommandConfigTemplate helper
InstallHelpers MUST 提供 `appendToCommandConfigTemplate(key, data)` 方法，向 command config 模板文件追加配置段。模板文件路径从 sora.json 的 `configTemplates.command` 读取。

#### Scenario:Command config template exists
- **When** `configTemplates.command` 指定的文件存在，install script 调用 `helpers.appendToCommandConfigTemplate('workers', {'database-migrate-command': {components: ['business-database']}})`
- **Then** 系统 MUST 向该 YAML 文件的 `workers` 段追加配置

#### Scenario:Command config template does not exist
- **When** `configTemplates.command` 指定的文件不存在
- **Then** 系统 MUST 创建一个最小化的 command config 模板文件，包含 `workers.database-migrate-command` 配置段

#### Scenario:configTemplates.command not configured
- **When** sora.json 中没有 `configTemplates` 或 `configTemplates.command` 字段
- **Then** 系统 MUST 使用默认路径 `run/config-command.template.yml`，并按上述两种场景处理

### Requirement:Minimal command config template creation
当需要创建新的 command config 模板时，模板 MUST 包含 `workers` 段和必要的 `#define` 变量定义。

#### Scenario:Creating new command config template
- **When** 系统创建新的 `config-command.template.yml`
- **Then** 文件 MUST 包含基本的 YAML 结构和传入的 workers 配置
