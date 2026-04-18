import type {Component} from '../../Component.js';
import {LogScope} from './LogScope.js';

export interface IComponentScopeStore {
  component: Component;
}

export class ComponentScope extends LogScope<IComponentScopeStore> {
  constructor(store: IComponentScopeStore) {
    super(store.component.id, store);
  }

  get name() {
    return this.store_.component.name;
  }

  get componentId() {
    return this.store_.component.id;
  }

  get logCategory() {
    return `component.${this.store.component.name}`;
  }
}
