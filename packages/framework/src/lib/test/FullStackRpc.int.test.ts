import 'reflect-metadata';
import '../codec/JsonBufferCodec.js';

import {afterEach, describe, expect, it} from 'vitest';

import {WorkerState} from '../../Enum.js';
import {RamDiscovery} from '../../test/RamDiscovery.js';
import {Node} from '../Node.js';
import {Codec} from '../rpc/Codec.js';
import {Provider} from '../rpc/provider/Provider.js';
import {ProviderManager} from '../rpc/provider/ProviderManager.js';
import {Route} from '../rpc/Route.js';
import {Runtime} from '../Runtime.js';
import {TCPConnector} from '../tcp/TCPConnector.js';
import {TCPListener} from '../tcp/TCPListener.js';
import {Worker} from '../Worker.js';

class EchoRoute extends Route {
  @Route.method
  async echo(body: {msg: string}) {
    return {echo: body.msg};
  }

  @Route.method
  async add(body: {a: number; b: number}) {
    return {sum: body.a + body.b};
  }
}

class TestWorker extends Worker {
  protected async startup() {}
  protected async shutdown() {}
  get version() { return '1.0.0-test'; }
}

async function resetRuntime() {
  const rt = Runtime as any;
  for (const [id] of [...(rt.workers_ || [])]) {
    const w = rt.workers_.get(id);
    if (w && w.state < WorkerState.Stopping) await w.stop('reset').catch(() => {});
  }
  for (const [id] of [...(rt.services_ || [])]) {
    if (id === rt.node_?.id) continue;
    const s = rt.services_.get(id);
    if (s && s.state < WorkerState.Stopping) await s.stop('reset').catch(() => {});
  }
  if (rt.node_ && rt.node_.state < WorkerState.Stopping) await rt.node_.stop('reset').catch(() => {});
  if (rt.discovery_) await rt.discovery_.disconnect().catch(() => {});
  rt.shutdownPromise_ = undefined;
  rt.services_ = new Map();
  rt.workers_ = new Map();
  rt.components_ = new Map();
  rt.node_ = undefined;
  rt.discovery_ = undefined;
  rt.pvdManager_ = undefined;
}

const wait = (ms = 500) => new Promise<void>(r => setTimeout(r, ms));

async function setupNode(alias: string, portRange: [number, number]) {
  const discovery = new RamDiscovery();
  const codec = Codec.get('json')!;

  const route = new EchoRoute();
  const listenerCallback = Route.callback(route);
  const tcpListener = new TCPListener(
    {host: '127.0.0.1', portRange},
    listenerCallback,
    [codec]
  );

  const node = new Node({alias}, [tcpListener]);
  await Runtime.loadConfig({scope: 'test'});

  const rt = Runtime as any;
  rt.discovery_ = discovery;
  await rt.discovery_.connect();
  rt.pvdManager_ = new ProviderManager(discovery);
  rt.node_ = node;
  await rt.installService(node);

  TCPConnector.register();
}

describe('FullStackRpc', () => {
  afterEach(async () => {
    await resetRuntime();
  });

  it('should complete full RPC request-response through TCP', async () => {
    await setupNode('fullstack-node', [45000, 45100]);

    const rt = Runtime as any;
    const worker = new TestWorker('caller-worker', {alias: 'caller'});
    await rt.installWorker(worker);

    const provider = new Provider<EchoRoute>('node');
    await worker.registerProvider(provider);

    await wait(500);

    const result = await provider.rpc().echo({msg: 'hello'});
    expect(result).toEqual({echo: 'hello'});
  });

  it('should complete RPC with multiple parameters', async () => {
    await setupNode('math-node', [45200, 45300]);

    const rt = Runtime as any;
    const worker = new TestWorker('math-worker', {alias: 'math'});
    await rt.installWorker(worker);

    const provider = new Provider<EchoRoute>('node');
    await worker.registerProvider(provider);

    await wait(500);

    const result = await provider.rpc().add({a: 3, b: 4});
    expect(result).toEqual({sum: 7});
  });
});
