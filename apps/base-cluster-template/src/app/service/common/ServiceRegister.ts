import {BusinessService} from '../BusinessService.js';
import {HttpGatewayService} from '../HttpGatewayService.js';

class ServiceRegister {
  static init() {
    HttpGatewayService.register();
    BusinessService.register();
  }
}

export {ServiceRegister};
