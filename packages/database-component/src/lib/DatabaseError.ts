import {ErrorLevel, ExError} from '@sora-soft/framework';


class DatabaseError extends ExError {
  constructor(code: string, message: string) {
    super(code, 'DatabaseError', message, ErrorLevel.Unexpected, {});
    Object.setPrototypeOf(this, DatabaseError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export {DatabaseError};
