import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {Codec} from './Codec.js';

class TestCodec extends Codec<Buffer> {
  get code() { return 'test-codec'; }
  async encode() { return Buffer.alloc(0); }
  async decode() { return {} as any; }
}

describe('Codec', () => {
  it('should register a codec', () => {
    const codec = new TestCodec();
    Codec.register(codec);
    expect(Codec.has('test-codec')).toBe(true);
    expect(Codec.get('test-codec')).toBe(codec);
  });

  it('should return undefined for unregistered codec', () => {
    expect(Codec.get('nonexistent')).toBeUndefined();
    expect(Codec.has('nonexistent')).toBe(false);
  });

  it('should overwrite on duplicate registration', () => {
    const codec1 = new TestCodec();
    const codec2 = new TestCodec();
    Codec.register(codec1);
    Codec.register(codec2);
    expect(Codec.get('test-codec')).toBe(codec2);
  });
});
