import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { PublicsignupService } from '../services/publicsignup.service';
import { CommonService } from 'src/app/services/common.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NotifierService } from 'src/app/services/notifier.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, Subject, Subscription} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-publicsignup',
  templateUrl: './publicsignup.component.html',
  styleUrl: './publicsignup.component.scss'
})
export class PublicsignupComponent extends C3BaseComponent implements OnInit, OnDestroy{
  category: string = 'PublicSignupSettings';
  publicSignupSettings: any[] = [];
  publicSignupSettingsForm: FormGroup;
  declare _subscription: Subscription; 


  constructor(
    private _publicsingupService: PublicsignupService,
    private _commonService: CommonService,
    private _translateService: TranslateService,
    private _toasterService: ToastrService,
    private _notifierService: NotifierService,
    private _cdrRef: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _unsavedChangesService: UnsavedChangesService,
    public _dynamicTemplateService: DynamicTemplateService,
    private pageInfo: PageInfoService,
    public _permissionService:PermissionService,
    public _router: Router,
    private _appService: AppSettingsService,

  ) {

    
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])

    this.publicSignupSettingsForm = this._formBuilder.group({});
   }

  ngOnInit(): void {
    this.getPartnerSettings();
    this._subscription = this.publicSignupSettingsForm.valueChanges.subscribe(() => {
      if (this.publicSignupSettingsForm.dirty) {
        this._unsavedChangesService.setUnsavedChanges(true);
      } else {
        this._unsavedChangesService.setUnsavedChanges(false);
      }
    });
  }

  ngOnDestroy(): void {
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
    if (this._subscription) {
      this._subscription?.unsubscribe();
    }
  }


  getPartnerSettings() {
    this.publicSignupSettings = [];
    this._publicsingupService.getPartnerSettings(this.category).subscribe((response: any) => {
      this.publicSignupSettings = response.Data;
      this.processSettings(this.publicSignupSettings, this.publicSignupSettingsForm);
      this._cdrRef.detectChanges();
    });
  }

  savePublicSignupSettings() {
    //Updating the value from the form to main response data
    this.publicSignupSettings.forEach(setting => {
      let key = setting.Name;
      if (this.publicSignupSettingsForm.value.hasOwnProperty(key)) {
        setting.Value = this.publicSignupSettingsForm.value[key];
      }
    })
    let requestBody = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      PartnerSettings: JSON.stringify(this.publicSignupSettings)
    }
    this._publicsingupService.savePublicSignupSettings(this.category, requestBody).pipe(debounceTime(500)).subscribe((response: any) => {
      if (response.Status == "Success" && this.category != 'GeneralSettings') {
        const successMessage = this._translateService.instant('TRANSLATE.SUCCESS_MESSAGE_UPDATE_PUBLIC_SIGNUP_SETTINGS');
        this._notifierService.success({ title: successMessage, icon: 'success', 
          customClass:{
            confirmButton:'bg-success'
          },
        }).then(() => {
          //to prevent dirty check while window refresh after success api
          this._unsavedChangesService.setUnsavedChanges(false);
          window.location.reload();
        });
      }
    })
  }

  processSettings(settingsData: any[], formGroup: FormGroup) {
    if (settingsData) {
      settingsData.forEach((data: any) => {
        // Add form controls dynamically based on settingsData
        if (
          [
            'text-input',
            'checkbox',
            'url-input'
          ].includes(data.ControlType)
        ) {
          formGroup.addControl(
            data.Name,
            this._formBuilder.control(
              data.Value || '',
              data.IsRequired ? [] : []
            )
          );
        }
        formGroup;
      });
      formGroup.updateValueAndValidity(); // Update FormControl validity
    }
  }

}
