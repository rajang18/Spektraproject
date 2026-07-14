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
  selector: 'app-reseller-plan-usage',
  templateUrl: './usage.component.html',
  styleUrl: './usage.component.scss'
})
export class ResellerPlanUsageComponent extends ResellerAddPlanBase implements OnInit, OnDestroy {
  selectedProducts: any[] = [];
  isPopoverOpen: boolean;
  offerPriceListData: any;
  temp: {
    show: boolean,
    CurrentAzureMacro: number
  } = {
      show: false,
      CurrentAzureMacro: null
    };

  private searchDebounceTimer: any;
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
  }

  ngOnInit(): void {
    this.setConsumptionTypeId(CloudHubConstants.CONSUMPTION_USAGE_BASED);
    this.productItemDetails.productType = ProductCategory.managePlan;

    this.planInfo = JSON.parse(this._commonService.getFromLocalStorge('resellerplaninfo'));
    this.pageInfo.updateBreadcrumbs(['PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS', this.planInfo.PlanName ? { value: this.planInfo.PlanName, removeLocalization: true } : ''])
    this.pageInfo.updateTitle(this._translateService.instant("PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS"), true);
    if (this.planInfo != null && this.planInfo != undefined) {
      this.planId = this.planInfo.PlanID;
    }
    if (this._commonService.getFromLocalStorge('usageMacroTypeId') != undefined && this._commonService.getFromLocalStorge('usageMacroTypeId') != null) {
      this.planInfo.UsageMacroTypeId = parseInt(this._commonService.getFromLocalStorge('usageMacroTypeId'));
    }
    if (this._commonService.getFromLocalStorge('usageMacroValue') != undefined && this._commonService.getFromLocalStorge('usageMacroValue') != null) {
      this.planInfo.UsageMacroValue = parseInt(this._commonService.getFromLocalStorge('usageMacroValue'));
    }
    let macro = localStorage.getItem('selectedMacro') ? JSON.parse(localStorage.getItem('selectedMacro')) : null;
    this.selectedMacro = macro;
    this.percentValue = this.planInfo && this.planInfo.UsageMacroValue ? this.planInfo.UsageMacroValue : 0;

    if (!this.isMacroAppliedThroughMainButton) {
      this.isMacroAppliedThroughMainButton = {};
    }
    // this.pageInfo.updateBreadcrumbs(['PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS', this.planInfo.Name ? { value: this.planInfo.Name, removeLocalization: true } : ''])
    // this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.plans", true));

    this.getMacroTypes();
    this.filterSelectedProductsByKeyword();
  }

  onAction(product: any, action: string, parameters: any) {
    switch (action) {
      case 'delete':
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

  catchSelectedProductsSearchKeywordChange() {
    this.productItemDetails.searchKeyword = this.searchSelectedProductsKeyword;
    this.reloadSelectedProducts = true;
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.filterSelectedProductsByKeyword();
    }, 500); 
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
          this.isMacroAppliedThroughMainButton.CurrentAzureMacro = MacroName;
          this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue = usageMacro.MacroValue;
        }
        this.selectedMacro = _.find(this.macros, { 'ID': parsedJsonData[0].MacroId });
        this.percentValue = (parsedJsonData[0].MacroValue || 0);
        this.isPrice = false;
      }
      else {
        product.IsPrice = true;
        this.localAzurePlanOffersWithNoMacro.push(product.PlanProductId);
        // this.selectedMacro = null;
        // this.applyMacroDetails = this.applyMacroDetails.filter(e => e.SelectedCategoryName.toLowerCase() != this.selectedConsumptionType.toLowerCase())
        // this.isPrice = true;
        // this.isMacroAppliedThroughMainButton.CurrentAzureMacro = null;
        // this.isMacroAppliedThroughMainButton.CurrentAzureMacroValue = null;
      }
      const subscription = this._resellerPlansListingService.getPlanOfferCurrencyRates(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        this.offerPriceListData = JSON.parse(reqBody.PriceData);
        let successMessage = this._translateService.instant("TRANSLATE.RESELLER_ADD_PLAN_SUCCESS_TEXT_PRICE_UPDATED_SUCCESSFULLY")
        const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
        this._notifierService.success({ title: this._translateService.instant("TRANSLATE.RESELLER_ADD_PLAN_SUCCESS_PROMPT_HEADER_TEXT_SUCCESS"), text: successMessage, confirmButtonText: btnok });
        this.reloadSelectedProducts = true;
        if (parsedJsonData[0].MacroId) {
          if (priceChangeData.SelectedConsumptionType === 'usage' && priceChangeData.CategoryName === 'AzurePlan') {
            this.planInfo.UsageMacroTypeId = parsedJsonData[0].MacroId
            this.planInfo.UsageMacroValue = parsedJsonData[0].MacroValue;
          } else {
            this.planInfo.MacroTypeId = parsedJsonData[0].MacroId
            this.planInfo.MacroValue = parsedJsonData[0].MacroValue;
          }
        }
        this.filterSelectedProductsByKeyword();
      })
      this._subscriptionArray.push(subscription);
    }).catch((reason) => {
      console.log('Dismissed: ', reason);
    });
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
        this.temp.show = true;
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
