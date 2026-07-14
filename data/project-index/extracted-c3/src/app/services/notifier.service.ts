import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { NotificationObject } from '../shared/models/common';
import { TranslateService } from '@ngx-translate/core';


@Injectable({
  providedIn: 'root'
})
export class NotifierService {

  constructor(private _translateService: TranslateService) { }


  alert(notification: NotificationObject): Promise<any> {
    return Swal.fire({
      icon: 'info',
      // confirmButtonColor : '#5cb85c',
      ...notification,
    });
  }

  confirm( notification: NotificationObject): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText:this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK'),
      cancelButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_CANCEL'),
      confirmButtonColor: 'red',
      ...notification,
    });
  }

  confirmDeletion( notification: NotificationObject): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText:this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK'),
      cancelButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_CANCEL'),
      confirmButtonColor: 'red',
      ...notification,
    });
  }

  
  aprrove( notification: NotificationObject): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText:this._translateService.instant('TRANSLATE.BUTTON_TEXT_APPROVE'),
      cancelButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_CANCEL'),
      confirmButtonColor: 'red',
      ...notification,
    });
  }

  success( notification: NotificationObject): Promise<any> {
    return Swal.fire({
      icon: 'success',
      showCancelButton: false,
      confirmButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK'),
      confirmButtonColor: 'green',
      ...notification,
    });
  }

  error( notification: NotificationObject): Promise<any> {
    return Swal.fire({
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK'),
      confirmButtonColor: 'red',
      ...notification,
    });
  }
  confirmation(notification: NotificationObject): Promise<any> {
    return Swal.fire({
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK'),
      cancelButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_CANCEL'),
      confirmButtonColor: 'red',
      ...notification,
    });
  }
}