import {Election, Logger, Runtime} from '@sora-soft/framework';
import {BehaviorSubject} from '@sora-soft/framework/rxjs';
import type Etcd from 'etcd3';

class EtcdElection extends Election {
  constructor(etcd: Etcd.Etcd3, name: string) {
    super(name);
    this.etcd_ = etcd;
    this.election_ = this.etcd_.election(name);
  }

  async campaign(id: string) {
    return new Promise<void>((resolve, reject) => {
      this.campaign_ = this.election_.campaign(id);
      this.campaign_.on('elected', () => {
        resolve();
      });

      this.campaign_.on('error', (err) => {
        reject(err);
      });
    });
  }

  async resign() {
    await this.campaign_?.resign();
  }

  async leader() {
    return this.election_.leader();
  }

  observer() {
    if (this.leaderSubject_) {
      return this.leaderSubject_;
    }

    this.leaderSubject_ = new BehaviorSubject<string | undefined>(undefined);
    this.election_.observe().then((observe) => {
      observe.on('change', (leader) => {
        this.leaderSubject_?.next(leader);
      });
    }).catch((err) => {
      Runtime.frameLogger.category.error(err, {event: 'electron-observe-error', error: Logger.errorMessage(err)});
    });
    return this.leaderSubject_;
  }

  private etcd_: Etcd.Etcd3;
  private election_: Etcd.Election;
  private campaign_?: Etcd.Campaign;
  private leaderSubject_?: BehaviorSubject<string | undefined>;
}

export {EtcdElection};
