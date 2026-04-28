import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {Context} from '../Context.js';
import {Scope} from '../Scope.js';
import {LogScope} from './LogScope.js';
import {RootScope} from './RootScope.js';

describe('RootScope', () => {
  it('should have id "root"', () => {
    const root = new RootScope();
    expect(root.id).toBe('root');
  });

  it('should have logCategory "runtime"', () => {
    const root = new RootScope();
    expect(root.logCategory).toBe('runtime');
  });

  it('should have undefined store', () => {
    const root = new RootScope();
    expect(root.store).toBeUndefined();
  });

  it('should extend LogScope', () => {
    const root = new RootScope();
    expect(root).toBeInstanceOf(LogScope);
  });

  it('should extend Scope', () => {
    const root = new RootScope();
    expect(root).toBeInstanceOf(Scope);
  });

  it('should be the Context.root singleton', () => {
    expect(Context.root).toBeInstanceOf(RootScope);
    expect(Context.root.id).toBe('root');
    expect((Context.root as LogScope<unknown>).logCategory).toBe('runtime');
  });
});
