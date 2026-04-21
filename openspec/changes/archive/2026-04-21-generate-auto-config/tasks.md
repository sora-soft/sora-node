## 1. 基础设施

- [x] 1.1 在 `packages/sora-cli/package.json` 中添加 `js-yaml` 依赖
- [x] 1.2 创建 `packages/sora-cli/src/lib/ConfigTemplateInserter.ts`，实现 `extractDefines(content: string): { defines: string[], yamlContent: string }` 方法，将 `#define(...)` 行从文件内容中分离
- [x] 1.3 在 `ConfigTemplateInserter.ts` 中实现 `checkDuplicate(yamlContent: string, section: 'services' | 'workers', key: string): boolean` 方法，使用 js-yaml 解析 YAML 内容检测指定 key 是否已存在

## 2. 字符串插入引擎

- [x] 2.1 在 `ConfigTemplateInserter.ts` 中实现 `buildServiceConfigFragment(dashName: string, listeners: string[]): string` 方法，根据 listener 类型列表生成对应的 YAML 配置文本片段（tcp/http/websocket 映射到各自的 listener config 块，无 listener 时生成 `{}`）
- [x] 2.2 在 `ConfigTemplateInserter.ts` 中实现 `buildWorkerConfigFragment(dashName: string): string` 方法，生成 `dashName: {}` 格式的配置文本
- [x] 2.3 在 `ConfigTemplateInserter.ts` 中实现 `insertSectionEntry(content: string, section: string, fragment: string): string` 方法，处理三种形态：`section: {}` 替换整行、`section:` 在下一行插入、段不存在则在文件末尾追加。插入文本缩进 2 空格

## 3. 集成到 generate 命令

- [x] 3.1 修改 `generate:service` 命令：添加 `--config-template` flag，未传入时 inquirer 交互式询问（默认 `run/config.template.yml`），TS 文件生成成功后调用 ConfigTemplateInserter 插入 service config
- [x] 3.2 修改 `generate:worker` 命令：添加 `--config-template` flag，未传入时 inquirer 交互式询问（默认 `run/config.template.yml`），TS 文件生成成功后调用 ConfigTemplateInserter 插入 worker config
- [x] 3.3 修改 `generate:command` 命令：添加 `--config-template` flag，未传入时 inquirer 交互式询问（默认 `run/config-command.template.yml`），TS 文件生成成功后调用 ConfigTemplateInserter 插入 command worker config

## 4. 验证

- [x] 4.1 手动测试：在 example 项目中运行 `generate:service` 验证 config.template.yml 自动更新
- [x] 4.2 手动测试：在 example 项目中运行 `generate:worker` 验证 config.template.yml 自动更新
- [x] 4.3 手动测试：在 example 项目中运行 `generate:command` 验证 config-command.template.yml 自动更新
- [x] 4.4 手动测试：重复运行同一 generate 命令，验证 warning 输出且文件不被修改
