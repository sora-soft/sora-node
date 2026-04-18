import {ErrorLevel, ExError} from '@sora-soft/framework';

export enum ETCDDiscoveryErrorCode {
  ErrComponentNotFound = 'ERR_COMPONENT_NOT_FOND',
  ErrServiceNotFound = 'ERR_SERVICE_NOT_FOUND',
  ErrWorkerNotFound = 'ERR_WORKER_NOT_FOUND',
  ErrNodeNotFound = 'ERR_NODE_NOT_FOUND',
  ErrEndpointNotFound = 'ERR_ENDPOINT_NOT_FOUND',
  ErrEtcdNotConnected = 'ERR_ETCD_NOT_CONNECTED',
}

class ETCDDiscoveryError extends ExError {
  constructor(code: ETCDDiscoveryErrorCode, message: string) {
    super(code, 'ETCDDiscoveryError', message, ErrorLevel.Unexpected, {});
    Object.setPrototypeOf(this, ETCDDiscoveryError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export {ETCDDiscoveryError};
