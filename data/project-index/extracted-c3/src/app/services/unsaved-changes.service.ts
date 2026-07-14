import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from './notifier.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesService {
  public c3RouterData : any;
  private _unsavedChanges = false;
  title: string = 'POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT';
  okBtnText: string = 'BUTTON_TEXT_OK';
  confirmBtnColor: string = '#49BA7C';
  private _callbackFn: any;
  private isPageRedirect = new BehaviorSubject(false);
  constructor(private _router: Router, private _translateService: TranslateService, private _notifierService: NotifierService) {
  }

    setIsRedirect(event: any){
    this.isPageRedirect.next(event);
  }

    // expose as observable
    get isRedirect(): Observable<boolean> {
    return this.isPageRedirect.asObservable();
  }

  

  confirmPopup() {
    if (this._unsavedChanges) {
      let swalMsg = this._translateService.instant(`TRANSLATE.${this.title}`);
      let swalConfirmBtn = this._translateService.instant(`TRANSLATE.${this.okBtnText}`);
      this._notifierService.confirm({ title: swalMsg, confirmButtonText: swalConfirmBtn, confirmButtonColor: this.confirmBtnColor }).then((result: { isConfirmed: any, isDismissed: any }) => {
        if (result.isConfirmed) {
          this._unsavedChanges = false;
          if (this._callbackFn) {
            this._callbackFn();
          }
        } else {
          this._router.navigateByUrl(this._router.url);
        }
      });
    }
    else {
      this._callbackFn();
    }

  }

  setUnsavedChanges(value: boolean) {
    this._unsavedChanges = value;
  }

  set setCallback(cbFn: any) {
    this._callbackFn = cbFn;
  }

  getUnsavedChanges() {
    return this._unsavedChanges;
  }

  confirmNavigation(): boolean {
    if (this._unsavedChanges) {
      return confirm('You have unsaved changes. Are you sure you want to leave this page?');
    }
    return true;
  }


}
