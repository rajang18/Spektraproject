import { CommonModule } from '@angular/common';
import { Component, OnDestroy} from '@angular/core';
import { NgbModal, NgbModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductBaseComponent } from '../../models/product-base-component';
import { ProductService } from 'src/app/services/product.service';
import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { CurrencyPipe } from '../../../../../shared/pipes/currency.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-trial-offers',
  standalone: true,
  imports: [NgbModule,TranslateModule,CurrencyPipe,CommonModule,NgbPopoverModule,C3CommonModule],
  templateUrl: './trial-offers.component.html',
  styleUrl: './trial-offers.component.scss'
})
export class TrialOffersComponent extends ProductBaseComponent implements OnDestroy {

  isInPartnerOrResellerProductCatalogueView:boolean
  constructor(
    private permissionService:PermissionService,
    public _modalService: NgbModal,
    public productService:ProductService,
    public _notifierService: NotifierService,
    public _commonService:CommonService,
    public _translateService:TranslateService,
    public _plansListingService: PlansListingService    
  ){
    super(productService,_modalService,_notifierService,_commonService,_translateService,_plansListingService);
    this.hasPermission();
  }

  trialOfferParentProductDetails: any = null;
  trialOfferParentProductResult: any[] = [];
  Permissions = {
    HasEditPlan: "Denied",
    HasGetProducts: "Denied",
    HasGetProductCatalogue: "Denied",
    HasLinkProduct: "Denied",
    AreNcePromotionsEnabled: "Denied",
    HasFilterTrailOffer: "Denied",
    HasFilterShowPromotionOffer: "Denied",
    HasPlanOffersGridDownloadableReports : "Denied",
  };

  hasPermission() {
    this.Permissions.HasGetProductCatalogue = this.permissionService.hasPermission(this.cloudHubConstants.GET_PRODUCT_CATALOGUE);
    this.Permissions.HasGetProducts = this.permissionService.hasPermission(this.cloudHubConstants.GET_PRODUCTS);
    this.Permissions.HasLinkProduct = this.permissionService.hasPermission(this.cloudHubConstants.LINK_PRODUCT);
    this.Permissions.HasPlanOffersGridDownloadableReports = this.permissionService.hasPermission(this.cloudHubConstants.BTN_PLAN_OFFERS_GRID_DOWNLOADABLE_REPORTS);
    this.Permissions.AreNcePromotionsEnabled = this.permissionService.hasPermission(this.cloudHubConstants.ARE_NCE_PROMOTIONS_ENABLED);
    this.Permissions.HasFilterTrailOffer = this.permissionService.hasPermission(this.cloudHubConstants.GET_PARTNER_TRIAL_OFFER_FILTER);
    this.Permissions.HasFilterShowPromotionOffer = this.permissionService.hasPermission(this.cloudHubConstants.FILTER_SHOW_PROMOTION_OFFER);
  }
  

  getTrialOfferParentOfferDetails(productDetails: any): void {
    this.trialOfferParentProductDetails = null;
    const reqBody:any = {
      ProductVariantId : productDetails.ProductForTrial,
      PlanProductId : null,
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
      const sub = this._plansListingService.getTrialOfferParentOfferDetails(reqBody)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response:any) => {
        this.trialOfferParentProductDetails = response.Data;
        this.trialOfferParentProductResult.push(this.trialOfferParentProductDetails);
        localStorage.setItem('ProductOfferTrialOfferParentDetailsResult', JSON.stringify(this.trialOfferParentProductResult));
      });
      this._subscription.push(sub);
    }
  } 
  
  
}
