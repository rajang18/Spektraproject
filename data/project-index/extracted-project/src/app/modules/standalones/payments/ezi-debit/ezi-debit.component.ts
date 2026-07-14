import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { NgbDatepicker, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaymentProfileService } from 'src/app/modules/home/profile/services/paymentprofile.service';  
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { EziDebitPaymentGatewayService } from 'src/app/services/payments/eziDebitPaymentGatewayService';
import { PermissionService } from 'src/app/services/permission.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CardDetailsUtilities } from 'src/app/shared/utilities/card-details-utilities';
import { PaymentBaseComponent } from '../model/payment-base-component'; 
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import _ from 'lodash';
import { distinctUntilChanged, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import Swal from 'sweetalert2';
declare const eziDebit: any

@Component({
  selector: 'app-ezi-debit',
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
  templateUrl: './ezi-debit.component.html',
  styleUrl: './ezi-debit.component.scss'
})
export class EziDebitComponent extends PaymentBaseComponent {
  _subscription: Subscription;
  pageMode = "CC";
  @Output() onDiscardChanges: EventEmitter<any> = new EventEmitter();
  paymentFormACH: FormGroup = new FormGroup({});
  paymentFormCC: FormGroup = new FormGroup({});
  bankAccountTypes: any = ["Checking", "Savings"];
  newPaymentAccount: any = { AccountType: "CreditCard" };
  cardType: string | null = null;
  private cardDetailsUtilities: CardDetailsUtilities
  systemRefrence: string;
  digitalKey: string;
  billingProviderJSEndPointUrl: string;
  HasPaymentTemplateLoaded: boolean = false;
  CreditCardAlias: any = {};
  isCreditCardEnabled:boolean = false;
  isACHEnabled:boolean = false;
  forms: { [key: string]: FormGroup } = {
    paymentFormCC: this.paymentFormCC,
    paymentFormACH: this.paymentFormACH
    // Add other forms here
  };
  private destroy$ = new Subject<void>;
  constructor(public _translateService: TranslateService,
    private _fb: FormBuilder,
    public _router: Router,
    private cdRef: ChangeDetectorRef,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService, 
    private _EziDebitPaymentGatewayService: EziDebitPaymentGatewayService,
    public _paymentProfileService: PaymentProfileService,
    public notifierService: NotifierService,
    private toasterService: ToastService,
    private _unsavedChangesService: UnsavedChangesService

  ) {
    super(_translateService,notifierService);
    this.cardDetailsUtilities = new CardDetailsUtilities();
    this.paymentFormACH = this._fb.group({
      PaymentProfileAlias: ['',Validators.required],
      AccountNumber: ['',Validators.required],
      NameOnCard: ['',Validators.required],
      RoutingNumber: ['',Validators.required]
    });

    this.paymentFormCC = this._fb.group({
      PaymentProfileAlias: ['',Validators.required],
    });
    Object.values(this.forms).forEach(form => this.trackFormChanges(form));

  }

  ngOnInit(): void {
    this._subscription = this._EziDebitPaymentGatewayService.getSupportPaymentTypes().subscribe((res:any)=>{
      //this.isACHEnabled = res.isACHEnabled;
      let supportedPaymentTypes = <any[]>res.Data;
      if (supportedPaymentTypes !== undefined && supportedPaymentTypes !== null && supportedPaymentTypes.length > 0) { 
        supportedPaymentTypes.forEach(paymentType => {
          if (paymentType.PaymentTypeName.toLowerCase() === "cc") {
            this.isCreditCardEnabled = true;
            if(this.pageMode=== "CC"){
              setTimeout(()=>{
                document.getElementById("CC").click();
              },100)
            }  
          }
          else if (paymentType.PaymentTypeName.toLowerCase() === "ach") {
            this.isACHEnabled = true;
            if(!this.isCreditCardEnabled && this.pageMode=== "ACH"){ 
              setTimeout(()=>{
                document.getElementById("ACH").click();
              },100)
            }
          }
        });
      }
    })
    this.HasPermission();
    this.GetBillingConfig();
    this.CheckIfCustomerExists();
  }

  permissions = {
    HasSaveCustomerPaymentProfile: "Denied"
  };

  HasPermission() {
    this.permissions.HasSaveCustomerPaymentProfile = this._permissionService.hasPermission(CloudHubConstants.BTN_SAVE_CUTOMER_PAYMENT_PROFILE);
  }


  GetBillingConfig() {
    this._subscription = this._EziDebitPaymentGatewayService.getBillingConfig().subscribe({
      next: async (response: any) => {
        this.digitalKey = response.Data.DigitalKey;
        this.billingProviderJSEndPointUrl = response.Data.JSEndPointURL;
        this.systemRefrence = response.Data.C3Id;
        this.InitializeVariables();
        this.HasPaymentTemplateLoaded = true;
      }, error: (error: unknown) => {
        let msg = this._translateService.instant('TRANSLATE.ERROR_SAVING_PAYMENT_ACCOUNT');
        this.toasterService.error(msg);
      }
    })
  }

  cardNumberValidator(control: any): { [key: string]: boolean } | null {
    this.cardType = this.cardDetailsUtilities.getCardType(control.value);
    if (!this.cardType) {
      return { invalidCardType: true };
    }
    return null;
  }

  SetPaymentTypePageMode(pageMode) {
    this.paymentFormACH.reset();
    this.paymentFormCC.reset();
    this.newPaymentAccount = {};
    if(pageMode != this.data){
      this.data = pageMode;
      if (this.data === "CC") {
        this.ngOnInit();
      }
    }
  }

  InitializeVariables() {
    const eziDebitSuccessCallBack = (data: any) => {
    if (data.Data === "S") {
      this._subscription = this._EziDebitPaymentGatewayService.GetBillingCustomerId()
      .pipe(
        switchMap((response:any)=>{
          this.customerDetails = {
            Name: null,
            BillingProviderReferenceID: response.Data.BillingProviderReferenceID
          };
          return this._EziDebitPaymentGatewayService.SaveCreditCard(this.customerDetails.BillingProviderReferenceID, this.CreditCardAlias)
        })
      )
      .subscribe({
              next: (response: any) => {
                this.paymentFormACH.reset();
                this.paymentFormCC.reset();
                this.notifierService.alert({
                  title: 'Success', icon: 'success'
                });
                this.onCancel();
              }, error: (error: any) => { 
                let msg = this._translateService.instant('TRANSLATE.'+error.error.ErrorMessage); 
                this.notifierService.error({title: msg});
              }
            })
      }
      else {
        this.toasterService.error('TRANSLATE.'+data.ErrorMessage);
      }
    }

    const ezidebitSubmitError = (data) => {
      let msg = this._translateService.instant(data);
      //this.notifierService.error(msg); 
      this.toasterService.error(data);
      
    };

    eziDebit.init(this.digitalKey, {
      submitAction: "ChangeCustomerPaymentInfo",
      submitButton: "modifyButton",
      submitCallback: eziDebitSuccessCallBack,
      submitError: ezidebitSubmitError,
      customerReference: "systemReference", // This is Ezidebit's unique identifier for the customer. This is known as the EziDebitCustomerID. In Ezidebit Online this is known as the Contract ID
      cardNumber: "cardNumber",
      nameOnCard: "nameOnCard",
      cardExpiryMonth: "expiryMonth",
      cardExpiryYear: "expiryYear"
    }, this.billingProviderJSEndPointUrl);
  }

  CheckIfCustomerExists() { 
    this._subscription = this._EziDebitPaymentGatewayService.GetBillingCustomerId().subscribe({
      next: (result: any) => { 
        this.customerDetails = {
          Name: null,
          BillingProviderReferenceID: result.Data !== null ? result.Data.BillingProviderReferenceID : null
        };

        if (this.customerDetails.BillingProviderReferenceID === undefined || this.customerDetails.BillingProviderReferenceID === null) {
          this.CreateCustomerIfNotExists();
        }
      }, error: (error: any) => {
        let msg = this._translateService.instant('TRANSLATE.'+error.error.ErrorMessage);
        this.toasterService.error(msg);
      }
    });
  }

  CreateCustomerIfNotExists() { 
    this._subscription = this._EziDebitPaymentGatewayService.CreateCustomer()
    .pipe(
      switchMap((res:any)=>{
        this.customerDetails = {
          Name: null,
          BillingProviderReferenceID: res.Data.BillingProviderReferenceID
        };
        return this._EziDebitPaymentGatewayService.getCustomerBilling(res.Data.BillingProviderReferenceID)
      })
    )
    .subscribe({
        next: (response2: any) => {
          // this.customerDetails = {
          //   Name: null,
          //   BillingProviderReferenceID: response2.Data.BillingProviderReferenceID
          // };
          // if (this.data === "CC") {
          //   this.ngOnInit();
          // }
        }, error: (error: any) => {
          let msg = this._translateService.instant('TRANSLATE.'+error.error.ErrorMessage);
          this.toasterService.error(msg);
        }
      })
  }

  Submit(form: any) {
    form.markAllAsTouched();
    if(form === this.paymentFormACH){
      this.newPaymentAccount.AccountNumber = form.get('AccountNumber')?.value
      this.newPaymentAccount.NameOnCard = form.get('NameOnCard')?.value
      this.newPaymentAccount.RoutingNumber = form.get('RoutingNumber')?.value
      this.newPaymentAccount.PaymentProfileAlias = form.get('PaymentProfileAlias')?.value
      this.newPaymentAccount.AccountType  =  "ACH"
    }
    if(form === this.paymentFormCC){
      this.newPaymentAccount.PaymentProfileAlias = form.get('PaymentProfileAlias')?.value;
      this.newPaymentAccount.AccountType  =  "CC"
    }
    if (form.valid) {
      if (this.customerDetails.BillingProviderReferenceID === null) {
        this.CreateCustomerIfNotExists();
        this.newPaymentAccount.PaymentType = this.pageMode;
        this._subscription = this._EziDebitPaymentGatewayService.CreatePaymentAccount(this.customerDetails, this.newPaymentAccount).subscribe({
          next: (response: any) => {
            this.paymentFormACH.reset();
            this.paymentFormCC.reset();
            response.PaymentProfileAlias = this.newPaymentAccount.PaymentProfileAlias;
            this.onSubmit({ BillingProviderReferenceID: this.customerDetails.BillingProviderReferenceID, CustomerBillingProfile: response.Data })

          }, error: (error: any) => { 
            let msg = this._translateService.instant('TRANSLATE.'+error.error.ErrorMessage);
            this.toasterService.error(msg);
          }
        })
      }
      else {
        this.newPaymentAccount.PaymentType = this.data;
        this._subscription = this._EziDebitPaymentGatewayService.CreatePaymentAccount(this.customerDetails, this.newPaymentAccount).subscribe({
          next: (response: any) => {
            this.paymentFormACH.reset();
            this.paymentFormCC.reset();
            response.Data.PaymentProfileAlias = this.newPaymentAccount.PaymentProfileAlias;
            this.onSubmit({ BillingProviderReferenceID: this.customerDetails.BillingProviderReferenceID, CustomerBillingProfile: response.Data })

          }, error: (error: any) => {
            let msg = this._translateService.instant('TRANSLATE.'+error.error.ErrorMessage);
            this.toasterService.error(msg);
          }
        })
      }
     }
  }


  Cancel(){
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
            this.onCancel();
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
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

}

