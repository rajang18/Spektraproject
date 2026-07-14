import { ChangeDetectorRef, Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductBaseComponent } from '../../models/product-base-component';
import { ProductService } from 'src/app/services/product.service';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; 
import { PermissionService } from 'src/app/services/permission.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { FormsModule } from '@angular/forms';
import {  CurrencyPipe } from "../../../../../shared/pipes/currency.pipe";
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { ToastService } from 'src/app/services/toast.service';
@Component({
  selector: 'app-azure-plan',
  standalone: true,
  imports: [NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, CommonModule, FormsModule, CurrencyPipe ],
  templateUrl: './azure-plan.component.html',
  styleUrl: './azure-plan.component.scss'
})
export class ManageAzurePlanComponent extends ProductBaseComponent{
  isInPartnerOrResellerProductCatalogueView: boolean;
  savePlan: string;


  constructor(public cdRef: ChangeDetectorRef,
    private permissionService: PermissionService,
    public _modalService: NgbModal,
    public productService: ProductService,
    public _notifierService: NotifierService,
    public _commonService: CommonService,
    public _translateService: TranslateService,
    public plansListingService: PlansListingService,
    private _toasterService: ToastService  
  ) {
    super(productService, _modalService, _notifierService, _commonService, _translateService,plansListingService);
  }

  ngOnInit() {
    //this.permissionService.hasPermission(key)
    this.savePlan = this.permissionService.hasPermission('BTN_SAVE_OR_UPDATE_PLAN');
  }

  Onblur(product){
    $('.salePriceValue').blur();
    if(product.CategoryName.toLowerCase() === this.cloudHubConstants.CATEGORY_AZURE_PLAN && product.BillingTypeId == this.billingTypes.find(item=>item.Name.toLowerCase() === this.cloudHubConstants.BILLING_TYPE_MS_COST_PERCENTAGE)?.Id && product.SalePrice < 0){
      this._toasterService.error(this._translateService.instant('TRANSLATE.BILLING_TYPE_DESC_MS_COST_PERCENTAGE_SALE_PRICE_WARNING'));
      product.edit = true;
      setTimeout(() => {
        this.salePriceInput?.nativeElement.focus();
      }, 100);
      if (product.Addons != undefined) {
          product.Addons.edit = true;
      }
      if (product.LinkedProduct != undefined) {
          product.LinkedProduct.edit = true;
      }
      product.SalePrice = 0;
      return;
    }
    product.edit = false;
    if(product.Addons != undefined){
      product.Addons.edit = false;
    }
    
    if(product.LinkedProduct != undefined){
      product.LinkedProduct.edit = false;
    } 
  } 
}
