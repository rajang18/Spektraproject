import { ChangeDetectorRef, Component } from '@angular/core'; 
import { NgbModal, NgbModalOptions, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductBaseComponent } from '../../../models/product-base-component';
import { PermissionService } from 'src/app/services/permission.service';
import { ProductService } from 'src/app/services/product.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/report-popup.model';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-trial-offer',
  standalone: true,
  imports: [NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, CommonModule, FormsModule],
  templateUrl: './trial-offer.component.html',
  styleUrl: './trial-offer.component.scss'
})
export class ManageTrialOfferComponent extends ProductBaseComponent {
  isInPartnerOrResellerProductCatalogueView:boolean;
  searchKeyword:string;
  savePlan:string;
  linkProduct: string;

  constructor(public cdRef: ChangeDetectorRef,
    private permissionService:PermissionService,
    public productService:ProductService,
    public _modalService: NgbModal,
    public _notifierService: NotifierService,
    public _commonService:CommonService,
    public _translateService:TranslateService,
    public plansListingService: PlansListingService    
  ){
    super(productService,_modalService,_notifierService,_commonService,_translateService,plansListingService);
  }

  ngOnInit(){
    if(this.product){
      this.product.currentUserRole = this._commonService.entityName;
    }
    this.savePlan = this.permissionService.hasPermission('BTN_SAVE_OR_UPDATE_PLAN');
    this.linkProduct = this.permissionService.hasPermission('LINK_PRODUCT');
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
}
