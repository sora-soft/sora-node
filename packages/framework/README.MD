# @sora-soft/framework

分布式微服务框架，提供 RPC 通信、服务生命周期管理、服务发现、领导者选举、结构化日志和分布式追踪。

## 安装

```bash
pnpm add @sora-soft/framework
```

要求 Node.js >= 22。

## 快速示例

以下示例创建一个最小的 HTTP 服务，监听请求并通过 Route 处理 RPC 调用：

```typescript
import 'reflect-metadata';
import {
  Runtime, Node, Service, Route, Worker,
  TCPListener, TCPConnector, JsonBufferCodec,
  RamDiscovery, ConsoleOutput,
  type IServiceOptions, type ITCPListenerOptions,
} from '@sora-soft/framework';

// 1. 定义 RPC 处理器
class HelloRoute extends Route {
  @Route.method
  async greet(body: { name: string }): Promise<{ message: string }> {
    return { message: `Hello, ${body.name}!` };
  }
}

// 2. 定义服务
interface IMyServiceOptions extends IServiceOptions {
  tcp: ITCPListenerOptions;
}

class MyService extends Service {
  constructor(name: string, private myOptions_: IMyServiceOptions) {
    super(name, myOptions_);
  }

  protected async startup() {
    const route = new HelloRoute();
    const listener = new TCPListener(
      this.myOptions_.tcp,
      Route.callback(route),
      [new JsonBufferCodec()],
    );
    await this.installListener(listener);
  }

  protected async shutdown() {}
}

// 3. 启动
async function main() {
  const consoleOutput = new ConsoleOutput();
  Runtime.frameLogger.pipe(consoleOutput);
  Runtime.rpcLogger.pipe(consoleOutput);

  Runtime.loadConfig({ scope: 'demo' });

  const discovery = new RamDiscovery();
  const node = new Node({ labels: {} }, []);

  await Runtime.startup(node, discovery);

  TCPConnector.register();
  Node.registerService('my-service', (options: IMyServiceOptions) => {
    return new MyService('my-service', options);
  });

  const service = Node.serviceFactory('my-service', {
    tcp: { host: '0.0.0.0', port: 7001 },
  });
  await Runtime.installService(service);
}

main().catch(console.error);
```

## API 参考

完整的 API 参考文档请参阅 [reference-index.md](./docs/reference-index.md)。

## 许可证

WTFPL
