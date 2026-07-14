import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service'; 
import { PermissionService } from 'src/app/services/permission.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-password-update-email-notification-popup',
  templateUrl: './password-update-email-notification-popup.component.html',
  styleUrl: './password-update-email-notification-popup.component.scss'
})
export class PasswordUpdateEmailNotificationPopupComponent implements OnInit {

  @Input() reqBody: any;
  constructor(
    private _modalService: NgbModal,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    private _translateService: TranslateService,
    private _toastService: ToastService,
    private _ngbactiveModal: NgbActiveModal,
    private clipboard: Clipboard,
  ) {
  }

  ngOnInit(): void {
  }

  closeModalPopup() {
    //this.activeModal.close();
    this._modalService.dismissAll();
  }

  confirmCopy() {
    this.clipboard.copy(this.reqBody.updatedPassword);
    this._toastService.success(this._translateService.instant('TRANSLATE.ALERT_MESSAGE_COPIED_TO_CLIPBOARD'))
  };

  submit() {
    let result = {
      suggestedRecipients: this.reqBody.suggestedRecipients
    }
    this._ngbactiveModal.close(result)
  }
}
