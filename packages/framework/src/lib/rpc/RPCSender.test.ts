import 'reflect-metadata';
import '../../lib/codec/JsonBufferCodec.js';

import {afterEach, describe, expect, it} from 'vitest';

import {RPCHeader} from '../../Const.js';
import {ListenerState, OPCode} from '../../Enum.js';
import type {IListenerMetaData} from '../../interface/discovery.js';
import {RPCSenderStatus} from '../../interface/rpc.js';
import {RamDiscovery} from '../../test/RamDiscovery.js';
import {MockConnector} from '../../test/tools/mock/MockConnector.js';
import {LabelFilter} from '../../utility/LabelFilter.js';
import {RpcClientTraceContext} from '../trace/context/RpcClientTraceContext.js';
import {Trace} from '../trace/Trace.js';
import {Request} from './packet/Request.js';
import {Provider} from './provider/Provider.js';
import {ProviderManager} from './provider/ProviderManager.js';
import {RPCSender} from './provider/RPCSender.js';

describe('RPCSender', () => {
  const cleanup: Array<() => Promise<void>> = [];
  let sender: RPCSender | null = null;

  afterEach(async () => {
    if (sender) {
      await sender.destroy().catch(() => {});
      sender = null;
    }
    for (const fn of cleanup.splice(0)) {
      await fn().catch(() => {});
    }
  });

  function createTarget(overrides?: Partial<IListenerMetaData>): IListenerMetaData {
    return {
      id: 'listener-1',
      protocol: 'mock',
      endpoint: 'mock://listener-1',
      codecs: ['json'],
      labels: {},
      state: ListenerState.Ready,
      targetId: 'target-1',
      targetName: 'test-service',
      weight: 100,
      ...overrides,
    };
  }

  async function createSender(target?: IListenerMetaData): Promise<RPCSender> {
    const discovery = new RamDiscovery();
    await discovery.connect();
    cleanup.push(() => discovery.disconnect());

    const manager = new ProviderManager(discovery);
    manager.registerSender('mock', () => new MockConnector());

    const provider = new Provider('test-service', new LabelFilter([]), undefined, manager);
    cleanup.push(() => provider.shutdown());

    sender = new RPCSender(provider, target || createTarget());
    return sender;
  }

  function setupLoopback(conn: MockConnector) {
    conn.outgoing.on('data', (data: any) => {
      if (data.opcode === OPCode.Request) {
        conn.incoming.write({
          opcode: OPCode.Response,
          headers: {[RPCHeader.RpcIdHeader]: data.headers[RPCHeader.RpcIdHeader]},
          payload: {error: null, result: data.payload},
        });
      }
    });
  }

  const wait = (ms = 100) => new Promise<void>(r => setTimeout(r, ms));

  it('should send request and receive response via callRpc', async () => {
    const s = await createSender();
    await s.setStatus(RPCSenderStatus.Connect);
    await s.connector.waitForReady(5000);

    setupLoopback(s.connector as MockConnector);

    const request = new Request({
      service: 'test-service',
      method: 'echo',
      payload: {msg: 'hello'},
      headers: {},
    });

    const res = await s.callRpc(request);
    expect(res.payload.result).toEqual({msg: 'hello'});
  });

  it('should throw on error response from server', async () => {
    const s = await createSender();
    await s.setStatus(RPCSenderStatus.Connect);
    await s.connector.waitForReady(5000);

    const conn = s.connector as MockConnector;
    conn.outgoing.on('data', (data: any) => {
      if (data.opcode === OPCode.Request) {
        conn.incoming.write({
          opcode: OPCode.Response,
          headers: {[RPCHeader.RpcIdHeader]: data.headers[RPCHeader.RpcIdHeader]},
          payload: {
            error: {code: 'ERR_TEST', message: 'test error', level: 1, name: 'TestError', args: {}},
            result: null,
          },
        });
      }
    });

    const request = new Request({
      service: 'test-service',
      method: 'fail',
      payload: {},
      headers: {},
    });

    await expect(s.callRpc(request)).rejects.toThrow('test error');
  });

  it('should throw RPCError on timeout', async () => {
    const s = await createSender();
    await s.setStatus(RPCSenderStatus.Connect);
    await s.connector.waitForReady(5000);

    const request = new Request({
      service: 'test-service',
      method: 'slow',
      payload: {},
      headers: {},
    });

    await expect(s.callRpc(request, 200)).rejects.toThrow('timeout');
  });

  it('should track reference count', async () => {
    const s = await createSender();
    expect(s.getRefCount()).toBe(0);
    s.addRef();
    expect(s.getRefCount()).toBe(1);
    s.addRef();
    expect(s.getRefCount()).toBe(2);
    s.minusRef();
    expect(s.getRefCount()).toBe(1);
  });

  it('should reconnect after connection drops', async () => {
    const s = await createSender();
    await s.setStatus(RPCSenderStatus.Connect);
    await s.connector.waitForReady(5000);

    setupLoopback(s.connector as MockConnector);

    const request1 = new Request({
      service: 'test-service',
      method: 'echo',
      payload: {data: 1},
      headers: {},
    });

    const res1 = await s.callRpc(request1);
    expect(res1.payload.result).toEqual({data: 1});

    const oldConn = s.connector as MockConnector;
    await oldConn.off();

    await wait(300);

    const newConn = s.connector as MockConnector;
    expect(newConn).not.toBe(oldConn);
    await newConn.waitForReady(5000);

    setupLoopback(newConn);

    const request2 = new Request({
      service: 'test-service',
      method: 'echo',
      payload: {data: 2},
      headers: {},
    });

    const res2 = await s.callRpc(request2);
    expect(res2.payload.result).toEqual({data: 2});
  });

  it('should propagate trace headers in RPC request', async () => {
    const s = await createSender();
    await s.setStatus(RPCSenderStatus.Connect);
    await s.connector.waitForReady(5000);

    const conn = s.connector as MockConnector;
    const sentPackets: any[] = [];
    conn.outgoing.on('data', (data: any) => sentPackets.push(data));

    await Trace.run(new RpcClientTraceContext(), async () => {
      const request = new Request({
        service: 'test-service',
        method: 'test',
        payload: {},
        headers: {},
      });
      await s.callRpc(request, 500).catch(() => {});
    });

    expect(sentPackets.length).toBe(1);

    // Note: This test reveals a source code bug — callRpc uses Context.find(TraceContext)
    // but the trace context is stored in Trace's AsyncLocalStorage, not Context's.
    // Additionally, the variable reference `scope` is undefined (should be `traceScope`).
    // As a result, trace headers are NOT propagated. When the bug is fixed, this assertion should pass.
    expect(sentPackets[0].headers[RPCHeader.RPCTraceParent]).toBeDefined();
  });
});
