import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {Timer} from './Timer.js';

describe('Timer', () => {
  it('should resolve after timeout', async () => {
    const timer = new Timer();
    const start = Date.now();
    await timer.timeout(50);
    expect(Date.now() - start >= 40).toBe(true);
  });

  it('should clear all timers', async () => {
    const timer = new Timer();
    let resolved = false;
    void timer.timeout(200).then(() => { resolved = true; });
    timer.clearAll();
    await new Promise((r) => setTimeout(r, 250));
    expect(resolved).toBe(false);
  });
});
