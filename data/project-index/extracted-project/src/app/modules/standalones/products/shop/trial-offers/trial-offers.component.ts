import { ShopBaseComponent } from '../../models/shop-base-component';
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModule, NgbTooltipModule,NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe'; 
import { FormsModule } from '@angular/forms';
import { PermissionService } from 'src/app/services/permission.service';
import { LimitLengthWithoutDotPipe } from 'src/app/shared/pipes/limitLentgthWithoutDot.pipe';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { ProductService } from 'src/app/services/product.service';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { ShopService } from 'src/app/modules/customers/services/shop.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { Subscription, takeUntil } from 'rxjs';



@Component({
  selector: 'app-trial-offers',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule, NgbModule, TranslateModule, CurrencyPipe,NgbPopoverModule, FormsModule,NgbTooltip,
    LimitLengthWithoutDotPipe,NgbTooltip,FormatforInitialsPipe, C3CommonModule],
  templateUrl: './trial-offers.component.html',
  styleUrl: './trial-offers.component.scss'
})
export class ShopTrialOffersComponent extends ShopBaseComponent implements OnDestroy{
   
  savePlan: string;
  AreNcePromotionsEnabled: string;
  constructor(
    private permissionService:PermissionService,
    public _modalService: NgbModal,
    public productService:ProductService,
  private _plansListingService:PlansListingService,
    public _shopService: ShopService,
    public _notifierService: NotifierService,
    public _commonService: CommonService,
    public _translateService: TranslateService
  ){
    super();
  }
  ngOnInit() {
    this.savePlan = this.permissionService.hasPermission('BTN_ADD_TO_CART');
    this.AreNcePromotionsEnabled = this.permissionService.hasPermission('ARE_NCE_PROMOTIONS_ENABLED');
  }
  alert(msg: string) {
    alert(msg);
  }

  trialOfferParentProductDetails: any = null;
  trialOfferParentProductResult: any[] = [];
  

  getTrialOfferParentOfferDetails(productDetails: any): void {
    this.trialOfferParentProductDetails = null;
    const reqBody:any = {
      ProductVariantId : null,
      PlanProductId : productDetails.ProductForTrial,
      CurrencyCode : productDetails.CurrencyCode
    };

    if (localStorage.getItem('ProductOfferTrialOfferParentDetailsResult')) {
      localStorage.removeItem('ProductOfferTrialOfferParentDetailsResult');
    }

    const localStorageData = localStorage.getItem('ProductOfferTrialOfferParentDetailsResult');
    if (localStorageData) {
      const trialOfferParentLocalStorage = JSON.parse(localStorageData);
      trialOfferParentLocalStorage.forEach((trialOffer: any) => {
        if (trialOffer.ProductVariantId === productDetails.ProductForTrial && this.trialOfferParentProductDetails == null) {
          this.trialOfferParentProductDetails = trialOffer;
        }
      });
    }

    if (this.trialOfferParentProductDetails == null) {
      const subscription = this._plansListingService.getTrialOfferParentOfferDetails(reqBody)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response:any) => {
        this.trialOfferParentProductDetails = response.Data;
        this.trialOfferParentProductResult.push(this.trialOfferParentProductDetails);
        localStorage.setItem('ProductOfferTrialOfferParentDetailsResult', JSON.stringify(this.trialOfferParentProductResult));
      });
      this._subscription.push(subscription);
    }
  }

   

}





 