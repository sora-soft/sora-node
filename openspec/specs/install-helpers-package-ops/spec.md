## ADDED Requirements

### Requirement:mergePackageScripts helper
InstallHelpers MUST 提供 `mergePackageScripts(scripts)` 方法，将 npm scripts 合并到项目 package.json 的 `scripts` 字段。

#### Scenario:Adding new scripts
- **When** install script 调用 `helpers.mergePackageScripts({'migrate:sync': '...', 'migrate': '...'})` 且项目 package.json 中没有这些 key
- **Then** 系统 MUST 将所有 scripts 写入 package.json 的 `scripts` 字段

#### Scenario:Script key already exists
- **When** 项目 package.json 中已存在 `migrate` key，且值与传入值不同
- **Then** 系统 MUST 跳过该 key，输出 warn 消息 "Script 'migrate' already exists in package.json with different value, keeping existing"

#### Scenario:Script key exists with same value
- **When** 项目 package.json 中已存在 `migrate` key 且值完全相同
- **Then** 系统 MUST 静默跳过，不输出 warn

### Requirement:mergePackageDependencies helper
InstallHelpers MUST 提供 `mergePackageDependencies(deps)` 方法，将运行时依赖合并到项目 package.json 的 `dependencies` 字段。

#### Scenario:Adding new dependencies
- **When** install script 调用 `helpers.mergePackageDependencies({dependencies: {'camelcase': '^6.2.0', 'mkdirp': '^2.1.5'}})` 且这些包不在项目 package.json 中
- **Then** 系统 MUST 将这些依赖写入 package.json 的 `dependencies` 字段

#### Scenario:Dependency already in dependencies
- **When** 项目 package.json 的 `dependencies` 中已包含 `camelcase`
- **Then** 系统 MUST 跳过该依赖，不覆盖

#### Scenario:Dependency already in devDependencies
- **When** 项目 package.json 的 `devDependencies` 中已包含 `camelcase`
- **Then** 系统 MUST 跳过该依赖，不移动到 `dependencies`

#### Scenario:Transaction guarantee
- **When** mergePackageScripts 或 mergePackageDependencies 执行后 action() 抛出异常
- **Then** package.json 的变更 MUST 随 FileTree rollback 一起丢弃
