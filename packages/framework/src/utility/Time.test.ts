import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {Time} from './Time.js';

describe('Time', () => {
  it('should resolve after timeout', async () => {
    const start = Date.now();
    await Time.timeout(50);
    expect(Date.now() - start >= 40).toBe(true);
  });

  it('should reject with AbortSignal', async () => {
    const controller = new AbortController();
    const promise = Time.timeout(5000, controller.signal);
    setTimeout(() => controller.abort(), 10);
    await expect(promise).rejects.toThrow('aborted');
  });
});
