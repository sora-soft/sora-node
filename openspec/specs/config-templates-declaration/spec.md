## ADDED Requirements

### Requirement:configTemplates field in sora.json
sora.json MUST 支持 optional 的 `configTemplates` 字段，类型为 `{ server?: string, command?: string }`，声明 server 和 command config 模板文件的路径（相对于项目根目录）。

#### Scenario:Both templates configured
- **When** sora.json 包含 `configTemplates: {server: "run/config.template.yml", command: "run/config-command.template.yml"}`
- **Then** CLI 命令 MUST 从这些路径读取/写入配置模板

#### Scenario:Only server template configured
- **When** sora.json 包含 `configTemplates: {server: "run/config.template.yml"}` 且无 `command` 字段
- **Then** CLI 命令 MUST 对 command 模板回退到默认路径 `run/config-command.template.yml`

#### Scenario:configTemplates not present
- **When** sora.json 不包含 `configTemplates` 字段
- **Then** CLI 命令 MUST 回退到现有的硬编码默认路径，行为与当前完全一致

### Requirement:generate commands use configTemplates
`generate:command`、`generate:worker`、`generate:service` 命令的 config template prompt 默认值 MUST 从 sora.json 的 `configTemplates` 读取。

#### Scenario:generate:command default from configTemplates
- **When** 用户运行 `sora generate:command` 且 sora.json 有 `configTemplates.command: "run/my-command.yml"`
- **Then** config template prompt 的默认值 MUST 为 `run/my-command.yml`

#### Scenario:generate:worker default from configTemplates
- **When** 用户运行 `sora generate:worker` 且 sora.json 有 `configTemplates.server: "run/my-config.yml"`
- **Then** config template prompt 的默认值 MUST 为 `run/my-config.yml`

### Requirement:sora config --all mode
`sora config` 命令 MUST 支持 `--all` flag，遍历 sora.json 的 `configTemplates` 中的所有模板，依次生成配置文件。输出路径 MUST 将 `.template.` 从文件名中移除作为默认输出路径。

#### Scenario:sora config --all
- **When** 用户运行 `sora config --all`，sora.json 配置 `{server: "run/config.template.yml", command: "run/config-command.template.yml"}`
- **Then** 系统 MUST 依次执行：
  1. `sora config -t run/config.template.yml -d run/config.yml`
  2. `sora config -t run/config-command.template.yml -d run/config-command.yml`

#### Scenario:sora config --all with missing template file
- **When** `configTemplates.command` 指定的文件不存在
- **Then** 系统 MUST 跳过该模板并输出 warn 消息，继续处理其他模板

### Requirement:InstallHelpers uses configTemplates
`InstallHelpers.findConfigTemplate()` MUST 优先从 sora.json 的 `configTemplates.server` 读取路径，仅在未配置时回退到硬编码默认值。

#### Scenario:findConfigTemplate with configured path
- **When** sora.json 有 `configTemplates.server: "run/my-config.yml"` 且该文件存在
- **Then** `findConfigTemplate()` MUST 返回该文件的绝对路径

#### Scenario:findConfigTemplate fallback
- **When** sora.json 没有 `configTemplates` 字段
- **Then** `findConfigTemplate()` MUST 回退到搜索 `run/config.template.yml` 和 `run/config.template.yaml`
