import 'reflect-metadata';
import '../../../lib/codec/JsonBufferCodec.js';

import {afterEach, describe, expect, it} from 'vitest';

import {RPCHeader} from '../../../Const.js';
import {OPCode} from '../../../Enum.js';
import type {IRawNetPacket, IRawResPacket} from '../../../interface/rpc.js';
import {Codec} from '../../../lib/rpc/Codec.js';
import type {ListenerCallback} from '../../../lib/rpc/Listener.js';
import {TCPConnector} from '../TCPConnector.js';
import {TCPListener} from '../TCPListener.js';

describe('TCP Round-Trip', () => {
  const listeners: TCPListener[] = [];
  const connectors: TCPConnector[] = [];
  let portCounter = 39500;

  afterEach(async () => {
    for (const c of connectors) {
      await c.off().catch(() => {});
    }
    connectors.length = 0;
    for (const l of listeners) {
      await l.stopListen().catch(() => {});
    }
    listeners.length = 0;
  });

  function nextPortRange(): [number, number] {
    const base = portCounter;
    portCounter += 10;
    return [base, base + 9];
  }

  const echoCallback: ListenerCallback = async (packet: IRawNetPacket) => {
    return {
      opcode: OPCode.Response,
      headers: {[RPCHeader.RpcIdHeader]: packet.headers[RPCHeader.RpcIdHeader]},
      payload: {error: null, result: packet.payload},
    } as IRawResPacket;
  };

  async function createListenerAndConnect(
    callback: ListenerCallback = echoCallback,
    portRange?: [number, number]
  ): Promise<{ listener: TCPListener; connector: TCPConnector }> {
    const range = portRange || nextPortRange();
    const listener = new TCPListener(
      {host: '127.0.0.1', portRange: range},
      callback,
      []
    );
    listeners.push(listener);
    await listener.startListen();

    const endpoint = listener.metaData.endpoint;
    const codec = Codec.get('json');
    if (!codec) throw new Error('json codec not registered');

    const connector = new TCPConnector();
    connectors.push(connector);

    await connector.start({
      protocol: 'tcp',
      endpoint,
      codecs: ['json'],
      labels: {},
    }, codec);

    return {listener, connector};
  }

  const wait = (ms = 200) => new Promise<void>(r => setTimeout(r, ms));

  it('should complete full TCP round-trip with echo', async () => {
    const {connector} = await createListenerAndConnect();

    let received: any = null;
    connector.dataSubject.subscribe(data => { received = data; });

    await connector.send({
      opcode: OPCode.Request,
      method: 'echo',
      service: 'test',
      headers: {[RPCHeader.RpcIdHeader]: '1'},
      payload: {msg: 'hello'},
    });

    await wait(200);
    expect(received).toBeDefined();
    expect(received.opcode).toBe(OPCode.Response);
    expect(received.payload.result).toEqual({msg: 'hello'});
  });

  it('should handle large message with framing', async () => {
    const {connector} = await createListenerAndConnect();

    const largePayload = {data: 'x'.repeat(50000)};
    let received: any = null;
    connector.dataSubject.subscribe(data => { received = data; });

    await connector.send({
      opcode: OPCode.Request,
      method: 'echo',
      service: 'test',
      headers: {[RPCHeader.RpcIdHeader]: '2'},
      payload: largePayload,
    });

    await wait(500);
    expect(received).toBeDefined();
    expect(received.payload.result).toEqual(largePayload);
  });

  it('should auto-select port from portRange', async () => {
    const range: [number, number] = [39600, 39610];
    const {listener} = await createListenerAndConnect(echoCallback, range);

    const port = parseInt(listener.metaData.endpoint.split(':')[1], 10);
    expect(port).toBeGreaterThanOrEqual(39600);
    expect(port).toBeLessThanOrEqual(39610);
  });

  it('should support concurrent connections', async () => {
    const range = nextPortRange();
    const listener = new TCPListener(
      {host: '127.0.0.1', portRange: range},
      echoCallback,
      []
    );
    listeners.push(listener);
    await listener.startListen();

    const endpoint = listener.metaData.endpoint;
    const codec = Codec.get('json');
    if (!codec) throw new Error('json codec not registered');

    const clientCount = 3;
    const results: any[] = [];

    const connectAndSend = async (id: number) => {
      const conn = new TCPConnector();
      connectors.push(conn);

      await conn.start({
        protocol: 'tcp',
        endpoint,
        codecs: ['json'],
        labels: {},
      }, codec);

      let received: any = null;
      conn.dataSubject.subscribe(data => { received = data; });

      await conn.send({
        opcode: OPCode.Request,
        method: 'echo',
        service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: id.toString()},
        payload: {clientId: id},
      });

      await wait(300);
      results.push(received);
    };

    await Promise.all(Array.from({length: clientCount}, (_, i) => connectAndSend(i + 1)));

    expect(results.length).toBe(clientCount);
    for (const r of results) {
      expect(r).toBeDefined();
      expect(r.opcode).toBe(OPCode.Response);
    }
  });

  it('should reconnect after connection lost', async () => {
    const {listener, connector} = await createListenerAndConnect();

    let received: any = null;
    connector.dataSubject.subscribe(data => { received = data; });

    await connector.send({
      opcode: OPCode.Request,
      method: 'echo',
      service: 'test',
      headers: {[RPCHeader.RpcIdHeader]: '10'},
      payload: {seq: 1},
    });

    await wait(200);
    expect(received).toBeDefined();

    await connector.off();
    await wait(200);

    const endpoint = listener.metaData.endpoint;
    const codec = Codec.get('json');
    if (!codec) throw new Error('json codec not registered');

    const newConnector = new TCPConnector();
    connectors.push(newConnector);

    await newConnector.start({
      protocol: 'tcp',
      endpoint,
      codecs: ['json'],
      labels: {},
    }, codec);

    let received2: any = null;
    newConnector.dataSubject.subscribe(data => { received2 = data; });

    await newConnector.send({
      opcode: OPCode.Request,
      method: 'echo',
      service: 'test',
      headers: {[RPCHeader.RpcIdHeader]: '11'},
      payload: {seq: 2},
    });

    await wait(200);
    expect(received2).toBeDefined();
    expect(received2.payload.result).toEqual({seq: 2});
  });
});
