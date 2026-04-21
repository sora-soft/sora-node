## Context

sora-cli 的 `generate:service`、`generate:worker`、`generate:command` 三个命令目前只负责生成 TypeScript 源码文件（Service/Worker 类、枚举注册、Handler），但运行时依赖的 `config.template.yml` / `config-command.template.yml` 中的配置段需要开发者手动添加。当前模板使用 art-template 的 `#define` 伪指令声明变量、`$(variable)` 做变量替换，混杂在 YAML 中，不能直接用标准 YAML 库做 round-trip（会丢失 `#define` 指令和空行格式）。

## Goals / Non-Goals

**Goals:**
- generate 命令执行后，config 模板自动获得对应的配置段，无需手动编辑
- 保留 config 模板文件的原始格式（`#define` 指令、空行、引号不被破坏）
- 支持重复检测，防止重复插入
- `--config-template` 参数提供灵活性，未指定时交互式询问并有合理默认值

**Non-Goals:**
- 不支持反向操作（删除已生成的 config 条目）
- 不自动生成自定义配置字段（如 traefik、components），只生成标准的 listener 配置或空 `{}`
- 不修改 `sora.json` 结构

## Decisions

### 1. YAML 插入策略：纯字符串匹配拼接，js-yaml 仅用于重复检测

**选择**: 字符串匹配定位 + 直接文本拼接插入，js-yaml 解析仅用于检测目标名称是否已存在。

**考虑过的替代方案**:
- js-yaml round-trip（提取 `#define` → 解析 → 修改 → dump → 拼回 `#define`）：会丢失空行格式和引号，对用户手写的模板造成不必要的美化差异。
- 纯 AST 感知的 YAML 编辑器（如 yaml-ast-parser）：过于复杂，引入新依赖不值得。

**理由**: config 模板是低频修改的文件，保留用户原始格式比代码优雅更重要。字符串匹配足够可靠，因为 YAML 结构在 `services:` / `workers:` 段是简单的缩进块。

### 2. 插入位置：段头下一行

**选择**: 找到 `services:` 或 `workers:` 行后，直接在下一行插入新条目（缩进 2 空格）。新条目成为该段的第一个子条目。

**理由**: 最简单、最可靠的策略。不需要定位段的结束位置，不需要反向扫描。

### 3. 三种段的形态处理

对于 `services:` 和 `workers:` 段，统一处理三种形态：

| 形态 | 匹配模式 | 操作 |
|------|----------|------|
| `xxx: {}` | 行尾为 `{}` | 替换整行为 `xxx:\n  name: config` |
| `xxx:` | 行尾无内容，下有子条目 | 在下一行插入 `  name: config` |
| 无该段 | 文件中找不到 `xxx:` | 在文件末尾追加 `xxx:\n  name: config` |

### 4. Listener 到 Config 的映射

| Listener 类型 | Config 字段 |
|---------------|-------------|
| tcp | `tcpListener: { portRange: [$(portRangeMin), $(portRangeMax)], host: $(host), exposeHost: $(exposeHost) }` |
| http | `httpListener: { portRange: [$(portRangeMin), $(portRangeMax)], host: $(host), exposeHost: $(exposeHost) }` |
| websocket | `websocketListener: { portRange: [$(portRangeMin), $(portRangeMax)], host: $(host), exposeHost: $(exposeHost), entryPath: '/ws' }` |
| none / 无 | `{}`（空配置） |

多个 listener 时，所有 listener 字段并排出现在同一 service 的 config 对象内。

### 5. `--config-template` 参数设计

- `generate:service` / `generate:worker`: 默认 `run/config.template.yml`
- `generate:command`: 默认 `run/config-command.template.yml`
- 路径相对于 `process.cwd()` 解析
- 未传入时触发交互式询问，inquirer input 类型，带默认值

### 6. 新增工具模块 `ConfigTemplateInserter`

位置: `packages/sora-cli/src/lib/ConfigTemplateInserter.ts`

职责:
- `insertServiceConfig(templatePath, serviceName, listeners, dashName)` — 插入 service 配置
- `insertWorkerConfig(templatePath, workerDashName)` — 插入 worker 配置
- 内部: 读取文件 → js-yaml 解析检测重复 → 字符串匹配定位 → 文本拼接插入 → 写回文件

## Risks / Trade-offs

- **[格式假设风险]** 字符串匹配依赖 `services:` / `workers:` 出现在行首（无前导空格），这在当前模板中成立，但如果未来模板结构变化可能失败。→ 缓解：匹配时 trim 并忽略行尾空格，对常见变体容错。
- **[编码风格破坏风险]** 如果用户在 config 模板中使用了非标准缩进（tab vs space），插入的 2 空格缩进可能不一致。→ 缓解：插入时检测同段已有条目的缩进风格并匹配。
- **[js-yaml 依赖]** 需确认 js-yaml 已作为依赖存在。经检查，monorepo 中已安装 js-yaml@4.1.1（通过 pnpm），但 sora-cli 的 package.json 需显式声明。
