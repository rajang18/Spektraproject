import { ChangeDetectorRef, Component, OnDestroy, OnInit, } from '@angular/core';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PlansListingService } from '../../../services/plans-listing.service';
import { ProductCategory, ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { ProductService } from 'src/app/services/product.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import _ from 'lodash';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { AddPlanBase } from '../../../model/add-plan-base';
import { FileService } from 'src/app/services/file.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { ToastService } from 'src/app/services/toast.service';
import { AddPlanPriceChangeComponent } from 'src/app/modules/standalones/add-plan-price-change/add-plan-price-change.component';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrl: './usage.component.scss'
})
export class UsageComponent extends AddPlanBase implements OnInit, OnDestroy {
  selectedProvider: any;
  selectedCategory: any;
  selectedConsumptionTypeId: any;
  dbSelectedOffersSearchCount: number;
  filter: string;
  productItemDetails: ProductItemDetails = new ProductItemDetails();
  offerPriceListData: any;


  constructor(
    public pageInfo: PageInfoService,
    public _router: Router,
    public _commonService: CommonService,
    public _permissionService: PermissionService,
    public _planService: PlansListingService,
    public _cdref: ChangeDetectorRef,
    public _dynamicTemplateService: DynamicTemplateService,
    public _productService: ProductService,
    public _modalService: NgbModal,
    public _translateService: TranslateService,
    public _notifierService: NotifierService,
    public _toastService: ToastService,
    public _fileService: FileService,
    public _appService: AppSettingsService,
  ) {
    super(pageInfo, _router, _commonService, _permissionService, _planService, _cdref, _dynamicTemplateService, _productService, _modalService, _translateService, _notifierService, _toastService, _fileService, _appService);
    this.productItemDetails.productType = ProductCategory.managePlan;
  }

  ngOnInit(): void {
    this.setConsumptionTypeId(CloudHubConstants.CONSUMPTION_USAGE_BASED);
    this.planInfo = JSON.parse(this._commonService.getFromLocalStorge('planinfo'));
    if (this._commonService.getFromLocalStorge('macroTypeId') != undefined && this._commonService.getFromLocalStorge('macroTypeId') != null) {
      this.planInfo.MacroTypeId = parseInt(this._commonService.getFromLocalStorge('macroTypeId'));
    }
    if (this._commonService.getFromLocalStorge('macroValue') != undefined && this._commonService.getFromLocalStorge('macroValue') != null) {
      this.planInfo.MacroValue = parseFloat(this._commonService.getFromLocalStorge('macroValue'));
    }
    this.pageInfo.updateBreadcrumbs(['PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS', this.planInfo.Name ? { value: this.planInfo.Name, removeLocalization: true } : ''])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.BUTTON_MANAGE_PRODUCT"), true);
    //this.reloadSelectedProducts = true;
    //this.selectedProducts = [];
    this.filterSelectedProductsByKeyword();
    //this.productItemDetails.productType = "managePlan";
  }

  onAction(product: any, action: string, parameters: any) {
    switch (action) {
      case 'delete':
      case 'edit':
      case 'deleteAddons':
        this.editOrDeleteProduct(product, action);
        break;
      case 'priceChange':
        this.preProcessPriceChange(product);
        break;
    }
  }
  preProcessPriceChange(product: any) {
    let priceChangeData = {
      Name: product.Name,
      PlanProductId: product.PlanProductId,
      BillingTypeName: product.BillingTypeName,
      CurrencyCode: product.CurrencyCode,
      CategoryName: product.CategoryName
    };
    const modalRef = this._modalService.open(AddPlanPriceChangeComponent);
    modalRef.componentInstance.data = priceChangeData;
    modalRef.result.then((response) => {
      if (response) {
        let reqBody: any = { PriceData: response.SearchCriteria.searchCriteriaString };
        const subscription = this._planService.planOfferCurrencyRatesUpdate(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          this.offerPriceListData = JSON.parse(reqBody.PriceData);
          product.SalePrice = this.offerPriceListData[0].NewPrice;

          this._notifierService.success({ title: this._translateService.instant("TRANSLATE.RESELLER_ADD_PLAN_SUCCESS_TEXT_PRICE_UPDATED_SUCCESSFULLY") })
          this.reloadSelectedProducts = true;
          this.filterSelectedProductsByKeyword();
        })
        this._subscriptionArray.push(subscription);
      }
    }).catch((reason) => {
      console.log('Dismissed: ', reason);
    });
    product.ShouldApplyMacro = false;
  }

  ngOnDestroy(): void {
    this._dynamicTemplateService.sendTemplate(null);
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());

  }

}
