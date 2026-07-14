import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ResellersListingService } from '../services/resellers-listing.service';
import _ from 'lodash'
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { Subject, takeUntil} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-reseller-configuration',
  templateUrl: './reseller-configuration.component.html',
  styleUrl: './reseller-configuration.component.scss'
})
export class ResellerConfigurationComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  reseller: any; 
  isLoadingResellerConfigurations: boolean =true;
  resellerConfiguration: any =[];
  formGroup: FormGroup;
  permissions = {
    HasGetResellers: false,
    HasUpdateResellerConfiguration: false
  };

  constructor(
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _resellerService: ResellersListingService,
    private _fb: FormBuilder,
    private _cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    private _toastService: ToastService,
    private _notifierService: NotifierService,
    private _pageInfo: PageInfoService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService, 
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);    
    this.formGroup = this._fb.group({});
    this.navigation = this._router.getCurrentNavigation();
    const val = this.navigation?.extras?.state?.reseller;

    if (val) {
      this.reseller = val;
      //console.log(this.reseller);
    } else {
      _router.navigate(['partner/resellers'])
    }
    this.getPermissions();
  }
  

  ngOnInit(): void {
    this.getResellerConfiguration()
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let title: string = this._translateService.instant('TRANSLATE.RESELLER_CONFIGURATION_OF', { resellerName: this.reseller.Name });
    this._pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'RESELLER_BREADCRUMB_BUTTON_TEXT_RESELLER', 'RESELLER_TABLE_BUTTON_TEXT__RESELLER_CONFIGURATION']);
    this._pageInfo.updateTitle(title, true);
  }

  getPermissions() {
    this.permissions.HasGetResellers = this._permissionService.hasPermission(this.cloudHubConstants.GET_RESELLERS).toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED;
    this.permissions.HasUpdateResellerConfiguration = this._permissionService.hasPermission(this.cloudHubConstants.BTN_UPDATE_RESELLER_CONFIGURATION).toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED;
    //console.log(this.permissions)
  }

  getResellerConfiguration() {
    if (this.reseller) {
      this.isLoadingResellerConfigurations = true;
      this.resellerConfiguration=[]
      this.formGroup = this._fb.group({});
      this._cdRef.detectChanges();
      const subscription = this._resellerService.getConfiguration(this.reseller.C3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.resellerConfiguration = response.Data;
        _.each(this.resellerConfiguration, (configuration) => {
          configuration.C3ID = configuration.ResellerC3Id;
        });
        let dataToBeShownOnScreen = _.filter(this.resellerConfiguration, config => config.IsShowOnScreen === true);
        let data = _.sortBy(dataToBeShownOnScreen, 'DisplayOrder');
        this.resellerConfiguration = data;
        this.addControl(this.resellerConfiguration);
        this._cdRef.detectChanges();
        this.isLoadingResellerConfigurations = false;
      });
      this._subscriptionArray.push(subscription);
    }
  }


  addControl(data: any) {
    data.forEach((each: any) => {
      this.formGroup.addControl(each.Name, this._fb.control(each.Value || '', each.IsRequired ? [Validators.required] : []));
      this.formGroup.updateValueAndValidity();
    });

  }

  saveResellerConfig(row) {
    if (this.permissions.HasUpdateResellerConfiguration) {
      let errorMessage = '';
      if ((row.Name == "CreditCardProcessingFeeInPercentage" || row.Name == "AzureSavingsPlanMultiplyPercentage" || row.Name == "OneTimeMultiplyPercentage" || row.Name == "RIUsageMultiplyPercentage" || row.Name == "PerpetualSoftwareMultiplyPercentage" || row.Name == "SoftwareSubscriptionMultiplyPercentage" || row.Name == "RIMultiplyPercentage" || row.Name == "ThirdPartySubscriptionMultiplyPercentage" || row.Name == "AzureUsageMultiplyPercentage") && (row.Value === null || row.Value === undefined || row.Value === '')) {
        errorMessage = this._translateService.instant("TENANT_CONFIG_REQUIRED_VALIDATION_MESSAGE", { tenantConfigName: row.Name });
      }
      else if ((row.Name == "CreditCardProcessingFeeInPercentage" || row.Name == "AzureSavingsPlanMultiplyPercentage" || row.Name == "OneTimeMultiplyPercentage" || row.Name == "RIUsageMultiplyPercentage" || row.Name == "PerpetualSoftwareMultiplyPercentage" || row.Name == "SoftwareSubscriptionMultiplyPercentage" || row.Name == "RIMultiplyPercentage" || row.Name == "ThirdPartySubscriptionMultiplyPercentage" || row.Name == "AzureUsageMultiplyPercentage") && row.Value < 0) {
        errorMessage = this._translateService.instant("TENANT_CONFIG_VALID_NUMBER_VALIDATION_MESSAGE", { tenantConfigName: this._translateService.instant(row.DisplayName) });
      }
      if (errorMessage === '') {
        const subscription = this._resellerService.updateConfiguration(this.reseller.C3Id, row).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          this._toastService.success(this._translateService.instant('RESELLER_CONFIGURATION_NOTIFICATION_UPDATED_RESELLER_CONFIGURATION'));
          this.getResellerConfiguration();
        });
        this._subscriptionArray.push(subscription);
      }
      else {
        this._toastService.error(errorMessage);
      }
    } else {
      this._toastService.error(this._translateService.instant('RESELLER_CONFIGURATION_NOTIFICATION_ACCESS_PERMISSION_DENIED'));
    }
  }


  revertResellerConfig(row) {
    let btnOk = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
    this._notifierService.confirm({
      title: this._translateService.instant("TRANSLATE.POPUP_REVERT_SUB_HEADER_TEXT"),
      customClass:{
        confirmButton:'bg-success'
      },
      icon: 'info',
      confirmButtonText: btnOk
    }).then((result: { isConfirmed: any; isDismissed: any }) => {

      if (result.isConfirmed) {
        const subscription = this._resellerService.deleteConfiguration(this.reseller.C3Id, row).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          let msg = this._translateService.instant('TRANSLATE.TENANT_CONFIGURATION_CUSTOMER_REVERT_SUCCESS');
          
          this._notifierService.alert({ title: msg, icon: 'success', confirmButtonText: btnOk,
            customClass:{
              confirmButton:'bg-success'
            },
          });
          this.getResellerConfiguration();
        })
        this._subscriptionArray.push(subscription);
      }

    });
  }

  cancelResellerConfig() {
    this.getResellerConfiguration();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  backToList(){
    this.c3RouterService.backToHistory(this.keyForData,'partner/resellers');
  }

}
