import {invalidSpanId, invalidTraceId, TraceContext} from '../TraceContext.js';

export class RpcServerTraceContext extends TraceContext {
  static create(traceParent?: string, traceState?: string) {
    if (!traceParent)
      return new RpcServerTraceContext();

    // W3C 官方推荐的严格正则校验
    const traceParentRegex = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;
    const match = traceParent.match(traceParentRegex);

    if (!match)
      return new RpcServerTraceContext();

    const [, traceId, parentSpanId, traceFlags] = match;
    if (traceId === invalidTraceId || parentSpanId === invalidSpanId) {
      return new RpcServerTraceContext();
    }

    const flags = parseInt(traceFlags, 16);

    return new RpcServerTraceContext(traceId, parentSpanId, flags, traceState);
  }
}
