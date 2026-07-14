import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import _ from 'lodash';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Component({
  selector: 'app-azure-entitlement-level-price-change-popup',
  standalone: true,
  imports: [NgbModule, TranslateModule, CurrencyPipe, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './azure-entitlement-level-price-change-popup.component.html',
  styleUrl: './azure-entitlement-level-price-change-popup.component.scss'
})
export class AzureEntitlementLevelPriceChangePopupComponent implements OnInit {
  data: any
  simpleForm: FormGroup;
  buttonClicked = false;
  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
  ) {
    this.simpleForm = this.fb.group({
      newPrice: [null, [Validators.required, Validators.min(-100), Validators.max(100)]],
    });
  }

  ngOnInit(): void {
    if(this.data?.BillingTypeName.toLowerCase()==CloudHubConstants.BILLING_TYPE_MS_COST_PERCENTAGE.toLowerCase()){
      this.simpleForm.get('newPrice')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      this.simpleForm.get('newPrice')?.updateValueAndValidity()
    }
  }

  trimInputToFourDigits(event: any): void {
    const input = (event.target as HTMLInputElement);
    let value = input.value;

    // Check if the input has a decimal point
    if (value.includes('.')) {
      const [integerPart, decimalPart] = value.split('.');
      // Trim the decimal part to 4 digits
      if (decimalPart.length > 4) {
        input.value = `${integerPart}.${decimalPart.slice(0, 4)}`;
      }
    }
  }

  blockInvalidChars(event: KeyboardEvent) {
    const currentValue = (event.target as HTMLInputElement).value;
    // Allow '-' only at the beginning and block 'e', 'E', '+'
    if (['e', 'E', '+'].includes(event.key) || (event.key === '-' && currentValue.length > 0)) {
        event.preventDefault();
    }
  }

  ok() {
    this.buttonClicked = true;
    if (this.simpleForm.valid) {
      let result = { newPrice: this.simpleForm.get("newPrice").value }
      this.activeModal.close(result);
    };
  }

  cancel() {
    this.activeModal.close();
  }
}

