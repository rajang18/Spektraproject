import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';


@Component({
  selector: 'app-generate-invoice-reason-popup',
  templateUrl: './generate-invoice-reason-popup.component.html',
  styleUrl: './generate-invoice-reason-popup.component.scss'
})
export class GenerateInvoiceReasonPopupComponent extends C3BaseComponent implements OnDestroy {

  constructor(
    private _toastService: ToastService,
    private _formBuilder: FormBuilder,
    private _ngbactiveModal : NgbActiveModal,
    private translateService: TranslateService,
    public router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
  ) {
    super(permissionService, dynamicTemplateService, router, _appService);
    this.frmAddEntitlement = this._formBuilder.group({
      reason: ['', Validators.required],
    });
  }

  frmAddEntitlement: FormGroup;
  ngAfterViewInit(): void {
    setTimeout(() => {
      document.body.setAttribute('tabindex', '-1');
      document.body.focus();
      this.frmAddEntitlement.controls['reason'].markAsUntouched();
    }, 10);
  }

  submit() {
    let resultData:any =this.frmAddEntitlement.get('reason') ;
    if(resultData.value != ""){
      let resultData =this.frmAddEntitlement.get('reason') ;
      this._ngbactiveModal.close(resultData);
    }else{
      this._toastService.warning(this.translateService.instant('TRANSLATE.PLEASE_ENTER_THE_REASON'));
    }
  }

  cancel(){
    this._ngbactiveModal.close();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

}
