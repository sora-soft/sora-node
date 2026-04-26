import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {ErrorTracer} from './ErrorTracer.js';

class TestClass {
  @ErrorTracer.trace
  async failingMethod(): Promise<void> {
    throw new Error('inner error');
  }

  @ErrorTracer.trace
  syncMethod(): string {
    return 'ok';
  }
}

describe('ErrorTracer', () => {
  it('should enrich async error stack trace', async () => {
    const instance = new TestClass();
    try {
      await instance.failingMethod();
      expect.fail('should have thrown');
    } catch (err: any) {
      expect(err instanceof Error).toBe(true);
      expect(err.message).toBe('inner error');
      expect(err.stack).toBeTruthy();
    }
  });

  it('should not affect sync methods', () => {
    const instance = new TestClass();
    expect(instance.syncMethod()).toBe('ok');
  });
});
