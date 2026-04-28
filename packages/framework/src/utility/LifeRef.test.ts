import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {LifeRef} from './LifeRef.js';

describe('LifeRef', () => {
  it('should call start callback on 0→1', async () => {
    const ref = new LifeRef();
    let started = false;
    await ref.add(async () => { started = true; });
    expect(started).toBe(true);
    expect(ref.count).toBe(1);
  });

  it('should not call start callback again on subsequent add', async () => {
    const ref = new LifeRef();
    let startCount = 0;
    await ref.add(async () => { startCount++; });
    await ref.add(async () => { startCount++; });
    expect(startCount).toBe(1);
    expect(ref.count).toBe(2);
  });

  it('should call stop callback on 1→0', async () => {
    const ref = new LifeRef();
    let stopped = false;
    await ref.add(async () => {});
    await ref.minus(async () => { stopped = true; });
    expect(stopped).toBe(true);
    expect(ref.count).toBe(0);
  });

  it('should not call stop callback until count reaches 0', async () => {
    const ref = new LifeRef();
    let stopCount = 0;
    await ref.add(async () => {});
    await ref.add(async () => {});
    await ref.minus(async () => { stopCount++; });
    expect(stopCount).toBe(0);
    expect(ref.count).toBe(1);
    await ref.minus(async () => { stopCount++; });
    expect(stopCount).toBe(1);
    expect(ref.count).toBe(0);
  });

  it('should throw on negative count', async () => {
    const ref = new LifeRef();
    await expect(ref.minus(async () => {})).rejects.toThrow();
  });

  it('should waitFor target count', async () => {
    const ref = new LifeRef();
    setTimeout(async () => { await ref.add(async () => {}); }, 10);
    await ref.waitFor(1);
    expect(ref.count).toBe(1);
  });
});
