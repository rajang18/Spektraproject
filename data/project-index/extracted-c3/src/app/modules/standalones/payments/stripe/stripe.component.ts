import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { NgbDatepicker, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CardDetailsUtilities } from 'src/app/shared/utilities/card-details-utilities';
import { PaymentBaseComponent } from '../model/payment-base-component';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { StripePaymentGatewayService } from 'src/app/services/payments/stripePaymentGatewayService';
import { distinctUntilChanged, lastValueFrom, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { ToastService } from 'src/app/services/toast.service';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-stripe',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepicker,
    NgbModule,
    C3CommonModule
  ],
  templateUrl: './stripe.component.html',
  styleUrl: './stripe.component.scss'
})
export class StripeComponent extends PaymentBaseComponent implements OnDestroy {
  _subscription: Subscription;
  paymentFormACH: FormGroup = new FormGroup({});
  paymentFormCC: FormGroup = new FormGroup({})
  @Output() onDiscardChanges: EventEmitter<any> = new EventEmitter();
  bankAccountTypes: any = ["Checking", "Savings"];
  newPaymentAccount: any = { AccountType: "CreditCard" };
  paymentAccount: any;
  cardType: string | null = null;
  private cardDetailsUtilities: CardDetailsUtilities;
  //stripe: any;
  card: any;
  hostedVerificationUrl: any;
  hasPaymentTemplateLoaded: boolean = false;
  stripe: Stripe | null = null;
  achClientSecret: any;
  ccClientSecret: any;
  forms: { [key: string]: FormGroup } = {
    paymentFormCC: this.paymentFormCC,
    paymentFormACH: this.paymentFormACH
    // Add other forms here
  };
  isLoading: boolean = false;
  private destroy$ = new Subject<void>;
  constructor(public _translateService: TranslateService,
    private _fb: FormBuilder,
    public _router: Router,
    private cdRef: ChangeDetectorRef,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public notifierService: NotifierService,
    public _stripePaymentGatewayService: StripePaymentGatewayService,
    private _unsavedChangesService: UnsavedChangesService,
    private _toastService: ToastService,
    private _commonService: CommonService,

  ) {
    super(_translateService, notifierService);
    this.cardDetailsUtilities = new CardDetailsUtilities();
    this.paymentFormACH = this._fb.group({
      PaymentProfileAlias: ['', Validators.required],
      AccountNumber: ['', Validators.required],
      NameOnCard: ['', Validators.required],
      RoutingNumber: ['', Validators.required],
      AccountType: ['', Validators.required],
    });

    this.paymentFormCC = this._fb.group({
      PaymentProfileAlias: ['', Validators.required],
      // NameOnCard: [''],
      // CreditCardNumber: ['', [Validators.required, this.cardNumberValidator.bind(this)]],
      // Month: [''],
      // Year: [''],
      // CVV: [''],
    });
    Object.values(this.forms).forEach(form => this.trackFormChanges(form));

  }
  ngOnInit(): void {
    // this.customerDetails.BillingProviderReferenceID = "cus_U5M0OHieZeii8y";
    this.HasPermission();
    this.GetBillingCustomerId();
    this.newPaymentAccount.PaymentType = "CreditCard";
    if (this.data.toLowerCase() == 'cc') {
      this.initializeStripeView();
    }
    if (this.data.toLowerCase() == 'ach') {
      this.createBillingCustomer();
    }
  }

  permissions = {
    HasSaveCustomerPaymentProfile: "Denied"
  };

  HasPermission() {
    this.permissions.HasSaveCustomerPaymentProfile = this._permissionService.hasPermission(CloudHubConstants.BTN_SAVE_CUTOMER_PAYMENT_PROFILE);
  }

  GetBillingCustomerId() {
    this._subscription = this._stripePaymentGatewayService.GetBillingCustomerId().subscribe((result: any) => {
      let BillingProviderReferenceID = result.Data.BillingProviderReferenceID;
      this.customerDetails.BillingProviderReferenceID = BillingProviderReferenceID;
    })
    if (this.customerDetails.BillingProviderReferenceID === null) {
      this.createBillingCustomer();
    }

  }

  createBillingCustomer() {
    //this.customerDetails.BillingProviderReferenceID = "cus_U5M0OHieZeii8y";

    if (this.customerDetails.BillingProviderReferenceID === null) {
      /*calling api to create customer in billing provider if not exist */
      this._subscription = this._stripePaymentGatewayService.CreateCustomer()
        .subscribe((response: any) => {
          let BillingProviderReferenceID = response.Data.BillingProviderReferenceID;
          this.customerDetails.BillingProviderReferenceID = BillingProviderReferenceID;
          // this.initializeAch();
          const requestBody = {
            BillingProviderUserId : this.customerDetails.BillingProviderReferenceID
          }
          this._stripePaymentGatewayService.saveCustomerBilling(requestBody).subscribe((response: any) =>{  });
        })
    }
    else {
      //this.initializeAch();
    }

  }

  cardNumberValidator(control: any): { [key: string]: boolean } | null {
    this.cardType = this.cardDetailsUtilities.getCardType(control.value);
    if (!this.cardType) {
      return { invalidCardType: true };
    }
    return null;
  }

  initializeStripeView() {
    this.hasPaymentTemplateLoaded = true;
    this._subscription = this._stripePaymentGatewayService.getBillingConfig().subscribe({
      next: async (result: any) => {

        const StripePublicKey = result.Data.StripePublicKey
        this.stripe = await loadStripe(StripePublicKey);
        const elements = this.stripe.elements();
        if (elements) {
          var style = {
            base: {
              // Add your base input styles here. For example:
              fontSize: '16px',
              color: "#32325d",
            },
          }
          // Create an instance of the card Element.
          this.card = elements.create('card', { style: style })

          // Add an instance of the card Element into the `card-element` <div>.
          this.card.mount('#card-element');

          this.card.addEventListener('change', (event) => {
            var displayError = document.getElementById('stripe-errors');
            if (event.error) {
              displayError.textContent = event.error.message;
            } else {
              displayError.textContent = '';
            }
          })
        }
      },
      error: (error: unknown) => {
        let msg = this._translateService.instant('TRANSLATE.ERROR_GETTING_STRIPE_DETAILS');
        this.handleError('ERROR_SAVING_CUSTOMER', error);
      }

    })

  }



  async initializeAch() {
     this.isLoading = true;
    try {
      const requestBody = {
        BillingCustomerId: this.customerDetails.BillingProviderReferenceID,
        PaymentType: 'us_bank_account'
      }
      // 1️⃣ Create SetupIntent on backend
      const setupResult: any = await lastValueFrom(
        this._stripePaymentGatewayService.createSetupIntent(requestBody)
      );

      this.achClientSecret = setupResult.Data; // ✅ already string
      this.hasPaymentTemplateLoaded = true;

      // 2️⃣ Load Stripe
      const configResult: any = await lastValueFrom(this._stripePaymentGatewayService.getBillingConfig());
       this.isLoading = true;
      this.stripe = await loadStripe(configResult.Data.StripePublicKey);
      // 2️⃣ Open Stripe bank collection modal
      const result = await this.stripe.confirmUsBankAccountSetup(
        this.achClientSecret,
        {
          payment_method: {
            us_bank_account: {
              routing_number: this.newPaymentAccount.RoutingNumber,
              account_number: this.newPaymentAccount.AccountNumber,
              account_holder_type: this.newPaymentAccount.AccountType
            },
            billing_details: {
              name: this.newPaymentAccount.NameOnCard,
              email: null
            }
          }
        }
      );

      if (result.error) {
        const param = result.error.param || '';

        if (param.includes('routing_number')) {
          this._toastService.error(
            this._translateService.instant('TRANSLATE.INVALID_ROUTING_NUMBER')
          );
        }
        else if (param.includes('account_number')) {
          this._toastService.error(
            this._translateService.instant('TRANSLATE.INVALID_ACCOUNT_NUMBER')
          );
        }
        else {
          this._toastService.error(result.error.message);
        }
        this.isLoading = false;
        return;
      }

      if (result.setupIntent) {

        const setupIntentId = result.setupIntent.id;

        // if (result.setupIntent.status === 'succeeded') {
        //   alert('Bank account verified and saved!');
        // }
        // else if (result.setupIntent.status === 'requires_action') {
        //   alert('Micro-deposit verification required.');
        // }
        // else if (result.setupIntent.status === 'processing') {
        //   alert('Bank account is processing.');
        // }
        // else {
        //   alert('Status: ' + result.setupIntent.status);
        // }

        if (result.setupIntent?.next_action?.type === 'verify_with_microdeposits') {
          const verify =
            (result.setupIntent.next_action as any)?.verify_with_microdeposits;

          const hostedUrl = verify?.hosted_verification_url;

          // store it
          this.hostedVerificationUrl = hostedUrl;
        }
        this.newPaymentAccount = {
          PaymentProfileAlias: this.newPaymentAccount.PaymentProfileAlias,
          PaymentType: 'Bank Account',
          PaymentProfileReference: result.setupIntent.payment_method,
          NameOnCard: this.newPaymentAccount.NameOnCard,
          CreditCardType: null,
          Month: null,
          Year: null,
          AccountNumber: 'XXXX-XXXX-XXXX-' + this.newPaymentAccount.AccountNumber?.slice(-4),
          RoutingNumber: this.newPaymentAccount.RoutingNumber,
          AccountType: this.newPaymentAccount.AccountType,
          ACHVerificationLink: this.hostedVerificationUrl
        };
        // Send the token to your server.
        this.onSubmit({ BillingProviderReferenceID: this.customerDetails.BillingProviderReferenceID, CustomerBillingProfile: this.newPaymentAccount });
      }

    } catch (error) {
      this.isLoading = false;
      this._toastService.error( this._translateService.instant('TRANSLATE.PC_SOMETHING_WENT_WRONG_TRY_AFTER_SOMETIME'));
    }

  }



 Submit(form: FormGroup) {
  this.isLoading = true;
  if (form.invalid) {

    Object.keys(form.controls).forEach(field => {
      const control = form.get(field);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
    this.isLoading = false;
    return; 
  }

    if (form === this.paymentFormACH) {
      this.newPaymentAccount.AccountNumber = form.get('AccountNumber')?.value
      this.newPaymentAccount.NameOnCard = form.get('NameOnCard')?.value
      this.newPaymentAccount.RoutingNumber = form.get('RoutingNumber')?.value
      this.newPaymentAccount.PaymentProfileAlias = form.get('PaymentProfileAlias')?.value
      this.newPaymentAccount.PaymentType = this.data;
      this.newPaymentAccount.AccountType = form.get('AccountType')?.value

    }
    this.newPaymentAccount.PaymentProfileAlias = form.get('PaymentProfileAlias')?.value
    this.hasPaymentTemplateLoaded = false;
    this.createPaymentToken();
     this.isLoading = false;
    // }
  }

  async createPaymentToken() {
    var errorElement = '';
    if (this.data === 'CC') {
            this.isLoading = true;
      const requestBody = {
        BillingCustomerId: this.customerDetails.BillingProviderReferenceID,
        PaymentType: 'card',
        EntityName : this._commonService.entityName,
        RecordId : this._commonService.recordId
      }
      const setupResult: any = await lastValueFrom(
        this._stripePaymentGatewayService.createSetupIntent(requestBody)
      );
      this.isLoading = true
      this.ccClientSecret = setupResult.Data; // ✅ already string
      this.hasPaymentTemplateLoaded = true;
      // 2️⃣ Load Stripe
      // const configResult: any = await lastValueFrom(this._stripePaymentGatewayService.getBillingConfig());
      // this.stripe = await loadStripe(configResult.Data.StripePublicKey);
      this.stripe.confirmCardSetup(this.ccClientSecret, {
        payment_method: {
          card: this.card,
          billing_details: {
            name: this.newPaymentAccount.NameOnCard
          }
        }
      }).then(async (result: any) => {
              this.isLoading = true;
        if (result.error) {

          let errorElement = document.getElementById('stripe-errors');
          errorElement.textContent = result.error.message;
          this.hasPaymentTemplateLoaded = true;
          this.isLoading = false;

        } else {
          this.isLoading = true;
          let paymentMethod = result.setupIntent.payment_method;
          const card = await this.fetchCardDetails(paymentMethod);
          this.newPaymentAccount = {

            PaymentProfileAlias: this.newPaymentAccount.PaymentProfileAlias,
            PaymentType: 'Credit Card',
            PaymentProfileReference: paymentMethod,
            NameOnCard: this.newPaymentAccount.NameOnCard,
            CreditCardType: card?.CardBrand,
            Month: card?.ExpMonth,
            Year: card?.ExpYear,
            AccountNumber: 'XXXX-XXXX-XXXX-' + card?.Last4,
            RoutingNumber: null
          };

          this.onSubmit({
            BillingProviderReferenceID: this.customerDetails.BillingProviderReferenceID,
            CustomerBillingProfile: this.newPaymentAccount
          });

        }

      });
    }
    else if (this.data === 'ACH') {
      this.isLoading = true;
      //     // 2️⃣ Open Stripe bank collection modal
      // const result = this.stripe.confirmUsBankAccountSetup(
      //   this.achClientSecret,
      //   {
      //     payment_method: {
      //       us_bank_account: {
      //         routing_number:this.newPaymentAccount.AccountNumber,
      //         account_number: this.newPaymentAccount.RoutingNumber,
      //         account_holder_type: this.newPaymentAccount.AccountType
      //       },
      //       billing_details: {
      //         name: this.newPaymentAccount.NameOnCard,
      //         email: null
      //       }
      //     }
      //   }
      // );

      this.initializeAch();


    }

  }

  async fetchCardDetails(paymentMethod: string) {

    const reqBody = {
      PaymentMethodID: paymentMethod,
    };

    const res: any = await lastValueFrom(
      this._stripePaymentGatewayService.getStripePaymentDetails(reqBody)
    );

    return res.Data?.[0];

  }

  buildPaymentModel(paymentMethod: string, card: any) {
    this.isLoading = true;
    this.newPaymentAccount = {
      PaymentProfileAlias: this.paymentFormCC.get('PaymentProfileAlias')?.value,
      PaymentType: 'CreditCard',
      PaymentProfileReference: paymentMethod,
      NameOnCard: this.paymentFormCC.get('PaymentProfileAlias')?.value,
      CreditCardType: card?.CardBrand,
      Month: card?.ExpMonth,
      Year: card?.ExpYear,
      AccountNumber: 'XXXX-XXXX-XXXX-' + card?.Last4,
      RoutingNumber: null
    };

  }

  stripeTokenHandler(token) {
    this.saveBillingCustomerProfile();
  }

  saveBillingCustomerProfile() {
    if (this.customerDetails.BillingProviderReferenceID === null) {
      /*calling api to create customer in billing provider if not exist */
      this._subscription = this._stripePaymentGatewayService.CreateCustomer()
        .pipe(
          switchMap((response: any) => {
            let BillingProviderReferenceID = response.Data.BillingProviderReferenceID;
            this.customerDetails.BillingProviderReferenceID = BillingProviderReferenceID;
            return this._stripePaymentGatewayService.getCustomerBilling(BillingProviderReferenceID)
          }),
          switchMap((_) => {
            return this._stripePaymentGatewayService.CreatePaymentAccount(this.customerDetails, this.newPaymentAccount)
          })
        )
        .subscribe({
          next: ((result: any) => {
            this.paymentFormACH.reset();
            this.paymentFormCC.reset();
            result.Data.PaymentProfileAlias = this.newPaymentAccount.PaymentProfileAlias;
            this.onSubmit({ BillingProviderReferenceID: this.customerDetails.BillingProviderReferenceID, CustomerBillingProfile: result.Data });
          }), error: ((error) => {
            this.handleError('ERROR_SAVING_PAYMENT_ACCOUNT', error);
          })
        })
    }
    /*creating payment account if billing customer already exist */
    else {
      this._subscription = this._stripePaymentGatewayService.CreatePaymentAccount(this.customerDetails, this.newPaymentAccount)
        .subscribe({
          next: ((result: any) => {
            this.paymentFormACH.reset();
            this.paymentFormCC.reset();
            result.Data.PaymentProfileAlias = this.newPaymentAccount.PaymentProfileAlias;
            this.onSubmit({ BillingProviderReferenceID: this.customerDetails.BillingProviderReferenceID, CustomerBillingProfile: result.Data });
          }), error: ((error) => {
            this.handleError('ERROR_SAVING_PAYMENT_ACCOUNT', error);
          })
        })
    }

  }

  Cancel() {
    this.onCancel();
  }
  private trackFormChanges(form: FormGroup) {
    this._subscription = form.valueChanges.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this._unsavedChangesService.setUnsavedChanges(form.dirty);
    });
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe()
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
