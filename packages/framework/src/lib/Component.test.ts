import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import type {IComponentOptions} from '../interface/component.js';
import {Component} from './Component.js';

class TestComponent extends Component {
  connectCount = 0;
  disconnectCount = 0;
  lastOptions: IComponentOptions = {};

  protected async connect() {
    this.connectCount++;
  }

  protected async disconnect() {
    this.disconnectCount++;
  }

  protected setOptions(options: IComponentOptions) {
    this.lastOptions = options;
  }

  get version() {
    return '1.0.0-test';
  }
}

describe('Component', () => {
  it('should call connect on start and set ready', async () => {
    const comp = new TestComponent();
    comp.loadOptions({host: 'localhost'});

    await comp.start();

    expect(comp.connectCount).toBe(1);
    expect(comp.ready).toBe(true);
  });

  it('should call disconnect on stop', async () => {
    const comp = new TestComponent();
    comp.loadOptions({});
    await comp.start();

    await comp.stop();

    expect(comp.disconnectCount).toBe(1);
  });

  it('should only call connect once for multiple starts (ref counting)', async () => {
    const comp = new TestComponent();
    comp.loadOptions({});

    await comp.start();
    await comp.start();
    await comp.start();

    expect(comp.connectCount).toBe(1);
    expect(comp.ready).toBe(true);
  });

  it('should only disconnect when last stop is called (shared component)', async () => {
    const comp = new TestComponent();
    comp.loadOptions({});

    await comp.start();
    await comp.start();

    await comp.stop();
    expect(comp.disconnectCount).toBe(0);

    await comp.stop();
    expect(comp.disconnectCount).toBe(1);
  });

  it('should handle double stop gracefully', async () => {
    const comp = new TestComponent();
    comp.loadOptions({});

    await comp.start();
    await comp.stop();

    await expect(comp.stop()).resolves.toBeUndefined();
    expect(comp.disconnectCount).toBe(1);
  });

  it('should call setOptions via loadOptions', () => {
    const comp = new TestComponent();

    comp.loadOptions({host: 'localhost', port: 5432});

    expect(comp.lastOptions).toEqual({host: 'localhost', port: 5432});
    expect(comp.options).toEqual({host: 'localhost', port: 5432});
  });

  it('should expose correct metadata', async () => {
    const comp = new TestComponent();
    comp.name = 'database';
    comp.loadOptions({host: 'localhost'});
    await comp.start();

    const meta = comp.meta;
    expect(meta.name).toBe('database');
    expect(meta.ready).toBe(true);
    expect(meta.version).toBe('1.0.0-test');
    expect(meta.options).toEqual({host: 'localhost'});
  });

  it('should assign unique ids', () => {
    const a = new TestComponent();
    const b = new TestComponent();

    expect(a.id).toBeDefined();
    expect(b.id).toBeDefined();
    expect(a.id).not.toBe(b.id);
  });
});
