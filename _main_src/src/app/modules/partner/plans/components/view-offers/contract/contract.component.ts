import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PlansListingService } from '../../../services/plans-listing.service';
import { ProductCategory, ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { ProductService } from 'src/app/services/product.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import _ from 'lodash';
import { ToastService } from 'src/app/services/toast.service';
import { AddPlanBase } from '../../../model/add-plan-base';
import { FileService } from 'src/app/services/file.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { EditableContractDetailsComponent } from 'src/app/modules/standalones/editable-contract-details/editable-contract-details.component';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-contract',
  templateUrl: './contract.component.html',
  styleUrl: './contract.component.scss'
})
export class ContractComponent extends AddPlanBase implements OnInit, OnDestroy {
  lazyLoadedProducts: any[] = [];
  productItemDetails: ProductItemDetails = new ProductItemDetails();
  searchSelectedProductsKeyword: string = '';
  selectedProducts: any[] = [];
  selectedProductsFromDB: any[] = [];
  newProductsInPlan: any[] = [];
  updatedProductsInPlan: any[] = [];


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
    protected _appService: AppSettingsService,

  ) {
    super(pageInfo, _router, _commonService, _permissionService, _planService, _cdref, _dynamicTemplateService, _productService, _modalService, _translateService, _notifierService, _toastService, _fileService, _appService);

  }
  ngOnInit(): void {
    this.setConsumptionTypeId(CloudHubConstants.CONSUMPTION_CONTRACT);
    this.planInfo = JSON.parse(this._commonService.getFromLocalStorge('planinfo'));
    this.productItemDetails.productType = ProductCategory.managePlan;
    if (this._commonService.getFromLocalStorge('macroTypeId') != undefined && this._commonService.getFromLocalStorge('macroTypeId') != null) {
      this.planInfo.MacroTypeId = parseInt(this._commonService.getFromLocalStorge('macroTypeId'));
    }
    if (this._commonService.getFromLocalStorge('macroValue') != undefined && this._commonService.getFromLocalStorge('macroValue') != null) {
      this.planInfo.MacroValue = parseFloat(this._commonService.getFromLocalStorge('macroValue'));
    }
    this.pageInfo.updateBreadcrumbs(['PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS', this.planInfo.Name ? { value: this.planInfo.Name, removeLocalization: true } : ''])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.BUTTON_MANAGE_PRODUCT"), true);
    this.filterSelectedProductsByKeyword();
    // this.productItemDetails.productType = "managePlan"; 
  }



  onAction(product: any, action: string, parameters: any) {
    switch (action) {
      case 'linksubscription':
        //this.linkSubscription(product);
        break;
      case 'delete':
      case 'edit':
      case 'deleteAddons':
        this.editOrDeleteProduct(product, action);
        break;
      case 'priceChange':
        //this.preProcessPriceChange(product);
        break;
      case 'getContractDetailsEditable':
        this.getContractDetails(product);
        break
      case 'saveSlabs':
        this.savePlanProductSlabs(product);
    }
  }

 


  getContractDetails(product: any) {
    const modalRef = this._modalService.open(EditableContractDetailsComponent, { size: 'xl' });
    modalRef.componentInstance.product = product;
    modalRef.componentInstance.currencyCode = this.planInfo.CurrencyCode;
    modalRef.result.then((result) => {
      if (result) {
        product.Slabs = result;
        if (!product.PlanProductId) {
          this.onAction(product, 'edit', null);
        } else {
          this.onAction(product, 'saveSlabs', null);
        }
      }
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  savePlanProductSlabs(product) {
    var reqObj = {
      PlanProductId: product.PlanProductId,
      ProductVariantId: product.ProductVariantId,
      CurrencyCode: product.CurrencyCode,
      Slabs: JSON.stringify(product.Slabs)
    };
    const subscription = this._planService.savePlanProductSlabs(reqObj).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this._notifierService.success({ title: this._translateService.instant('TRANSLATE.PLAN_PRODUCTS_SLABS_SUCCESS_MESSAGE'), confirmButtonColor: 'green' })
    })
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    this._dynamicTemplateService.sendTemplate(null);
    super.ngOnDestroy();
  }
}
