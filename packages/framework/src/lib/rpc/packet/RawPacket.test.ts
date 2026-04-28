import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {OPCode} from '../../../Enum.js';
import {Notify} from './Notify.js';
import {RawPacket} from './RawPacket.js';
import {Request} from './Request.js';
import {Response} from './Response.js';

describe('RawPacket', () => {
  class TestPacket extends RawPacket<string> {
    toPacket() {
      return {opcode: this.opCode, headers: this.headers, payload: this.payload} as any;
    }
  }

  it('should store and retrieve headers', () => {
    const packet = new TestPacket(OPCode.Request, {headers: {}, payload: 'test'});
    packet.setHeader('x-key', 'value');
    expect(packet.getHeader('x-key')).toBe('value');
  });

  it('should return undefined for missing header', () => {
    const packet = new TestPacket(OPCode.Request, {headers: {}, payload: 'test'});
    expect(packet.getHeader('missing')).toBeUndefined();
  });

  it('should not set header when value is undefined', () => {
    const packet = new TestPacket(OPCode.Request, {headers: {}, payload: 'test'});
    packet.setHeader('x-key', undefined);
    expect(packet.getHeader('x-key')).toBeUndefined();
  });

  it('should load multiple headers', () => {
    const packet = new TestPacket(OPCode.Request, {headers: {}, payload: 'test'});
    packet.loadHeaders({a: '1', b: '2'});
    expect(packet.getHeader('a')).toBe('1');
    expect(packet.getHeader('b')).toBe('2');
  });

  it('should get and set payload', () => {
    const packet = new TestPacket(OPCode.Request, {headers: {}, payload: 'initial'});
    expect(packet.payload).toBe('initial');
    packet.payload = 'updated';
    expect(packet.payload).toBe('updated');
  });

  it('should expose headers as object via getter', () => {
    const packet = new TestPacket(OPCode.Request, {headers: {}, payload: 'test'});
    packet.setHeader('x-a', '1');
    expect(packet.headers).toEqual({'x-a': '1'});
  });
});

describe('Request', () => {
  it('should construct with method, service, headers, payload', () => {
    const req = new Request({
      method: 'getUser',
      service: 'userService',
      headers: {'x-rpc-id': '123'},
      payload: {id: 1},
    });
    expect(req.method).toBe('getUser');
    expect(req.service).toBe('userService');
    expect(req.getHeader('x-rpc-id')).toBe('123');
    expect(req.payload).toEqual({id: 1});
    expect(req.opCode).toBe(OPCode.Request);
  });

  it('should produce correct toPacket output', () => {
    const req = new Request({
      method: 'test',
      service: 'svc',
      headers: {},
      payload: 'data',
    });
    const packet = req.toPacket();
    expect(packet.opcode).toBe(OPCode.Request);
    expect((packet as any).method).toBe('test');
    expect((packet as any).service).toBe('svc');
    expect((packet as any).payload).toBe('data');
  });
});

describe('Response', () => {
  it('should construct with headers and payload', () => {
    const res = new Response({
      headers: {'x-rpc-id': '456'},
      payload: {error: null, result: {name: 'test'}},
    });
    expect(res.getHeader('x-rpc-id')).toBe('456');
    expect(res.payload.result).toEqual({name: 'test'});
    expect(res.opCode).toBe(OPCode.Response);
  });

  it('should produce correct toPacket output', () => {
    const res = new Response({
      headers: {},
      payload: {error: null, result: 42},
    });
    const packet = res.toPacket();
    expect(packet.opcode).toBe(OPCode.Response);
    expect(packet.payload.result).toBe(42);
  });

  it('should return result via toResult()', () => {
    const res = new Response({
      headers: {},
      payload: {error: null, result: {value: 'ok'}},
    });
    expect(res.toResult()).toEqual({value: 'ok'});
  });

  it('should return undefined from toResult() when error is set', () => {
    const res = new Response({
      headers: {},
      payload: {error: {code: 'ERR', message: 'fail', level: 1, name: 'Error', args: {}}, result: null},
    });
    expect(res.toResult()).toBeUndefined();
  });

  it('should allow setting payload', () => {
    const res = new Response({
      headers: {},
      payload: {error: null, result: null},
    });
    res.payload = {error: null, result: 'new'} as any;
    expect(res.payload.result).toBe('new');
  });
});

describe('Notify', () => {
  it('should construct with method, service, headers, payload', () => {
    const notify = new Notify({
      method: 'onUpdate',
      service: 'eventService',
      headers: {},
      payload: {type: 'change'},
    });
    expect(notify.method).toBe('onUpdate');
    expect(notify.service).toBe('eventService');
    expect(notify.payload).toEqual({type: 'change'});
    expect(notify.opCode).toBe(OPCode.Notify);
  });

  it('should produce correct toPacket output', () => {
    const notify = new Notify({
      method: 'test',
      service: 'svc',
      headers: {'x-h': 'val'},
      payload: {data: 1},
    });
    const packet = notify.toPacket();
    expect(packet.opcode).toBe(OPCode.Notify);
    expect((packet as any).method).toBe('test');
    expect((packet as any).payload).toEqual({data: 1});
  });
});
