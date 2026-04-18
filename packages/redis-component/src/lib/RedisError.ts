import {ErrorLevel, ExError} from '@sora-soft/framework';

class RedisError extends ExError {
  constructor(code: string, message: string) {
    super(code, 'RedisError', message, ErrorLevel.Unexpected, {});
    Object.setPrototypeOf(this, RedisError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export {RedisError};
