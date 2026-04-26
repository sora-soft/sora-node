import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {RetryEvent} from '../Event.js';
import {Retry, RetryError} from './Retry.js';

describe('Retry', () => {
  it('should return result on first success', async () => {
    const retry = new Retry(async () => 42, {
      maxRetryTimes: 3,
      incrementInterval: false,
      intervalMS: 10,
    });
    expect(await retry.doJob()).toBe(42);
  });

  it('should retry on failure and eventually succeed', async () => {
    let attempt = 0;
    const retry = new Retry(async () => {
      attempt++;
      if (attempt < 3) throw new Error('fail');
      return 'ok';
    }, {
      maxRetryTimes: 3,
      incrementInterval: false,
      intervalMS: 10,
    });
    expect(await retry.doJob()).toBe('ok');
    expect(attempt).toBe(3);
  });

  it('should throw RetryError when max retries exceeded', async () => {
    const retry = new Retry(async () => { throw new Error('always fail'); }, {
      maxRetryTimes: 2,
      incrementInterval: false,
      intervalMS: 10,
    });
    await expect(retry.doJob()).rejects.toThrow(RetryError);
  });

  it('should emit Error event on each retry', async () => {
    const errors: Error[] = [];
    let attempt = 0;
    const retry = new Retry(async () => {
      attempt++;
      if (attempt < 3) throw new Error('fail');
      return 'ok';
    }, {
      maxRetryTimes: 3,
      incrementInterval: false,
      intervalMS: 10,
    });
    retry.errorEmitter.on(RetryEvent.Error, (err) => errors.push(err));
    await retry.doJob();
    expect(errors.length).toBe(2);
    expect(errors[0].message).toBe('fail');
  });

  it('should emit MaxRetryTime event when max retries exceeded', async () => {
    let maxRetryFired = false;
    const retry = new Retry(async () => { throw new Error('fail'); }, {
      maxRetryTimes: 2,
      incrementInterval: false,
      intervalMS: 10,
    });
    retry.errorEmitter.on(RetryEvent.MaxRetryTime, () => { maxRetryFired = true; });
    try {
      await retry.doJob();
    } catch {}
    expect(maxRetryFired).toBe(true);
  });

  it('should increment interval when incrementInterval is true', async () => {
    const intervals: number[] = [];
    let attempt = 0;
    const retry = new Retry(async () => {
      attempt++;
      if (attempt < 3) throw new Error('fail');
      return 'ok';
    }, {
      maxRetryTimes: 5,
      incrementInterval: true,
      minIntervalMS: 10,
      maxRetryIntervalMS: 100,
    });
    retry.errorEmitter.on(RetryEvent.Error, (_, nextRetry) => intervals.push(nextRetry));
    await retry.doJob();
    expect(intervals.length).toBe(2);
    expect(intervals[1] >= intervals[0], `expected incrementing intervals: ${intervals}`).toBe(true);
  });
});
