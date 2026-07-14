import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { NgbDatepicker, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaymentProfileService } from 'src/app/modules/home/profile/services/paymentprofile.service';
//import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { BillAndPayPaymentGatewayService, SaveUserBillingProfile_Params } from 'src/app/services/payments/bill-and-pay-payment-gateway.service';
import { PermissionService } from 'src/app/services/permission.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CardDetailsUtilities } from 'src/app/shared/utilities/card-details-utilities';
import { PaymentBaseComponent } from '../model/payment-base-component';
import Swal from 'sweetalert2';
import { Utility } from 'src/app/shared/utilities/utility';
import { catchError, distinctUntilChanged, of, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@Component({
  selector: 'app-bill-and-pay-payment-gateway',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    C3CommonModule
  ],
  templateUrl: './bill-and-pay-payment-gateway.component.html',
  styleUrl: './bill-and-pay-payment-gateway.component.scss'
})
export class BillAndPayPaymentGatewayComponent extends PaymentBaseComponent implements OnInit, OnDestroy{
  pageMode = "";
  _subscription: Subscription;
  @Output() onDiscardChanges: EventEmitter<any> = new EventEmitter();
  paymentFormACH: FormGroup = new FormGroup({});
  paymentFormCC: FormGroup =new FormGroup({});
  bankAccountTypes: any = ["Checking", "Savings"];
  newPaymentAccount: any = { AccountType: "CreditCard" };
  cardType: string | null = '';
  private cardDetailsUtilities: CardDetailsUtilities 
  forms: { [key: string]: FormGroup } = {
    paymentFormCC: this.paymentFormCC,
    paymentFormACH: this.paymentFormACH
    // Add other forms here
  };
  private destroy$ = new Subject<void>;
  constructor(
    private _fb: FormBuilder,
    public _router: Router, 
    public _permissionService: PermissionService,
    private cdRef: ChangeDetectorRef,
    public _dynamicTemplateService: DynamicTemplateService,
    public _translateService: TranslateService,
    public notifierService: NotifierService,
    private _BillAndPayPaymentGatewayService: BillAndPayPaymentGatewayService,
    public _paymentProfileService: PaymentProfileService,
    private _unsavedChangesService: UnsavedChangesService

  ) {
    super(_translateService,notifierService);
    this.cardDetailsUtilities = new CardDetailsUtilities();
    this.paymentFormACH = this._fb.group({
      PaymentProfileAlias: ['',Validators.required],
      AccountNumber: ['',Validators.required],
      NameOnCard: ['',Validators.required],
      RoutingNumber: ['',Validators.required],
      AccountType: ['',Validators.required],
      IsBusinessAccountString: ['',Validators.required],
    });

    this.paymentFormCC = this._fb.group({
      PaymentProfileAlias: ['',Validators.required],
      NameOnCard: ['',Validators.required],
      CreditCardNumber: ['', [Validators.required, this.cardNumberValidator.bind(this)]],
      Month: ['',Validators.required],
      Year: ['',Validators.required],
      CVV: ['',Validators.required],
    });
    Object.values(this.forms).forEach(form => this.trackFormChanges(form));

  }
  ngOnInit(): void {
    this.HasPermission();
    this.newPaymentAccount.PaymentType = "CreditCard"; 
  }

  permissions = {
    HasSaveCustomerPaymentProfile: "Denied"
  };

  HasPermission() {
    this.permissions.HasSaveCustomerPaymentProfile = this._permissionService.hasPermission(CloudHubConstants.BTN_SAVE_CUTOMER_PAYMENT_PROFILE);
  }

  cardNumberValidator(control: any): { [key: string]: boolean } | null {
    this.cardType = this.cardDetailsUtilities.getCardType(control.value);
    if (!this.cardType) {
      return { invalidCardType: true };
    }else{
      this.cdRef.detectChanges();
    }
    return null;
  }

  /*
  function for saving the card and account details  
  */
  Submit(form: any) {
    /*below set of code need to be configured properly */

    Utility.markFormGroupTouched(form);
    if(form === this.paymentFormACH){ 
      this.newPaymentAccount.AccountNumber = form.get('AccountNumber')?.value;
      this.newPaymentAccount.NameOnCard = form.get('NameOnCard')?.value;
      this.newPaymentAccount.RoutingNumber = form.get('RoutingNumber')?.value;
      this.newPaymentAccount.PaymentProfileAlias = form.get('PaymentProfileAlias')?.value;
      this.newPaymentAccount.IsBusinessAccountString = form.get('IsBusinessAccountString')?.value;
      if (form.get('IsBusinessAccountString')?.value === "0") {
        this.newPaymentAccount.IsBusinessAccount = 0;
      }
      else if (form.get('IsBusinessAccountString')?.value === "1") {
        this.newPaymentAccount.IsBusinessAccount = 1;
      }
      this.newPaymentAccount.PaymentType = 'ACH';
      this.newPaymentAccount.AccountType = form.get('AccountType')?.value

    }
    if(form === this.paymentFormCC){ 
      this.newPaymentAccount.CreditCardNumber = form.get('CreditCardNumber')?.value
      this.newPaymentAccount.NameOnCard = form.get('NameOnCard')?.value
      this.newPaymentAccount.PaymentProfileAlias = form.get('PaymentProfileAlias')?.value
      this.newPaymentAccount.Month = form.get('Month')?.value
      this.newPaymentAccount.Year = form.get('Year')?.value
      this.newPaymentAccount.CVV = form.get('CVV')?.value
      this.newPaymentAccount.PaymentType = 'CreditCard';
      this.newPaymentAccount.CreditCardType = this.cardType;

    }
    if ((this.newPaymentAccount.PaymentType === "ACH" || this.newPaymentAccount.PaymentType === "BankAccount") 
      && (this.newPaymentAccount.IsBusinessAccount !== 0 && this.newPaymentAccount.IsBusinessAccount !== 1)) {
      form.$valid = false;
    }
    if (form.valid) {
      
      if (this.customerDetails.BillingProviderReferenceID === null) {
        /*calling api to create customer in billing provider if not exist */

        this._subscription = this._BillAndPayPaymentGatewayService.CreateCustomer()
        .pipe(
          switchMap((res) => {
            let billAndPay = res.Data
            this.customerDetails.BillingProviderReferenceID = billAndPay.BillingProviderReferenceID;
            // Step 2: Create Payment Account after fetching customer billing
            let data = new SaveUserBillingProfile_Params();
            data.BillingProviderUserId = this.customerDetails.BillingProviderReferenceID;
            return this._BillAndPayPaymentGatewayService.getCustomerBilling(data);
          }),
          switchMap((_)=>{
            return this._BillAndPayPaymentGatewayService.CreatePaymentAccount(this.customerDetails, this.newPaymentAccount);
          }),
          catchError((error: unknown) => {
          // Handle errors for either the CreateCustomer or getCustomerBilling requests
            this.handleError("TRANSLATE.ERROR_SAVING_CUSTOMER", error);
            return of(null); // Return a null observable to handle the error gracefully
          })
        )
        .subscribe({
          next: (result: any) => { 
            result.Data.PaymentProfileAlias = this.newPaymentAccount.PaymentProfileAlias;
            this.onSubmit({ BillingProviderReferenceID: this.customerDetails.BillingProviderReferenceID, CustomerBillingProfile: result.Data});
          },
          error: (error: any) => {
            // Additional error handling if needed
            if(error?.error?.ErrorMessage){
              this.handleError(error?.error?.ErrorMessage, error);  
            }else{
              this.handleError("TRANSLATE.ERROR_SAVING_PAYMENT_ACCOUNT", error);
            }
          }
        });
      }
      /*creating payment account if billing customer already exist */
      else {
   
        this._subscription = this._BillAndPayPaymentGatewayService.CreatePaymentAccount(this.customerDetails, this.newPaymentAccount)
        .subscribe({
          next: (result: any) => { 
          /*saving billing profile */
          result.Data.PaymentProfileAlias = this.newPaymentAccount.PaymentProfileAlias;
          this.onSubmit({ BillingProviderReferenceID: this.customerDetails.BillingProviderReferenceID, CustomerBillingProfile: result.Data});
        },
        error: (error: any) => {
            if(error?.error?.ErrorMessage){
              this.handleError(error?.error?.ErrorMessage, error);  
            }else{
              this.handleError("TRANSLATE.ERROR_SAVING_PAYMENT_ACCOUNT", error);
            }
          }
        });
      }

    } 
  } 

  // Function to handle errors


  cancel(form: any){
      let confirmationText = this._translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT');
      let confirmationBtn = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
      Swal.fire({
        title: confirmationText,
        showCancelButton: true,
        confirmButtonText: confirmationBtn,
        confirmButtonColor:'#49BA7C',
        icon: 'warning',
      }).then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.onDiscardChanges.emit();
          form.reset();
          this.newPaymentAccount ={};
        }
      });
  }

  private trackFormChanges(form: FormGroup) {
    form.valueChanges.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this._unsavedChangesService.setUnsavedChanges(form.dirty);
    });
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
