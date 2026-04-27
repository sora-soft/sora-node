import {v4 as uuid} from 'uuid';

import type {ILabels} from '../../../interface/config.js';
import type {IListenerInfo} from '../../../interface/rpc.js';
import type {Codec} from '../../../lib/rpc/Codec.js';
import type {Connector} from '../../../lib/rpc/Connector.js';
import {Listener, type ListenerCallback} from '../../../lib/rpc/Listener.js';

export interface IMockListenerOptions {
  weight?: number;
  labels?: ILabels;
  codecs?: string[];
}

class MockListener extends Listener {
  constructor(callback: ListenerCallback, codecs: Codec<any>[] = [], options: IMockListenerOptions = {}) {
    super(callback, codecs, options.labels || {});
    this.mockCodecs_ = options.codecs || [];
    if (options.weight) {
      this.setWeight(options.weight);
    }
  }

  protected async listen(): Promise<IListenerInfo> {
    return {
      protocol: 'mock',
      endpoint: `mock://${uuid()}`,
      codecs: this.mockCodecs_,
      labels: {},
    };
  }

  protected async shutdown() {}

  injectConnection(connector: Connector, session?: string) {
    const sessionId = session || uuid();
    this.newConnector(sessionId, connector);
  }

  get version() {
    return '0.0.0';
  }

  get metaData(): IListenerInfo {
    return {
      protocol: 'mock',
      endpoint: `mock://${this.id}`,
      codecs: this.mockCodecs_,
      labels: this.labels,
    };
  }

  private mockCodecs_: string[];
}

export {MockListener};
