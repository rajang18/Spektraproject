import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ESTNCETab, NCETab } from './online-services-nce/NCETabs';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CommonTab } from './commonTabs';
import { PartnerQuantityTab } from './partner-quantity/partner-quantitybasic-details/PartnerQuantityTabs';
import { filter, Subject, takeUntil } from 'rxjs';
import { SoftwaresubscriptionsTab } from './software-subscriptions/software-subscriptionsTabs';
import { PerpetualsoftwareTab } from './perpetual-software/PerpetualsoftwareTabs';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';
import { EVENT_TYPE } from 'src/app/shared/models/common';
import { NonCspTab } from './azure-non-csp/azure-non-csp-details/nonCspTabs';
import { BundleQuantityTab } from './bundle/bundle-tab';
import { onlineServiceTab } from './online-services/online-service-tab';
import { DistributorTab } from './distributor/distributorTab';
import { UserContextService } from 'src/app/services/user-context.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import _ from 'lodash';
import moment from 'moment';
import { TrialOffersTabs } from './trial-offers/TrialOffersTabs';

@Component({
  selector: 'app-manage-products',
  templateUrl: './manage-products.component.html',
  styleUrl: './manage-products.component.scss'
})
export class ManageProductsComponent extends C3BaseComponent implements OnInit, OnDestroy {

  tabs: ManageTab[] = [];
  product: any = null;
  detailsRouteInfo: string;
  isManageAzurePlanEntity: boolean;
  isAzurePlan: boolean;
  isCustom: boolean;
  TransactionAmountLimit: number = 0.0;
  isShowComments: boolean = false;
  RemainingLimit: number = 0.0;
  oldUrlEvent: string = '';
   ESTeffectiveDate=null;
   ESTeffectiveStartDate=null;
  //list of sku's which are having EST offers
  ListofSKUsforEST:String[]=null;
  AllowedCategoryforEST:any=null;
  UseNewEndofTermRules:string=null;
  categoriesSupportedForEST:any=null;
   private _destroying$ = new Subject<void>();

  constructor(
    private _commonEventTrigerred: CommonEventTrigerredService,
    private _cdref: ChangeDetectorRef,
    public _router: Router,
    public _notifierService: NotifierService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _userContextService: UserContextService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.ESTeffectiveDate = this._appService.$rootScope.settings.Data.NewRulesEffectiveDate;
    this.ESTeffectiveStartDate = this._appService.$rootScope.settings.Data.NewRulesEffectiveStartDate;
        this.UseNewEndofTermRules = this._appService.$rootScope.settings.Data.UseNewEndOfTermRules;
        this.categoriesSupportedForEST= this._appService.$rootScope.settings.Data.AllowedCategoryForEST;
        try{
        this.categoriesSupportedForEST=JSON.parse(this.categoriesSupportedForEST)
        this.AllowedCategoryforEST= _.map(this.categoriesSupportedForEST, 'Category').filter(Boolean)[0];
        this.ListofSKUsforEST=_.chain(this.categoriesSupportedForEST).map('ProductIds').flatten().value();
        }
        catch{
          this.AllowedCategoryforEST=this.categoriesSupportedForEST
        }
    const navigation = this._router.getCurrentNavigation();

    this.product = navigation?.extras.state?.['product'] ? navigation?.extras.state?.['product'] : null;

    if (this.product) {
      localStorage.setItem('product', this.product);
    } else {
      this.product = JSON.parse(localStorage.getItem('product'));
    }
    // Explicitly handle the current route on page refresh
    const currentUrl = this._router.url;
    this.handleRouteChange(currentUrl);

    // Subscribe to router events for subsequent navigation changes
    const subscription = this._router.events
      .pipe(
        takeUntil(this._destroying$),
        filter(event => event instanceof NavigationEnd))
      .subscribe((response: any) => {
        this.handleRouteChange(response.url);
      });
      this._subscriptionArray.push(subscription);
  }

  private handleRouteChange(url: string): void {
    if (url.startsWith('/customer/manageproduct')) {
      this.actionHeaderLoader();

      this.isManageAzurePlanEntity = this.product ? this.product.IsSharedEntitlement : null;
      const isManageAzurePlanEntityData = localStorage.getItem('IsManageAzurePlanEntity');
      if (isManageAzurePlanEntityData != null) {
        this.isManageAzurePlanEntity = isManageAzurePlanEntityData === 'true';
      }

      this.isShowComments =
        (this.isManageAzurePlanEntity && !this.product?.IsSharedEntitlement) === false;

      if (this.oldUrlEvent !== url) {
        this.GetTabs();
        this.oldUrlEvent = url;
      }
    }
  }

  ngOnInit(): void {
    if (!this.product) {
      this._router.navigate(['customer/products']);
    }
    this.detailsRouteInfo = this.product?.IsManagedByPartner === false ? '/customer/manageproduct/azureplan/basicdetails' : '/customer/manageproduct/usage/basicdetails';



    const subscription = this._commonEventTrigerred.receiveDataInParent().pipe(takeUntil(this.destroy$)).subscribe(response => {
      if (response.type === EVENT_TYPE.EVENT_CUSTOMER_PRODUCTS_TRANSACTION_LIMIT_DATA) {
        this.TransactionAmountLimit = response.data.TransactionAmountLimit;
        this.RemainingLimit = parseFloat((response.data.TransactionAmountLimit - (response.data.TotalTransactionAmount + response.data.CurrentNewPurchasePrice)).toFixed(2));
      }
    });
    this._subscriptionArray.push(subscription);
  }

  GetTabs() {
    if (!this.product) return;
    if (this.product.ProductForTrial != null) {
      this.tabs = TrialOffersTabs;
    }
    else if (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_ONLINE_SERVICES_NEW_COMMERCE_EXPERIENCE) {
      let tabs = this.product.IsEST ? [...ESTNCETab] : [...NCETab];
      let isSiteOrDepartmentProduct = ((this.product.SiteName !== undefined && this.product.SiteName !== null && this.product.SiteName !== '') || (this.product.DepartmentName !== undefined && this.product.DepartmentName !== null && this.product.DepartmentName !== ''));
      let isShowReneWalManager=false;
      //adding condition for renewl manager tab, if renewlpolicy exists then it is 'renew to newterm' then tab need to come otherwise won't and if renewalpolicy value is null it will be executes as previous
      if(this.product.PurchaseProductRenewalPolicyName!==null){
          if(this.product.PurchaseProductRenewalPolicyName===this.cloudHubConstants.RENEW_TO_NEW_TERM){
            isShowReneWalManager=true;
          }
          else{
            isShowReneWalManager=false;
          }
      }
      else if(this.UseNewEndofTermRules==='true' && this.AllowedCategoryforEST==='NCE' && this.ValidateDate(this.product.CommitmentEndDate) && this.ValidateStartDate(this.product.CommitmentStartDate) && this.checkSKUIsEligibleForRenewalPolicy(this.product.ProviderReferenceId)){
          isShowReneWalManager=false;
      }
      else{
        if(this.product.LinkedSubscriptionId === null && this.product.CategoryName == 'OnlineServicesNCE' && this.product.Status == 'Active' && this.product.PurchasedProductIsAutoRenew == true && this.product.CanShowNextScheduleRenewalMenu == true && this.product.CanShowUpgradeButtonForNCEProduct == true && !isSiteOrDepartmentProduct){
          isShowReneWalManager=true;
        }
        else{
          isShowReneWalManager=false;
        }
      }
      //let isShowReneWalManager = (this.product.LinkedSubscriptionId === null && this.product.CategoryName == 'OnlineServicesNCE' && this.product.Status == 'Active' && this.product.PurchasedProductIsAutoRenew == true && this.product.CanShowNextScheduleRenewalMenu == true && this.product.CanShowUpgradeButtonForNCEProduct == true && !isSiteOrDepartmentProduct) ? true : false;
      if (!isShowReneWalManager) {
        let index = tabs.findIndex(x => x.headingKey == 'CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_SCHEDULING');
        if (index != -1) {
          tabs.splice(index, 1);
        }
      }
      this.tabs = tabs;
    }
    else if (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_BUNDLES) {
      // this._router.navigate(["customer/manageproduct/bundles"])
      this.tabs = BundleQuantityTab;
    }
    else if (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_ONLINE_SERVICES) {

      // this._router.navigate(["customer/manageproduct/bundles"])
      this.tabs = onlineServiceTab;
    }
    else if (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_AZURE_NON_CSP) {
      // this._router.navigate(["customer/manageproduct/noncsp/basicdetails"])
      this.tabs = NonCspTab;
    }
    else if (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS.toLowerCase() && this.product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED) {
      this.tabs = DistributorTab;
    }
    else if ((this.product.ProviderName.toLowerCase() == this.cloudHubConstants.PROVIDER_MICROSOFT && this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_AZURE) || this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_AZURE_PLAN || this.product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_USAGE_BASED) {
      this.isAzurePlan = (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_AZURE_PLAN) ? true : false;
      this.isCustom = (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_CUSTOM) ? true : false;
      this.tabs = this.getUsageTabs();
    }
    else if (this.product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED && this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_SOFTWARE_SUBSCRIPTIONS) {
      this.tabs = SoftwaresubscriptionsTab;
    }
    else if (this.product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED && this.product.ProviderName.toLowerCase() == this.cloudHubConstants.ENTITY_PARTNER) {
      this.tabs = PartnerQuantityTab;
    }

    else if (this.product.ConsumptionType.toLowerCase() == this.cloudHubConstants.CONSUMPTION_CONTRACT) {
      this._router.navigate(["customer/manageproduct/contract/basicdetails"])
    }
    else if (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_PERPETUAL_SOFTWARE) {
      this.tabs = PerpetualsoftwareTab;
    }
    else if (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_AZURE_NON_CSP) {
      this._router.navigate(["customer/manageproduct/noncsp/basicdetails"])
      this.tabs = NonCspTab;
    }

    else if (this.product.CategoryName.toLowerCase() == this.cloudHubConstants.RESERVED_INSTANCES) {
      this._router.navigate(["customer/products/reservedinstances"]);
    }
    else {
      this.tabs = CommonTab;
    }
    this.tabs.forEach(v => {
      v.permissionKeys.forEach(p => {
        if (p.length > 0 && this._permissionService.hasPermission(p) == "Allowed" && v.visible) {
          v.visible = true;
        } else {
          v.visible = false;
        }
      })
    })
   
  }

  backToAzurePlanManageView() {
    localStorage.removeItem("CurrentEntitlementProduct");
    localStorage.removeItem("CurrentProductId");
    localStorage.removeItem("IsfromEntitlement");
    localStorage.removeItem("InternalCustomerProductId");
    localStorage.removeItem("IsManageAzurePlanEntity");
    localStorage.setItem("CurrentProductId", this.product.ProductSubscriptionId.toString());
    this.isManageAzurePlanEntity = false;
    this.GetTabs();
    this._cdref.detectChanges();
    this._router.navigate(["customer/manageproduct/entities"])
  }

  getUsageTabs() {
    return [
      {
        headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_INFO",
        route: this.detailsRouteInfo,
        active: false,
        visible: true,
        permissionKeys: []
      },
      {
        headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_USERS",
        route: "/customer/manageproduct/azureplan/users",
        active: false,
        visible: ((this.isManageAzurePlanEntity || !this.isAzurePlan) && !this.product.IsManagedByPartner),
        permissionKeys: ['TAB_PRODUCT_AZURE_USERS']
      },
      {
        headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_ESTIMATE",
        route: "/customer/manageproduct/azureplan/estimate",
        active: false,
        visible: !this.product.IsManagedByPartner,
        permissionKeys: ['TAB_AZURE_ESTIMATES']
      },
      {
        headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_USAGE",
        route: "/customer/manageproduct/usage/usagedetails",
        active: false,
        visible: this.product.IsManagedByPartner,
        permissionKeys: ['MANAGE_PRODUCT_USAGE_TAB']
      },
      {
        headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_BILLING",
        route: "/customer/manageproduct/azureplan/billing",
        active: false,
        visible: !this.isManageAzurePlanEntity && !this.product.IsManagedByPartner,
        permissionKeys: []
      },
      {
        headingKey: "CUSTOMER_MANAGE_PRODUCT_TAB_TEXT_ENTITLEMENTS",
        route: "/customer/manageproduct/entities",
        active: false,
        visible: !this.isManageAzurePlanEntity && this.product && this.product.CategoryName.toLowerCase() === CloudHubConstants.CATEGORY_AZURE_PLAN && !this.product.IsManagedByPartner,
        permissionKeys: []
      },
      {
        headingKey: "CUSTOMER_PRODUCTS_MANAGE_NAVBAR_TITLE_COMMENTS_DETAILS",
        route: "/customer/manageproduct/comments",
        active: false,
        visible: this.isShowComments,
        permissionKeys: ['menu_customer_comments']
      },
      {
        headingKey: "CUSTOMER_PRODUCTS_MANAGE_NAVBAR_TITLE_MANAGE_OWNERSHIP",
        route: "/customer/manageproduct/azureplan/ownership",
        active: false,
        visible: !this.isCustom,
        permissionKeys: ['PRODUCT_OWNERSHIP_MANAGEMENT']
      }
    ];

  }

  backToList() {
    this._dynamicTemplateService.sendTemplate(null);
    localStorage.removeItem("product");
    this._router.navigate([`customer/products`]).then(() => {
      this._cdref.detectChanges();
    });
  }

  redirectToNotification(tab: any) {
    let data = { entityName: this.cloudHubConstants.ENTITY_CUSTOMER_PRODUCT, recordId: this.product.InternalCustomerProductId };
    this._router.navigate([tab.route], { state: { data: data } })
  }
  ValidateDate(ExpiryDate:any){
      if(ExpiryDate===null || this.ESTeffectiveDate===null){
        return false;
      }
      return moment(ExpiryDate).isSameOrAfter(moment(this.ESTeffectiveDate), 'day')
    }

    ValidateStartDate(StartDate:any){
      if (StartDate === null || StartDate === undefined || this.ESTeffectiveStartDate === null || this.ESTeffectiveStartDate === undefined) {
        return false;
      }
      const startDate = moment(StartDate);
      const effectiveStartDate = moment(this.ESTeffectiveStartDate);
      if (!startDate.isValid() || !effectiveStartDate.isValid()) {
        return false;
      }
      return startDate.isSameOrAfter(effectiveStartDate, 'day');
    }

    checkSKUIsEligibleForRenewalPolicy(providerReferenceId: any) {
    if(this.ListofSKUsforEST===null || this.ListofSKUsforEST.length==0){
        return true;
    }
    if (providerReferenceId !== null && providerReferenceId !== "") {
      const skuId = providerReferenceId.split(':')[1];
      return this.ListofSKUsforEST.includes(skuId)
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    localStorage.removeItem("CurrentEntitlementProduct");
    localStorage.removeItem("CurrentProductId");
    localStorage.removeItem("IsfromEntitlement");
    localStorage.removeItem("InternalCustomerProductId");
    localStorage.removeItem("IsManageAzurePlanEntity");
    localStorage.removeItem("product");
  }

}

export class ManageTab {
  headingKey: string;
  route: string;
  active: boolean;
  visible: boolean;
  permissionKeys: string[];
}
