import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {TimeoutError} from './TimeoutError.js';
import {Waiter} from './Waiter.js';

describe('Waiter', () => {
  it('should resolve on emit', async () => {
    const waiter = new Waiter<string>();
    const {id, promise} = waiter.wait();
    waiter.emit(id, 'hello');
    expect(await promise).toBe('hello');
  });

  it('should reject on emitError', async () => {
    const waiter = new Waiter();
    const {id, promise} = waiter.wait();
    const err = new Error('test error');
    waiter.emitError(id, err);
    await expect(promise).rejects.toThrow('test error');
  });

  it('should reject on TTL timeout', async () => {
    const waiter = new Waiter();
    const {promise} = waiter.wait(50);
    await expect(promise).rejects.toThrow(TimeoutError);
  });

  it('should not reject after emit within TTL', async () => {
    const waiter = new Waiter<string>();
    const {id, promise} = waiter.wait(1000);
    waiter.emit(id, 'result');
    expect(await promise).toBe('result');
  });

  it('should handle multiple waits independently', async () => {
    const waiter = new Waiter<number>();
    const w1 = waiter.wait();
    const w2 = waiter.wait();
    const w3 = waiter.wait();
    waiter.emit(w2.id, 2);
    expect(await w2.promise).toBe(2);
    waiter.emit(w1.id, 1);
    expect(await w1.promise).toBe(1);
    waiter.emit(w3.id, 3);
    expect(await w3.promise).toBe(3);
  });

  it('should clear all pending waits', () => {
    const waiter = new Waiter();
    waiter.wait();
    waiter.wait();
    waiter.clear();
  });

  it('should waitForAll to resolve when all waits are emitted', async () => {
    const waiter = new Waiter<void>();
    const w1 = waiter.wait();
    const w2 = waiter.wait();
    const allDone = waiter.waitForAll(1000);
    waiter.emit(w1.id);
    waiter.emit(w2.id);
    await allDone;
  });

  it('should return unique IDs', () => {
    const waiter = new Waiter();
    const ids = new Set<number>();
    for (let i = 0; i < 10; i++) {
      ids.add(waiter.wait().id);
    }
    expect(ids.size).toBe(10);
  });
});
