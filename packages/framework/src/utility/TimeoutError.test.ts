import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {ExError} from './ExError.js';
import {TimeoutError} from './TimeoutError.js';

describe('TimeoutError', () => {
  it('should have correct code and name', () => {
    const err = new TimeoutError();
    expect(err.code).toBe('ERR_TIMEOUT');
    expect(err.name).toBe('TimeoutError');
    expect(err.message).toBe('timeout');
  });

  it('should be instance of ExError and Error', () => {
    const err = new TimeoutError();
    expect(err instanceof ExError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});
