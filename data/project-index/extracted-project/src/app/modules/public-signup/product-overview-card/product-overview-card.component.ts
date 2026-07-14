import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModal, NgbModalOptions, NgbModule, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { NameSymbolPipe } from 'src/app/shared/pipes/name-symbol.pipe';
import { PartnerModule } from '../../partner/partner.module';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import * as _ from 'lodash';
import { CurrencyPipe } from "../../../shared/pipes/currency.pipe";
import { MODAL_DIALOG_CLASS, PromotionDetailsPopupConfig } from 'src/app/shared/models/promoton-details.model';
import { PromotionDetailComponent } from '../../standalones/promotion-detail/promotion-detail.component';

@Component({
  selector: 'app-product-overview-card',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    FormsModule,
    NgbTooltipModule,
    NgbModule,
    TranslateModule,
    CurrencyPipe,
    PartnerModule,
    NameSymbolPipe,
    NgbTooltip,
    LimitLengthPipe,
    FormatforInitialsPipe,
  ],
  templateUrl: './product-overview-card.component.html',
  styleUrl: './product-overview-card.component.scss'
})
export class ProductOverviewCardComponent implements OnInit {
  @Input() public product: any;
  selectAllAddons = false;
  constructor(
    private _modalService: NgbModal,
    public activeModal: NgbActiveModal,
    public _notifierService: NotifierService,
    public _commonService: CommonService,
    public _translateService: TranslateService
  ) {

  }

  get cloudHubConstants() {
    return CloudHubConstants;
  }

  ngOnInit(): void {
    this.addQuanityForAddons(this.product);
  }

  addQuanityForAddons(product: any) {
    if (product.Addons != undefined && product.Addons != null) {
      this.product.Addons.forEach((item) => {
        item.Quantity = 1;
        if (item.Addons != undefined && item.Addons != null){
          this.addQuanityForAddons(item);
        }
      })
    }
  }
  callLinkedProductPromotionDetails(product: any) {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    promotionDetailsConfig.Name = product.PromotionName,
      promotionDetailsConfig.PromotionalId = product.PromotionID,
      promotionDetailsConfig.Description = product.PromotionDescription,
      promotionDetailsConfig.Validity = product.Validity,
      promotionDetailsConfig.ValidityType = product.ValidityType,
      promotionDetailsConfig.BillingCycleName = product.BillingCycleName,
      promotionDetailsConfig.BillingCycleDescriptionKey = product.BillingCycleDescription,
      promotionDetailsConfig.Discount = product.PromotionDiscount,
      promotionDetailsConfig.DiscountType = product.PromotionDiscountType,
      promotionDetailsConfig.EndDate = product.PromotionEndDate,
      promotionDetailsConfig.ShowPublicSignupApplyButton = true

    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
      if (result?.action === "publicsignup-apply-promotion") {
        // integer id in cart
        product.PromotionIntIdInCart = product.PromotionIntID;
      }
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }
  gotocart() {
    this.activeModal.close({ prodct: null, action: 'gotocart' });
  }
  addtocart(product: any) {
    if (!this.selectAllAddons) {
      product.Addons = this.filterSelectedAddons(product.Addons);
    } else {
      product.Addons = product.Addons;
    }
    if (product.ProviderName.toLowerCase() === CloudHubConstants.PROVIDER_MICROSOFT_NON_CSP) {
      this.addNonCSPOfferDetails(product);
    }
    this.activeModal.close({ product: product, action: 'addtocart' });

  }
  filterSelectedAddons(addons) {
    return _.filter(addons, addon => {
      if (addon.IsChecked) {
        addon.Addons = this.filterSelectedAddons(addon.Addons);
        return addon.IsChecked;
      }
    });
  }
  addNonCSPOfferDetails(product: any) {

  }
  gotoList() {
    this.activeModal.close();
  }
  setIsChecked(addons, selectAllAddons) {
    return _.map(addons, each => {
      if (each.Addons) {
        each.Addons = this.setIsChecked(each.Addons, selectAllAddons);
      }
      each.IsChecked = selectAllAddons;
      return each;
    });
  }
  setIsCheckedForAddons(product: any) {
    product.Addons = this.setIsChecked(product.Addons, this.selectAllAddons);

  }

  toggleSelectAllAddons(addon: any) {
    if (!addon.IsChecked) {
      this.selectAllAddons = false;
    }
  }

  showPromotionDetail(product: any) {
    let promotionDetails = {
     Name : product.PromotionName,
     PromotionalId : product.PromotionID,
     Description : product.PromotionDescription,
     Validity : product.Validity,
     ValidityType : product.ValidityType,
     BillingCycleName : product.BillingCycleName,
     BillingCycleDescriptionKey : product.BillingCycleDescription,
     Discount : product.PromotionDiscount,
     DiscountType : product.PromotionDiscountType,
     EndDate : product.PromotionEndDate,
     ShowPublicSignupApplyButton : true
    }
    const modalRef = this._modalService.open(PromotionDetailComponent, { size: 'lg' });
    modalRef.componentInstance.promotionDetail = promotionDetails
  }

  showLinkedProductPromotionDetail(product: any) {
    let promotionDetails = {
      Name: product.NCELinkedProductPromotionName,
      PromotionalId: product.NCELinkedProductPromotionID,
      Description: product.NCELinkedProductPromotionDescription,
      Validity: product.Validity,
      ValidityType: product.ValidityType,
      BillingCycleName: product.BillingCycleName,
      BillingCycleDescriptionKey: product.BillingCycleDescription,
      Discount: product.NCELinkedProductPromotionDiscount,
      DiscountType: product.NCELinkedProductPromotionDiscountType,
      EndDate: product.NCELinkedProductPromotionEndDate
    }
    const modalRef = this._modalService.open(PromotionDetailComponent, { size: 'lg' });
    modalRef.componentInstance.promotionDetail = promotionDetails
  }

}
