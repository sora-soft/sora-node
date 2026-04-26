import 'reflect-metadata';
import '../../lib/codec/JsonBufferCodec.js';

import {afterEach, describe, expect, it} from 'vitest';

import {OPCode} from '../../Enum.js';
import {MockConnector} from '../../test/tools/mock/MockConnector.js';
import {Broadcaster} from './Broadcaster.js';

describe('Broadcaster', () => {
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

  it('should register connector and broadcast notify', async () => {
    const broadcaster = new Broadcaster<any>();
    const [server, client] = await createPair();

    broadcaster.registerConnector('onUpdate', server);

    let received: any = null;
    client.dataSubject.subscribe(data => { received = data; });

    await broadcaster.notify('sender-id').onUpdate({event: 'change'});

    await new Promise(r => setTimeout(r, 50));
    expect(received).toBeDefined();
    expect(received.opcode).toBe(OPCode.Notify);
    expect(received.method).toBe('onUpdate');
    expect(received.payload).toEqual({event: 'change'});
  });

  it('should broadcast to multiple connectors', async () => {
    const broadcaster = new Broadcaster<any>();
    const [server1, client1] = await createPair();
    const [server2, client2] = await createPair();

    broadcaster.registerConnector('onUpdate', server1);
    broadcaster.registerConnector('onUpdate', server2);

    const received: any[] = [];
    client1.dataSubject.subscribe(data => { received.push(data); });
    client2.dataSubject.subscribe(data => { received.push(data); });

    await broadcaster.notify().onUpdate({data: 1});

    await new Promise(r => setTimeout(r, 50));
    expect(received.length).toBe(2);
  });

  it('should remove connector', async () => {
    const broadcaster = new Broadcaster<any>();
    const [server, client] = await createPair();

    broadcaster.registerConnector('onUpdate', server);
    broadcaster.removeConnector(server.session!);

    let received = false;
    client.dataSubject.subscribe(() => { received = true; });

    await broadcaster.notify().onUpdate({});
    await new Promise(r => setTimeout(r, 50));

    expect(received).toBe(false);
  });

  it('should only notify connectors registered for the method', async () => {
    const broadcaster = new Broadcaster<any>();
    const [server, client] = await createPair();

    broadcaster.registerConnector('methodA', server);

    let received = false;
    client.dataSubject.subscribe(() => { received = true; });

    await broadcaster.notify().methodB({});
    await new Promise(r => setTimeout(r, 50));

    expect(received).toBe(false);
  });

  it('should skip connector without session', async () => {
    const broadcaster = new Broadcaster<any>();
    const [server, _client] = await createPair();
    server.session = undefined;

    broadcaster.registerConnector('test', server);

    // The connector should not have been registered since session is undefined
    // After registerConnector, the connector map should be empty
    const connectorsMap = (broadcaster as any).connectors_;
    expect(connectorsMap.size).toBe(0);
  });
});
