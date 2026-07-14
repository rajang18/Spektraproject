import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateService } from '@ngx-translate/core';
import { Stripe } from '@stripe/stripe-js';
import _, { take } from 'lodash';
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { TranslationModule } from 'src/app/modules/i18n';
import { PublicSignupService } from 'src/app/modules/public-signup/services/public-signup.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { CardDetailsUtilities } from 'src/app/shared/utilities/card-details-utilities';

@Component({
  selector: 'app-public-signup-payment-details-billandpay',
  standalone: true,
  imports: [ReactiveFormsModule, TranslationModule, CommonModule, FormsModule,CurrencyPipe,NgSelectModule],
  templateUrl: './public-signup-payment-details-billandpay.component.html',
  styleUrl: './public-signup-payment-details-billandpay.component.scss'
})
export class PublicSignupPaymentDetailsBillandpayComponent implements OnInit, OnDestroy {
  _subscription: Subscription[] = [];
  paymentFormACH: FormGroup = new FormGroup({});
  paymentFormCC: FormGroup = new FormGroup({})
  //$rootScope.isPlandetails = false;
  cartProducts: any;
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
  customerPublicSignUpModel: CustomerPublicSignupModel = new CustomerPublicSignupModel();
  pageMode = "";
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
  stripe: Stripe | null = null;
  card: any;
  billingProviderName: any;
  paymentModeCC = true;
  products:any;
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
  isProcessing:boolean = false
  isSignupState:boolean;
  isEnablePublicSignupAssistance:boolean;
  isCartHasMicrosoftProduct:boolean;
  applyDiscountForCustomerProductsModel: ApplyDiscountForCustomerProductsModel;
  private cardDetailsUtilities: CardDetailsUtilities
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
    this.cardDetailsUtilities = new CardDetailsUtilities();
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
    this.newPaymentAccount.PaymentType = "CreditCard";
    this.paymentFormACH = this._fb.group({
      AccountNumber: ['', [Validators.required]],
      NameOnCard: ['', [Validators.required]],
      RoutingNumber: ['', [Validators.required]],
      AccountType: ['', [Validators.required]],
      IsBusinessAccount: ['', [Validators.required]],
    });

    
    this.paymentFormCC = this._fb.group({
      PaymentProfileAlias: [''],
      NameOnCard: [''],
      CreditCardNumber: ['', [Validators.required, this.cardNumberValidator.bind(this)]],
      Month: [''],
      Year: [''],
      CVV: [''],
    });

    Object.values(this.forms).forEach(form => this.trackFormChanges(form));

  }

  ngOnInit(): void {
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

    this.couponCode = this._publicSignupSevice.publicSignupSharedScope.couponCode; 
    this.cartDiscount = this._publicSignupSevice.publicSignupSharedScope.Discount;
    this.payableAmount = this._publicSignupSevice.publicSignupSharedScope.payableAmount;
    this.validCouponCode = this._publicSignupSevice.publicSignupSharedScope.couponCode;
    if (this.cartDiscount !== null) {
      this.isDiscountApplied = true;
    }
  }


  cardNumberValidator(control: any): { [key: string]: boolean } | null {
    this.cardType = this.cardDetailsUtilities.getCardType(control.value);
    if (!this.cardType) {
      return { invalidCardType: true };
    }
    return null;
  }

  Submit(form: FormGroup) {
    this.newPaymentAccount.IsBusinessAccount = +form.get('IsBusinessAccount')?.value;
    if ((this.newPaymentAccount.PaymentType === "ACH" || this.newPaymentAccount.PaymentType === "BankAccount") && (this.newPaymentAccount.IsBusinessAccount !== 0 && this.newPaymentAccount.IsBusinessAccount !== 1)) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].setErrors({ invalid: true });
      });
    }
    if (form.valid) {
      if (form === this.paymentFormCC) {
        this.newPaymentAccount.CreditCardNumber = form.get('CreditCardNumber')?.value
        this.newPaymentAccount.NameOnCard = form.get('NameOnCard')?.value
        this.newPaymentAccount.Month = form.get('Month')?.value
        this.newPaymentAccount.Year = form.get('Year')?.value
        this.newPaymentAccount.CVV = form.get('CVV')?.value
        this.newPaymentAccount.PaymentType = 'CreditCard';
        this.newPaymentAccount.CreditCardType = this.cardType;

      }
      if (form === this.paymentFormACH) {
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
      this._publicSignupSevice.CustomerPublicSignUpModel.BatchId = this.signUpBatchId;
      this._publicSignupSevice.CustomerPublicSignUpModel.CartItems = { CartItems: JSON.stringify(this._publicSignupSevice.publicSignupSharedScope.cartProducts) };

    }
    this._publicSignupSevice.CustomerPublicSignUpModel.PaymentModel = this.newPaymentAccount;
    this._publicSignupSevice.CustomerPublicSignUpModel.BatchId = this._publicSignupSevice.publicSignupSharedScope.BatchId;
    this._publicSignupSevice.CustomerPublicSignUpModel.CartItems = { CartItems: JSON.stringify(this.cartProducts) };

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

    //payment model is not set and batchid to be updated
    if (form.valid) {
      this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/signuplogs`]);
    }
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
        this.setPaymentTypePageMode(this.pageMode);
        supportedPaymentTypes.forEach((paymentType) => {
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
    this._subscription.push(sub);
  }

  setPaymentTypePageMode(mode: any) {
    if (mode === "ACH") {
      this.newPaymentAccount.PaymentType = "ACH";
    }
    else {
      this.newPaymentAccount.PaymentType = "CreditCard";

    }
    this.pageMode = mode;
    this.cdRef.detectChanges();
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
  this._subscription.push(sub);
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

  removeCouponApplied() {
      this.isCouponValidationInProgress = true;
      _.each(this.products, (product) => {
          this.removeDiscount(product);

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
      if (this._publicSignupSevice.publicSignupSharedScope !== undefined && this._publicSignupSevice.publicSignupSharedScope !== null)
      {
          this._publicSignupSevice.publicSignupSharedScope.couponCode = null;
      }
      this.validCouponCode = null;
      this.isCouponValid = false;
      this.isDiscountApplied = false;
      this.isCouponValidationInProgress = false;
  }

  removeDiscount(product: any) {
    product.SalePrice = product.SalePrice;
    product.Discount = product.PlanDiscount;
    product.DiscountType = product.PlanDiscountType;
    product.OriginlaSalePrice = product.OriginlaSalePrice;
    if (product.Discount !== 0 && product.DiscountType === 'Percentage') {
      product.FinalSalePrice = product.OriginlaSalePrice - (product.OriginlaSalePrice * (product.Discount / 100));
    } else if (product.Discount !== 0 && product.DiscountType === 'Price') {
      product.FinalSalePrice = product.OriginlaSalePrice - product.Discount;
    } else {
      product.FinalSalePrice = product.OriginlaSalePrice;
    }
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

    const sub = this._publicSignupSevice.validatecoupon(this.couponCode, this.internalPlanId)
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
        var productWithDiscount = _.find(this.productsWithDiscounts, function (item) {
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
          .confirm({ title: confirmationText, icon: 'success', showCancelButton:false, confirmButtonText:this._translateService.instant('TRANSLATE.CUSTOMER_PUBLIC_SIGN_UP_BUTTON_TEXT_DONE') ,  confirmButtonColor: 'green', })
          .then((result: { isConfirmed: any; isDenied: any }) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
              this._publicSignupSevice.cartCount = 0;
              this._publicSignupSevice.cartTotal = 0
              this._publicSignupSevice.publicSignupSharedScope.cartProducts = [];
              this._publicSignupSevice.searchKeyword = null;
              this._publicSignupSevice.CustomerPublicSignUpModel = new CustomerPublicSignupModel();

              this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/shop`]);
              //$state.go('welcome.signup.plandetails');
              this._publicSignupSevice.CustomerPublicSignUpModel = new CustomerPublicSignupModel();
            }
          });
      }
    });
    this._subscription.push(sub);
  }

  ngOnDestroy(): void {
    this._subscription?.forEach(v=>v.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
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

class ApplyDiscountForCustomerProductsModel {
  /// <summary>
  /// Model to hold the Customer Products
  /// </summary>
  InternalPlanId: any | null;
  Products: any | null;
  CouponCode: any | null;
}