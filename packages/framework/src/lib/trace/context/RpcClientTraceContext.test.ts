import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {Trace} from '../Trace.js';
import {InnerTraceContext} from './InnerTraceContext.js';
import {RpcClientTraceContext} from './RpcClientTraceContext.js';

describe('RpcClientTraceContext', () => {
  it('should inherit current trace', () => {
    const parent = new InnerTraceContext();
    Trace.run(parent, () => {
      const clientCtx = RpcClientTraceContext.create();
      expect(clientCtx.traceId).toBe(parent.traceId);
      expect(clientCtx.parentSpanId).toBe(parent.spanId);
      expect(clientCtx.spanId).not.toBe(parent.spanId);
    });
  });

  it('should create root when no current trace', () => {
    const ctx = RpcClientTraceContext.create();
    expect(ctx.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(ctx.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it('should inherit flags from parent', () => {
    const parent = new InnerTraceContext();
    Trace.run(parent, () => {
      const clientCtx = RpcClientTraceContext.create();
      expect(clientCtx.flags).toBe(parent.flags);
    });
  });

  it('should inherit tracestate from parent', () => {
    const parent = new InnerTraceContext(undefined, undefined, undefined, 'vendor=data');
    Trace.run(parent, () => {
      const clientCtx = RpcClientTraceContext.create();
      expect(clientCtx.traceState.get('vendor')).toBe('data');
    });
  });
});
