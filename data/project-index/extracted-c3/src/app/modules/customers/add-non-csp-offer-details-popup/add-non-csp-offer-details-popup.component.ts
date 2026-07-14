import { Component, Input, OnDestroy, OnInit} from '@angular/core';
import { CommonModule} from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule} from '@ngx-translate/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';

@Component({
  selector: 'app-add-non-csp-offer-details-popup',
  standalone: true,
  imports: [CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule],
  templateUrl: './add-non-csp-offer-details-popup.component.html',
  styleUrl: './add-non-csp-offer-details-popup.component.scss'
})
export class AddNonCspOfferDetailsPopupComponent implements OnInit, OnDestroy{
  @Input() public product: any;

  nonCSPOfferDetailsRegisterForm: FormGroup;
  buttonClicked = false;
  private unsubscribe$ = new Subject<void>();

  constructor(
    public activeModal: NgbActiveModal,
    private _formBuilder: FormBuilder,
    private _unsavedChangesService:UnsavedChangesService
  ) {
    this.nonCSPOfferDetailsRegisterForm = this._formBuilder.group({
      SubscriptionId: ['', [Validators.required, Validators.maxLength(50)]],
      SubscriptionName: ['', Validators.required],
      ServicePrincipalId: ['', [Validators.required, Validators.maxLength(50)]],
      ServicePrincipalKey: ['', Validators.required]
    });

  }

  ngOnInit(): void {
  }

  addtoCart(product: any) {
    this.buttonClicked = true;
    if (this.nonCSPOfferDetailsRegisterForm.valid) {
      const providerSettings = {
        SubscriptionId: this.nonCSPOfferDetailsRegisterForm.get("SubscriptionId")?.value,
        SubscriptionName: this.nonCSPOfferDetailsRegisterForm.get("SubscriptionName")?.value,
        ServicePrincipalId: this.nonCSPOfferDetailsRegisterForm.get("ServicePrincipalId")?.value,
        ServicePrincipalKey: this.nonCSPOfferDetailsRegisterForm.get("ServicePrincipalKey")?.value
      };

      product.ProviderSettings = providerSettings; // assigning as JSON object, not a string
      this.activeModal.close(product);
    }
  }
  closeModalPopup() {
    this.activeModal.close();
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
