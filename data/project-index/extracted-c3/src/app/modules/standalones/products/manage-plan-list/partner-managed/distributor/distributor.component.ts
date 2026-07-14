import { ChangeDetectorRef, Component, OnInit } from '@angular/core'; 
import { ProductService } from 'src/app/services/product.service';
import { NgbModal, NgbModalOptions, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { PermissionService } from 'src/app/services/permission.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { ProductBaseComponent } from '../../../models/product-base-component';
import { FormsModule } from '@angular/forms';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/report-popup.model';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-distributor',
  standalone: true,
  imports: [NgbModule, TranslateModule, CurrencyPipe,C3CommonModule,CommonModule, FormsModule],
  templateUrl: './distributor.component.html',
  styleUrl: './distributor.component.scss'
})
export class ManagedDistributorComponent extends ProductBaseComponent implements OnInit {
  isInPartnerOrResellerProductCatalogueView:boolean;
  searchKeyword:string;
  savePlan:string;
  linkProduct: string;

  constructor(public cdRef: ChangeDetectorRef,
    private permissionService:PermissionService, 
    public _modalService: NgbModal,
    public _notifierService: NotifierService,
    public _commonService:CommonService,
    public productService:ProductService,
    public _translateService:TranslateService,
    public plansListingService: PlansListingService    
  )
  {
     super(productService,_modalService,_notifierService,_commonService,_translateService,plansListingService);
  }

  ngOnInit(){
    if(this.product){
      this.product.currentUserRole = this._commonService.entityName;
    }
    this.linkProduct = this.permissionService.hasPermission('LINK_PRODUCT');
    this.savePlan = this.permissionService.hasPermission('BTN_SAVE_OR_UPDATE_PLAN'); 

  }

  checkNcePromotionDetails(product:any){

  }

   checkNceLinkedPromotionDetails(product: any) {
       let promotionDetails = {
         Name: product.PromotionName,
         PromotionalId: product.NCEPromotionID,
         Description: product.PromotionDescription,
         Validity: product.Validity,
         ValidityType: product.ValidityType,
         BillingCycleName: product.BillingCycleName,
         BillingCycleDescriptionKey: product.BillingCycleDescriptionKey,
         Discount: product.PromotionDiscount,
         DiscountType: product.PromotionDiscountType,
         EndDate: product.PromotionEndDate
       }
       /* selecting Size of popup based on condition */
       const config: NgbModalOptions = {
         modalDialogClass: MODAL_DIALOG_CLASS,
       };
       const modalRef = this._modalService.open(PromotionDetailComponent, { size: 'lg',modalDialogClass:'h-73vh' });
       modalRef.componentInstance.promotionDetail = promotionDetails
   
     }

  Onblur(product){
    $('.salePriceValue').blur();
    product.edit = false;
    if(product.Addons != undefined){
      product.addon.edit = false;
    }
    
    if(product.LinkedProduct != undefined){
      product.LinkedProduct.edit = false;
    } 
  }
}
