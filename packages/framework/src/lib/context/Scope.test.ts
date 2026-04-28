import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {MockScope} from '../../test/tools/mock/MockScope.js';
import {Context} from './Context.js';

describe('Scope', () => {
  describe('id and store', () => {
    it('should have id set from constructor', () => {
      const scope = new MockScope();
      expect(scope.id).toBeDefined();
      expect(typeof scope.id).toBe('string');
    });

    it('should have empty store by default', () => {
      const scope = new MockScope();
      expect(scope.store).toEqual({});
    });

    it('should update store via setStore', () => {
      const scope = new MockScope();
      scope.setStore({key: 'value'});
      expect(scope.store).toEqual({key: 'value'});
    });

    it('should have stack trace', () => {
      const scope = new MockScope();
      expect(scope.stack).toBeDefined();
      expect(typeof scope.stack).toBe('string');
    });
  });

  describe('parent chain', () => {
    it('should have undefined parent by default', () => {
      const scope = new MockScope();
      expect(scope.parent).toBeUndefined();
    });

    it('should accept parent in constructor', () => {
      const parent = new MockScope();
      const child = new MockScope(parent);
      expect(child.parent).toBe(parent);
    });

    it('should set parent via setter', () => {
      const scope = new MockScope();
      const parent = new MockScope();
      scope.parent = parent;
      expect(scope.parent).toBe(parent);
    });

    it('should form a chain', () => {
      const grandparent = new MockScope();
      const parent = new MockScope(grandparent);
      const child = new MockScope(parent);
      expect(child.parent).toBe(parent);
      expect(parent.parent).toBe(grandparent);
    });

    it('should set parent when used with Context.run', () => {
      const parent = new MockScope();
      const child = new MockScope();
      Context.run(parent, () => {
        Context.run(child, () => {
          expect(child.parent).toBe(parent);
          expect(parent.parent).toBe(Context.root);
        });
      });
    });
  });

  describe('isInChain()', () => {
    it('should return true when scope is in current chain', () => {
      const scope = new MockScope();
      Context.run(scope, () => {
        expect((scope as any).isInChain(scope.id)).toBe(true);
      });
    });

    it('should return false when scope is not in current chain', () => {
      const scope = new MockScope();
      const other = new MockScope();
      Context.run(scope, () => {
        expect((other as any).isInChain(other.id)).toBe(false);
      });
    });

    it('should find parent scope id in chain', () => {
      const parent = new MockScope();
      const child = new MockScope();
      Context.run(parent, () => {
        Context.run(child, () => {
          expect((child as any).isInChain(parent.id)).toBe(true);
        });
      });
    });
  });
});
