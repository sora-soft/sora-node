import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {FilterOperator, LabelFilter} from './LabelFilter.js';

describe('LabelFilter', () => {
  describe('INCLUDE operator', () => {
    it('should match when label value is in filter values', () => {
      const filter = new LabelFilter([
        {label: 'region', operator: FilterOperator.INCLUDE, values: ['us-east', 'us-west']},
      ]);
      expect(filter.isSatisfy({region: 'us-east'})).toBe(true);
    });

    it('should not match when label value is not in filter values', () => {
      const filter = new LabelFilter([
        {label: 'region', operator: FilterOperator.INCLUDE, values: ['us-east']},
      ]);
      expect(filter.isSatisfy({region: 'eu-west'})).toBe(false);
    });
  });

  describe('EXCLUDE operator', () => {
    it('should match when label value is not in excluded values', () => {
      const filter = new LabelFilter([
        {label: 'env', operator: FilterOperator.EXCLUDE, values: ['test', 'dev']},
      ]);
      expect(filter.isSatisfy({env: 'prod'})).toBe(true);
    });

    it('should not match when label value is in excluded values', () => {
      const filter = new LabelFilter([
        {label: 'env', operator: FilterOperator.EXCLUDE, values: ['test']},
      ]);
      expect(filter.isSatisfy({env: 'test'})).toBe(false);
    });
  });

  describe('AND combination', () => {
    it('should match only when all rules are satisfied', () => {
      const filter = new LabelFilter([
        {label: 'region', operator: FilterOperator.INCLUDE, values: ['us-east']},
        {label: 'env', operator: FilterOperator.EXCLUDE, values: ['test']},
      ]);
      expect(filter.isSatisfy({region: 'us-east', env: 'prod'})).toBe(true);
      expect(filter.isSatisfy({region: 'us-east', env: 'test'})).toBe(false);
      expect(filter.isSatisfy({region: 'eu-west', env: 'prod'})).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should match when no filters are set', () => {
      const filter = new LabelFilter([]);
      expect(filter.isSatisfy({any: 'value'})).toBe(true);
    });

    it('should expose filter getter', () => {
      const filters = [{label: 'a', operator: FilterOperator.INCLUDE, values: ['b']}];
      const filter = new LabelFilter(filters);
      expect(filter.filter).toBe(filters);
    });
  });
});
