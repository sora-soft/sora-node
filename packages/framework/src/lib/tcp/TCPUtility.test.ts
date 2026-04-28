import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {TCPUtility} from './TCPUtility.js';

describe('TCPUtility', () => {
  describe('encodeMessage + decodeMessage round-trip', () => {
    it('should round-trip a small buffer', async () => {
      const original = Buffer.from('hello world');
      const encoded = await TCPUtility.encodeMessage(original);
      expect(encoded).toBeInstanceOf(Buffer);
      expect(encoded.length).toBeGreaterThan(4);

      const header = encoded.readUInt32BE(0);
      expect(header).toBe(encoded.length - 4);

      const decoded = await TCPUtility.decodeMessage(encoded.subarray(4));
      expect(decoded.toString()).toBe('hello world');
    });

    it('should handle zlib compression and decompression', async () => {
      const original = Buffer.from(JSON.stringify({method: 'test', payload: 'x'.repeat(1000)}));
      const encoded = await TCPUtility.encodeMessage(original);

      const decoded = await TCPUtility.decodeMessage(encoded.subarray(4));
      expect(decoded.toString()).toBe(original.toString());
    });

    it('should handle large data', async () => {
      const original = Buffer.alloc(100000, 'a');
      const encoded = await TCPUtility.encodeMessage(original);
      const decoded = await TCPUtility.decodeMessage(encoded.subarray(4));
      expect(decoded.length).toBe(original.length);
      expect(decoded.equals(original)).toBe(true);
    });

    it('should handle empty data', async () => {
      const original = Buffer.alloc(0);
      const encoded = await TCPUtility.encodeMessage(original);
      const decoded = await TCPUtility.decodeMessage(encoded.subarray(4));
      expect(decoded.length).toBe(0);
    });

    it('should prepend 4-byte length header', async () => {
      const original = Buffer.from('test');
      const encoded = await TCPUtility.encodeMessage(original);
      const length = encoded.readUInt32BE(0);
      expect(length).toBe(encoded.length - 4);
    });
  });
});
