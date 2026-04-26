import 'reflect-metadata';

import {describe, expect, it} from 'vitest';

import {Node} from '../Node.js';
import {NodeHandler} from './NodeHandler.js';

describe('NodeHandler', () => {
  function createHandler() {
    const node = new Node({alias: 'handler-test'}, []);
    const handler = new NodeHandler(node);
    return {handler, node};
  }

  it('should reject createService for "node" service', async () => {
    const {handler} = createHandler();

    await expect(handler.createService({name: 'node', options: {alias: 'test'}}))
      .rejects.toThrow();
  });

  it('should reject createService for unknown service', async () => {
    const {handler} = createHandler();

    await expect(handler.createService({name: 'nonexistent', options: {alias: 'test'}}))
      .rejects.toThrow();
  });

  it('should reject createWorker for unknown worker', async () => {
    const {handler} = createHandler();

    await expect(handler.createWorker({name: 'nonexistent', options: {alias: 'test'}}))
      .rejects.toThrow();
  });

  it('should reject removeService for node service', async () => {
    const {handler, node} = createHandler();

    await expect(handler.removeService({id: node.id, reason: 'test'}))
      .rejects.toThrow();
  });

  it('should return empty object from removeWorker', async () => {
    const {handler} = createHandler();

    const result = await handler.removeWorker({id: 'nonexistent', reason: 'test'});
    expect(result).toEqual({});
  });
});
