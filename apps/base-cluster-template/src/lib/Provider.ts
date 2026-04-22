import {Provider, TCPConnector} from '@sora-soft/framework';
import {WebSocketConnector} from '@sora-soft/http-support';

import {type BusinessHandler} from '../app/handler/BusinessHandler.js';
import {ServiceName} from '../app/service/common/ServiceName.js';

class Pvd {
  static registerSenders() {
    TCPConnector.register();
    WebSocketConnector.register();
  }

  static business = new Provider<BusinessHandler>(ServiceName.Business);
}

export {Pvd};
