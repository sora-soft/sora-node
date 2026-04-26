import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {RPCHeader} from '../../Const.js';
import {OPCode} from '../../Enum.js';
import {RPCErrorCode} from '../../ErrorCode.js';
import {ErrorLevel, ExError} from '../../utility/ExError.js';
import {Connector} from './Connector.js';
import {Request} from './packet/Request.js';
import {Response} from './packet/Response.js';
import {Route} from './Route.js';
import {RouteError} from './RouteError.js';

function createRouteWithMethods(methods: Record<string, (...args: any[]) => Promise<any>>): Route {
  class TestRoute extends Route {}
  const proto = TestRoute.prototype;
  for (const [name, handler] of Object.entries(methods)) {
    (proto as any)[name] = handler;
    (Route as any).registerMethod(proto, name, handler, []);
  }
  return new TestRoute();
}

function createRouteWithNotifies(notifies: Record<string, (...args: any[]) => Promise<void>>): Route {
  class TestRoute extends Route {}
  const proto = TestRoute.prototype;
  for (const [name, handler] of Object.entries(notifies)) {
    (proto as any)[name] = handler;
    (Route as any).registerNotify(proto, name, handler, []);
  }
  return new TestRoute();
}

describe('Route', () => {
  describe('method/notify registration', () => {
    it('should register and detect method', () => {
      const route = createRouteWithMethods({echo: async (body: any) => body});
      expect((route as any).hasMethod('echo')).toBe(true);
    });

    it('should register and detect notify', () => {
      const route = createRouteWithNotifies({onEvent: async () => {}});
      expect((route as any).hasNotify('onEvent')).toBe(true);
    });

    it('should detect unregistered method', () => {
      const route = new Route();
      expect((route as any).hasMethod('nonexistent')).toBeFalsy();
    });

    it('should detect unregistered notify', () => {
      const route = new Route();
      expect((route as any).hasNotify('nonexistent')).toBeFalsy();
    });
  });

  describe('callback()', () => {
    it('should dispatch Request to method', async () => {
      const route = createRouteWithMethods({echo: async (body: any) => body});
      const cb = Route.callback(route);
      const result = await cb({
        opcode: OPCode.Request, method: 'echo', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '123'}, payload: {msg: 'hello'},
      }, 'session-1', null as any);

      expect(result).toBeDefined();
      expect(result!.payload.result).toEqual({msg: 'hello'});
      expect(result!.payload.error).toBeNull();
    });

    it('should dispatch Notify', async () => {
      let notifyReceived: any = null;
      const route = createRouteWithNotifies({onEvent: async (body: any) => { notifyReceived = body; }});
      const cb = Route.callback(route);
      const result = await cb({
        opcode: OPCode.Notify, method: 'onEvent', service: 'test',
        headers: {}, payload: {event: 'test-event'},
      }, 'session-1', null as any);

      expect(result).toBeNull();
      expect(notifyReceived).toEqual({event: 'test-event'});
    });

    it('should return error response for unknown method', async () => {
      const route = new Route();
      const cb = Route.callback(route);
      const result = await cb({
        opcode: OPCode.Request, method: 'unknown', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '123'}, payload: {},
      }, 'session-1', null as any);

      expect(result!.payload.error.code).toBe(RPCErrorCode.ErrRpcMethodNotFound);
    });

    it('should serialize ExError to error response', async () => {
      const route = createRouteWithMethods({
        fail: async () => { throw new ExError('TEST_ERROR', 'TestError', 'test', ErrorLevel.Unexpected, {}); },
      });
      const cb = Route.callback(route);
      const result = await cb({
        opcode: OPCode.Request, method: 'fail', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '123'}, payload: {},
      }, 'session-1', null as any);

      expect(result!.payload.error.code).toBe('TEST_ERROR');
      expect(result!.payload.error.name).toBe('TestError');
    });

    it('should preserve RpcId in response', async () => {
      const route = createRouteWithMethods({echo: async (b: any) => b});
      const cb = Route.callback(route);
      const result = await cb({
        opcode: OPCode.Request, method: 'echo', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: 'rpc-42'}, payload: 'hi',
      }, 'session-1', null as any);

      expect(result!.headers[RPCHeader.RpcIdHeader]).toBe('rpc-42');
    });
  });

  describe('compose()', () => {
    it('should route to first matching route', async () => {
      const routeA = createRouteWithMethods({methodA: async () => 'A'});
      const routeB = createRouteWithMethods({methodB: async () => 'B'});
      const composed = Route.compose([routeA, routeB]);

      const result = await composed({
        opcode: OPCode.Request, method: 'methodA', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '1'}, payload: {},
      }, 'session-1', null as any);

      expect(result!.payload.result).toBe('A');
    });

    it('should route to second route if first has no match', async () => {
      const routeA = createRouteWithMethods({methodA: async () => 'A'});
      const routeB = createRouteWithMethods({methodB: async () => 'B'});
      const composed = Route.compose([routeA, routeB]);

      const result = await composed({
        opcode: OPCode.Request, method: 'methodB', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '1'}, payload: {},
      }, 'session-1', null as any);

      expect(result!.payload.result).toBe('B');
    });

    it('should throw RouteError when no route matches', async () => {
      const composed = Route.compose([new Route()]);
      await expect(composed({
        opcode: OPCode.Request, method: 'unknown', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '1'}, payload: {},
      }, 'session-1', null as any)).rejects.toThrow(RouteError);
    });

    it('should compose notify routes', async () => {
      let received = false;
      const routeC = createRouteWithNotifies({notifyC: async () => { received = true; }});
      const composed = Route.compose([routeC]);
      await composed({
        opcode: OPCode.Notify, method: 'notifyC', service: 'test',
        headers: {}, payload: {},
      }, 'session-1', null as any);
      expect(received).toBe(true);
    });
  });

  describe('middleware onion model', () => {
    it('should execute pre/post in correct order', async () => {
      const order: string[] = [];
      class MWRoute extends Route {}
      const proto = MWRoute.prototype;
      (proto as any).test = async () => { order.push('handler'); return 'done'; };
      (Route as any).registerMethod(proto, 'test', (proto as any).test, []);
      (Route as any).registerMiddleware(proto, 'test', async (_r: any, _b: any, _q: any, _s: any, _c: any, next: () => Promise<any>) => {
        order.push('mw1-pre'); await next(); order.push('mw1-post');
      });
      (Route as any).registerMiddleware(proto, 'test', async (_r: any, _b: any, _q: any, _s: any, _c: any, next: () => Promise<any>) => {
        order.push('mw2-pre'); await next(); order.push('mw2-post');
      });

      const cb = Route.callback(new MWRoute());
      await cb({
        opcode: OPCode.Request, method: 'test', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '1'}, payload: {},
      }, 'session-1', null as any);

      expect(order).toEqual(['mw1-pre', 'mw2-pre', 'handler', 'mw2-post', 'mw1-post']);
    });

    it('should short-circuit when middleware does not call next', async () => {
      let handlerCalled = false;
      class SCRoute extends Route {}
      const proto = SCRoute.prototype;
      (proto as any).test = async () => { handlerCalled = true; return 'done'; };
      (Route as any).registerMethod(proto, 'test', (proto as any).test, []);
      (Route as any).registerMiddleware(proto, 'test', async (_r: any, _b: any, _q: any, res: Response, _c: any, _n: () => Promise<any>) => {
        res.payload = {error: null, result: 'blocked'};
      });

      const cb = Route.callback(new SCRoute());
      const result = await cb({
        opcode: OPCode.Request, method: 'test', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '1'}, payload: {},
      }, 'session-1', null as any);

      expect(handlerCalled).toBe(false);
      expect(result!.payload.result).toBe('blocked');
    });
  });

  describe('registerProvider() parameter injection', () => {
    it('should inject Request/Response/Connector automatically based on param types', async () => {
      let receivedReq: any = null;
      let receivedRes: any = null;
      let receivedConn: any = null;

      class ProvRoute extends Route {}
      const proto = ProvRoute.prototype;
      (proto as any).test = async (body: any, req: Request, res: Response, conn: Connector) => {
        receivedReq = req;
        receivedRes = res;
        receivedConn = conn;
        return {ok: true};
      };
      (Route as any).registerMethod(proto, 'test', (proto as any).test, [Object, Request, Response, Connector]);

      const mockConn = {id: 'mock'} as any;
      const cb = Route.callback(new ProvRoute());
      const result = await cb({
        opcode: OPCode.Request, method: 'test', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '1'}, payload: {},
      }, 'session-1', mockConn);

      expect(receivedReq).toBeInstanceOf(Request);
      expect(receivedRes).toBeInstanceOf(Response);
      expect(receivedConn).toBe(mockConn);
      expect(result!.payload.result).toEqual({ok: true});
    });

    it('should inject custom provider', async () => {
      class CustomType { value = 42; }
      const instance = new CustomType();

      class ProvRoute extends Route {}
      const proto = ProvRoute.prototype;
      (proto as any).test = async (body: any, custom: CustomType) => {
        return {val: custom?.value};
      };
      (Route as any).registerMethod(proto, 'test', (proto as any).test, [Object, CustomType]);
      (Route as any).registerProvider(proto, 'test', CustomType, async () => instance);

      const cb = Route.callback(new ProvRoute());
      const result = await cb({
        opcode: OPCode.Request, method: 'test', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '1'}, payload: {},
      }, 'session-1', null as any);

      expect(result!.payload.result.val).toBe(42);
    });
  });

  describe('ExError serialization', () => {
    it('should serialize error code/name/message/level to response', async () => {
      const route = createRouteWithMethods({
        fail: async () => {
          throw new ExError('CODE_123', 'MyError', 'oops', ErrorLevel.Expected, {detail: 'extra'});
        },
      });

      const cb = Route.callback(route);
      const result = await cb({
        opcode: OPCode.Request, method: 'fail', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '1'}, payload: {},
      }, 'session-1', null as any);

      const err = result!.payload.error;
      expect(err.code).toBe('CODE_123');
      expect(err.name).toBe('MyError');
      expect(err.message).toBe('oops');
      expect(err.level).toBe(ErrorLevel.Expected);
    });
  });

  describe('unknown method → RouteError', () => {
    it('should produce RouteError for unknown Request method', async () => {
      const cb = Route.callback(new Route());
      const result = await cb({
        opcode: OPCode.Request, method: 'nonexistent', service: 'test',
        headers: {[RPCHeader.RpcIdHeader]: '1'}, payload: {},
      }, 'session-1', null as any);

      expect(result!.payload.error.code).toBe(RPCErrorCode.ErrRpcMethodNotFound);
    });
  });
});
