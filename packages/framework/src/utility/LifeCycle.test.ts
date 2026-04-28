import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {LifeCycle} from './LifeCycle.js';
import {TimeoutError} from './TimeoutError.js';

describe('LifeCycle', () => {
  it('should initialize with given state', () => {
    const lc = new LifeCycle(1 as number, false);
    expect(lc.state).toBe(1);
  });

  it('should transition to new state', () => {
    const lc = new LifeCycle(1 as number, false);
    lc.setState(2);
    expect(lc.state).toBe(2);
  });

  it('should not emit on same state', () => {
    const lc = new LifeCycle(1 as number, false);
    const states: number[] = [];
    lc.stateSubject.subscribe((s) => states.push(s));
    lc.setState(1);
    expect(states.length).toBe(1);
    expect(states[0]).toBe(1);
  });

  it('should notify subscribers on state change', () => {
    const lc = new LifeCycle(1 as number, false);
    const states: number[] = [];
    lc.stateSubject.subscribe((s) => states.push(s));
    lc.setState(2);
    lc.setState(3);
    expect(states).toEqual([1, 2, 3]);
  });

  it('should throw on backtrack when not backTrackable', () => {
    const lc = new LifeCycle(3 as number, false);
    expect(() => lc.setState(1)).toThrow();
  });

  it('should allow backtrack when backTrackable', () => {
    const lc = new LifeCycle(3 as number, true);
    lc.setState(1);
    expect(lc.state).toBe(1);
  });

  describe('waitFor', () => {
    it('should resolve immediately when state already matches target', async () => {
      const lc = new LifeCycle(3 as number, false);
      await lc.waitFor(3, 1000);
    });

    it('should resolve when state is reached later', async () => {
      const lc = new LifeCycle(1 as number, false);
      setTimeout(() => lc.setState(3), 10);
      await lc.waitFor(3, 1000);
      expect(lc.state).toBe(3);
    });

    it('should reject with TimeoutError when state not reached', async () => {
      const lc = new LifeCycle(1 as number, false);
      await expect(lc.waitFor(3, 50)).rejects.toThrow(TimeoutError);
    });
  });

  describe('destroy', () => {
    it('should complete the subject', () => {
      const lc = new LifeCycle(1 as number, false);
      let completed = false;
      lc.stateSubject.subscribe({complete: () => completed = true});
      lc.destroy();
      expect(completed).toBe(true);
    });
  });
});
