import 'reflect-metadata';
import '../../lib/codec/JsonBufferCodec.js';

import {afterEach, describe, expect, it} from 'vitest';

import {RPCHeader} from '../../Const.js';
import {OPCode} from '../../Enum.js';
import type {IRawNetPacket, IRawResPacket} from '../../interface/rpc.js';
import {MockConnector} from '../../test/tools/mock/MockConnector.js';
import {Waiter} from '../../utility/Waiter.js';
import {PacketHandler} from './PacketHandler.js';

describe('PacketHandler', () => {
  const connectors: MockConnector[] = [];

  afterEach(async () => {
    for (const c of connectors) {
      await c.off().catch(() => {});
    }
    connectors.length = 0;
  });

  async function createPair(): Promise<[MockConnector, MockConnector]> {
    const [a, b] = await MockConnector.pair();
    connectors.push(a, b);
    return [a, b];
  }

  describe('Request dispatch', () => {
    it('should dispatch Request to callback and send response', async () => {
      const [server, client] = await createPair();

      const callback = async (packet: IRawNetPacket) => {
        return {
          opcode: OPCode.Response,
          headers: {},
          payload: {error: null, result: packet.payload},
        } as IRawResPacket;
      };

      let received: any = null;
      client.dataSubject.subscribe(data => { received = data; });

      await PacketHandler.handleNetPacket({
        opcode: OPCode.Request,
        method: 'echo',
        service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: 'rpc-1'},
        payload: {msg: 'hello'},
      }, server, callback);

      await new Promise(r => setTimeout(r, 50));
      expect(received).toBeDefined();
      expect(received.payload.result).toEqual({msg: 'hello'});
      expect(received.headers[RPCHeader.RpcIdHeader]).toBe('rpc-1');
    });

    it('should send error response when callback throws', async () => {
      const [server, client] = await createPair();

      const callback = async () => {
        throw new Error('handler failed');
      };

      let received: any = null;
      client.dataSubject.subscribe(data => { received = data; });

      await PacketHandler.handleNetPacket({
        opcode: OPCode.Request,
        method: 'fail',
        service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: 'rpc-2'},
        payload: {},
      }, server, callback);

      await new Promise(r => setTimeout(r, 50));
      expect(received).toBeDefined();
      expect(received.payload.error).toBeDefined();
      expect(received.payload.error.name).toBe('Error');
    });
  });

  describe('Notify dispatch', () => {
    it('should dispatch Notify to callback without response', async () => {
      const [server, _client] = await createPair();
      let called = false;

      const callback = async (packet: IRawNetPacket) => {
        if (packet.opcode === OPCode.Notify) {
          called = true;
        }
        return null;
      };

      await PacketHandler.handleNetPacket({
        opcode: OPCode.Notify,
        method: 'onEvent',
        service: 'test',
        headers: {},
        payload: {event: 'test'},
      }, server, callback);

      expect(called).toBe(true);
    });
  });

  describe('Response Waiter matching', () => {
    it('should emit response to waiter by rpcId', async () => {
      const [server, _client] = await createPair();
      const waiter = new Waiter<IRawResPacket>();
      const wait = waiter.wait(5000);

      await PacketHandler.handleNetPacket({
        opcode: OPCode.Response,
        headers: {[RPCHeader.RpcIdHeader]: wait.id.toString()},
        payload: {error: null, result: 42},
      }, server, undefined, waiter);

      const res = await wait.promise;
      expect(res.payload.result).toBe(42);
      waiter.clear();
    });

    it('should ignore response without waiter', async () => {
      const [server, _client] = await createPair();
      await PacketHandler.handleNetPacket({
        opcode: OPCode.Response,
        headers: {[RPCHeader.RpcIdHeader]: '999'},
        payload: {error: null, result: 42},
      }, server);
    });
  });

  describe('Trace span creation', () => {
    it('should create trace context from Request headers', async () => {
      const [server, _client] = await createPair();
      const traceParent = '00-0123456789abcdef0123456789abcdef-abcdef0123456789-01';

      let callbackCalled = false;
      const callback = async () => {
        callbackCalled = true;
        return null;
      };

      await PacketHandler.handleNetPacket({
        opcode: OPCode.Request,
        method: 'test',
        service: 'test',
        headers: {
          [RPCHeader.RpcIdHeader]: 'rpc-3',
          [RPCHeader.RPCTraceParent]: traceParent,
        },
        payload: {},
      }, server, callback);

      expect(callbackCalled).toBe(true);
    });
  });
});
