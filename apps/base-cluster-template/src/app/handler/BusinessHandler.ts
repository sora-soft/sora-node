import {Route} from '@sora-soft/framework';
import {guard} from '@sora-soft/typia-decorator';

export interface IPingRequest {
  message?: string;
}

export interface IPingResponse {
  message: string;
  timestamp: number;
}

/**
 * @soraExport route
 * @soraPrefix /business
 */
class BusinessHandler extends Route {
  @Route.method
  async ping(@guard body: IPingRequest): Promise<IPingResponse> {
    return {
      message: body.message || 'pong',
      timestamp: Date.now(),
    };
  }
}

export {BusinessHandler};
