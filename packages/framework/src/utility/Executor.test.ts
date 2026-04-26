import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {MockScope} from '../test/tools/mock/MockScope.js';
import {Executor} from './Executor.js';

describe('Executor', () => {
  it('should track in-flight promises', async () => {
    const executor = new Executor(new MockScope());
    executor.start();
    let resolved = false;
    const p = executor.doJob(async () => {
      await new Promise((r) => setTimeout(r, 50));
      resolved = true;
      return 'done';
    });
    expect(executor.isIdle).toBe(false);
    expect(await p).toBe('done');
    expect(resolved).toBe(true);
    expect(executor.isIdle).toBe(true);
  });

  it('should wait for all jobs on stop', async () => {
    const executor = new Executor(new MockScope());
    executor.start();
    const order: string[] = [];
    void executor.doJob(async () => {
      await new Promise((r) => setTimeout(r, 30));
      order.push('job1');
    });
    void executor.doJob(async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push('job2');
    });
    await executor.stop();
    expect(order).toEqual(['job1', 'job2']);
    expect(executor.isIdle).toBe(true);
  });

  it('should not accept new jobs after stop', async () => {
    const executor = new Executor(new MockScope());
    executor.start();
    const result = await executor.doJob(async () => 'first');
    expect(result).toBe('first');
    await executor.stop();
    const result2 = await executor.doJob(async () => 'second');
    expect(result2).toBeUndefined();
  });
});
