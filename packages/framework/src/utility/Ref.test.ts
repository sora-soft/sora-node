import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {Ref} from './Ref.js';

describe('Ref', () => {
  it('should start at 0', () => {
    const ref = new Ref();
    expect(ref.count).toBe(0);
  });

  it('should increment on add', () => {
    const ref = new Ref();
    ref.add();
    expect(ref.count).toBe(1);
    ref.add();
    expect(ref.count).toBe(2);
  });

  it('should decrement on minus', () => {
    const ref = new Ref();
    ref.add();
    ref.add();
    ref.minus();
    expect(ref.count).toBe(1);
  });

  it('should throw on negative count', () => {
    const ref = new Ref();
    expect(() => ref.minus()).toThrow();
  });

  it('should set value directly', () => {
    const ref = new Ref();
    ref.set(5);
    expect(ref.count).toBe(5);
  });

  it('should support waitFor after concurrent add', async () => {
    const ref = new Ref();
    const p = ref.waitFor(3);
    ref.add();
    ref.add();
    ref.add();
    await p;
    expect(ref.count).toBe(3);
  });

  it('should waitFor target value', async () => {
    const ref = new Ref();
    setTimeout(() => { ref.add(); ref.add(); ref.add(); }, 10);
    await ref.waitFor(3);
    expect(ref.count).toBe(3);
  });

  it('should resolve waitFor immediately if already at target', async () => {
    const ref = new Ref();
    ref.add();
    ref.add();
    await ref.waitFor(2);
  });
});
