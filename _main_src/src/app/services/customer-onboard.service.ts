import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DataSharingModel } from '../shared/models/common';

@Injectable({
  providedIn: 'root'
})
export class CustomerOnboardService {

  private subject = new Subject<any>();
  private updateChildData = new Subject<any>();
  constructor() { }

  sendNotification(message: DataSharingModel) {
    this.subject.next(message);
  }

  receiveNotification(): Observable<any> {
    return this.subject.asObservable();
  }

  setDataForChildFromParent(message: DataSharingModel) {
    this.updateChildData.next(message);
  }

  receiveDataInChild(): Observable<any> {
    return this.updateChildData.asObservable();
  }
}