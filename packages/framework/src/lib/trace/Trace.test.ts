import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {Trace} from './Trace.js';
import {TraceContext} from './TraceContext.js';

class TestTraceContext extends TraceContext {}

describe('Trace', () => {
  it('should return undefined when no trace context set', () => {
    expect(Trace.current()).toBeUndefined();
  });

  it('should set context inside run()', () => {
    const ctx = new TestTraceContext();
    Trace.run(ctx, () => {
      expect(Trace.current()).toBe(ctx);
    });
  });

  it('should restore undefined after run()', () => {
    const ctx = new TestTraceContext();
    Trace.run(ctx, () => {
      expect(Trace.current()).toBe(ctx);
    });
    expect(Trace.current()).toBeUndefined();
  });

  it('should support nested traces without losing outer', () => {
    const outer = new TestTraceContext();
    const inner = new TestTraceContext();
    Trace.run(outer, () => {
      expect(Trace.current()).toBe(outer);
      Trace.run(inner, () => {
        expect(Trace.current()).toBe(inner);
      });
      expect(Trace.current()).toBe(outer);
    });
    expect(Trace.current()).toBeUndefined();
  });

  it('should support deeply nested traces', () => {
    const ctx1 = new TestTraceContext();
    const ctx2 = new TestTraceContext();
    const ctx3 = new TestTraceContext();
    Trace.run(ctx1, () => {
      Trace.run(ctx2, () => {
        Trace.run(ctx3, () => {
          expect(Trace.current()).toBe(ctx3);
        });
        expect(Trace.current()).toBe(ctx2);
      });
      expect(Trace.current()).toBe(ctx1);
    });
  });
});
