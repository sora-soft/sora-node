import {ErrorLevel, ExError} from '@sora-soft/framework';

export enum EtcdErrorCode {
  ErrEtcdLeaseNotFound = 'ERR_ETCD_LEASE_NOT_FOUND',
}

class EtcdError extends ExError {
  constructor(code: EtcdErrorCode, message: string) {
    super(code, 'EtcdError', message, ErrorLevel.Unexpected, {});
    Object.setPrototypeOf(this, EtcdError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}


export {EtcdError};
