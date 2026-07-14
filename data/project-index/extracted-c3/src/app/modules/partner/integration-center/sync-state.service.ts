import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root' // This makes the service available everywhere in your app
})
export class SyncStateService {
  

  private isSyncingSource = new BehaviorSubject<boolean>(false);

  isSyncing$ = this.isSyncingSource.asObservable();

  setSyncing(status: boolean) {
    this.isSyncingSource.next(status);
  }
}