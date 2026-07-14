import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { OrdersService } from '../orders.service';
import { debounceTime, distinctUntilChanged, interval, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/report-popup.model';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { PromotionDetailsPopupConfig } from 'src/app/shared/models/promoton-details.model';
import { CartService } from '../../services/cart.service';
import { ToastService } from 'src/app/services/toast.service';
import { CommonService } from 'src/app/services/common.service';
import { WebhookNotificationService } from 'src/app/modules/administration/services/webhook-notification-service.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout'; 
import _ from "lodash"
import { C3RouterService } from 'src/app/services/c3-router.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
@Component({
  selector: 'app-view-order-details',
  templateUrl: './view-order-details.component.html',
  styleUrl: './view-order-details.component.scss',
})
export class ViewOrderDetailsComponent extends C3BaseComponent implements OnInit, OnDestroy {
  ordersItems: any[] = [];
  isProductsDataLoading: boolean = false;
  search: any='';
  searchUpdate = new Subject<string>();
  selectedProvider: any[] = [];
  selectedCategory: any[] = [];
  selectedBillingCycles: any[] = [];
  selectedProviderCategories: any[] = [];
  selectedConsumptionTypesToFilter: any[] = [];
  selectedStatus: any[] = [];
  selectedValidities: any[] = [];
  termDurationSelection: any[] = [];
  selectedValidityTypes: any[] = [];
  selectedBillingTypes: any[] = [];
  selectedIsTrailOffer: boolean = false;
  selectedTrialDuration: any[] = [];
  trialDurationSelection: any[] = [];
  currentOrderID: any;
  isScheduledDateFuture: boolean;
  currentYear: any = new Date().getFullYear();
  currentMonth: any = new Date().getMonth();
  currentDate: any = new Date().getDate();
  isInstantPay: any;
  cartStatusName: any;
  invoiceId: any;
  cartId: any;
  invoiceNumber: any;
  instantPayPaymentExempt: any;
  productItemDetails: any = new ProductItemDetails();
  CartLineItemId: any;
  CartLineItemName: any;
  sendCommentLoading: boolean = false;
  allCommentsData: any[] = [];
  @ViewChild('exampleModal', { static: false }) exampleModal: TemplateRef<any>;
  @ViewChild('cancelProductOrderModal', { static: false })
  cancelProductOrderModal: TemplateRef<any>;
  @ViewChild('cancelOrderModal', { static: false })
  cancelOrderModal: TemplateRef<any>;
  newComment: any;
  removeProductComment: any;
  providers: any[] = [];
  providerSelection: any[] = [];
  selectedProviderForTrail: any;
  filteredCategories: any[] = [];
  categories: any[] = [];
  categorySelection: any[] = [];
  filteredProviderCategories: any[] = [];
  providerCategories: any[] = [];
  providerCategorySelection: any[] = [];
  lazyLoadedProducts: any[] = [];
  productTrialDurations: any[] = [];
  HasFilterTrailOffer: string;
  billingCycles: any[] = [];
  billingCycleSelection: any[]=[];
  billingTypeFilter: any[] = [];
  billingTypeSelection: any[]=[];
  consumptionTypes: any[] = [];
  consumptionTypeSelection: any[]=[];
  productTermDurations: any[] = [];
  globalDateFormat: any ='';
  cancelOrderComment: null;
  timerHandle: Subscription;
  supportedMarkets:any[] = [];
  marketCodeSelection:any[] = [];
  selectedMarketTypesToFilter:any[] = [];
  subCategories: any;
  isCustomSelected: boolean = false;
  subcategorySelection: any[] = [];
  selectedSubcategory: any[] = [];
  constructor(
    public _router: Router,
    private cdRef: ChangeDetectorRef,
    public _dynamicTemplateService: DynamicTemplateService,
    public _permissionService: PermissionService,
    private translateService: TranslateService,
    private _notifierService: NotifierService,
    private _orderService: OrdersService,
    private route: ActivatedRoute,
    public _modalService: NgbModal,
    private _cartService: CartService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    private webhookNotificationService: WebhookNotificationService,
    private _planService: PlansListingService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.productItemDetails.productType = 'order';
  }

  ngOnInit(): void {
    this.HasPermission();
    this.globalDateFormat = this._appService.$rootScope.oldDateTimeFormat;
    this.pageInfo.updateBreadcrumbs(['CUSTOMER_ORDERS_BREADCRUMB_BUTTON'])
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.CUSTOMER_ORDERS_PAGE_HEADER_TEXT"), true);
    // Debounce search.
    const subscription = this.searchUpdate.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe(value => {
        this.search = value;
        this.filterOrderItems()
      });
      this._subscriptionArray.push(subscription);

    this.HasFilterTrailOffer = this._permissionService.hasPermission(
      'GET_PARTNER_TRIAL_OFFER_FILTER'
    );
    this._subscription = this.route.paramMap.subscribe((params: any) => {//ajmal:todo: Nexted subscription
      this.currentOrderID = params?.params['orderId'];
      this.getOrderItems();
      this.getProviders();
      if (this.Permissions.HasParterTrailOffer == "Allowed") {
        this.getTrialPeriodDays();
      }
      this.getBillingCycles();
      this.getBillingTypeFilter();
      this.getConsumptionTypes();
      this.getProductTermDurations();
      this.getCategories();
      this.getProviderCategories();
    });
    this.pollComments();
  }

  Permissions = {
    HasParterTrailOffer: "Denied",
  }

  HasPermission() {
    this.Permissions.HasParterTrailOffer = this._permissionService.hasPermission('GET_PARTNER_TRIAL_OFFER');
  }

  getCategories(){
    const subscription = this._commonService.getCategories('order').pipe(takeUntil(this.destroy$)).subscribe((res:any)=>{
      this.categories = res|| []
    })
    this._subscriptionArray.push(subscription);
  }
  getProviderCategories(){
    const subscription = this._planService.getProviderCategoriesInFilter().pipe(takeUntil(this.destroy$)).subscribe((res:any)=>{
      this.providerCategories = res|| []
    })
    this._subscriptionArray.push(subscription);
  }

  getProviders() {
    const subscription = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.providers = res;
    });
    this._subscriptionArray.push(subscription);
  }
  getBillingCycles() {
    const subscription = this.webhookNotificationService.GetBillingCycles().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.billingCycles = res;
    });
    this._subscriptionArray.push(subscription);

  }

  getSubCategories(subCategory:any) {
    const subscription = this._commonService.getSubCategories(subCategory,true).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.subCategories = res;
    });
    this._subscriptionArray.push(subscription);
  }

  getProductTermDurations() {
    const subscription = this.webhookNotificationService
      .getProductTermDurations().pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.productTermDurations = res;
      });
      this._subscriptionArray.push(subscription);
  }
  getConsumptionTypes() {
    const subscription = this._commonService.getConsumptionTypes().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.consumptionTypes = res;
    });
    this._subscriptionArray.push(subscription);
  }
  getBillingTypeFilter() {
    const subscription = this._commonService.getBillingTypes().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.billingTypeFilter = res;
    });
    this._subscriptionArray.push(subscription);
  }
  getTrialPeriodDays() {
    const subscription = this.webhookNotificationService
      .getProductTrialDurations().pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.productTrialDurations = res || [];
      });
      this._subscriptionArray.push(subscription);
  }

  toggleTermDurationSelection(term: any): void {
    const idx = this.termDurationSelection.indexOf(term);
    // Is currently selected
    if (idx > -1) {
      this.termDurationSelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.termDurationSelection.push(term);
    }
    // Call method to filter products by term duration
    this.filterProductsByTermDuration();
  }

  filterProductsByIsTrailOffer() {
    if (!this.selectedIsTrailOffer) {
      this.selectedTrialDuration = [];
      this.trialDurationSelection = [];
    }
    this.selectedIsTrailOffer;
    this.filterOrderItems();
  }

  filterProductsByTermDuration() {
    this.selectedValidities = [];
    this.selectedValidityTypes = [];
    this.selectedValidities = this.termDurationSelection?.map(
      (item: any) => item.Validity
    );
    this.selectedValidityTypes = this.termDurationSelection.map(
      (item) => item.ValidityType
    );
    this.filterOrderItems();
  }

  toggleConsumptionTypeSelection(consumptionType: any): void {
    const idx = this.consumptionTypeSelection.indexOf(consumptionType);
    // Is currently selected
    if (idx > -1) {
      this.consumptionTypeSelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.consumptionTypeSelection.push(consumptionType);
    }
    // Call method to filter products by consumption type
    this.filterProductsByConsumptionType();
  }

  filterProductsByConsumptionType() {
    this.selectedConsumptionTypesToFilter = [];
    this.selectedConsumptionTypesToFilter = this.consumptionTypeSelection?.map(
      (item: any) => item.ID
    );
    this.filterOrderItems();
  }

  toggleBillingTypeSelection(billingType: any): void {
    const idx = this.billingTypeSelection.indexOf(billingType);

    // Is currently selected
    if (idx > -1) {
      this.billingTypeSelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.billingTypeSelection.push(billingType);
    }

    // Call method to filter products by billing type
    this.filterProductsByBillingType();
  }

  filterProductsByBillingType() {
    this.selectedBillingTypes = [];
    this.selectedBillingTypes = this.billingTypeSelection?.map(
      (item: any) => item.Id
    );
    this.filterOrderItems();
  }

  toggleBillingCycleSelection(billingCycle: any): void {
    const idx = this.billingCycleSelection.indexOf(billingCycle);
    // Is currently selected
    if (idx > -1) {
      this.billingCycleSelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.billingCycleSelection.push(billingCycle);
    }
    // Call method to filter products by billing cycle
    this.filterProductsByBillingCycle();
  }

  filterProductsByBillingCycle() {
    this.selectedBillingCycles = [];
    this.selectedBillingCycles = this.billingCycleSelection?.map(
      (item: any) => item.ID
    );
    this.filterOrderItems();
  }

  toggleTrialDurationSelection(days: number): void {
    const idx = this.trialDurationSelection.indexOf(days);
    // Is currently selected
    if (idx > -1) {
      this.trialDurationSelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.trialDurationSelection.push(days);
    }
    // Call method to filter products by trial duration
    this.filterProductsByTrialDuration();
  }

  toggleProviderCategorySelection(providerCategory: any): void {
    const idx = this.providerCategorySelection.indexOf(providerCategory);
    // Is currently selected
    if (idx > -1) {
      this.providerCategorySelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.providerCategorySelection.push(providerCategory);
    }
    // Call method to filter products by provider category
    this.filterProductsByProviderCategory();
  }

  filterProductsByProviderCategory() {
    this.selectedProviderCategories = [];
    this.selectedProviderCategories = this.providerCategorySelection?.map(
      (item: any) => item.ProviderCategoryName
    );
    this.filterOrderItems();
  }

  filterProductsByTrialDuration() {
    this.selectedTrialDuration = [];
    /*this.SelectedValidityTypes = [];*/
    this.selectedTrialDuration = this.trialDurationSelection?.map(
      (item: any) => item.Days
    );
    /*this.SelectedValidityTypes = _.map(this.TermDurationSelection, 'ValidityType');*/
    this.filterOrderItems();
  }

  toggleProviderSelection(provider: any): void {
    const idx = this.providerSelection.indexOf(provider);
    // Is currently selected
    if (idx > -1) {
      this.providerSelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.providerSelection.push(provider);
    }

    this.selectedProviderForTrail = this.providerSelection.find(
      (row: any) => row.Name === 'Partner'
    );

    this.filterCategories();
    this.filterProviderCategories();
    this.filterProductsByProvider();
  }

  filterCategories(): void {
    // Filter categories where the ProviderId matches any provider's ID
    this.filteredCategories = this.categories.filter(
      (category) =>
        this.providerSelection.findIndex(
          (provider) => provider.ID === category.ProviderId
        ) > -1
    );
    // Reset values in category selection based on filtered categories
    this.categorySelection = this.categorySelection.filter(
      (category) =>
        this.filteredCategories.findIndex((each) => each.ID === category.ID) >
        -1
    );
    // Check if any provider with Name 'Partner' exists
    const partnerSelected = this.providerSelection.filter(
      (provider) => provider.Name === 'Partner'
    );
    // If no 'Partner' provider is selected, reset trial offer
    if (partnerSelected.length === 0) {
      this.selectedIsTrailOffer = false;
    }
    if (partnerSelected.length === 0) {
      this.subcategorySelection = [];
      this.isCustomSelected = false;
      this.filterProductsBySubcategory();
    }
    // Extract IDs from categorySelection
    this.selectedCategory = this.categorySelection.map(
      (category) => category.ID
    );
    this.cdRef.detectChanges();
  }

  filterProviderCategories(): void {
    // Filter provider categories where the ProviderId matches any provider's ID
    this.filteredProviderCategories = this.providerCategories.filter(
      (category) =>
        this.providerSelection.findIndex(
          (provider) => provider.ID === category.ProviderId
        ) > -1
    );
    // Reset values in provider category selection based on filtered provider categories
    this.providerCategorySelection = this.providerCategorySelection.filter(
      (category) =>
        this.filteredProviderCategories.findIndex(
          (each) => each.ID === category.ID
        ) > -1
    );
    // Extract names from providerCategorySelection
    this.selectedProviderCategories = this.providerCategorySelection.map(
      (category) => category.ProviderCategoryName
    );
  }

  filterProductsByProvider() {
    this.selectedProvider = [];
    this.selectedProvider = this.providerSelection?.map((item: any) => item.ID);
    this.filterOrderItems();
  }

  filterOrderItems() {
    this.lazyLoadedProducts = [];
    this.getOrderItems();
  }

  toggleCategorySelection(category: any): void {
    const idx = this.categorySelection.indexOf(category);
    // Is currently selected
    if (idx > -1) {
      this.categorySelection.splice(idx, 1);
      this.subcategorySelection = [];
    } else {
      // Is newly selected
      this.categorySelection.push(category);
    }
    this.isCustomSelected = this.categorySelection.some(item => item.Name.toLowerCase() === 'custom' || item.Name === 'DistributorOffers' || item.Name === 'LicenseSupported');
    if (category.Name.toLowerCase() === 'custom' || category.Name === 'DistributorOffers' || category.Name === 'LicenseSupported') {
      let categories:any = _.map(this.categorySelection, 'Name')
         categories = categories.join(',');
      if(categories.length > 0){
      this._commonService.getSubCategories(categories, true).subscribe((res: any) => {
        this.subCategories = res
      })
      }
      else{
        this.subCategories = [];
      }
    }
    if (!this.isCustomSelected) {
        this.subcategorySelection = [];
        this.filterProductsBySubcategory();
      }
    // Call method to filter products by category
    this.filterProductsByCategory();
  }
 
    isSubCategorySelected(subCategory: any): boolean {
      return this.subcategorySelection.some(item => item.Id === subCategory.Id);
  }

   toggleSubCategorySelection(subCategory: any) {
    const idx = this.subcategorySelection.findIndex(item => item.Id === subCategory.Id);
    // If already selected, remove it
    if (idx > -1) {
      this.subcategorySelection.splice(idx, 1);
    } else {
      // Otherwise, add it to the selection
      this.subcategorySelection.push(subCategory);
    }
 
    // Optionally trigger filtering logic
    this.filterProductsBySubcategory(true);
  }

  //Filter products by subcategory
    filterProductsBySubcategory(isFromToggleSubCategorySelection: any = null) { 
      this.selectedSubcategory = _.map(this.subcategorySelection, 'Id');
      if(isFromToggleSubCategorySelection){
        this.filterOrderItems();
      }
  }

  filterProductsByCategory(): void {
    this.selectedCategory = [];
    this.selectedCategory = this.categorySelection?.map((item: any) => item.ID);
    this.filterOrderItems();
  }


  toggleMarketTypeSelection(marketCode: any) {
    // object reference fix
    let idx = this.marketCodeSelection.findIndex(e=> JSON.stringify(e) == JSON.stringify(marketCode));

    if (idx > -1) {
        this.marketCodeSelection.splice(idx, 1);
    } else {
        this.marketCodeSelection.push(marketCode)
    }

    this.filterProductsBySupportedMarket();
  }

  filterProductsBySupportedMarket() {
    this.selectedMarketTypesToFilter = [];
    this.selectedMarketTypesToFilter = _.map(this.marketCodeSelection, 'ID');
    this.filterOrderItems();
  }

  getOrderItems() {
    this.ordersItems = [];
    this.orderDetails();
  }

  orderDetails() {
    // this.vm.ScrollBusy = true;
    this.isProductsDataLoading = true;

    const reqBody = {
      SearchKeyword: this.search,
      ProviderIds:
        this.selectedProvider ? this.selectedProvider?.join() : null,
      CategoryIds:
        this.selectedCategory ? this.selectedCategory?.join() : null,
      BillingCycleIds: this.selectedBillingCycles
        ? this.selectedBillingCycles.join()
        : null,
      ProviderCategories:
        this.selectedProviderCategories
          ? this.selectedProviderCategories.join()
          : null,
      ConsumptionTypes:
        this.selectedConsumptionTypesToFilter
          ? this.selectedConsumptionTypesToFilter.join()
          : null,
      PageCount: 9,
      PageIndex: this.ordersItems.length,
      IncludeAddOns: true,
      StatusIds:
        this.selectedStatus ? this.selectedStatus.join() : null,
      Validities:
        this.selectedValidities &&
        this.selectedValidities.length > 0
          ? this.selectedValidities.join()
          : this.termDurationSelection.map((t) => t.Validity).join(),
      ValidityTypes:
        this.selectedValidityTypes &&
        this.selectedValidityTypes?.length > 0
          ? this.selectedValidityTypes.join()
          : this.termDurationSelection.map((t) => t.ValidityType).join(),
      BillingTypeIds: this.selectedBillingTypes
        ? this.selectedBillingTypes.join()
        : null,
      IsTrailOffer: this.selectedIsTrailOffer,
      TrialDuration:
        this.selectedTrialDuration && this.selectedTrialDuration?.length > 0
          ? this.selectedTrialDuration.join()
          : this.trialDurationSelection.map((t) => t.Days).join(),
        SupportedMarket:this.selectedMarketTypesToFilter.length == 0 ? "" :  this.selectedMarketTypesToFilter.join(","),
        SubcategoryIds: this.subcategorySelection ? this.subcategorySelection?.map(item=>item.Id)?.join(',') : null
    };

    // this.blockUI.start('Loading order details...');
    this._orderService.getOrderDetails(reqBody, this.currentOrderID).subscribe(
      (res: any) => {
        this.isProductsDataLoading = false;
        let data = res.Data;
        // Handle the data response
        data = (data && data?.length === 1 && data[0]?.ProviderName === '') ? [] : data;
        if(data[0]?.SupportedMarket != null && data[0]?.SupportedMarket != undefined && data[0]?.SupportedMarket != '' ){

          if(this.supportedMarkets.length == 0){
            this.supportedMarkets = JSON.parse(data[0].SupportedMarket);
          }
        }
        // else{
        //   this.supportedMarkets = [];
        // }




        if (data && data.length > 0) {
          this.isInstantPay = data[0].IsInstantPay;
          this.cartStatusName = data[0].CartStatusName;
          this.invoiceId = data[0].InvoiceId;
          this.cartId = data[0].CartId;
          this.invoiceNumber = data[0].InvoiceNumber;
          this.instantPayPaymentExempt = data[0].InstantPayPaymentExempt;

          const scheduleDate = new Date(data[0].ScheduledDate);
          const scheduledYear = scheduleDate.getFullYear();
          const scheduledMonth = scheduleDate.getMonth();
          const scheduledDateOfMonth = scheduleDate.getDate();

          this.isScheduledDateFuture =
            scheduledYear > this.currentYear ||
            (scheduledYear === this.currentYear &&
              scheduledMonth > this.currentMonth) ||
            (scheduledYear === this.currentYear &&
              scheduledMonth === this.currentMonth &&
              scheduledDateOfMonth > this.currentDate);
        }

        data.forEach((product) => {
          product.ProviderSettings = JSON.parse(product.ProviderSettings);
          product.Settings = JSON.parse(product.Settings);
          if(product.CategoryName.toLowerCase() == this.cloudHubConstants.CATEGORY_BUNDLES.toLowerCase() && product.ProviderError)
          try{
              product.ProviderError   = JSON.parse(product.ProviderError);
              product.ProviderError.FailedProducts = product.ProviderError.FailedProducts;
              product.ProviderError.SucceededProducts= product.ProviderError.SucceededProducts ?? [];
              product.IsJsonError = true;
          }
          catch(ex){
            product.IsJsonError = false;
            product.ProviderError = 'CART_GENERIC_ERROR_MESSAGE';
          }
        });

        let ordersItems = [...this.ordersItems, ...data];
        this.ordersItems = Array.from(
          new Map(ordersItems.map(item => [item.CartLineItemId, item])).values()
        );
        this.cdRef.detectChanges();
        // this.vm.ScrollBusy = false;
        // this.blockUI.stop();
      },
      (error) => {
        this.isProductsDataLoading = false;
        // this.vm.ScrollBusy = false;
        // this.blockUI.stop();
      }
    );
  }

  cancelOrderModalFunction(){
    const modalRef = this._modalService.open(this.cancelOrderModal);
    modalRef.result.then(
      (r) => {},
      (error) => {}
    );
  }

  onAddplanAction(data: any) {
    this.onAction(data.product, data.action);
  }

  onAction(product: any, action: any) {
    switch (action) {
      case 'manageProduct':
        this.manageProduct(product);
        break;
      case 'cancelOrderedProductModal':
        this.cancelOrderedProductModal(product);
        break;
      case 'checkNcePromotionEligibility':
        this.checkNcePromotionEligibility(product);
        break;
      default:
    }
  }

  checkNcePromotionEligibility(product: any) {
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    (promotionDetailsConfig.Name = product?.PromotionName),
      (promotionDetailsConfig.PromotionalId = product?.PromotionId),
      (promotionDetailsConfig.Description = product?.PromotionDescription),
      (promotionDetailsConfig.Validity = product?.Validity),
      (promotionDetailsConfig.ValidityType = product?.ValidityType),
      (promotionDetailsConfig.BillingCycleName = product?.BillingCycleName),
      (promotionDetailsConfig.BillingCycleDescriptionKey =
        product?.BillingCycleDescription),
      (promotionDetailsConfig.Discount = product?.PromotionDiscount),
      (promotionDetailsConfig.DiscountType = product?.PromotionDiscountType),
      (promotionDetailsConfig.EndDate = product?.PromotionEndDate);
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then(
      (result) => {},
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }
  cancelOrderedProductModal(product: any) {
    this.CartLineItemId = product.CartLineItemId;
    this.CartLineItemName = product.Name;
    // this.commentsTable.reload();
    // this.reloadCommentsTable(); // Implement this method to refresh the table
    this.openProductPopup();
  }

  openProductPopup() {
    const modalRef = this._modalService.open(this.cancelProductOrderModal);
    modalRef.result.then(
      (r) => {},
      (error) => {}
    );
  }
  manageProduct(product: any) {
    this.CartLineItemId = product.CartLineItemId;
    this.CartLineItemName = product.Name;
    // this.commentsTable.reload();
    this.reloadCommentsTable(); // Implement this method to refresh the table
    this.openPopup();
  }

  saveCartlineComments() {
    if (!this.sendCommentLoading) {
      const savePayload = {
        EntityName: 'CartLineItem',
        RecordId: this.CartLineItemId,
        Content: this.newComment,
      };

      if (!savePayload.Content || savePayload.Content.trim() === '') {
        this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_EMPTY_COMMENTS_SUBMITTED'));
      } else {
        this.sendCommentLoading = true;
        this._cartService.postComment(savePayload).subscribe(
          (response: any) => {
            // Handle successful response
            // Reload or refresh comments table
            this.reloadCommentsTable(); // Implement this method to refresh the table
          },
          (error) => {
            // Handle error
            this._toastService.error(
              'An error occurred while saving the comment.'
            );
          }
        );
        this.newComment = null;
      }
    }
  }

  openPopup() {
    const modalRef = this._modalService.open(this.exampleModal);
    modalRef.result.then(
      (r) => {},
      (error) => {}
    );
  }

  onCloseRemoveProductPopup() {
    this.removeProductComment = null;
    this.closeModal();
  }

  removeProductSaveComment() {
    var cartId = this.ordersItems[0].CartId;
    var cartLineItemId = this.CartLineItemId;
    var savePayload = {
      CartLineItemId: cartLineItemId,
      CartId: null,
      comment: this.removeProductComment,
    };
    if (this.removeProductComment == null || this.removeProductComment == '') {
      this._toastService.error(
        this._translateService.instant(
          'TRANSLATE.CANCEL_SCHEDULED_PRODUCT_EMPTY_REASON_ERROR'
        )
      );
    } else {
      const subscription = this._orderService.cancellingOrder(savePayload).pipe(takeUntil(this.destroy$)).subscribe((response) => {
        if (response.Status == 'Success') {
          this._toastService.success(
            this._translateService.instant(
              'TRANSLATE.CANCEL_SCHEDULED_PRODUCT_SUCCESS'
            )
          );
          this.viewOrderItems(cartId);
        }
      });
      this.closeModal();
      this.removeProductComment = null;
      this._subscriptionArray.push(subscription);
    }
  }
  cancelOrderSaveComment() {
    var cartId = this.ordersItems[0].CartId;
    // var cartLineItemId = this.CartLineItemId;
    var savePayload = {
      CartLineItemId: null,
      CartId: cartId,
      comment: this.cancelOrderComment,
    };
    if (this.cancelOrderComment == null || this.cancelOrderComment == '') {
      this._notifierService.error(
        {title:this._translateService.instant(
          'TRANSLATE.CANCEL_SCHEDULED_PRODUCT_REASON_ERROR'
        )}
      );
    } else {
      const subscription = this._orderService.cancellingOrder(savePayload).pipe(takeUntil(this.destroy$)).subscribe((response) => {
        if (response.Status == 'Success') {
          this._toastService.success(
            this._translateService.instant(
              'TRANSLATE.CANCEL_SCHEDULED_ORDER_SUCCESS'
            )
          );
          this.viewOrderItems(cartId);
        }
      });
      this._subscriptionArray.push(subscription);
      this.closeModal();
      this.removeProductComment = null;
    }
  }

  viewOrderItems(orderId: any) {
    this.currentOrderID = orderId;
    // this.updatePageMode("orderItemList");
    this.ordersItems = [];
    this.getOrderItems();
  }

  closeModal() {
    this.cancelOrderComment = null;
    this._modalService.dismissAll();
  }

  reloadCommentsTable() {
    this.sendCommentLoading = true;
    const searchParams = {
      StartInd: 1,
      SortColumn: 0,
      SortOrder: 'asc',
      PageSize: 100,
      EntityName: 'CartLineItem',
      RecordId: this.CartLineItemId,
    };
    const subscription = this._cartService.getComments(searchParams).pipe(takeUntil(this.destroy$)).subscribe(
      ({ Data }: any) => {
        this.allCommentsData = Data || [];
        this.sendCommentLoading = false;
      },
      (error) => {
        // Handle the error here
        this.sendCommentLoading = false;
        // Optionally display an error message to the user
        // For example, using a notification service:
        // this.notificationService.showError('Failed to load comments');
      }
    );
    this._subscriptionArray.push(subscription);
  }
  pollComments(){
    const subscription = this.timerHandle = interval(15000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        this.reloadCommentsTable();
        return [];
      })
    ).subscribe();
    this._subscriptionArray.push(subscription);
  }

  backToOrders() {
      this.c3RouterService.backToHistory(this.keyForData,'/customer/orders');
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    if(this.timerHandle){
      this.timerHandle.unsubscribe();
    }
  }
}
