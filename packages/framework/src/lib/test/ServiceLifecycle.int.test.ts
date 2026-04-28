import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {WorkerState} from '../../Enum.js';
import type {IWorkerOptions} from '../../interface/config.js';
import {Worker} from '../Worker.js';

class TestWorker extends Worker {
  shouldFail = false;
  shutdownCalled = false;
  shutdownDelay = 0;

  constructor(name = 'test-worker') {
    super(name, {alias: 'test'} as IWorkerOptions);
  }

  protected async startup() {
    if (this.shouldFail) throw new Error('startup failed');
  }

  protected async shutdown() {
    if (this.shutdownDelay) {
      await new Promise(r => setTimeout(r, this.shutdownDelay));
    }
    this.shutdownCalled = true;
  }
}

class IntervalWorker extends Worker {
  jobCount = 0;

  constructor() {
    super('interval-worker', {alias: 'test'} as IWorkerOptions);
  }

  protected async startup() {
    void this.doJobInterval(async () => {
      this.jobCount++;
    }, 50);
  }

  protected async shutdown() {}
}

describe('ServiceLifecycle', () => {
  it('should transition Init→Pending→Ready on start', async () => {
    const worker = new TestWorker();
    expect(worker.state).toBe(WorkerState.Init);

    await worker.start();
    expect(worker.state).toBe(WorkerState.Ready);
  });

  it('should transition Ready→Stopping→Stopped on stop', async () => {
    const worker = new TestWorker();
    await worker.start();

    await worker.stop('test');
    expect(worker.state).toBe(WorkerState.Stopped);
    expect(worker.shutdownCalled).toBe(true);
  });

  it('should enter Error state on startup failure', async () => {
    const worker = new TestWorker();
    worker.shouldFail = true;

    await expect(worker.start()).rejects.toThrow('startup failed');
    expect(worker.state).toBe(WorkerState.Error);
  });

  it('should wait for shutdown to complete before Stopped', async () => {
    const worker = new TestWorker();
    await worker.start();
    worker.shutdownDelay = 100;

    const stopPromise = worker.stop('test');
    expect(worker.state).toBe(WorkerState.Stopping);

    await stopPromise;
    expect(worker.state).toBe(WorkerState.Stopped);
    expect(worker.shutdownCalled).toBe(true);
  });

  it('should stop doJobInterval after shutdown', async () => {
    const worker = new IntervalWorker();
    await worker.start();

    await new Promise(r => setTimeout(r, 180));
    const countBeforeStop = worker.jobCount;
    expect(countBeforeStop).toBeGreaterThanOrEqual(2);

    await worker.stop('test');
    const countAfterStop = worker.jobCount;

    await new Promise(r => setTimeout(r, 120));
    expect(worker.jobCount).toBe(countAfterStop);
  });
});
