import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { combineLatest, Subject, takeUntil} from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { BillingCycles, BillingTypes, Categories, CommonProviders, CurrencyConversionOptions, CurrencyData, ProviderCategoriesInFilter, ProviderOptions, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { ProductService } from 'src/app/services/product.service';
import { ToastService } from 'src/app/services/toast.service';
import { of } from 'rxjs';
import * as _ from 'lodash';
// import { Utility } from 'src/app/shared/utilities/utility';
import { NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { FileService } from 'src/app/services/file.service';
import { TrailPeriodDaysDetails } from '../../settings/models/subscription-expiry-check.model';
import { SubscriptionExpiryCheckService } from '../../settings/services/subscription-expiry-check.service';
import { PlansListingService } from '../../plans/services/plans-listing.service';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { TranslateModule } from '@ngx-translate/core';
import { ManagePlansService } from '../../customers/services/manage-plans.service';
import { QuoteService } from '../quotes.service';
import { CustomNotificationService } from 'src/app/modules/administration/services/custom-notification-service.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { WebhookNotificationService } from 'src/app/modules/administration/services/webhook-notification-service.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PoNumberPopupComponent } from 'src/app/modules/customers/po-number-popup/po-number-popup.component';
import { UserContextService } from 'src/app/services/user-context.service';
import { ShopService } from 'src/app/modules/customers/services/shop.service';
import { NceBaseOfferPcCallAlertPopupComponent } from 'src/app/modules/standalones/nce-base-offer-pc-call-alert-popup/nce-base-offer-pc-call-alert-popup.component';
import { LoaderService } from 'src/app/services/loader.service';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-quote-line-item-pop-up',
  templateUrl: './quote-line-item-pop-up.component.html',
  styleUrl: './quote-line-item-pop-up.component.scss'
  })
export class QuoteLineItemPopUpComponent extends C3BaseComponent implements OnInit, OnDestroy{
  datatableConfig: ADTSettings | any;
  providers: CommonProviders[] = [];
  categories: Categories[] | any = [];
  billingTypes: BillingTypes[] = [];
  supportedCurrenciesData: CurrencyData[] = [];
  currencyOptions: CurrencyConversionOptions[] = [];
  planBillingCycles: BillingCycles[] = [];
  providerCategories: ProviderCategoriesInFilter[] = [];
  termDuration: TermDuration[] = [];
  consumptionTypes: any[] = [];
  supportedMarketData: SupportedMarketData[] = [];
  lazyLoadedProducts: any[] = [];
  productItemDetails: ProductItemDetails = new ProductItemDetails();
  filteredCategories: any[] = [];
  providerSelection: any[] = [];
  categorySelection: any[] = [];
  selectedCategory: any[] = [];
  filteredProviderCategories: any[] = [];
  providerCategorySelection: any[] = [];
  selectedProviderCategories: any[] = [];
  selectedValidities: any[] = [];
  selectedValidityTypes: any[] = [];
  termDurationSelection: any[] = [];
  selectedTrialDuration: any[] = [];
  trialDurationSelection: any[] = [];
  selectedBillingTypes: any[] = [];
  billingTypeSelection: any[] = [];
  selectedBillingCycles: any[] = [];
  billingCycleSelection: any[] = [];
  selectedConsumptionTypesToFilter: any[] = [];
  consumptionTypeSelection: any[] = [];
  selectedMarketTypesToFilter: any[] = [];
  marketCodeSelection: any[] = [];
  selectedIsTrailOffer: boolean = false;
  selectedProviderForTrail: any[] = [];
  selectedProvider: any[] = [];
  productName: string = null;
  productId: string = null;
  showPromotionOnly: boolean = false;
  supportedMarkets: any[] = [];
  productTrialDurations: TrailPeriodDaysDetails[] = [];
  bundleChildOffers: any[] = [];
  slabProducts: any[] = [];
  pricingSlabs: any[] = [];
  selectedMacro: any = null; 
  percentValue: number = 0;
  supportedMarketCodes : any;
  isFirstload : boolean = false;
  SelectedProducts: any[] = [];
  reloadSelectedProducts = false;
  IsInfiniteScrollSecondCall = false;
  IsLoadingSeletedProducts = true;
  ScrollBusy = true;
  SelectedProductsFromDB: any[] = [];
  SelectedProductsInLocalStorage;
  DBSelectedOffersSearchCount = 0;
  LocalSelectedOffersSearchCount = 0;
  SelectedProductsPageCount = 100;
  SelectedConsumptionType = CloudHubConstants.CONSUMPTION_QUANTITY_BASED;
  page:number = 0;
  SearchSelectedProductsKeyword = '';
  removeProducts: any[] = [];
  selectedPlanIdsCSV: string = null;
  selectedPlanID: any[] = []
  quoteCustomerC3Id: any = null;
  plans: any = null;
  @Input() quoteId: any = null;
  @Input() currencyCode: any = null;
  localStorageQuoteKeyNameParsed: any = null;
  selectedTableDataCsv: any = [];
  selectedProductsCsv: any = [];
  locallyRemovedPlanProduct: any[] = [];
  @Input() quoteLineItemsTableData: any[] = [];
  selectedQuoteLineItemList: any[] = [];
  trackProducteForCurrentSession: any[] = [];
  productListData: any[] = [];
  localStorageQuoteKeyArray: any[] = [];
  selectedPlanNameDataSet: any[] = [];
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('productNameInTable') productNameInTable: TemplateRef<any>;
  @ViewChild('salePrice') salePrice: TemplateRef<any>;
  @ViewChild('productCheckbox') checkbox: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isEditMode: any;
  @Input() C3UserId: any = null; 
  @Input() CustomerRefId: any = null; 
  @Input() isNewCustomer: boolean = false;
  @Input() selectedPlanIds: any[] = [];
  @Input() planListData: any[] = []; 
  @Input() newCustomerCountryCode: string = null;
   cartResponse : any;
   planOffersHaveOtherProviderThanPartner: boolean = false;
  constructor(
    public _cdref: ChangeDetectorRef,
    public _notifierService: NotifierService,
    public _translateService: TranslateService,
    public pageInfo: PageInfoService,
    public _planService: PlansListingService,
    public _commonService: CommonService,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _productService: ProductService,
    public _subscriptionExpiryCheckService: SubscriptionExpiryCheckService,
    public _modalService: NgbModal,
    public activeModal: NgbActiveModal,
    public _fileService: FileService,
    public _managePlanService: ManagePlansService,
    public _quotesSerive: QuoteService,
    public _customNotificationService: CustomNotificationService,
    private _appService: AppSettingsService, 
    private _webhookNotificationService: WebhookNotificationService,
    private _unsavedChangesService: UnsavedChangesService,
    public _shopService: ShopService,
    public _loaderService: LoaderService,
    public c3routerService: C3RouterService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
  }

  ngOnInit(): void {

    this._cdref.detectChanges();
     if (this.isNewCustomer) {
    this.getPlansForNewCustomer();
    }
    
    const subscription = combineLatest([
      this._commonService.getSupportedCurrencies(),
      this._commonService.getCurrencyConversionOptions(),
      this._planService.getPlanProvidersForProductCatelog(),
      this._planService.getPlanBillingCycles(),
      this._planService.getProviderCategoriesInFilter(),
      this._webhookNotificationService.getCategories(),
      this._commonService.getTermDuration(),
      this._commonService.getConsumptionTypes(),
      this._commonService.getBillingTypes(),
      this._subscriptionExpiryCheckService.getTrailPeriodDays()
    ])
    .pipe(takeUntil(this.destroy$)).subscribe(([supportedCurrencies, currencyOptions, providers, planBillingCycles,
        providerCategories, categories, termDuration, consumptionTypes, billingTypes, productTrialDurations
      ]) => {
        this.consumptionTypes = consumptionTypes;
        this.currencyOptions = currencyOptions;
        this.providers = <CommonProviders[]>providers;
        this.planBillingCycles = planBillingCycles;
        this.providerCategories = providerCategories;
        this.categories = categories;
        if(this._commonService.entityName.toLowerCase() == this.cloudHubConstants.ENTITY_PARTNER){
          this.categories = this.categories.filter(category => category.Name.toLowerCase() != this.cloudHubConstants.CATEGORY_DISTRIBUTOR_OFFERS)
        }
        this.termDuration = termDuration;
        this.billingTypes = _.filter(billingTypes, (each) => {
            return each.Name !== 'Unit' && each.Name !== 'Percentage' && each.Name !== 'MeteredBilling';
        });
        this.productTrialDurations = productTrialDurations;
        this.supportedCurrenciesData = <CurrencyData[]>supportedCurrencies.Data;
        this.consumptionTypes = consumptionTypes;
        this.currencyOptions = currencyOptions;
        this.providers = <CommonProviders[]>providers;
        this.planBillingCycles = planBillingCycles;
        this.providerCategories = providerCategories;
        this.termDuration = termDuration;
        this.handleTableConfig();
      })
      this._subscriptionArray.push(subscription);
  }



setCustomerC3Id(customerC3Id: any){
  this.quoteCustomerC3Id = customerC3Id;
  this._quotesSerive.dictOfQuoteLineItems['QuoteLineItems_CustomerC3Id_' + (this.quoteCustomerC3Id || 'new_customer')]= JSON.stringify(this.selectedQuoteLineItemList); 
  
  if(customerC3Id){
    this.getPlans(customerC3Id);
  } 
}
getPlansForNewCustomer(){
  if(!this.selectedPlanIds || this.selectedPlanIds.length === 0) return;

  const planIds = this.selectedPlanIds.map((x: any) => x?.ID || x?.id || x?.value || x);

  this.plans = (this.planListData || []).filter((x: any) => 
    planIds.includes(x.ID) 
  // && (this.currencyCode ? x.CurrencyCode === this.currencyCode : true)
  );

  this.selectedPlanNameDataSet = [];
  this.plans.forEach((v: any) => {
    this.selectedPlanNameDataSet.push({
      value: v.ID,
      label: null,
      data: { value: v.Name, text: v.ID }
    });
  });

  this.selectedPlanIdsCSV = planIds.join(',');
  this._cdref.detectChanges();
}

updateQuoteLineItemSelectionList(item: any) {
  if (item.IsSelected === true) {
    item.IsSelected = false;
    this.addProductToSelection(item);
    return;
  }

  item.IsSelected = true;

  // New condition for Addon and NCE check
  const showNCEPrerequisiteBaseOffer = this._permissionService.hasPermission('SHOW_NCE_PREREQUISITE_BASE_OFFER') === 'Allowed';
  if (item?.IsAddon === true && item.CategoryName.toLowerCase() === this.cloudHubConstants.CATEGORY_ONLINE_SERVICES_NCE && showNCEPrerequisiteBaseOffer) {

    // Check if already the selected add-on exists in quote line item table
    const alreadySelected = this.quoteLineItemsTableData.some(quoteItem =>
      quoteItem.PlanProductId === item.PlanProductId
    );

    if (alreadySelected) {
      this.addProductToSelection(item);
      return;
    }

    // Calling the progress popup once we making PC call
    const loadingModalRef = this._modalService.open(NceBaseOfferPcCallAlertPopupComponent, {centered: true, backdrop: 'static', keyboard: false});

    const reqBody: any = {
      TenantId: this.CustomerRefId,
      PlanProductId: item.PlanProductId,
      UserC3Id: this.C3UserId,
      ProductVariantId: item.ProductVariantId,
      CustomerC3Id: this.quoteCustomerC3Id,
      SupportedMarketCode: item.MarketCode
    };

    const getBaseProductForAddonSubscription = this._shopService.CheckNCEBaseOfferAndFetchAddonAvailability(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      // Close the modal once the API call is complete
      loadingModalRef.close();
      let baseOffers = this.processBaseOffers(response);

      // Check if base offer is already selected in the main popup (before opening the addon popup)
      const baseOfferSelected = this.selectedQuoteLineItemList.some(quoteItem =>
        baseOffers.some(offer => offer.PlanProductId === quoteItem.PlanProductId)
      );

      if (baseOfferSelected) {
        // If base offer is selected, prevent the addon popup from opening
        this.addProductToSelection(item);
        return;
      }

      // Check if already the base offers in selection list
      const parentSelected = this.quoteLineItemsTableData.some(quoteItem =>
        baseOffers.some(offer => offer.PlanProductId === quoteItem.PlanProductId)
      );

      if (parentSelected) {
        this.addProductToSelection(item);
        return;
      }

      const linkedProduct = item?.LinkedProduct;
      const isLinkedBaseOfferExists = linkedProduct && baseOffers.some((offer) => offer.ProductVariantId === linkedProduct.ProductVariantId && offer.ProviderReferenceId === linkedProduct.ProviderReferenceId);

      if (!isLinkedBaseOfferExists) {
        if (baseOffers.length > 0 && !baseOffers[0].IsBaseOfferPurchased) {
          this.handleBaseOfferModal(item, baseOffers);
        } else if (baseOffers.length === 0) {
          this.handleBaseOfferModal(item, baseOffers);
        }
        else {
          this.addProductToSelection(item);
        }
      }
    })
    this._subscriptionArray.push(getBaseProductForAddonSubscription);
  }
  else {
    // If item is not NCE Addon, just proceed normally
    this.addProductToSelection(item);
  }
}

addProductToSelection(item: any) {
  let existingProduct = _.find(this.selectedQuoteLineItemList, function (a) {
      return a.PlanProductId == item.PlanProductId
  })

  if (item.IsSelected) {
      item.isNewlyAdded = true;
      this.selectedQuoteLineItemList.push(item);
      this.trackProducteForCurrentSession.push(item);
      if (!this.selectedTableDataCsv.includes(item.PlanProductId)) {
        this.selectedTableDataCsv.push(item.PlanProductId);
      }
      this.locallyRemovedPlanProduct  = this.locallyRemovedPlanProduct.filter(
        (csvItem) => csvItem !== item.PlanProductId
      );
      let index = this.removeProducts.findIndex((product:any)=> product.PlanProductId==item.PlanProductId)
      if(index!=-1){
        this.removeProducts.splice(index,1)
      }
  }
  else {
    this.removeFromList(item);
    this.selectedTableDataCsv = this.selectedTableDataCsv.filter(
      (csvItem) => csvItem !== item.PlanProductId
    );
  }
  this._quotesSerive.dictOfQuoteLineItems['QuoteLineItems_CustomerC3Id_' + this.quoteCustomerC3Id]= JSON.stringify(this.selectedQuoteLineItemList); 
}

removeFromList(item) { 
  var index = 0;
      this.selectedQuoteLineItemList.forEach((product, i) => {
          if (product.PlanProductId == item.PlanProductId) {
              index = i;
          }
      });
  this.selectedQuoteLineItemList.splice(index, 1);
  var indexOftheChange = this.trackProducteForCurrentSession.indexOf(item);
  this.trackProducteForCurrentSession.splice(indexOftheChange, 1);
  this.updateSelectedDetailsStatus(false, item.PlanProductId);
  this.removeProducts.push(item);
  this.removeProducts = _.uniq(this.removeProducts);
}

updateSelectedDetailsStatus(status, PlanProductId) { 
  _.each(this.productListData, function (a) {
      if (a.PlanProductId === PlanProductId) {
          a.IsSelected = status;
      }
  });
  this._quotesSerive.dictOfQuoteLineItems['QuoteLineItems_CustomerC3Id_' + this.quoteCustomerC3Id]= JSON.stringify(this.selectedQuoteLineItemList); 
}

  onSubmit() {
    var uniqueselectedQuoteLineItemList = [];
    if (this.selectedQuoteLineItemList.length > 0) {
      uniqueselectedQuoteLineItemList = this.selectedQuoteLineItemList.reduce((uniqueList, currentItem) => {
        if (!uniqueList.some((item) => item.PlanProductId === currentItem.PlanProductId)) {
          uniqueList.push(currentItem);
        }
        return uniqueList;
      }, []);

      if (this.locallyRemovedPlanProduct.length > 0) {
        this.locallyRemovedPlanProduct.forEach((product) => {
          uniqueselectedQuoteLineItemList.forEach((uniqueProduct) => {
            if (uniqueProduct.PlanProductId == product && uniqueProduct.isNewlyAdded == undefined) {
              var index = uniqueselectedQuoteLineItemList.indexOf(uniqueProduct);
              uniqueselectedQuoteLineItemList.splice(index, 1);
            }
          })
        })
      }
      uniqueselectedQuoteLineItemList.forEach((product) => {
        if (product.Quantity == undefined && product.Quantity == null) {
          product.Quantity = 1;
          if (product.LinkedProduct) {
            product.LinkedProduct.Quantity = 1;
          }
        }
      })

      if (this.selectedTableDataCsv.length > 50) {
        this._toastService.error(this._translateService.instant('TRANSLATE.QUOTE_LINE_ITEM_MAX_PRODUCT_LIMIT'));
        return;
      }
    }
    var quoteProducts = {
      UniqueselectedQuoteLineItemList: uniqueselectedQuoteLineItemList,
      RemovedProducts: this.removeProducts
    }
    this.activeModal.close(quoteProducts);
  }

getPlans(customerC3Id: any){
  const subscription = this._managePlanService.getList({customerC3Id}).pipe(takeUntil(this.destroy$)).subscribe((response:any) =>{
    this.plans = response.Data;
    this.plans = this.plans.filter(x => 
      x.IsActive == true && 
      (this.currencyCode ? x.CurrencyCode == this.currencyCode : true) 
    );
    this.setPlanDataDataSet();
  })
  this._subscriptionArray.push(subscription);
}

 setPlanDataDataSet() {
  this.plans.forEach(v=>{
    if(v.IsActive == 1){
      this.selectedPlanNameDataSet.push({
        value: v.ID,
        label: null,
        data: {value:v.Name, text:v.ID}
      })
    }
  });
  this._cdref.detectChanges();
}

handleTableConfig() {
  let isFirstLoad = true;
   this.IsLoadingSeletedProducts = true;
   setTimeout(() => {
       const self = this;
     let _subscription;
     this.datatableConfig = {
       serverSide: true,
       pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
       ajax: (dataTablesParameters: any, callback: any) => {
         const { Name,StartInd, SortColumn, SortOrder, PageSize } =
           mapParamsWithApi(dataTablesParameters);
           _subscription && _subscription?.unsubscribe();
           let name:any = Name || '';
           if(!Name && !isFirstLoad){
            name = this.c3routerService.getC3Input()
           }
           isFirstLoad = false;
           var reqBody = {
            QuoteId: this.quoteId,
            PlanIds: this.selectedPlanIdsCSV,
            CurrencyCode: this.currencyCode,
            CustomerC3Id: this.quoteCustomerC3Id,
            SearchKeyword: Name || name,
            ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
            CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
            BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
            ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
            ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
            Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : _.map(this.termDurationSelection, 'Validity').join(),
            ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : _.map(this.termDurationSelection, 'ValidityType').join(),
            BillingTypeIds: this.selectedBillingTypes ? this.selectedBillingTypes.join() : null,
            PageCount: StartInd == 1 ? PageSize : PageSize - 1,
            PageIndex: StartInd == 1 ? 0 : ((StartInd - 1) * PageSize) + 1,
            NewCustomerCountryCode: this.newCustomerCountryCode?.trim() || null
        }
         const subscription = this._quotesSerive.getPlanProductsForquotes(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.productListData = response.Data;
            var localStorageKeyPrepend = "QuoteLineItems_CustomerC3Id";
            var localStorageQuoteKeyName = localStorageKeyPrepend.concat('_', this.quoteCustomerC3Id);
            let currentSessionRemovedProducts = _.map(this.removeProducts,  "PlanProductId");
            if (this._quotesSerive.dictOfQuoteLineItems && this._quotesSerive.dictOfQuoteLineItems[localStorageQuoteKeyName] !== undefined 
                &&  this._quotesSerive.dictOfQuoteLineItems[localStorageQuoteKeyName] !== null 
                &&  this._quotesSerive.dictOfQuoteLineItems[localStorageQuoteKeyName] !== '') {
                this.localStorageQuoteKeyNameParsed = JSON.parse( this._quotesSerive.dictOfQuoteLineItems[localStorageQuoteKeyName]);
                const newData = _.map(this.quoteLineItemsTableData, "PlanProductId");

                newData.forEach((id) => {
                  if (!this.selectedTableDataCsv.includes(id)) {
                    this.selectedTableDataCsv.push(id);
                  }
                });
                this.removeProducts.forEach((product:any)=>{
                  let index = this.selectedTableDataCsv.indexOf(product.PlanProductId);
                  if(index!=-1){
                    this.selectedTableDataCsv.splice(index,1)
                  }
                })
            
                _.forEach(this.productListData, (product: any) => {
                  if (this.selectedTableDataCsv.includes(product.PlanProductId)) {
                   
                    if (product.IsSelected) {
                        this.localStorageQuoteKeyNameParsed.push(product);
                    }
                  }
                })
                this.selectedProductsCsv = _.map(this.localStorageQuoteKeyNameParsed, "PlanProductId");
                _.forEach(this.productListData, (product: any) => {
                  const { PlanProductId } = product;
                  const isInSelectedTableDataCsv = this.selectedTableDataCsv.includes(PlanProductId);
                  const isInLocallyRemovedPlanProduct = this.locallyRemovedPlanProduct.includes(PlanProductId);
                  const isInCurrentSessionRemovedProducts = currentSessionRemovedProducts.includes(PlanProductId);
              
                  if (isInSelectedTableDataCsv) {
                      product.IsSelected = true;
                  } else if (isInLocallyRemovedPlanProduct || isInCurrentSessionRemovedProducts) {
                      product.IsSelected = false;
                  }   
                  if (!isInSelectedTableDataCsv ) {
                    this.locallyRemovedPlanProduct.push(product.PlanProductId);

                  }
                  if (isInCurrentSessionRemovedProducts) {
                      product.IsSelected = false;
                  }
                  if (!isInSelectedTableDataCsv) {
                    product.IsSelected = false;
                }
              });
              
              if (this.localStorageQuoteKeyNameParsed != null && this.localStorageQuoteKeyNameParsed) {
                const existingProductIds = new Set(this.selectedQuoteLineItemList.map(item => item.PlanProductId));
                const productsToAdd = [];
                this.localStorageQuoteKeyNameParsed.forEach((selectedProducts) => {
                  if (!existingProductIds.has(selectedProducts.PlanProductId)) {
                    productsToAdd.push(selectedProducts);
                  }
                });
                this.selectedQuoteLineItemList.push(...productsToAdd);
              }
            }
            if(this.selectedQuoteLineItemList?.length>0){
              let selectedArr:any[] = this.selectedQuoteLineItemList?.map((item:any)=> item.PlanProductId)
              this.productListData = this.productListData?.map((item:any)=>{
                if(selectedArr.includes(item.PlanProductId) && (this.selectedTableDataCsv.includes(item.PlanProductId) == true) && (this.selectedProductsCsv.includes(item.PlanProductId) == false) && currentSessionRemovedProducts.includes(item.PlanProductId)==false){
                  item['IsSelected']=true;
                }
                return item;
              })
            }
            
           const recordsTotal = this.productListData[0]?.TotalRows;
           this.IsLoadingSeletedProducts = false;
           callback({
             data: this.productListData,
             recordsTotal: recordsTotal || 0,
             recordsFiltered: recordsTotal || 0,
           });
         });
         this._subscriptionArray.push(subscription);
       },
       columns: [
         {
          sortable: false,
           className: 'col-md-1',
           defaultContent: '',
           ngTemplateRef: {
             ref: this.checkbox,
             context: {
               // needed for capturing events inside <ng-template>
               captureEvents: self.onCaptureEvent.bind(self),
             },
           }
         },
         {
           className: 'col-md-2',
           title: this._translateService.instant('TRANSLATE.TAGGED_ENTITY_ELEMENT_PRODUCT_NAME_HEADER'),
           data: 'Name',
           searchable: true,
           orderable: false,
           defaultContent: '',
           ngTemplateRef: {
            ref: this.productNameInTable,
            context: {
              // needed for capturing events inside <ng-template>
              captureEvents: self.onCaptureEvent.bind(self),
            },
          },
         },
         {
           className: 'col-md-3 text-start',
           title: this._translateService.instant('TRANSLATE.TAGGED_ENTITY_ELEMENT_PROPERTIES_HEADER'),
           orderable: false,
           defaultContent: '',
           ngTemplateRef: {
             ref: this.propertiespills,
             context: {
               // needed for capturing events inside <ng-template>
               captureEvents: self.onCaptureEvent.bind(self),
             },
           },
         },
         {
          className: 'col-md-2',
          title: this._translateService.instant('TRANSLATE.QUOTE_PRODUCTS_TABLE_PLANS_HEADER'),
          orderable: false,
          data: 'PlanName'
         },
         {
          className: 'col-md-2 text-end pe-2',
          title: this._translateService.instant('TRANSLATE.QUOTE_PRODUCTS_TABLE_SALE_PRICE_HEADER'),
          orderable: false,
          ngTemplateRef: {
            ref: this.salePrice,
            context: {
              // needed for capturing events inside <ng-template>
              captureEvents: self.onCaptureEvent.bind(self),
            },
          },
          defaultContent: ''
         }
       ],
       order:[]
     };
     this._cdref.detectChanges();
   });

 }
 onCaptureEvent(event: Event) { }
 enableEditField(data: any) { }

 onplanChange(event: any) {
  const value = event?.value;
  if (Array.isArray(value)) {
    this.selectedPlanIdsCSV = value.join(',');
  } else {
    this.selectedPlanIdsCSV = value;
  }
  // store selected ids
  this.selectedPlanIds = Array.isArray(value) ? value : [value];
  this.reloadEvent.emit(true);
}

close() {
  if (this.trackProducteForCurrentSession.length > 0) {
    var localStorageKeyPrepend = "QuoteLineItems_CustomerC3Id";
    var localStorageQuoteKeyName = localStorageKeyPrepend.concat('_', this.quoteCustomerC3Id);
    if(this._quotesSerive.dictOfQuoteLineItems &&  this._quotesSerive.dictOfQuoteLineItems[localStorageQuoteKeyName]!= null && this._quotesSerive.dictOfQuoteLineItems[localStorageQuoteKeyName]!= '' ){
      this.localStorageQuoteKeyArray = JSON.parse(this._quotesSerive.dictOfQuoteLineItems[localStorageQuoteKeyName]);
      this.trackProducteForCurrentSession.forEach((each) => {
        this.localStorageQuoteKeyArray.forEach((localProduct) => {
          if (localProduct.PlanProductId == each.PlanProductId) {
            var index = this.localStorageQuoteKeyArray.indexOf(localProduct);
            this.localStorageQuoteKeyArray.splice(index, 1);
          }
        })
      });
      this._quotesSerive.dictOfQuoteLineItems['QuoteLineItems_CustomerC3Id_' + this.quoteCustomerC3Id]= JSON.stringify(this.selectedQuoteLineItemList);
    }
  }
  this.closeModal();
}

//Apply filters
filterProducts() {
  this.productListData = [];
  this.reloadEvent.emit(true);
  this._cdref.detectChanges();
}

//Sets this.FilteredCategories to categories for a providerID
filterCategories() {
  this.filteredCategories = this.categories.filter(category => {
    return this.providerSelection.findIndex(provider => provider.ID === category.ProviderId) > -1;
  });
  //Reset values in selection
  this.categorySelection = this.categorySelection.filter(category => {
    return this.filteredCategories.findIndex(each => each.ID === category.ID) > -1;
  });

  //Reset trial offer category selection
  var partnerSelected = this.providerSelection.filter(provider => {
    return provider.Name === 'Partner'
  });
  if (partnerSelected.length === 0) {
    this.selectedIsTrailOffer = false;
  }
  this.selectedCategory = _.map(this.categorySelection, 'ID');
  this._cdref.detectChanges();
}

filterProviderCategories() {
  this.filteredProviderCategories = this.providerCategories.filter(category => {
    return this.providerSelection.findIndex(provider => provider.ID === category.ProviderId) > -1;
  });
//console.log(this.filteredProviderCategories)
  //Reset values in selection
  this.providerCategorySelection = this.providerCategorySelection.filter(category => {
    return this.filteredProviderCategories.findIndex(each => each.ID === category.ID) > -1;
  });

  this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
  this._cdref.detectChanges();
}

//Filter products by search keyword
filterProductsByKeyword() {
  this.filterProducts();
}

//Filter products by category
filterProductsByCategory() {
  this.selectedCategory = [];
  this.selectedCategory = _.map(this.categorySelection, 'ID');
  this.filterProducts();
}

//Filter products by provider
filterProductsByProvider() {
  this.selectedProvider = [];
  this.selectedProvider = _.map(this.providerSelection, 'ID');
  this.filterProducts();
}

//Filter products by term duration
filterProductsByTermDuration() {
  this.selectedValidities = [];
  this.selectedValidityTypes = [];
  this.selectedValidities = _.map(this.termDurationSelection, 'Validity');
  this.selectedValidityTypes = _.map(this.termDurationSelection, 'ValidityType');
  this.filterProducts();
}

//Filter products by trial duration
filterProductsByTrialDuration() {
  this.selectedTrialDuration = [];
  this.selectedTrialDuration = _.map(this.trialDurationSelection, 'Days');
  this.filterProducts();
}


//Filter products by billing type
filterProductsByBillingType() {
  this.selectedBillingTypes = [];
  this.selectedBillingTypes = _.map(this.billingTypeSelection, 'Id');
  this.filterProducts();
}

//Filter products by billing cycle
filterProductsByBillingCycle() {
  this.selectedBillingCycles = [];
  this.selectedBillingCycles = _.map(this.billingCycleSelection, 'Id');
  this.filterProducts();
}

//Filter products by provider category
filterProductsByProviderCategory() {
  this.selectedProviderCategories = [];
  this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
  this.filterProducts();
}

filterProductsByConsumptionType() {
  this.selectedConsumptionTypesToFilter = [];
  this.selectedConsumptionTypesToFilter = _.map(this.consumptionTypeSelection, 'ID');
  this.filterProducts();
}

filterProductsBySupportedMarket() {
  this.selectedMarketTypesToFilter = [];
  this.selectedMarketTypesToFilter = _.map(this.marketCodeSelection, 'ID');
  this.filterProducts();
}

filterShowPromotions(isShowPromotions: boolean) {
  this.showPromotionOnly = isShowPromotions;
  this.filterProducts();
}


toggleProviderSelection(provider: any) {
  var idx = this.providerSelection.indexOf(provider);
  // Is currently selected
  if (idx > -1) {
    this.providerSelection.splice(idx, 1);
  }
  else {  // Is newly selected
    this.providerSelection.push(provider);
  }
  this.selectedProviderForTrail = _.filter(this.providerSelection, row => {
    return row.Name == 'Partner';
  });
  this.filterCategories();
  this.filterProviderCategories();
  this.filterProductsByProvider();
};

toggleCategorySelection(category: any) {
  var idx = this.categorySelection.indexOf(category);
  // Is currently selected
  if (idx > -1) {
    this.categorySelection.splice(idx, 1);
  }
  else {  // Is newly selected
    this.categorySelection.push(category);
  }

  this.filterProductsByCategory();
};

toggleTermDurationSelection(term: any) {
  var idx = this.termDurationSelection.indexOf(term);
  // Is currently selected
  if (idx > -1) {
    this.termDurationSelection.splice(idx, 1);
  }
  else {  // Is newly selected
    this.termDurationSelection.push(term);
  }

  this.filterProductsByTermDuration();
};

toggleTrialDurationSelection(days: any) {
  var idx = this.trialDurationSelection.indexOf(days);
  // Is currently selected
  if (idx > -1) {
    this.trialDurationSelection.splice(idx, 1);
  }
  else {  // Is newly selected
    this.trialDurationSelection.push(days);
  }

  this.filterProductsByTrialDuration();
};


toggleBillingTypeSelection(billingType: any) {
  var idx = this.billingTypeSelection.indexOf(billingType);
  // Is currently selected
  if (idx > -1) {
    this.billingTypeSelection.splice(idx, 1);
  }
  else {  // Is newly selected
    this.billingTypeSelection.push(billingType);
  }

  this.filterProductsByBillingType();
};


toggleBillingCycleSelection(billingCycle: any) {
  var idx = this.billingCycleSelection.indexOf(billingCycle);
  // Is currently selected
  if (idx > -1) {
    this.billingCycleSelection.splice(idx, 1);
  }
  else {  // Is newly selected
    this.billingCycleSelection.push(billingCycle);
  }

  this.filterProductsByBillingCycle();
};

toggleProviderCategorySelection(providerCategory: any) {
  var idx = this.providerCategorySelection.indexOf(providerCategory);
  // Is currently selected
  if (idx > -1) {
    this.providerCategorySelection.splice(idx, 1);
  }
  else {  // Is newly selected
    this.providerCategorySelection.push(providerCategory);
  }

  this.filterProductsByProviderCategory();
};

toggleConsumptionTypeSelection(consumptionType: any) {
  var idx = this.consumptionTypeSelection.indexOf(consumptionType);
  // Is currently selected
  if (idx > -1) {
    this.consumptionTypeSelection.splice(idx, 1);
  } else { // Is newly selected
    this.consumptionTypeSelection.push(consumptionType);
  }

  this.filterProductsByConsumptionType();
};


toggleMarketTypeSelection(marketCode: any) {
  var idx = this.marketCodeSelection.indexOf(marketCode);
  if (idx > -1) {
    this.marketCodeSelection.splice(idx, 1);
  } else {
    this.marketCodeSelection.push(marketCode)
  }

  this.filterProductsBySupportedMarket();
}

closeModal() {
    this.trackProducteForCurrentSession.forEach((product) => {
      // Remove from selected list
      this.selectedQuoteLineItemList = this.selectedQuoteLineItemList.filter(
        (item) => item.PlanProductId !== product.PlanProductId,
      );

      // Uncheck the product
      product.IsSelected = false;

      // Remove from CSV
      this.selectedTableDataCsv = this.selectedTableDataCsv.filter(
        (id) => id !== product.PlanProductId,
      );
    });

    // Clear current session tracking
    this.trackProducteForCurrentSession = [];

    // Update cached data
    this._quotesSerive.dictOfQuoteLineItems[
      'QuoteLineItems_CustomerC3Id_' + this.quoteCustomerC3Id
    ] = JSON.stringify(this.selectedQuoteLineItemList);
    this.activeModal.dismiss();
  }

  // Helper function to process base offers
  processBaseOffers(response: any) {
    for (let i = 0; i < response.length; i++) {
      let e = response[i];

      // Step 1: Process ProviderSettings
      if (e.ProviderSettings) {
        let providerSettings = JSON.parse(e.ProviderSettings); // Parse once and reuse
        e.ServiceType = providerSettings.ProviderCategory ? providerSettings.ProviderCategory : providerSettings.Segment;
        e.ServiceType = e.ServiceType?.length > 0 ? (e.ServiceType[0].toUpperCase() + e.ServiceType.substring(1).toLowerCase()) : e.ServiceType;
      }

      // Step 2: Set PromotionalId and check for valid ConsumptionType
      e.PromotionalId = e.NCEPromotionIntID;

      // Step 3: Set provider-related properties and quantity
      if (e.ProviderName !== CloudHubConstants.ENTITY_PARTNER) {
        this.planOffersHaveOtherProviderThanPartner = true;
      }

      e.ProviderSettings = JSON.parse(e.ProviderSettings);
      e.Settings = JSON.parse(e.Settings);
      e.Quantity = e.ProductForTrial ? e.ProviderSettings.DefaultQuantity : 1;

      // Step 4: Process LinkedProduct settings (if available)
      if (e.LinkedProduct && e.LinkedProduct.ProviderSettings) {
        e.LinkedProduct.ProviderSettings = JSON.parse(e.LinkedProduct.ProviderSettings);
      }

      // Step 5: Process Addons (if available)
      if (e.Addons) {
        e.Addons = e.Addons.map((eachAddon: any) => {
          return this.convertToJson(eachAddon);
        });
      }
    }

    return response;
  }

  handleBaseOfferModal(item: any, baseOffers: any) {
    const modalRef = this._modalService.open(PoNumberPopupComponent);
    this.setPOValues(modalRef, item, baseOffers);

    modalRef.result.then((result) => {

      if (result?.isSkipped) {
        // Handle the skip logic here - prevent base offer selection and directly add the addon
        this.addProductToSelection(item);
        return;
      }

      if (typeof result === 'object' && result.baseOffer) {
        const selectedBaseOffer = result.baseOffer;

        // Ensure the base offer is selected first, followed by the addon
        if (selectedBaseOffer && selectedBaseOffer !== '') {
          selectedBaseOffer.IsSelected = true;
          selectedBaseOffer.isNewlyAdded = true;
          this.addProductToSelection(selectedBaseOffer); // Add base offer first
        }

        // Add the addon (child) product
        item.IsSelected = true;
        item.isNewlyAdded = true;
        this.addProductToSelection(item); // Then add the addon (child) product
      }
      else {
        item.IsSelected = false;
        this._toastService.warning(this._translateService.instant("TRANSLATE.QUOTE_LINE_ITEM_COMPATIBLE_BASE_PRODUCTS_POPUP_CLOSE_WARNING_TOASTER"));
      }
    }, () => {
      item.IsSelected = false;
      this._toastService.warning(this._translateService.instant("TRANSLATE.QUOTE_LINE_ITEM_COMPATIBLE_BASE_PRODUCTS_POPUP_CLOSE_WARNING_TOASTER"));
      modalRef.close(); // Close modal if user cancels
    });
  }

  setPOValues(modalRef: any, item: any, baseOffers: any) {
    modalRef.componentInstance.product = item;
    modalRef.componentInstance.isQuoteFeature = true;
    modalRef.componentInstance.baseOffers = baseOffers;
  }

  //Function to convert JSON Strings in result returned by GetProducts to JSON
  convertToJson(item: any) {
    item.ProviderSettings = JSON.parse(item.ProviderSettings);
    item.Settings = JSON.parse(item.Settings);
    item.Quantity = 1; //Set default quantity as 1
    item.Addons = _.map(item.Addons, eachAddon => {
      return this.convertToJson(eachAddon);
    });
    return item;
  }
  

  ngOnDestroy(): void {
    this.destroy$.next();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
  
}
