import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';

import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { BillingCycles, BillingTypes, Categories, CurrencyConversionOptions, CurrencyData, ProviderCategoriesInFilter, ProviderOptions, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { ProductService } from 'src/app/services/product.service';
import { ToastService } from 'src/app/services/toast.service';
import * as _ from 'lodash';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { TrailPeriodDaysDetails } from 'src/app/modules/partner/settings/models/subscription-expiry-check.model';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CustomerProductsPriceDetailsPopupComponent } from '../customer-products-price-details-popup/customer-products-price-details-popup.component';
import { PromotionDetailsPopupConfig } from 'src/app/shared/models/promoton-details.model';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CustomerProductsQuantityChangePopupComponent } from 'src/app/modules/standalones/products/customer-products-list/pop-ups/customer-products-quantity-change-popup/customer-products-quantity-change-popup.component';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-products-listing',
  templateUrl: './products-listing.component.html',
  styleUrl: './products-listing.component.scss'
})
export class ProductsListingComponent extends C3BaseComponent implements OnInit, OnChanges {
  @ViewChild('customerName', { static: true }) customerNameTemplate: TemplateRef<any>;
  @ViewChild('quantityTemplate', { static: true }) quantityTemplate!: TemplateRef<any>;
  @ViewChild('amountTemplate', { static: true }) amountTemplate!: TemplateRef<any>;
  @ViewChild('ownedByTemplate', { static: true }) ownedByTemplate!: TemplateRef<any>;
  @ViewChild('orderedOnTemplate', { static: true }) orderedOnTemplate!: TemplateRef<any>;
  @ViewChild('unitPriceTemplate', { static: true }) unitPriceTemplate!: TemplateRef<any>;
  @ViewChild('noDataTemplate', { static: true }) noDataTemplate: TemplateRef<any>;
 // @Input() reloadEvent: EventEmitter<boolean> = new EventEmitter()

  @ViewChild('actions') actions: TemplateRef<any>;
  //@Input()filter:any;
  @Input() selectedSubscriptionStatus: any[] = [];
  @Input() selectedProvider: any[] = [];
  @Input() selectedCategory: any[] = [];
  @Input() selectedBillingCycles: any[] = [];
  @Input() selectedProviderCategories: any[] = [];
  @Input() selectedConsumptionTypesToFilter: any[] = [];
  @Input() selectedSites: any[] = [];
  @Input() selectedDomain: any[] = [];
  @Input() selectedDepartments: any[] = [];
  @Input() includeZeroQuantities: boolean = false; // Missing input added
  @Input() isCustomerSelected: boolean = false;
  @Input() isSiteSelected: boolean = false;
  @Input() selectedValidities: any[] = [];
  @Input() termDurationSelection: any[] = [];
  @Input() selectedValidityTypes: any[] = [];
  @Input() selectedBillingTypes: any[] = [];
  @Input() selectedIsTrialOffer: boolean = false;
  @Input() selectedTrialDuration: any[] = [];
  @Input() search: string;
  @Output() toggle: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() renewsDay:any;
  @Input() selectedSubcategory: any[] = [];

  @Input()  selectedMarketTypesToFilters:any;
  @Input() supportedMarketsData:any;
  @Input() marketCodeSelectionData:any;
  @Input() IsESTSelested:any;
  subCategories: any[] = [];
  providers: ProviderOptions[] = [];
  categories: Categories[] = [];
  billingTypes: BillingTypes[] = [];
  supportedCurrenciesData: CurrencyData[] = [];
  currencyOptions: CurrencyConversionOptions[] = [];
  planBillingCycles: BillingCycles[] = [];
  providerCategories: ProviderCategoriesInFilter[] = [];
  termDuration: TermDuration[] = [];
  consumptionTypes: any[] = [];
  supportedMarketData: SupportedMarketData[] = [];
  filteredCategories: any[] = [];
  //providerSelection: any[] = [];
  categorySelection: any[] = [];
  //selectedCategory: any[] = [];
  filteredProviderCategories: any[] = [];
  providerCategorySelection: any[] = [];
  //selectedProviderCategories: any[] = [];
  // selectedValidities: any[] = [];
  // selectedValidityTypes: any[] = [];
  // termDurationSelection: any[] = [];
  // selectedTrialDuration: any[] = [];
  trialDurationSelection: any[] = [];
  // selectedBillingTypes: any[] = [];
  billingTypeSelection: any[] = [];
  //selectedBillingCycles: any[] = [];
  billingCycleSelection: any[] = [];
  //selectedConsumptionTypesToFilter: any[] = [];
  consumptionTypeSelection: any[] = [];
  selectedMarketTypesToFilter: any;
  marketCodeSelection: any[] = [];
  selectedIsTrailOffer: boolean = false;
  selectedProviderForTrail: any = null;
  // selectedProvider: any[] = [];
  supportedMarkets: any[] = [];
  productTrialDurations: TrailPeriodDaysDetails[] = [];
  customerProducts: any[] = [];
  productItemDetails: any = new ProductItemDetails();
  planOffersHaveOtherProviderThanPartner: boolean = false;
  areMSOffersPresent: boolean = null;
  lazyLoadedProducts: any[] = [];
  isCustomerAllowedToChangeProductQuantityFromList: boolean = false
  //search: string = null;
  poNumber: string = null;
  // selectedSites: any[] = [];
  // selectedDomain: any[] = [];
  // selectedDepartments: any[] = [];
  // selectedSubscriptionStatus: any[] = [];
  includeZeroQuantites: boolean = true;
  // isCustomerSelected: boolean = false;
  // isSiteSelected: boolean = false;
  datatableConfig: ADTSettings | undefined | any;
  isLoading: boolean;
  HasManageProduct: any;
  userContext: any
  EntityName: string;
  IsSelectedESTOffer : boolean =false;
  reloadEvent: EventEmitter<boolean> = new EventEmitter()
  @Output() onActionData: EventEmitter<any> = new EventEmitter();
  @Output() isHeaderAvtionEmit: EventEmitter<boolean>=new EventEmitter();
  FinalResult: any = [];
  sites: any[] = [];
  departments: any[] = [];
  domains: any[] = [];
  isFirstLoad: boolean = false;
  globalDateFormat: any;
  translatedValue:string=null;
  tabledata: any;
  MODAL_DIALOG_CLASS: string = 'modal-dialog modal-dialog-top mw-800px';
  TotalCost: any[];
  uniqueTotalCost: any[];
  isCustomSelected: boolean = false;
  subcategorySelection: any[] = [];

  constructor(
    private cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    public _router: Router,
    public _toastService: ToastService,
    public permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _productService: ProductService,
    public _modalService: NgbModal,
    public _planService: PlansListingService,
    private viewContainerRef: ViewContainerRef,
    private _appService: AppSettingsService,  



  ) {
    super(permissionService, _dynamicTemplateService, _router, _appService);
    const userContextList = JSON.parse(localStorage.getItem('userContextList') || '[]');
    this.userContext = JSON.parse(localStorage.getItem('userContextList'))[1];
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
  }
  get cloudHubConstants() {
    return CloudHubConstants;
  }

  ngOnInit(): void {
    this.HasManageProduct = this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT) === "Allowed" ?
      (this.userContext?.RoleName === 'CustomerReader' || this.userContext?.RoleName === 'SiteReader' || this.userContext?.RoleName === 'DepartmentReader' ?
        'ReadOnly' : 'Allowed') : this.permissionService.hasPermission(this.cloudHubConstants.BTN_MANAGE_PRODUCT);
    var a = this.cloudHubConstants.CATEGORY_LICENSE_SUPPORTED;
    this.checkIfCustomerAllowedToChangeProductQuantityFromList();
    this.handleTableConfig();
    this.translatedValue=this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCTS_TABLE_HEADER_TEXT_TOTAL_AMOUNT');
  }

  ngOnChanges(changes: SimpleChanges) {
  
    if (changes.selectedSubscriptionStatus && changes.selectedSubscriptionStatus.currentValue) {
      this.selectedSubscriptionStatus = changes.selectedSubscriptionStatus.currentValue;
    }
    if (changes.search && changes.search.currentValue) {
      this.search = changes.search.currentValue;
    }
    if (changes.selectedProvider && changes.selectedProvider.currentValue) {
      this.selectedProvider = changes.selectedProvider.currentValue;
    }
    if (changes.selectedCategory && changes.selectedCategory.currentValue) {
      this.selectedCategory = changes.selectedCategory.currentValue;
    }
    if (changes.selectedBillingCycles && changes.selectedBillingCycles.currentValue !== undefined) {
      this.selectedBillingCycles = changes.selectedBillingCycles.currentValue;
    }

    if (changes.selectedProviderCategories && changes.selectedProviderCategories.currentValue !== undefined) {
      this.selectedProviderCategories = changes.selectedProviderCategories.currentValue;
    }

    if (changes.selectedConsumptionTypesToFilter && changes.selectedConsumptionTypesToFilter.currentValue !== undefined) {
      this.selectedConsumptionTypesToFilter = changes.selectedConsumptionTypesToFilter.currentValue;
    }

    if (changes.selectedSites && changes.selectedSites.currentValue !== undefined) {
      this.selectedSites = changes.selectedSites.currentValue;
    }

    if (changes.selectedDomain && changes.selectedDomain.currentValue !== undefined) {
      this.selectedDomain = changes.selectedDomain.currentValue;
    }

    if (changes.selectedDepartments && changes.selectedDepartments.currentValue !== undefined) {
      this.selectedDepartments = changes.selectedDepartments.currentValue;
    }

    if (changes.includeZeroQuantities && changes.includeZeroQuantities.currentValue !== undefined) {
      this.includeZeroQuantites = changes.includeZeroQuantities.currentValue;
    }

    if (changes.isCustomerSelected && changes.isCustomerSelected.currentValue !== undefined) {
      this.isCustomerSelected = changes.isCustomerSelected.currentValue;
    }

    if (changes.isSiteSelected && changes.isSiteSelected.currentValue !== undefined) {
      this.isSiteSelected = changes.isSiteSelected.currentValue;
    }

    if (changes.selectedValidities && changes.selectedValidities.currentValue !== undefined) {
      this.selectedValidities = changes.selectedValidities.currentValue;
    }

    if (changes.termDurationSelection && changes.termDurationSelection.currentValue !== undefined) {
      this.termDurationSelection = changes.termDurationSelection.currentValue;
    }

    if (changes.selectedValidityTypes && changes.selectedValidityTypes.currentValue !== undefined) {
      this.selectedValidityTypes = changes.selectedValidityTypes.currentValue;
    }

    if (changes.selectedBillingTypes && changes.selectedBillingTypes.currentValue !== undefined) {
      this.selectedBillingTypes = changes.selectedBillingTypes.currentValue;
    }

    if (changes.selectedIsTrialOffer && changes.selectedIsTrialOffer.currentValue !== undefined) {
      this.selectedIsTrailOffer = changes.selectedIsTrialOffer.currentValue;
    }

    if (changes.selectedTrialDuration && changes.selectedTrialDuration.currentValue !== undefined) {
      this.selectedTrialDuration = changes.selectedTrialDuration.currentValue;
    }
    if(changes.IsESTSelested && changes.IsESTSelested.currentValue !== undefined){
      this.IsSelectedESTOffer=changes.IsESTSelested.currentValue
    }

    if(changes.selectedMarketTypesToFilters != undefined && changes.selectedMarketTypesToFilters != null){
      if(Array.isArray(changes.selectedMarketTypesToFilters.currentValue)){
        this.selectedMarketTypesToFilter = changes.selectedMarketTypesToFilters.currentValue.join(',')
      }
      else{
        this.selectedMarketTypesToFilter = changes.selectedMarketTypesToFilters.currentValue;
      }
    }

    if(changes.supportedMarketsData?.currentValue && changes.supportedMarketsData?.currentValue?.length > 0 ){
      this.supportedMarkets = changes.supportedMarketsData.currentValue
    }
    if (changes.selectedSubcategory && changes.selectedSubcategory.currentValue) {
      this.selectedSubcategory = changes.selectedSubcategory.currentValue;
    }   

    this.reloadEvent.emit(true);
    this.handleTableConfig();
    this.cdref.detectChanges();

  }

  checkIfCustomerAllowedToChangeProductQuantityFromList() {
    this.isCustomerAllowedToChangeProductQuantityFromList = false;
    const subscription = this._productService.checkIfCustomerAllowedToChangeProductQuantityFromList().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.isCustomerAllowedToChangeProductQuantityFromList = response.Data;
    });
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig(): void {
    this.isFirstLoad = true;
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
          this.toggle.emit(true);
          const reqBody = {
            SearchKeyword: this.search,
            ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
            CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
            BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
            ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
            ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
            PageCount: length,
            PageIndex: (StartInd - 1) * length,
            Sites: this.selectedSites ? this.selectedSites.join() : null,
            Domains: this.selectedDomain ? this.selectedDomain.join() : null,
            Departments: this.selectedDepartments ? this.selectedDepartments.join() : null,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            SubscriptionStatus: this.selectedSubscriptionStatus ? this.selectedSubscriptionStatus.join() : null,
            DoesExcludeInActive: true,
            DoesIncludeLinkedSubscription: true,
            IncludeZeroQuantities: this.includeZeroQuantites,
            Customer: (this.isCustomerSelected && this._commonService.entityName === 'Customer') ? this._commonService.recordId : null,
            Site: (this.isSiteSelected && this._commonService.entityName === 'Site') ? this._commonService.recordId : null,
            Validities: this.selectedValidities.length > 0 ? this.selectedValidities.join() : this.termDurationSelection.map(td => td.Validity).join(),
            ValidityTypes: this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : this.termDurationSelection.map(td => td.ValidityType).join(),
            BillingTypeIds: this.selectedBillingTypes ? this.selectedBillingTypes.join() : null,
            IsTrialOffer: this.selectedIsTrailOffer,
            TrialDuration: this.selectedTrialDuration.length > 0 ? this.selectedTrialDuration.join() : this.trialDurationSelection.map(td => td.Days).join(),
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            RenewsInDays:this.renewsDay,
            SupportedMarket: this.selectedMarketTypesToFilter, // when navigating we need to set the filter back
            SubcategoryIds: this.selectedSubcategory ? this.selectedSubcategory.join() : null,
            IsESTOffer : this.IsSelectedESTOffer
          };
          const subscription = this._productService.getCustomerProductsForList(reqBody).pipe(takeUntil(this.destroy$))
            .subscribe(Data => {

              if(this.supportedMarkets.length == 0 && Data.length > 0){
                this.supportedMarkets = JSON.parse(Data[0].SupportedMarket);

                // updating the refernce back
                this.supportedMarketsData =  JSON.parse(Data[0].SupportedMarket);
              }
              else{
                // let a = []
                // this.supportedMarkets = JSON.parse('[]');
                // this.supportedMarketsData = JSON.parse('[]');
              }



              let recordsTotal = 0;
              this.FinalResult = [];
              this.toggle.emit(false);
              if (Data && Data.length > 0) {
                [{ TotalCount: recordsTotal }] = Data;
                this.isLoading = false;
                    Data.forEach((item) => {
                  item.showCompleteName = false;
                })
                //this.setupDatatable(data);
                this.FinalResult = Data;
                this.TotalCost = [];
                Data.forEach(row => {
                  // Check if a currency already exists in TotalCost
                  const existingCost = this.TotalCost.find(tc => tc.CurrencyCode === row.CurrencyCode);
                  if (!existingCost) {
                    const cost = {
                      TotalCost: row.TotalCost,
                      CurrencyCode: row.CurrencyCode,
                      CurrencySymbol: row.CurrencySymbol,
                      CurrencyDecimalPlaces: row.CurrencyDecimalPlaces,
                      CurrencyThousandSeparator: row.CurrencyThousandSeparator,
                      CurrencyDecimalSeparator: row.CurrencyDecimalSeparator
                    };
                    this.TotalCost.push(cost);
                  }
                });
                
                let obj = {
                  ProductSubscriptionName : this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCTS_TABLE_HEADER_TEXT_TOTAL_AMOUNT'),
                  Status : 'Active',
                  StatusDescription : 'CUSTOMER_PRODUCTS_TABLE_HEADER_TEXT_TOTAL_AMOUNT',
                  CategoryName : undefined,
                  FinalSalePrice : Data[0].TotalCost,
                  AutoRenewDate : null,
                  PartnerOfferExpiresOn : null,
                  OrderedOn : null,
                  CurrencySymbol :Data[0].CurrencyCode +' '+ Data[0].CurrencySymbol,
                  Quantity : 1
                }
                this.FinalResult.push(obj);
              }
              // else {
              //   this.viewContainerRef.createEmbeddedView(this.noDataTemplate); // Render the noDataTemplate
              // }
              this.isFirstLoad = false;

              callback({
                data: this.FinalResult,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        

        columns: [
          {
            className: "col-md-3 align-top ",
            type: 'string',
            title: this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCTS_TABLE_HEADER_TEXT_NAME'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.customerNameTemplate,
            },
            data: 'ProductSubscriptionName'
          },
          {
            className: "col-md-1 text-end align-top",
            type: 'string',
            title: this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCTS_TABLE_HEADER_TEXT_QUANTITY'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.quantityTemplate,
            },
            data: 'Quantity',
            
          },
          {
            className: "col-md-1 text-end pe-3 align-top",
            type: 'string',
            title: this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCTS_TABLE_HEADER_TEXT_UNIT_PRICE'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.unitPriceTemplate,
            },
            orderable: false
          },
          {
            className: "col-md-1 text-end pe-3 align-top",
            type: 'string',
            //totalCost: true,
            title: this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCTS_TABLE_HEADER_TEXT_AMOUNT'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.amountTemplate,
            },
            orderable: false
          },
          {
            className: "col-md-2 align-top ",
            type: 'string',
            title: this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCTS_TABLE_HEADER_TEXT_OWNED_BY'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.ownedByTemplate,
            },
            orderable: false
          },
          {
            className: "col-md-2 align-top",
            type: 'string',
            title: this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCTS_TABLE_HEADER_TEXT_ORDERD_ON'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.orderedOnTemplate,
            },
            data: 'CommitmentEndDate'
          },
          {
            className: "col-md-1 text-center align-top",
            type: 'string',
            title: this._translateService.instant('TRANSLATE.RESELLER_TABLE_HEADER_TEXT_ACTIONS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
            },
            orderable: false
          },
        ],
        order:[]
      };
      this.cdref.detectChanges();
    });
  }
  onCaptureEvent(event: Event) { }

  manageProduct(row: any, parameters: any = null): void {
    delete row.showCompleteName;
    let data = {
      product: row,
      action: "manage",
      parameters: parameters
    }
    this.onActionData.emit(data);
  }

  checkNcePromotionEligibility(row: any): void {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();

    promotionDetailsConfig.Name = row.NCEPromotionName;
    promotionDetailsConfig.PromotionalId = row.NCEPromotionID;
    promotionDetailsConfig.Description = row.NCEPromotionDescription;
    promotionDetailsConfig.Validity = row.Validity;
    promotionDetailsConfig.ValidityType = row.ValidityType;
    promotionDetailsConfig.BillingCycleName = row.BillingCycleName;
    promotionDetailsConfig.BillingCycleDescriptionKey = row.BillingCycleDescription;
    promotionDetailsConfig.Discount = row.NCEPromotionDiscount;
    promotionDetailsConfig.DiscountType = row.NCEPromotionDiscountType;
    promotionDetailsConfig.EndDate = row.NCEPromotionEndDate;

    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: this.MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  checkNceLinkedProductPromotionEligibility(row: any): void {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    promotionDetailsConfig.Name = row.NCELinkedProductPromotionName,
      promotionDetailsConfig.PromotionalId = row.NCELinkedProductPromotionID,
      promotionDetailsConfig.Description = row.NCELinkedProductPromotionDescription,
      promotionDetailsConfig.Validity = row.Validity,
      promotionDetailsConfig.ValidityType = row.ValidityType,
      promotionDetailsConfig.BillingCycleName = row.BillingCycleName,
      promotionDetailsConfig.BillingCycleDescriptionKey = row.BillingCycleDescription,
      promotionDetailsConfig.Discount = row.NCELinkedProductPromotionDiscount,
      promotionDetailsConfig.DiscountType = row.NCELinkedProductPromotionDiscountType,
      promotionDetailsConfig.EndDate = row.NCELinkedProductPromotionEndDate
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: this.MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }
  priceDetails(product: any): void {
    const modalRef = this._modalService.open(CustomerProductsPriceDetailsPopupComponent, { size: 'lg' });
    modalRef.componentInstance.meteredProduct = product;

    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  QuantityChangePopup(data){
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-600px',
    };
    const modalRef = this._modalService.open(CustomerProductsQuantityChangePopupComponent, config);
    modalRef.componentInstance.productdetails = data;
    
    modalRef.result.then((res) => {
      this.reloadEvent.emit(res.isUpdateStatus)
    },
	(reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();                        
    this.isHeaderAvtionEmit.emit(true)
  }
  
}

