import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {OPCode} from '../../Enum.js';
import {JsonBufferCodec} from '../codec/JsonBufferCodec.js';
import {Codec} from './Codec.js';

describe('JsonBufferCodec', () => {
  it('should encode and decode round-trip', async () => {
    const codec = new JsonBufferCodec();
    const original = {
      opcode: OPCode.Request,
      method: 'test',
      service: 'svc',
      headers: {'x-key': 'value'},
      payload: {data: 42},
    };

    const encoded = await codec.encode(original);
    expect(encoded).toBeInstanceOf(Buffer);

    const decoded = await codec.decode(encoded);
    expect(decoded).toEqual(original);
  });

  it('should auto-register to Codec on import', () => {
    expect(Codec.has('json')).toBe(true);
    expect(Codec.get('json')).toBeInstanceOf(JsonBufferCodec);
  });

  it('should have code "json"', () => {
    const codec = new JsonBufferCodec();
    expect(codec.code).toBe('json');
  });
});
