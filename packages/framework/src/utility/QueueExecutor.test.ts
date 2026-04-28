import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {MockScope} from '../test/tools/mock/MockScope.js';
import {QueueExecutor} from './QueueExecutor.js';

describe('QueueExecutor', () => {
  it('should execute jobs in order', async () => {
    const executor = new QueueExecutor(new MockScope());
    executor.start();
    const order: number[] = [];
    const p1 = executor.doJob(async () => { order.push(1); });
    const p2 = executor.doJob(async () => { order.push(2); });
    const p3 = executor.doJob(async () => { order.push(3); });
    await Promise.all([p1, p2, p3]);
    expect(order).toEqual([1, 2, 3]);
  });

  it('should resolve each job with its result', async () => {
    const executor = new QueueExecutor(new MockScope());
    executor.start();
    const p1 = executor.doJob(async () => 'a');
    const p2 = executor.doJob(async () => 'b');
    expect(await p1).toBe('a');
    expect(await p2).toBe('b');
  });

  it('should stop and wait for current job to finish', async () => {
    const executor = new QueueExecutor(new MockScope());
    executor.start();
    let jobDone = false;
    void executor.doJob(async () => {
      await new Promise((r) => setTimeout(r, 50));
      jobDone = true;
    });
    await executor.stop();
    expect(jobDone).toBe(true);
    expect(executor.isIdle).toBe(true);
  });

  it('should not execute error job as result', async () => {
    const executor = new QueueExecutor(new MockScope());
    executor.start();
    const p1 = executor.doJob(async () => { throw new Error('job error'); });
    await expect(p1).rejects.toThrow('job error');
  });

  it('should continue queue after error', async () => {
    const executor = new QueueExecutor(new MockScope());
    executor.start();
    const p1 = executor.doJob(async () => { throw new Error('fail'); });
    const p2 = executor.doJob(async () => 'ok');
    await expect(p1).rejects.toThrow();
    expect(await p2).toBe('ok');
  });

  it('should report isIdle when no jobs running', async () => {
    const executor = new QueueExecutor(new MockScope());
    executor.start();
    expect(executor.isIdle).toBe(true);
    await executor.doJob(async () => {});
    expect(executor.isIdle).toBe(true);
  });
});
