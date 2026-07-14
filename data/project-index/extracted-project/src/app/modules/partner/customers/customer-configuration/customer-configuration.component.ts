import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerconfigurationserviceService } from 'src/app/services/customerconfigurationservice.service';
import { Subscription, takeUntil} from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { NotifierService } from 'src/app/services/notifier.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import _ from 'lodash';
import { C3RouterService } from 'src/app/services/c3-router.service';
@Component({
  selector: 'app-customer-configuration',
  // standalone: true,
  // // error incase i am not importing this here
  // imports: [FormsModule, NgbAccordionModule, NgbModule, CommonModule, TranslateModule, TranslationModule, TenantLoad, ReactiveFormsModule, NgbTooltip],
  templateUrl: './customer-configuration.component.html',
  styleUrl: './customer-configuration.component.scss'
})
export class CustomerConfigurationComponent extends C3BaseComponent implements OnInit, OnDestroy {

  C3Id: string | null;
  Name: string | null;
  selectedOperationalEntity: any;
  OperationalEntities: any[];
  subscription: Subscription;
  Providers: any = [];
  TenantConfigurationsList: any = [];
  SelectedTab: any = null;
  selectedProviderCustomerConfigurations: any = [];
  selectedProviderCustomerConfigurationsArray: any = [];
  ProviderName = "";
  isdefaultView = true;
  Categories: any = [];
  reservedInstancesCategory: boolean | null = null;
  tenantConfigurationForm: FormGroup
  cpvApplicationID: any; 
  permissions: any = {
    HasMicrosoftAzureRecommendation: 'Denied',
  };

  metadata: any = {};
  constructor(
    public _router: Router,
    private _tenantConfigurationService: CustomerconfigurationserviceService,
    private _cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private toastService: ToastService,
    private _fb: FormBuilder,
    private _notifierService: NotifierService,
    private _appService: AppSettingsService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    public _pageInfo:PageInfoService,
    private c3RouterService:C3RouterService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.tenantConfigurationForm = this._fb.group({});
    this.navigation = this._router.getCurrentNavigation()
    this.C3Id = this.navigation?.extras?.state?.c3id;
    this.Name = this.navigation?.extras?.state?.name;

    if (this.C3Id == undefined || this.C3Id == null || this.C3Id == '') {
      this._router.navigate([`partner/customers`])
    } else {
      // selected entity
      this.selectedOperationalEntity = {};
      this.selectedOperationalEntity.EntityName = "Customer";
      this.selectedOperationalEntity.C3Id = this.C3Id
      // below two api calls can merged and used with fork join
      // can be done later 
      this.GetOperationalEntityDetails();
      this.GetProviders();
      this.GetPlanOfferCategories();
      this.getApplicationData();
      this.getPermissions();
    }
  }

  ngOnInit(): void {
    this._pageInfo.updateTitle(this.translateService.instant("TRANSLATE.PROFILE_HEADER_CUSTOMER_CONFIGURATION"),true);
    this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE','PROFILE_HEADER_CUSTOMER_CONFIGURATION']);
  }

  getPermissions() {
    this.permissions.HasMicrosoftAzureRecommendation = this._permissionService.hasPermission(CloudHubConstants.SIDEBAR_PARTNER_MICROSOFT_AZURE_ADVISOR);
    //this._cdRef.detectChanges();
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.cpvApplicationID = response.Data.CPVApplicationId;
      this.metadata.cpvApplicationID = this.cpvApplicationID;
      //this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  GetProviders() {
    const subscription = this._tenantConfigurationService.GetProviders('Customer', this.C3Id).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      if (Data?.length && Data?.length > 0) {
        let sortedProviders = Data.sort((a: any, b: any) => a.DisplayOrder > b.DisplayOrder ? 1 : -1);
        this.Providers = [];

        if (sortedProviders?.length > 0) {
          sortedProviders.map((e: any, index: any) => {
            let newPartnerProvider: any = {
              ID: e.ID,
              Name: e.Name,
              DisplayOrder: e.DisplayOrder,
              Active: false
            }
            this.Providers.push(newPartnerProvider);
          });
          // call get tenant configuration
          this.tenantConfigurationForm.reset();
          this.tenantConfigurationForm = this._fb.group({});
          this.GetTenantConfiguration();
        }
      }
    });
    this._subscriptionArray.push(subscription);
  }

  GetTenantConfiguration() {
    const subscription = this._tenantConfigurationService.GetTenantConfigurations(this.selectedOperationalEntity.EntityName, this.selectedOperationalEntity.C3Id).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      // define form builder
      this.TenantConfigurationsList = Data;
      this.TenantConfigurationsList.map((configuration: any) => {
        let frmControlName = configuration.ServiceProviderTenantId !== null ? configuration.Name + '_' + configuration.ServiceProviderTenantId : configuration.Name;
        // group
        this.tenantConfigurationForm.addControl(frmControlName, this._fb.control(
          configuration.Value || '',
          // if required then use the validation
          configuration.IsRequired ? [Validators.required] : []));
        this.tenantConfigurationForm.updateValueAndValidity();
        this._cdRef.detectChanges();
        configuration.C3ID = configuration.CustomerC3Id;
      });
      if (localStorage.getItem("providerName") !== undefined && localStorage.getItem("providerName") !== null && localStorage.getItem("providerName") !== '') {
        this.IsSelectedTab(localStorage.getItem("providerName"));
        this.SetSelectedTab(localStorage.getItem("providerName"));
      }
      else {
        this.IsSelectedTab(this.Providers[0].Name);
        this.SetSelectedTab(this.Providers[0].Name);
      }
    });
    this._subscriptionArray.push(subscription);
  }

  IsSelectedTab(tabName: any) {
    return this.SelectedTab === tabName;
  }

  SetSelectedTab(providerName: any) {
    localStorage.setItem("providerName", providerName);
    this.selectedProviderCustomerConfigurations = [];
    this.selectedProviderCustomerConfigurationsArray = [];
    this._cdRef.detectChanges();
    let selectedProvider: any = {};
    if (this.Providers?.length > 0) {
      this.Providers?.map((provider: any) => {
        if (provider.Name === providerName) {
          selectedProvider = provider;
          provider.Active = true;
        }
        else {
          provider.Active = false;
        }
        if (providerName !== undefined && providerName !== null && providerName !== "") {
          this.ProviderName = providerName;
        }
      })
    }
    if (this.TenantConfigurationsList?.length > 0) {
      this.selectedProviderCustomerConfigurations = [];
      if (selectedProvider.Name === 'Partner') {
        this.selectedProviderCustomerConfigurations = this.TenantConfigurationsList.filter((configuration: any) => (configuration.ProviderId === selectedProvider.ID || configuration.ProviderId === null))
      }
      else {
        this.selectedProviderCustomerConfigurations = this.TenantConfigurationsList.filter((configuration: any) => (configuration.ProviderId === selectedProvider.ID))
      }
    }

    let distinctDomain = [... new Set(this.selectedProviderCustomerConfigurations.map((e: any) => e.ServiceProviderCustomerId))];
    if (distinctDomain[0] == null) {
      distinctDomain = [];
    }

    if (distinctDomain?.length <= 1) {
      this.isdefaultView = true;
      this.selectedProviderCustomerConfigurationsArray.push(this.selectedProviderCustomerConfigurations)
    }
    else {
      this.isdefaultView = false;
      let index = 1
      if (distinctDomain?.length > 0) {
        distinctDomain?.map((domain: any) => {
          let domainData = this.selectedProviderCustomerConfigurations.filter((domainConfig: any) => {

            if (!domainConfig.IsJsonConverted) {
              let doaminDetails = JSON.parse(domainConfig.ServiceProviderCustomerDetails);
              domainConfig.ServiceProviderCustomerDetails = doaminDetails.DomainName;
              domainConfig.IsJsonConverted = true;
            }
            return domainConfig.ServiceProviderCustomerId === domain;
          });
          domainData.id = index++;
          this.selectedProviderCustomerConfigurationsArray.push(domainData);
        });
      }
    }
    // detect changes
    this._cdRef.detectChanges();
  }

  GetOperationalEntityDetails() {
    let entityName = 'Customer';
    const subscription  = this._tenantConfigurationService.GetOperationalEntityDetails(entityName, this.C3Id).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.OperationalEntities =  _.uniqBy(Data,"C3Id") ;
      // change detection happening slow hence using this manually
      this.selectedOperationalEntity = this.OperationalEntities.find(obj => {
        return obj.EntityName === 'Customer'
      });
      this._cdRef.detectChanges();

    });
    this._subscriptionArray.push(subscription);
  }

  revertTenantConfig(tenantConfig: any) {

    this._notifierService.confirm({
      title: this.translateService.instant("TRANSLATE.POPUP_REVERT_SUB_HEADER_TEXT"),
      confirmButtonColor: '#F64E60',
      icon: 'warning',
    }).then((result: { isConfirmed: any; isDenied: any }) => {

      if (result.isConfirmed) {
        const subscription =  this._tenantConfigurationService.RevertTenantConfig(tenantConfig, "Customer", this.C3Id).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
          this.tenantConfigurationForm.reset();
          this.tenantConfigurationForm = this._fb.group({});
          this.GetTenantConfiguration();
          this.toastService.success(this.translateService.instant("TRANSLATE.TENANT_CONFIGURATION_CUSTOMER_REVERT_SUCCESS"));
        });
        this._subscriptionArray.push(subscription);
      }

    })
  };

  GetPlanOfferCategories() {
    const subscription = this._tenantConfigurationService.GetPlanOfferCategories().pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.Categories = Data;
      //let reservedInstances = _.find(this.Categories, { 'Name': 'ReservedInstances' });
      let reservedInstances = this.Categories.find((e: any) => e.Name == "ReservedInstances");

      if (reservedInstances) {
        this.reservedInstancesCategory = true;
      } else {
        this.reservedInstancesCategory = false;
      }
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  OperationalEntitySelected() {
    if (this.selectedOperationalEntity.EntityName.toLowerCase() === CloudHubConstants.ENTITY_SITE || this.selectedOperationalEntity.EntityName.toLowerCase() === CloudHubConstants.ENTITY_SITEDEPARTMENT) {
      this.Providers = this.Providers.filter((e: any) => e.Name === "Partner");
      this._cdRef.detectChanges();
      this.tenantConfigurationForm.reset();
      this.tenantConfigurationForm = this._fb.group({});
      this.GetTenantConfiguration();
      this.SetSelectedTab(this.Providers[0].Name);
      this._cdRef.detectChanges();
    } else {
      this._cdRef.detectChanges();
      this.GetProviders();
    }
  }

  validateObjectProperty(property: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value.Value;
      // Check if the value is an object
      {
        if ([null, '', undefined, false].includes(value)) {
          return { required: true }; // Return validation error if the property is missing or empty
        }
      }

      return null; // Return null if validation passes
    };

  }

  saveTenantConfig(tenantConfig: any) {
    setTimeout(() => {
      let errorMessage = '';
      if (tenantConfig) {
        if (tenantConfig.ControlType === 'number-input') {
          if ((tenantConfig.Value === undefined || tenantConfig.Value === "" || tenantConfig.Value === null) && tenantConfig.Value !== 0) {
            errorMessage = this.translateService.instant("TRANSLATE.TENANT_CONFIG_REQUIRED_VALIDATION_MESSAGE", { tenantConfigName: tenantConfig.Name });
          }
          else if ((tenantConfig.Value === "0" || tenantConfig.Value === 0) && tenantConfig.Name !== "RIUsageMultiplyPercentage" && tenantConfig.Name !== "TransactionAmountLimit"
            && tenantConfig.Name !== "OneTimeMultiplyPercentage" && tenantConfig.Name !== "RIMultiplyPercentage" && tenantConfig.Name !== "PerpetualSoftwareMultiplyPercentage" && tenantConfig.Name !== "SoftwareSubscriptionMultiplyPercentage" && tenantConfig.Name !== "ThirdPartySubscriptionMultiplyPercentage" && tenantConfig.Name !== "AzureUsageMultiplyPercentage" &&  tenantConfig.Name !== "AzureSavingsPlanMultiplyPercentage") {
            errorMessage = this.translateService.instant("TRANSLATE.TENANT_CONFIG_VALID_NUMBER_VALIDATION_MESSAGE", { tenantConfigName: tenantConfig.Name });
          }
          else if ((isNaN(parseFloat(tenantConfig.Value)) || tenantConfig.Value < 0) && (tenantConfig.Name == "TransactionAmountLimit" || (tenantConfig.Name == "CreditCardProcessingFeeInPercentage" && tenantConfig.Value < 0) || tenantConfig.Name == "AzureSavingsPlanMultiplyPercentage" || tenantConfig.Name == "OneTimeMultiplyPercentage" || tenantConfig.Name == "RIUsageMultiplyPercentage" || tenantConfig.Name == "PerpetualSoftwareMultiplyPercentage" || tenantConfig.Name == "SoftwareSubscriptionMultiplyPercentage" || tenantConfig.Name == "RIMultiplyPercentage" || tenantConfig.Name == "ThirdPartySubscriptionMultiplyPercentage" || tenantConfig.Name == "AzureUsageMultiplyPercentage")) {
            errorMessage = this.translateService.instant("TRANSLATE.TENANT_CONFIG_VALID_NUMBER_VALIDATION_MESSAGE", { tenantConfigName: this.translateService.instant('TRANSLATE.' + tenantConfig.DisplayName) });
          }
        }
        else if (tenantConfig.ControlType === 'text-input' && tenantConfig.Name != "NCETermsAndConditionURL") {
          if (tenantConfig.Value === undefined || tenantConfig.Value === null || tenantConfig.Value === "" || tenantConfig.Value === '') {
            errorMessage = this.translateService.instant("TRANSLATE.TENANT_CONFIG_REQUIRED_VALIDATION_MESSAGE", { tenantConfigName: tenantConfig.Name });
          }
          else if ((isNaN(parseFloat(tenantConfig.Value)) || tenantConfig.Value < 0) && tenantConfig.Name == "OneTimeMultiplyPercentage") {
            errorMessage = this.translateService.instant("TRANSLATE.TENANT_CONFIG_VALID_NUMBER_VALIDATION_MESSAGE", { tenantConfigName: this.translateService.instant('TRANSLATE.' + tenantConfig.DisplayName) });
          }
        }


        if (this.selectedProviderCustomerConfigurations !== null) {
          if (errorMessage === '') {
            let reqBody = {
              Name: tenantConfig.Name,
              Value: tenantConfig.Value,
              Description: tenantConfig.Description,
              CustomerC3Id: tenantConfig.customerC3Id,
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
              EntityName: this.selectedOperationalEntity.EntityName === 'Site' || this.selectedOperationalEntity.EntityName === 'SiteDepartment' ? this.selectedOperationalEntity.EntityName : null,
              RecordId: this.selectedOperationalEntity.EntityName === 'Site' || this.selectedOperationalEntity.EntityName === 'SiteDepartment' ? this.selectedOperationalEntity.C3Id : null
            };

            const subscription = this._tenantConfigurationService.SaveTenantConfig(this.C3Id, reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
              let msg = this.translateService.instant('TRANSLATE.TENANT_CONFIGURATION_CUSTOMER_SAVE_SUCCESS');
              this._notifierService.success({ title: msg, icon: 'success'});
              this.tenantConfigurationForm.reset();
              this.tenantConfigurationForm = this._fb.group({});
              this.GetTenantConfiguration();
            });
            this._subscriptionArray.push(subscription);
          }
          else {
            this.toastService.error(errorMessage);
          }
        }
      }

    }, 500);

  }

  cancelTenantConfig() {
    this.tenantConfigurationForm.reset();
    this.tenantConfigurationForm = this._fb.group({});
    this.GetTenantConfiguration();
  }

  backToCustomers() {
    this.c3RouterService.backToHistory(this.keyForData,'partner/customers');
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService?.setUnsavedChanges(false);
    if (this._subscription) {
      this._subscription?.unsubscribe();
    }
    localStorage.removeItem("providerName")
  }
}
