import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {ArrayMap, NanoTime, NodeTime, UnixTime, Utility} from './Utility.js';

describe('Utility', () => {
  describe('null', () => {
    it('should return undefined', () => {
      expect(Utility.null()).toBeUndefined();
    });
  });

  describe('isUndefined', () => {
    it('should return true for undefined', () => {
      expect(Utility.isUndefined(undefined)).toBe(true);
    });
    it('should return false for null', () => {
      expect(Utility.isUndefined(null)).toBe(false);
    });
    it('should return false for 0', () => {
      expect(Utility.isUndefined(0)).toBe(false);
    });
  });

  describe('isMeaningful', () => {
    it('should return false for undefined', () => {
      expect(Utility.isMeaningful(undefined)).toBe(false);
    });
    it('should return true for null', () => {
      expect(Utility.isMeaningful(null)).toBe(true);
    });
    it('should return false for NaN', () => {
      expect(Utility.isMeaningful(NaN)).toBe(false);
    });
    it('should return true for 0', () => {
      expect(Utility.isMeaningful(0)).toBe(true);
    });
    it('should return true for empty string', () => {
      expect(Utility.isMeaningful('')).toBe(true);
    });
  });

  describe('parseInt', () => {
    it('should parse valid integer string', () => {
      expect(Utility.parseInt('42')).toBe(42);
    });
    it('should return 0 for non-numeric string', () => {
      expect(Utility.parseInt('abc')).toBe(0);
    });
    it('should parse leading digits only', () => {
      expect(Utility.parseInt('12abc')).toBe(12);
    });
  });

  describe('randomInt', () => {
    it('should return value within range', () => {
      for (let i = 0; i < 100; i++) {
        const val = Utility.randomInt(0, 10);
        expect(val >= 0 && val < 10, `value ${val} out of range [0, 10)`).toBe(true);
      }
    });
    it('should return begin when begin >= end', () => {
      expect(Utility.randomInt(5, 5)).toBe(5);
      expect(Utility.randomInt(10, 5)).toBe(10);
    });
  });

  describe('randomOne', () => {
    it('should return element from array', () => {
      const arr = [1, 2, 3];
      for (let i = 0; i < 50; i++) {
        const val = Utility.randomOne(arr);
        expect(arr.includes(val)).toBe(true);
      }
    });
  });

  describe('randomOneByWeight', () => {
    it('should return weighted random element', () => {
      const arr = ['a', 'b', 'c'];
      const result = Utility.randomOneByWeight(arr, () => 1);
      expect(arr.includes(result!)).toBe(true);
    });
    it('should return only element with weight', () => {
      const arr = ['heavy', 'light'];
      let heavyCount = 0;
      for (let i = 0; i < 100; i++) {
        const r = Utility.randomOneByWeight(arr, (e) => e === 'heavy' ? 1000 : 1);
        if (r === 'heavy') heavyCount++;
      }
      expect(heavyCount > 90, `expected heavy to dominate, got ${heavyCount}/100`).toBe(true);
    });
    it('should return null for empty array', () => {
      expect(Utility.randomOneByWeight([], () => 0)).toBeNull();
    });
  });

  describe('hideKeys', () => {
    it('should exclude specified keys', () => {
      const obj = {a: 1, b: 2, c: 3};
      const result = Utility.hideKeys(obj, ['b']);
      expect(result).toEqual({a: 1, c: 3});
    });
  });

  describe('mapToJSON', () => {
    it('should convert Map to object', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      expect(Utility.mapToJSON(map)).toEqual({a: 1, b: 2});
    });
  });

  describe('deepCopy', () => {
    it('should create independent copy', () => {
      const obj = {a: {b: 1}};
      const copy = Utility.deepCopy(obj);
      copy.a.b = 2;
      expect(obj.a.b).toBe(1);
    });
  });

  describe('formatLogTimeString', () => {
    it('should return ISO-like string with timezone', () => {
      const str = Utility.formatLogTimeString();
      expect(str).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});

describe('UnixTime', () => {
  it('now should return seconds since epoch', () => {
    const now = UnixTime.now();
    const expected = Math.floor(Date.now() / 1000);
    expect(Math.abs(now - expected) <= 1).toBe(true);
  });

  it('fromDate should convert correctly', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    expect(UnixTime.fromDate(date)).toBe(Math.floor(date.getTime() / 1000));
  });

  it('second/minute/hour/day should compute correctly', () => {
    expect(UnixTime.second(1)).toBe(1);
    expect(UnixTime.minute(1)).toBe(60);
    expect(UnixTime.hour(1)).toBe(3600);
    expect(UnixTime.day(1)).toBe(86400);
  });
});

describe('NodeTime', () => {
  it('now should return milliseconds since epoch', () => {
    const now = NodeTime.now();
    const expected = Date.now();
    expect(Math.abs(now - expected) <= 10).toBe(true);
  });

  it('fromUnixTime should convert correctly', () => {
    expect(NodeTime.fromUnixTime(1)).toBe(1000);
  });

  it('second/minute/hour/day should compute correctly', () => {
    expect(NodeTime.second(1)).toBe(1000);
    expect(NodeTime.minute(1)).toBe(60000);
    expect(NodeTime.hour(1)).toBe(3600000);
    expect(NodeTime.day(1)).toBe(86400000);
  });
});

describe('NanoTime', () => {
  it('now should return bigint', () => {
    const now = NanoTime.now();
    expect(typeof now === 'bigint').toBe(true);
    expect(now > 0n).toBe(true);
  });

  it('should be monotonically increasing', () => {
    const a = NanoTime.now();
    const b = NanoTime.now();
    expect(b >= a).toBe(true);
  });
});

describe('ArrayMap', () => {
  it('should append values to key', () => {
    const map = new ArrayMap<string, number>();
    map.append('a', 1);
    map.append('a', 2);
    map.append('b', 3);
    expect(map.get('a')).toEqual([1, 2]);
    expect(map.get('b')).toEqual([3]);
  });

  it('sureGet should return empty array for missing key', () => {
    const map = new ArrayMap<string, number>();
    expect(map.sureGet('missing')).toEqual([]);
  });

  it('remove should remove specific value', () => {
    const map = new ArrayMap<string, number>();
    map.append('a', 1);
    map.append('a', 2);
    map.append('a', 3);
    map.remove('a', 2);
    expect(map.get('a')).toEqual([1, 3]);
  });

  it('remove on missing key should be no-op', () => {
    const map = new ArrayMap<string, number>();
    map.remove('a', 1);
    expect(map.has('a')).toBe(false);
  });
});
