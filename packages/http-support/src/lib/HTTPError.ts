import {ErrorLevel, ExError} from '@sora-soft/framework';

import {type HTTPErrorCode} from './HTTPErrorCode.js';

class HTTPError extends ExError {
  constructor(code: HTTPErrorCode, message: string) {
    super(code, 'HTTPError', message, ErrorLevel.Unexpected, {});
    Object.setPrototypeOf(this, HTTPError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export {HTTPError};
