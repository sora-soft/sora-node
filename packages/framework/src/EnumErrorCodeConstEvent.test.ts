import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {DiagnosticsChannel, RPCHeader} from './Const.js';
import {ConnectorCommand, ConnectorState, ListenerState, OPCode, WorkerState} from './Enum.js';
import {FrameworkErrorCode, RetryErrorCode, RPCErrorCode, TCPErrorCode, TraceErrorCode} from './ErrorCode.js';
import {RetryEvent} from './Event.js';

describe('Enum completeness', () => {
  describe('WorkerState', () => {
    it('should have all expected values', () => {
      expect(WorkerState.Init).toBe(1);
      expect(WorkerState.Pending).toBe(2);
      expect(WorkerState.Ready).toBe(3);
      expect(WorkerState.Stopping).toBe(4);
      expect(WorkerState.Stopped).toBe(5);
      expect(WorkerState.Error).toBe(100);
    });
  });

  describe('ListenerState', () => {
    it('should have all expected values', () => {
      expect(ListenerState.Init).toBe(1);
      expect(ListenerState.Pending).toBe(2);
      expect(ListenerState.Ready).toBe(3);
      expect(ListenerState.Stopping).toBe(4);
      expect(ListenerState.Stopped).toBe(5);
      expect(ListenerState.Error).toBe(100);
    });
  });

  describe('OPCode', () => {
    it('should have all expected values', () => {
      expect(OPCode.Request).toBe(1);
      expect(OPCode.Response).toBe(2);
      expect(OPCode.Notify).toBe(3);
      expect(OPCode.Command).toBe(4);
    });
  });

  describe('ConnectorState', () => {
    it('should have all expected values', () => {
      expect(ConnectorState.Init).toBe(1);
      expect(ConnectorState.Connecting).toBe(2);
      expect(ConnectorState.Pending).toBe(3);
      expect(ConnectorState.Ready).toBe(4);
      expect(ConnectorState.Stopping).toBe(5);
      expect(ConnectorState.Stopped).toBe(6);
      expect(ConnectorState.Error).toBe(100);
    });
  });

  describe('ConnectorCommand', () => {
    it('should have all expected values', () => {
      expect(ConnectorCommand.Off).toBe('off');
      expect(ConnectorCommand.Error).toBe('error');
      expect(ConnectorCommand.Ping).toBe('ping');
      expect(ConnectorCommand.Pong).toBe('pong');
      expect(ConnectorCommand.Close).toBe('close');
    });
  });
});

describe('ErrorCode completeness', () => {
  it('FrameworkErrorCode should have unique values', () => {
    const values = Object.values(FrameworkErrorCode);
    expect(new Set(values).size).toBe(values.length);
  });

  it('RPCErrorCode should have unique values', () => {
    const values = Object.values(RPCErrorCode);
    expect(new Set(values).size).toBe(values.length);
  });

  it('RetryErrorCode should have expected value', () => {
    expect(RetryErrorCode.ErrRetryTooManyRetry).toBe('ERR_RETRY_TOO_MANY_RETRY');
  });

  it('TCPErrorCode should have expected values', () => {
    expect(TCPErrorCode.ErrNoAvailablePort).toBe('ERR_NO_AVAILABLE_PORT');
    expect(TCPErrorCode.ErrSelectCodecBeforeConnect).toBe('ERR_SELECT_CODE_BEFORE_CONNECT');
  });

  it('TraceErrorCode should have expected values', () => {
    expect(TraceErrorCode.ErrDuplicateScopeRun).toBe('ERR_DUPLICATE_SCOPE_RUN');
    expect(TraceErrorCode.ErrDuplicateScopeStart).toBe('ERR_DUPLICATE_SCOPE_START');
    expect(TraceErrorCode.ErrDuplicateTraceEnd).toBe('ERR_DUPLICATE_SCOPE_END');
  });
});

describe('Const completeness', () => {
  it('RPCHeader should have all expected constants', () => {
    expect(RPCHeader.RpcIdHeader).toBe('x-sora-rpc-id');
    expect(RPCHeader.RpcFromIdHeader).toBe('x-sora-rpc-from-id');
    expect(RPCHeader.RpcSessionHeader).toBe('x-sora-rpc-session');
    expect(RPCHeader.RPCTraceParent).toBe('traceparent');
    expect(RPCHeader.RPCTraceState).toBe('tracestate');
    expect(RPCHeader.RpcServiceId).toBe('x-sora-rpc-service-id');
  });

  it('DiagnosticsChannel should have symbol values', () => {
    expect(typeof DiagnosticsChannel.TraceStartChannel === 'symbol').toBe(true);
    expect(typeof DiagnosticsChannel.TraceEndChannel === 'symbol').toBe(true);
  });
});

describe('Event completeness', () => {
  it('RetryEvent should have expected values', () => {
    expect(RetryEvent.Error).toBe('retry-error');
    expect(RetryEvent.MaxRetryTime).toBe('max-retry-time');
  });
});
