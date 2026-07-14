import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { ProfileService } from '../services/profile.service';
import _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';

@Component({
  selector: 'app-configurationsetting',
  templateUrl: './configurationsetting.component.html',
  styleUrl: './configurationsetting.component.scss'
})
export class ConfigurationsettingComponent implements OnInit,OnDestroy {
  _subscription: Subscription;
  tenantConfigurationsList: any = [];
  selectedProviderCustomerConfigurations: any = [];
  effectiveEntityName: any;
  private unsubscribe$ = new Subject<void>();

  formGroup: FormGroup;

  constructor(
    private _commonService: CommonService,
    private _profileService: ProfileService,
    private _translateService: TranslateService,
    private _toastService: ToastService,
    private _notifierService: NotifierService,
    private _fb: FormBuilder,
    private _cdRef: ChangeDetectorRef,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
  ) {
    this.effectiveEntityName = _commonService.entityName;
    this.formGroup = this._fb.group({});

  }

  ngOnInit(): void {
    this.getTenantConfiguration();
    this.pageInfo.updateTitle(this._translateService.instant("SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE"),true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE']);
  }

  getTenantConfiguration() {
    // $rootScope.clearTooltip();
    this.tenantConfigurationsList = []
    //this._cdRef.detectChanges();
    if (this._commonService.entityName === 'Customer') {
      this._subscription = this._profileService.getConfigurationsManagedByCustomer(this._commonService.entityName, this._commonService.recordId).subscribe((response: any) => {
        this.tenantConfigurationsList = response.Data; 
        _.each(this.tenantConfigurationsList, (configuration) => {
          configuration.C3ID = configuration.CustomerC3Id;
        });


        this.createForm();
        this._cdRef.detectChanges();

      });
    }
    if (this._commonService.entityName === 'Reseller') {
      this._subscription = this._profileService.getConfigurationsManagedByReseller(this._commonService.entityName, this._commonService.recordId).subscribe((response: any) => {
        this.tenantConfigurationsList = response.Data;
        _.each(this.tenantConfigurationsList, (configuration) => {
          configuration.C3ID = configuration.CustomerC3Id;
        });
        this.createForm();
        this._cdRef.detectChanges();
      });
    }
  }

  saveTenantConfig = _.debounce((tenantConfig) => {
    let errorMessage = '';
    if (tenantConfig.ControlType === 'number-input') {
      if ((tenantConfig.Value === undefined || tenantConfig.Value === "" || tenantConfig.Value === null) && tenantConfig.Value !== 0) {
        errorMessage = this._translateService.instant("TRANSLATE.TENANT_CONFIG_REQUIRED_VALIDATION_MESSAGE", { tenantConfigName: tenantConfig.Name });
      }
      else if ((tenantConfig.Value === "0" || tenantConfig.Value === 0) && tenantConfig.Name !== "RIUsageMultiplyPercentage" && tenantConfig.Name !== "TransactionAmountLimit"
        && tenantConfig.Name !== "OneTimeMultiplyPercentage" && tenantConfig.Name !== "RIMultiplyPercentage" && tenantConfig.Name !== "PerpetualSoftwareMultiplyPercentage" && tenantConfig.Name !== "SoftwareSubscriptionMultiplyPercentage" && tenantConfig.Name !== "ThirdPartySubscriptionMultiplyPercentage" && tenantConfig.Name !== 'AzureSavingsPlanMultiplyPercentage') {
        errorMessage = this._translateService.instant("TRANSLATE.TENANT_CONFIG_VALID_NUMBER_VALIDATION_MESSAGE", { tenantConfigName: tenantConfig.Name });
      }
      else if ((isNaN(parseFloat(tenantConfig.Value)) || tenantConfig.Value < 0) && tenantConfig.Name == "TransactionAmountLimit") {
        errorMessage = this._translateService.instant("TRANSLATE.TENANT_CONFIG_VALID_NUMBER_VALIDATION_MESSAGE", { tenantConfigName: this._translateService.instant('' + tenantConfig.DisplayName) });
      }
    }
    else if (tenantConfig.ControlType === 'text-input') {
      if (tenantConfig.Value === undefined || tenantConfig.Value === null || tenantConfig.Value === "" || tenantConfig.Value === '') {
        errorMessage = this._translateService.instant("TRANSLATE.TENANT_CONFIG_REQUIRED_VALIDATION_MESSAGE", { tenantConfigName: tenantConfig.Name });
      }
    }

    if (this.selectedProviderCustomerConfigurations !== null) {
      if (errorMessage === '') {
        if (this._commonService.entityName === 'Customer') {
          let reqBody = {
            Name: tenantConfig.Name,
            Value: tenantConfig.Value,
            Description: tenantConfig.Description,
            CustomerC3Id: this._commonService.recordId,
            ControlType: tenantConfig.ControlType,
            PossibleValues: tenantConfig.PossibleValues,
            DisplayName: tenantConfig.DisplayName,
            DisplayOrder: tenantConfig.DisplayOrder,
            IsRequired: tenantConfig.IsRequired,
            IsManagedByPartner: tenantConfig.IsManagedByPartner,
            IsManagedByCustomer: tenantConfig.IsManagedByCustomer,
            IsShowOnScreen: tenantConfig.IsShowOnScreen,
            Category: tenantConfig.Category,
            ProviderId: tenantConfig.ProviderId,
            ServiceProviderCustomerId: tenantConfig.ServiceProviderCustomerId,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId
          };
          this._subscription = this._profileService.updateConfigurationManagedByCustomer(reqBody).subscribe((response: any) => {
            let msg = this._translateService.instant('TRANSLATE.TENANT_CONFIGURATION_CUSTOMER_SAVE_SUCCESS');

            this.formGroup.reset();
            this.formGroup = this._fb.group({});
            this.getTenantConfiguration();
            this._notifierService.alert({ title: msg });
          });
        }
        if (this._commonService.entityName === 'Reseller') {
          let reqBody = {
            ResellerC3Id: this._commonService.recordId,
            Name: tenantConfig.Name,
            Value: tenantConfig.Value,
            Description: tenantConfig.Description,
            ControlType: tenantConfig.ControlType,
            PossibleValues: tenantConfig.PossibleValues,
            DisplayName: tenantConfig.DisplayName,
            DisplayOrder: tenantConfig.DisplayOrder,
            IsRequired: tenantConfig.IsRequired,
            IsManagedByPartner: tenantConfig.IsManagedByPartner,
            IsManagedByReseller: tenantConfig.IsManagedByReseller,
            IsShowOnScreen: tenantConfig.IsShowOnScreen,
            Category: tenantConfig.Category,
            ServiceProviderCustomerId: tenantConfig.ServiceProviderCustomerId,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId
          };

          this._subscription = this._profileService.updateConfigurationManagedByReseller(reqBody).subscribe((response: any) => {
            let msg = this._translateService.instant('TRANSLATE.TENANT_CONFIGURATION_CUSTOMER_SAVE_SUCCESS');
            this._notifierService.alert({ title: msg });
            this.formGroup.reset();
            this.formGroup = this._fb.group({});
            this.getTenantConfiguration();
          });
        }

      }
      else {
        this._toastService.error(errorMessage);
      }
    }
  },500)

  cancelTenantConfig() {
    this.formGroup.reset();
    this.formGroup = this._fb.group({});
    this.getTenantConfiguration();
  }

  revertTenantConfig(tenantConfig) {
    let msg = this._translateService.instant('TRANSLATE.POPUP_REVERT_SUB_HEADER_TEXT');
    let btnOk = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
    this._notifierService.confirm({ title: msg, confirmButtonText: btnOk, icon: 'info' }).then((result: { isConfirmed: any, isDismissed: any }) => {
      if (result.isConfirmed) {
        if (this._commonService.entityName === 'Customer') {
          let requestBody = {
            CustomerC3Id: tenantConfig.CustomerC3Id,
            Name: tenantConfig.Name,
            ProviderId: tenantConfig.ProviderId,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId
          }
          this._subscription = this._profileService.revertConfigurationManagedByCustomer(requestBody).subscribe((response: any) => {
            let msg = this._translateService.instant('TRANSLATE.TENANT_CONFIGURATION_CUSTOMER_REVERT_SUCCESS');
            this._notifierService.alert({ title: msg });
            this.formGroup.reset();
            this.formGroup = this._fb.group({});
            this.getTenantConfiguration();
          });
        }
        if (this._commonService.entityName === 'Reseller') {
          let requestBody = {
            ResellerC3Id: tenantConfig.ResellerC3Id,
            Name: tenantConfig.Name
          }
          this._subscription =  this._profileService.revertConfigurationManagedByReseller(requestBody).subscribe((response: any) => {
            let msg = this._translateService.instant('TRANSLATE.TENANT_CONFIGURATION_CUSTOMER_REVERT_SUCCESS');
            this._notifierService.alert({ title: msg });
            this.formGroup.reset();
            this.formGroup = this._fb.group({});
            this.getTenantConfiguration();
          });
        }
      }
    });
  }

  createForm() {
    this.tenantConfigurationsList.map((configuration: any) => {
      let frmControlName = configuration.Name;
      // group
      this.formGroup.addControl(frmControlName, this._fb.control(
        configuration.Value || '',
        // if required then use the validation
        configuration.IsRequired ? [Validators.required] : []));
      this.formGroup.updateValueAndValidity();
      this._cdRef.detectChanges();
      //configuration.C3ID = configuration.CustomerC3Id;
    });
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._subscription?.unsubscribe()
    this._unsavedChangesService.setUnsavedChanges(false);
  }
  
}
