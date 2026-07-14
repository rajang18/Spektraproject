import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import _, { filter } from 'lodash';
import { catchError, distinctUntilChanged, lastValueFrom, of, Subject, Subscription, takeUntil } from 'rxjs';
import { TranslationModule } from 'src/app/modules/i18n';
import { PublicSignupService } from 'src/app/modules/public-signup/services/public-signup.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { Utility } from 'src/app/shared/utilities/utility';

@Component({
  selector: 'app-public-signup-payment-details-stripe',
  standalone: true,
  imports: [ReactiveFormsModule, TranslationModule, CommonModule, FormsModule, CurrencyPipe, C3CommonModule],
  templateUrl: './public-signup-payment-details-stripe.component.html',
  styleUrl: './public-signup-payment-details-stripe.component.scss'
})
export class PublicSignupPaymentDetailsStripeComponent implements OnInit, OnDestroy {
  _subscription: Subscription[] = [];
  paymentFormACH: FormGroup = new FormGroup({});
  paymentFormCC: FormGroup = new FormGroup({})
  //$rootScope.isPlandetails = false;
  cartProducts: any;
  ccClientSecret: any;
  microsoftProductInCart: any;
  linkedProducts: any;
  linkedMicrosoftSubscription: any;
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
  isEnablePublicSignupAssistance: boolean;
  isCartHasMicrosoftProduct: boolean;
  customerPublicSignUpModel: CustomerPublicSignupModel = new CustomerPublicSignupModel();
  pageMode = "";
  // $rootScope.wizardControl = {
  //     review: 'done',
  //     account: 'done',
  //     confirm: 'current'
  //   };
  isCreditCardEnabled = false;
  isACHEnabled = false;
  isLoading: boolean = false;
  bankAccountTypes = ["Checking", "Savings"];
  newPaymentAccount: any = [{ AccountType: "", PaymentType: "" }];
  submitButtonClicked = false;
  stripe: Stripe | null = null;
  card: any;
  billingProviderName: any;
  paymentModeCC = true;
  products: any;
  payableAmount = null;
  cartDiscount = null;
  productsWithDiscounts: any;
  finalSalePriceOfProductsInCart: any;
  isDiscountApplied = false;
  validCouponCode = null;
  isCouponValid = false;
  isApplyCoupon = true;
  isCouponValidationInProgress = false;
  couponCode: any;
  couponDetails: any;
  cardType: string | null = null;
  planProductIds: any;
  isProcessing: boolean = false
  isSignupState: boolean;
  applyDiscountForCustomerProductsModel: ApplyDiscountForCustomerProductsModel;
  forms: { [key: string]: FormGroup } = {
    paymentFormCC: this.paymentFormCC,
    paymentFormACH: this.paymentFormACH
    // Add other forms here
  };
  private destroy$ = new Subject<void>;
  constructor(
    public _publicSignupSevice: PublicSignupService,
    private _router: Router,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _fb: FormBuilder,
    private _notifierService: NotifierService,
    private cdRef: ChangeDetectorRef,
    private _unsavedChangesService: UnsavedChangesService

  ) {
    this._publicSignupSevice.isPlandetails = false;
    this.cartProducts = this._publicSignupSevice.publicSignupSharedScope.cartProducts;
    this.isSignupState = this._router.url.includes('shop');
    this.microsoftProductInCart = _.filter(this.cartProducts, (product: any) => {
      return product.ProviderName === 'Microsoft';
    });

    _.forEach(this.cartProducts, (cartProducts: any) => {
      this.linkedProducts = _.find(this.cartProducts, (product: any) => {
        return product.LinkedSubscription != null;
      })
      if (this.linkedProducts != null) {
        let indexOfLinkedProduct = _.findIndex(this.cartProducts, (product: any) => {
          return product?.LinkedSubscription?.ProviderName === 'Microsoft';
        })
        if (indexOfLinkedProduct >= 0) {
          if (this.cartProducts[indexOfLinkedProduct].LinkedSubscription.ProviderName === 'Microsoft') {
            this.linkedMicrosoftSubscription = this.cartProducts[indexOfLinkedProduct].LinkedSubscription;
          }
          else {
            this.linkedMicrosoftSubscription = null;
          }
        }
      }
    })


    if (this.microsoftProductInCart[0]?.EnablePublicSignupAssistance === true || this.linkedMicrosoftSubscription?.EnablePublicSignupAssistance === true) {
      this.isEnablePublicSignupAssistance = true;
    }
    if (this.microsoftProductInCart != null || this.linkedProducts != null) {
      this.isCartHasMicrosoftProduct = true;
    }
    this.isPaymentSkipped = this._publicSignupSevice.IsPaymentSkipped;
    this._publicSignupSevice.wizardControl = {
      review: 'done',
      account: 'done',
      confirm: 'current'
    };
    this.newPaymentAccount.PaymentType = "CreditCard";
    this.paymentFormACH = this._fb.group({
      PaymentProfileAlias: [''],
      AccountNumber: [''],
      NameOnCard: [''],
      RoutingNumber: [''],
      AccountType: [''],
      IsBusinessAccountString: [''],
    });

    this.paymentFormCC = this._fb.group({
      PaymentProfileAlias: ['']
    });

    Object.values(this.forms).forEach(form => this.trackFormChanges(form));

  }

  ngOnInit(): void {

    this._publicSignupSevice.isShopScreen = false;

    this._publicSignupSevice.cartTotal = this._publicSignupSevice.cartTotal ? this._publicSignupSevice.cartTotal : 0;
    this._publicSignupSevice.cartCount = this._publicSignupSevice.cartCount ? this._publicSignupSevice.cartCount : 0;

    this.products = this._publicSignupSevice.publicSignupSharedScope.cartProducts || [];

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
    this.getBillingProvider();
    setTimeout(() => {
      this.initializeStripeView();
    }, 500);
    this.couponCode = this._publicSignupSevice.publicSignupSharedScope.couponCode;
    this.cartDiscount = this._publicSignupSevice.publicSignupSharedScope.Discount;
    this.payableAmount = this._publicSignupSevice.publicSignupSharedScope.payableAmount;
    this.validCouponCode = this._publicSignupSevice.publicSignupSharedScope.couponCode;
    if (this.cartDiscount !== null) {
      this.isDiscountApplied = true;
    }
  }

  initializeStripeView() {
    this.hasPaymentTemplateLoaded = true;
    const sub = this._publicSignupSevice.getBillingProviderConfigForPayment(this.internalPlanId).pipe(
      catchError((err) => {
        this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_GETTING_STRIPE_DETAILS'))
        return of(null);
      }), takeUntil(this.destroy$))
      .subscribe(async (res: any) => {
        var billingProviderconfig = res.Data;
        this.stripe = await loadStripe(billingProviderconfig.StripePublicKey);
        var elements = this.stripe.elements();

        var style = {
          base: {
            // Add your base input styles here. For example:
            fontSize: '16px',
            color: "#32325d"
          }
        };
        // Create an instance of the card Element.
        this.card = elements.create('card', { style: style });

        // Add an instance of the card Element into the `card-element` <div>.
        this.card.mount('#card-element');
        this.card.addEventListener('change', (event: { error: { message: string; }; }) => {
          var displayError = document.getElementById('stripe-errors');
          if (event.error) {
            displayError.textContent = event.error.message;
          } else {
            displayError.textContent = '';
          }
        });
      });
    this._subscription.push(sub);
    this.cdRef.detectChanges();
  }

  Submit(form: FormGroup) {
    form.markAllAsTouched();
    this.newPaymentAccount.AccountType = form.get('AccountType')?.value;
    if ((this.newPaymentAccount.PaymentType === "ACH" || this.newPaymentAccount.PaymentType === "BankAccount") && (this.newPaymentAccount.AccountType !== 'company' && this.newPaymentAccount.AccountType !== 'individual')) {
      //form.valid = false;
      // Iterate through each control in the form and set an error
      Object.keys(form.controls).forEach(key => {
        form.controls[key].setErrors({ invalid: true });
      });
    }

    if (form.valid) {
      this.newPaymentAccount.PaymentProfileAlias = form.get('PaymentProfileAlias')?.value
      this.hasPaymentTemplateLoaded = false;
      this.createPaymentToken();

      this._publicSignupSevice.CustomerPublicSignUpModel.BatchId = this.signUpBatchId;
      this._publicSignupSevice.CustomerPublicSignUpModel.CartItems = { CartItems: JSON.stringify(this._publicSignupSevice.publicSignupSharedScope.cartProducts) };

    }
  }

  getBillingProvider() {
    const sub = this._publicSignupSevice.getBillingprovider(this.internalPlanId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        var billingProvider = res.Data;
        if (billingProvider !== undefined && billingProvider !== null) {

          this.billingProviderName = billingProvider.Name;

          if (this.billingProviderName !== undefined && this.billingProviderName !== null) {
            this.getSupportedPaymentTypes();
            this.createBillingCustomer();
          }
        }
      });
    this._subscription.push(sub);
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
        this.cdRef.detectChanges();
      });
    this._subscription.push(sub)
  }

  createBillingCustomer() {
    this.hasPaymentTemplateLoaded = false;
    // if (this._publicSignupSevice.CustomerPublicSignUpModel?.IsInstantPay === true) {
    //   this._publicSignupSevice.CustomerPublicSignUpModel.BillingProviderCustomerId = Utility.NewGUID();
    // }
    // else {
    const sub = this._publicSignupSevice.setBillingCustomer(this._publicSignupSevice.CustomerPublicSignUpModel)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this._publicSignupSevice.CustomerPublicSignUpModel.BillingProviderCustomerId = res.Data;
        this.hasPaymentTemplateLoaded = true;
      });
    this._subscription.push(sub)
    // }
    this.cdRef.detectChanges();
  }

  setPaymentTypePageMode(mode: string) {
    if (mode === "ACH") {
      this.newPaymentAccount.PaymentType = "ACH";
    }
    else {
      this.newPaymentAccount.PaymentType = "CreditCard";
      setTimeout(() => {
        this.initializeStripeView();
      }, 1000);
    }
    this.pageMode = mode;
    this.cdRef.detectChanges();

  }

  async createPaymentToken() {
    if (this.newPaymentAccount.PaymentType === 'CreditCard') {
      this.isLoading = true
      try {
        const requestBody = {
          BillingCustomerId: this._publicSignupSevice.CustomerPublicSignUpModel.BillingProviderCustomerId,
          PaymentType: 'card',
          InternalPlanID: this._publicSignupSevice.publicSignupSharedScope.InternalPlanId,
          PaymentMethodID: null,
          BatchId: this.signUpBatchId
        }
        const setupResult: any = await lastValueFrom(
          this._publicSignupSevice.createSetupIntent(requestBody)
        );
        this.isLoading = true

        this.ccClientSecret = setupResult.Data;
        this.hasPaymentTemplateLoaded = true;
        const result: any = await this.stripe.confirmCardSetup(this.ccClientSecret, {
          payment_method: {
            card: this.card,
            billing_details: {
              name: this.newPaymentAccount.NameOnCard
            }
          }
        });
        this.isLoading = true

        if (result.error) {

          const errorElement = document.getElementById('stripe-errors');
          if (errorElement) {
            errorElement.textContent = result.error.message;
          }

          this.hasPaymentTemplateLoaded = true;
          this.isLoading = false;

          return;
        }
        const paymentMethod = result.setupIntent.payment_method;
        const cardDetails = await this.fetchCardDetails(paymentMethod);
        this.buildPaymentModel(paymentMethod, cardDetails);
        //Clear errors
        let errorElement = document.getElementById('stripe-errors');
        //errorElement.textContent = '';
        this._publicSignupSevice.CustomerPublicSignUpModel.BillingProviderPaymentProfileId = paymentMethod;
        this._publicSignupSevice.CustomerPublicSignUpModel.PaymentModel = this.newPaymentAccount;

        this._publicSignupSevice.publicSignupSharedScope.formCart = undefined;
        this._publicSignupSevice.publicSignupSharedScope.isExistingMsTenant = undefined;
        this._publicSignupSevice.publicSignupSharedScope.frmExistingMsTenant = undefined;
        this._publicSignupSevice.publicSignupSharedScope.frmCustomerPublicSignUp = undefined;
        this._publicSignupSevice.publicSignupSharedScope.couponCode = undefined;
        //CJ: Commenting due to issue #78963 where coupon discounts are not getting applied in invoice as coupon code is being sent as NULL in request body and hene the CouponCode is getting saved as NULL in staging table.
        //this._publicSignupSevice.CustomerPublicSignUpModel.CouponCode = undefined;
        this._publicSignupSevice.publicSignupSharedScope.Discount = undefined;
        this._publicSignupSevice.publicSignupSharedScope.payableAmount = undefined;
        // If a user applies a Coupon once and changed the coupon without applying
        if ((this.couponCode !== null && this.couponCode !== '' && this.couponCode !== undefined) && (this.validCouponCode !== null)) {
          if ((this.couponCode !== this.validCouponCode)) {
            this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_CART_CREATION_PLEASE_VALIDATE_THE_COUPON_ENTERED'));
            return;
          }
        }
        else if ((this.couponCode !== null && this.couponCode !== '' && this.couponCode !== undefined) && (this.validCouponCode === null)) {
          this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_CART_CREATION_PLEASE_VALIDATE_THE_COUPON_ENTERED'));
          return;
        }
        else {
          var couponCode = _.chain(this.products).map(each => each.CouponCode).compact().uniq().join(',').value();
          if (this._publicSignupSevice.CustomerPublicSignUpModel && this._publicSignupSevice.CustomerPublicSignUpModel !== null) {
            //if ($rootScope.alreadyPresentCouponCode !== couponCode) {}
            this._publicSignupSevice.CustomerPublicSignUpModel.CouponCode = couponCode;
            this._publicSignupSevice.alreadyPresentCouponCode = couponCode;
          }
        }
        this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/signuplogs`]);
      }
      catch (err) {
        this.isLoading = false;
      }

      finally {
        this.isLoading = false;
      }


    }

    else if (this.newPaymentAccount.PaymentType === 'ACH') {
      this.newPaymentAccount = {
        PaymentProfileAlias: this.newPaymentAccount.PaymentProfileAlias,
        PaymentType: 'Bank Account',
        PaymentProfileReference: null,
        NameOnCard: this.newPaymentAccount.NameOnCard,
        CreditCardType: null,
        Month: null,
        Year: null,
        AccountNumber: this.newPaymentAccount.AccountNumber,
        RoutingNumber: this.newPaymentAccount.RoutingNumber,
        AccountType: this.newPaymentAccount.AccountType
      };

      this._publicSignupSevice.CustomerPublicSignUpModel.PaymentModel = this.newPaymentAccount;
      this._publicSignupSevice.publicSignupSharedScope.formCart = undefined;
      this._publicSignupSevice.publicSignupSharedScope.isExistingMsTenant = undefined;
      this._publicSignupSevice.publicSignupSharedScope.frmExistingMsTenant = undefined;
      this._publicSignupSevice.publicSignupSharedScope.frmCustomerPublicSignUp = undefined;
      this._publicSignupSevice.publicSignupSharedScope.couponCode = undefined;
      //CJ: Commenting due to issue #78963 where coupon discounts are not getting applied in invoice as coupon code is being sent as NULL in request body and hene the CouponCode is getting saved as NULL in staging table. 
      //this._publicSignupSevice.CustomerPublicSignUpModel.CouponCode = undefined;
      this._publicSignupSevice.publicSignupSharedScope.Discount = undefined;
      this._publicSignupSevice.publicSignupSharedScope.payableAmount = undefined;

      // If a user applies a Coupon once and changed the coupon without applying
      if ((this.couponCode !== null && this.couponCode !== '' && this.couponCode !== undefined) && (this.validCouponCode !== null)) {
        if ((this.couponCode !== this.validCouponCode)) {
          this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_CART_CREATION_PLEASE_VALIDATE_THE_COUPON_ENTERED'));
          return;
        }
      }
      else if ((this.couponCode !== null && this.couponCode !== '' && this.couponCode !== undefined) && (this.validCouponCode === null)) {
        this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_CART_CREATION_PLEASE_VALIDATE_THE_COUPON_ENTERED'));
        return;
      }
      else {
        var couponCode = _.chain(this.products).map(each => each.CouponCode).compact().uniq().join(',').value();
        if (this._publicSignupSevice.CustomerPublicSignUpModel && this._publicSignupSevice.CustomerPublicSignUpModel !== null) {
          //if ($rootScope.alreadyPresentCouponCode !== couponCode) {}
          this._publicSignupSevice.CustomerPublicSignUpModel.CouponCode = couponCode;
          this._publicSignupSevice.alreadyPresentCouponCode = couponCode;
        }
      }

      this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/signuplogs`]);
      //$state.go('welcome.signup.signuplogs');
    }
  }


  async fetchCardDetails(paymentMethod: string) {

    const reqBody = {
      InternalPlanID: this._publicSignupSevice.publicSignupSharedScope.InternalPlanId,
      PaymentMethodID: paymentMethod,
      BatchId: this.signUpBatchId
    };

    const res: any = await lastValueFrom(
      this._publicSignupSevice.getStripePaymentDetails(reqBody)
    );

    return res.Data?.[0];

  }

  buildPaymentModel(paymentMethod: string, card: any) {

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

    if (!this._publicSignupSevice.CustomerPublicSignUpModel) {
      this._publicSignupSevice.CustomerPublicSignUpModel = {};
    }

    this._publicSignupSevice.CustomerPublicSignUpModel.PaymentModel = this.newPaymentAccount;
    this._publicSignupSevice.CustomerPublicSignUpModel.BillingProviderPaymentProfileId = paymentMethod;

  }

  //   $timeout(function () {
  //     vm.InitializeStripeView();
  //     formService.cleanseForm(vm.paymentForm);
  //     formService.watchForChanges('vm.paymentForm', $scope);
  // }, 500);

  redirectToBillingInformation() {
    this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/customer`]);
    //$state.go('welcome.signup.customer');
  }


  getCartItemsInStorage(products: any = null) {
    ;
    if (products != null) {
      this.products = products;
    } else {
      this.products = this._publicSignupSevice.publicSignupSharedScope.cartProducts || [];
    }
    this.getCartTotal();
  }

  getCartTotal() {
    this._publicSignupSevice.cartTotal = 0;
    this._publicSignupSevice.cartCount = 0;
    _.map(this.products, each => {
      this._publicSignupSevice.cartTotal = this._publicSignupSevice.cartTotal + (each.SalePrice * each.Quantity);
      this._publicSignupSevice.cartCount += 1;
      if (each.Addons && each.Addons.length > 0) {
      }
      if (each.LinkedProduct && each.LinkedProduct.PlanProductId >= 0) {
        if (each.IsPrimaryInLinkedProduct) {
          this._publicSignupSevice.cartCount += 1;
          //console.log(this._publicSignupSevice.cartCount);
          this._publicSignupSevice.cartTotal = this._publicSignupSevice.cartTotal + (each.LinkedProduct.SalePrice * each.LinkedProduct.Quantity);
        }
      }
    });
    this.getDiscountAndPayableAmount();
  }

  getDiscountAndPayableAmount() {
    this.payableAmount = this._publicSignupSevice.publicSignupSharedScope.payableAmount || null;
    this.cartDiscount = this._publicSignupSevice.publicSignupSharedScope.Discount || null;
    let originalPriceofProductsInCart = 0;
    this.finalSalePriceOfProductsInCart = null;
    if (this.products !== null && this.products.length > 0) {
      this.calculateFinalSalePrice();
      if (this.finalSalePriceOfProductsInCart !== null) {
        this.cartDiscount = this._publicSignupSevice.cartTotal - this.finalSalePriceOfProductsInCart;
        if (this.cartDiscount !== null) {
          this.payableAmount = this._publicSignupSevice.cartTotal - this.cartDiscount;
          this.isDiscountApplied = true;
          this.isCouponValidationInProgress = false;
        }
      }
    }
    this.checkIfMicrosoftProductIsPresentInCart();
  }

  checkIfMicrosoftProductIsPresentInCart() {
    let planProductIds = [];
    _.each(this._publicSignupSevice.publicSignupSharedScope.cartProducts, (item: any) => {
      planProductIds.push(item.PlanProductId);
    });

    let combinedString = planProductIds.join(',');

    if (combinedString !== undefined && combinedString !== null) {
      combinedString = combinedString.toString();
    }
    let reqBody = { PlanProductIds: combinedString };
    const sub = this._publicSignupSevice.getProviderListForPlanProductIds(reqBody)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        let microsoftProducts = _.find(response.Data, (item: any) => {
          return item.ProviderName === "Microsoft" || item.ProviderName === "microsoft";
        });
        if (microsoftProducts !== undefined && microsoftProducts !== null && microsoftProducts !== "") {
          this.isMicrosoftProductAvailable = true;
        }
      });
    this._subscription.push(sub)
  }

  calculateFinalSalePriceForAddons(product: any) {
    _.map(product.Addons, each => {
      this.finalSalePriceOfProductsInCart = this.finalSalePriceOfProductsInCart + (each.FinalSalePrice * each.Quantity);
      if (each.Addons && each.Addons.length > 0) {
        this.calculateFinalSalePriceForAddons(each);
      }
    });
  }

  calculateFinalSalePrice() {
    this.finalSalePriceOfProductsInCart = 0;
    _.map(this.products, each => {
      this.finalSalePriceOfProductsInCart = this.finalSalePriceOfProductsInCart + (each.FinalSalePrice * each.Quantity);
      if (each.Addons && each.Addons.length > 0) {
        this.calculateFinalSalePriceForAddons(each);
      }
      if (each.LinkedProduct && each.LinkedProduct.PlanProductId >= 0) {
        if (each.IsPrimaryInLinkedProduct) {
          this.finalSalePriceOfProductsInCart = this.finalSalePriceOfProductsInCart + (each.LinkedProduct.FinalSalePrice * each.LinkedProduct.Quantity);
        }
      }
    });
  }

  removeDiscountFromProduct(product: any) {
    product.SalePrice = product.SalePrice;
    product.Discount = product.PlanDiscount;
    product.DiscountType = product.PlanDiscountType;
    product.OriginlaSalePrice = product.OriginlaSalePrice;
    this._publicSignupSevice.publicSignupSharedScope.couponCode = null;
    if (product.Discount !== 0 && product.DiscountType === 'Percentage') {
      product.FinalSalePrice = product.OriginlaSalePrice - (product.OriginlaSalePrice * (product.Discount / 100));
    } else if (product.Discount !== 0 && product.DiscountType === 'Price') {
      product.FinalSalePrice = product.OriginlaSalePrice - product.Discount;
    } else {
      product.FinalSalePrice = product.OriginlaSalePrice;
    }
  }

  removeCouponApplied() {
    this.isCouponValidationInProgress = true;
    _.each(this.products, (product) => {
      this.removeDiscountFromProduct(product);

      if (product.Addons && product.Addons.length > 0) {
        this.removeDiscountForAddons(product);
      }
      if (product.LinkedProduct && product.LinkedProduct.PlanProductId >= 0) {
        if (product.IsPrimaryInLinkedProduct) {
          this.removeDiscountForLinkedProduct(product.LinkedProduct);
        }
      }
      if (product.LinkedSubscription && product.LinkedSubscription.PlanProductId >= 0) {
        if (product.IsPrimaryInLinkedProduct) {
          this.removeDiscountForLinkedProduct(product.LinkedSubscription);
        }
      }
    });
    this.getDiscountAndPayableAmount();
    this.couponCode = null;
    if (this._publicSignupSevice.CustomerPublicSignUpModel !== undefined && this._publicSignupSevice.CustomerPublicSignUpModel !== null) {
      this._publicSignupSevice.CustomerPublicSignUpModel.CouponCode = null;
    }
    if (this._publicSignupSevice.publicSignupSharedScope !== undefined && this._publicSignupSevice.publicSignupSharedScope !== null) {
      this._publicSignupSevice.publicSignupSharedScope.couponCode = null;
    }
    this.validCouponCode = null;
    this.isCouponValid = false;
    this.isDiscountApplied = false;
    this.isCouponValidationInProgress = false;
  }

  removeDiscountForAddons(product: any) {
    _.each(product.Addons, (addon) => {
      this.removeDiscount(addon);
      if (addon.Addons && addon.Addons.length > 0) {
        this.removeDiscountForAddons(addon);
      }
    });
  }

  removeDiscountForLinkedProduct(product: any) {
    this.removeDiscount(product);
  }

  removeDiscount(product: any) {
    product.SalePrice = product.SalePrice;
    product.Discount = product.PlanDiscount;
    product.DiscountType = product.PlanDiscountType;
    product.OriginlaSalePrice = product.OriginlaSalePrice;
    this._publicSignupSevice.publicSignupSharedScope.couponCode = null;
    if (product.Discount !== 0 && product.DiscountType === 'Percentage') {
      product.FinalSalePrice = product.OriginlaSalePrice - (product.OriginlaSalePrice * (product.Discount / 100));
    } else if (product.Discount !== 0 && product.DiscountType === 'Price') {
      product.FinalSalePrice = product.OriginlaSalePrice - product.Discount;
    } else {
      product.FinalSalePrice = product.OriginlaSalePrice;
    }
  }

  checkOutCart() {
    this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/cart`]);
    // "$state.go('welcome.signup.cart')"
  }

  refreshCoupon() {
    this.isApplyCoupon = true;
  }

  validateCoupon() {
    this.isCouponValidationInProgress = true;
    //this._publicSignupSevice.CustomerPublicSignUpModel.CouponCode = null;
    this._publicSignupSevice.publicSignupSharedScope.couponCode = this.couponCode;

    const sub = this._publicSignupSevice.validatecoupon(this.couponCode, this._publicSignupSevice.publicSignupSharedScope.InternalPlanId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res.Status === "Success" && res.Data !== null) {
          this.couponDetails = res.Data;
          if (!this.couponDetails.IsCouponValid) {
            this._toastService.error(this._translateService.instant('TRANSLATE.INVALID_COUPON'));
            this.removeCouponApplied();
          }
          else {
            this.isCouponValid = true;
            this.isApplyCoupon = false;
            this.validCouponCode = this.couponCode;
            this._publicSignupSevice.CustomerPublicSignUpModel.CouponCode = this.couponCode;
            if ((this.couponDetails !== null && this.couponDetails !== undefined) && (this.couponDetails.Discount !== null)) {
              this.getProductsAddedToCart();
              this.getDiscountsForProductsAddedToCart();

            }
          }
        }
      });
    this._subscription.push(sub);
  }

  getProductsAddedToCart() {
    this.planProductIds = null;
    this.products.forEach((item) => {
      this.planProductIds = this.planProductIds + (this.planProductIds !== null ? "," + item.PlanProductId : item.PlanProductId);
      if (item.Addons && item.Addons.length > 0) {
        this.getProductIdsForAddons(item);
      }
    });
  }
  getProductIdsForAddons(product: any) {
    _.map(product.Addons, each => {
      this.planProductIds = this.planProductIds + (this.planProductIds !== null ? "," + each.PlanProductId : each.PlanProductId);
      if (each.Addons && each.Addons.length > 0) {
        this.getProductIdsForAddons(each);
      }
    });
  }

  getDiscountsForProductsAddedToCart() {
    if (this.planProductIds !== null) {
      this.applyDiscountForCustomerProductsModel = new ApplyDiscountForCustomerProductsModel();
      this.applyDiscountForCustomerProductsModel.InternalPlanId = this.internalPlanId;
      this.applyDiscountForCustomerProductsModel.Products = this.planProductIds;
      this.applyDiscountForCustomerProductsModel.CouponCode = this.couponCode;
      const sub = this._publicSignupSevice.getDiscountForProducts(this.applyDiscountForCustomerProductsModel)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: any) => {
          this.productsWithDiscounts = res.Data;
          this.applyDiscountForProducts();
        });
      this._subscription.push(sub);
    }
  }

  applyDiscountForProducts() {
    _.each(this.products, (product) => {
      var productWithDiscount = _.find(this.productsWithDiscounts, (item) => {
        return item.PlanProductId === product.PlanProductId;
      });
      if (productWithDiscount !== undefined && productWithDiscount !== null) {
        product.ProviderSettings = JSON.parse(productWithDiscount.ProviderSettings);
        product.Settings = JSON.parse(productWithDiscount.Settings);
        product.SalePrice = productWithDiscount.SalePrice;
        product.Discount = productWithDiscount.Discount;
        product.DiscountType = productWithDiscount.DiscountType;
        product.OriginalSalePrice = productWithDiscount.OriginlaSalePrice;
        product.FinalSalePrice = productWithDiscount.FinalSalePrice;
      }

      if (product.Addons && product.Addons.length > 0) {
        this.applyDiscountForAddons(product);
      }
      if (product.LinkedProduct && product.LinkedProduct.PlanProductId >= 0) {
        if (product.IsPrimaryInLinkedProduct) {
          this.applyDiscountForLinkedProduct(product.LinkedProduct);
        }
      }
      if (product.LinkedSubscription && product.LinkedSubscription.PlanProductId >= 0) {
        if (product.IsPrimaryInLinkedProduct) {
          this.applyDiscountForLinkedProduct(product.LinkedSubscription);
        }
      }
    });

    this.getDiscountAndPayableAmount();
  }

  applyDiscountForAddons(product: any) {
    _.each(product.Addons, (addon) => {
      var productWithDiscount = _.find(this.productsWithDiscounts, (item) => {
        return item.PlanProductId === addon.PlanProductId;
      });
      if (productWithDiscount !== undefined && productWithDiscount !== null) {
        addon.ProviderSettings = JSON.parse(productWithDiscount.ProviderSettings);
        addon.Settings = JSON.parse(productWithDiscount.Settings);
        addon.SalePrice = productWithDiscount.SalePrice;
        addon.Discount = productWithDiscount.Discount;
        addon.DiscountType = productWithDiscount.DiscountType;
        addon.OriginlaSalePrice = productWithDiscount.OriginlaSalePrice;
        addon.FinalSalePrice = productWithDiscount.FinalSalePrice;
      }

      if (addon.Addons && addon.Addons.length > 0) {
        this.applyDiscountForAddons(addon);
      }
    });
  }

  applyDiscountForLinkedProduct(product: any) {
    var productWithDiscount = _.find(this.productsWithDiscounts, (item) => {
      return item.PlanProductId === product.PlanProductId;
    });
    if (productWithDiscount !== undefined && productWithDiscount !== null) {
      product.ProviderSettings = JSON.parse(productWithDiscount.ProviderSettings);
      product.Settings = JSON.parse(productWithDiscount.Settings);
      product.SalePrice = productWithDiscount.SalePrice;
      product.Discount = productWithDiscount.Discount;
      product.DiscountType = productWithDiscount.DiscountType;
      product.OriginlaSalePrice = productWithDiscount.OriginlaSalePrice;
      product.FinalSalePrice = productWithDiscount.FinalSalePrice;
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
            .confirm({ title: confirmationText, icon: 'success', showCancelButton: false, confirmButtonText: this._translateService.instant('TRANSLATE.CUSTOMER_PUBLIC_SIGN_UP_BUTTON_TEXT_DONE'), confirmButtonColor: 'green', })
            .then((result: { isConfirmed: any; isDenied: any }) => {
              /* Read more about isConfirmed, isDenied below */
              if (result.isConfirmed) {
                this._publicSignupSevice.cartCount = 0;
                this._publicSignupSevice.cartTotal = 0;
                this._publicSignupSevice.publicSignupSharedScope.cartProducts = [];
                this._publicSignupSevice.searchKeyword = null;
                this._publicSignupSevice.CustomerPublicSignUpModel = new CustomerPublicSignupModel();

                this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/shop`]);
                //$state.go('welcome.signup.plandetails');
              }
            });
        }
      });
    this._subscription.push(sub);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
    this._subscription?.forEach(v => v.unsubscribe());
  }

  private trackFormChanges(form: FormGroup) {
    const sub = form.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this._unsavedChangesService.setUnsavedChanges(form.dirty);
    });
    this._subscription.push(sub);
  }
}

class CustomerPublicSignupModel {
  /// <summary>
  /// Model to hold the Customer Details
  /// </summary>
  ProviderName: any | null;
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
class ApplyDiscountForCustomerProductsModel {
  /// <summary>
  /// Model to hold the Customer Products
  /// </summary>
  InternalPlanId: any | null;
  Products: any | null;
  CouponCode: any | null;
}
