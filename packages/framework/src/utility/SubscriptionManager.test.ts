import 'reflect-metadata';

import {Subject} from 'rxjs';
import {describe, expect, it} from 'vitest';

import {SubscriptionManager} from './SubscriptionManager.js';

describe('SubscriptionManager', () => {
  it('should register and track subscriptions', () => {
    const manager = new SubscriptionManager();
    const subject = new Subject();
    const sub = subject.subscribe(() => {});
    manager.register(sub);
    expect(sub.closed).toBe(false);
  });

  it('should unregister by subscription reference', () => {
    const manager = new SubscriptionManager();
    const subject = new Subject();
    const sub = subject.subscribe(() => {});
    manager.register(sub);
    manager.unregister(sub);
  });

  it('should unregister by id', () => {
    const manager = new SubscriptionManager();
    const subject = new Subject();
    const sub = subject.subscribe(() => {});
    manager.register(sub, 'my-id');
    manager.unregisterById('my-id');
  });

  it('should unsubscribe all on destroy', () => {
    const manager = new SubscriptionManager();
    const subject = new Subject();
    const sub1 = subject.subscribe(() => {});
    const sub2 = subject.subscribe(() => {});
    manager.register(sub1);
    manager.register(sub2);
    manager.destroy();
    expect(sub1.closed).toBe(true);
    expect(sub2.closed).toBe(true);
  });

  it('should handle unregisterById for non-existent id', () => {
    const manager = new SubscriptionManager();
    manager.unregisterById('non-existent');
  });
});
