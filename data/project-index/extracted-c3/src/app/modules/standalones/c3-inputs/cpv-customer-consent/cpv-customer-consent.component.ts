import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule, FormGroup, ControlValueAccessor } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ClipboardService } from 'ngx-clipboard';
import { Subscription } from 'rxjs';
import { TranslationModule } from 'src/app/modules/i18n';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-cpv-customer-consent',

  templateUrl: './cpv-customer-consent.component.html',
  styleUrl: './cpv-customer-consent.component.scss',
  standalone: true,
  imports: [
    TranslationModule,
    NgClass,
    NgIf,
    ReactiveFormsModule,
    CommonModule,
    NgbTooltip
  ],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CpvCustomerConsentComponent),
    multi: true
  }]
})
export class CpvCustomerConsentComponent implements ControlValueAccessor {
  _subscription: Subscription[] =[];
  @Input() data!: any;
  @Input() form!: FormGroup;

  // control name
  @Input() frmControlName: any

  /* Metadata */
  @Input() cc: any

  @Input() saveTenant: EventEmitter<any>;
  @Input() revertTenant: EventEmitter<any>;
  @Input() canceltenant: EventEmitter<any>;
  hasMicrosoftPricingAPISuccess: boolean;
  hasNewTestSecureModelSuccess: boolean;
  hasNewTestCustomerConsentSuccess: boolean;

  value: any;

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(private _clipboardService: ClipboardService, private _notifierService: NotifierService, private _translateService: TranslateService, private _commonService: CommonService, private _toastService: ToastService) {

  }

  confirmCopy(): void {
    this._clipboardService.copyFromContent(`https://login.microsoftonline.com/${this.data}/adminconsent?client_id=${this.cc.cpvApplicationID}`);
    this._notifierService.alert({ title: this._translateService.instant('TRANSLATE.CPV_CLIPBOARD_SUCCESS_MESSAGE'), icon: 'success',confirmButtonColor : '#5cb85c' });
  }

  testMicrosoftPricingAPIAccess() {
    let subscription = this._commonService.testMicrosoftPricingAPIAccess().subscribe({
      next: (response: any) => {
        if (response.Data !== undefined && response.Data !== null) {
          this.hasMicrosoftPricingAPISuccess = true;
          this._notifierService.alert({ title: this._translateService.instant('TRANSLATE.MICROSOFT_PRICING_API_CONSENT_TEST_CONFIRMATION_MESSAGE'), icon: 'success' });

        }
      },
      error: (error: any) => {
        let msg = error !== null ? (error.ExceptionMessage !== null ? error.ExceptionMessage : error.Message) : this._translateService.instant('TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST');
        this._toastService.error(msg);
      }
    })
    this._subscription.push(subscription);
  }

  testPartnerAccess() {
    let subscription = this._commonService.partnerProfile().subscribe({
      next: (response: any) => {
        if (response.data.Data !== undefined && response.data.Data !== null) {
          this.hasNewTestSecureModelSuccess = true;
          this._notifierService.alert({ title: this._translateService.instant('TRANSLATE.CPV_PC_TEST_CONFIRMATION_MESSAGE'), icon: 'success' });
          // notifier.notify($filter('translate')("CPV_PC_TEST_CONFIRMATION_MESSAGE"));
        }
      },
      error: (error: any) => {
        let msg = error !== null ? (error.ExceptionMessage !== null ? error.ExceptionMessage : error.Message) : this._translateService.instant('TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST');
        this._toastService.error(msg);
      }
    });
    this._subscription.push(subscription);
  }

  testCustomerConsent(cspCustomerId: string | null) {
    let subscription = this._commonService.testCustomerAzureManagementAccess(cspCustomerId).subscribe({
      next: (response: any) => {
        if (response.Data !== undefined && response.Data !== null) {
          this.hasNewTestCustomerConsentSuccess = true;
          this._notifierService.alert({ title: this._translateService.instant('TRANSLATE.CPV_PC_TEST_CUSTOMER_CONSENT_MESSAGE_SUCCESS'), icon: 'success' });
        }
      },
      error: (error: any) => {
        const errorDetails = JSON.parse(error?.error?.ErrorMessage);
        let errorMsg =  errorDetails ? this._translateService.instant('TRANSLATE.' + errorDetails?.ErrorValue) : this._translateService.instant("TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST");
      }
    });
    this._subscription.push(subscription);
  }


  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = (updatedValue: string) => {
      const originalObject = { ...this.data }; // Original object
      originalObject.Value = updatedValue; // Update only the value
      fn(originalObject); // Pass the updated object to the form
    };
  }


  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  ngOnDestroy() {
    this._subscription?.forEach(v=>v.unsubscribe())
  }

}
