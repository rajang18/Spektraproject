import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbAccordionDirective, NgbAccordionItem, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-po-number-popup',
  standalone: true,
  imports: [CommonModule,TranslateModule,FormsModule, NgbAccordionDirective, NgbAccordionItem, NgbAccordionModule],
  templateUrl: './trial-quantity-popup.component.html',
  styleUrl: './trial-quantity-popup.component.scss'
})
export class TrialQuantityPopupComponent {
  isPurchaseTrialOffer: boolean = false;
  validate = false;
  quantity: number = 0;
  constructor(private _modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private _formBuilder: FormBuilder,
  ) {

  }

  getTrialOfferPurchaseStatus(isPurchaseTrialOffer: boolean) {
    this.isPurchaseTrialOffer = isPurchaseTrialOffer;
  }

  skip() {
    this.quantity = null;
    this.activeModal.close(this.quantity);
  }

  submit() {
    let result = { Quantity: 1 };
    this.activeModal.close(result);
  }

  closeModalPopup() {
    this._modalService.dismissAll('cancel');
  }
}
