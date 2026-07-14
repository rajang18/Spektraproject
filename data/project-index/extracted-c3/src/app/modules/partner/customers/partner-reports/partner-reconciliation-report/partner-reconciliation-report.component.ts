import { ChangeDetectorRef, Component, EventEmitter, OnInit } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { TranslateService } from '@ngx-translate/core';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ReconciliationReportService } from '../../services/reconciliation-report.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ReconciliationReportModel, ReconciliationReportGroupModel, SearchModel } from '../../models/reconciliation-report.model';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { CspProductsMappedToPlanproductsPopupComponent } from './csp-products-mapped-to-planproducts-popup/csp-products-mapped-to-planproducts-popup.component';
import { catchError, finalize, of, switchMap, takeUntil } from 'rxjs';
import { Select2Data, Select2UpdateEvent, Select2Value } from 'ng-select2-component';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { BillingCycleChangeMappedProductPopupComponent } from 'src/app/modules/standalones/billing-cycle-change-mapped-product-popup/billing-cycle-change-mapped-product-popup.component';
import { chain, each, filter, isNull, uniqBy } from 'lodash';
import { TermDurationChangeMappedProductPopupComponent } from 'src/app/modules/standalones/term-duration-change-mapped-product-popup/term-duration-change-mapped-product-popup.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { OfferChangeMappedProductPopupComponent } from 'src/app/modules/standalones/offer-change-mapped-product-popup/offer-change-mapped-product-popup.component';
import { ScopeChangeMappedProductPopupComponent } from 'src/app/modules/standalones/scope-change-mapped-product-popup/scope-change-mapped-product-popup.component';
import { LoaderService } from 'src/app/services/loader.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { FormBuilder, FormGroup } from '@angular/forms';


@Component({
  selector: 'app-partner-reconciliation-report',
  templateUrl: './partner-reconciliation-report.component.html',
  styleUrl: './partner-reconciliation-report.component.scss'
})
export class PartnerReconciliationReportComponent extends C3BaseComponent implements OnInit {

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  }

  entityName: string | null = '';
  recordId: string | null = '';
  customerId: number | null = 0;
  customerC3Id: string | null = '';
  customerName: string | null = '';
  datatableConfig: ADTSettings;
  customerSubscriptions: any[];
  customerSubscriptionsTemp: any;
  lastRefreshedOn: number = 0;
  IsAzurePlanOnboarded: boolean;
  mismatchCount: number = 0;
  groupModelList: any[] = [];
  groupModelListTemp: any[];
  shouldExpandAll = false;
  loadingReport: boolean = false;
  subscriptionsList: any[];
  loadingSubscriptions: boolean = false;
  customerPlans: any[];
  billingCycles: any[];
  mappingC3PlanProductsDataset: Select2Data = [];
  mappedProducts: any[];
  searchModel = new SearchModel();
  groupModel = new ReconciliationReportGroupModel();
  reconliationReportLogo: any;
  showHelpText = false;
  shouldShowFilter = false;

  providerPlaceholder = ""
  categoryPlaceholder = ""
  statusPlaceholder = ""

  providerToggle = false
  categoryToggle = false
  statusToggle = false



  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private _commonService: CommonService,
    private _translateService: TranslateService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _reconciliationReportService: ReconciliationReportService,
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    public _modalService: NgbModal,
    private _appSettingService: AppSettingsService,
    public loaderService: LoaderService,
    private _pageInfo: PageInfoService,
    private c3RouterService:C3RouterService,
    private _loaderService : LoaderService,
    private _formBuilder: FormBuilder,
  ) { 
    
    super(_permissionService, _dynamicTemplateService, _router, _appSettingService) 
    this.planDetailsRegisterForm = this._formBuilder.group({
          providers: [''],
          categories: [''],
          providerCategories: [''],
        });
  }

  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    if (this.entityName === 'Partner' || this.entityName === 'Reseller') {
      var customerIdInt = localStorage.getItem("ReportCustomerID");
      if (customerIdInt != null) {
        this.customerId = Number(customerIdInt);
      }
      this.customerC3Id = localStorage.getItem("ReportC3CustomerID"),
        this.customerName = localStorage.getItem("ReportCustomerName")
    }
    else {
      this.customerC3Id = this.recordId;
    }
    this.providerPlaceholder = this._translateService.instant('TRANSLATE.PLACEHOLDER_FOR_PROVIDERS_DROPDOWN')
    this.categoryPlaceholder = this._translateService.instant('TRANSLATE.PLACEHOLDER_FOR_CATEGORIES_DROPDOWN')
    this.statusPlaceholder = this._translateService.instant('TRANSLATE.SELECT_STATUS')
    this.getApplicationData();
    this.getReconciliationReport();
    this.getBillingCycles();
    this.getProviders();
    this.getCategories();
    this.getSubscriptionStatus();
    
  }

  backToList() { 
    this.c3RouterService.backToHistory(this.keyForData,'partner/customers');
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_REPORTS"),true);
    this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','CUSTOMER_REPORTS','CUSTOMER_RECONCILIATION_REPORT'])
  }

  getApplicationData() {
    this._appSettingService.getApplicationData().subscribe((response: any) => {
      this.reconliationReportLogo = response.Data.ReconReportLogoPath;
    });
  }

  getBillingCycles() {
    this._commonService.getBillingCycles().subscribe((res) => {
      this.billingCycles = res;
    })
  }
  providersDataSet: Select2Data = [];

 

    planDetailsRegisterForm: FormGroup;
    selectedProviders: Select2Value[] = [];
  selectedProviderKey : any;
    


  getReconciliationReport(callback: any = null) {
    let model = new ReconciliationReportModel();
    model.CustomerC3Id = this.customerC3Id;
    model.SearchText = this.searchModel.searchText;
    if(this.ProviderSelection.length == 0 || 
      (this.ProviderSelection.length == this.Categories.length && this.CategorySelection.length == 0) ||
      (this.ProviderSelection.length == this.Categories.length && this.CategorySelection.length == this.Categories.length)){
      model.CategoryIds = "";
    }
    else if(this.ProviderSelection.length > 0 && this.CategorySelection.length == 0){
      const providerIdSet = new Set(this.ProviderSelection);
      const categoriesByProvider = this.Categories.filter(
        c => providerIdSet.has(c.ProviderId)
      );
      model.CategoryIds = categoriesByProvider.map(c => c.ID).join(",");
    }
    else if(this.ProviderSelection.length > 0 && this.CategorySelection.length > 0){
      model.CategoryIds = this.CategorySelection.join(",");
    }
    model.StatusIds = this.StatusSelection.join(",");
    this.loadingReport = true;
    this._reconciliationReportService.getList(model.SearchText, model.CustomerC3Id,model.StatusIds,model.CategoryIds).subscribe((res: any) => {
      this.customerSubscriptions = res.Data;
      this.loadingReport = false;
      if (!!this.customerSubscriptions) {
        each(this.customerSubscriptions, (row) => {
          if (row.ServiceProviderCustomer == null) {
            row.ServiceProviderCustomerId = 'Partner';
            row.ServiceProviderCustomer = 'Partner';
          }
          if (row.SubscriptionStatus != null) {
            row.SubscriptionStatusUpper = row.SubscriptionStatus.charAt(0).toUpperCase() + row.SubscriptionStatus.slice(1);
          }
          each(row.CMPRecon, (support) => {
            if (row.IsMatch == false && row.Category == 'OnlineServicesNCE' && support.LocalStoreSubscriptionName != null && row.IsCompositeOffer == false && support.IsLinkedSubscription == false && (row.ProviderBillingCycleId == support.ProductBillingCycleId) && (row.CSPValidityType == support.ValidityType && row.CSPValidity == support.Validity) && row.CSPQuantity == support.LocalStoreQuantity && (support.LocalStoreOfferId && (row.CustomCSPOfferId ? row.CustomCSPOfferId : '').toLowerCase() == (support.CustomLocalStoreOfferId ? support.CustomLocalStoreOfferId : '').toLowerCase()) && !row.OnHold && (support.LocalStoreOfferId && (row.CSPPromotionID ? row.CSPPromotionID : '').toLowerCase() != (support.C3PromotionID ? support.C3PromotionID : '').toLowerCase())) {
              row.IsOnlyPromotionMismatch = true;
            }
            else {
              row.IsOnlyPromotionMismatch = false;
            }

            let isRenewalPolicyIdMatch = true;
            if (row.scheduledActions != null && row.scheduledActions != undefined)
            {
              if(row.scheduledActions.length > 0){
                var actionTypeEnum = this._commonService.getScheduledIndex(row.scheduledActions);

                isRenewalPolicyIdMatch =
                    row.RenewalPolicyId == actionTypeEnum
              }
            }
            // renewpolicy id and auto renew flag both should match for auto renew status mismatch
            row.isAutoRenewStatusMatch = (isRenewalPolicyIdMatch && row.CSPIsAutoRenew == support.IsAutoRenew) ? true : false
          });
        });
        this.customerSubscriptionsTemp = this.customerSubscriptions;

        if (this.customerSubscriptions !== null && this.customerSubscriptions.length > 0) {
          this.lastRefreshedOn = this.customerSubscriptions[0].TimeDifference;
        }
        this.IsAzurePlanOnboarded = filter(this.customerSubscriptions, function (a) { return a.IsUsage === true && a.IsEntitlement === false && a.OfferId != 'MS-AZR-0145P' && a.IsMatch === false; }).length === 0;
        this.mismatchCount = chain(this.customerSubscriptions).filter({ 'IsMatch': false }).size().value();
        this.groupModelList = [];
        if(this.customerSubscriptions !== null && this.customerSubscriptions.length > 0){
          let sc = filter(this.customerSubscriptions, { ServiceProviderCustomer: this.customerSubscriptions[0].ServiceProviderCustomer });
          let missmatchCount = chain(sc).filter({ 'IsMatch': false }).size().value()
          this.groupModel = { ServiceProviderCustomer: this.customerSubscriptions[0].ServiceProviderCustomer, CustomerSubscriptions: sc, ServiceProviderCustomerId: this.customerSubscriptions[0].ServiceProviderCustomerId, Provider: this.customerSubscriptions[0].Provider, MisMatchCount: missmatchCount, IsExpanded: false }
          this.groupModelList.push(this.groupModel);
          this.groupModel = new ReconciliationReportGroupModel();
        }
        each(this.customerSubscriptions, (row) => {
          each(this.groupModelList, (model) => {
            if (model.ServiceProviderCustomer == row.ServiceProviderCustomer) {

            }
            else {
              var exist = filter(this.groupModelList, { ServiceProviderCustomer: row.ServiceProviderCustomer });
              if (exist.length == 0) {
                this.groupModel = { ServiceProviderCustomer: row.ServiceProviderCustomer, CustomerSubscriptions: null, ServiceProviderCustomerId: row.ServiceProviderCustomerId, Provider: row.Provider, MisMatchCount: 0, IsExpanded: false }
                this.groupModel.CustomerSubscriptions = filter(this.customerSubscriptions, function (item) { return item.ServiceProviderCustomer == row.ServiceProviderCustomer });
                this.groupModel.MisMatchCount = chain(this.groupModel.CustomerSubscriptions).filter({ 'IsMatch': false }).size().value();
              }
            }

          });
          if (this.groupModel != null && this.groupModel.CustomerSubscriptions != null) {
            this.groupModelList.push(this.groupModel);
            this.groupModel = new ReconciliationReportGroupModel();
          }
        });
        this.groupModelListTemp = this.groupModelList;
        if (this.groupModelList.length > 0) {
          this.groupModelList[0].IsExpanded = true;
        }
        if (this.groupModelList.length == 1) {
          this.shouldExpandAll = true;
        }
      }
      if (callback != null) {
        callback(this);
      }
      if(this.searchModel.shouldShowOnlyMismatch){
        this.showReports();
      }
      this._cdref.detectChanges();
    })
  }

  displayFilter(){
    this.shouldShowFilter = !this.shouldShowFilter
  }

  closeFilter(){
    this.shouldShowFilter = false;
  }

  searchRecon(){
    this.searchModel.searchText = '';
    this.getReconciliationReport();
  }


  resetSearchCriteria(){
    this.searchModel.searchText = '';
    this.searchModel.categoryIds = '';
    this.searchModel.statusIds = '';

    this.ProviderSelection = [];
    this.CategorySelection = [];
    this.StatusSelection = [];
    this.FilteredCategories = [];

    this.CategorySelectionInit = []
    this.ProviderSelectionInit = []
    this.StatusSelectionInit = []

    this.getReconciliationReport();
  }
  Providers:Select2Data = []
  Categories:any = []
  SubscriptionStatues:Select2Data = []

  FilteredCategories:Select2Data = []

  ProviderSelection: any = [];
  CategorySelection: any = [];
  StatusSelection: any = [];

  CategorySelectionInit:Select2Value[] = []
  ProviderSelectionInit:Select2Value[] = []
  StatusSelectionInit:Select2Value[] = []




    getProviders() {
      const subscription = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        const result = response.filter(r => r.ID < 3)
        this.Providers = result.map(p => {
          const provider = {
            value:p.ID,
            data:{
              Description:p.Description
            }
          }
          return provider;
        })
      });
      this._subscriptionArray.push(subscription);
    }

    getCategories() {
      const subscription = this._commonService.getCategoriesForSubscription().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.Categories = response.Data;
      });
      this._subscriptionArray.push(subscription);
    }

    getSubscriptionStatus() {
      const subscription = this._commonService.getSubscriptionStatus().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.SubscriptionStatues = response.Data.map(s => {
          const provider = {
            value:s.ID,
            data:{
              Description:s.Description
            }
          }
          return provider;
        })
        
      });
      this._subscriptionArray.push(subscription);
    }

    toggleProviderSelection(event: Select2UpdateEvent){
      this.ProviderSelection = event.value;
      const providerIdSet = new Set(this.ProviderSelection);

      this.FilteredCategories = this.Categories.filter(
        c => providerIdSet.has(c.ProviderId)
      ).map(c => 
              {
                const category = 
                {
                  value:c.ID,
                  data:{
                    Description:c.CategoryDescriptionKey
                  }
                }
                return category;
              }
          );
    }

    toggleCategorySelection(event: Select2UpdateEvent) {
       this.CategorySelection = event.value;
    }

     toggleStatusSelection(event: Select2UpdateEvent) {
       this.StatusSelection = event.value;
    }



    toggleProviderDropdown(statusSelectEl:any) {

       if(!this.providerToggle){
          this.toogleLogic(statusSelectEl)
      }
    }

    toggleCategoriesDropdown(statusSelectEl:any) {

       if(!this.categoryToggle){
          this.toogleLogic(statusSelectEl)
      }
    }

    toggleStatusDropdown(statusSelectEl:any) {

       if(!this.statusToggle){
          this.toogleLogic(statusSelectEl)
      }
    }

    toogleLogic(statusSelectEl:any){
      setTimeout(() => {
          const el = statusSelectEl?.selectionElement?.getElementsByClassName(
              'select2-selection select2-selection--multiple'
            )[0];
            if (el) {
              (el as HTMLElement).click(); // simpler & works better with Select2
            }
          }, 0);
    }

 




  isFullFillingMisMatchSelection(subscription: any) {
    var returnValue = !subscription.IsMatch;
    if (this.searchModel.shouldShowOnlyFixedInActive && !returnValue) {
      returnValue = !subscription.CMPRecon[0].IsLocalStoreSubscriptionActive;
    }
    return returnValue;
  }

  isFullFillingFixedInActiveSelection(subscription: any) {
    return true;
  }

  shouldSubscriptionBeShown(subscription: any) {
    var isMismatchSelected = this.searchModel.shouldShowOnlyMismatch;
    var isFixedInActiveSelected = this.searchModel.shouldShowOnlyFixedInActive;
    var searchText = this.searchModel.searchText.toLowerCase();
    var result = searchText == '' || ((subscription.CSPOfferName != null && subscription.CSPOfferName.toLowerCase().indexOf(searchText) > -1) || (subscription.CMPRecon != null && subscription.CMPRecon[0].LocalStoreSubscriptionName != null && subscription.CMPRecon[0].LocalStoreSubscriptionName.toLowerCase().indexOf(searchText) > -1) || (subscription.SubscriptionId != null && subscription.SubscriptionId.toLowerCase().indexOf(searchText) > -1));
    if (!result)
      return false;
    if (isMismatchSelected)
      return this.isFullFillingMisMatchSelection(subscription);
    if (isFixedInActiveSelected)
      return this.isFullFillingFixedInActiveSelection(subscription);

    return this.defaultFilter(subscription);
  }

  defaultFilter(subscription: any) {
    return !subscription.IsMatch || isNull(subscription.CMPRecon[0].IsLocalStoreSubscriptionActive) ? true : subscription.CMPRecon[0].IsLocalStoreSubscriptionActive == !this.searchModel.shouldShowOnlyFixedInActive;
  }

  reloadReconreport() {
    this.resetSearchCriteria()
    this.shouldShowFilter = false;
  }

  handleFixedInActive() {
    let searchText = this.searchModel.searchText;
    this.searchModel.searchText = '';
    this.getReconciliationReport(this.callbackHandeFixedInactive)
  }

  callbackHandeFixedInactive(self: any) {
    self.showReports();
  }

  showReports() {
    this.groupModelList = [];
    this.groupModel = new ReconciliationReportGroupModel();
    if (this.searchModel.IsEmpty())
      this.groupModelList = this.groupModelListTemp;
    else {
      this.groupModel = new ReconciliationReportGroupModel();
      each(this.groupModelListTemp, (model) => {
        var filterSubscriptions = filter(model.CustomerSubscriptions, (a) => { return this.shouldSubscriptionBeShown(a); });
        let missMatchCount = model.MisMatchCount;
        if (filterSubscriptions.length > 0) {
          this.groupModel = { ServiceProviderCustomer: model.ServiceProviderCustomer, CustomerSubscriptions: null, ServiceProviderCustomerId: model.ServiceProviderCustomerId, Provider: model.Provider, MisMatchCount: 0, IsExpanded: true }
          this.groupModel.CustomerSubscriptions = filterSubscriptions;
          this.groupModel.MisMatchCount = missMatchCount;
          this.groupModelList.push(this.groupModel);
        }
      });
    }
    this.setExpandAll(true);
  }

  setExpandAll(allExpanded: boolean) {
    this.groupModelList.forEach((item) => {
      item.IsExpanded = allExpanded;
    })
    this.shouldExpandAll = allExpanded;
  }

  fixQuantityMismatch(offer: any) {
    let error = "AN_ERROR_OCCURED";
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_MANUAL_SYNC_CONFIRM_ACTION_POPUP');
    const btnConfirm = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
    this._notifierService.confirm({
      title: confirmationMessage, confirmButtonText: btnConfirm,
      customClass: {
        confirmButton: 'bg-success'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        let requestBody = {
          ServiceProviderCustomerId: offer.ServiceProviderCustomerId,
          ProviderSubscriptionId: offer.SubscriptionId,
          ProviderProductQuantity: offer.CSPQuantity,
          ProductQuantity: offer.CMPRecon[0].LocalStoreQuantity,
          InternalProductId: offer.CMPRecon[0].InternalProductId,
          ProviderSubscriptionStatus: offer.IsActiveinCSP ? "Active" : "Suspended",
          ProductStatus: offer.CMPRecon[0].LocalSubscriptionStatus,
          CustomerC3Id: offer.CustomerC3Id,
          CustomerName: offer.CustomerName,
          CustomerId: offer.CustomerId,
          LocalStoreSubscriptionId: offer.LocalStoreSubscriptionId,
          CreatedByInProvider: offer.CreatedByInProvider,
          CreatedDateInProvider: offer.CreatedDateInProvider,
          CSPAutoRenewEnabled: offer.CSPIsAutoRenew,
          AutoRenewEnabled: offer.CMPRecon[0].IsAutoRenew
        };
        if (offer.Category == 'OnlineServicesNCE') {
          requestBody.ProviderSubscriptionStatus = offer.SubscriptionStatus;
        }
        this._reconciliationReportService.fixQuantityMismatch(requestBody).pipe(
          catchError((err) => {
            const errorMessage = err.error?.ErrorMessage;
            if (errorMessage) {
              const errorMessageData = JSON.parse(errorMessage);
              error = errorMessageData.ErrorValue;
            }
            let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
            this._toastService.error(errmsg, {
              timeOut: 10000
            });
            return of(null);
          }))
          .subscribe((res: any) => {
            if (res.Status == "Success") {
              this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
              this.getReconciliationReport();
            }
          })
      }
      else {
        this.reloadEvent.emit(true);
      }
    })
  }

  fixMissingOffer(offerData: any) {
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_MANUAL_SYNC_CONFIRM_ACTION_POPUP');
    const btnConfirm = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
    let error = "AN_ERROR_OCCURED";
    this._notifierService.confirm({
      title: confirmationMessage, confirmButtonText: btnConfirm,
      customClass: {
        confirmButton: 'bg-success'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this._loaderService.commonStartLoading();
        this._reconciliationReportService.getCustomerPlansByCategory
          (this.customerC3Id, 'ReservedInstances', offerData.CSPCountryCode).pipe(
            switchMap((res: any) => {
              this.customerPlans = res.Data;
              this.subscriptionsList = [];
              this.loaderService.startLoading();
              this.loadingSubscriptions = true;
              return this._reconciliationReportService.getMatchingSubscriptionsForSync(this.entityName, this.recordId, offerData.ServiceProviderCustomerId, this.customerC3Id, offerData.ReservationOrderID, offerData.Category, offerData.SubscriptionId, offerData.CustomCSPOfferId)
                .pipe(
                  catchError((err) => {
                    const errorMessage = err.error?.ErrorMessage;
                    if(errorMessage){
                      const errorMessageData = JSON.parse(errorMessage);
                      error = errorMessageData.ErrorValue;
                    }
                    let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                    this._toastService.error(errmsg, {
                      timeOut: 10000
                    });
                    return of(null);

                  })
                );
            }),
            catchError((err) => {
              const errorMessage = err.error?.ErrorMessage;
              if (errorMessage) {
                const errorMessageData = JSON.parse(errorMessage);
                error = errorMessageData.ErrorValue;
              }
              let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
              this._toastService.error(errmsg, {
                timeOut: 10000
              });
              return of(null);
            }),
            finalize(() => {
              // ✅ This will always run — success or error after total execution of api calling
              this.loaderService.stopLoading();
              this._loaderService.commonStopLoading();
              this.loadingSubscriptions = false;
            })
          )
          .subscribe((res: any) => {
            if (res?.Status == "Success") {
              this.subscriptionsList = filter(res?.Data, { ProviderSubscriptionId: offerData.SubscriptionId });

              let mappedChild: any = [];
              each(this.subscriptionsList, function (subscription) {
                subscription.MappingC3PlanProducts = JSON.parse(subscription.MappingC3PlanProducts);
                //taking the correct child for mapping
                each(subscription.MappingC3PlanProducts, function (product) {
                  if (offerData.ParentPlanProductId != null) {
                    if (offerData.ParentPlanProductId == product.ParentPlanProductId) {
                      mappedChild.push(product);
                    }
                  }
                });
                mappedChild = filter(mappedChild, { 'CompositeProductId': null, 'LinkedProductId': null })
                if (offerData.ParentPlanProductId != null) {
                  subscription.MappingC3PlanProducts = uniqBy(mappedChild, 'MappedC3PlanProductId');
                }
                subscription.MappingC3PlanProducts = filter(subscription.MappingC3PlanProducts, { 'CompositeProductId': null, 'LinkedProductId': null })
                subscription.OrderId = offerData.OrderId;
              });
              const config: NgbModalOptions = {
                modalDialogClass: 'modal-dialog modal-dialog-top modal-lg'
              };
              const modalRef = this._modalService.open(CspProductsMappedToPlanproductsPopupComponent, config)
              modalRef.componentInstance.subscriptionsList = this.subscriptionsList;
              modalRef.componentInstance.customerPlans = this.customerPlans;
              modalRef.result.then(
                (offer) => {
                  if (offer) {
                    if (offer.ProviderUnitType === "Usage-based" && offer.ProviderSubscriptionOfferId != 'MS-AZR-0145P') {
                      let requestBody = {
                        ServiceProviderCustomerId: offer.ProviderCustomerId,
                        ProviderSubscriptionId: offer.ProviderSubscriptionId,
                        ProviderProductQuantity: offer.ProviderQuantity,
                        PlanProductId: offer.MappedC3PlanProduct.PlanProductId,
                        IgnoredProduct: offer.IsIgnore,
                        OrderId: offer.OrderId,
                        ParentProviderSubscriptionId: offer.ProviderSubscriptionParentId,
                        CategoryName: offer.CategoryName,
                        CreatedByInProvider: offer.CreatedByInProvider,
                        CreatedDateInProvider: offer.CreatedDateInProvider,
                        CustomerC3Id: this.customerC3Id,
                        ProviderName: offer.ProviderName,
                        PromotionId: offer.PromotionId,
                        IsProviderPromotionAppliedForCustomer: offer.IsApplyPromotionSelected
                      };
                      this._reconciliationReportService.onboardAzurePlan(requestBody).pipe(
                        catchError((err) => {
                          const errorMessage = err.error?.ErrorMessage;
                          if (errorMessage) {
                            const errorMessageData = JSON.parse(errorMessage);
                            error = errorMessageData.ErrorValue;
                          }
                          let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                          this._toastService.error(errmsg, {
                            timeOut: 10000
                          });
                          return of(null);
                        })
                      )
                        .subscribe((res) => {
                          if (res?.Status == "Success") {
                            this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
                            this.getReconciliationReport();
                          }
                        })
                    }
                    else if (offer.CategoryName.toLowerCase() === this.cloudHubConstants.RESERVED_INSTANCES.toLowerCase()) {
                      let requestBody: any = {
                        OfferName: offer.ProviderSubscriptionOfferName,
                        ProviderSubscriptionFriendlyName: offer.ProviderSubscriptionFriendlyName,
                        SkuName: offer.ProviderSubscriptionSkuName,
                        OfferSkuId: offer.ProviderSubscriptionOfferId,
                        OfferId: offer.ProviderSubscriptionOfferId,
                        SkuId: null,
                        Segment: offer.Segment,
                        Scope: offer.Scope,
                        CountryCode: offer.MarketCode,
                        ProviderSubscriptionId: offer.ProviderSubscriptionId,
                        Quantity: offer.ProviderQuantity,
                        OrderId: offer.OrderId,
                        ServiceProviderCustomerId: offer.ProviderCustomerId,
                        CustomerId: this.customerId,
                        CustomerC3Id: this.customerC3Id,
                        PlanId: offer.PlanId,
                        PlanProductId: offer.MappedC3PlanProduct != null && offer.MappedC3PlanProduct.PlanProductId != null ? offer.MappedC3PlanProduct.PlanProductId : null,
                        SalePrice: offer.riSalePrice,
                        BillingCycle: offer.BillingCycleName,
                        BillingCycleId: offer.BillingCycleId,
                        Validity: offer.Validity,
                        ValidityType: offer.ValidityType,
                        ReservationOrderID: offer.ReservationOrderID,
                        CSPBillingScope: offer.CSPBillingScope,
                        CurrentProductId: 0,
                        ActionName: 'FIX_MISSING_OFFER',
                        Location: offerData.CSPLocation,
                        SyncedSubscriptionName: offer.SyncedSubscriptionName

                      }
                      this._reconciliationReportService.createReservedInstancesSubscription(requestBody).pipe(
                        catchError((err) => {
                          const errorMessage = err.error?.ErrorMessage;
                          if (errorMessage) {
                            const errorMessageData = JSON.parse(errorMessage);
                            error = errorMessageData.ErrorValue;
                          }
                          let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                          this._toastService.error(errmsg, {
                            timeOut: 10000
                          });
                          return of(null);
                        })
                      )
                        .subscribe((res) => {
                          if (res?.Status == "Success") {
                            this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
                            this.getReconciliationReport();
                          }
                        })
                    }
                    else {
                      var requestBody = {
                        ServiceProviderCustomerId: offer.ProviderCustomerId,
                        ProviderSubscriptionId: offer.ProviderSubscriptionId,
                        ProviderProductQuantity: offer.ProviderQuantity,
                        PlanProductId: offer.MappedC3PlanProduct.PlanProductId,
                        IgnoredProduct: offer.IsIgnore,
                        OrderId: offer.OrderId,
                        ParentProviderSubscriptionId: offer.ProviderSubscriptionParentId,
                        CategoryName: offer.CategoryName,
                        CreatedByInProvider: offer.CreatedByInProvider,
                        CreatedDateInProvider: offer.CreatedDateInProvider,
                        CustomerC3Id: this.customerC3Id,
                        ProviderName: offer.ProviderName,
                        PromotionId: offer.PromotionId,
                        IsProviderPromotionAppliedForCustomer: offer.IsApplyPromotionSelected
                      };
                      this._reconciliationReportService.createSubscription(requestBody).pipe(
                        catchError((err) => {
                          const errorMessage = err.error?.ErrorMessage;
                          if (errorMessage) {
                            const errorMessageData = JSON.parse(errorMessage);
                            error = errorMessageData.ErrorValue;
                          }
                          let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                          this._toastService.error(errmsg, {
                            timeOut: 10000
                          });
                          return of(null);
                        })
                      )
                        .subscribe((res) => {
                          if (res?.Status == "Success") {
                            this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
                            this.getReconciliationReport();
                          }
                        })
                    }
                  }
                },
                (reason) => {
                  modalRef.close();
                }
              );

            }
          })
      }
      else {
        this.reloadEvent.emit(true);
      }
    });
  }

  fixOfferStatus(offer: any) {
    let error = "AN_ERROR_OCCURED";
    const btnConfirm = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_MANUAL_SYNC_CONFIRM_ACTION_POPUP');
    this._notifierService.confirm({ title: confirmationMessage, confirmButtonText: btnConfirm, 
      customClass:{
        confirmButton:'bg-success'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        var requestBody = {
          ServiceProviderCustomerId: offer.ServiceProviderCustomerId,
          ProviderSubscriptionId: offer.SubscriptionId,
          ProviderProductQuantity: offer.CSPQuantity,
          ProductQuantity: offer.CMPRecon[0].LocalStoreQuantity,
          InternalProductId: offer.CMPRecon[0].InternalProductId,
          ProviderSubscriptionStatus: offer.IsActiveinCSP ? "Active" : "Suspended",
          ProductStatus: offer.CMPRecon[0].LocalStoreSubscriptionStatus,
          CustomerC3Id: offer.CustomerC3Id,
          CustomerName: offer.CustomerName,
          CustomerId: offer.CustomerId,
          LocalStoreSubscriptionId: offer.LocalStoreSubscriptionId,
          CreatedByInProvider: offer.CreatedByInProvider,
          CreatedDateInProvider: offer.CreatedDateInProvider,
          CSPAutoRenewEnabled: offer.CSPIsAutoRenew,
          AutoRenewEnabled: offer.CMPRecon[0].IsAutoRenew
        };
        if (offer.Category == 'OnlineServicesNCE' || offer.Category == 'SoftwareSubscriptions' || offer.Category == 'ReservedInstances') {
          requestBody.ProviderSubscriptionStatus = offer.SubscriptionStatus;
        }
        this._reconciliationReportService.fixOfferStatus(requestBody).pipe(
          catchError((err) => {
            const errorMessage = err.error?.ErrorMessage;
            if (errorMessage) {
              const errorMessageData = JSON.parse(errorMessage);
              error = errorMessageData.ErrorValue;
            }
            let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
            this._toastService.error(errmsg, {
              timeOut: 10000
            });
            return of(null);
          }))
        .subscribe((res: any) => {
          if (res.Status == "Success") {
            this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
            this.getReconciliationReport();
          }
        })
      }
      else {
        this.reloadEvent.emit(true);
      }
    });
  }

  changeBillingCycle(product: any) {
    var newBillingCycle: any = null;
    newBillingCycle = filter(this.billingCycles, function (a) { return a.ID === product.ProviderBillingCycleId })[0].Name;
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_CHANGE_PRODUCT_BILLING_CYCLE_CONFIRMATION_TEXT', { targetBillingCycle: newBillingCycle });
    const btnConfirm = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
    this._notifierService.confirm({  title: confirmationMessage, confirmButtonText: btnConfirm, 
      customClass:{
        confirmButton:'bg-success'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.mapBillingProductsAgainstPlan(product, newBillingCycle);
      }
      else {
        this.reloadEvent.emit(true);
      }
    });
  }

  mapBillingProductsAgainstPlan(offerData: any, newBillingCycleParam: any) {
    let error = "AN_ERROR_OCCURED";
    let marketCode = offerData.CSPCountryCode;
    this._reconciliationReportService.getCustomerPlansByCategory(this.customerC3Id, 'ReservedInstances', offerData.CSPCountryCode)
      .pipe(
        switchMap((res: any) => {
          this.customerPlans = res.Data;
          this.subscriptionsList = [];
          this.loadingSubscriptions = true;
          this.loaderService.startLoading(); 
          return this._reconciliationReportService.getProductsForBillingCycleChange(offerData.CMPRecon[0].InternalProductId, offerData.CMPRecon[0].ProductBillingCycleName, newBillingCycleParam)
          .pipe(
            catchError((err) => {
              const errorMessage = err.error?.ErrorMessage;
              if (errorMessage) {
                const errorMessageData = JSON.parse(errorMessage);
                error = errorMessageData.ErrorValue;
              }
              let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
              this._toastService.error(errmsg, {
                timeOut: 10000
              });
              this.loaderService.stopLoading();
              this.loadingSubscriptions = false;
              return of(null);
            })
          );
        }),
        catchError((err) => {
          const errorMessage = err.error?.ErrorMessage;
          if (errorMessage) {
            const errorMessageData = JSON.parse(errorMessage);
            error = errorMessageData.ErrorValue;
          }
          let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
          this.loaderService.stopLoading();
          this.loadingSubscriptions = false;
          this._toastService.error(errmsg, {
            timeOut: 10000
          });
          return of(null);
        })
      ).subscribe((res: any) => {
        if (res.Status === "Success") {
          this.subscriptionsList = res.Data;

          each(this.subscriptionsList, function (subscription) {
            subscription.MappingC3PlanProducts = JSON.parse(subscription.MappingC3PlanProducts);
            subscription.MappingC3PlanProducts = filter(subscription.MappingC3PlanProducts, { 'CompositeProductId': null, 'LinkedProductId': null })
          });
          this.loadingSubscriptions = false;
          this.loaderService.stopLoading();
          var customerEntities = filter(this.subscriptionsList, function (subscription) {
            return subscription.EntityName.toLowerCase() === 'customer';
          });

          const config: NgbModalOptions = {
            modalDialogClass: 'modal-dialog modal-dialog-top modal-lg'
          };
          const modalRef = this._modalService.open(BillingCycleChangeMappedProductPopupComponent, config)
          modalRef.componentInstance.subscriptionsList = customerEntities;
          modalRef.componentInstance.customerPlans = this.customerPlans;
          modalRef.result.then(
            (result) => {
              if (result) {
                if (result?.CategoryName.toLowerCase() === this.cloudHubConstants.RESERVED_INSTANCES.toLowerCase()) {
                  let offer = result?.Offer;
                  var reqBody: any = {
                    OfferName: offer.SubscriptionQualifiedOfferName,
                    OfferSkuId: offer.TargetOfferId,
                    OfferId: offer.TargetOfferId,
                    SkuId: null,
                    Segment: offer.Segment,
                    Scope: offer.Scope,
                    CountryCode: marketCode,
                    ProviderSubscriptionId: offer.ProviderSubscriptionId,
                    Quantity: offer.Quantity,
                    OrderId: offer.OrderId,
                    ServiceProviderCustomerId: offer.ProviderCustomerId,
                    CustomerId: this.customerId,
                    CustomerC3Id: this.customerC3Id,
                    PlanId: offer.SelectedPlanId,
                    PlanProductId: offer.MappedC3PlanProduct != null && offer.MappedC3PlanProduct.PlanProductId != null ? offer.MappedC3PlanProduct.PlanProductId : null,
                    SalePrice: offer.riSalePrice,
                    BillingCycle: offer.BillingCycleName,
                    BillingCycleId: offer.BillingCycleId,
                    Validity: offer.OldValidity,
                    ValidityType: offer.OldValidityType,
                    ReservationOrderID: offer.ReservationOrderID,
                    CSPBillingScope: offer.BillingScope,
                    CurrentProductId: offer.ProductID,
                    ActionName: 'FIX_BILLING_CYCLE_MISMATCH',
                    Location: offerData.CSPLocation
                  }
                  this._reconciliationReportService.createReservedInstancesSubscription(reqBody)
                  .pipe(
                    catchError((err) => {
                      const errorMessage = err.error?.ErrorMessage;
                      if (errorMessage) {
                        const errorMessageData = JSON.parse(errorMessage);
                        error = errorMessageData.ErrorValue;
                      }
                      let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                      this._toastService.error(errmsg, {
                        timeOut: 10000
                      });
                      return of(null);
                    })
                  )
                  .subscribe((res) => {
                    if (res.Status == "Success") {
                      this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
                      this.getReconciliationReport();
                    }
                  })
                }
                else {
                  let offer = result?.Offer;
                  each(offer, (item) => {
                    if (item.MappedC3PlanProduct != undefined || item.MappedC3PlanProduct != null) {
                      each(this.subscriptionsList, function (subscription) {
                        if (item.ProviderSubscriptionId === subscription.ProviderSubscriptionId)
                          subscription.MappedC3PlanProduct = item.MappedC3PlanProduct;
                      });
                    }
                  });

                  offer = this.subscriptionsList;
                  this.mappedProducts = offer;
                  let requestModel: any = {
                    Model: JSON.stringify(this.mappedProducts)
                  }
                  this._reconciliationReportService.validateMappedproducts(requestModel).pipe(
                    switchMap((res: any) => {
                      const mappedSubscriptions = res.Data;
                      return this._reconciliationReportService.syncBillingCycle(mappedSubscriptions.MappedProducts, mappedSubscriptions.NewBillingCycle)
                      .pipe(
                        catchError((err) => {
                          const errorMessage = err.error?.ErrorMessage;
                          if (errorMessage) {
                            const errorMessageData = JSON.parse(errorMessage);
                            error = errorMessageData.ErrorValue;
                          }
                          let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                          this._toastService.error(errmsg, {
                            timeOut: 10000
                          });
                          this.loaderService.stopLoading();
                          this.loadingSubscriptions = false;
                          return of(null);
      
                        })
                      );
                    }),
                    catchError((err) => {
                      const errorMessage = err.error?.ErrorMessage;
                      if (errorMessage) {
                        const errorMessageData = JSON.parse(errorMessage);
                        error = errorMessageData.ErrorValue;
                      }
                      let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                      this.loaderService.stopLoading();
                      this.loadingSubscriptions = false;
                      this._toastService.error(errmsg, {
                        timeOut: 10000
                      });
                      return of(null);
                    })
                  ).subscribe((res: any) => {
                    let data = res.Data;
                    if (res.Status == "Success") {
                      this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
                      this.getReconciliationReport();
                    }
                  })
                }
              }
            },
            (reason) => {
              modalRef.close();
            }
          );
        }
      })
  }

  fixPerpetualSoftwareStatus(offer: any) {
    let error = "AN_ERROR_OCCURED";
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_MANUAL_SYNC_CONFIRM_ACTION_POPUP');
    const btnConfirm = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
    this._notifierService.confirm({
      title: confirmationMessage, confirmButtonText: btnConfirm,
      customClass: {
        confirmButton: 'bg-success'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        var requestBody = {
          ServiceProviderCustomerId: offer.ServiceProviderCustomerId,
          ProviderSubscriptionId: offer.SubscriptionId,
          ProviderProductQuantity: offer.CSPQuantity,
          ProductQuantity: offer.CMPRecon[0].LocalStoreQuantity,
          InternalProductId: offer.CMPRecon[0].InternalProductId,
          ProviderSubscriptionStatus: offer.IsActiveinCSP ? "Active" : "Suspended",
          ProductStatus: offer.CMPRecon[0].LocalSubscriptionStatus,
          CustomerC3Id: offer.CustomerC3Id,
          CustomerName: offer.CustomerName,
          CustomerId: offer.CustomerId,
          LocalStoreSubscriptionId: offer.LocalStoreSubscriptionId,
          CreatedByInProvider: offer.CreatedByInProvider,
          CreatedDateInProvider: offer.CreatedDateInProvider,
          CSPAutoRenewEnabled: offer.CSPIsAutoRenew,
          AutoRenewEnabled: offer.CMPRecon[0].IsAutoRenew
        };
        if (offer.Category == 'OnlineServicesNCE') {
          requestBody.ProviderSubscriptionStatus = offer.SubscriptionStatus;
        }
        this._reconciliationReportService.fixPerpetualSoftwareStatus(requestBody).pipe(
          catchError((err) => {
            const errorMessage = err.error?.ErrorMessage;
            if (errorMessage) {
              const errorMessageData = JSON.parse(errorMessage);
              error = errorMessageData.ErrorValue;
            }
            let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
            this._toastService.error(errmsg, {
              timeOut: 10000
            });
            return of(null);
          }))


          .subscribe((res: any) => {
            if (res.Status == "Success") {
              this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
              this.getReconciliationReport();
            }
          })
      }
      else {
        this.reloadEvent.emit(true);
      }
    });
  }

  fixAutoRenewStatus(offer: any) {
    let error = "AN_ERROR_OCCURED";
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_MANUAL_SYNC_CONFIRM_ACTION_POPUP');
    const btnConfirm = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
    this._notifierService.confirm({
      title: confirmationMessage, confirmButtonText: btnConfirm,
      customClass: {
        confirmButton: 'bg-success'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        var requestBody:any = {
          ServiceProviderCustomerId: offer.ServiceProviderCustomerId,
          ProviderSubscriptionId: offer.SubscriptionId,
          ProviderProductQuantity: offer.CSPQuantity,
          ProductQuantity: offer.CMPRecon[0].LocalStoreQuantity,
          InternalProductId: offer.CMPRecon[0].InternalProductId,
          ProviderSubscriptionStatus: offer.IsActiveinCSP ? "Active" : "Suspended",
          ProductStatus: offer.CMPRecon[0].LocalSubscriptionStatus,
          CustomerC3Id: offer.CustomerC3Id,
          CustomerName: offer.CustomerName,
          CustomerId: offer.CustomerId,
          LocalStoreSubscriptionId: offer.LocalStoreSubscriptionId,
          CreatedByInProvider: offer.CreatedByInProvider,
          CreatedDateInProvider: offer.CreatedDateInProvider,
          CSPAutoRenewEnabled: offer.CSPIsAutoRenew,
          AutoRenewEnabled: offer.CMPRecon[0].IsAutoRenew
        };
        if(offer.scheduledActions != null && offer.scheduledActions != undefined){
          if(offer.scheduledActions.length > 0){
            requestBody.OldRenewalPolicyId = offer.RenewalPolicyId;
            requestBody.NewRenewalPolicyId = this._commonService.getScheduledIndex(offer.scheduledActions)
          }
        }
        if (offer.Category == 'OnlineServicesNCE') {
          requestBody.ProviderSubscriptionStatus = offer.SubscriptionStatus;
        }
          this._reconciliationReportService.fixAutoRenewStatus(requestBody).pipe(
            catchError((err) => {
              const errorMessage = err.error?.ErrorMessage;
              if (errorMessage) {
                const errorMessageData = JSON.parse(errorMessage);
                error = errorMessageData.ErrorValue;
              }
              let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
              this._toastService.error(errmsg, {
                timeOut: 10000
              });
              return of(null);
            }))


            .subscribe((res: any) => {
              if (res.Status == "Success") {
                this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
                this.getReconciliationReport();
              }
            })
        
      }
      else {
        this.reloadEvent.emit(true);
      }
    });
  }

  changeTermDuration(product: any) {
    let newBillingCycle: string = null;
    let oldBillingCycle: string = null;
    newBillingCycle = filter(this.billingCycles, function (a) { return a.ID === product.ProviderBillingCycleId })[0].Name;
    oldBillingCycle = filter(this.billingCycles, function (a) { return a.ID === product.CMPRecon[0].ProductBillingCycleId })[0].Name;
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_CHANGE_PRODUCT_TERM_DURATION_CONFIRMATION_TEXT', { targetTermDuration: product.CSPValidity + ' ' + product.CSPValidityType });
    const btnConfirm = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
    this._notifierService.confirm({ title: confirmationMessage, confirmButtonText: btnConfirm, 
      customClass:{
        confirmButton:'bg-success'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.mapTermProductsAgainstPlan(product, oldBillingCycle, product.CMPRecon[0].ProductBillingCycleId, newBillingCycle)
      }
      else {
        this.reloadEvent.emit(true);
      }
    })
  }

  mapTermProductsAgainstPlan(offerData: any, oldBillingCycle: string, oldBillingCycleId: number, newBillingCycle: string) {
    let error = "AN_ERROR_OCCURED";
    this.subscriptionsList = [];
    this.loadingSubscriptions = true;
    let oldQuantity = offerData.CMPRecon[0].LocalStoreQuantity;
    let marketCode = offerData.CSPCountryCode;
    this._reconciliationReportService.getCustomerPlansByCategory(this.customerC3Id, 'ReservedInstances', offerData.CSPCountryCode)
      .pipe(
        switchMap((res: any) => {
          this.customerPlans = res.Data;
          this.loadingSubscriptions = true;
          this.loaderService.startLoading();
          return this._reconciliationReportService.getProductsForTermDurationChange(offerData.CMPRecon[0].InternalProductId, offerData.CMPRecon[0].ProductBillingCycleName, newBillingCycle, offerData.CSPValidity, offerData.CSPValidityType, offerData.CSPQuantity)
          .pipe(
            catchError((err) => {
              const errorMessage = err.error?.ErrorMessage;
              if (errorMessage) {
                const errorMessageData = JSON.parse(errorMessage);
                error = errorMessageData.ErrorValue;
              }
              let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
              this._toastService.error(errmsg, {
                timeOut: 10000
              });
              this.loaderService.stopLoading();
              this.loadingSubscriptions = false;
              return of(null);
            })
          );
        }),
        catchError((err) => {
          const errorMessage = err.error?.ErrorMessage;
          if (errorMessage) {
            const errorMessageData = JSON.parse(errorMessage);
            error = errorMessageData.ErrorValue;
          }
          let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
          this.loaderService.stopLoading();
          this.loadingSubscriptions = false;
          this._toastService.error(errmsg, {
            timeOut: 10000
          });
          return of(null);
        })
      ).subscribe((res: any) => {
        if (res.Status == "Success") {
          this.subscriptionsList = res.Data;
          each(this.subscriptionsList, function (subscription) {
            subscription.MappingC3PlanProducts = JSON.parse(subscription.MappingC3PlanProducts);
            subscription.MappingC3PlanProducts = filter(subscription.MappingC3PlanProducts, { 'CompositeProductId': null, 'LinkedProductId': null })
          });
          this.loadingSubscriptions = false;
          this.loaderService.stopLoading();
          let customerEntities = filter(this.subscriptionsList, function (subscription) {
            return subscription.EntityName.toLowerCase() === CloudHubConstants.ENTITY_CUSTOMER.toLowerCase();
          });
          const config: NgbModalOptions = {
            modalDialogClass: 'modal-dialog modal-dialog-top modal-lg'
          };
          const modalRef = this._modalService.open(TermDurationChangeMappedProductPopupComponent, config)
          modalRef.componentInstance.subscriptionsList = customerEntities;
          modalRef.componentInstance.customerPlans = this.customerPlans;
          modalRef.result.then(
            (result) => {
              if (result) {
                if (result?.CategoryName.toLowerCase() === this.cloudHubConstants.RESERVED_INSTANCES.toLowerCase()) {
                  let offer = result?.Offer;
                  var reqBody: any = {
                    OfferName: offer.SubscriptionQualifiedOfferName,
                    OfferSkuId: offer.TargetOfferId,
                    OfferId: offer.TargetOfferId,
                    SkuId: null,
                    Segment: offer.Segment,
                    Scope: offer.Scope,
                    CountryCode: marketCode,
                    ProviderSubscriptionId: offer.ProviderSubscriptionId,
                    Quantity: offer.Quantity,
                    OrderId: offer.OrderId,
                    ServiceProviderCustomerId: offer.ProviderCustomerId,
                    CustomerId: this.customerId,
                    CustomerC3Id: this.customerC3Id,
                    PlanId: offer.SelectedPlanId,
                    PlanProductId: offer.MappedC3PlanProduct != null && offer.MappedC3PlanProduct.PlanProductId != null ? offer.MappedC3PlanProduct.PlanProductId : null,
                    SalePrice: offer.riSalePrice,
                    BillingCycle: offer.BillingCycleName,
                    BillingCycleId: offer.BillingCycleId,
                    Validity: offer.Validity,
                    ValidityType: offer.ValidityType,
                    ReservationOrderID: offer.ReservationOrderID,
                    CSPBillingScope: offer.BillingScope,
                    CurrentProductId: offer.ProductID,
                    ActionName: 'FIX_TERM_DURATION_MISMATCH',
                    Location: offerData.CSPLocation
                  }
                  this._reconciliationReportService.createReservedInstancesSubscription(reqBody).subscribe((res) => {
                    if (res.Status == "Success") {
                      this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
                      this.getReconciliationReport();
                    }
                  })
                }
                else {
                  let offer = result?.Offer;
                  each(offer, (item) => {
                    if (item.MappedC3PlanProduct != undefined || item.MappedC3PlanProduct != null) {
                      each(this.subscriptionsList, function (subscription) {
                        if (item.ProviderSubscriptionId === subscription.ProviderSubscriptionId)
                          subscription.MappedC3PlanProduct = item.MappedC3PlanProduct;
                      });
                    }
                  });
                  offer = this.subscriptionsList;
                  this.mappedProducts = offer;
                  each(this.mappedProducts, function (item) {
                    item.OldBillingCycleId = oldBillingCycleId;
                    item.OldBillingCycleName = oldBillingCycle;
                    item.OldQuantity = oldQuantity;
                    item.BillingCycleName = newBillingCycle;
                  });
                  let requestBody = {
                    Model: JSON.stringify(this.mappedProducts)
                  }
                  this._reconciliationReportService.validateTermMappedProducts(requestBody).pipe(
                    switchMap((res: any) => {
                      const mappedSubscriptions = res.Data;

                      return this._reconciliationReportService.syncTermDurationChange(mappedSubscriptions.NewValidity, mappedSubscriptions.NewValidityType, mappedSubscriptions.MappedProducts).pipe(
                        catchError((err) => {
                          const errorMessage = err.error?.ErrorMessage;
                          if (errorMessage) {
                            const errorMessageData = JSON.parse(errorMessage);
                            error = errorMessageData.ErrorValue;
                          }
                          let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                          this._toastService.error(errmsg, {
                            timeOut: 10000
                          });
                          this.loaderService.stopLoading();
                          this.loadingSubscriptions = false;
                          return of(null);
                        })
                      );
                    }),
                    catchError((err) => {
                      const errorMessage = err.error?.ErrorMessage;
                      if (errorMessage) {
                        const errorMessageData = JSON.parse(errorMessage);
                        error = errorMessageData.ErrorValue;
                      }
                      let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                      this.loaderService.stopLoading();
                      this.loadingSubscriptions = false;
                      this._toastService.error(errmsg, {
                        timeOut: 10000
                      });
                      return of(null);
                    })
                  ).subscribe((res: any) => {
                    let data = res.Data;
                    if (res.Status == "Success") {
                      this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
                      this.getReconciliationReport();
                    }
                  })
                }
              }
            },
            (reason) => {
              modalRef.close();
            }
          );
        }
      })
  }

  fixOfferChange(product: any) {
    let newBillingCycle: string = null;
    let oldBillingCycle: string = null;
    newBillingCycle = filter(this.billingCycles, function (a) { return a.ID === product.ProviderBillingCycleId })[0].Name;
    oldBillingCycle = filter(this.billingCycles, function (a) { return a.ID === product.CMPRecon[0].ProductBillingCycleId })[0].Name;
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_CHANGE_PRODUCT_OFFER_CONFIRMATION_TEXT', { targetOffer: product.CSPOfferName });
    const btnConfirm = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
    this._notifierService.confirm({title: confirmationMessage, confirmButtonText: btnConfirm, 
      customClass:{
        confirmButton:'bg-success'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.mapNewOfferProductsAgainstPlan(product, oldBillingCycle, product.CMPRecon[0].ProductBillingCycleId, newBillingCycle)
      }
      else {
        this.reloadEvent.emit(true);
      }
    })
  }

  mapNewOfferProductsAgainstPlan(offer: any, oldBillingCycle: string, oldBillingCycleId: number, newBillingCycle: string) {
    let error = "AN_ERROR_OCCURED";
    this.subscriptionsList = [];
    this.loaderService.startLoading(); 
    this.loadingSubscriptions = true;
    let oldQuantity = offer.CMPRecon[0].LocalStoreQuantity;
    let newValidity = offer.CSPValidity;
    let oldValidity = offer.CMPRecon[0].Validity;
    let newValidityType = offer.CSPValidityType;
    let oldValidityType = offer.CMPRecon[0].ValidityType;
    var data = {
      ProductId: offer.CMPRecon[0].InternalProductId,
      TargetOfferId: offer.CustomCSPOfferId,
      TargetBillingCycle: newBillingCycle,
      NewValidity: offer.CSPValidity,
      NewValidityType: offer.CSPValidityType,
      NewQuantity: offer.CSPQuantity,
    }
    this._reconciliationReportService.getProductsForOfferChange(offer.CMPRecon[0].InternalProductId, data)
    .pipe(
      catchError((err) => {
        const errorMessage = err.error?.ErrorMessage;
        if (errorMessage) {
          const errorMessageData = JSON.parse(errorMessage);
          error = errorMessageData.ErrorValue;
        }
        let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
        this._toastService.error(errmsg, {
          timeOut: 10000
        });
        return of(null);
      }))
    .subscribe((response: any) => {
      if (response.Status === "Success") {
        this.subscriptionsList = response.Data;
        each(this.subscriptionsList, function (subscription) {
          subscription.MappingC3PlanProducts = JSON.parse(subscription.MappingC3PlanProducts);
          subscription.MappingC3PlanProducts = filter(subscription.MappingC3PlanProducts, { 'CompositeProductId': null, 'LinkedProductId': null })
        });
        this.loadingSubscriptions = false;
        this.loaderService.stopLoading()
        let customerEntities = filter(this.subscriptionsList, function (subscription) {
          return subscription.EntityName.toLowerCase() === CloudHubConstants.ENTITY_CUSTOMER.toLowerCase();
        });
        const config: NgbModalOptions = {
          modalDialogClass: 'modal-dialog modal-dialog-top modal-lg'
        };
        const modalRef = this._modalService.open(OfferChangeMappedProductPopupComponent, config)
        modalRef.componentInstance.subscriptionsList = customerEntities;
        modalRef.result.then(
          (offer) => {
            each(offer, (item) => {
              if (item.MappedC3PlanProduct != undefined || item.MappedC3PlanProduct != null) {
                each(this.subscriptionsList, function (subscription) {
                  if (item.ProviderSubscriptionId === subscription.ProviderSubscriptionId)
                    subscription.MappedC3PlanProduct = item.MappedC3PlanProduct;
                });
              }
            });
            offer = this.subscriptionsList;
            this.mappedProducts = offer;
            let requestModel: any = { Model: null };

            each(this.mappedProducts, function (item) {
              item.OldBillingCycleId = oldBillingCycleId;
              item.OldBillingCycleName = oldBillingCycle;
              item.BillingCycleName = newBillingCycle;
              item.OldQuantity = oldQuantity;
              item.OldValidity = oldValidity;
              item.OldValidityType = oldValidityType;
            });
            requestModel.Model = JSON.stringify(this.mappedProducts);
            this._reconciliationReportService.ValidateMappedOfferProducts(requestModel).pipe(
              switchMap((res: any) => {
                const mappedSubscriptions = res.Data;
                return this._reconciliationReportService.syncOffer(mappedSubscriptions.MappedProducts)
                .pipe(
                  catchError((err) => {
                    const errorMessage = err.error?.ErrorMessage;
                    if (errorMessage) {
                      const errorMessageData = JSON.parse(errorMessage);
                      error = errorMessageData.ErrorValue;
                    }
                    let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                    this._toastService.error(errmsg, {
                      timeOut: 10000
                    });
                    this.loaderService.stopLoading();
                    this.loadingSubscriptions = false;
                    return of(null);
                  })
                )
              }),
              catchError((err) => {
                const errorMessage = err.error?.ErrorMessage;
                if (errorMessage) {
                  const errorMessageData = JSON.parse(errorMessage);
                  error = errorMessageData.ErrorValue;
                }
                let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                this.loaderService.stopLoading();
                this.loadingSubscriptions = false;
                this._toastService.error(errmsg, {
                  timeOut: 10000
                });
                return of(null);
              })
            ).subscribe((res: any) => {
              let data = res.Data;
              if (res.Status == "Success") {
                this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
                this.getReconciliationReport();
              }
            })
          },
          (reason) => {
            modalRef.close();
          }
        );
      }
    })
  }

  fixPromotion(offer: any) {
    const btnConfirm = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
    let isApplyForCustomer = false;
    let isConfirmForCustomer = true;
    var requestBody = {
      ServiceProviderCustomerId: offer.ServiceProviderCustomerId,
      ProviderSubscriptionId: offer.SubscriptionId,
      ProviderProductQuantity: offer.CSPQuantity,
      ProductQuantity: offer.CMPRecon[0].LocalStoreQuantity,
      InternalProductId: offer.CMPRecon[0].InternalProductId,
      ProviderSubscriptionStatus: offer.IsActiveinCSP ? "Active" : "Suspended",
      ProductStatus: offer.CMPRecon[0].LocalSubscriptionStatus,
      CustomerC3Id: offer.CustomerC3Id,
      CustomerName: offer.CustomerName,
      CustomerId: offer.CustomerId,
      LocalStoreSubscriptionId: offer.LocalStoreSubscriptionId,
      CreatedByInProvider: offer.CreatedByInProvider,
      CreatedDateInProvider: offer.CreatedDateInProvider,
      CSPAutoRenewEnabled: offer.CSPIsAutoRenew,
      AutoRenewEnabled: offer.CMPRecon[0].IsAutoRenew,
      C3PromotionID: offer.CMPRecon[0].C3PromotionID,
      CSPPromotionID: offer.CSPPromotionID,
      PlanProductId: offer.CMPRecon[0].PlanProductId,
      IsApplyForCustomer: isApplyForCustomer
    };
    if (this.entityName.toLowerCase() == this.cloudHubConstants.ENTITY_RESELLER.toLowerCase() && offer.CMPRecon[0].IsPromotionAvailableForCustomer == false) {
      isConfirmForCustomer = false;
    }
    else {
      const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_MANUAL_SYNC_CONFIRM_ACTION_POPUP');
      this._notifierService.confirm({title: confirmationMessage, confirmButtonText: btnConfirm, 
        customClass:{
          confirmButton:'bg-success'
        },
      }).then((result) => {
        if (result.isConfirmed) {
          if (offer.CSPPromotionID == null) {
            this.confirmPromotionFix(offer, requestBody);
          }
          else if (isConfirmForCustomer) {
            const customerConfirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_MANUAL_SYNC_CONFIRM_ACTION_POPUP_CUSTOMER_PROMOTION');
            this._notifierService.confirm({ title: customerConfirmationMessage, confirmButtonText: btnConfirm, 
              customClass:{
                confirmButton:'bg-success'
              },
            }).then((result) => {
              if (result.isConfirmed) {
                requestBody.IsApplyForCustomer = true;
                this.confirmPromotionFix(offer, requestBody);
              }
              else {
                this.confirmPromotionFix(offer, requestBody);
              }
            })
          }
          else {
            this.confirmPromotionFix(offer, requestBody);
          }
        }
        else {
          this.reloadEvent.emit(true);
        }
      })
    }
  }

  confirmPromotionFix(offer: any, requestBody: any) {
    let error = "AN_ERROR_OCCURED";
    this._reconciliationReportService.confirmPromotionFix(offer, requestBody)
    .pipe(
      catchError((err) => {
        const errorMessage = err.error?.ErrorMessage;
        if (errorMessage) {
          const errorMessageData = JSON.parse(errorMessage);
          error = errorMessageData.ErrorValue;
        }
        let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
        this._toastService.error(errmsg, {
          timeOut: 10000
        });
        return of(null);
      }))
    .subscribe((res: any) => {
      if (res.Status == "Success") {
        this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
        this.getReconciliationReport();
      }
    })
  }

  fixchangeScope(product: any) {
    let newScope: any = null;
    newScope = product.CSPScope;
    const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_CHANGE_PRODUCT_SCOPE_CONFIRMATION_TEXT', { targetScope: newScope });
    const btnConfirm = this._translateService.instant('TRANSLATE.POPUP_BUTTON_TEXT_CONFIRM');
    this._notifierService.confirm({ title: confirmationMessage, confirmButtonText: btnConfirm, 
      customClass:{
        confirmButton:'bg-success'
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.mapScopeProductsAgainstPlan(product, newScope);
      }
      else {
        this.reloadEvent.emit(true);
      }
    })
  }

  mapScopeProductsAgainstPlan(offerData: any, newScope: any) {
    let error = "AN_ERROR_OCCURED";
    this.subscriptionsList = [];
    this.loadingSubscriptions = true;
    this.loaderService.startLoading(); 
    let marketCode = offerData.CSPCountryCode;
    this._reconciliationReportService.getCustomerPlansByCategory(this.customerC3Id, 'ReservedInstances', offerData.CSPCountryCode)
      .pipe(
        switchMap((res: any) => {
          this.customerPlans = res.Data;
          var data = {
            ProductId: offerData.CMPRecon[0].InternalProductId,
            TargetOfferId: offerData.CustomCSPOfferId,
            TargetBillingCycle: offerData.ProviderBillingCycleName,
            TargetScope: offerData.CSPScope,
            CurrentScope: offerData.CMPRecon[0].Scope
          }
          return this._reconciliationReportService.getProductsForScopeChange(offerData.CMPRecon[0].InternalProductId, data)
          .pipe(
            catchError((err) => {
              const errorMessage = err.error?.ErrorMessage;
              if (errorMessage) {
                const errorMessageData = JSON.parse(errorMessage);
                error = errorMessageData.ErrorValue;
              }
              let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
              this._toastService.error(errmsg, {
                timeOut: 10000
              });
              this.loaderService.stopLoading();
              this.loadingSubscriptions = false;
              return of(null);
            })
          );
        }),
        catchError((err) => {
          const errorMessage = err.error?.ErrorMessage;
          if (errorMessage) {
            const errorMessageData = JSON.parse(errorMessage);
            error = errorMessageData.ErrorValue;
          }
          let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
          this.loaderService.stopLoading();
          this.loadingSubscriptions = false;
          this._toastService.error(errmsg, {
            timeOut: 10000
          });
          return of(null);
        })
      ).subscribe((result: any) => {
        if (result.Status === "Success") {
          this.subscriptionsList = result.Data;
          each(this.subscriptionsList, function (subscription) {
            subscription.MappingC3PlanProducts = JSON.parse(subscription.MappingC3PlanProducts);
            subscription.MappingC3PlanProducts = filter(subscription.MappingC3PlanProducts, { 'CompositeProductId': null, 'LinkedProductId': null })
          });
          this.loadingSubscriptions = false;
          this.loaderService.stopLoading();

          let customerEntities = filter(this.subscriptionsList, function (subscription) {
            return subscription.EntityName.toLowerCase() === CloudHubConstants.ENTITY_CUSTOMER.toLowerCase();
          });

          const config: NgbModalOptions = {
            modalDialogClass: 'modal-dialog modal-dialog-top modal-lg'
          };

          const modalRef = this._modalService.open(ScopeChangeMappedProductPopupComponent, config)
          modalRef.componentInstance.subscriptionsList = customerEntities;
          modalRef.componentInstance.customerPlans = this.customerPlans;
          modalRef.result.then(
            (offer) => {
              if (offer.CategoryName.toLowerCase() === this.cloudHubConstants.RESERVED_INSTANCES.toLowerCase()) {
                var reqBody: any = {
                  OfferName: offer.SubscriptionQualifiedOfferName,
                  OfferSkuId: offer.TargetOfferId,
                  OfferId: offer.TargetOfferId,
                  SkuId: null,
                  Segment: offer.Segment,
                  Scope: offer.Scope,
                  CountryCode: marketCode,
                  ProviderSubscriptionId: offer.ProviderSubscriptionId,
                  Quantity: offer.Quantity,
                  OrderId: offer.OrderId,
                  ServiceProviderCustomerId: offer.ProviderCustomerId,
                  CustomerId: this.customerId,
                  CustomerC3Id: this.customerC3Id,
                  PlanId: offer.SelectedPlanId,
                  PlanProductId: offer.MappedC3PlanProduct != null && offer.MappedC3PlanProduct.PlanProductId != null ? offer.MappedC3PlanProduct.PlanProductId : null,
                  SalePrice: offer.riSalePrice,
                  BillingCycle: offer.BillingCycleName,
                  BillingCycleId: offer.BillingCycleId,
                  Validity: offer.OldValidity,
                  ValidityType: offer.OldValidityType,
                  ReservationOrderID: offer.ReservationOrderID,
                  CSPBillingScope: offer.BillingScope,
                  CurrentProductId: offer.ProductID,
                  ActionName: 'FIX_SCOPE_MISMATCH',
                  Location: offerData.CSPLocation
                }
                this._reconciliationReportService.createReservedInstancesSubscription(reqBody)
                .pipe(
                  catchError((err) => {
                    const errorMessage = err.error?.ErrorMessage;
                    if (errorMessage) {
                      const errorMessageData = JSON.parse(errorMessage);
                      error = errorMessageData.ErrorValue;
                    }
                    let errmsg: string = this._translateService.instant('TRANSLATE.' + error);
                    this._toastService.error(errmsg, {
                      timeOut: 10000
                    });
                    return of(null);
                  })
                )
                .subscribe((res) => {
                  if (res.Status == "Success") {
                    this._toastService.success(this._translateService.instant('TRANSLATE.MANUAL_SYNC_SUCCESS_NOTIFICATION_MESSAGE'));
                    this.getReconciliationReport();
                  }
                })
              }
            },
            (reason) => {
              modalRef.close();
            }
          )
        }
      })
  }

}
