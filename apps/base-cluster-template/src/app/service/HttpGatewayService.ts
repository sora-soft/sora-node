import {type IServiceOptions, Node, Service} from '@sora-soft/framework';
import {HTTPListener, type IHTTPListenerOptions} from '@sora-soft/http-support';
import Koa from '@sora-soft/http-support/koa';
import typia from 'typia';

import {Com} from '../../lib/Com.js';
import {Pvd} from '../../lib/Provider.js';
import {ForwardRoute} from '../../lib/route/ForwardRoute.js';
import {ServiceName} from './common/ServiceName.js';

export interface IHttpGatewayOptions extends IServiceOptions {
  httpListener?: IHTTPListenerOptions;
}

class HttpGatewayService extends Service {
  static register() {
    Node.registerService(ServiceName.HttpGateway, (options: IHttpGatewayOptions) => {
      return new HttpGatewayService(ServiceName.HttpGateway, options);
    });
  }

  constructor(name: string, options: IHttpGatewayOptions) {
    typia.assert<IHttpGatewayOptions>(options);
    super(name, options);
  }

  protected async startup() {
    await this.connectComponents([Com.etcd]);
    await this.registerProviders([Pvd.business]);

    const route = new ForwardRoute(this, {
      [ServiceName.Business]: Pvd.business,
    });
    const koa = new Koa();
    if (this.options_.httpListener) {
      this.httpListener_ = new HTTPListener(this.options_.httpListener, koa, ForwardRoute.callback(route), this.options_.httpListener.labels);
      await this.installListener(this.httpListener_);
    }
  }

  protected async shutdown() {}

  declare protected options_: IHttpGatewayOptions;
  private httpListener_?: HTTPListener;
}

export {HttpGatewayService};
