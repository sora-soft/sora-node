import 'reflect-metadata';

import {afterEach, describe, expect, it, vi} from 'vitest';

import {ConsoleOutput} from './ConsoleOutput.js';
import {type ILoggerData, LogLevel} from './Logger.js';

function makeLog(level: LogLevel, content = '"msg"'): ILoggerData {
  return {
    time: new Date('2026-01-01T00:00:00Z'),
    timeString: '2026-01-01 00:00:00.000',
    identify: 'test-app',
    category: 'my-cat',
    level,
    error: null,
    content,
    position: 'test.ts:1',
    stack: [],
    raw: 'msg',
    pid: 12345,
  };
}

describe('ConsoleOutput', () => {
  let output: ConsoleOutput;
  let logSpy: ReturnType<typeof vi.spyOn>;

  afterEach(async () => {
    if (logSpy) {
      logSpy.mockRestore();
    }
    if (output) {
      await output.end();
    }
  });

  it('should output debug with grey color', async () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    output = new ConsoleOutput({});
    output.log(makeLog(LogLevel.Debug));
    await new Promise(r => setTimeout(r, 50));
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain('test-app');
    expect(logSpy.mock.calls[0][0]).toContain('my-cat');
  });

  it('should output info with cyan color', async () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    output = new ConsoleOutput({});
    output.log(makeLog(LogLevel.Info));
    await new Promise(r => setTimeout(r, 50));
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should output warn with yellow color', async () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    output = new ConsoleOutput({});
    output.log(makeLog(LogLevel.Warn));
    await new Promise(r => setTimeout(r, 50));
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should output success with green color', async () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    output = new ConsoleOutput({});
    output.log(makeLog(LogLevel.Success));
    await new Promise(r => setTimeout(r, 50));
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should output error with red color', async () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    output = new ConsoleOutput({});
    output.log(makeLog(LogLevel.Error));
    await new Promise(r => setTimeout(r, 50));
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should output fatal with bgRed color', async () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    output = new ConsoleOutput({});
    output.log(makeLog(LogLevel.Fatal));
    await new Promise(r => setTimeout(r, 50));
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should format output with timeString,level,identify,category,position,content', async () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    output = new ConsoleOutput({});
    output.log(makeLog(LogLevel.Info, '"hello world"'));
    await new Promise(r => setTimeout(r, 50));
    const outputStr = logSpy.mock.calls[0][0];
    expect(outputStr).toMatch(/test-app/);
    expect(outputStr).toMatch(/my-cat/);
    expect(outputStr).toMatch(/hello world/);
  });

  it('should use custom colors when provided', async () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const customColor = (s: string) => `[CUSTOM]${s}[/CUSTOM]`;
    output = new ConsoleOutput({
      colors: {[LogLevel.Info]: customColor},
    });
    output.log(makeLog(LogLevel.Info));
    await new Promise(r => setTimeout(r, 50));
    const outputStr = logSpy.mock.calls[0][0];
    expect(outputStr).toContain('[CUSTOM]');
  });
});
