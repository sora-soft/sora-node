import {PassThrough} from 'node:stream';

import {v4 as uuid} from 'uuid';

import {ConnectorState} from '../../../Enum.js';
import type {IListenerInfo, IRawNetPacket} from '../../../interface/rpc.js';
import {Codec} from '../../../lib/rpc/Codec.js';
import {Connector} from '../../../lib/rpc/Connector.js';

class MockConnector extends Connector {
  constructor() {
    super({ping: {enabled: false}});
    this.outgoing_ = new PassThrough({objectMode: true});
    this.incoming_ = new PassThrough({objectMode: true});
    this.incoming_.on('data', (data: IRawNetPacket) => {
      this.handleIncomeMessage(data).catch(() => {});
    });
  }

  isAvailable() {
    return this.state === ConnectorState.Ready;
  }

  get protocol() {
    return 'mock';
  }

  protected async connect(_target: IListenerInfo) {}

  async send<T>(request: IRawNetPacket<T>) {
    this.outgoing_.write(request);
  }

  async sendRaw(request: object) {
    this.outgoing_.write(request);
  }

  async selectCodec(_code: string) {}

  protected async disconnect() {
    this.outgoing_.end();
    this.incoming_.end();
  }

  static async pair(codec?: Codec<any>): Promise<[MockConnector, MockConnector]> {
    const resolvedCodec = codec || Codec.get('json');
    if (!resolvedCodec) {
      throw new Error('json codec not registered, import JsonBufferCodec first');
    }

    const a = new MockConnector();
    const b = new MockConnector();

    a.outgoing.pipe(b.incoming);
    b.outgoing.pipe(a.incoming);

    const targetA: IListenerInfo = {
      protocol: 'mock',
      endpoint: 'mock://a',
      codecs: [resolvedCodec.code],
      labels: {},
    };
    const targetB: IListenerInfo = {
      protocol: 'mock',
      endpoint: 'mock://b',
      codecs: [resolvedCodec.code],
      labels: {},
    };

    await a.start(targetB, resolvedCodec);
    await b.start(targetA, resolvedCodec);

    a.session = uuid();
    b.session = uuid();

    return [a, b];
  }

  get outgoing() {
    return this.outgoing_;
  }

  get incoming() {
    return this.incoming_;
  }

  private outgoing_: PassThrough;
  private incoming_: PassThrough;
}

export {MockConnector};
