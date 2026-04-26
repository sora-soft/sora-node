import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {MockScope} from '../../../test/tools/mock/MockScope.js';
import {Context} from '../Context.js';
import {Scope} from '../Scope.js';
import {ComponentScope} from './ComponentScope.js';
import {LogScope} from './LogScope.js';

const mockComponent = {
  id: 'comp-xyz',
  name: 'my-component',
};

describe('ComponentScope', () => {
  it('should have id from component.id', () => {
    const scope = new ComponentScope({component: mockComponent as any});
    expect(scope.id).toBe('comp-xyz');
  });

  it('should have logCategory "component.{name}"', () => {
    const scope = new ComponentScope({component: mockComponent as any});
    expect(scope.logCategory).toBe('component.my-component');
  });

  it('should store component in store', () => {
    const scope = new ComponentScope({component: mockComponent as any});
    expect(scope.store.component).toBe(mockComponent);
  });

  it('should extend LogScope', () => {
    const scope = new ComponentScope({component: mockComponent as any});
    expect(scope).toBeInstanceOf(LogScope);
  });

  it('should extend Scope', () => {
    const scope = new ComponentScope({component: mockComponent as any});
    expect(scope).toBeInstanceOf(Scope);
  });

  it('should set parent when used in Context.run', () => {
    const scope = new ComponentScope({component: mockComponent as any});
    Context.run(scope, () => {
      expect(scope.parent).toBe(Context.root);
    });
  });

  it('should nest under another scope', () => {
    const parent = new MockScope();
    const scope = new ComponentScope({component: mockComponent as any});
    Context.run(parent, () => {
      Context.run(scope, () => {
        expect(scope.parent).toBe(parent);
      });
    });
  });

  it('should expose componentId', () => {
    const scope = new ComponentScope({component: mockComponent as any});
    expect(scope.componentId).toBe('comp-xyz');
  });

  it('should expose name', () => {
    const scope = new ComponentScope({component: mockComponent as any});
    expect(scope.name).toBe('my-component');
  });
});
