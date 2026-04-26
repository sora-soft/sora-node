import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {ErrorLevel, ExError} from './ExError.js';

describe('ExError', () => {
  describe('constructor', () => {
    it('should set code, name, message, level, args properties', () => {
      const err = new ExError('ERR_TEST', 'TestError', 'test message', ErrorLevel.Expected, {key: 'value'});
      expect(err.code).toBe('ERR_TEST');
      expect(err.name).toBe('TestError');
      expect(err.message).toBe('test message');
      expect(err.level).toBe(ErrorLevel.Expected);
      expect(err.args).toEqual({key: 'value'});
    });

    it('should be instance of Error', () => {
      const err = new ExError('ERR_TEST', 'TestError', 'msg', ErrorLevel.Unexpected, {});
      expect(err instanceof Error).toBe(true);
    });

    it('should capture stack trace', () => {
      const err = new ExError('ERR_TEST', 'TestError', 'msg', ErrorLevel.Unexpected, {});
      expect(err.stack).toBeTruthy();
      expect(err.stack).toContain('ExError');
    });
  });

  describe('fromError', () => {
    it('should return same ExError when passed an ExError', () => {
      const original = new ExError('ERR_ORIG', 'OrigError', 'orig', ErrorLevel.Fatal, {a: 1});
      const result = ExError.fromError(original);
      expect(result).toBe(original);
    });

    it('should wrap plain Error into ExError', () => {
      const plain = new Error('plain error');
      const result = ExError.fromError(plain);
      expect(result instanceof ExError).toBe(true);
      expect(result.code).toBe('ERR_UNKNOWN');
      expect(result.name).toBe('Error');
      expect(result.message).toBe('plain error');
      expect(result.level).toBe(ErrorLevel.Unexpected);
    });
  });

  describe('toJson', () => {
    it('should serialize to plain object', () => {
      const err = new ExError('ERR_CODE', 'SomeError', 'msg', ErrorLevel.Silent, {foo: 'bar'});
      const json = err.toJson();
      expect(json.code).toBe('ERR_CODE');
      expect(json.name).toBe('SomeError');
      expect(json.message).toBe('msg');
      expect(json.level).toBe(ErrorLevel.Silent);
      expect(json.args).toEqual({foo: 'bar'});
    });
  });

  describe('ErrorLevel enum', () => {
    it('should have all expected values', () => {
      expect(ErrorLevel.Fatal).toBe(-1);
      expect(ErrorLevel.Unexpected).toBe(1);
      expect(ErrorLevel.Expected).toBe(2);
      expect(ErrorLevel.Silent).toBe(3);
    });
  });
});
