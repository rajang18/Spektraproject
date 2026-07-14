import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { MegaNumberPipe } from 'src/app/shared/pipes/meganumber.pipe';
import { TranslationModule } from '../../i18n';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { PromotionDetailComponent } from '../../standalones/promotion-detail/promotion-detail.component';
import { CommonNoRecordComponent } from "../../standalones/common-no-record/common-no-record.component";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-public-signup-baseoffer-popup',
  standalone: true,
  imports: [CommonModule, TranslationModule, CurrencyPipe, MegaNumberPipe, C3CommonModule, NgbModule, ScrollingModule, CommonNoRecordComponent, FormsModule],
  templateUrl: './public-signup-baseoffer-popup.component.html',
  styleUrl: './public-signup-baseoffer-popup.component.scss'
})
export class PublicSignupBaseofferPopupComponent implements OnInit {
  @Input() baseOffers: any[] = [];
  selectedBaseOfferForAddon: any = {};
  SearchValue: any;
  baseOffersData: any;
  constructor(private _modalService: NgbModal,
    private activeModal: NgbActiveModal
  ) { }

ngOnInit(): void {
    this.baseOffersData = this.baseOffers;
  }

  addBaseOfferToCart(product: any) {
    this.selectedBaseOfferForAddon = product;
  }

  submit() {
    this.activeModal.close(this.selectedBaseOfferForAddon);
  }

  closeModal() {
    this.selectedBaseOfferForAddon = {};
    this._modalService.dismissAll('cancel');
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

  skip() {
    // skipping the base offers if customer wants to go with add-on only 
    this.activeModal.close();
  }

  searchBasedOnValue() {
    const value = this.SearchValue?.toLowerCase().trim();
 
    if (!value) {
      this.baseOffersData = [...this.baseOffers];
    } else {
      this.baseOffersData = this.baseOffers.filter(offer =>
        offer.Name?.toLowerCase().includes(value)
      );
    }
  }
}
