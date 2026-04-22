import {type IServiceOptions, type ITCPListenerOptions, JsonBufferCodec, Node, Route, Service, TCPListener} from '@sora-soft/framework';
import typia from 'typia';

import {Com} from '../../lib/Com.js';
import {BusinessHandler} from '../handler/BusinessHandler.js';
import {ServiceName} from './common/ServiceName.js';

export interface IBusinessOptions extends IServiceOptions {
  tcpListener: ITCPListenerOptions;
}

class BusinessService extends Service {
  static register() {
    Node.registerService(ServiceName.Business, (options: IBusinessOptions) => {
      return new BusinessService(ServiceName.Business, options);
    });
  }

  constructor(name: string, options: IBusinessOptions) {
    typia.assert<IBusinessOptions>(options);
    super(name, options);
  }

  protected async startup() {
    await this.connectComponents([Com.etcd]);

    const route = new BusinessHandler();
    const listener = new TCPListener(this.options_.tcpListener, Route.callback(route), [new JsonBufferCodec()]);
    await this.installListener(listener);
  }

  protected async shutdown() {}

  declare protected options_: IBusinessOptions;
}

export {BusinessService};
