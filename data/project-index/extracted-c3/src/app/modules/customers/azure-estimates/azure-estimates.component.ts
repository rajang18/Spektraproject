import { ChangeDetectorRef, Component, ComponentFactoryResolver, ElementRef, EventEmitter, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import _ from 'lodash';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { AzureEstimatesService } from 'src/app/services/azure-estimates.service';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { ClientSettingsResponse } from 'src/app/shared/models/appsettings.model';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { map, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { AzureEstimatesLevelTwoComponent } from '../azure-estimates-level-two/azure-estimates-level-two.component';
import { PermissionService } from 'src/app/services/permission.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { FileService } from 'src/app/services/file.service';
import {
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { AzureReportsByTagPopupComponent } from '../azure-reports-by-tag-popup/azure-reports-by-tag-popup.component';
import { DatePipe } from '@angular/common';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service'; 

@Component({
  selector: 'app-azure-estimates',
  templateUrl: './azure-estimates.component.html',
  styleUrl: './azure-estimates.component.scss',
  providers:[DatePipe]
})
export class AzureEstimatesComponent implements OnInit, OnDestroy{
  currentC3CustomerId:string = null;
  currentEntity:string = null;
  currentRecordId:string = null;
  provider:string = 'Microsoft';
  AllTenants:any[] = null;
  Tenants:any[] = []; 
  ProviderTenantsCount:any = null;
  selectedServiceProviderCustomer:any = {};
  usersDetails:any = [];
  subscriptionDataSource:any = [];
  currentCurrencyCode:any;
  entitlementList:any;
  parentProviderSubscriptionId:any =null;
  showEntitlement:any = false;
  currentSubscription:any = null;
  allSubscriptions:any = [];
  dateDataSource:any = [];
  currentDate = null;
  currentDateValue = '';
  customerId:any;
  subscriptioncategories:any = null;
  isPartnerLevel = false;
  entitlements:any;
  currentTagModel:any = null; // get the tags selected initially
  dataMode:any;
  currentTag:any;
  billingPeriods:any;
  providerBillingPeriods:any;
  currentProviderBillingPeriods:any
  userSettingsData:any;
  currentGroup:any = null;
  tagDataSource:any;
  currentEntitlement:any = null;
  currentCurrencyArray:any;
  currencies:any;
  currentCurrency:any;
  isSubscriptionManage:any = false;
  billingPeriodId:any;
  azureEstimateSortElementList:any;
  azureEstimateReverseSort:any;
  groupDataSource:any;
  customers:any
  ProviderCoustomerCount:any
  currentCustomer:any = null;
  currentCustomerId:any;
  customerCreationDate:any;
  fromSubscription:any =    localStorage.getItem("product") !=null ? true:false;
  fromNonCspSubscription:any;
  totalCost:any = 0.00;
  IsFixedPrice:any;
  isAzureReportingPCStandarizationEnabled:boolean = false;

  reportDetailsSource: ADTSettings | any;
  reportDetailsSourcerReloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild("sevicecol") sevicecol:TemplateRef<any>
  @ViewChild('iconTemplate') iconTemplate: TemplateRef<any>;
  groupedData:any = [];
  groupReportTotalRows:any = 0;
  private _unsubscribe: Subscription[] = [];
  groupReportDetailsSource: ADTSettings | any;
  groupReportDetailsSourceReloadEvent: EventEmitter<boolean> = new EventEmitter();
  activePageSize:number = 10;
  dropdownVisible = false;
  dropdownVisibleAutocomplete = false;
  childTable: ElementRef;
  tagReportDetailsSource:any;
  tagsReportData:any;
  tagReportTotalRows:any;  
  _subscription: Subscription; 

  @ViewChild("groupreportdetailscol1") groupreportdetailscol1:TemplateRef<any>;
  @ViewChild("groupreportdetailscol2") groupreportdetailscol2:TemplateRef<any>;
  @ViewChild("groupreportdetailscol3") groupreportdetailscol3:TemplateRef<any>;
  @ViewChild("taglast") taglast:TemplateRef<any>;
  tagReportDetailsSourceReload:EventEmitter<boolean> = new EventEmitter(); 
  Permissions:any = {
    HasDownloadAzureEstimateReport:"Denied",
    HasDownloadAzureEstimateReportByTags: "Denied",
    HasAzureGroups: "Denied"
  } 
  // some rootScope variables no refernce for them in the other files as well
  CurrentProduct:any =JSON.parse(localStorage.getItem("product")); 
  CurrentEntitlementProduct:any = JSON.parse(localStorage.getItem("CurrentEntitlementProduct")); 
  //localStorage.getItem("CurrentProductId");
  currentSubscriptionId:any = !this.CurrentProduct ? null : (!this.CurrentProduct.ParentProviderSubscriptionId ? this.CurrentProduct.ProviderProductId : this.CurrentProduct.ParentProviderSubscriptionId);
  currentEntitlementId:any = !this.CurrentEntitlementProduct ? '' : this.CurrentEntitlementProduct.ProviderProductId; 
  destroy$ = new Subject<void>();
  constructor(private commonService:CommonService, 
    private azureEstimatesService:AzureEstimatesService,
    private router:Router,
    private translateService: TranslateService,
    private _clientSettingsService: ClientSettingsService, 
    private _cdRef: ChangeDetectorRef,
    private renderer: Renderer2,
    private resolver: ComponentFactoryResolver, 
    private viewContainerRef: ViewContainerRef,
    private _permissionService:PermissionService,
    private _FileService:FileService,
    private _modalService: NgbModal,
    private _datePipe:DatePipe,
    private pageInfo: PageInfoService,
    private appSettingsService: AppSettingsService){
              // permissions
        this.Permissions.HasDownloadAzureEstimateReport = this._permissionService.hasPermission( CloudHubConstants.ACTION_DOWNLOAD_AZURE_ESTIMATE_REPORT);
    this.Permissions.HasDownloadAzureEstimateReportByTags = this._permissionService.hasPermission(CloudHubConstants.BTN_DOWNLOAD_AZURE_ESTIMATE_REPORT_BY_TAGS)
    this.Permissions.HasAzureGroups = this._permissionService.hasPermission(CloudHubConstants.GET_AZURE_GROUPS)

        const subscription = this._clientSettingsService.getData().pipe(takeUntil(this.destroy$)).subscribe((data:Partial<ClientSettingsResponse>) => {
          this.userSettingsData = data.Data 
        });

        this._unsubscribe.push(subscription);
        this.activePageSize = this.appSettingsService.$rootScope.DefaultPageCount;
  }

   GetTenants() {
    if (this.currentC3CustomerId) {
      this.currentEntity = this.commonService.entityName === "Partner" || this.commonService.entityName === "Reseller" 
      ? "Customer" 
      : this.commonService.entityName;
    
      this.currentRecordId = this.commonService.entityName === "Partner" || this.commonService.entityName === "Reseller" 
        ? this.currentC3CustomerId 
        : this.commonService.recordId;
      
      const sub = this.azureEstimatesService.GetTenants(this.currentEntity, this.currentRecordId, this.provider)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(({ Data: tenantsData }: any) => {
            this.AllTenants = tenantsData || [];
      
            // Make the second request and chain it properly
            return this.azureEstimatesService.GetTenantsNonCsp(this.currentEntity, this.currentRecordId);
          })
        )
        .subscribe({
          next: ({ Data }: any) => {
            if (Data) {
              this.AllTenants = [...this.AllTenants, ...Data];
            }
      
            // Sort tenants by CustomerName (Lodash alternative)
            this.AllTenants = this.AllTenants.sort((a, b) => a.CustomerName.localeCompare(b.CustomerName));
            
            // Shallow copy instead of angular.copy
            this.Tenants = [...this.AllTenants];
            
            if (this.Tenants) {
              this.ProviderTenantsCount = this.Tenants.length;
              this.selectedServiceProviderCustomer = this.Tenants[0];
            }
      
            if (this.CurrentProduct) {
              const tenant = this.Tenants.find(current => 
                current.CustomerRefId === this.CurrentProduct.ServiceProviderCustomerRefId
              );
      
              if (tenant) {
                this.selectedServiceProviderCustomer = tenant;
              }
            }
            
            // Trigger the next operation
            this.ReloadEstimates();
          },
          error: (err) => {
            console.error('Error fetching tenant data:', err);
          }
        });
        this._unsubscribe.push(sub);
      }
      else{ 
       this.ProviderTenantsCount = 0;
      }  
    }

     ReloadEstimates() {
      this.usersDetails = [];
      this.subscriptionDataSource = null;
      this.GetAzureSubscriptions();
      this.GetTags(); 

      // vm.groupReportDetailsSource.page(1);
      // vm.groupReportDetailsSource.reload();
      if(typeof(this.groupReportDetailsSource) != 'undefined'){

        if(this.groupReportDetailsSourceReloadEvent.closed){
          this.groupReportDetailsSourceReloadEvent = new EventEmitter();
        }
        this.groupReportDetailsSourceReloadEvent.emit(true); 
      }
      else{ 
        this.groupReportDetailsSourceFn();
      } 
      // vm.reportDetailsSource.page(1);
      // vm.reportDetailsSource.reload();
      
      if(typeof(this.reportDetailsSource) != 'undefined'){
        if(this.reportDetailsSourcerReloadEvent.closed){
          this.reportDetailsSourcerReloadEvent = new EventEmitter();
        }
        this.reportDetailsSourcerReloadEvent.emit(true);
      }
      else{
        // call the table to get the data
        this.reportDetailsSourceFn();
      }


      if(typeof(this.tagReportDetailsSource) != 'undefined'){
        if(this.tagReportDetailsSourceReload.closed){
          this.reportDetailsSourcerReloadEvent = new EventEmitter();
        }
        this.tagReportDetailsSourceReload.emit(true);
      }
      else{
        this.tagReportDetailsSourceFn();
      }

      // vm.tagReportDetailsSource.page(1);
      // vm.tagReportDetailsSource.reload();
      this.Tenants = [...this.AllTenants];
  }

  getProviderbyName (){
    
  }

  GetAzureSubscriptions(){

    if (this.currentC3CustomerId !== null && this.selectedServiceProviderCustomer !== null) {
      var searchData =
      {
          CustomerC3Id: this.currentC3CustomerId,
          ProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
          CurrencyCode: this.currentCurrencyCode,
          EntityName: this.commonService.entityName,
          RecordId: this.commonService.recordId,
          ProviderId: this.selectedServiceProviderCustomer.ProviderId
      };

      this.entitlementList = [];
      this.currentEntitlementId = !this.CurrentEntitlementProduct && !this.parentProviderSubscriptionId ? null : this.currentEntitlementId;
      this.showEntitlement = false;
      this._cdRef.detectChanges();
      this.dateDataSource = [];
      this.currentDate = null;
      this.currentDateValue = '';
      this.currentSubscription = null;

      // api call
      let sub = this.azureEstimatesService.GetAzureSubscriptionList(searchData).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{

        this.subscriptionDataSource = [];
        if (Data !== null) {
            this.subscriptionDataSource = Data;
            this.allSubscriptions = Data;
            this.customerId = Data.length > 0 ? this.allSubscriptions[0].InternalCustomerId : "";
            if (this.currentSubscriptionId !== null || this.currentSubscriptionId !== '') {
                this.GetEntitlements();
                this.subscriptioncategories = _.filter(this.allSubscriptions,  (subscription) => {
                    if (subscription.SubscriptionId === this.currentSubscriptionId) {
                        return subscription.CategoryId;
                    }
                });
            }
            else {
              // _.pluck was removed in the new loadash in favour of _.map
                this.subscriptioncategories = _.uniqBy(_.map(this.allSubscriptions, 'CategoryId'),"CategoryId").join(",");
            }
            this.GetBillingPeriods();
        } 
      }) 
      this._unsubscribe.push(sub);
    }
  }

  GetEntitlements(){
    
    _.each(this.subscriptionDataSource,  (subscription) => {
        if (subscription.SubscriptionId === this.currentSubscriptionId) {
            this.showEntitlement = subscription.IsAzurePlan && !this.parentProviderSubscriptionId;
            this.currentSubscription = subscription;
            this.currentEntitlementId = [];
        }
      });

      if (this.showEntitlement) {
        var getProductUri = "";
        
        if (this.isPartnerLevel || (this.router.url.toLowerCase().includes("customer/estimates"))) {
            getProductUri = 'azureSubscriptions/AzurePlan/' + this.currentSubscription.ProductId + '/EntitlementsWithHierarchy/1';
        } else {
            getProductUri = 'azureSubscriptions/AzurePlan/' + this.currentSubscription.ProductId + '/EntitlementsWithHierarchy/0';
        }
 
       let sub = this.azureEstimatesService.GetEntitlementWithHeirarchy(getProductUri).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
          this.entitlements = Data;
          if (this.entitlements !== null) {

            // ngModel default select

              this.entitlementList.push({
                  Name: this.translateService.instant("TRANSLATE.AZURE_REPORTS_OPTION_TEXT_ALL_ENTITLEMENTS"),
                  Value: null,
                  SiteName: null,
                  DepartmentName: null
              });

              // ngmodel default select
              this.currentEntitlement = this.entitlementList[0];


              this.entitlements.forEach( (record) => {
                  this.entitlementList.push({
                      Name: record.EntitlementName + ' (' + record.EntitlementId + ')',
                      Value: record.EntitlementId,
                      SiteName: record.SiteName,
                      DepartmentName: record.DepartmentName
                  });
              });

              this.LoadData();
          }  
        }); 
        this._unsubscribe.push(sub); 
    } 
  }


   LoadData() {
    
    if (this.currentTagModel != null && this.currentTagModel != undefined && this.currentTagModel != "") {
        this.LoadTagView(this.currentTagModel)
    } else {
        this.dataMode = "group";
        this.LoadGroupView();
    }
  }

   LoadTagView(tag) {
    
    if (this.currentTagModel != null && this.currentTagModel != undefined && this.currentTagModel != "") {
        this.dataMode = "tag";
        this.currentTag = tag;


        if(typeof(this.tagReportDetailsSource) != 'undefined'){
          if(this.tagReportDetailsSourceReload.closed){
            this.tagReportDetailsSourceReload = new EventEmitter();
          }
          this.tagReportDetailsSourceReload.emit(true);
        }
        else{
          this.tagReportDetailsSourceFn();
        }

       // vm.tagReportDetailsSource.page(1);
        //vm.tagReportDetailsSource.reload();
    } else {
        this.LoadData();
    }
  }

   LoadGroupView() {
    this.dataMode = "group";
    this.currentTag = "";

    if(typeof(this.groupReportDetailsSource) != 'undefined'){
      if(this.groupReportDetailsSourceReloadEvent.closed){
        this.groupReportDetailsSourceReloadEvent = new EventEmitter();
      }
      this.groupReportDetailsSourceReloadEvent.emit(true);
    }
    else{
      
      this.groupReportDetailsSourceFn();
    }
    //this.groupReportDetailsSource.page(1);
    //this.groupReportDetailsSource.reload();
  }

  GetBillingPeriods(){

    this.billingPeriods = [];
    let sub = this.azureEstimatesService.GetBillingPeriods().pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{

      this.billingPeriods = Data;
      _.each(this.billingPeriods, (billingPeriod) => {
        const startDate = new Date(billingPeriod.BillingStartDate);
        const endDate = new Date(billingPeriod.BillingEndDate);
        const today = new Date();
        if (startDate <= today && endDate >= today) {
          this.billingPeriodId = billingPeriod.BillingPeriodId.toString();
        }
      });
      if (this.currentSubscription != null) {
        this.GetDates();
      }
      this.LoadData();
    });

    this._unsubscribe.push(sub);
  }


  GetDates(){
    this.dateDataSource = []
            if (this.currentSubscription && this.currentSubscription.ProviderId !== null) {
     let sub  =        this.azureEstimatesService.GetProviderBillingPeriods(this.currentSubscription.ProviderId, this.currentSubscription.CategoryId).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{

                this.providerBillingPeriods = Data;
                    _.each(this.providerBillingPeriods,  (billingPeriod) => {
                        if (billingPeriod.BillingPeriodId.toString() === this.billingPeriodId) {
                            this.currentProviderBillingPeriods = billingPeriod;
                        }
                    });
                    var date = new Date(this.currentProviderBillingPeriods.ChargeStartDate);
                    var days = [];

                    // new Date(year,month)

                    days.push({
                        "Date": 
                        
                           this._datePipe.transform(date, this.userSettingsData.DateFormat),
                           "Day": date.getDate(), 
                           "Month": date.getMonth() + 1, 
                           "Year": date.getFullYear()
                    });
                    date.setDate(date.getDate() + 1);
                    
                    while (date <= new Date(this.currentProviderBillingPeriods.ChargeEndDate) && date <= new Date()) {
                        days.push({
                            "Date": this._datePipe.transform(date, this.userSettingsData.DateFormat),
                            "Day": date.getDate(), 
                            "Month": date.getMonth() + 1, 
                            "Year": date.getFullYear()

                        });
                        date.setDate(date.getDate() + 1);
                    }

                    this.dateDataSource = days;


              })

              this._unsubscribe.push(sub);
              

              
            }
  }

  GetTags(){
    var searchData =
            {
                GroupId: this.currentGroup,
                SubscriptionId: this.currentSubscriptionId == '' ? null : this.currentSubscriptionId,
                CustomerC3Id: this.currentC3CustomerId,
                ServiceProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
                CurrencyCode: this.currentCurrencyCode,
                ProviderId: this.selectedServiceProviderCustomer.ProviderId
            };

         let sub =   this.azureEstimatesService.GetAzureTags(searchData).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
              // _.uniq now has only one parameter
              this.tagDataSource = _.sortBy(_.uniqBy(Data,"TagKey"),  (tag:any) => { return tag.TagKey?.toLowerCase(); });
            })


            this._unsubscribe.push(sub);
           
  }

  Sum(numbers) {
    return _.reduce(numbers,  (result, current) => {
        return result + parseFloat(current);
    }, 0);
  }

  UpdateEntitlementId() {
    
    this.currentEntitlementId = this.currentEntitlement.Value;
  }

  GetCurrentCurrencyDetails() {
    this.currentCurrencyArray = _.filter(this.currencies,  (currncy) => {
        if (currncy.CurrencyCode === this.currentCurrencyCode) {
            return currncy;
        }
    });
    this.currentCurrency = this.currentCurrencyArray[0];
  }

   OnSubscriptionChange() {
    this.isSubscriptionManage = false;
    this.showEntitlement = false;
    this.entitlementList = [];
    this.currentEntitlementId = !this.CurrentEntitlementProduct && !this.parentProviderSubscriptionId ? null : this.currentEntitlementId;

    this.dateDataSource = [];
    this.currentDate = null;
    this.currentDateValue = '';
    this.currentSubscriptionId = this.currentSubscriptionId === 'null' ? null:this.currentSubscriptionId;
    this.GetEntitlements();
    this.GetBillingPeriods();
    this.GetTags()
  }

  groupReportDetailsSourceFn(){
    // the table 1
    setTimeout(()=>{
      
      const self = this;
      this.groupReportDetailsSource =  {
        serverSide: true,
        pageLength: this.activePageSize || 10,
        ajax:(dataTablesParameters: any, callback: any) =>{
          
          const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);

            if ((this.currentC3CustomerId !== undefined && 
                this.currentC3CustomerId !== null) && 
                (this.selectedServiceProviderCustomer.CustomerRefId !== undefined && 
                this.selectedServiceProviderCustomer.CustomerRefId !== null)) {

                  var serachData =
                  {
                      GroupId: this.currentGroup,
                      SubscriptionId: this.currentSubscriptionId == '' ? null : this.currentSubscriptionId,
                      BillingPeriodId: this.billingPeriodId,
                      EntitlementId: this.currentEntitlementId,
                      Date: this.currentDate,
                      PageSize: PageSize || this.activePageSize,
                      PageNumber: StartInd,
                      SortColumn: SortColumn,
                      SortOrder: SortOrder,
                      CustomerId: this.currentC3CustomerId,
                      ServiceProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
                      CurrencyCode: this.currentCurrencyCode,
                      ProviderId: this.selectedServiceProviderCustomer.ProviderId
                  };
                  var reqBody = {
                      searchCriteria: JSON.stringify(serachData)
                  };

                  this._subscription && this._subscription?.unsubscribe();
                  const sub =  this.azureEstimatesService.GetResourceGroup(reqBody).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
                    this.groupedData = Data;
                    this.IsFixedPrice = (this.groupedData !== null && this.groupedData.length > 0 && this.groupedData[0] !== null) ? this.groupedData[0].BillingTypeName === 'Price' : false;
                    if (this.groupedData.length > 0) {
                        this.groupReportTotalRows = this.groupedData[0].TotalRecords;
                        this.totalCost = this.groupedData[0].TotalAmount.toFixed(2);
                    }
                    else {
                        this.totalCost = 0.00;
                    }

                    let recordsTotal = 0;

                   
                    [{ TotalRecords: recordsTotal = 0 }= {}] = Data;
                    


                    callback({
                      data: Data,
                      recordsTotal: recordsTotal || 0,
                      recordsFiltered: recordsTotal || 0,
                    });
                  });

                  this._unsubscribe.push(sub);

            }
        },
        columns:[
          // {
          //   className: 'dt-control col-1',
          //   orderable: false,
          //   data: null,
          //   defaultContent: '',
          //   render: (data: string, type: any, row: any, meta: any) => {
          //     return '<span class="dt-control">+</span>'
          //   }
          // },
          {
            className: 'dt-icon-control',
            orderable: false,
            data: null,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.iconTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            }
          },
          {
            title: this.translateService.instant('TRANSLATE.AZURE_REPORTS_TABLE_HEADER_TEXT_SUBSCRIPTION'),
            className: 'col-6',
            orderable: true,
            defaultContent: '',
            type: 'string',
            data:"Subscription",
            ngTemplateRef: {
              ref: this.groupreportdetailscol1,
              context:{

              }
            },
          },
          {
            title: this.isAzureReportingPCStandarizationEnabled ? this.translateService.instant('TRANSLATE.AZURE_REPORTS_TABLE_HEADER_TEXT_RESOURCE_GROUP_PC_STANDARIZATION') :  this.translateService.instant('TRANSLATE.AZURE_REPORTS_TABLE_HEADER_TEXT_RESOURCE_GROUP'),
            className: 'col-4',
            defaultContent: '',
            orderable: true,
            type: 'string',
            data:"ResourceGroup",
            ngTemplateRef: {
              ref: this.groupreportdetailscol2,
              context:{

              }
            },
          },

          {
            title: this.translateService.instant('TRANSLATE.AZURE_REPORTS_TABLE_TD_TEXT_TOTAL_COST'),
            className: 'col-2',
            orderable: true,
            defaultContent: '',
            type: 'string',
            data:"ChargeForCustomer",
            ngTemplateRef: {
              ref: this.groupreportdetailscol3,
              context:{

              }
            },
          }
        ]
      }
      this._cdRef.detectChanges();
    });
  }

  onCaptureEvent(event: Event) { }



  reportDetailsSourceFn(){
    let subscription
    // table 2
    setTimeout(()=>{
      const self = this;
      this.reportDetailsSource = {
        serverSide: true,
        pageLength: (this.appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          
          const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          
            if(this.dataMode == "service"){
              // some sorting logic
              if ((this.currentC3CustomerId !== undefined && this.currentC3CustomerId !== null) && (this.selectedServiceProviderCustomer?.CustomerRefId !== undefined && this.selectedServiceProviderCustomer?.CustomerRefId !== null)) {

                var serachData =
                {
                    GroupId: this.currentGroup,
                    SubscriptionId: this.currentSubscriptionId == '' ? null : this.currentSubscriptionId,
                    BillingPeriodId: this.billingPeriodId,
                    EntitlementId: this.currentEntitlementId,
                    Date: this.currentDate,
                    ResourceGroup: null,
                    PageSize: PageSize,
                    PageNumber: StartInd,
                    SortColumn: SortColumn,
                    SortOrder: SortOrder,
                    CustomerId: this.currentC3CustomerId,
                    ServiceProviderCustomerId: this.selectedServiceProviderCustomer?.CustomerRefId,
                    CurrencyCode: this.currentCurrencyCode,
                    ProviderId: this.selectedServiceProviderCustomer?.ProviderId
                };
                var reqBody = {
                    searchCriteria: JSON.stringify(serachData)
                };


            this._subscription && this._subscription?.unsubscribe();
            const subscription =    this.azureEstimatesService.GetAzureEsitamteService(reqBody).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{

                  this.groupedData = Data;
                  this.IsFixedPrice = (this.groupedData !== null && this.groupedData?.length > 0 && this.groupedData[0] !== null) ? this.groupedData[0]?.BillingTypeName === 'Price' : false;
                           // $rootScope.isGridDataLoading = false;
                  if (this.groupedData.length > 0) {
                    this.groupReportTotalRows = this.groupedData[0]?.TotalRecords;
                    this.totalCost = this.groupedData[0]?.TotalAmount.toFixed(2);
                  }
                  else {
                    this.totalCost = 0.00;
                  }
                  let recordsTotal = 0;
                  
                  if (Data.length > 0) {
                    [{ TotalRecords: recordsTotal =0}= {}] = Data;
                  }
                  callback({
                    data: Data,
                    recordsTotal: recordsTotal || 0,
                    recordsFiltered: recordsTotal || 0,
                  });

                });

                this._unsubscribe.push(subscription);
              }
            }
        },

        columns:[
          {
            title: this.isAzureReportingPCStandarizationEnabled ? this.translateService.instant("TRANSLATE.AZURE_REPORTS_TABLE_HEADER_TEXT_RESOURCE_GROUP_PC_STANDARIZATION") : this.translateService.instant("TRANSLATE.AZURE_REPORTS_TABLE_HEADER_TEXT_RESOURCE_GROUP") ,
            type:"string",
            data:"ResourceGroup",
            orderable: true 

          },
          {
            title:this.translateService.instant("TRANSLATE.AZURE_REPORTS_TABLE_HEADER_TEXT_SERVICE_NAME"),
            type:"string",
            data:"ServiceName",
            searchable:false,
            orderable: false          
          },
          {
            title: this.isAzureReportingPCStandarizationEnabled ? this.translateService.instant("TRANSLATE.AZURE_REPORTS_TABLE_HEADER_TEXT_RESOURCE_NAME_PC_STANDARIZATION") :  this.translateService.instant("TRANSLATE.AZURE_REPORTS_TABLE_HEADER_TEXT_RESOURCE_NAME"),
            type:"string",
            data:"ResourceName",
            searchable:false,
            orderable: false                
          },
          {
            title:this.translateService.instant("TRANSLATE.AZURE_REPORTS_TABLE_HEADER_TEXT_QUANTITY"),
            type:"string",
            data:"Quantity",
            searchable:false,
            orderable: false  
          },
          {
            title:this.translateService.instant("TRANSLATE.AZURE_REPORTS_TABLE_HEADER_TEXT_TOTAL_COST"),
            defaultContent: '',
            orderable: true,
            type: 'string',
            ngTemplateRef: {
              ref: this.sevicecol,
              context: {
                // needed for capturing events inside <ng-template>
              },
            },
          }





        ]
        
      };
      this._cdRef.detectChanges();



    })



  }


  tagReportDetailsSourceFn(){
    // table 3
    
    let subscription
    this.tagReportDetailsSource = {
      serverSide: true,
      pageLength: (this.appSettingsService.$rootScope.DefaultPageCount || 10),
      ajax: (dataTablesParameters: any, callback: any) => {
        const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);

        if ((this.currentC3CustomerId !== undefined && this.currentC3CustomerId !== null) && (this.selectedServiceProviderCustomer.CustomerRefId !== undefined && this.selectedServiceProviderCustomer.CustomerRefId !== null)) {
          
          var serachData =
          {
              GroupId: this.currentGroup,
              SubscriptionId: this.currentSubscriptionId == '' ? null : this.currentSubscriptionId,
              BillingPeriodId: this.billingPeriodId,
              EntitlementId: this.currentEntitlementId,
              Date: this.currentDate,
              TagName: this.currentTag,
              PageSize: PageSize,
              PageNumber: StartInd,
              SortColumn: SortColumn,
              SortOrder: SortOrder,
              CustomerId: this.currentC3CustomerId,
              ServiceProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
              CurrencyCode: this.currentCurrencyCode,
              ProviderId: this.selectedServiceProviderCustomer.ProviderId
          };
          var reqBody = {
              searchCriteria: JSON.stringify(serachData)
          };

          subscription && subscription?.unsubscribe();
          subscription = this.azureEstimatesService.GetAzureEstimesSimplyTag(reqBody).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{

            
            this.tagsReportData = Data;


            if (this.tagsReportData.length > 0) {
                this.tagReportTotalRows = this.tagsReportData[0].TotalRecords;
                this.totalCost = this.tagsReportData[0].TotalAmount.toFixed(2);
            }
            else {
                this.totalCost = 0.00;
            }
            // callback
 
            let recordsTotal= 0;
            [{ TotalRecords: recordsTotal = 0}= {}] = Data;


            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
          });
          this._unsubscribe.push(subscription);
      }
      },
      columns:[
        {
          title:"Tag value",
          data:"TagValue",
          type:"string",
          defaultContent: '',
        },
        {
          title:this.translateService.instant('TRANSLATE.AZURE_REPORTS_TABLE_TD_TEXT_TOTAL_COST'),
          type: 'string',
          defaultContent: '',
          orderable: true,
          data: "ChargeForCustomer",         
          ngTemplateRef: {
            ref: this.taglast,
            context: {
              // needed for capturing events inside <ng-template>
            },
          },
        }
      ]
    }
    this._cdRef.detectChanges();
  }


  GetResourceGroupDetails(row:any) {
    if (row.Rows === undefined) {
        var resourceGroup = row.ResourceGroup !== null && row.ResourceGroup !== '' ? row.ResourceGroup : '1';
        var serachData =
        {
            GroupId: this.currentGroup,
            SubscriptionId: this.currentSubscriptionId == '' ? null : this.currentSubscriptionId,
            BillingPeriodId: this.billingPeriodId,
            EntitlementId: this.currentEntitlementId,
            Date: this.currentDate,
            ResourceGroup: resourceGroup,
            PageSize: null,
            PageNumber: null,
            SortColumn: null,
            SortOrder: null,
            CustomerId: this.currentC3CustomerId,
            ServiceProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
            CurrencyCode: this.currentCurrencyCode,
            ProviderId: this.selectedServiceProviderCustomer.ProviderId
        };
        var reqBody = {
            searchCriteria: JSON.stringify(serachData)
        };


    let sub =   this.azureEstimatesService.GetAzureEsitamteService(reqBody).pipe(takeUntil(this.destroy$))
    .subscribe(({Data}:any)=>{  

          row.Rows = Data;
          this.azureEstimateSortElementList[row.ResourceGroup] = 'ChargeForCustomer';
          this.azureEstimateReverseSort[row.ResourceGroup] = false;

    })

        this._unsubscribe.push(sub);

        var resourceUri = row.ResourceUri !== null && row.ResourceUri !== '' ? row.ResourceUri : null;

        var serachInput =
        {
            ProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
            CustomerC3Id: this.currentC3CustomerId,
            SubscriptionId: row.EntitlementId !== null && row.EntitlementId !== '' ? row.EntitlementId : row.SubscriptionId,
            StartMonth: this.currentDate !== null ? this.currentDate.getMonth() : null,
            StartDate: this.currentDate !== null ? this.currentDate.getDate() : null,
            StartYear: this.currentDate !== null ? this.currentDate.getYear() : null,
            ResourceGroupName: resourceGroup,
            ResourceUri: resourceUri,
            CurrencyCode: this.currentCurrencyCode,
            ProviderId: this.selectedServiceProviderCustomer.ProviderId
        };

    let sub2 =    this.azureEstimatesService.GetAzureEstimateAudit(serachInput).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{


          row.Audit = Data;


        });
        this._unsubscribe.push(sub2);
    }
    row.ShowRows = !row.ShowRows;
}

 LoadDefaultView() {
  this.dataMode = "service";
  this.currentTag = "";

  if(typeof(this.reportDetailsSource) != 'undefined'){
    if(this.reportDetailsSourcerReloadEvent.closed){
      this.reportDetailsSourcerReloadEvent = new EventEmitter();
    }
    this.reportDetailsSourcerReloadEvent.emit(true);
  }
  else{
    // call the table to get the data
    this.reportDetailsSourceFn();
  }
  //this.reportDetailsSource.page(1);
  //this.reportDetailsSource.reload();
}

 SortRowLevel1Fields(row, sortRow) {
  this.azureEstimateSortElementList[row.ResourceGroup] = sortRow;
  this.azureEstimateReverseSort[row.ResourceGroup] = !this.azureEstimateReverseSort[row.ResourceGroup];
}

 SortRowLevel2Fields(row, sortRow) {
  this.azureEstimateSortElementList[row.ServiceName + '' + row.ResourceName] = sortRow;
  this.azureEstimateReverseSort[row.ServiceName + '' + row.ResourceName] = !this.azureEstimateReverseSort[row.ServiceName + '' + row.ResourceName];
}

 GetResourceDetails(row:any) {
  if (row.Rows === undefined) {
      var resourceGroup = row.ResourceGroup !== null && row.ResourceGroup !== '' ? row.ResourceGroup : '-1';
      var resourceGuid = row.ResourceGuid !== null && row.ResourceGuid !== '' ? row.ResourceGuid : '-1';
      var resourceName = row.ResourceName !== null && row.ResourceName !== '' ? row.ResourceName : '-1';
      var serachData =
      {
          GroupId: this.currentGroup,
          SubscriptionId: this.currentSubscriptionId == '' ? null : this.currentSubscriptionId,
          BillingPeriodId: this.billingPeriodId,
          EntitlementId: this.currentEntitlementId,
          Date: this.currentDate,
          ResourceGroup: resourceGroup,
          ResourceGuid: resourceGuid,
          ResourceName: resourceName,
          CustomerId: this.currentC3CustomerId,
          ServiceProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
          CurrencyCode: this.currentCurrencyCode,
          ProviderId: this.selectedServiceProviderCustomer.ProviderId
      };
      var reqBody = {
          searchCriteria: JSON.stringify(serachData)
      };

     let sub = this.azureEstimatesService.GetAzureEstimateResource(reqBody).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
          row.Rows = Data;
          this.azureEstimateSortElementList[row.ServiceName + '' + row.ResourceName] = 'ChargeForCustomer';
          this.azureEstimateReverseSort[row.ServiceName + '' + row.ResourceName] = false;
      })

      this._unsubscribe.push(sub)


      var resourceUri = row.ResourceUri !== null && row.ResourceUri !== '' ? row.ResourceUri : null;
      var serachInput =
      {
          ProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
          CustomerC3Id: this.currentC3CustomerId,
          SubscriptionId: row.EntitlementId !== null && row.EntitlementId !== '' ? row.EntitlementId : row.SubscriptionId,
          StartMonth: this.currentDate !== null ? this.currentDate.getMonth() : null,
          StartDate: this.currentDate !== null ? this.currentDate.getDate() : null,
          StartYear: this.currentDate !== null ? this.currentDate.getYear() : null,
          ResourceGroupName: resourceGroup,
          ResourceUri: resourceUri,
          CurrencyCode: this.currentCurrencyCode,
          ProviderId: this.selectedServiceProviderCustomer.ProviderId
      };
    let sub2 =  this.azureEstimatesService.GetAzureEstimateAudit(serachInput).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
        row.Audit = Data;

      })

    this._unsubscribe.push(sub2);
    
  }
  row.ShowRows = !row.ShowRows;
}


 GetAzureGroups() {
   if (this.Permissions.HasAzureGroups === "Allowed") {//hsCheck
   let sub = this.azureEstimatesService.GetAzureGroupsCustomer(this.currentC3CustomerId).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
      this.groupDataSource = Data;
    })

    this._unsubscribe.push(sub);
      
  }
}

OnGroupChange(){
  var data = _.filter(this.allSubscriptions,  (subscription) => {
    if (this.currentGroup === null) {
        return true;
    }
    return subscription.internalgroupid === this.currentGroup;
  });
  this.subscriptionDataSource = data;
}


 OnMonthChange() {
  // initialize
  // testing 
  this.currentDateValue = '';
  this.GetDates();
}

 OnDateChange() {
  this.dateDataSource;
  this.currentDate = this.currentDateValue;
}

//  incomplete
 ExportAzureBillingComparisonReport() {
  var billingPeriodId = 0;
  // apiService.getFile('api/reports/' + $rootScope.userContext.entityName + '/' + $rootScope.userContext.recordId + '/BillingPeriod/' + billingPeriodId + '/BillingComparisonReport').then(function (response) {
  //     apiService.processDownload(response, true);
  // });
}

// incomplete
ExportAzureEstimateReport(){
  var serachData =
  {
      GroupId: this.currentGroup,
      SubscriptionId: this.currentSubscriptionId == '' ? null : this.currentSubscriptionId,
      BillingPeriodId: this.billingPeriodId,
      EntitlementId: this.currentEntitlementId,
      Date: this.currentDate,
      ResourceGroup: null,
      CustomerId: this.currentC3CustomerId,
      ServiceProviderCustomerId: this.selectedServiceProviderCustomer?.CustomerRefId,
      CurrencyCode: this.currentCurrencyCode,
      ProviderId: this.selectedServiceProviderCustomer?.ProviderId
  };

  var reqBody = {
      searchCriteria: JSON.stringify(serachData)
  };

  this._FileService.post("azureEstimates/reportAsCSV", true, reqBody)
}

// incomplete
ExportAzureEstimateReportByTags(){

let componentRef = this._modalService.open(AzureReportsByTagPopupComponent)

  componentRef.componentInstance.tagDataSource = this.tagDataSource;

  //1. open the modal
  //2. when closing the modal collect the selected tags
  //3. download the details
  componentRef.result.then(e=>{
    if(e){
      
      var serachData =
                {
                    GroupId: this.currentGroup,
                    SubscriptionId: this.currentSubscriptionId == '' ? null : this.currentSubscriptionId,
                    BillingPeriodId: this.billingPeriodId,
                    EntitlementId:this.currentEntitlementId,
                    Date: this.currentDate,
                    ResourceGroup: null,
                    CustomerId: this.currentC3CustomerId,
                    ServiceProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
                    CurrencyCode: this.currentCurrencyCode,
                    ProviderId: this.selectedServiceProviderCustomer.ProviderId
                };

                var reqBody = {
                    searchCriteria: JSON.stringify(serachData),
                    Tags: e.join()
                };


                this._FileService.post("azureEstimates/tagsAsCSV",true,reqBody);


    }
    else{
      // clicked cancel do nothing
    }
  });



}

GetCustomers(){
  this.customers = null;
  let sub = this.azureEstimatesService.GetCustomerHasUsageProducts(this.provider)
  .pipe(
    takeUntil(this.destroy$),
    switchMap(({ Data: customerData }: any) => {
      const data = customerData || [];

      // Making the second API call
      return this.azureEstimatesService.GetMicrosoftCustomerNonCspMicrosoft().pipe(
        map(({ Data: nonCspData }: any) => {
          if (nonCspData) {
            nonCspData.forEach((value: any) => data.push(value));
          }

          // Using Lodash alternative (if you want to avoid Lodash dependency)
          this.customers = Array.from(new Map(data.map(item => [item.C3Id, item])).values());
          
          // Sorting by Name
          this.customers = this.customers.sort((a, b) => a.Name.localeCompare(b.Name));
          
          if (this.customers) {
            this.ProviderCoustomerCount = this.customers.length;

            if (!this.currentC3CustomerId && this.customers.length > 0) {
              this.currentC3CustomerId = this.customers[0].C3Id;
            }
          }

          return this.customers;
        })
      );
    })
  )
  .subscribe({
    next: () => {
      this.OnCustomerChange();
    },
    error: (err) => {
      console.error('Error fetching customer data:', err);
    }
  }); 
  this._unsubscribe.push(sub);

  }

  OnCustomerChange() {
    if (this.currentC3CustomerId) {
      this.currentEntity = this.commonService.entityName == "Partner" || this.commonService.entityName == "Reseller" ? "Customer" : this.commonService.entityName;
      this.currentRecordId = this.commonService.entityName == "Partner" || this.commonService.entityName == "Reseller" ? this.currentC3CustomerId : this.commonService.recordId;
      let sub = this.azureEstimatesService.UsageSubscriptionCurrencyList(this.currentEntity, this.currentRecordId).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {

        // $('.tooltips').tooltip();
        this.currencies = _.uniqBy(Data, "CurrencyCode");
        if (this.currencies !== undefined && this.currencies !== null && this.currencies.length > 0) {
          this.currentCurrencyCode = this.currencies[0].CurrencyCode;
          this.GetCurrentCurrencyDetails();

        }
        this.OnCurrencyChange();


      })
      this._unsubscribe.push(sub);
    }
  }


  OnCurrencyChange(){
      var selectedCustomer = this.customers?.filter( (customer) => {
        return customer.C3Id === this.currentC3CustomerId;
    });

    if(selectedCustomer?.length > 0){
      this.currentCustomer = selectedCustomer[0];
    }
    else{
      this.currentCustomer = null;
    }

    this.currentCustomerId = (this.currentCustomer !== undefined && this.currentCustomer !== null) ? this.currentCustomer.ID : null;
    this.currentC3CustomerId = (this.currentCustomer !== undefined && this.currentCustomer !== null) ? this.currentCustomer.C3Id : this.currentC3CustomerId;
    this.customerCreationDate = (this.currentCustomer !== undefined && this.currentCustomer !== null) ? new Date(this.currentCustomer.ProviderCustomerCreateDate) : null;
    this.GetTenants();
    //$rootScope.clearTooltip();
    this.GetAzureGroups();
    this.dataMode = "group";    
  }

  
  ngOnInit(): void {
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.SIDEBAR_TITLE_MENUS_AZURE_ESTIMATE"),true);
    this.pageInfo.updateBreadcrumbs(['PROVIDER_DESC_MICROSOFT','SIDEBAR_TITLE_MENUS_AZURE_ESTIMATE']);

    const subscription = this.appSettingsService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
      this.isAzureReportingPCStandarizationEnabled = response.Data.AzureReportingPCStandardization ?? false ;
    });
    this._unsubscribe.push(subscription);

    if (this.CurrentProduct && this.CurrentProduct.ParentProviderSubscriptionId) {
      this.currentEntitlementId = this.CurrentProduct.ProviderProductId;
      this.parentProviderSubscriptionId = this.CurrentProduct.ParentProviderSubscriptionId;
    }
      //init
      if (this.commonService.entityName === "Partner" || this.commonService.entityName === "Reseller") {
        this.isPartnerLevel = true;
      }
      if(this.commonService.entityName === "Partner"){
        this.currentSubscriptionId = null;
      }
    

      if (this.CurrentProduct && this.commonService.entityName != "Partner") {
        if ((this.fromSubscription || this.fromNonCspSubscription) && !this.router.url.toLowerCase().includes("customer/estimates") ) {
            this.isSubscriptionManage = true;
            this.currentSubscriptionId = !this.CurrentProduct ? null : (!this.CurrentProduct.ParentProviderSubscriptionId ? this.CurrentProduct.ProviderProductId : this.CurrentProduct.ParentProviderSubscriptionId);
            this.currentCurrencyCode = !this.CurrentProduct ? null : this.CurrentProduct.CurrencyCode;
            this.GetCurrentCurrencyDetails();
        }
        else {
            this.isSubscriptionManage = false;
            this.currentSubscriptionId = '';
        }
    }
    if (!this.isPartnerLevel) {
        if (this.commonService.entityName === "Partner" || this.commonService.entityName === "Reseller") {
            this.isPartnerLevel = true;
            this.GetTenants();
        } else if (this.commonService.entityName === "Customer") {
            this.currentC3CustomerId = this.commonService.recordId;
            this.OnCustomerChange();
        }
        else {
        let sub =   this.azureEstimatesService.GetContextByEntityNameAndRecordId().pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
            this.currentC3CustomerId = Data.CustomerC3Id;
            this.OnCustomerChange();
          })

          this._unsubscribe.push(sub)
        }
        //$rootScope.clearTooltip();
    }
    else {
        this.GetCustomers();
    } 
    
  }

  ngOnDestroy(): void {
    // unsubscribe to all api calls
      this._unsubscribe.forEach(e=>{
        e?.unsubscribe();
      })
      this._subscription?.unsubscribe();
  }

  reloadGrid() {
    this.dropdownVisible = false;
    this.dropdownVisibleAutocomplete = false;
    if(this.groupReportDetailsSourceReloadEvent.closed){
      this.groupReportDetailsSourceReloadEvent = new EventEmitter();
    }
    this.groupReportDetailsSourceReloadEvent.emit(true);
  }

  onPageSizeChange(pageSize:number){
    if(pageSize )this.activePageSize = pageSize;
    this.reloadGrid()
  }


  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
  }
  toggleDropdownAutoComplete() {
    this.dropdownVisibleAutocomplete = !this.dropdownVisibleAutocomplete;
  }

  onTableReady(table: ElementRef) {
    this.childTable = table;
    //litsen click event
    this.renderer.listen(this.childTable.nativeElement, 'click', (event) => {
      if (
        event.target.closest('td') &&
        event.target.classList.contains('clicked-icon')
      ) {
        // You can now access the table element and perform operations on it
        const tr = event.target.closest('tr');
        const table = $(this.childTable.nativeElement).DataTable();
        const row = table.row(tr);
        if(row?.data()){
          
          if (row.child.isShown()) {
            row.child.hide();
            row.data()['Collapse'] = false;
            row.data()['ShowRows'] = false;
          } else {
            row.data()['Collapse'] = true;
            row.data()['ShowRows'] = true;
            //row.child.show();
            // remove the child from dom
            row.child.remove();

            // row - for binding stuff , 
            // row.data() - can be used for request body -- row
            

            // boilerplate for reqbody 1 - start
            var resourceGroup = row.data().ResourceGroup !== null && row.data().ResourceGroup !== '' ? row.data().ResourceGroup : '1';
            var resourceGuid = row.data().ResourceGuid !== null && row.data().ResourceGuid !== '' ? row.data().ResourceGuid : '-1';
            var resourceName = row.data().ResourceName !== null && row.data().ResourceName !== '' ? row.data().ResourceName : '-1';
            var serachData =
            {
                GroupId: this.currentGroup,
                SubscriptionId: this.currentSubscriptionId == '' ? null : this.currentSubscriptionId,
                BillingPeriodId: this.billingPeriodId,
                EntitlementId: this.currentEntitlementId,
                Date: this.currentDate,
                ResourceGroup: resourceGroup,
                ResourceGuid: resourceGuid,
                ResourceName: resourceName,
                CustomerId: this.currentC3CustomerId,
                ServiceProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
                CurrencyCode: this.currentCurrencyCode,
                ProviderId: this.selectedServiceProviderCustomer.ProviderId
            };
            var reqBody = {
                searchCriteria: JSON.stringify(serachData)
            };
            // boilerplate for reqbody 1 - start  


            // boilerplate for reqbody 2 - start
            var resourceUri = row.data().ResourceUri !== null && row.data().ResourceUri !== '' ? row.data().ResourceUri : null;

            var serachInput =
            {
                ProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
                CustomerC3Id: this.currentC3CustomerId,
                SubscriptionId: row.data().EntitlementId !== null && row.data().EntitlementId !== '' ? row.data().EntitlementId : row.data().SubscriptionId,
                StartMonth: this.currentDate !== null ? this.currentDate.getMonth() : null,
                StartDate: this.currentDate !== null ? this.currentDate.getDate() : null,
                StartYear: this.currentDate !== null ? this.currentDate.getYear() : null,
                ResourceGroupName: resourceGroup,
                ResourceUri: resourceUri,
                CurrencyCode: this.currentCurrencyCode,
                ProviderId: this.selectedServiceProviderCustomer.ProviderId
            };
            // boilerplate for reqbody 2 - end


            // Set the searchParams input of the ChildTableComponent
            // Trigger change detection to ensure the data is displayed correctly
            const componentFactory = this.resolver.resolveComponentFactory(AzureEstimatesLevelTwoComponent);
            const componentRef = this.viewContainerRef.createComponent(componentFactory);


            componentRef.instance.row = row.data(); // send row
            componentRef.instance.searchData = serachData; // search data
            componentRef.instance.serachInput = serachInput; // search input
            componentRef.instance.currentCurrency = this.currentCurrency;

            // vm.IsFixedPrice==true && vm.currentSubscriptionId!=null && !vm.isPartnerLevel
            componentRef.instance.IsFixedPrice = this.IsFixedPrice;
            componentRef.instance.currentSubscriptionId = this.currentSubscriptionId;
            componentRef.instance.isPartnerLevel = this.isPartnerLevel;

            componentRef.instance.currentGroup = this.currentGroup;
            componentRef.instance.currentC3CustomerId =  this.currentC3CustomerId
            componentRef.instance.billingPeriodId = this.billingPeriodId;  
            componentRef.instance.currentEntitlementId = this.currentEntitlement;    
            componentRef.instance.currentDate = this.currentDate;
            componentRef.instance.selectedServiceProviderCustomer = this.selectedServiceProviderCustomer;
            componentRef.instance.currentCurrencyCode = this.currentCurrencyCode 
            componentRef.instance.isAzureReportingPCStandardizationEnabled = this.isAzureReportingPCStandarizationEnabled;
            componentRef.changeDetectorRef.detectChanges();
            row.child(componentRef.location.nativeElement).show();
            //this.fetchChildlineItemsForSummaryView(row, row.data());
          }
        }
      }
    });
  }
  


}

