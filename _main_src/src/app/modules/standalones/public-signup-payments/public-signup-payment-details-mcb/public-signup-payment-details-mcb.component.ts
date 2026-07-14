import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { NgbDatepicker, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MCBService } from 'src/app/services/mcb.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { PublicSignupService } from 'src/app/modules/public-signup/services/public-signup.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { Subject, Subscription, takeUntil } from 'rxjs';
import _ from 'lodash';

declare var PaymentSession: any;
@Component({
  selector: 'app-public-signup-payment-details-mcb',
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
  templateUrl: './public-signup-payment-details-mcb.component.html',
  styleUrl: './public-signup-payment-details-mcb.component.scss'
})
export class PublicSignupPaymentDetailsMcbComponent implements OnDestroy {
  _subscription: Subscription[] = [];
  htmlContent: string;
  currentPage: string = 'MCB';
  isIntervlSet: boolean = false;
  paymentFormACH: FormGroup;
  paymentFormCC: FormGroup;
  cartProducts: any;
  internalPlanId = null;
  environmentId = null;
  signUpBatchId = null;
  hasPaymentTemplateLoaded = false;
  isPaymentSkipped: any;
  enantId = null;
  domainName = null;
  email = null;
  providerName = null;
  customerCurrencyCode = null;
  isCustomerConsentAcceptanceProvided = false;
  isMicrosoftProductAvailable = false;
  customerPublicSignUpModel: CustomerPublicSignupModel = new CustomerPublicSignupModel();
  pageMode = "";
  microsoftProductInCart: any;
  linkedProducts: any;
  linkedMicrosoftSubscription: any;
  isProcessing:boolean = false
  isSignupState:boolean;
  isEnablePublicSignupAssistance:boolean;
  isCartHasMicrosoftProduct:boolean;
  // $rootScope.wizardControl = {
  //     review: 'done',
  //     account: 'done',
  //     confirm: 'current'
  //   };
  isCreditCardEnabled = false;
  isACHEnabled = false;
  bankAccountTypes = ["Checking", "Savings"];
  newPaymentAccount: any = { AccountType: "", PaymentType: "" };
  submitButtonClicked = false;
  card: any;
  billingProviderName: any;
  paymentModeCC = true;
  cardType: string | null = null;
  destroy$ = new Subject<void>();
  merchantId: any;
  paymentProfileDetails: any;
  cancelMCBPaymentPageTableReload: any;
  sessionId: any;
  safeUrl!: SafeResourceUrl;
  constructor(private cdRef: ChangeDetectorRef,
    private mcbService: MCBService,
    private sanitizer: DomSanitizer,
    public _publicSignupSevice: PublicSignupService,
    private _router: Router,
    private _translateService: TranslateService,
    private _notifierService: NotifierService
  ) {
    // super();
  }

  ngOnInit(): void {
        this._publicSignupSevice.isPlandetails = false;
        this._publicSignupSevice.isShopScreen = false;
        this.cartProducts = this._publicSignupSevice.publicSignupSharedScope.cartProducts;
        this.microsoftProductInCart = _.filter(this.cartProducts ,(product : any ) =>{
          return product.ProviderName === 'Microsoft';
        });
        this.isSignupState = this._router.url.includes('shop');
        this.linkedProducts = _.find(this.cartProducts ,(product : any ) =>{
          return product.LinkedSubscription != null ;
        })
    
        if(this.linkedProducts != null){
          this.linkedMicrosoftSubscription = _.find(this.cartProducts ,(product : any ) =>{
            return product.LinkedSubscription.ProviderName === 'Microsoft';
          })
        }
        if(this.microsoftProductInCart[0]?.EnablePublicSignupAssistance === true || this.linkedMicrosoftSubscription?.EnablePublicSignupAssistance === true){
          this.isEnablePublicSignupAssistance = true;
        }
        if(this.microsoftProductInCart != null || this.linkedProducts != null){
          this.isCartHasMicrosoftProduct = true;
        }
        this.isPaymentSkipped = this._publicSignupSevice.IsPaymentSkipped;
        this._publicSignupSevice.wizardControl = {
          review: 'done',
          account: 'done',
          confirm: 'current'
        };

    if (this._publicSignupSevice.publicSignupSharedScope.EnvironmentId !== null && this._publicSignupSevice.publicSignupSharedScope.EnvironmentId !== undefined && this._publicSignupSevice.publicSignupSharedScope.EnvironmentId !== '') {
      this.environmentId = this._publicSignupSevice.publicSignupSharedScope.EnvironmentId;
    }
    else {
      this._router.navigate(['welcome']);
      //$state.go('welcome.signup');
    }
    if (this._publicSignupSevice.publicSignupSharedScope.InternalPlanId !== null && this._publicSignupSevice.publicSignupSharedScope.InternalPlanId !== undefined && this._publicSignupSevice.publicSignupSharedScope.InternalPlanId !== '') {
      this.internalPlanId = this._publicSignupSevice.publicSignupSharedScope.InternalPlanId;
    }
    else {
      this._router.navigate(['welcome']);
      //$state.go('welcome.signup');
    }
    if (this._publicSignupSevice.publicSignupSharedScope.BatchId !== null && this._publicSignupSevice.publicSignupSharedScope.BatchId !== undefined && this._publicSignupSevice.publicSignupSharedScope.BatchId !== '') {
      this.signUpBatchId = this._publicSignupSevice.publicSignupSharedScope.BatchId;
    }
    else {
      this._router.navigate(['welcome']);
      //$state.go('welcome.signup');
    }
    this.configurePaymentSession();
    this.getBillingProvider();
  }

  getBillingProvider() {
    const sub = this._publicSignupSevice.getBillingprovider(this.internalPlanId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        let billingProvider = res.Data;
        if (billingProvider !== undefined && billingProvider !== null) {

          this.billingProviderName = billingProvider.Name;

          if (this.billingProviderName !== undefined && this.billingProviderName !== null) {
            this.getSupportedPaymentTypes();
            this.getMCBBillingConfig();
          }
        }
      });
    this._subscription.push(sub);
  }

  getMCBBillingConfig() {
    this._publicSignupSevice.getMCBBillingConfig(this.internalPlanId, this.billingProviderName).subscribe((response: any) => {
      const billingConfig = response.Data;
      this.merchantId = billingConfig.MerchantId;

      const url = `https://mcb.gateway.mastercard.com/form/version/58/merchant/${this.merchantId}/session.js`;

      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = () => {
        if (typeof PaymentSession !== 'undefined') {
          this.configurePaymentSession();
        } else {
          console.error('PaymentSession is not defined even after script load.');
          this.errorDetails('Payment form could not be initialized.');
        }
      };
      script.onerror = () => {
        console.error('Failed to load MCB session.js script');
        this.errorDetails('Error loading MCB payment script.');
      };

      document.body.appendChild(script);
    });
  }

  // saveCardDetails(): void {
  //   PaymentSession.updateSessionFromForm('card')((response: any) => {
  //     this.handleFormSessionUpdate(response);
  //   }, 'card');
  // }

  saveCardDetails(): void {
    PaymentSession.updateSessionFromForm('card');
  }

  getSupportedPaymentTypes() {
    const sub = this._publicSignupSevice.getSupportedPaymentTypes(this.internalPlanId, this.billingProviderName.toLowerCase())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        var supportedPaymentTypes = res.Data;
        if (supportedPaymentTypes !== undefined && supportedPaymentTypes !== null && supportedPaymentTypes.length > 0) {

          this.pageMode = supportedPaymentTypes[0].PaymentTypeName.toUpperCase();

          supportedPaymentTypes.forEach((paymentType: { PaymentTypeName: string; }) => {
            if (paymentType.PaymentTypeName !== null && paymentType.PaymentTypeName !== "") {
              if (paymentType.PaymentTypeName.toLowerCase() === "cc") {
                this.isCreditCardEnabled = true;

              }
              else if (paymentType.PaymentTypeName.toLowerCase() === "ach") {
                this.isACHEnabled = true;
              }
            }
          });
        }
        this._subscription.push(sub);
        this.cdRef.detectChanges();
      });
  }

  setPaymentTypePageMode(mode: string) {
    if (mode === "ACH") {
      this.newPaymentAccount.PaymentType = "ACH";
    }
    else {
      this.newPaymentAccount.PaymentType = "CreditCard";

    }
    this.pageMode = mode;
    this.cdRef.detectChanges();
  }

  configurePaymentSession(): void {
    if (self === top) {
      const antiClickjack = document.getElementById('antiClickjack');
      if (antiClickjack) {
        antiClickjack.parentNode.removeChild(antiClickjack);
      }
    } else {
      top.location = self.location;
    }

    PaymentSession.configure({
      fields: {
        card: {
          number: '#card-number',
          securityCode: '#security-code',
          expiryMonth: '#expiry-month',
          expiryYear: '#expiry-year',
          nameOnCard: '#cardholder-name'
        }
      },
      frameEmbeddingMitigation: ['javascript'],
      callbacks: {
        initialized: (response: any) => {
          // HANDLE INITIALIZATION RESPONSE
        },
        formSessionUpdate: (response: any) => {
          // HANDLE RESPONSE FOR UPDATE SESSION
          this.handleFormSessionUpdate(response);
        }
      },
      interaction: {
        displayControl: {
          formatCard: 'EMBOSSED',
          invalidFieldCharacters: 'REJECT'
        }
      }
    });
  }

  handleFormSessionUpdate(response: any): void {
    const scope = this;
    if (response.status) {
      if (response.status === 'ok') {
        //console.log('Session updated with data: ' + response.session.id);
        // Call Angular function
        this.sessionId = response.session.id;
        this.validate3DSToken(response);
        if (response.sourceOfFunds.provided.card.securityCode) {
          //console.log('Security code was provided.');
        }
        if (response.sourceOfFunds.provided.card.scheme === 'MASTERCARD') {
          //console.log('The user entered a Mastercard credit card.');
        }
      } else if (response.status === 'fields_in_error') {
        let errorMessage = '';
        //console.log('Session update failed with field errors.');
        if (response.errors.cardNumber) {
          errorMessage = 'Card number invalid or missing.';
        }
        if (response.errors.expiryYear) {
          errorMessage = 'Expiry year invalid or missing.';
        }
        if (response.errors.expiryMonth) {
          errorMessage = 'Expiry month invalid or missing.';
        }
        if (response.errors.securityCode) {
          errorMessage = 'Security code invalid.';
        }
        scope.errorDetails(errorMessage);
      } else if (response.status === 'request_timeout') {
        //console.log('Session update failed with request timeout: ' + response.errors.message);
        scope.errorDetails('Session update failed with request timeout: ' + response.errors.message);
      } else if (response.status === 'system_error') {
        //console.log('Session update failed with system error: ' + response.errors.message);
        scope.errorDetails('Session update failed with system error: ' + response.errors.message);
      }
    } else {
      //console.log('Session update failed: ' + response);
      scope.errorDetails('Session update failed: ' + response);
    }
  }

  skipPaymentAndContinue() {
    this.isProcessing = true;
    this.customerPublicSignUpModel = this._publicSignupSevice.CustomerPublicSignUpModel;
    this.customerPublicSignUpModel.BatchId = this.signUpBatchId;
    this.customerPublicSignUpModel.ProviderName = 'Microsoft';
    this.customerPublicSignUpModel.CustomerCurrencyCode = 'USD';
    this.customerPublicSignUpModel.IsPaymentSkipped = true;
    this.customerPublicSignUpModel.CartItems = { CartItems: JSON.stringify(this._publicSignupSevice.publicSignupSharedScope.cartProducts) };
    const sub = this._publicSignupSevice.setCustomer(this.customerPublicSignUpModel)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.isProcessing = false;
        if (res.Status === "Success" && res.Status !== null) {
          const confirmationText = this._translateService.instant(
            'TRANSLATE.CUSTOMER_PUBLIC_SIGN_UP_SUCCESS_MESSAGE');
          this._notifierService
            .confirm({ title: confirmationText })
            .then((result: { isConfirmed: any; isDenied: any }) => {
              /* Read more about isConfirmed, isDenied below */
              if (result.isConfirmed) {
                this._publicSignupSevice.cartCount = 0;
                this._publicSignupSevice.cartTotal = 0;
                this._publicSignupSevice.publicSignupSharedScope.cartProducts = [];
                this._router.navigate(['welcome']);
                //$state.go('welcome.signup.plandetails');
                this._publicSignupSevice.CustomerPublicSignUpModel = new CustomerPublicSignupModel();
              }
            });
        }
      });
    this._subscription.push(sub);
  }

  validate3DSToken(response: any): void {
    var postData = {
      BatchId: this.signUpBatchId,
      SessionId: response.session.id,
      AccountNumber: response.sourceOfFunds.provided.card.number,
      InternalPlanId: this.internalPlanId
    }
    this._publicSignupSevice.validate3DSToken(postData).subscribe({
      next: (res) => {
        this.currentPage = "VALIDATE";
        this.htmlContent = res;
        console.log(res);
        this.loadHtml(res);
        if (this.isIntervlSet === false) {
          this.IntervalFunction(); // Start auto-refresh
        }
      },
      error: (err) => {
        console.error("API Error:", err);
      }
    });
  }

  loadHtml(html: string) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  IntervalFunction() {
    this.cancelMCBPaymentPageTableReload = setInterval(() => {
      if (this.paymentProfileDetails == undefined || this.paymentProfileDetails == null) {
        this.isIntervlSet = true;
        this.getPaymentProfileStatus();
      }
      else if (this.paymentProfileDetails != undefined || this.paymentProfileDetails != null && this.paymentProfileDetails.Status == "Queued") {
        debugger;
        this.isIntervlSet = true;
        this.getPaymentProfileStatus();
      }
      else if (this.paymentProfileDetails != undefined && this.paymentProfileDetails != null && this.paymentProfileDetails.Status != "Success" && this.paymentProfileDetails.Status != "Failed") {
        if (this.isIntervlSet == false) {
          this.isIntervlSet = true;
          this.getPaymentProfileStatus();
        }
      }
      else {
        this.isIntervlSet = false;
        this.DestroyInterval();
        this.newPaymentAccount.AccountNumber = this.paymentProfileDetails.AccountNumber;
        this.newPaymentAccount.PaymentType = this.paymentProfileDetails.PaymentType;
        this._publicSignupSevice.CustomerPublicSignUpModel.PaymentModel = this.newPaymentAccount;
        this._publicSignupSevice.CustomerPublicSignUpModel.BatchId = this._publicSignupSevice.publicSignupSharedScope.BatchId;
        this._publicSignupSevice.CustomerPublicSignUpModel.CartItems = { CartItems: JSON.stringify(this.cartProducts) };
        this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/signuplogs`]);
      }
    }, 20000);
  }

  getPaymentProfileStatus() {
    this._publicSignupSevice.GetPaymentProfileStatus(this.sessionId).subscribe((result: any) => {
      this.paymentProfileDetails = result.Data;

      if (result.Data != undefined && result.Data != null && result.Status != undefined && result.Status != null && result.Data.Status.toLowerCase() == "failed") {
        if (result.ErrorDetail != undefined && result.ErrorDetail != null) {
          //notifier.notifyError($filter('translate')(result.data.Data.ErrorDetail));
        }

        if (this.isIntervlSet == true) {
          this.DestroyInterval();
        }
      }
      else if (this.paymentProfileDetails != undefined && this.paymentProfileDetails != null && this.paymentProfileDetails.Status == "Success") {
        if (this.isIntervlSet == true) {
          this.DestroyInterval();
        }
        this.isIntervlSet = false;
        this.DestroyInterval();
        this.newPaymentAccount.AccountNumber = this.paymentProfileDetails.AccountNumber;
        this.newPaymentAccount.PaymentType = this.paymentProfileDetails.PaymentType;
        this._publicSignupSevice.CustomerPublicSignUpModel.PaymentModel = this.newPaymentAccount;
        this._publicSignupSevice.CustomerPublicSignUpModel.BatchId = this._publicSignupSevice.publicSignupSharedScope.BatchId;
        this._publicSignupSevice.CustomerPublicSignUpModel.CartItems = { CartItems: JSON.stringify(this.cartProducts) };
        this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/signuplogs`]);
      }
    })
  }

  DestroyInterval() {
    if (this.cancelMCBPaymentPageTableReload != undefined && this.cancelMCBPaymentPageTableReload != null) {
      clearInterval(this.cancelMCBPaymentPageTableReload);
      this.cancelMCBPaymentPageTableReload = undefined;
    }
  }

  errorDetails(errorMessage: string): void {
    // Implement the Angular function to handle the error message
  }

  Cancel(): void {
    // Implement the Angular function to handle the cancel action
  }

  trustedMCB(value: string) {
    return this.sanitizer.bypassSecurityTrustHtml(value)
  }

  ngOnDestroy() {
    this._subscription?.forEach(v => v.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

}

class CustomerPublicSignupModel {
  /// <summary>
  /// Model to hold the Customer Details
  /// </summary>
  ProviderName: any | null;
  PaymentModel: any | null;
  CompanyName: any | null;
  Email: any | null;
  CustomerCurrencyCode: any | null;
  BatchId: any | null;
  IsCustomerConsentProvided: any | null;
  EnvironmentId: any | null;
  TenantId: any | null;
  DomainName: any | null;
  IsPaymentSkipped: any | null;
  CartItems: any | null;
}