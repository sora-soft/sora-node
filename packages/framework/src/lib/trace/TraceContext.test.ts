import 'reflect-metadata';

import {describe, expect, it, vi} from 'vitest';

import {Trace} from './Trace.js';
import {invalidSpanId, invalidTraceId, TraceContext, TraceFlag, TraceState} from './TraceContext.js';

class TestTraceContext extends TraceContext {}

describe('TraceContext', () => {
  describe('IDs', () => {
    it('should generate 32-char hex traceId', () => {
      const ctx = new TestTraceContext();
      expect(ctx.traceId).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should generate 16-char hex spanId', () => {
      const ctx = new TestTraceContext();
      expect(ctx.spanId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should not generate invalid traceId', () => {
      for (let i = 0; i < 50; i++) {
        const ctx = new TestTraceContext();
        expect(ctx.traceId).not.toBe(invalidTraceId);
      }
    });

    it('should not generate invalid spanId', () => {
      for (let i = 0; i < 50; i++) {
        const ctx = new TestTraceContext();
        expect(ctx.spanId).not.toBe(invalidSpanId);
      }
    });

    it('should accept custom traceId', () => {
      const ctx = new TestTraceContext('0123456789abcdef0123456789abcdef', undefined, undefined);
      expect(ctx.traceId).toBe('0123456789abcdef0123456789abcdef');
    });

    it('should accept parentSpanId', () => {
      const parentSpanId = 'abcdef0123456789';
      const ctx = new TestTraceContext(undefined, parentSpanId, undefined);
      expect(ctx.parentSpanId).toBe(parentSpanId);
    });

    it('should inherit from current trace when no args', () => {
      const parent = new TestTraceContext();
      Trace.run(parent, () => {
        const child = new TestTraceContext();
        expect(child.traceId).toBe(parent.traceId);
        expect(child.parentSpanId).toBe(parent.spanId);
      });
    });

    it('should generate root trace when no current trace and no args', () => {
      const ctx = new TestTraceContext();
      expect(ctx.traceId).toBeDefined();
      expect(ctx.spanId).toBeDefined();
      expect(ctx.parentSpanId).toBeUndefined();
    });
  });

  describe('traceparent W3C format', () => {
    it('should produce valid traceparent header', () => {
      const ctx = new TestTraceContext();
      const header = ctx.toRPCTraceParentHeader();
      expect(header).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/);
    });

    it('should include correct traceId and flags in traceparent', () => {
      const ctx = new TestTraceContext('0123456789abcdef0123456789abcdef', 'abcdef0123456789', TraceFlag.Sampled);
      const header = ctx.toRPCTraceParentHeader();
      expect(header).toBe(`00-0123456789abcdef0123456789abcdef-${ctx.spanId}-01`);
    });

    it('should format flags as 2-digit hex', () => {
      const ctx = new TestTraceContext(undefined, undefined, TraceFlag.NotSampled);
      const header = ctx.toRPCTraceParentHeader();
      expect(header).toMatch(/-00$/);
    });
  });

  describe('tracestate', () => {
    it('should serialize empty tracestate', () => {
      const ctx = new TestTraceContext();
      expect(ctx.toRPCTraceStateHeader()).toBe('');
    });

    it('should preserve tracestate from header', () => {
      const ctx = new TestTraceContext(undefined, undefined, undefined, 'vendor=value');
      expect(ctx.traceState.get('vendor')).toBe('value');
    });
  });

  describe('flags', () => {
    it('should default to Sampled', () => {
      const ctx = new TestTraceContext();
      expect(ctx.flags).toBe(TraceFlag.Sampled);
    });

    it('should accept custom flags', () => {
      const ctx = new TestTraceContext(undefined, undefined, TraceFlag.NotSampled);
      expect(ctx.flags).toBe(TraceFlag.NotSampled);
    });

    it('should allow setting flags', () => {
      const ctx = new TestTraceContext();
      ctx.flags = TraceFlag.NotSampled;
      expect(ctx.flags).toBe(TraceFlag.NotSampled);
    });
  });

  describe('duration', () => {
    it('should record start and end times', () => {
      const ctx = new TestTraceContext();
      Trace.run(ctx, () => {
        expect(ctx.startNanoTime).toBeGreaterThan(0n);
        expect(ctx.endNanoTime).toBe(0n);
      });
      expect(ctx.endNanoTime).toBeGreaterThan(0n);
      expect(ctx.finished).toBe(true);
    });

    it('should have positive duration', () => {
      const ctx = new TestTraceContext();
      Trace.run(ctx, () => {});
      expect(ctx.endNanoTime).toBeGreaterThanOrEqual(ctx.startNanoTime);
    });
  });

  describe('run() AsyncLocalStorage propagation', () => {
    it('should make context available via Trace.current()', () => {
      const ctx = new TestTraceContext();
      Trace.run(ctx, () => {
        expect(Trace.current()).toBe(ctx);
      });
    });
  });

  describe('diagnostics_channel', () => {
    it('should publish start event', () => {
      const handler = vi.fn();
      TraceContext.startChannel.subscribe(handler);
      const ctx = new TestTraceContext();
      Trace.run(ctx, () => {});
      TraceContext.startChannel.unsubscribe(handler);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toBe(ctx);
    });

    it('should publish end event', () => {
      const handler = vi.fn();
      TraceContext.endChannel.subscribe(handler);
      const ctx = new TestTraceContext();
      Trace.run(ctx, () => {});
      TraceContext.endChannel.unsubscribe(handler);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toBe(ctx);
    });

    it('should publish end event on async rejection', async () => {
      const handler = vi.fn();
      TraceContext.endChannel.subscribe(handler);
      const ctx = new TestTraceContext();
      const promise = Trace.run(ctx, async () => {
        throw new Error('test');
      });
      await expect(promise).rejects.toThrow('test');
      TraceContext.endChannel.unsubscribe(handler);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toBe(ctx);
      expect(ctx.error).toBeDefined();
    });
  });

  describe('attribute', () => {
    it('should support attribute map', () => {
      const ctx = new TestTraceContext();
      ctx.attribute.set('key', 'value');
      expect(ctx.attribute.get('key')).toBe('value');
    });
  });
});

describe('TraceState', () => {
  it('should parse header value', () => {
    const state = new TraceState('vendor1=val1,vendor2=val2');
    expect(state.get('vendor1')).toBe('val1');
    expect(state.get('vendor2')).toBe('val2');
  });

  it('should serialize to header format', () => {
    const state = new TraceState();
    state.set('vendor1', 'val1');
    state.set('vendor2', 'val2');
    expect(state.serialize()).toBe('vendor2=val2,vendor1=val1');
  });

  it('should remove key', () => {
    const state = new TraceState('vendor1=val1');
    state.remove('vendor1');
    expect(state.get('vendor1')).toBeUndefined();
  });

  it('should update existing key (move to front)', () => {
    const state = new TraceState('a=1,b=2');
    state.set('a', '3');
    expect(state.get('a')).toBe('3');
    const serialized = state.serialize();
    expect(serialized.indexOf('a=3')).toBeLessThan(serialized.indexOf('b=2'));
  });

  it('should limit to 32 key-value pairs', () => {
    const state = new TraceState();
    for (let i = 0; i < 40; i++) {
      state.set(`k${i}`, `v${i}`);
    }
    const serialized = state.serialize();
    const pairs = serialized.split(',');
    expect(pairs.length).toBe(32);
  });

  it('should report isEmpty', () => {
    const state = new TraceState();
    expect(state.isEmpty()).toBe(true);
    state.set('k', 'v');
    expect(state.isEmpty()).toBe(false);
  });

  it('should handle empty header', () => {
    const state = new TraceState('');
    expect(state.isEmpty()).toBe(true);
  });

  it('should skip malformed pairs', () => {
    const state = new TraceState('good=value,badpair,also=good');
    expect(state.get('good')).toBe('value');
    expect(state.get('also')).toBe('good');
  });
});
