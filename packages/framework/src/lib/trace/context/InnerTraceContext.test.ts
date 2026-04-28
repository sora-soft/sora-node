import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {Trace} from '../Trace.js';
import {InnerTraceContext} from './InnerTraceContext.js';

describe('InnerTraceContext', () => {
  it('should create child from current trace', () => {
    const parent = new InnerTraceContext();
    Trace.run(parent, () => {
      const child = InnerTraceContext.create();
      expect(child.traceId).toBe(parent.traceId);
      expect(child.parentSpanId).toBe(parent.spanId);
      expect(child.spanId).not.toBe(parent.spanId);
    });
  });

  it('should create root when no current trace', () => {
    const ctx = InnerTraceContext.create();
    expect(ctx.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(ctx.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it('should inherit flags from parent', () => {
    const parent = new InnerTraceContext();
    Trace.run(parent, () => {
      const child = InnerTraceContext.create();
      expect(child.flags).toBe(parent.flags);
    });
  });

  it('should inherit tracestate from parent', () => {
    const parent = new InnerTraceContext(undefined, undefined, undefined, 'vendor=val');
    Trace.run(parent, () => {
      const child = InnerTraceContext.create();
      expect(child.traceState.get('vendor')).toBe('val');
    });
  });

  it('should work with multiple nesting levels', () => {
    const root = new InnerTraceContext();
    Trace.run(root, () => {
      const level1 = InnerTraceContext.create();
      Trace.run(level1, () => {
        const level2 = InnerTraceContext.create();
        expect(level2.traceId).toBe(root.traceId);
        expect(level2.parentSpanId).toBe(level1.spanId);
      });
    });
  });
});
