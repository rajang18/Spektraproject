import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ProfileService } from '../services/profile.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  tabs: any = [];
  billingProviderDetail: any = [];
  providerCustomerDetails: any = [];
  providers: any = [];
  entityName: string | null;
  recordId: string | null;
  IsEligibleToManageConfigurations: boolean = false;



  constructor(private _translateService: TranslateService,
    private _commonService: CommonService,
    public _permissionService: PermissionService,
    public _router: Router,
    public _dynamicTemplateService: DynamicTemplateService,
    public _profileService: ProfileService,
    private _pageInfo: PageInfoService,
    private _appService: AppSettingsService, 

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;

    this.tabs.push({
      Route: "user",
      Heading: _translateService.instant("TRANSLATE.PROFILE_TAB_USER_DETAILS")
    })
  }

  permissions: any = {
    HasCustomerPaymentProfile: 'Denied',
    HasTabOrganizationSetup: 'Denied',
    HasGetAccountManagerDetails: 'Denied',
    HasTabConfigurationsManagedByCustomer: "Denied",
    HasTabConfigurationsManagedByReseller: "Denied"
  }

  hasPermission() {
    this.permissions.HasCustomerPaymentProfile = this._permissionService.hasPermission('TAB_CUSTOMER_PAYMENT_PROFILE');
    this.permissions.HasTabOrganizationSetup = this._permissionService.hasPermission('TAB_ORGANIZATION_SETUP');
    this.permissions.HasGetAccountManagerDetails = this._permissionService.hasPermission(this.cloudHubConstants.GETACCOUNTMANAGERDETAILSOFCUSTOMER);
    this.permissions.HasTabConfigurationsManagedByCustomer = this._permissionService.hasPermission(this.cloudHubConstants.TABCONFIGURATIONSMANAGEDBYCUSTOMER);
    this.permissions.HasTabConfigurationsManagedByReseller = this._permissionService.hasPermission(this.cloudHubConstants.TABCONFIGURATIONSMANAGEDBYRESELLER);
  }

  ngOnInit(): void {
    this.hasPermission();
    this.GetCustomerBillingProvider();
    this.GetOrganizationSetup();
    if (this._commonService.entityName?.toLowerCase() === this.cloudHubConstants.ENTITY_CUSTOMER) {
      this.getProviderCustomerDetails();
    }
    if ((this._commonService.entityName?.toLowerCase() === this.cloudHubConstants.ENTITY_SITE || this._commonService.entityName?.toLowerCase() === this.cloudHubConstants.ENTITY_SITEDEPARTMENT) && this.permissions.HasTabOrganizationSetup === 'Allowed') {
      this.GetOrganizationSetup();
    }

    if ((this._commonService.entityName?.toLowerCase() === this.cloudHubConstants.ENTITY_CUSTOMER || this._commonService.entityName?.toLowerCase() === this.cloudHubConstants.ENTITY_RESELLER || this._commonService.entityName?.toLowerCase() === this.cloudHubConstants.ENTITY_PARTNER) && this.permissions.HasGetAccountManagerDetails === 'Allowed') {
      this.getAccountManagerDetailsOfCustomer();
    }
  }



  GetCustomerBillingProvider() {
    // TODO: Call the api to get the billing profile
    this._subscription = this._commonService.getActiveBillingProvider('').subscribe((response: any) => {
      this.billingProviderDetail = response.Data;
      if (this.billingProviderDetail !== undefined && this.billingProviderDetail !== null && this.permissions.HasCustomerPaymentProfile === "Allowed") {
        this.tabs.push({
          Route: 'payment',
          Heading: this._translateService.instant("TRANSLATE.PROFILE_TAB_PAYMENT_PROFILE")
        });
      }
    })
  }

  getProviderCustomerDetails() {
    this._subscription = this._profileService.getProviderCustomerDetails().subscribe((response: any) => {
      this.providerCustomerDetails = response;
      this.getProviders();
    });
  }

  getProviders() {
    this._subscription = this._commonService.getProviders().subscribe((response: any) => {
      this.providers = response;
      this.providers.map((each: any) => {
        let data = this.providerCustomerDetails?.filter((item: any) => {
          return each.ID === item.ProviderId
        })
        if (data?.Name !== "Partner" && data !== null && data?.length > 0) {
          // if (true) {
          this.tabs.push({
            Route: `provider/${each.Name}`,
            // Route: 'provider',
            Heading: each.Name
          });
        }

      });
      // this.GetOrganizationSetup();
    })
  }

  GetOrganizationSetup() {
    if ((this.entityName != 'Site' && this.entityName != 'SiteDepartment') && (this.permissions.HasTabOrganizationSetup === 'Allowed')) {
      // var orgUrl = this.entityName === 'Site' ? 'home.profile.organizationsetup.departments' : 'home.profile.organizationsetup';
      this.tabs.push({
        Route: "organizationsetup",
        Heading: this._translateService.instant("TRANSLATE.PROFILE_TAB_ORGANIZATION_SETUP"),
        Visible: this.permissions.HasTabOrganizationSetup === 'Allowed'
      });
    }
  }
  GetCustomerConfiguration() {
    this.tabs.push({
      Route: 'configurationsetting',
      Heading: this._translateService.instant("TRANSLATE.PROFILE_TAB_CONFIGURATION_SETTING")
    });
  }

  getAccountManagerDetailsOfCustomer() {
    this.tabs.push({
      Route: 'customeraccountmanager',
      Heading: this._translateService.instant('TRANSLATE.PROFILE_TAB_ACCOUNT_MANAGER_DETAILS')
    });
  }

  CheckEligibilityToManageConfigurationsByEntity() {
    this._subscription = this._profileService.CheckEligibilityToManageConfigurationsByEntity().subscribe((response: any) => {
      var isEligibleToManageConfigurationsDetails = response.Data;
      this.IsEligibleToManageConfigurations = isEligibleToManageConfigurationsDetails.IsEligibleToManageConfigurations;
      if ((this._commonService.entityName === 'Customer' && this.permissions.HasTabConfigurationsManagedByCustomer === 'Allowed') || (this._commonService.entityName === 'Reseller' && this.permissions.HasTabConfigurationsManagedByReseller === 'Allowed')) {
        if (this.IsEligibleToManageConfigurations == true) {
          this.GetCustomerConfiguration();
        }
      }
    })
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.CheckEligibilityToManageConfigurationsByEntity();
    this._pageInfo.updateTitle(this._translateService.instant('TRANSLATE.MENU_REPORTS_FOR_CUSTOMER'),true);
    this._pageInfo.updateBreadcrumbs(['MENU_REPORTS_FOR_CUSTOMER']);
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
  }
}
