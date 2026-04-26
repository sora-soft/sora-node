import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {FrameworkErrorCode} from '../ErrorCode.js';
import {ExError} from './ExError.js';
import {FrameworkError} from './FrameworkError.js';

describe('FrameworkError', () => {
  it('should have correct code and name', () => {
    const err = new FrameworkError(FrameworkErrorCode.ErrServiceNotFound, 'service not found');
    expect(err.code).toBe(FrameworkErrorCode.ErrServiceNotFound);
    expect(err.name).toBe('FrameworkError');
    expect(err.message).toBe('service not found');
  });

  it('should be instance of ExError and Error', () => {
    const err = new FrameworkError(FrameworkErrorCode.ErrFrameworkUnknown, 'unknown');
    expect(err instanceof ExError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('should support custom args', () => {
    const err = new FrameworkError(FrameworkErrorCode.ErrWorkerNotFound, 'not found', {workerName: 'test'});
    expect(err.args).toEqual({workerName: 'test'});
  });

  it('should default args to empty object', () => {
    const err = new FrameworkError(FrameworkErrorCode.ErrFrameworkUnknown, 'msg');
    expect(err.args).toEqual({});
  });
});
