import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subject, Subscription, takeUntil} from 'rxjs';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { TranslateService } from '@ngx-translate/core';
import { AzureAdvisorService } from 'src/app/services/azureadvisor.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
@Component({
  selector: 'app-azureadvisor',
  templateUrl: './azureadvisor.component.html',
  styleUrl: './azureadvisor.component.scss'
})

export class AzureadvisorComponent implements OnInit, OnDestroy {
  datatableConfig1: ADTSettings;
  datatableConfig2: ADTSettings;
  _subscription: Subscription;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  ActiveCustomer: any = [];
  Tenants: any = [];
  AllTenants: any = [];
  CurrentC3CustomerId: any = null;
  EntityName: string = 'Customer';
  //RecordId: any = null;
  ProviderCoustomerCount: number;
  ProviderTenantsCount: any;
  selectedServiceProviderCustomer: any = null;
  currentCurrencyCode: any;
  subscriptionDataSource: any = [];
  allSubscriptions: any = [];
  customerId: number;
  selectedsubscription: any = null;
  considerSharedLevelEntitlements = 1;
  azurePlanProductId: any;
  recommendationData: any = [];
  _entitlement:any=null
  set currentEntitlement(value) { this._entitlement = value };
  get currentEntitlement() { return this._entitlement };
  selectedCategory: any = null;
  section1Data: any = [];
  AzureGroupsDataSource: any;
  AllAzureRecommendations: any;
  Datastore: any;
  IsLoading:boolean=true;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isPartner : boolean = true;
  constructor(
    private _azureAdvisorService: AzureAdvisorService,
    private _cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private commonService: CommonService,
    private notifier: NotifierService,
    private _pageInfo: PageInfoService,
    private _appService:AppSettingsService

  ) { }
  ngOnInit(): void {
    this.getActiveCustomersHavingUsageSubscription();
    this._pageInfo.updateTitle(this.translateService.instant("TRANSLATE.SIDEBAR_TITLE_MENUS_CUSTOMER_MICROSOFT"),true);
    this._pageInfo.updateBreadcrumbs(['MENU_AZURE_ADVISOR']);
  }

  Provider: string = 'Microsoft';
  showEntitlement: any = null;
  azureEntitlements: any = null;
  entitlementList: any = [];
  dataTemp: any = null;
  apexChart: any = {};

  resetEntitlementVariables() {
    this.dataTemp = null;
    this.currentEntitlement = null;
    this.azureEntitlements = [];
    this.entitlementList = [];
    this.showEntitlement = false;
    this._cdRef.detectChanges();
  }
  
  getActiveCustomersHavingUsageSubscription() {
    this.dataTemp = null;
    this.selectedServiceProviderCustomer = null;
    this.selectedsubscription = null;
    this.currentEntitlement = null;
    this.entitlementList = [];

    if (this.commonService.entityName === "Customer") { 
        this.isPartner  = false;
        this.CurrentC3CustomerId = this.commonService.recordId;
        this.GetTenants();
    }
    else {
      this.isPartner  = true;
      const subscription = this._azureAdvisorService.getActiveCustomersHavingUsageSubscription({ ProviderName: this.Provider })
        .pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
          let seen = new Set();
          this.ActiveCustomer = data.filter((x: any) => {
            if (!seen.has(x.Name)) {
              seen.add(x.Name);
              return true;
            }
            return false;
          });
          if (this.ActiveCustomer !== undefined && this.ActiveCustomer !== null) {
            this.ProviderCoustomerCount = this.ActiveCustomer.length;
            if (!this.CurrentC3CustomerId) {
              this.CurrentC3CustomerId = this.ActiveCustomer[0]?.C3Id;
            }
          }
          this.GetTenants();
        });
        this._subscriptionArray.push(subscription);
    }
  }


  GetTenants() {
    this.dataTemp = null;
    this.selectedServiceProviderCustomer = null;
    this.selectedsubscription = null;
    this.currentEntitlement = null;

    if (this.CurrentC3CustomerId) {
      const subscription = this._azureAdvisorService.GetTenants({ EntityName: this.EntityName, CurrentC3CustomerId: this.CurrentC3CustomerId, ProviderName: this.Provider }).pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.AllTenants = data;
          this.Tenants = [...this.AllTenants];
          if (this.Tenants !== undefined && this.Tenants !== null) {
            this.ProviderTenantsCount = this.Tenants.length;
          }
          this.selectedServiceProviderCustomer = this.Tenants[0].CustomerRefId;
          this.GetAzureSubscriptions();
        });
        this._subscriptionArray.push(subscription);
    }
    else {
      this.ProviderTenantsCount = 0
    }
  }

  GetAzureSubscriptions() {
    this.dataTemp = null;
    this.selectedsubscription = null;
    this.currentEntitlement = null;
    this.subscriptionDataSource = [];
    this._cdRef.detectChanges();

    if (this.CurrentC3CustomerId !== null && this.selectedServiceProviderCustomer !== null) {

      var providerId = this.Tenants.filter((e: any) => e?.CustomerRefId == this.selectedServiceProviderCustomer)[0]?.ProviderId;

      const subscription = this._azureAdvisorService.GetAzureSubscriptions({
        CustomerC3Id: this.CurrentC3CustomerId,
        ProviderCustomerId: this.selectedServiceProviderCustomer,
        CurrencyCode: this.currentCurrencyCode,
        EntityName: this.commonService.entityName,
        RecordId: this.commonService.recordId,
        ProviderId: providerId
      }).pipe(takeUntil(this.destroy$))
        .subscribe(({ Data }: any) => {
          if (Data !== null) {
            this.subscriptionDataSource = Data
            this.selectedsubscription = this.subscriptionDataSource[0].ProductId;
            this.allSubscriptions = Data;
            this.customerId = Data.length > 0 ? this.allSubscriptions[0].InternalCustomerId : "";
            this.GetAzureEntitlement();
          }
        });
        this._subscriptionArray.push(subscription);
    }
    else {

    }
  }

  GetAzureEntitlement() {
    this.resetEntitlementVariables();
    var azureProduct = this.subscriptionDataSource.filter((e: any) => e?.ProductId == this.selectedsubscription)
   
    if (azureProduct.length > 0) {
      if (azureProduct[0].IsAzurePlan) {
        this.showEntitlement = true;
        this.azurePlanProductId = azureProduct[0].ProductId;
        this.currentEntitlement = null;
        const subscription = this._azureAdvisorService.GetCustomerAzurePlanEntitlementsWithHierarchy({ azurePlanProductId: this.azurePlanProductId, considerSharedLevelEntitlements: this.considerSharedLevelEntitlements }).pipe(takeUntil(this.destroy$))
          .subscribe((data) => {
            this.azureEntitlements = data;
            if (this.azureEntitlements == undefined || this.azureEntitlements == null) {

              this.showEntitlement = false;
              this.azureEntitlements = [];
              this.entitlementList = [];
            }
            if (this.azureEntitlements?.length > 0) {

              this.azureEntitlements.forEach((record: any) => {

                this.entitlementList.push({
                  EntitlementName: `${record.EntitlementName} (${record.EntitlementId})`,
                  EntitlementId: record.EntitlementId,
                  SiteName: record.SiteName,
                  DepartmentName: record.DepartmentName
                });
              });
              this.currentEntitlement = this.entitlementList[0].EntitlementId;
            }
          })
          this._subscriptionArray.push(subscription);
      }
      else {

      }
    }
    else {

    }
  }

  GetRecommendationData() {


    if (this.selectedsubscription == null || this.selectedsubscription == "" || this.selectedsubscription == undefined) {
      // preventing an automated ng-change trigger because of the ng-select
      return;
    }
    // init graph
    this.dataTemp = null;
    this.selectedCategory = null;

    var subscriptionId = "";
    // selected the entitlement 
    if (this.showEntitlement) {

      subscriptionId = this.currentEntitlement;
    }
    else {
      // else would be azure subscription
      subscriptionId = this.subscriptionDataSource.filter((e: any) => e?.ProductId == this.selectedsubscription)[0]?.SubscriptionId;
    }
    const subscription = this._azureAdvisorService.GetRecommendation({ ProviderCustomerId: this.selectedServiceProviderCustomer, subscriptionId })
      .pipe(takeUntil(this.destroy$)).subscribe((Data:any) => {

        this.dataTemp = JSON.parse(Data);
        this.dataTemp.value = this.dataTemp.value.reverse();
        this.removeDuplicates();
        this.generateTableSummary();
        this.GenerareGraph();
        this.generateAllAzureRecomment();
      }, err=>{

        // check for any errors while fetching the error from api response
        // maybe an observable crafts the error object in a different way
        // we should not get an exception or type error when we are trying to show the error !!!!!
        this.notifier.alert({
          title: this.translateService.instant('TRANSLATE.AZURE_ERROR_RECOMMENDATION_TEXT'),
          icon: 'error',
          confirmButtonColor: '#50C878',
       });
       this._subscriptionArray.push(subscription); 
  })
      


    // this.dataTemp = {
    //   "nextLink": "https://management.azure.com/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/providers/microsoft.Advisor/recommendations?api-version=2023-01-01&%24top=200&%24skiptoken=W3sidG9rZW4iOiIrUklEOn5TUDVKQVBUN3QwMlV0SkFIQUFDb0JnPT0jUlQ6MSNUUkM6MjAwI0lTVjoyI0lFTzo2NTU1MSNRQ0Y6OCNGUEM6QWdoQ0hnQUFvQm9BQU1vaUFBQ2dHZ0FBUWg0QUFLQWFBQUFFQUpFME1BQkVIZ0FBb0JvQUFBSUF5NEJGSGdBQW9Cb0FBQUlBZTRWR0hnQUFvQm9BQUFJQUFZQnVIZ0FBb0JvQUFBSUFXSzJXSGdBQW9Cb0FBQVFBUVJzWUFCWWZBQUNnR2dBQUFnRHhtelVmQUFDZ0dnQUFBZ0RTb1dnZkFBQ2dHZ0FBQWdDQWljVWZBQUNnR2dBQUFnQnhyTWdmQUFDZ0dnQUFBZ0JWcmhVZ0FBQ2dHZ0FBQWdBNXNENGdBQUNnR2dBQUFnQWx2ejhnQUFDZ0dnQUFBZ0NncUVvZ0FBQ2dHZ0FBQkFEaHRRaUFTeUFBQUtBYUFBQUdBSENEZm9GMmlVd2dBQUNnR2dBQUJnQ3J2Qm1COElGTklBQUFvQm9BQUFJQWtZaFlJQUFBb0JvQUFBSUFzNGxqSUFBQW9Cb0FBQTRBMFJRR0FKK0hyNFFvZ2VhRGRJQmxJQUFBb0JvQUFBUUFsWmZLaEhrZ0FBQ2dHZ0FBQkFBeEdBTUFneUFBQUtBYUFBQUVBR0VQQUFhSklBQUFvQm9BQUFJQW43V1JJQUFBb0JvQUFBSUF2NnlTSUFBQW9Cb0FBQUlBOHJyUklBQUFvQm9BQUFJQXU0VFZJQUFBb0JvQUFBSUFycm5ZSUFBQW9Cb0FBQVFBcTdVY2dOb2dBQUNnR2dBQUFnQjJ1d0VoQUFDZ0dnQUFBZ0FybXdJaEFBQ2dHZ0FBQkFCeENzQUFFeUVBQUtBYUFBQUNBUEs1UUNFQUFLQWFBQUFDQUFXZlV5RUFBS0FhQUFBRUFFRUlBd0NwSVFBQW9Cb0FBQUlBTnFlM0lRQUFvQm9BQUFJQWI0MEdJZ0FBb0JvQUFBSUFRWTFXSWdBQW9Cb0FBQUlBL3BSY0lnQUFvQm9BQUFJQWtJOTBJZ0FBb0JvQUFBSUEwNm1LSWdBQW9Cb0FBQXdBWVRRQXdMRkEvKzhSUVA4Qm5pSUFBS0FhQUFBQ0FDU3lxQ0lBQUtBYUFBQUVBTUVURWdDcklnQUFvQm9BQUFRQWZaT1JoTWtpQUFDZ0dnQUFEZ0JMbEtpTGNSWGcvK0ZBL3g4K2hzb2lBQUNnR2dBQUJBQ3hoUStHIiwicmFuZ2UiOnsibWluIjoiMDVDMUQ1Qzk4RDdGRUMiLCJtYXgiOiIwNUMxRDVFOUNENTE0MCJ9fV0%3d",
    //   "value": [{
    //     "properties": {
    //       "category": "Cost",
    //       "impact": "High",
    //       "impactedField": "Microsoft.Subscriptions/subscriptions",
    //       "impactedValue": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //       "lastUpdated": "2023-12-13T06:31:53.7832971Z",
    //       "recommendationTypeId": "5b8ddf04-be28-44ec-ab2c-a63a34d1de13",
    //       "shortDescription": {
    //         "problem": "Consider App Service reserved instance to save over your on-demand costs",
    //         "solution": "Consider App Service reserved instance to save over your on-demand costs"
    //       },
    //       "extendedProperties": {
    //         "reservedResourceType": "AppService",
    //         "subId": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //         "scope": "Single",
    //         "sku": "Standard_P3_v3_Windows",
    //         "term": "P3Y",
    //         "annualSavingsAmount": "4451",
    //         "savingsAmount": "370",
    //         "qty": "1",
    //         "savingsCurrency": "USD",
    //         "region": "centralus",
    //         "lookbackPeriod": "7",
    //         "displayQty": "1",
    //         "displaySKU": "Standard_P3_v3_Windows"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/providers/Microsoft.Advisor/recommendations/87528deb-f861-af81-2e52-415851e90471",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "87528deb-f861-af81-2e52-415851e90471"
    //   }, {
    //     "properties": {
    //       "category": "Cost",
    //       "impact": "High",
    //       "impactedField": "Microsoft.Subscriptions/subscriptions",
    //       "impactedValue": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //       "lastUpdated": "2023-12-13T06:31:44.3790955Z",
    //       "recommendationTypeId": "5b8ddf04-be28-44ec-ab2c-a63a34d1de13",
    //       "shortDescription": {
    //         "problem": "Consider App Service reserved instance to save over your on-demand costs",
    //         "solution": "Consider App Service reserved instance to save over your on-demand costs"
    //       },
    //       "extendedProperties": {
    //         "reservedResourceType": "AppService",
    //         "subId": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //         "scope": "Single",
    //         "sku": "Standard_P3_v3_Windows",
    //         "term": "P3Y",
    //         "annualSavingsAmount": "9033",
    //         "savingsAmount": "752",
    //         "qty": "2",
    //         "savingsCurrency": "USD",
    //         "region": "westus",
    //         "lookbackPeriod": "7",
    //         "displayQty": "2",
    //         "displaySKU": "Standard_P3_v3_Windows"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/providers/Microsoft.Advisor/recommendations/a6f42c88-9e3e-252b-54a5-47509473f583",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "a6f42c88-9e3e-252b-54a5-47509473f583"
    //   }, {
    //     "properties": {
    //       "category": "Cost",
    //       "impact": "High",
    //       "impactedField": "Microsoft.Subscriptions/subscriptions",
    //       "impactedValue": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //       "lastUpdated": "2023-12-13T06:31:53.7832971Z",
    //       "recommendationTypeId": "5b8ddf04-be28-44ec-ab2c-a63a34d1de13",
    //       "shortDescription": {
    //         "problem": "Consider App Service reserved instance to save over your on-demand costs",
    //         "solution": "Consider App Service reserved instance to save over your on-demand costs"
    //       },
    //       "extendedProperties": {
    //         "reservedResourceType": "AppService",
    //         "subId": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //         "scope": "Single",
    //         "sku": "Standard_P3_v3_Windows",
    //         "term": "P1Y",
    //         "annualSavingsAmount": "2767",
    //         "savingsAmount": "230",
    //         "qty": "1",
    //         "savingsCurrency": "USD",
    //         "region": "centralus",
    //         "lookbackPeriod": "7",
    //         "displayQty": "1",
    //         "displaySKU": "Standard_P3_v3_Windows"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/providers/Microsoft.Advisor/recommendations/4c1f6c98-6379-abe2-3651-8f324a2edcf0",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "4c1f6c98-6379-abe2-3651-8f324a2edcf0"
    //   }, {
    //     "properties": {
    //       "category": "Cost",
    //       "impact": "High",
    //       "impactedField": "Microsoft.Subscriptions/subscriptions",
    //       "impactedValue": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //       "lastUpdated": "2023-12-13T06:31:44.3790955Z",
    //       "recommendationTypeId": "5b8ddf04-be28-44ec-ab2c-a63a34d1de13",
    //       "shortDescription": {
    //         "problem": "Consider App Service reserved instance to save over your on-demand costs",
    //         "solution": "Consider App Service reserved instance to save over your on-demand costs"
    //       },
    //       "extendedProperties": {
    //         "reservedResourceType": "AppService",
    //         "subId": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //         "scope": "Single",
    //         "sku": "Standard_P3_v3_Windows",
    //         "term": "P1Y",
    //         "annualSavingsAmount": "5673",
    //         "savingsAmount": "472",
    //         "qty": "2",
    //         "savingsCurrency": "USD",
    //         "region": "westus",
    //         "lookbackPeriod": "7",
    //         "displayQty": "2",
    //         "displaySKU": "Standard_P3_v3_Windows"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/providers/Microsoft.Advisor/recommendations/12985ab1-56cc-6671-33df-ff4e396ccc76",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "12985ab1-56cc-6671-33df-ff4e396ccc76"
    //   }, {
    //     "properties": {
    //       "category": "Cost",
    //       "impact": "High",
    //       "impactedField": "Microsoft.Subscriptions/subscriptions",
    //       "impactedValue": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //       "lastUpdated": "2023-12-12T20:07:05.4331807Z",
    //       "recommendationTypeId": "84b1a508-fc21-49da-979e-96894f1665df",
    //       "shortDescription": {
    //         "problem": "Consider virtual machine reserved instance to save over your on-demand costs",
    //         "solution": "Consider virtual machine reserved instance to save over your on-demand costs"
    //       },
    //       "extendedProperties": {
    //         "reservedResourceType": "virtualmachines",
    //         "subId": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //         "scope": "Single",
    //         "sku": "Standard_D4s_v3",
    //         "term": "P3Y",
    //         "annualSavingsAmount": "1163",
    //         "savingsAmount": "96",
    //         "qty": "1",
    //         "savingsCurrency": "USD",
    //         "region": "centralindia",
    //         "lookbackPeriod": "60",
    //         "displayQty": "1",
    //         "targetResourceCount": "1",
    //         "location": "centralindia",
    //         "vmSize": "Standard_D4s_v3",
    //         "displaySKU": "Standard_D4s_v3"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/providers/Microsoft.Advisor/recommendations/80654f06-914b-74d6-f8a5-4c962fa77cfb",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "80654f06-914b-74d6-f8a5-4c962fa77cfb"
    //   }, {
    //     "properties": {
    //       "category": "Cost",
    //       "impact": "High",
    //       "impactedField": "Microsoft.Subscriptions/subscriptions",
    //       "impactedValue": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //       "lastUpdated": "2023-12-12T20:07:25.0224426Z",
    //       "recommendationTypeId": "84b1a508-fc21-49da-979e-96894f1665df",
    //       "shortDescription": {
    //         "problem": "Consider virtual machine reserved instance to save over your on-demand costs",
    //         "solution": "Consider virtual machine reserved instance to save over your on-demand costs"
    //       },
    //       "extendedProperties": {
    //         "reservedResourceType": "virtualmachines",
    //         "subId": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //         "scope": "Single",
    //         "sku": "Standard_D4s_v3",
    //         "term": "P3Y",
    //         "annualSavingsAmount": "1164",
    //         "savingsAmount": "97",
    //         "qty": "1",
    //         "savingsCurrency": "USD",
    //         "region": "centralindia",
    //         "lookbackPeriod": "30",
    //         "displayQty": "1",
    //         "targetResourceCount": "1",
    //         "location": "centralindia",
    //         "vmSize": "Standard_D4s_v3",
    //         "displaySKU": "Standard_D4s_v3"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/providers/Microsoft.Advisor/recommendations/0f882649-683d-63b5-af00-ef49f563d6ef",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "0f882649-683d-63b5-af00-ef49f563d6ef"
    //   }, {
    //     "properties": {
    //       "category": "Cost",
    //       "impact": "High",
    //       "impactedField": "Microsoft.Subscriptions/subscriptions",
    //       "impactedValue": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //       "lastUpdated": "2023-12-12T20:39:56.4951511Z",
    //       "recommendationTypeId": "84b1a508-fc21-49da-979e-96894f1665df",
    //       "shortDescription": {
    //         "problem": "Consider virtual machine reserved instance to save over your on-demand costs",
    //         "solution": "Consider virtual machine reserved instance to save over your on-demand costs"
    //       },
    //       "extendedProperties": {
    //         "reservedResourceType": "virtualmachines",
    //         "subId": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //         "scope": "Single",
    //         "sku": "Standard_D4s_v3",
    //         "term": "P1Y",
    //         "annualSavingsAmount": "769",
    //         "savingsAmount": "64",
    //         "qty": "1",
    //         "savingsCurrency": "USD",
    //         "region": "centralindia",
    //         "lookbackPeriod": "7",
    //         "displayQty": "1",
    //         "targetResourceCount": "1",
    //         "location": "centralindia",
    //         "vmSize": "Standard_D4s_v3",
    //         "displaySKU": "Standard_D4s_v3"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/providers/Microsoft.Advisor/recommendations/add864d5-438a-d4ac-12f3-1f6746f1c37f",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "add864d5-438a-d4ac-12f3-1f6746f1c37f"
    //   }, {
    //     "properties": {
    //       "category": "Cost",
    //       "impact": "High",
    //       "impactedField": "Microsoft.Subscriptions/subscriptions",
    //       "impactedValue": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //       "lastUpdated": "2023-12-12T20:39:56.4951511Z",
    //       "recommendationTypeId": "84b1a508-fc21-49da-979e-96894f1665df",
    //       "shortDescription": {
    //         "problem": "Consider virtual machine reserved instance to save over your on-demand costs",
    //         "solution": "Consider virtual machine reserved instance to save over your on-demand costs"
    //       },
    //       "extendedProperties": {
    //         "reservedResourceType": "virtualmachines",
    //         "subId": "558ac289-487e-4196-9b77-1ccebfbdd805",
    //         "scope": "Single",
    //         "sku": "Standard_D4s_v3",
    //         "term": "P3Y",
    //         "annualSavingsAmount": "1164",
    //         "savingsAmount": "97",
    //         "qty": "1",
    //         "savingsCurrency": "USD",
    //         "region": "centralindia",
    //         "lookbackPeriod": "7",
    //         "displayQty": "1",
    //         "targetResourceCount": "1",
    //         "location": "centralindia",
    //         "vmSize": "Standard_D4s_v3",
    //         "displaySKU": "Standard_D4s_v3"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/providers/Microsoft.Advisor/recommendations/37d06bf8-4999-278f-ffd8-7bbb1aa3f363",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "37d06bf8-4999-278f-ffd8-7bbb1aa3f363"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "a1-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9506404Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/a1-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/a1-prod-web/providers/Microsoft.Advisor/recommendations/8c08be8d-d615-9383-8549-4a1b1b63e6c3",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "8c08be8d-d615-9383-8549-4a1b1b63e6c3"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "agoravitafr-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/agoravitafr-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/agoravitafr-prod-web/providers/Microsoft.Advisor/recommendations/f67bf643-fbd4-7500-7351-af33e62fe781",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "f67bf643-fbd4-7500-7351-af33e62fe781"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "apsia-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/apsia-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/apsia-prod-web/providers/Microsoft.Advisor/recommendations/dde54166-00fa-d5c2-917b-f1a8e5d2430a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "dde54166-00fa-d5c2-917b-f1a8e5d2430a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "arganticcloud-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/arganticcloud-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/arganticcloud-prod-web/providers/Microsoft.Advisor/recommendations/4c06aa02-bb1b-6407-8ccb-2ecb23c05a75",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "4c06aa02-bb1b-6407-8ccb-2ecb23c05a75"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "cms-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/cms-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/cms-prod-web/providers/Microsoft.Advisor/recommendations/5f0a0d25-11e8-ef30-55dd-717069c1ca04",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "5f0a0d25-11e8-ef30-55dd-717069c1ca04"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "enti-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/enti-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/enti-prod-web/providers/Microsoft.Advisor/recommendations/e1fe505e-4b6c-8e5e-ae6e-7dfae11c197d",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e1fe505e-4b6c-8e5e-ae6e-7dfae11c197d"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "hs-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/hs-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/hs-prod-web/providers/Microsoft.Advisor/recommendations/19d22021-058e-b66d-a4f8-b6ebd99ea6bf",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "19d22021-058e-b66d-a4f8-b6ebd99ea6bf"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "ironstone-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/ironstone-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/ironstone-prod-web/providers/Microsoft.Advisor/recommendations/3fef7c9c-143a-7572-4acf-01470e15e846",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "3fef7c9c-143a-7572-4acf-01470e15e846"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "itsure-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/itsure-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/itsure-prod-web/providers/Microsoft.Advisor/recommendations/e30b9e90-2e23-913c-63ef-3ac0e7ce97b5",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e30b9e90-2e23-913c-63ef-3ac0e7ce97b5"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "malamsys-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/malamsys-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/malamsys-prod-web/providers/Microsoft.Advisor/recommendations/8c54dd44-c256-6936-4aaa-821d79292e44",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "8c54dd44-c256-6936-4aaa-821d79292e44"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "pioneerit-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9975149Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/pioneerit-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/pioneerit-prod-web/providers/Microsoft.Advisor/recommendations/e630141f-89e4-d120-7fd8-3b1531890b3c",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e630141f-89e4-d120-7fd8-3b1531890b3c"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "prophet-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9975149Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/prophet-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/prophet-prod-web/providers/Microsoft.Advisor/recommendations/1c7b429e-29b9-bdf9-ce87-f0b0a7488401",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "1c7b429e-29b9-bdf9-ce87-f0b0a7488401"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "xentegra-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9975149Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/xentegra-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/xentegra-prod-web/providers/Microsoft.Advisor/recommendations/4b66a409-7347-fde2-8b39-836dd995cf5a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "4b66a409-7347-fde2-8b39-836dd995cf5a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "abracloud-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.153772Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/abracloud-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/abracloud-prod-web/providers/Microsoft.Advisor/recommendations/d07c3219-a298-e260-6f33-75084630c8bd",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "d07c3219-a298-e260-6f33-75084630c8bd"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "act-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.153772Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/act-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/act-prod-web/providers/Microsoft.Advisor/recommendations/f16a3b20-d6a4-d40c-704e-ed21c9db3527",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "f16a3b20-d6a4-d40c-704e-ed21c9db3527"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "architectnow-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.153772Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/architectnow-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/architectnow-prod-web/providers/Microsoft.Advisor/recommendations/c65c6836-20d5-a9cc-318e-8ffc132e9f8b",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "c65c6836-20d5-a9cc-318e-8ffc132e9f8b"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "ascent-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.153772Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/ascent-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/ascent-prod-web/providers/Microsoft.Advisor/recommendations/c7a868ff-a242-a7cb-33bc-4ca6f8522801",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "c7a868ff-a242-a7cb-33bc-4ca6f8522801"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "catalyst-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1693977Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/catalyst-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/catalyst-prod-web/providers/Microsoft.Advisor/recommendations/9a411643-8057-fad9-f7d9-60d0d3f68067",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "9a411643-8057-fad9-f7d9-60d0d3f68067"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "covenant-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1693977Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/covenant-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/covenant-prod-web/providers/Microsoft.Advisor/recommendations/9b54a16e-2c21-bc5a-2b73-93c12eed1497",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "9b54a16e-2c21-bc5a-2b73-93c12eed1497"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "cse-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1693977Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/cse-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/cse-prod-web/providers/Microsoft.Advisor/recommendations/61c08c4e-4bd2-00ba-58a5-009c64b6e06e",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "61c08c4e-4bd2-00ba-58a5-009c64b6e06e"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "cspemazzanti-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/cspemazzanti-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/cspemazzanti-prod-web/providers/Microsoft.Advisor/recommendations/a6e3fa3d-8ab4-6473-f922-f5331e674c8a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "a6e3fa3d-8ab4-6473-f922-f5331e674c8a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "exe-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/exe-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/exe-prod-web/providers/Microsoft.Advisor/recommendations/e0dc9aed-c53d-c0fb-c956-c89a44b56cba",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e0dc9aed-c53d-c0fb-c956-c89a44b56cba"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "govanguard-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/govanguard-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/govanguard-prod-web/providers/Microsoft.Advisor/recommendations/a2eb03d6-fe06-50dc-e31a-2f54cdc3b0e6",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "a2eb03d6-fe06-50dc-e31a-2f54cdc3b0e6"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "journeyteam-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/journeyteam-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/journeyteam-prod-web/providers/Microsoft.Advisor/recommendations/64c7e1e5-f738-5fc0-b153-c9915c2ed1b5",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "64c7e1e5-f738-5fc0-b153-c9915c2ed1b5"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "netmind-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/netmind-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/netmind-prod-web/providers/Microsoft.Advisor/recommendations/15b15a70-7f32-8b48-4b42-35b24b13c64c",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "15b15a70-7f32-8b48-4b42-35b24b13c64c"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "netways-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/netways-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/netways-prod-web/providers/Microsoft.Advisor/recommendations/f630cd39-bafd-3ecc-05e8-96577b6e1572",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "f630cd39-bafd-3ecc-05e8-96577b6e1572"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "nwcomputing-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/nwcomputing-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/nwcomputing-prod-web/providers/Microsoft.Advisor/recommendations/979d3f47-4c52-2593-bca2-386d3b20e869",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "979d3f47-4c52-2593-bca2-386d3b20e869"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "o365hq-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/o365hq-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/o365hq-prod-web/providers/Microsoft.Advisor/recommendations/d5344d9e-aa2d-397e-160c-1b0606fb4c5b",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "d5344d9e-aa2d-397e-160c-1b0606fb4c5b"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "obungi-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/obungi-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/obungi-prod-web/providers/Microsoft.Advisor/recommendations/12509c2a-a670-8705-447d-2cb4f781fe48",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "12509c2a-a670-8705-447d-2cb4f781fe48"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "pav-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/pav-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/pav-prod-web/providers/Microsoft.Advisor/recommendations/29da87cf-788b-fdab-04c8-c090933dfd9a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "29da87cf-788b-fdab-04c8-c090933dfd9a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "prb-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/prb-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/prb-prod-web/providers/Microsoft.Advisor/recommendations/197e9e01-e56f-9ead-435d-6c07ae857829",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "197e9e01-e56f-9ead-435d-6c07ae857829"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "primend-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/primend-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/primend-prod-web/providers/Microsoft.Advisor/recommendations/6305f4e5-73a3-f32c-808f-5f572543ae47",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "6305f4e5-73a3-f32c-808f-5f572543ae47"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "quantiq-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/quantiq-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/quantiq-prod-web/providers/Microsoft.Advisor/recommendations/b79f0d17-3649-aad5-1f0a-7adcc48ef520",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "b79f0d17-3649-aad5-1f0a-7adcc48ef520"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "r3it-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/r3it-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/r3it-prod-web/providers/Microsoft.Advisor/recommendations/f23ffb8a-4848-29d2-3f80-cc8fbf88e7c3",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "f23ffb8a-4848-29d2-3f80-cc8fbf88e7c3"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "signpost-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/signpost-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/signpost-prod-web/providers/Microsoft.Advisor/recommendations/be427c03-e1a8-0240-5a94-98a33bbd48e1",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "be427c03-e1a8-0240-5a94-98a33bbd48e1"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "terminalb-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/terminalb-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/terminalb-prod-web/providers/Microsoft.Advisor/recommendations/23c39e83-780e-6dab-3468-2208b6e901e2",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "23c39e83-780e-6dab-3468-2208b6e901e2"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "twesolutions-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/twesolutions-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/twesolutions-prod-web/providers/Microsoft.Advisor/recommendations/62d8b39e-3fd4-35ec-fb5c-cffbba7964ce",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "62d8b39e-3fd4-35ec-fb5c-cffbba7964ce"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "webcom-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:45.1850215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/webcom-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/webcom-prod-web/providers/Microsoft.Advisor/recommendations/ed2eca66-b093-a388-962d-020efdc5f8c9",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "ed2eca66-b093-a388-962d-020efdc5f8c9"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "awnthailand-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/awnthailand-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/awnthailand-prod-web/providers/Microsoft.Advisor/recommendations/6dbf0ab4-9163-053f-1379-a8c49020bff3",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "6dbf0ab4-9163-053f-1379-a8c49020bff3"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "becloudsmartv2-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/becloudsmartv2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/becloudsmartv2-prod-web/providers/Microsoft.Advisor/recommendations/341b4dd6-b1f0-a20f-b91c-833ad848c28e",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "341b4dd6-b1f0-a20f-b91c-833ad848c28e"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "btrac-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/btrac-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/btrac-prod-web/providers/Microsoft.Advisor/recommendations/d5a47776-ade6-fd44-1491-f78933de7607",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "d5a47776-ade6-fd44-1491-f78933de7607"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "curotec-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/curotec-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/curotec-prod-web/providers/Microsoft.Advisor/recommendations/b78978dd-8001-6061-0bca-cbac31737e3e",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "b78978dd-8001-6061-0bca-cbac31737e3e"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "efisens-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/efisens-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/efisens-prod-web/providers/Microsoft.Advisor/recommendations/5faed3d4-09c6-c663-98e8-8af4e72a944a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "5faed3d4-09c6-c663-98e8-8af4e72a944a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "eplenish-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/eplenish-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/eplenish-prod-web/providers/Microsoft.Advisor/recommendations/ab4f2a54-f235-2429-5a34-f307f7dfb809",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "ab4f2a54-f235-2429-5a34-f307f7dfb809"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "goaerie-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/goaerie-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/goaerie-prod-web/providers/Microsoft.Advisor/recommendations/02153de5-3cb3-bd8d-dc44-eab5da9230e0",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "02153de5-3cb3-bd8d-dc44-eab5da9230e0"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "impresistem-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/impresistem-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/impresistem-prod-web/providers/Microsoft.Advisor/recommendations/618e99a5-c49a-bc9d-85fc-59cff112c656",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "618e99a5-c49a-bc9d-85fc-59cff112c656"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "infinitygroup-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/infinitygroup-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/infinitygroup-prod-web/providers/Microsoft.Advisor/recommendations/4f7e49ea-08ee-277e-e96d-a2230eaf2c87",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "4f7e49ea-08ee-277e-e96d-a2230eaf2c87"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "intercityv2-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/intercityv2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/intercityv2-prod-web/providers/Microsoft.Advisor/recommendations/b46c1231-c98f-6c57-b7a3-dec9302d7ee9",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "b46c1231-c98f-6c57-b7a3-dec9302d7ee9"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "motifworks-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/motifworks-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/motifworks-prod-web/providers/Microsoft.Advisor/recommendations/052186f2-1369-4da8-37b7-a454b9ce5ce5",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "052186f2-1369-4da8-37b7-a454b9ce5ce5"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "pcm-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/pcm-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/pcm-prod-web/providers/Microsoft.Advisor/recommendations/eb7aa9fb-7b6d-c9f5-1885-d9b596d4f2e9",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "eb7aa9fb-7b6d-c9f5-1885-d9b596d4f2e9"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "protectedtrust-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/protectedtrust-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/protectedtrust-prod-web/providers/Microsoft.Advisor/recommendations/bdaaecd8-0bb2-dc38-71ea-feba03847b15",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "bdaaecd8-0bb2-dc38-71ea-feba03847b15"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "softip-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/softip-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/softip-prod-web/providers/Microsoft.Advisor/recommendations/c7083164-c28f-3ea0-d9b2-2e106d810f00",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "c7083164-c28f-3ea0-d9b2-2e106d810f00"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "spektrasandbox-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8726306Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/spektrasandbox-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/spektrasandbox-prod-web/providers/Microsoft.Advisor/recommendations/ed659fb0-4d27-ba3e-0d9e-242bd3a0a668",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "ed659fb0-4d27-ba3e-0d9e-242bd3a0a668"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "synovatec-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8882568Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/synovatec-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/synovatec-prod-web/providers/Microsoft.Advisor/recommendations/b08a2777-2465-8bfc-1992-310b0cfacd2e",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "b08a2777-2465-8bfc-1992-310b0cfacd2e"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "tbs-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8882568Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/tbs-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/tbs-prod-web/providers/Microsoft.Advisor/recommendations/0184f506-8664-dce1-542c-88d93200af54",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "0184f506-8664-dce1-542c-88d93200af54"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "techquarters-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8882568Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/techquarters-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/techquarters-prod-web/providers/Microsoft.Advisor/recommendations/6c5d44d5-1440-14d7-04fa-75d9c2d6f145",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "6c5d44d5-1440-14d7-04fa-75d9c2d6f145"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "turnkeytec-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:57.8882568Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/turnkeytec-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/turnkeytec-prod-web/providers/Microsoft.Advisor/recommendations/f452f60e-8ba9-2000-5105-382d0a7755b8",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "f452f60e-8ba9-2000-5105-382d0a7755b8"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "amtrasolutions-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/amtrasolutions-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/amtrasolutions-prod-web/providers/Microsoft.Advisor/recommendations/ad2671a1-fcbb-c4ab-5d74-b46c2046dcec",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "ad2671a1-fcbb-c4ab-5d74-b46c2046dcec"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "bandrsolutions-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/bandrsolutions-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/bandrsolutions-prod-web/providers/Microsoft.Advisor/recommendations/e73fc04d-12c8-4117-e83f-faee2ae5ed99",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e73fc04d-12c8-4117-e83f-faee2ae5ed99"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "fsistrategies-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/fsistrategies-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/fsistrategies-prod-web/providers/Microsoft.Advisor/recommendations/2d26f664-f55e-6e3d-fd10-3ef92b3fc40b",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "2d26f664-f55e-6e3d-fd10-3ef92b3fc40b"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "helios-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/helios-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/helios-prod-web/providers/Microsoft.Advisor/recommendations/23874c4b-3daf-ee36-ae73-c68adb8f1b1f",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "23874c4b-3daf-ee36-ae73-c68adb8f1b1f"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "i2n-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/i2n-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/i2n-prod-web/providers/Microsoft.Advisor/recommendations/a9b27239-d568-1948-9cf7-d726fc7e632a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "a9b27239-d568-1948-9cf7-d726fc7e632a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "itpoint-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/itpoint-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/itpoint-prod-web/providers/Microsoft.Advisor/recommendations/feaa66c3-d551-49a7-3562-ac7a2e32cc14",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "feaa66c3-d551-49a7-3562-ac7a2e32cc14"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "kizan-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/kizan-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/kizan-prod-web/providers/Microsoft.Advisor/recommendations/de052208-9982-6eab-7b10-3a6d619beffa",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "de052208-9982-6eab-7b10-3a6d619beffa"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "kocho-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/kocho-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/kocho-prod-web/providers/Microsoft.Advisor/recommendations/a4dec48f-382f-1e30-bfc6-07cd01f724d7",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "a4dec48f-382f-1e30-bfc6-07cd01f724d7"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "mikennet-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-prod-rg/providers/Microsoft.Network/trafficmanagerprofiles/mikennet-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-prod-rg/providers/Microsoft.Network/trafficmanagerprofiles/mikennet-prod-web/providers/Microsoft.Advisor/recommendations/abfbea10-f176-3901-b185-089cf152bfa5",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "abfbea10-f176-3901-b185-089cf152bfa5"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "neway-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/neway-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/neway-prod-web/providers/Microsoft.Advisor/recommendations/2d656cdf-e3c6-31c3-3d59-4141589ca00f",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "2d656cdf-e3c6-31c3-3d59-4141589ca00f"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "ptsgroup-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/ptsgroup-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/ptsgroup-prod-web/providers/Microsoft.Advisor/recommendations/093f2c0d-f889-a6b7-fa5e-2a4cddea5081",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "093f2c0d-f889-a6b7-fa5e-2a4cddea5081"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "turnpointv2-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/turnpointv2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/turnpointv2-prod-web/providers/Microsoft.Advisor/recommendations/156c07c1-1ca0-7474-e748-87305c633ef2",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "156c07c1-1ca0-7474-e748-87305c633ef2"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "aconitas-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5134049Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/aconitas-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/aconitas-prod-web/providers/Microsoft.Advisor/recommendations/59ed96c9-a091-1552-9851-38129d3932b4",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "59ed96c9-a091-1552-9851-38129d3932b4"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "advancedbits-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5134049Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/advancedbits-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/advancedbits-prod-web/providers/Microsoft.Advisor/recommendations/bffd7aa1-adeb-2d22-89e7-d6797d20863a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "bffd7aa1-adeb-2d22-89e7-d6797d20863a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "allieddigital-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5134049Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/allieddigital-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/allieddigital-prod-web/providers/Microsoft.Advisor/recommendations/c8580a35-ae2b-abc5-d780-0016a43f072a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "c8580a35-ae2b-abc5-d780-0016a43f072a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "atechsupport-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5134049Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/atechsupport-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/atechsupport-prod-web/providers/Microsoft.Advisor/recommendations/64be8c03-7e3c-3f9c-e7f5-8a9d5df327b2",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "64be8c03-7e3c-3f9c-e7f5-8a9d5df327b2"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "c3ntro-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5134049Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/c3ntro-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/c3ntro-prod-web/providers/Microsoft.Advisor/recommendations/cec7932a-f408-5e53-dfdc-574326b6a52d",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "cec7932a-f408-5e53-dfdc-574326b6a52d"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "cloudlogic-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5134049Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/cloudlogic-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/cloudlogic-prod-web/providers/Microsoft.Advisor/recommendations/d2d1d2eb-bb6e-acf0-8d88-fbb43d00e269",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "d2d1d2eb-bb6e-acf0-8d88-fbb43d00e269"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "dtx-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/dtx-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/dtx-prod-web/providers/Microsoft.Advisor/recommendations/56dbda27-46ea-05e3-d9cd-5ed5b905189b",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "56dbda27-46ea-05e3-d9cd-5ed5b905189b"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "econsortiumv2-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/econsortiumv2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/econsortiumv2-prod-web/providers/Microsoft.Advisor/recommendations/cb28fe7f-5fdd-1d58-8e80-6bf1d5909739",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "cb28fe7f-5fdd-1d58-8e80-6bf1d5909739"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "getronicscsp1de-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/getronicscsp1de-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/getronicscsp1de-prod-web/providers/Microsoft.Advisor/recommendations/ca016160-d0de-c9c2-d48c-ce054a419470",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "ca016160-d0de-c9c2-d48c-ce054a419470"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "groupejcd-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/groupejcd-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/groupejcd-prod-web/providers/Microsoft.Advisor/recommendations/a9ba285d-e0f6-1c42-0075-6246b1550227",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "a9ba285d-e0f6-1c42-0075-6246b1550227"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "hensongroup-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/hensongroup-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/hensongroup-prod-web/providers/Microsoft.Advisor/recommendations/5506bc1c-3efd-568f-1270-8967f61a0a9b",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "5506bc1c-3efd-568f-1270-8967f61a0a9b"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "kingsolv2-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/kingsolv2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/kingsolv2-prod-web/providers/Microsoft.Advisor/recommendations/6af1ceb5-ec93-a655-621b-c9255784c847",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "6af1ceb5-ec93-a655-621b-c9255784c847"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "pacsp-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/pacsp-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/pacsp-prod-web/providers/Microsoft.Advisor/recommendations/79e3b431-2e0e-5c87-aee5-dc63758277b5",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "79e3b431-2e0e-5c87-aee5-dc63758277b5"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "qit-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/qit-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/qit-prod-web/providers/Microsoft.Advisor/recommendations/a587ac26-275a-1caf-acaf-3070e94dd56b",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "a587ac26-275a-1caf-acaf-3070e94dd56b"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "resolutionit-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/resolutionit-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/resolutionit-prod-web/providers/Microsoft.Advisor/recommendations/439a862a-401a-bdaa-0556-484f1c91d874",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "439a862a-401a-bdaa-0556-484f1c91d874"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "sonata-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/sonata-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/sonata-prod-web/providers/Microsoft.Advisor/recommendations/8c29efb8-0a4a-7c83-688b-89d53154e417",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "8c29efb8-0a4a-7c83-688b-89d53154e417"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "wcius-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/wcius-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/wcius-prod-web/providers/Microsoft.Advisor/recommendations/3be558c4-f332-0671-dae0-55b229d94208",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "3be558c4-f332-0671-dae0-55b229d94208"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "zenzero-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/zenzero-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/zenzero-prod-web/providers/Microsoft.Advisor/recommendations/9be6f023-9469-bb1e-9606-9e9e478e5b85",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "9be6f023-9469-bb1e-9606-9e9e478e5b85"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "aditso-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/aditso-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/aditso-prod-web/providers/Microsoft.Advisor/recommendations/838aa515-0b18-dd95-1c21-a58e7a093cc2",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "838aa515-0b18-dd95-1c21-a58e7a093cc2"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "alfun-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/alfun-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/alfun-prod-web/providers/Microsoft.Advisor/recommendations/d5bcc44a-f5e9-7446-13fc-53e630a63189",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "d5bcc44a-f5e9-7446-13fc-53e630a63189"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "buiza-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/buiza-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/buiza-prod-web/providers/Microsoft.Advisor/recommendations/393e8a9b-2ede-2132-d9da-bda81577d4da",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "393e8a9b-2ede-2132-d9da-bda81577d4da"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "exobe-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/exobe-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/exobe-prod-web/providers/Microsoft.Advisor/recommendations/0c2aed6f-dd3a-ede2-1f8b-c88692b6d282",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "0c2aed6f-dd3a-ede2-1f8b-c88692b6d282"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "inverodigital-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/inverodigital-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/inverodigital-prod-web/providers/Microsoft.Advisor/recommendations/91b49560-9072-2c5b-a2c0-4ef404d335d5",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "91b49560-9072-2c5b-a2c0-4ef404d335d5"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "korcomptenzinc-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/korcomptenzinc-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/korcomptenzinc-prod-web/providers/Microsoft.Advisor/recommendations/cf70cb4b-3f84-bb9b-e6f4-81a7236910e4",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "cf70cb4b-3f84-bb9b-e6f4-81a7236910e4"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "nhc-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/nhc-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/nhc-prod-web/providers/Microsoft.Advisor/recommendations/a1ac97b4-ff20-3bed-23b2-153694f095c9",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "a1ac97b4-ff20-3bed-23b2-153694f095c9"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "nimbuslogic-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/nimbuslogic-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/nimbuslogic-prod-web/providers/Microsoft.Advisor/recommendations/840ce37e-daad-414f-8cdd-d450dada6d2d",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "840ce37e-daad-414f-8cdd-d450dada6d2d"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "oneneck-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/oneneck-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/oneneck-prod-web/providers/Microsoft.Advisor/recommendations/eb49216a-bbb9-ecfc-7433-523768cfb509",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "eb49216a-bbb9-ecfc-7433-523768cfb509"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "realpage-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/realpage-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/realpage-prod-web/providers/Microsoft.Advisor/recommendations/9cebedd9-5ea5-6903-d4c7-d7dac5ff67fd",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "9cebedd9-5ea5-6903-d4c7-d7dac5ff67fd"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "redriver-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/redriver-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/redriver-prod-web/providers/Microsoft.Advisor/recommendations/dc1d7b4b-feed-2715-13bb-71876e5510d3",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "dc1d7b4b-feed-2715-13bb-71876e5510d3"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "skysystems-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/skysystems-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/skysystems-prod-web/providers/Microsoft.Advisor/recommendations/35373c6e-d32c-5eec-2488-09ca5b3fb814",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "35373c6e-d32c-5eec-2488-09ca5b3fb814"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "xenit-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:23.1384822Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/xenit-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/xenit-prod-web/providers/Microsoft.Advisor/recommendations/f04c91e7-f16c-d452-f5ee-1c7a88d7b3ee",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "f04c91e7-f16c-d452-f5ee-1c7a88d7b3ee"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "allegronet-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1239428Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/allegronet-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/allegronet-prod-web/providers/Microsoft.Advisor/recommendations/d9922f46-1a25-e716-e7e3-22164eed6510",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "d9922f46-1a25-e716-e7e3-22164eed6510"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "carahsoft-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1239428Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/carahsoft-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/carahsoft-prod-web/providers/Microsoft.Advisor/recommendations/cb53c229-8e79-682a-5281-1caf480c8b71",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "cb53c229-8e79-682a-5281-1caf480c8b71"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "cloud-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1239428Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/cloud-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/cloud-prod-web/providers/Microsoft.Advisor/recommendations/43603d56-6403-9a46-46a3-0024b372d5f7",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "43603d56-6403-9a46-46a3-0024b372d5f7"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "cloudsquared-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1239428Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/cloudsquared-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/cloudsquared-prod-web/providers/Microsoft.Advisor/recommendations/ff854248-53a0-6334-be7d-122c01e76490",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "ff854248-53a0-6334-be7d-122c01e76490"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "cubesys-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1239428Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/cubesys-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/cubesys-prod-web/providers/Microsoft.Advisor/recommendations/e70a8bc0-dcb9-5640-1537-5a15f782bac1",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e70a8bc0-dcb9-5640-1537-5a15f782bac1"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "eitex-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1239428Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/eitex-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/eitex-prod-web/providers/Microsoft.Advisor/recommendations/804fbc06-2d50-166a-7ce5-8a77f40db828",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "804fbc06-2d50-166a-7ce5-8a77f40db828"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "hartlgroup-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/hartlgroup-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/hartlgroup-prod-web/providers/Microsoft.Advisor/recommendations/e9f15960-7b81-9a9d-c0cf-5cb908c16d05",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e9f15960-7b81-9a9d-c0cf-5cb908c16d05"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "idkomdirectbill-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/idkomdirectbill-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/idkomdirectbill-prod-web/providers/Microsoft.Advisor/recommendations/6e0c2701-b435-1301-097f-8c0b16b6a4e3",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "6e0c2701-b435-1301-097f-8c0b16b6a4e3"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "ironorbit-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/ironorbit-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/ironorbit-prod-web/providers/Microsoft.Advisor/recommendations/96805570-1195-5514-10dc-f10b6a422ae7",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "96805570-1195-5514-10dc-f10b6a422ae7"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "itintegrity-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/itintegrity-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/itintegrity-prod-web/providers/Microsoft.Advisor/recommendations/e97ee5b1-7689-b7a5-6587-484df3588cda",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e97ee5b1-7689-b7a5-6587-484df3588cda"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "lanworx-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/lanworx-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/lanworx-prod-web/providers/Microsoft.Advisor/recommendations/df6f7c1d-2adb-776a-2b68-c075be2d92ed",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "df6f7c1d-2adb-776a-2b68-c075be2d92ed"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "scoriatech-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/scoriatech-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/scoriatech-prod-web/providers/Microsoft.Advisor/recommendations/fcd4aa3a-7b1c-4291-b7b8-5d640a7904fd",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "fcd4aa3a-7b1c-4291-b7b8-5d640a7904fd"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "soprasteria-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/soprasteria-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/soprasteria-prod-web/providers/Microsoft.Advisor/recommendations/ad1a71bd-469b-9b66-15c0-1f3ea4bb5a35",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "ad1a71bd-469b-9b66-15c0-1f3ea4bb5a35"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "spadeworx-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/spadeworx-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/spadeworx-prod-web/providers/Microsoft.Advisor/recommendations/af68ffd6-b101-7452-50cb-eee685b4ce87",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "af68ffd6-b101-7452-50cb-eee685b4ce87"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "techoneph-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/techoneph-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/techoneph-prod-web/providers/Microsoft.Advisor/recommendations/e88eb94d-390a-0e47-c3ad-bef0f7b8d424",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e88eb94d-390a-0e47-c3ad-bef0f7b8d424"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "trndigital-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/trndigital-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/trndigital-prod-web/providers/Microsoft.Advisor/recommendations/debcee65-501d-1f37-5669-6d1a18e1931b",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "debcee65-501d-1f37-5669-6d1a18e1931b"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "virtuellegroup-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/virtuellegroup-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/virtuellegroup-prod-web/providers/Microsoft.Advisor/recommendations/aa34e844-7045-ee1e-d29a-69ace6f13b2e",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "aa34e844-7045-ee1e-d29a-69ace6f13b2e"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "vitalcore-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/vitalcore-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/vitalcore-prod-web/providers/Microsoft.Advisor/recommendations/11124fec-49c1-67ed-06eb-841c8e29e54c",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "11124fec-49c1-67ed-06eb-841c8e29e54c"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "wesafe-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/wesafe-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/wesafe-prod-web/providers/Microsoft.Advisor/recommendations/a9939cda-d5b6-c546-2925-de968e9574c0",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "a9939cda-d5b6-c546-2925-de968e9574c0"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "cb20-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5615215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/cb20-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/cb20-prod-web/providers/Microsoft.Advisor/recommendations/46f8df49-89c2-96af-7e0a-5b558a3161ba",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "46f8df49-89c2-96af-7e0a-5b558a3161ba"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "modernit-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5615215Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/modernit-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/modernit-prod-web/providers/Microsoft.Advisor/recommendations/1c07d843-56e1-5bc0-e630-695646e64f5f",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "1c07d843-56e1-5bc0-e630-695646e64f5f"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "nagarroat-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5771454Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/nagarroat-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/nagarroat-prod-web/providers/Microsoft.Advisor/recommendations/3f221949-0ac0-9e41-16ed-128841fb40fd",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "3f221949-0ac0-9e41-16ed-128841fb40fd"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "nviron-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5771454Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/nviron-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/nviron-prod-web/providers/Microsoft.Advisor/recommendations/eb727637-8279-b5b5-1092-5dd5b3c8595a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "eb727637-8279-b5b5-1092-5dd5b3c8595a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "oakwoodsys-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5771454Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/oakwoodsys-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/oakwoodsys-prod-web/providers/Microsoft.Advisor/recommendations/336c3a1f-4318-8be7-2f4f-143272eb214f",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "336c3a1f-4318-8be7-2f4f-143272eb214f"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "omni-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5771454Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/omni-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/omni-prod-web/providers/Microsoft.Advisor/recommendations/7e2c7639-8b8a-128e-f9eb-3807ae3dcb95",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "7e2c7639-8b8a-128e-f9eb-3807ae3dcb95"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "pointv2-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5771454Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/pointv2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/pointv2-prod-web/providers/Microsoft.Advisor/recommendations/9e1d7663-d003-0c2f-53ef-c0059c53b408",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "9e1d7663-d003-0c2f-53ef-c0059c53b408"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "projetlys-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5771454Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/projetlys-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/projetlys-prod-web/providers/Microsoft.Advisor/recommendations/496fe436-5d43-1098-3f3c-b7a72e99b026",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "496fe436-5d43-1098-3f3c-b7a72e99b026"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "sentrian-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5927715Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/sentrian-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/sentrian-prod-web/providers/Microsoft.Advisor/recommendations/cbbfde19-4914-01e5-c069-69f8de0b8363",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "cbbfde19-4914-01e5-c069-69f8de0b8363"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "silicon-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5927715Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/silicon-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/silicon-prod-web/providers/Microsoft.Advisor/recommendations/ff2f0b8a-3185-9868-5956-828f3512266a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "ff2f0b8a-3185-9868-5956-828f3512266a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "sygnalpartners-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5927715Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/sygnalpartners-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/sygnalpartners-prod-web/providers/Microsoft.Advisor/recommendations/7bb57bf5-b279-637c-d20f-30ed3b21e489",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "7bb57bf5-b279-637c-d20f-30ed3b21e489"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "systemfarmer-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5927715Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/systemfarmer-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/systemfarmer-prod-web/providers/Microsoft.Advisor/recommendations/52e443f3-799d-2cef-3303-b44d66eccb56",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "52e443f3-799d-2cef-3303-b44d66eccb56"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "tpt-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5927715Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/tpt-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/tpt-prod-web/providers/Microsoft.Advisor/recommendations/680f7794-024a-79d1-6de7-ecf67e488be8",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "680f7794-024a-79d1-6de7-ecf67e488be8"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "vintin-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5927715Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/vintin-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/vintin-prod-web/providers/Microsoft.Advisor/recommendations/7ae0d2a6-5d7e-d9e2-8642-ab46d72b2e0c",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "7ae0d2a6-5d7e-d9e2-8642-ab46d72b2e0c"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "abtecnet-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.983493Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/abtecnet-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/abtecnet-prod-web/providers/Microsoft.Advisor/recommendations/8df6cece-a0ef-ec53-65c9-020bc2243645",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "8df6cece-a0ef-ec53-65c9-020bc2243645"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "acs-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.983493Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/acs-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/acs-prod-web/providers/Microsoft.Advisor/recommendations/375851c4-340b-297e-ebc8-335661ae5e1f",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "375851c4-340b-297e-ebc8-335661ae5e1f"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "anexinet-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.983493Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/anexinet-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/anexinet-prod-web/providers/Microsoft.Advisor/recommendations/995c32d9-5ecc-0115-a0ff-c281ac7270d4",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "995c32d9-5ecc-0115-a0ff-c281ac7270d4"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "atosttsat-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/atosttsat-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/atosttsat-prod-web/providers/Microsoft.Advisor/recommendations/4d60dfe5-5913-7646-b2fb-bce4cc4ed4d9",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "4d60dfe5-5913-7646-b2fb-bce4cc4ed4d9"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "dex-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/dex-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/dex-prod-web/providers/Microsoft.Advisor/recommendations/36b96e1c-6480-7443-8180-c4f1ed2d671d",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "36b96e1c-6480-7443-8180-c4f1ed2d671d"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "etrepid-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/etrepid-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/etrepid-prod-web/providers/Microsoft.Advisor/recommendations/29751777-2383-0c8b-eddd-eed10f925808",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "29751777-2383-0c8b-eddd-eed10f925808"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "inspark-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/inspark-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/inspark-prod-web/providers/Microsoft.Advisor/recommendations/c74a08f2-cabb-b337-3d80-9b3012227291",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "c74a08f2-cabb-b337-3d80-9b3012227291"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "integrato-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/integrato-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/integrato-prod-web/providers/Microsoft.Advisor/recommendations/9df23143-e54e-ac62-52b0-37e21602ba5f",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "9df23143-e54e-ac62-52b0-37e21602ba5f"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "itec-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/itec-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/itec-prod-web/providers/Microsoft.Advisor/recommendations/d344bc24-981c-17bc-ecc1-a3da4d7d164c",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "d344bc24-981c-17bc-ecc1-a3da4d7d164c"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "itvt-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/itvt-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/itvt-prod-web/providers/Microsoft.Advisor/recommendations/c21cca67-49b6-18e3-cc9f-cf3967f5bd29",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "c21cca67-49b6-18e3-cc9f-cf3967f5bd29"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "korcomptenztech-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/korcomptenztech-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/korcomptenztech-prod-web/providers/Microsoft.Advisor/recommendations/95144700-404a-0b88-2868-b31316a02ff9",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "95144700-404a-0b88-2868-b31316a02ff9"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "netformatie-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/netformatie-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/netformatie-prod-web/providers/Microsoft.Advisor/recommendations/81a9494c-5389-5824-3f24-6fad35b2d2c4",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "81a9494c-5389-5824-3f24-6fad35b2d2c4"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "rmsource-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/rmsource-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/rmsource-prod-web/providers/Microsoft.Advisor/recommendations/fa9e16e7-31d4-5294-a5c0-2cb8c273c98e",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "fa9e16e7-31d4-5294-a5c0-2cb8c273c98e"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "spyglassmtg-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/spyglassmtg-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/spyglassmtg-prod-web/providers/Microsoft.Advisor/recommendations/d9c49460-fa02-fc53-51d5-87ece6a073d4",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "d9c49460-fa02-fc53-51d5-87ece6a073d4"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "websan-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/websan-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/websan-prod-web/providers/Microsoft.Advisor/recommendations/f17ef674-ca3a-45d1-cf61-f359785f2714",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "f17ef674-ca3a-45d1-cf61-f359785f2714"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "abramssolutions-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/abramssolutions-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/abramssolutions-prod-web/providers/Microsoft.Advisor/recommendations/b092d830-5028-7169-052a-21588e284ea1",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "b092d830-5028-7169-052a-21588e284ea1"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "cancomus-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/cancomus-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/cancomus-prod-web/providers/Microsoft.Advisor/recommendations/e894a231-f57a-935d-b818-d9e87f8e6eac",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e894a231-f57a-935d-b818-d9e87f8e6eac"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "connexit-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/connexit-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/connexit-prod-web/providers/Microsoft.Advisor/recommendations/0906b08d-8c99-6321-a590-0450fcfd4093",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "0906b08d-8c99-6321-a590-0450fcfd4093"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "conxion-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/conxion-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/conxion-prod-web/providers/Microsoft.Advisor/recommendations/4e69d17b-e9e7-ff6c-88d7-6d457e5bf0b7",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "4e69d17b-e9e7-ff6c-88d7-6d457e5bf0b7"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "damecon-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/damecon-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/damecon-prod-web/providers/Microsoft.Advisor/recommendations/dc172f4a-8926-2466-da59-046c57d7148e",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "dc172f4a-8926-2466-da59-046c57d7148e"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "frciv2-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/frciv2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/frciv2-prod-web/providers/Microsoft.Advisor/recommendations/7a689d42-3ef4-b2d5-3f5b-f7097fa2f78a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "7a689d42-3ef4-b2d5-3f5b-f7097fa2f78a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "itcs-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/itcs-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/itcs-prod-web/providers/Microsoft.Advisor/recommendations/641e190c-cd69-fd77-ecec-f741000fdf01",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "641e190c-cd69-fd77-ecec-f741000fdf01"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "jdmv2-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/jdmv2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/jdmv2-prod-web/providers/Microsoft.Advisor/recommendations/e08191f8-84ce-08ab-49d2-a7f65dc44093",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "e08191f8-84ce-08ab-49d2-a7f65dc44093"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "lgnetworksinc-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/lgnetworksinc-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/lgnetworksinc-prod-web/providers/Microsoft.Advisor/recommendations/a6d38437-8282-8c0c-4d98-79330bcd4696",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "a6d38437-8282-8c0c-4d98-79330bcd4696"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "lns-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/lns-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/lns-prod-web/providers/Microsoft.Advisor/recommendations/8ed0e070-f2a7-3889-19db-ed92d3383483",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "8ed0e070-f2a7-3889-19db-ed92d3383483"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "mint-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/mint-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/mint-prod-web/providers/Microsoft.Advisor/recommendations/66f24e60-427d-e341-d265-cc0328eea8c7",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "66f24e60-427d-e341-d265-cc0328eea8c7"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "novacapta-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/novacapta-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/novacapta-prod-web/providers/Microsoft.Advisor/recommendations/6b4b7745-3e34-c24a-b7d6-6615649e507c",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "6b4b7745-3e34-c24a-b7d6-6615649e507c"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "sogetilums-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/sogetilums-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/sogetilums-prod-web/providers/Microsoft.Advisor/recommendations/19c6546e-3a60-8276-ec8a-79ae854b6c40",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "19c6546e-3a60-8276-ec8a-79ae854b6c40"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "transparity-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/transparity-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/transparity-prod-web/providers/Microsoft.Advisor/recommendations/fe919ef5-2ed1-ec92-2efa-d0a0d56427eb",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "fe919ef5-2ed1-ec92-2efa-d0a0d56427eb"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "turnkeytecv2-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1241839Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/turnkeytecv2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/turnkeytecv2-prod-web/providers/Microsoft.Advisor/recommendations/720b761f-82ee-d0f1-8c1d-acab3dc5daa1",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "720b761f-82ee-d0f1-8c1d-acab3dc5daa1"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "ucloud-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1398095Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/ucloud-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/ucloud-prod-web/providers/Microsoft.Advisor/recommendations/c264d848-132e-5f46-177c-7238e75ce5cf",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "c264d848-132e-5f46-177c-7238e75ce5cf"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "wintellisys-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:58.1398095Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/wintellisys-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/wintellisys-prod-web/providers/Microsoft.Advisor/recommendations/b3a92f21-dbbe-29e2-ff75-5670b330e723",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "b3a92f21-dbbe-29e2-ff75-5670b330e723"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "aztechit-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/aztechit-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/aztechit-prod-web/providers/Microsoft.Advisor/recommendations/792aa2c3-25b2-1dc5-e3c6-ef3d74d51692",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "792aa2c3-25b2-1dc5-e3c6-ef3d74d51692"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "baggenstos-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/baggenstos-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/baggenstos-prod-web/providers/Microsoft.Advisor/recommendations/4d326b24-2b75-e4b9-57b0-1cd71f643fca",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "4d326b24-2b75-e4b9-57b0-1cd71f643fca"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "baroan-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/baroan-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/baroan-prod-web/providers/Microsoft.Advisor/recommendations/554dd30f-71bb-b1ca-6446-93f55b322e8b",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "554dd30f-71bb-b1ca-6446-93f55b322e8b"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "broadhorizon-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/broadhorizon-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/broadhorizon-prod-web/providers/Microsoft.Advisor/recommendations/dbd87fca-bdab-3137-7ede-1d49954b9ee6",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "dbd87fca-bdab-3137-7ede-1d49954b9ee6"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "l3csp-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/l3csp-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/l3csp-prod-web/providers/Microsoft.Advisor/recommendations/80dfa326-6305-58c1-9416-525c15d3211f",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "80dfa326-6305-58c1-9416-525c15d3211f"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "mainstreameu-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/mainstreameu-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/mainstreameu-prod-web/providers/Microsoft.Advisor/recommendations/7bd41332-3fc6-7579-e7f6-64fb6b1060ac",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "7bd41332-3fc6-7579-e7f6-64fb6b1060ac"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "oblok-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/oblok-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/oblok-prod-web/providers/Microsoft.Advisor/recommendations/3e17530e-a597-b001-7590-12091874a329",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "3e17530e-a597-b001-7590-12091874a329"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "quostar-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/quostar-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/quostar-prod-web/providers/Microsoft.Advisor/recommendations/57b8bc92-a40e-afac-a745-d4adc4ff926d",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "57b8bc92-a40e-afac-a745-d4adc4ff926d"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "spektrasystemsv2-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/spektrasystemsv2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/spektrasystemsv2-prod-web/providers/Microsoft.Advisor/recommendations/c1be3650-f689-7b4b-68ac-3e57a7b9177a",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "c1be3650-f689-7b4b-68ac-3e57a7b9177a"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "swatsystems-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/swatsystems-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/swatsystems-prod-web/providers/Microsoft.Advisor/recommendations/8318030a-34d9-1057-7bc1-21f5a1d5d52e",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "8318030a-34d9-1057-7bc1-21f5a1d5d52e"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "synergetics-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/synergetics-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-apac-rg/providers/Microsoft.Network/trafficmanagerprofiles/synergetics-prod-web/providers/Microsoft.Advisor/recommendations/8251ce5a-75a9-8084-4234-9f33d1416c10",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "8251ce5a-75a9-8084-4234-9f33d1416c10"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "teamventi-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/teamventi-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/teamventi-prod-web/providers/Microsoft.Advisor/recommendations/735cee07-0e20-7abf-95b6-a4c950770e0f",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "735cee07-0e20-7abf-95b6-a4c950770e0f"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "vanroey-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/vanroey-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/vanroey-prod-web/providers/Microsoft.Advisor/recommendations/4bba3d16-b822-adb4-7bc1-aa8d8c62fc73",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "4bba3d16-b822-adb4-7bc1-aa8d8c62fc73"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "vm2-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/vm2-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/vm2-prod-web/providers/Microsoft.Advisor/recommendations/aec5dec7-04bb-77f0-e5cf-f0b968345822",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "aec5dec7-04bb-77f0-e5cf-f0b968345822"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "wcican-prod-web",
    //       "lastUpdated": "2023-12-13T04:38:03.7179817Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/wcican-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-us-rg/providers/Microsoft.Network/trafficmanagerprofiles/wcican-prod-web/providers/Microsoft.Advisor/recommendations/9ec334cb-02e0-f983-3808-b2b2e09c0cfc",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "9ec334cb-02e0-f983-3808-b2b2e09c0cfc"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "ims-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/ims-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/ims-prod-web/providers/Microsoft.Advisor/recommendations/b4bd7619-3c92-52ad-09c3-be3ba59a62e1",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "b4bd7619-3c92-52ad-09c3-be3ba59a62e1"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "pacxa-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/pacxa-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/pacxa-prod-web/providers/Microsoft.Advisor/recommendations/b509b2a1-a664-976a-a9b8-bebfba7859bf",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "b509b2a1-a664-976a-a9b8-bebfba7859bf"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "miles-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:06.3570827Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/miles-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/miles-prod-web/providers/Microsoft.Advisor/recommendations/4e562c57-a504-ba34-02e0-ab387b064426",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "4e562c57-a504-ba34-02e0-ab387b064426"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "sayers-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/sayers-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/sayers-prod-web/providers/Microsoft.Advisor/recommendations/1dc4d53a-b352-2a66-70e0-9c7d32780ae6",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "1dc4d53a-b352-2a66-70e0-9c7d32780ae6"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "virtualit-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:40.5927715Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/virtualit-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/virtualit-prod-web/providers/Microsoft.Advisor/recommendations/769593ff-8e8a-c408-e2a6-8afc521ca08e",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "769593ff-8e8a-c408-e2a6-8afc521ca08e"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "pchtechnologies-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/pchtechnologies-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/pchtechnologies-prod-web/providers/Microsoft.Advisor/recommendations/114b9d0b-f07f-e59d-954e-932617440743",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "114b9d0b-f07f-e59d-954e-932617440743"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "elca-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/elca-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/elca-prod-web/providers/Microsoft.Advisor/recommendations/5f6c5a9d-dcbc-79b8-f2c7-9ea7caced0ec",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "5f6c5a9d-dcbc-79b8-f2c7-9ea7caced0ec"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "irsas-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:50.9991151Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/irsas-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/irsas-prod-web/providers/Microsoft.Advisor/recommendations/2ccc8bfb-fe5a-f4bf-c3ce-e78969b32d8c",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "2ccc8bfb-fe5a-f4bf-c3ce-e78969b32d8c"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "rpmit-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:14.5290305Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/rpmit-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/rpmit-prod-web/providers/Microsoft.Advisor/recommendations/7fd3bbbc-d52d-e281-f74b-a03efb96f816",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "7fd3bbbc-d52d-e281-f74b-a03efb96f816"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "adrytech-prod-web",
    //       "lastUpdated": "2023-12-13T04:36:44.9662668Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/adrytech-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-us1-rg/providers/Microsoft.Network/trafficmanagerprofiles/adrytech-prod-web/providers/Microsoft.Advisor/recommendations/07f277be-0e43-64b5-7cd3-59dd96c2fef0",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "07f277be-0e43-64b5-7cd3-59dd96c2fef0"
    //   }, {
    //     "properties": {
    //       "category": "Performance",
    //       "impact": "Medium",
    //       "impactedField": "Microsoft.Network/trafficmanagerprofiles",
    //       "impactedValue": "iteracon-prod-web",
    //       "lastUpdated": "2023-12-13T04:37:32.1395687Z",
    //       "recommendationTypeId": "d374a732-e69b-41dc-bbc2-a7234e2270be",
    //       "shortDescription": {
    //         "problem": "Configure DNS Time to Live to 60 seconds",
    //         "solution": "Configure DNS Time to Live to 60 seconds"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/iteracon-prod-web"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourceGroups/c3v2-signup-eu-rg/providers/Microsoft.Network/trafficmanagerprofiles/iteracon-prod-web/providers/Microsoft.Advisor/recommendations/f7e39fa0-e923-ff46-8ff1-36e162fc43a0",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "f7e39fa0-e923-ff46-8ff1-36e162fc43a0"
    //   }, {
    //     "properties": {
    //       "category": "HighAvailability",
    //       "impact": "Medium",
    //       "impactedField": "MICROSOFT.NETWORK/VIRTUALNETWORKS",
    //       "impactedValue": "validation-tool-vnet",
    //       "lastUpdated": "2023-12-13T06:28:24.4709032Z",
    //       "recommendationTypeId": "56f0c458-521d-4b8b-a704-c0a099483d19",
    //       "shortDescription": {
    //         "problem": "Use NAT gateway for outbound connectivity",
    //         "solution": "Use NAT gateway for outbound connectivity"
    //       },
    //       "extendedProperties": {
    //         "region": "centralindia"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourcegroups/validation-tool/providers/microsoft.network/virtualnetworks/validation-tool-vnet"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourcegroups/validation-tool/providers/microsoft.network/virtualnetworks/validation-tool-vnet/providers/Microsoft.Advisor/recommendations/cb7c3cbf-8fbe-b9e1-965b-3f00b53b3140",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "cb7c3cbf-8fbe-b9e1-965b-3f00b53b3140"
    //   },
    //   {
    //     "properties": {
    //       "category": "HighAvailability",
    //       "impact": "Low",
    //       "impactedField": "MICROSOFT.NETWORK/VIRTUALNETWORKS",
    //       "impactedValue": "validation-tool-vnet",
    //       "lastUpdated": "2023-12-13T06:28:24.4709032Z",
    //       "recommendationTypeId": "56f0c458-521d-4b8b-a704-c0a099483d19",
    //       "shortDescription": {
    //         "problem": "Use NAT gateway for outbound connectivity",
    //         "solution": "Use NAT gateway for outbound connectivity"
    //       },
    //       "extendedProperties": {
    //         "region": "centralindia"
    //       },
    //       "resourceMetadata": {
    //         "resourceId": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourcegroups/validation-tool/providers/microsoft.network/virtualnetworks/validation-tool-vnet"
    //       }
    //     },
    //     "id": "/subscriptions/558ac289-487e-4196-9b77-1ccebfbdd805/resourcegroups/validation-tool/providers/microsoft.network/virtualnetworks/validation-tool-vnet/providers/Microsoft.Advisor/recommendations/cb7c3cbf-8fbe-b9e1-965b-3f00b53b3140",
    //     "type": "Microsoft.Advisor/recommendations",
    //     "name": "cb7c3cbf-8fbe-b9e1-965b-3f00b53b3140"
    //   }
    //   ]
    // };
    // this.dataTemp = JSON.parse(this.dataTemp);



  }

  removeDuplicates() {
    // Using reduce to accumulate unique items based on recommendationTypeId
    const uniqueValues = this.dataTemp.value.reduce((acc: any, current: any) => {
      const x = acc.find((item: any) => item.properties.recommendationTypeId === current.properties.recommendationTypeId);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    this.dataTemp.value = uniqueValues;
  }

  GenerateDataForGraphAndTable() {
    let sectionData: any[] = [];
    let d = this.groupBy(this.dataTemp.value.map((e: any) => e.properties), 'category')

    Object.keys(d).map(e => {
      let temp = this.groupBy(d[e], 'impact')

      let tempObj: { [key: string]: string | number } = {};
      tempObj["Name"] = e;
      tempObj["High"] = (temp["High"]?.length || 0);
      tempObj["Low"] = (temp["Low"]?.length || 0);
      tempObj["Medium"] = (temp["Medium"]?.length || 0);

      sectionData.push(tempObj)
    })
    return sectionData
  }

  GenerareGraph() {
    let temp = this.GenerateDataForGraphAndTable()

    let lowArray = [];
    let mediumArray = [];
    let highArray = [];

    highArray = temp.map(e => e.High);
    mediumArray = temp.map(e => e.Medium);
    lowArray = temp.map(e => e.Low);

    this.apexChart = {
      grid: {
        strokeDashArray: 5,
        opacity: 0.7,
      },
      series: [
        {
          name: 'High',
          data: highArray
        },
        {
          name: 'Medium',
          data: mediumArray
        },
        {
          name: 'Low',
          data: lowArray
        }],

      // high medium low
      colors: ['#005A9C', '#A9A9A9', '#e9692c'],
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: true,
          export: {
            csv: {
              filename: "score-by-category",
              columnDelimiter: ',',
              headerCategory: 'Category',
            },
            svg: {
              filename: "score-by-category",
            },
            png: {
              filename: "score-by-category",
            }
          },
          autoSelected: 'zoom'
        },
        zoom: {
          enabled: true
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0
          }
        }
      }],
      fill: {
        opacity: 0.7,
        type: 'solid'
      },
      plotOptions: {
        bar: {
          horizontal: false,
        },
        dataLabels: {
          hideOverflowingLabels: true
        }
      },
      xaxis: {
        labels: {
          style: {
            colors: "#99A1B7",
            fontSize: "12px",
            cssClass: "apexcharts-xaxis-label"
          }
        },
        type: 'category',
        categories: temp.map(e => {
          // using the raw code since pipe isnt available
          let a = e.Name.replace(/([A-Z]+)/g, ",$1").replace(/^,/, "");
          a = a.split(",").join(" ");
          return a;

        }),
      },
      yaxis: {
        labels: {
          style: {
            colors: "#99A1B7",
            fontSize: "12px",
            cssClass: "apexcharts-yaxis-label"
          }
        },
        title: {
          text: this.translateService.instant('TRANSLATE.SCORE')
        },
        //min: 0,
        //tickAmount: 4,
        type: 'numeric',
      },
      legend: {
        position: 'right',
        //    offsetY: 40
      }
    };
  }

  groupBy(xs: Array<any>, key: string) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  }

  generateTableSummary() {
    setTimeout(() => {
      const self = this;
      this.section1Data = this.GenerateDataForGraphAndTable();
      this.datatableConfig1 = {
        serverSide: false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        data: this.section1Data,
        columns: [
          {
            type: "string",
            title: this.translateService.instant('TRANSLATE.AZURE_ALL_RECOMMENDATIONS_CATEGORY'),
            data: "Name"
          },

          {
            type: "string",
            title: this.translateService.instant('TRANSLATE.HIGH'),
            data: "High"
          },
          {
            type: "string",
            title: this.translateService.instant('TRANSLATE.MEDIUM'),
            data: "Medium"
          },
          {
            type: "string",
            title: this.translateService.instant('TRANSLATE.LOW'),
            data: "Low"
          }
        ],
      };
      this._cdRef.detectChanges();
    });
  }



  generateAllAzureRecomment() {
    setTimeout(() => {
      const self = this;
      // instead of the angular.copy
      let dataStore = [...this.dataTemp?.value];
      dataStore = dataStore.map((i: any) => {
        i.impact = i.properties.impact;
        i.category = i.properties.category;
        i.category = i.category.replace(/([A-Z]+)/g, ",$1").replace(/^,/, "");
        i.category = i.category.split(",").join(" ");
        i.problem = i.properties.shortDescription.problem;
        i.solution = i.properties.shortDescription.solution;
        i.lastUpdated = i.properties.lastUpdated;
        i.potentialBenefits = i.properties.potentialBenefits;
        return i;
      });

      if (this.selectedCategory != null) {
        dataStore = dataStore?.filter((e: any) => e.category.toLowerCase() == this.selectedCategory.toLowerCase());
      }
      this.Datastore = dataStore;
      this.IsLoading=false;
      this.datatableConfig2 = {
        serverSide: false,
        pageLength: ( this._appService.$rootScope.DefaultPageCount ||10),
        data: dataStore,
        columns: [
          {
            title: this.translateService.instant('TRANSLATE.AZURE_ALL_RECOMMENDATIONS_CATEGORY'),
            data: "category"
          },
          {
            title: this.translateService.instant('TRANSLATE.AZURE_ALL_RECOMMENDATIONS_IMPACT'),
            data: "impact"
          },
          {
            title: this.translateService.instant('TRANSLATE.AZURE_ALL_RECOMMENDATIONS_DESCRIPTION'),
            data: "problem"
          },
          {
            title: this.translateService.instant('TRANSLATE.AZURE_ALL_RECOMMENDATIONS_LAST_UPDATED'),
            data: "lastUpdated"
          },
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  SetCategoryForFilter(category: any) {
    this.IsLoading=true;
    // set the category
    this.selectedCategory = category
    this._cdRef.detectChanges();
    // reload the table
    this.generateAllAzureRecomment();
  }

  exportToCsv(data: any) {
    if (data.length > 0) {
      var dataToExport = data.map(function (d: any) {
        return d.category + "," + d.impact + "," + d.problem + "," + d.lastUpdated
      })
        .join('\n')
        .replace(/(^\[)|(\]$)/mg, '');


      // adding our heading and the file type
      // not adding the file type gives an error while download
      dataToExport = "data:text/csv;charset=utf-8," + 'Category,' + 'Impact,' + 'Description,' + 'Last updated' + "\n" + dataToExport

      var encodedUri = encodeURI(dataToExport);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "recommendation-details.csv");
      link.target = "_blank";
      document.body.appendChild(link);

      link.click();


    }
    else {
      // nothing to export
      //notifier.alert("No data to export!");
    }
  }

  ReloadTableData() {
    this.reloadEvent.emit(true);
  }

  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }
  ngOnDestroy() {
    this._subscription?.unsubscribe()
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
