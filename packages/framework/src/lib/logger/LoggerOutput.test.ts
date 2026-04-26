import 'reflect-metadata';

import {afterEach, describe, expect, it} from 'vitest';

import {type ILoggerData, LogLevel} from './Logger.js';
import {LoggerOutput} from './LoggerOutput.js';

class TestOutput extends LoggerOutput {
  logs: ILoggerData[] = [];

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

function makeLog(level: LogLevel): ILoggerData {
  return {
    time: new Date(),
    timeString: '2026-01-01 00:00:00.000',
    identify: 'test',
    category: 'cat',
    level,
    error: null,
    content: '"msg"',
    position: 'test.ts:1',
    stack: [],
    raw: 'msg',
    pid: process.pid,
  };
}

describe('LoggerOutput', () => {
  let output: TestOutput;

  afterEach(async () => {
    if (output) {
      await output.end();
    }
  });

  it('should pass through all levels when no filter set', async () => {
    output = new TestOutput({});
    output.log(makeLog(LogLevel.Debug));
    output.log(makeLog(LogLevel.Info));
    output.log(makeLog(LogLevel.Error));
    await output.waitForLogs(3);
    expect(output.logs).toHaveLength(3);
  });

  it('should filter by level', async () => {
    output = new TestOutput({levels: [LogLevel.Warn, LogLevel.Error, LogLevel.Fatal]});
    output.log(makeLog(LogLevel.Debug));
    output.log(makeLog(LogLevel.Info));
    output.log(makeLog(LogLevel.Warn));
    output.log(makeLog(LogLevel.Error));
    await output.waitForLogs(2);
    expect(output.logs).toHaveLength(2);
    expect(output.logs.map(l => l.level)).toEqual([LogLevel.Warn, LogLevel.Error]);
  });

  it('should maintain write order via QueueExecutor', async () => {
    output = new TestOutput({});
    for (let i = 0; i < 10; i++) {
      output.log(makeLog(LogLevel.Info));
    }
    await output.waitForLogs(10);
    expect(output.logs).toHaveLength(10);
  });

  it('should handle rapid writes', async () => {
    output = new TestOutput({});
    for (let i = 0; i < 100; i++) {
      output.log(makeLog(LogLevel.Info));
    }
    await output.waitForLogs(100, 2000);
    expect(output.logs).toHaveLength(100);
  });
});
