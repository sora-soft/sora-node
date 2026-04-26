import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {ErrorLevel, ExError} from '../../utility/ExError.js';
import {ConnectorError} from './ConnectorError.js';
import {RouteError} from './RouteError.js';
import {RPCError, RPCResponseError} from './RPCError.js';

describe('RPCError', () => {
  it('should have correct code and name', () => {
    const err = new RPCError('ERR_CODE', 'test message');
    expect(err.code).toBe('ERR_CODE');
    expect(err.name).toBe('RPCError');
    expect(err.message).toBe('test message');
  });

  it('should extend ExError', () => {
    const err = new RPCError('ERR', 'msg');
    expect(err).toBeInstanceOf(ExError);
    expect(err).toBeInstanceOf(Error);
  });

  it('should have Unexpected error level', () => {
    const err = new RPCError('ERR', 'msg');
    expect(err.level).toBe(ErrorLevel.Unexpected);
  });
});

describe('RPCResponseError', () => {
  it('should construct from payload error', () => {
    const err = new RPCResponseError({
      code: 'REMOTE_ERR',
      message: 'remote error',
      level: ErrorLevel.Unexpected,
      name: 'RemoteError',
      args: {},
    }, 'someMethod');
    expect(err.code).toBe('REMOTE_ERR');
    expect(err.name).toBe('RPCResponseError');
    expect(err.level).toBe(ErrorLevel.Unexpected);
    expect(err.args).toEqual({method: 'someMethod'});
  });
});

describe('RouteError', () => {
  it('should have correct code and name', () => {
    const err = new RouteError('ROUTE_ERR', 'not found', ErrorLevel.Expected);
    expect(err.code).toBe('ROUTE_ERR');
    expect(err.name).toBe('RouteError');
    expect(err.level).toBe(ErrorLevel.Expected);
  });

  it('should extend ExError', () => {
    const err = new RouteError('ERR', 'msg', ErrorLevel.Unexpected);
    expect(err).toBeInstanceOf(ExError);
  });
});

describe('ConnectorError', () => {
  it('should have correct code and name', () => {
    const err = new ConnectorError('CONN_ERR', 'disconnected', ErrorLevel.Unexpected);
    expect(err.code).toBe('CONN_ERR');
    expect(err.name).toBe('ConnectorError');
    expect(err.level).toBe(ErrorLevel.Unexpected);
  });

  it('should extend ExError', () => {
    const err = new ConnectorError('ERR', 'msg', ErrorLevel.Unexpected);
    expect(err).toBeInstanceOf(ExError);
  });
});
