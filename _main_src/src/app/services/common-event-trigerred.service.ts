import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DataSharingModel } from '../shared/models/common';

@Injectable({
  providedIn: 'root'
})
export class CommonEventTrigerredService {

  private subject = new Subject<any>();
  private cartCount = new Subject<any>();
  private popupClose = new Subject<boolean>();
  private triggerChild = new Subject<any>();

  constructor() { } 

  setDataForParentFromChild(message: DataSharingModel) {
    this.subject.next(message);
  }

  setPopupClosed() {
    this.popupClose.next(true);
  }
  popupCloseListner() {
    return this.popupClose.asObservable();
  }

  receiveDataInParent(): Observable<any> {
    return this.subject.asObservable();
  }

  setDataForCartCount(message: any) { 
    this.cartCount.next(message);
  }

  receiveDataInParentCartCount(): Observable<any> {
    return this.cartCount.asObservable();
  }

  settriggerChild(msg: any) {
    this.triggerChild.next(msg);
  }
 
  triggerChildListener(): Observable<any> {
    return this.triggerChild.asObservable();
  }
}
