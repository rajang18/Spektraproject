import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConnectwiseManageService } from '../services/connectwise-manage.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from 'src/app/services/common.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { NotifierService } from 'src/app/services/notifier.service';
import { debounceTime, Subject, takeUntil} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';

@Component({
  selector: 'app-connectwise-manage',
  templateUrl: './connectwise-manage.component.html',
  styleUrl: './connectwise-manage.component.scss'
})
export class ConnectwiseManageComponent extends C3BaseComponent implements OnInit, OnDestroy{
  category: string = 'ConnectWiseSettings';
  connectWiseSettings: any[] = [];
  activeServiceDetail: any;
  isManualContractMapping: boolean;
  connectWiseSettingsForm: FormGroup; 


  constructor(
    private _connectwiseService : ConnectwiseManageService,
    private _applicationSettings: AppSettingsService,
    private _commonService : CommonService,
    private _translateService : TranslateService,
    private _toasterService : ToastrService,
    private _notifierService : NotifierService,
    private _formBuilder: FormBuilder,
    private _cdrRef: ChangeDetectorRef,
    private _unsavedChangesService: UnsavedChangesService,
    public _dynamicTemplateService: DynamicTemplateService,
    private pageInfo: PageInfoService,
    public _permissionService:PermissionService,
    public _router: Router,
    private _appService: AppSettingsService, 
  ){

    super(_permissionService, _dynamicTemplateService, _router, _appService);
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title,true);
    this.pageInfo.updateBreadcrumbs([''])

    this.connectWiseSettingsForm = this._formBuilder.group({});

  }

  ngOnInit(): void {
    this.HasPermission();
    this.getPartnerSettings();

    if (this.Permissions.HasGetActiveExternalServices == "Allowed") {
      this.getActiveServiceDetails();
    }
  }

  Permissions = {
    HasGetActiveExternalServices: "Denied"
  }

  HasPermission() {
    this.Permissions.HasGetActiveExternalServices = this._permissionService.hasPermission('GET_ACTIVE_EXTERNAL_SERVICE');
  }

  getPartnerSettings() {
    this.connectWiseSettings = [];
    const subscription = this._connectwiseService.getPartnerSettings(this.category).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.connectWiseSettings = response.Data;
      this.processSettings(this.connectWiseSettings, this.connectWiseSettingsForm);
      this._cdrRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  processSettings(settingsData: any[], formGroup: FormGroup) {
    if (settingsData) {
      
      settingsData.forEach((data: any) => {
        // Add form controls dynamically based on settingsData
        formGroup.addControl(
          data.Name,
          this._formBuilder.control(
            data.Value || '',
            data.IsRequired ? [Validators.required] : []
          )
        );
      });
      formGroup.updateValueAndValidity(); // Update FormControl validity
    }
  }
  
  getActiveServiceDetails() {
    const subscription = this._applicationSettings.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.activeServiceDetail = response;
      if (this.activeServiceDetail?.Name?.toLowerCase() === CloudHubConstants.PSA_NAME_AUTOTASK.toLowerCase()) {
        
      }
      else {
        this.isManualContractMapping = true;
      }
    })
    this._subscriptionArray.push(subscription);
  }

  testConnectivityToPSA() {
    const subscription = this._applicationSettings.testConnectivityToPSA(this.activeServiceDetail.Name, this._commonService.entityName, this._commonService.recordId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let isConnectivityOK = response.Data;
      if (!isConnectivityOK) {
        if (this.activeServiceDetail?.Name?.toLowerCase() === CloudHubConstants.PSA_NAME_AUTOTASK) {
          const message = this._translateService.instant('TRANSLATE.EXTERNAL_SERVICES_ERROR_MESSAGE_UNABLE_TO_ESTABLISH_CONNECTIVITY_TO_AUTOTASK');
          this._toasterService.error(message, '',{positionClass: 'toast-bottom-right'})
        }
        else {
          const message = this._translateService.instant('TRANSLATE.EXTERNAL_SERVICES_ERROR_MESSAGE_UNABLE_TO_ESTABLISH_CONNECTIVITY_TO_CONNECTWISE') ;
          this._toasterService.error(message, '',{positionClass: 'toast-bottom-right'});
        }
      }
      else {
        const message = this._translateService.instant('TRANSLATE.EXTERNAL_SERVICES_ERROR_MESSAGE_ABLE_TO_ESTABLISH_CONNECTIVITY');
        this._notifierService.alert({ title: message, icon: 'success', 
          customClass:{
            confirmButton:'bg-success'
          },
        });
      }
    });
    this._subscriptionArray.push(subscription);
  }

  saveConnectWiseSettings() {
    if (this.connectWiseSettingsForm.valid) {
      //Updating the value from the form to main response data
      this.connectWiseSettings.forEach(setting => {
        let key = setting.Name;
        if (this.connectWiseSettingsForm.value.hasOwnProperty(key)) {
          setting.Value = this.connectWiseSettingsForm.value[key];
        }
      })
      let requestBody = {
        EntityName: this._commonService.entityName,
        RecordId: this._commonService.recordId,
        PartnerSettings: JSON.stringify(this.connectWiseSettings)
      }
      const subscription = this._connectwiseService.saveConnectwiseSettings(this.category, requestBody).pipe(debounceTime(500)).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status == "Success" && this.category != 'GeneralSettings') {
          const successMessage = this._translateService.instant('TRANSLATE.SUCCESS_MESSAGE_UPDATE_CONNECTWISE_SETTINGS');
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
      this._subscriptionArray.push(subscription);
    }
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }


}

