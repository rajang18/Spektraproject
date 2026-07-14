import { Component, HostListener, Input, NgModule } from '@angular/core';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Subject, Subscription, takeUntil, finalize } from 'rxjs';
import { TranslationModule } from 'src/app/modules/i18n';
import { PaymentProfileService } from '../../home/profile/services/paymentprofile.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonService } from 'src/app/services/common.service';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-validate-bank-account-popup-component',
  standalone: true,
  imports: [TranslationModule,
    FormsModule,ReactiveFormsModule, CommonModule],
  templateUrl: './validate-bank-account-popup-component.component.html',
  styleUrl: './validate-bank-account-popup-component.component.scss'
})
export class ValidateBankAccountPopupComponentComponent {
  @Input() bankAccount: any;
  @Input() customerC3Id: any;
  @Input() paymentAccountDetails: any;
   @Input() verificationUrl!: string;
  slabData: any[] = [];
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];
  achOne: number;
  achTwo: number;
  entityName: string;
  recordId: string;
  testAmount: FormGroup;
  safeUrl!: SafeResourceUrl;
  isSubmitting = false;
  iframeLoaded = false;
  constructor(
    private _modalService: NgbModal,
    private _notifierService: NotifierService,
    private translateService: TranslateService,
    public paymentProfileService: PaymentProfileService,
    private _customersListingService: CustomersListingService,
    private _commonService: CommonService,
    private toastService: ToastService,
    private _fb: FormBuilder,
    private sanitizer: DomSanitizer

  ) {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.testAmount = this._fb.group({
      achOne: ['', [Validators.required, Validators.pattern('^[0-9]{1,2}$')]],
      achTwo: ['', [Validators.required, Validators.pattern('^[0-9]{1,2}$')]]
    });
  }

  ngOnInit(): void {
    //this.getBillingdetails();
    this.iframeLoaded = false;
    if (this.verificationUrl) {
      this.safeUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl(this.verificationUrl);
    }
  }

  onIframeLoad(iframe: HTMLIFrameElement): void {
    try {
      const href = iframe.contentWindow?.location?.href;
      if (href && href !== 'about:blank') {
        this.iframeLoaded = true;
      }
    } catch (e) {
      this.iframeLoaded = true;
    }
  }
  
  getBillingdetails() {
    this._customersListingService.customerBillingProfileLookUpStatus(this.customerC3Id, this.paymentAccountDetails.BillingProviderUserRefId).subscribe((result: any) => {
      var billingDetails = result.Data;
    })
  }

  validateBankAccount(event?: MouseEvent): void {
    if (event) {
      (event.target as HTMLElement).blur();
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.testAmount.markAllAsTouched();
    if (this.testAmount.valid) {
      let requestBody = {
        EntityName: this.entityName,
        RecordId: this.recordId,
        AchAmountOne: this.testAmount.get('achOne').value,
        AchAmountTwo: this.testAmount.get('achTwo').value
        // Id: this.meteredProduct.PlanProductId
      }
      this.paymentProfileService.validateBankAccount(requestBody).pipe(takeUntil(this.destroy$), finalize(() => this.isSubmitting = false)).subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          if (response.Status.toLowerCase() === 'success') {

            this._modalService.dismissAll();
            const confirmationMessage = this.translateService.instant('TRANSLATE.BANK_ACCOUNT_VERIFIED_CONFIRMATION');
            this._notifierService.confirm({ title: confirmationMessage, confirmButtonColor: 'green', showCancelButton: false }).then((result) => {
              this._modalService.dismissAll();
            })
          }
          else {
            this._modalService.dismissAll();
          }

        },
        error: (error: any) => {
          this.isSubmitting = false;
          this._modalService.dismissAll();
        }
      });
    } else {
      this.isSubmitting = false;
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: any) {
    event.target.value = event.target.value.replace(/[^0-9]/g, '');
  }
  
  closeModalPopup() {
    this._modalService.dismissAll();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const modalDialog = document.querySelector('.modal-dialog') as HTMLElement;
      if (modalDialog) {
        modalDialog.setAttribute('tabindex', '-1');
        modalDialog.focus();
      }
    }, 0);
  }
}
