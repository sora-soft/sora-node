import 'reflect-metadata';

import {afterEach, describe, expect, it} from 'vitest';

import {ErrorLevel, ExError} from '../../utility/ExError.js';
import {FrameworkError} from '../../utility/FrameworkError.js';
import {Context} from '../context/Context.js';
import {RootScope} from '../context/scope/RootScope.js';
import {type ILoggerData, Logger, LogLevel} from './Logger.js';
import {LoggerOutput} from './LoggerOutput.js';

class TestOutput extends LoggerOutput {
  logs: ILoggerData[] = [];
  promise: Promise<void> = Promise.resolve();

  protected async output(log: ILoggerData): Promise<void> {
    this.logs.push(log);
  }

  async end(): Promise<void> {}

  waitForLogs(count: number, timeout = 500): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), timeout);
      const check = () => {
        if (this.logs.length >= count) {
          clearTimeout(timer);
          resolve();
        } else {
          setTimeout(check, 5);
        }
      };
      check();
    });
  }
}

describe('Logger', () => {
  let logger: Logger;
  let output: TestOutput;

  afterEach(async () => {
    if (output) {
      await output.end();
    }
  });

  it('should produce correct ILoggerData for debug', async () => {
    output = new TestOutput({});
    logger = new Logger({identify: 'test-app'});
    logger.pipe(output);
    logger.debug('my-cat', {msg: 'hello'});
    await output.waitForLogs(1);
    expect(output.logs[0].level).toBe(LogLevel.Debug);
    expect(output.logs[0].category).toBe('my-cat');
    expect(output.logs[0].identify).toBe('test-app');
    expect(output.logs[0].error).toBeNull();
    expect(output.logs[0].raw).toEqual({msg: 'hello'});
  });

  it('should produce correct ILoggerData for each level', async () => {
    output = new TestOutput({});
    logger = new Logger({identify: 'test-app'});
    logger.pipe(output);
    logger.debug('cat', 'd');
    logger.info('cat', 'i');
    logger.success('cat', 's');
    logger.warn('cat', 'w');
    logger.error('cat', new Error('err'), 'e');
    logger.fatal('cat', new Error('fatal'), 'f');
    await output.waitForLogs(6);
    const levels = output.logs.map(l => l.level);
    expect(levels).toEqual([
      LogLevel.Debug, LogLevel.Info, LogLevel.Success,
      LogLevel.Warn, LogLevel.Error, LogLevel.Fatal,
    ]);
  });

  it('should include pid', async () => {
    output = new TestOutput({});
    logger = new Logger({identify: 'test'});
    logger.pipe(output);
    logger.info('cat', 'msg');
    await output.waitForLogs(1);
    expect(output.logs[0].pid).toBe(process.pid);
  });

  it('should include time and timeString', async () => {
    output = new TestOutput({});
    logger = new Logger({identify: 'test'});
    logger.pipe(output);
    logger.info('cat', 'msg');
    await output.waitForLogs(1);
    expect(output.logs[0].time).toBeInstanceOf(Date);
    expect(typeof output.logs[0].timeString).toBe('string');
  });

  it('should include position', async () => {
    output = new TestOutput({});
    logger = new Logger({identify: 'test'});
    logger.pipe(output);
    logger.info('cat', 'msg');
    await output.waitForLogs(1);
    expect(output.logs[0].position).toBeDefined();
    expect(typeof output.logs[0].position).toBe('string');
  });

  describe('category logger facade', () => {
    it('should auto-detect category from Context', async () => {
      output = new TestOutput({});
      logger = new Logger({identify: 'test'});
      logger.pipe(output);

      const root = new RootScope();
      Context.run(root, () => {
        logger.category.info('hello');
      });

      await output.waitForLogs(1);
      expect(output.logs[0].category).toBe('runtime');
    });

    it('should fall back to root runtime category when no explicit LogScope', async () => {
      output = new TestOutput({});
      logger = new Logger({identify: 'test'});
      logger.pipe(output);
      logger.category.info('hello');
      await output.waitForLogs(1);
      expect(output.logs[0].category).toBe('runtime');
    });
  });

  describe('pipe() + end()', () => {
    it('should pipe to multiple outputs', async () => {
      const output1 = new TestOutput({});
      const output2 = new TestOutput({});
      logger = new Logger({identify: 'test'});
      logger.pipe(output1).pipe(output2);
      logger.info('cat', 'msg');
      await output1.waitForLogs(1);
      await output2.waitForLogs(1);
      expect(output1.logs).toHaveLength(1);
      expect(output2.logs).toHaveLength(1);
      await output1.end();
      await output2.end();
    });
  });

  describe('error level mapping', () => {
    it('should map ExError with Fatal level to Fatal log', async () => {
      output = new TestOutput({});
      logger = new Logger({identify: 'test'});
      logger.pipe(output);
      const err = new ExError('TEST_FATAL', 'FatalError', 'fatal', ErrorLevel.Fatal, {});
      logger.error('cat', err, 'content');
      await output.waitForLogs(1);
      expect(output.logs[0].level).toBe(LogLevel.Fatal);
    });

    it('should map ExError with Expected level to Warn log', async () => {
      output = new TestOutput({});
      logger = new Logger({identify: 'test'});
      logger.pipe(output);
      const err = new ExError('TEST_EXPECTED', 'ExpectedError', 'expected', ErrorLevel.Expected, {});
      logger.error('cat', err, 'content');
      await output.waitForLogs(1);
      expect(output.logs[0].level).toBe(LogLevel.Warn);
    });

    it('should suppress ExError with Silent level', async () => {
      output = new TestOutput({});
      logger = new Logger({identify: 'test'});
      logger.pipe(output);
      const err = new ExError('TEST_SILENT', 'SilentError', 'silent', ErrorLevel.Silent, {});
      logger.error('cat', err, 'content');
      await new Promise(r => setTimeout(r, 50));
      expect(output.logs).toHaveLength(0);
    });

    it('should map plain Error to Error log level', async () => {
      output = new TestOutput({});
      logger = new Logger({identify: 'test'});
      logger.pipe(output);
      logger.error('cat', new Error('plain'), 'content');
      await output.waitForLogs(1);
      expect(output.logs[0].level).toBe(LogLevel.Error);
    });
  });

  describe('errorMessage()', () => {
    it('should serialize ExError', () => {
      const err = new FrameworkError('test message');
      const serialized = Logger.errorMessage(err);
      expect(serialized).toMatchObject({
        code: err.code,
        name: err.name,
        message: err.message,
      });
    });

    it('should serialize plain Error', () => {
      const err = new Error('plain error');
      const serialized = Logger.errorMessage(err);
      expect(serialized).toMatchObject({
        message: 'plain error',
      });
    });
  });
});
