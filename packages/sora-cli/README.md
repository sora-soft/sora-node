# @sora-soft/sora-cli

sora 框架的命令行脚手架工具，提供项目创建、代码生成、API 类型导出和 OpenAPI 文档生成等功能。

## 安装

```bash
npm install -g @sora-soft/sora-cli
```

安装后可通过 `sora` 命令使用。

## 命令总览

```
sora
├── new <name>                      创建新项目
├── config                          从模板生成配置文件
├── generate:service [name]         生成 Service 脚手架
├── generate:worker [name]          生成 Worker 脚手架
├── generate:command [name]         生成 CommandWorker 脚手架
├── export:api                      导出 API 类型声明 (.ts)
└── export:doc                      导出 OpenAPI 文档 (.yml/.json)
```

---

## sora.json 配置文件

`sora.json` 是 sora 项目的核心配置文件，放置在项目根目录下。所有依赖项目配置的命令（`generate:*`、`export:*`、`config`）都需要读取此文件。

### 配置结构

```json
{
  "root": "src",
  "dist": "dist",
  "serviceDir": "app/service",
  "serviceNameEnum": "app/service/common/ServiceName#ServiceName",
  "serviceRegister": "app/service/common/ServiceRegister#ServiceRegister.init",
  "handlerDir": "app/handler",
  "workerDir": "app/worker",
  "workerNameEnum": "app/worker/common/WorkerName#WorkerName",
  "workerRegister": "app/worker/common/WorkerRegister#WorkerRegister.init",
  "databaseDir": "app/database",
  "componentNameEnum": "lib/Com#ComponentName",
  "comClass": "lib/Com#Com",
  "migration": "app/database/migration",
  "apiDeclarationOutput": "../dist-api-declaration/api",
  "docOutput": "../dist-api-doc/api"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `root` | `string` | 是 | 源码根目录（如 `"src"`） |
| `dist` | `string` | 是 | 编译输出目录（如 `"dist"`） |
| `serviceDir` | `string` | 是 | Service 文件存放目录，相对于 `root` |
| `serviceNameEnum` | `string` | 是 | 服务名枚举的符号引用 |
| `serviceRegister` | `string` | 是 | 服务注册函数的符号引用 |
| `handlerDir` | `string` | 是 | Handler 文件存放目录，相对于 `root` |
| `workerDir` | `string` | 是 | Worker 文件存放目录，相对于 `root` |
| `workerNameEnum` | `string` | 是 | 工作器名枚举的符号引用 |
| `workerRegister` | `string` | 是 | 工作器注册函数的符号引用 |
| `databaseDir` | `string` | 是 | 数据库相关文件目录，相对于 `root` |
| `componentNameEnum` | `string` | 是 | 组件名枚举的符号引用 |
| `comClass` | `string` | 是 | Com 组件管理类的符号引用 |
| `migration` | `string` | 否 | 数据库迁移文件目录，相对于 `root` |
| `apiDeclarationOutput` | `string` | 是 | API 类型声明输出路径 |
| `docOutput` | `string` | 否 | OpenAPI 文档输出路径 |

### 符号引用格式

部分字段使用 `"filepath#Symbol"` 格式引用代码中的符号：

- **枚举引用** — `"路径/文件名#枚举名"`

  ```
  "app/service/common/ServiceName#ServiceName"
  ```
  指向 `src/app/service/common/ServiceName.ts` 中的 `ServiceName` 枚举。

- **注册方法引用** — `"路径/文件名#类名.方法名"`

  ```
  "app/service/common/ServiceRegister#ServiceRegister.init"
  ```
  指向 `src/app/service/common/ServiceRegister.ts` 中 `ServiceRegister` 类的 `init()` 静态方法。

路径均相对于 `root` 目录，不含文件扩展名。

---

## 命令详解

### `sora new <name>`

创建一个新的 sora 项目。从 GitHub 模板仓库克隆并交互式配置项目信息。

**用法**

```bash
sora new my-project
```

**交互流程**

命令会依次询问以下信息：

| 提示项 | 默认值 | 说明 |
|---|---|---|
| Project name | 传入的 `<name>` | 项目名称 |
| Description | — | 项目描述 |
| Version | `1.0.0` | 初始版本号 |
| Author | — | 作者 |
| License | `MIT` | 开源许可证 |

确认后将从 `https://github.com/sora-soft/backend-example-project.git` 克隆模板项目，并用提供的信息重写 `package.json`。

**注意**：此命令不需要在已有 sora 项目中运行。

---

### `sora generate:service [name]`

生成一个新的 Service 脚手架，包含 Service 类、Handler 类（如有监听器），并自动注册到枚举和注册函数中。

**用法**

```bash
sora generate:service auth
sora generate:service auth --listeners tcp,websocket
sora generate:service auth --listeners none --standalone
sora generate:service --dry-run
```

**参数**

| 参数 | 说明 |
|---|---|
| `[name]` | 服务名称。未提供时交互式询问 |

**Flags**

| Flag | 说明 |
|---|---|
| `--listeners <types>` | 监听器类型，逗号分隔：`tcp`, `websocket`, `http`, `none`。未提供时交互式多选 |
| `--standalone` | 生成 SingletonService（单例服务）。未提供时交互式确认 |
| `--dry-run` | 仅预览将生成的文件，不实际写入 |

**监听器类型**

| 类型 | 效果 |
|---|---|
| `tcp` | 安装 TCPListener，用于内部 RPC 通信 |
| `websocket` | 安装 WebSocketListener，用于 WebSocket 连接 |
| `http` | 安装 HTTPListener + Koa，用于 HTTP/HTTPS 请求 |
| `none` | 不安装任何监听器。与其他类型互斥 |

**自动执行的操作**

1. 根据 `sora.json` 中的 `serviceDir` 生成 `{PascalName}Service.ts`
2. 如果选择了监听器（非 `none`），根据 `handlerDir` 生成 `{PascalName}Handler.ts`（带 `@soraExport route` 注解）
3. 在 `serviceNameEnum` 指向的枚举中插入新成员
4. 在 `serviceRegister` 指向的注册方法中插入 `ClassName.register()` 调用
5. 所有 AST 修改通过 TypeScript 编译器 API 精确插入，不破坏现有代码

**生成的 Service 文件结构**

```typescript
// {PascalName}Service.ts
import {Service, Node, ...} from '@sora-soft/framework';
import typia from 'typia';
import {ServiceName} from './ServiceName.js';

export interface I{Name}Options extends IServiceOptions {
  // 根据 listeners 添加对应选项
}

class {Name}Service extends Service {
  static register() {
    Node.registerService(ServiceName.{Name}, (options) => {
      return new {Name}Service(ServiceName.{Name}, options);
    });
  }

  constructor(name: string, options: I{Name}Options) {
    typia.assert<I{Name}Options>(options);
    super(name, options);
  }

  protected async startup() {
    // 安装 listeners（如有）
  }

  protected async shutdown() {}
}
```

**生成的 Handler 文件结构**

```typescript
// {PascalName}Handler.ts
import {Route} from '@sora-soft/framework';
import {guard} from '@sora-soft/typia-decorator';

/**
 * @soraExport route
 * @soraTargets web
 */
class {Name}Handler extends Route {
  @Route.method
  async test(@guard body: void) {
    return { test: true };
  }
}
```

---

### `sora generate:worker [name]`

生成一个新的 Worker 脚手架，并自动注册到枚举和注册函数中。

**用法**

```bash
sora generate:worker task-processor
sora generate:worker task-processor --standalone
sora generate:worker --dry-run
```

**参数**

| 参数 | 说明 |
|---|---|
| `[name]` | 工作器名称。未提供时交互式询问 |

**Flags**

| Flag | 说明 |
|---|---|
| `--standalone` | 生成 SingletonWorker（单例工作器）。未提供时交互式确认 |
| `--dry-run` | 仅预览，不实际写入 |

**自动执行的操作**

1. 根据 `sora.json` 中的 `workerDir` 生成 `{PascalName}Worker.ts`
2. 在 `workerNameEnum` 指向的枚举中插入新成员
3. 在 `workerRegister` 指向的注册方法中插入 `ClassName.register()` 调用

**生成的 Worker 文件结构**

```typescript
import {Worker, Node, ...} from '@sora-soft/framework';
import typia from 'typia';
import {WorkerName} from './WorkerName.js';

export interface I{Name}WorkerOptions extends IWorkerOptions {}

class {Name}Worker extends Worker {
  static register() {
    Node.registerWorker(WorkerName.{Name}, (options) => {
      return new {Name}Worker(WorkerName.{Name}, options);
    });
  }

  constructor(name: string, options: I{Name}WorkerOptions) {
    typia.assert<I{Name}WorkerOptions>(options);
    super(name, options);
  }

  protected async startup() {}
  protected async shutdown() {}
}
```

---

### `sora generate:command [name]`

生成一个新的 CommandWorker 脚手架。CommandWorker 是一种特殊的 Worker，用于处理一次性命令行任务（如数据库迁移、数据初始化等）。

**用法**

```bash
sora generate:command database-migrate
sora generate:command database-migrate --dry-run
```

**参数**

| 参数 | 说明 |
|---|---|
| `[name]` | 命令名称。未提供时交互式询问 |

**Flags**

| Flag | 说明 |
|---|---|
| `--dry-run` | 仅预览，不实际写入 |

**自动执行的操作**

1. 根据 `sora.json` 中的 `workerDir` 生成 `{PascalName}CommandWorker.ts`
2. 在 `workerNameEnum` 指向的枚举中插入 `{Name}Command` 成员
3. 在 `workerRegister` 指向的注册方法中插入 `ClassName.register()` 调用

**生成的 CommandWorker 文件结构**

```typescript
import {Worker, Node, ...} from '@sora-soft/framework';
import typia from 'typia';
import {WorkerName} from './WorkerName.js';

export interface I{Name}CommandWorkerOptions extends IWorkerOptions {}

class {Name}CommandWorker extends Worker {
  static register() {
    Node.registerWorker(WorkerName.{Name}Command, (options) => {
      return new {Name}CommandWorker(WorkerName.{Name}Command, options);
    });
  }

  constructor(name: string, options: I{Name}CommandWorkerOptions) {
    typia.assert<I{Name}CommandWorkerOptions>(options);
    super(name, options);
  }

  protected async startup() {}
  protected async shutdown() {}

  async runCommand(commands: string[]) {
    const [action] = commands;
    switch (action) {
      // TODO: 实现 action 指令
    }
    return true;
  }
}
```

---

### `sora config`

从 art-template 模板文件生成配置文件。通过交互式问答填充模板变量，支持多种输入类型和自动缓存。

**用法**

```bash
sora config -t config/template/app.yaml.art -d config/app.yaml
```

**Flags**

| Flag | 缩写 | 必填 | 说明 |
|---|---|---|---|
| `--template <path>` | `-t` | 是 | 模板文件路径 |
| `--dist <path>` | `-d` | 是 | 输出文件路径 |

**模板语法**

模板使用 art-template 引擎，并扩展了两个自定义规则：

| 语法 | 说明 | 示例 |
|---|---|---|
| `$(variable)` | 变量替换，内容会被转义 | `host: $(serverHost)` |
| `#define(key,type,hint)` | 声明一个需要交互输入的变量，占一行 | `#define(port,number,端口号)` |

**变量类型**

| 类型 | 说明 | 示例定义 |
|---|---|---|
| `string` | 普通文本输入 | `#define(name,string,服务名称)` |
| `password` | 密码输入（隐藏字符） | `#define(pwd,password,数据库密码)` |
| `number` | 数字输入 | `#define(port,number,端口号)` |
| `select` | 列表选择，选项用 `\|` 分隔 | `#define(env,select[mysql\|mariadb],环境)` |
| `host-ip` | IP 地址选择，自动枚举本机网卡地址 | `#define(bind,host-ip,绑定地址)` |

**缓存机制**

首次运行后，输入的值会保存在模板文件同目录下的 `.var.json` 中。再次运行时，之前的值会作为默认值自动填入，无需重复输入。

**示例模板文件**

```yaml
#define(dbHost,string,数据库主机)
#define(dbPort,number,数据库端口)
#define(dbUser,string,数据库用户)
#define(dbPassword,password,数据库密码)
#define(env,select[dev|staging|prod],运行环境)

database:
  host: $(dbHost)
  port: $(dbPort)
  user: $(dbUser)
  password: $(dbPassword)
  database: myapp_$(env)
```

---

### `sora export:api`

扫描项目源码，收集带有 `@soraExport` 注解的类、枚举、接口和类型别名，转换为纯 TypeScript 类型声明文件。用于将内部类型安全地导出给外部客户端使用。

**用法**

```bash
sora export:api
sora export:api --target web
sora export:api --target web --target admin
```

**Flags**

| Flag | 说明 |
|---|---|
| `--target <mode>` | 指定导出目标，可多次使用。仅导出匹配 `@soraTargets` 的声明 |

**导出规则**

| `@soraExport` 值 | 转换方式 |
|---|---|
| `route` | 转为接口，仅保留带 `@Route.method` 装饰器的方法，每个方法只保留第一个参数（请求体）和返回类型 |
| `entity` | 转为接口，仅保留公共非静态属性 |
| （无值） | 转为接口，仅保留公共非静态属性 |
| 枚举 / interface / type alias | 直接导出，确保有 `export` 关键字 |

**输出**

- 全量导出：`{apiDeclarationOutput}/api.ts`
- 按 target：`{apiDeclarationOutput}/api.{target}.ts`

输出文件中所有 sora 专用 JSDoc 标签（`@soraExport`、`@soraTargets`、`@soraIgnore`、`@soraPrefix`、`@method`）会被自动移除，仅保留有意义的文档注释。

**处理管线**

```
源码扫描 → 收集 @soraExport 声明 → 按 @soraTargets 过滤 → AST 转换 → 递归解析类型依赖 → 写入 .ts 文件
```

---

### `sora export:doc`

扫描项目中带有 `@soraExport route` 注解的路由类，生成 OpenAPI 3.0 规范文档（YAML 或 JSON 格式）。

**用法**

```bash
sora export:doc
sora export:doc --format json
sora export:doc --format yaml --target web
sora export:doc --target web --target admin
```

**Flags**

| Flag | 说明 |
|---|---|
| `--format <fmt>` | 输出格式：`yaml`（默认）或 `json` |
| `--target <mode>` | 指定导出目标，可多次使用。仅包含匹配 `@soraTargets` 的路由 |

**前提条件**

`sora.json` 中必须配置 `docOutput` 字段，否则命令会报错。

**输出**

- YAML 格式：`{docOutput}/api.yml`
- JSON 格式：`{docOutput}/api.json`

文档的 `info.title` 和 `info.version` 从项目根目录的 `package.json` 读取。

**处理管线**

```
源码扫描 → 收集 @soraExport route 类 → 按 @soraTargets 过滤 → 解析路由方法和类型 → 转换为 OpenAPI PathItem → 收集 JSON Schema → 写入文件
```

**从注解到 OpenAPI 的映射**

| 源码 | OpenAPI 字段 |
|---|---|
| 方法的 JSDoc 摘要 | `summary` |
| `@description` | `description` |
| `@method` | HTTP verb（默认 `POST`） |
| `@soraPrefix` | path 前缀（默认 `/`） |
| 方法名 | path 的最后一段 |
| 第一个参数类型 | `requestBody` |
| 返回类型 | `response` schema |
| TypeScript 类型 | 自动转换为 JSON Schema（`$ref` 引用放入 `components/schemas`） |

**注意**：使用 `@Route.notify` 装饰器的方法不会出现在文档中（仅 `@Route.method` 会被收集）。

---

## JSDoc 注解参考

sora-cli 通过 JSDoc 注解来识别和分类代码中的导出目标。以下是所有支持的注解：

### 类/声明级注解

| 注解 | 说明 | 值 | 示例 |
|---|---|---|---|
| `@soraExport` | 标记此声明需要被导出 | `route`、`entity` 或无值 | `@soraExport route` |
| `@soraTargets` | 指定目标环境，逗号分隔 | 目标名称 | `@soraTargets web,admin` |
| `@soraPrefix` | API 路径前缀（仅 route 类） | 路径，逗号分隔多个 | `@soraPrefix /api/v1/auth` |

### 方法/属性级注解

| 注解 | 说明 | 值 | 示例 |
|---|---|---|---|
| `@soraIgnore` | 从导出中排除此成员 | 可配合 `@soraTargets` 做目标级忽略 | `@soraIgnore` |
| `@method` | 指定 HTTP 方法（用于文档生成） | `GET`、`POST`、`PUT`、`DELETE`、`PATCH`、`HEAD`、`OPTIONS` | `@method GET` |
| `@description` | 方法的详细描述（用于文档生成） | 自由文本 | `@description 用户登录接口` |

### 注解使用示例

```typescript
/**
 * @soraExport route
 * @soraTargets web
 * @soraPrefix /api/v1/auth
 */
class AuthHandler extends Route {
  /**
   * 注册账号
   * @description 注册新用户账号，需要提供用户名、密码和邮箱
   */
  @Route.method
  async register(@guard body: IReqRegister) {
    return { id: account.id };
  }

  /**
   * 用户登录
   * @method POST
   */
  @Route.method
  async login(@guard body: IReqLogin) { ... }

  /**
   * @soraIgnore
   */
  @Route.method
  async internalMethod() { ... }

  @Route.notify
  async onNotification() { ... }
}
```

---

## 框架装饰器参考

以下装饰器由 `@sora-soft/framework` 和 `@sora-soft/typia-decorator` 提供，sora-cli 在代码生成和导出时会识别它们。

| 装饰器 | 来源包 | 作用 |
|---|---|---|
| `@Route.method` | `@sora-soft/framework` | 标记方法为 RPC 请求处理器（请求-响应模式） |
| `@Route.notify` | `@sora-soft/framework` | 标记方法为通知处理器（单向触发模式，不出现在文档中） |
| `@guard` | `@sora-soft/typia-decorator` | 标记参数进行运行时类型校验（基于 typia AOT） |

---

## 工作流程示例

### 创建新项目并添加服务

```bash
# 1. 创建项目
sora new my-app
cd my-app

# 2. 生成一个带 HTTP 和 WebSocket 监听器的服务
sora generate:service gateway --listeners http,websocket

# 3. 生成一个后台 Worker
sora generate:worker email-sender

# 4. 生成一个命令行命令
sora generate:command db-migrate

# 5. 导出 API 类型声明
sora export:api --target web

# 6. 生成 OpenAPI 文档
sora export:doc --format yaml --target web

# 7. 从模板生成运行时配置
sora config -t run/config.template.yml -d run/config.yml
```

## License

WTFPL
