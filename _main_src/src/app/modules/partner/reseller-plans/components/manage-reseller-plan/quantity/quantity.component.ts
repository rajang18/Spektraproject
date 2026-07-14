import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ProductCategory } from 'src/app/shared/models/product-item-details';
import { ProductService } from 'src/app/services/product.service';
import { NgbModal} from '@ng-bootstrap/ng-bootstrap';
import _ from 'lodash';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { FileService } from 'src/app/services/file.service';
import { ResellerAddPlanBase } from '../../../models/reseller-add-plan-base';
import { ResellerPlansListingService } from '../../../services/resellerplans-listing.service';
import { ResellerPlansManagePlanService } from '../../../services/resellerplans-manageplan.service';
import { AddResellerPlanPriceChangeComponent } from 'src/app/modules/standalones/add-reseller-plan-price-change/add-reseller-plan-price-change.component';
import { AddResellerPlanMacroDetailsComponent } from 'src/app/modules/standalones/add-reseller-plan-macro-details/add-reseller-plan-macro-details.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';
@Component({
  selector: 'app-reseller-plan-quantity',
  templateUrl: './quantity.component.html',
  styleUrl: './quantity.component.scss'
})
export class ResellerPlanQuantityComponent extends ResellerAddPlanBase implements OnInit, OnDestroy {
  filteredProducts: any[] = [];
  selectedProducts: any[] = [];
  promotionAvailabeToAll: boolean = false;
  isPopoverOpen: boolean;
  offerPriceListData: any;

  constructor(
    public pageInfo: PageInfoService,
    public _router: Router,
    public _commonService: CommonService,
    public _permissionService: PermissionService,
    public _cdref: ChangeDetectorRef,
    public _dynamicTemplateService: DynamicTemplateService,
    public _productService: ProductService,
    public _modalService: NgbModal,
    public _translateService: TranslateService,
    public _notifierService: NotifierService,
    public _toastService: ToastService,
    public _fileService: FileService,
    public _resellerPlanService: ResellerPlansListingService,
    public _resellerPlansManagePlanService: ResellerPlansManagePlanService,
    protected _appService: AppSettingsService,
  ) {
    super(pageInfo, _router, _commonService, _permissionService, _cdref, _dynamicTemplateService, _productService, _modalService, _translateService, _notifierService, _toastService, _fileService, _resellerPlanService, _resellerPlansManagePlanService, _appService);
    this.planInfo = JSON.parse(this._commonService.getFromLocalStorge('resellerplaninfo'));
    this.productItemDetails.productType = ProductCategory.managePlan;

    if (!this.planInfo.PlanID && this.allSelectedProductsInLocalStorage.length == 0) {
      this._router.navigate([`/partner/resellerplans/addProducts`]);
    }

    if (!this.planInfo.PlanID && this.allSelectedProductsInLocalStorage.length > 0) {
      this.allSelectedProductsInLocalStorage.forEach(v => {
        v.tempId = _productService.tempId
        _productService.tempId++;
      })
    }

    this.filteredProducts = [
      { Name: this._translateService.instant('TRANSLATE.SELECTED_FILTER_ALL'), Value: '' },
      { Name: this._translateService.instant('TRANSLATE.SALE_PRICE_GREATER_THAN_ERP_PRICE'), Value: 'greaterThanERP' },
      { Name: this._translateService.instant('TRANSLATE.SALE_PRICE_LESS_THAN_LIST_PRICE'), Value: 'lessThanListPrice' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_MANAGE_SELECT_FILTER_SHOW_WITH_PROMOTION_NAME'), Value: 'offerWithPromotion' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_OFFERS_EQUALTO_OR_LESS_THAN_MARGIN_FILTER'), Value: 'PLAN_OFFERS_EQUALTO_OR_LESS_THAN_MARGIN_FILTER' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_0_AND_LESSER_THAN_10'), Value: 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_0_AND_LESSER_THAN_10' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_10_AND_LESSER_THAN_20'), Value: 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_10_AND_LESSER_THAN_20' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_20_AND_LESSER_THAN_30'), Value: 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_EQUAL_TO_20_AND_LESSER_THAN_30' },
      { Name: this._translateService.instant('TRANSLATE.PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_30'), Value: 'PLAN_OFFERS_MARGIN_FILTER_GREATER_THAN_30' },
      { Name: this._translateService.instant('TRANSLATE.SHOW_OFFERS_WHICH_HAS_NO_MACRO'), Value: 'showOffersWhichHasNoMacro' }
    ]

  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS', this.planInfo.PlanName ? { value: this.planInfo.PlanName, removeLocalization: true } : ''])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS"), true);
    this.setConsumptionTypeId(CloudHubConstants.CONSUMPTION_QUANTITY_BASED);
    this.planInfo = JSON.parse(this._commonService.getFromLocalStorge('resellerplaninfo'));
    if (this.planInfo != null && this.planInfo != undefined) {
      this.planId = this.planInfo.PlanID;
    }
    if (this._commonService.getFromLocalStorge('macroTypeId') != undefined && this._commonService.getFromLocalStorge('macroTypeId') != null) {
      this.planInfo.MacroTypeId = parseInt(this._commonService.getFromLocalStorge('macroTypeId'));
    }
    if (this._commonService.getFromLocalStorge('macroValue') != undefined && this._commonService.getFromLocalStorge('macroValue') != null) {
      this.planInfo.MacroValue = parseFloat(this._commonService.getFromLocalStorge('macroValue'));
    }

    let macro = localStorage.getItem('selectedMacro') ? JSON.parse(localStorage.getItem('selectedMacro')) : null;
    this.selectedMacro = macro;
    this.percentValue = this.planInfo && this.planInfo.MacroValue ? this.planInfo.MacroValue : 0;
    this.getMacroTypes();
    this.filterSelectedProductsByKeyword();
    if (!this.isMacroAppliedThroughMainButton) {
      this.isMacroAppliedThroughMainButton = {};
    }
  }

  onAction(product: any, action: string, parameters: any) {
    switch (action) {
      case 'delete':
        this.editOrDeleteProduct(product, action);
        break;
      case 'deleteAddons':
        this.editOrDeleteProduct(product, action);
        break;
      case 'edit':
        this.editOrDeleteProduct(product, action);
        break;
      case 'priceChange':
        this.priceChange(product);
        break;
    }
  }

  catchSelectedProductsSearchKeywordChange = _.debounce(() => {
    this.productItemDetails.searchKeyword = this.searchSelectedProductsKeyword;
    this.productItemDetails.filter = this.filter;
    this.reloadSelectedProducts = true;
    this.filterSelectedProductsByKeyword();
  }, 700)

  enableOrDisableResellerPromotionFully() {
    this.promotionAvailabeToAll = !this.promotionAvailabeToAll;

    this.selectedProducts?.map(e => {
      if (e.NCEPromotionID != null && e.NCEPromotionID != '') {
        // enabling and disabling the promotion availability to the reseller
        e.IsPromotionAvailableForReseller = this.promotionAvailabeToAll;
        this.editOrDeleteProduct(e, "edit");
      }
    })
  }


  priceChange(product: any) {
    const self = this;
    let priceChangeData = {
      Name: product.Name,
      ProductVariantId: product.ProductVariantId,
      BillingTypeName: product.BillingTypeName,
      ProviderReferenceId: product.ProviderReferenceId,
      BillingCycleName: product.BillingCycleName,
      Validity: product.Validity,
      ValidityType: product.ValidityType,
      CategoryName: product.CategoryName,
      ProviderSellingPrice: product.ProviderSellingPrice,
      PriceForPartner: product.PriceforPartner,
      SelectedConsumptionType: this.selectedConsumptionType,
      Macros: this.macros,
      CanPriceLead: this.planInfo.CanPartnerPriceLead,
      CanPriceLag: this.planInfo.CanPartnerPriceLag,
      ShouldShowPriceLockWarningMessage: product.ConsumptionType.toLowerCase() === this.cloudHubConstants.CONSUMPTION_QUANTITY_BASED.toLowerCase() && (this.Permissions.HasPriceLockConfiguration),
      HasResellerUsagePlanMacro: this.Permissions.HasResellerUsagePlanMacro,
      Permissions: this.Permissions,
    }
    const modalRef = this._modalService.open(AddResellerPlanPriceChangeComponent, { size: 'lg' });
    modalRef.componentInstance.data = priceChangeData;
    modalRef.result.then((response) => {
      if (response) {
        let reqBody: any = { PriceData: response.SearchCriteria.searchCriteriaString };
        this.isMacroAppliedThroughMainButton.show = true;
        let parsedJsonData = JSON.parse(reqBody.PriceData);
        if (parsedJsonData[0]?.MacroId != undefined) {
          let popUpMacroDetails: any = {};
          popUpMacroDetails.SelectedCategoryName = parsedJsonData[0].SelectedConsumptionType;
          popUpMacroDetails.MacroTypeId = parsedJsonData[0].MacroId;
          popUpMacroDetails.MacroValue = parsedJsonData[0].MacroValue;
          popUpMacroDetails.ConsumptionTypeId = this.selectedConsumptionTypeId;
          if (typeof (this.planInfo.SelectedMacroDetails) == "string") {
            // clean the array if any previous macro applied
            this.planInfo.SelectedMacroDetails = [];
          }
          this.applyMacroDetails.push(popUpMacroDetails);
          let usageMacro: any;
          usageMacro = this.applyMacroDetails.filter(e => e.SelectedCategoryName === 'usage');
          usageMacro = (usageMacro[usageMacro.length - 1] || []);
          this.lastAppliedUsageMacro = usageMacro;
          if (usageMacro?.length != 0) {
            let MacroId = usageMacro.MacroTypeId;
            let MacroName = this.macros.filter(e => (e.ID == MacroId || e.Id == MacroId))[0].Name;
            this.isMacroAppliedThroughMainButton.CurrentAzureMacro = { ...MacroName };
            this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue = usageMacro.MacroValue;
          }
          this.selectedMacro = _.find(this.macros, { 'ID': parsedJsonData[0].MacroId });
          this.percentValue = (parsedJsonData[0].MacroValue || 0);
          this.isPrice = false;
        }
        else {
          //Commenting this as it's updating the global macro value to NULL when price is updated on a single offer
          //this.selectedMacro = null;
          this.applyMacroDetails = this.applyMacroDetails.filter(e => e.SelectedCategoryName.toLowerCase() != this.selectedConsumptionType.toLowerCase())
          this.isPrice = true;
          this.isMacroAppliedThroughMainButton.CurrentAzureMacro = null;
          this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue = null;
        }
        const subscription = this._resellerPlansListingService.getPlanOfferCurrencyRates(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          this.offerPriceListData = JSON.parse(reqBody.PriceData);
          let successMessage = this._translateService.instant("TRANSLATE.RESELLER_ADD_PLAN_SUCCESS_TEXT_PRICE_UPDATED_SUCCESSFULLY")
          const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
          this._notifierService.success({ title: this._translateService.instant("TRANSLATE.RESELLER_ADD_PLAN_SUCCESS_PROMPT_HEADER_TEXT_SUCCESS"), text: successMessage, confirmButtonText: btnok });
          this.reloadSelectedProducts = true;
          this.filterSelectedProductsByKeyword();
        })
        this._subscriptionArray.push(subscription);
      }
    }).catch((reason) => {
      console.log('Dismissed: ', reason);
    });
  }

  onSelectedFilter() {
    this.catchSelectedProductsSearchKeywordChange();
  }

  macroChange() {
    const modalRef = this._modalService.open(AddResellerPlanMacroDetailsComponent, { size: 'lg' });
    modalRef.componentInstance.macros = this.macros;
    modalRef.componentInstance.planInfo = this.planInfo;
    modalRef.componentInstance.consumptionType = this.selectedConsumptionType;
    modalRef.result.then((response) => {
      if (response) {
        if (response.MacroType?.NeedsPercent == true) {
          this.percentValue = response.MacroValue;
        }
        this.selectMacro(response.MacroType);
        this.applyMacro(this.allSelectedProductsInLocalStorage);
      }
    })
  }

  ngOnDestroy(): void {
    this._dynamicTemplateService.sendTemplate(null);
    super.ngOnDestroy();
  }
}
