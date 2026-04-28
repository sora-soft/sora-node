import 'reflect-metadata';

import {describe, expect, it} from '@jest/globals';

import {RamElection} from '../../test/RamElection.js';

describe('SingletonFailover', () => {
  it('should elect first candidate as leader', async () => {
    const election = new RamElection('test-service');
    await election.campaign('node-1');
    expect(await election.leader()).toBe('node-1');
  });

  it('should block second candidate while leader is active', async () => {
    const election = new RamElection('test-service');

    await election.campaign('node-1');

    let node2Elected = false;
    void election.campaign('node-2').then(() => { node2Elected = true; });

    await new Promise(r => setTimeout(r, 100));
    expect(node2Elected).toBe(false);
    expect(await election.leader()).toBe('node-1');
  });

  it('should queue multiple candidates', async () => {
    const election = new RamElection('test-queue');

    await election.campaign('node-1');

    let node2Done = false;
    let node3Done = false;
    void election.campaign('node-2').then(() => { node2Done = true; });
    void election.campaign('node-3').then(() => { node3Done = true; });

    await new Promise(r => setTimeout(r, 100));
    expect(node2Done).toBe(false);
    expect(node3Done).toBe(false);
  });

  it('should notify leader via observer', async () => {
    const election = new RamElection('test-observer');
    const leaders: (string | undefined)[] = [];

    election.observer().subscribe(l => leaders.push(l));

    await election.campaign('node-1');
    expect(leaders).toContain('node-1');
  });

  it('should handle multiple independent elections', async () => {
    const election1 = new RamElection('svc-a');
    const election2 = new RamElection('svc-b');

    await election1.campaign('node-1');
    await election2.campaign('node-2');

    expect(await election1.leader()).toBe('node-1');
    expect(await election2.leader()).toBe('node-2');
  });
});
