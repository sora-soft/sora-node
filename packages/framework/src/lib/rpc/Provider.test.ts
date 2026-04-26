import 'reflect-metadata';
import '../../lib/codec/JsonBufferCodec.js';

import {afterEach, describe, expect, it} from 'vitest';

import {RPCHeader} from '../../Const.js';
import {ListenerState, OPCode} from '../../Enum.js';
import type {IListenerMetaData} from '../../interface/discovery.js';
import {RamDiscovery} from '../../test/RamDiscovery.js';
import {MockConnector} from '../../test/tools/mock/MockConnector.js';
import {FilterOperator, LabelFilter} from '../../utility/LabelFilter.js';
import {Provider} from './provider/Provider.js';
import {ProviderManager} from './provider/ProviderManager.js';

describe('Provider', () => {
  const cleanup: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const fn of cleanup.splice(0)) {
      await fn().catch(() => {});
    }
  });

  function createListener(overrides: Partial<IListenerMetaData> & { id: string; targetName: string }): IListenerMetaData {
    return {
      protocol: 'mock',
      endpoint: `mock://${overrides.id}`,
      codecs: ['json'],
      labels: {},
      state: ListenerState.Ready,
      targetId: `target-${overrides.id}`,
      weight: 100,
      ...overrides,
    };
  }

  async function setup(name = 'test-service', filter?: LabelFilter) {
    const discovery = new RamDiscovery();
    await discovery.connect();
    cleanup.push(() => discovery.disconnect());

    const manager = new ProviderManager(discovery);
    manager.registerSender('mock', () => new MockConnector());

    const provider = new Provider(name, filter || new LabelFilter([]), undefined, manager);
    cleanup.push(() => provider.shutdown());

    await provider.startup();
    return {discovery, manager, provider};
  }

  const wait = (ms = 200) => new Promise<void>(r => setTimeout(r, ms));

  it('should auto-discover and create sender for matching listener', async () => {
    const {discovery, provider} = await setup();

    await discovery.registerEndpoint(createListener({id: 'l-1', targetName: 'test-service'}));
    await wait();

    expect(provider.senders.size).toBe(1);
  });

  it('should ignore listeners with different service name', async () => {
    const {discovery, provider} = await setup();

    await discovery.registerEndpoint(createListener({id: 'l-1', targetName: 'other-service'}));
    await wait();

    expect(provider.senders.size).toBe(0);
  });

  it('should filter listeners by LabelFilter INCLUDE rule', async () => {
    const filter = new LabelFilter([{label: 'env', operator: FilterOperator.INCLUDE, values: ['prod']}]);
    const {discovery, provider} = await setup('svc', filter);

    await discovery.registerEndpoint(createListener({
      id: 'l-1', targetName: 'svc', labels: {env: 'dev'},
    }));
    await wait();
    expect(provider.senders.size).toBe(0);

    await discovery.registerEndpoint(createListener({
      id: 'l-2', targetName: 'svc', labels: {env: 'prod'},
    }));
    await wait();
    expect(provider.senders.size).toBe(1);
  });

  it('should remove sender when endpoint is unregistered', async () => {
    const {discovery, provider} = await setup();

    await discovery.registerEndpoint(createListener({id: 'l-1', targetName: 'test-service'}));
    await wait();
    expect(provider.senders.size).toBe(1);

    await discovery.unregisterEndPoint('l-1');
    await wait();
    expect(provider.senders.size).toBe(0);
  });

  it('should create multiple senders for multiple listeners', async () => {
    const {discovery, provider} = await setup();

    await discovery.registerEndpoint(createListener({id: 'l-1', targetName: 'test-service', weight: 100}));
    await discovery.registerEndpoint(createListener({id: 'l-2', targetName: 'test-service', weight: 200}));

    await wait(300);
    expect(provider.senders.size).toBe(2);
  });

  it('should throw when calling rpc without senders', async () => {
    const {provider} = await setup();
    await expect(provider.rpc().test({})).rejects.toThrow();
  });

  it('should perform RPC call through provider', async () => {
    const {discovery, provider} = await setup();

    await discovery.registerEndpoint(createListener({id: 'l-1', targetName: 'test-service'}));
    await wait(300);

    const sender = [...provider.senders.values()][0];
    const conn = sender.connector as MockConnector;

    conn.outgoing.on('data', (data: any) => {
      if (data.opcode === OPCode.Request) {
        conn.incoming.write({
          opcode: OPCode.Response,
          headers: {[RPCHeader.RpcIdHeader]: data.headers[RPCHeader.RpcIdHeader]},
          payload: {error: null, result: data.payload},
        });
      }
    });

    const result = await provider.rpc().echo({msg: 'hello'});
    expect(result).toEqual({msg: 'hello'});
  });

  it('should broadcast notify to all available senders', async () => {
    const {discovery, provider} = await setup();

    await discovery.registerEndpoint(createListener({id: 'l-1', targetName: 'test-service'}));
    await discovery.registerEndpoint(createListener({id: 'l-2', targetName: 'test-service'}));

    await wait(400);

    const senders = [...provider.senders.values()];
    expect(senders.length).toBe(2);

    const received: any[] = [];
    for (const s of senders) {
      (s.connector as MockConnector).outgoing.on('data', (data: any) => received.push(data));
    }

    await provider.broadcast().onEvent({action: 'update'});
    await wait(50);

    expect(received.length).toBe(2);
    for (const pkt of received) {
      expect(pkt.opcode).toBe(OPCode.Notify);
      expect(pkt.method).toBe('onEvent');
      expect(pkt.payload).toEqual({action: 'update'});
    }
  });

  it('should select sender by targetId for RPC call', async () => {
    const {discovery, provider} = await setup();

    await discovery.registerEndpoint(createListener({id: 'l-1', targetName: 'test-service', targetId: 'srv-1'}));
    await discovery.registerEndpoint(createListener({id: 'l-2', targetName: 'test-service', targetId: 'srv-2'}));

    await wait(400);

    const senders = [...provider.senders.values()];
    expect(senders.length).toBe(2);

    const receivedByTarget = new Map<string, any[]>();
    for (const s of senders) {
      const list: any[] = [];
      receivedByTarget.set(s.targetId, list);

      const conn = s.connector as MockConnector;
      conn.outgoing.on('data', (data: any) => {
        list.push(data);
        if (data.opcode === OPCode.Request) {
          conn.incoming.write({
            opcode: OPCode.Response,
            headers: {[RPCHeader.RpcIdHeader]: data.headers[RPCHeader.RpcIdHeader]},
            payload: {error: null, result: data.payload},
          });
        }
      });
    }

    await provider.rpc('srv-1').ping({seq: 1});
    await wait(50);

    expect(receivedByTarget.get('srv-1')!.length).toBe(1);
    expect(receivedByTarget.get('srv-2')!.length).toBe(0);
  });
});
