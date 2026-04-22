import {EtcdComponent} from '@sora-soft/etcd-component';
import {Runtime} from '@sora-soft/framework';

export enum ComponentName {
  Etcd = 'etcd',
}

class Com {
  static register() {
    Runtime.registerComponent(ComponentName.Etcd, this.etcd);
  }

  static etcd = new EtcdComponent();
}

export {Com};
