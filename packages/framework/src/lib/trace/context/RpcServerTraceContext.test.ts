import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {RpcServerTraceContext} from './RpcServerTraceContext.js';

describe('RpcServerTraceContext', () => {
  it('should parse valid traceparent header', () => {
    const ctx = RpcServerTraceContext.create('00-0123456789abcdef0123456789abcdef-abcdef0123456789-01');
    expect(ctx.traceId).toBe('0123456789abcdef0123456789abcdef');
    expect(ctx.parentSpanId).toBe('abcdef0123456789');
    expect(ctx.spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it('should parse tracestate header', () => {
    const ctx = RpcServerTraceContext.create(
      '00-0123456789abcdef0123456789abcdef-abcdef0123456789-01',
      'vendor=value'
    );
    expect(ctx.traceState.get('vendor')).toBe('value');
  });

  it('should create root when no traceparent', () => {
    const ctx = RpcServerTraceContext.create();
    expect(ctx.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(ctx.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it('should create root for undefined traceparent', () => {
    const ctx = RpcServerTraceContext.create(undefined);
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it('should reject invalid traceparent format', () => {
    const ctx = RpcServerTraceContext.create('invalid-header');
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it('should reject wrong version', () => {
    const ctx = RpcServerTraceContext.create('01-0123456789abcdef0123456789abcdef-abcdef0123456789-01');
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it('should reject too-short traceId', () => {
    const ctx = RpcServerTraceContext.create('00-0123456789abcdef-abcdef0123456789-01');
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it('should reject too-short spanId', () => {
    const ctx = RpcServerTraceContext.create('00-0123456789abcdef0123456789abcdef-abcdef-01');
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it('should reject invalid traceId (all zeros)', () => {
    const ctx = RpcServerTraceContext.create('00-00000000000000000000000000000000-abcdef0123456789-01');
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it('should reject invalid parentSpanId (all zeros)', () => {
    const ctx = RpcServerTraceContext.create('00-0123456789abcdef0123456789abcdef-0000000000000000-01');
    expect(ctx.parentSpanId).toBeUndefined();
  });

  it('should parse flags from header', () => {
    const ctx0 = RpcServerTraceContext.create('00-0123456789abcdef0123456789abcdef-abcdef0123456789-00');
    expect(ctx0.flags).toBe(0);

    const ctx1 = RpcServerTraceContext.create('00-0123456789abcdef0123456789abcdef-abcdef0123456789-01');
    expect(ctx1.flags).toBe(1);
  });
});
