import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, of, Subject, Subscription, switchMap, takeUntil, tap } from 'rxjs';
import { PaymentProfileService } from 'src/app/modules/home/profile/services/paymentprofile.service';
import { TranslationModule } from 'src/app/modules/i18n';
import { PublicSignupService } from 'src/app/modules/public-signup/services/public-signup.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { CardDetailsUtilities } from 'src/app/shared/utilities/card-details-utilities';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { Utility } from 'src/app/shared/utilities/utility';
import { nanoid } from 'nanoid';
import _ from 'lodash';
@Component({
  selector: 'app-public-signup-payment-details-authorizenet',
  standalone: true,
  imports: [ReactiveFormsModule, TranslationModule, CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './public-signup-payment-details-authorizenet.component.html',
  styleUrl: './public-signup-payment-details-authorizenet.component.scss'
})
export class PublicSignupPaymentDetailsAuthorizenetComponent {
  private destroy$ = new Subject<void>();
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
  isEnablePublicSignupAssistance: boolean;
  isCartHasMicrosoftProduct: boolean;
  customerPublicSignUpModel: CustomerPublicSignupModel = new CustomerPublicSignupModel();
  pageMode = "CC";
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
  @ViewChild('authorize', { static: false }) iframeElement!: ElementRef<HTMLIFrameElement>;

  _subscription: Subscription[] = [];
  // paymentFormACH: FormGroup;
  bankAccountTypes: any = ["Checking", "Savings"];
  newPaymentAccount: any = { AccountType: "CreditCard" };
  // cardType: string | null = null;
  hostedPageToken: any;
  billingProviderJSEndPointUrl: SafeResourceUrl | undefined;
  customerDetails: any = {
    Name: null,
    BillingProviderReferenceID: null
  };
  @ViewChild('demoCheckoutForm') demoCheckoutForm!: ElementRef<HTMLFormElement>;
  private cardDetailsUtilities: CardDetailsUtilities;

  constructor(
    private fb: FormBuilder,
    private _router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    public _publicSignupSevice: PublicSignupService,
    private sanitizer: DomSanitizer,
    private _toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    public paymentProfileService: PaymentProfileService,
    private _unsavedChangesService: UnsavedChangesService,
    public _translateService: TranslateService,
    public notifierService: NotifierService,
  ) {
    //super(_translateService,notifierService);
    this.cardDetailsUtilities = new CardDetailsUtilities();
    this.cartProducts = this._publicSignupSevice.publicSignupSharedScope.cartProducts;
        this.isSignupState = this._router.url.includes('shop');
        this.microsoftProductInCart = _.filter(this.cartProducts, (product: any) => {
          return product.ProviderName === 'Microsoft';
        });
        
        _.forEach(this.cartProducts, (cartProducts: any) => {
          this.linkedProducts = _.find(this.cartProducts, (product: any) => {
            return product.LinkedSubscription != null;
          })
          if(this.linkedProducts != null){
            let indexOfLinkedProduct = _.findIndex(this.cartProducts, (product: any) => {
              return product?.LinkedSubscription?.ProviderName === 'Microsoft';
            })
            if(indexOfLinkedProduct >= 0){
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
    // Initialize payment form with validators
    this.paymentFormACH = this.fb.group({
      PaymentProfileAlias: ['', Validators.required],
      AccountNumber: ['', Validators.required],
      NameOnCard: ['', Validators.required],
      RoutingNumber: ['', Validators.required],
      AccountType: ['', Validators.required],
    });

  }

  // Angular lifecycle hook that is called after data-bound properties are initialized
  ngOnInit(): void {
    this.newPaymentAccount.PaymentType = "CreditCard";

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
    //this.getBillingProvider();
    // setTimeout(() => {
    //   this.initializeStripeView();
    // }, 500);
    this.couponCode = this._publicSignupSevice.publicSignupSharedScope.couponCode;
    this.cartDiscount = this._publicSignupSevice.publicSignupSharedScope.Discount;
    this.payableAmount = this._publicSignupSevice.publicSignupSharedScope.payableAmount;
    this.validCouponCode = this._publicSignupSevice.publicSignupSharedScope.couponCode;
    this.createBillingCustomer();
    window['CommunicationHandler'] = {};
    window['CommunicationHandler'].onReceiveCommunication = (argument: any) => {
      this.onReceiveCommunication(argument);
    };

  }
  createBillingCustomer() {
    //this.hasPaymentTemplateLoaded = false;
    // if (this._publicSignupSevice.CustomerPublicSignUpModel?.IsInstantPay === true) {
    const nanoId = nanoid(19);
    this._publicSignupSevice.CustomerPublicSignUpModel.BillingProviderCustomerId = nanoId;
    // }
    // else {
    const sub = this._publicSignupSevice.setBillingCustomer(this._publicSignupSevice.CustomerPublicSignUpModel)
      .pipe(takeUntil(this.destroy$),
        tap((result: any) => {
          this.customerDetails.BillingProviderReferenceID = result.Data;
        }),
        switchMap((result: any) =>
          this._publicSignupSevice.geHostedToken(this.customerDetails.BillingProviderReferenceID)
        ),
        tap((result: any) => {
          this.billingProviderJSEndPointUrl = this.sanitizer.bypassSecurityTrustResourceUrl(result?.Data?.JsEndPointUrl);
          this.hostedPageToken = result?.Data?.HostedToken;
          setTimeout(() => {
            const form = this.demoCheckoutForm?.nativeElement;
            if (form) {
              form.submit();
            }
          }, 100);
        }),
        catchError((error: any) => {
          const errorMessage = error?.error?.ErrorMessage;
          const translatedErrorMessage = this._translateService.instant(`TRANSLATE.${errorMessage}`);
          this._toastService.error(translatedErrorMessage);
          return of(); // Or handle the error as required
        })
      ).subscribe((res: any) => {
        this._publicSignupSevice.CustomerPublicSignUpModel.BillingProviderCustomerId = this.customerDetails.BillingProviderReferenceID;
        this.hasPaymentTemplateLoaded = true;
      });
    this._subscription.push(sub)
    // }
    this.cdRef.detectChanges();
  }
  onReceiveCommunication(argument) {
    let params = this.parseQueryString(argument.qstr);
    let parentFrame = argument.parent.split('/')[4];
    //console.log(params);
    //console.log(parentFrame);
    //alert(params['height']);
    let $frame = null;
    switch (parentFrame) {
      case "addPayment": $frame = $("#add_payment"); break;
    }

    switch (params['action']) {
      case "resizeWindow":
        break;
      case "successfulSave":
        this.onSubmit();
        break;
      case "cancel":
        this.onCancel();
        break;
    }
  };

  parseQueryString(str) {
    var vars = [];
    var arr = str.split('&');
    var pair;
    for (var i = 0; i < arr.length; i++) {
      pair = arr[i].split('=');
      vars[pair[0]] = decodeURIComponent(pair[1]);
    }
    return vars;
  }

  onSubmit() {
    // this._publicSignupSevice.get().subscribe((result: any) => {
    this.newPaymentAccount = {
      PaymentProfileAlias: null, //#TODO: get the alias name
      PaymentType: null,
      PaymentProfileReference: null,
      NameOnCard: null,
      CreditCardType: null,
      Month: null,
      Year: null,
      AccountNumber: null,
      RoutingNumber: null
    };
    this._publicSignupSevice.CustomerPublicSignUpModel.BillingProviderPaymentProfileId = null;
    this._publicSignupSevice.CustomerPublicSignUpModel.PaymentModel = this.newPaymentAccount;
    this._publicSignupSevice.CustomerPublicSignUpModel.BatchId = this.signUpBatchId;
    this._publicSignupSevice.CustomerPublicSignUpModel.CartItems = { CartItems: JSON.stringify(this._publicSignupSevice.publicSignupSharedScope.cartProducts) };

    this._publicSignupSevice.publicSignupSharedScope.formCart = undefined;
    this._publicSignupSevice.publicSignupSharedScope.isExistingMsTenant = undefined;
    this._publicSignupSevice.publicSignupSharedScope.frmExistingMsTenant = undefined;
    this._publicSignupSevice.publicSignupSharedScope.frmCustomerPublicSignUp = undefined;
    this._publicSignupSevice.publicSignupSharedScope.couponCode = undefined;
    this._publicSignupSevice.CustomerPublicSignUpModel.CouponCode = undefined;
    this._publicSignupSevice.publicSignupSharedScope.Discount = undefined;
    this._publicSignupSevice.publicSignupSharedScope.payableAmount = undefined;

    this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/signuplogs`]);
    // })


  }


  onDiscard(form) {
    this.onCancel();
    form.reset();
    this.newPaymentAccount = {};

  }
  onCancel() {
        this._router.navigate([`signup/${this._publicSignupSevice.publicSignupSharedScope.EnvironmentId}/${this._publicSignupSevice.publicSignupSharedScope.InternalPlanId}/cart`]);
  }

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
              //this.getProductsAddedToCart();
              this.getDiscountsForProductsAddedToCart();

            }
          }
        }
      });
    this._subscription.push(sub);
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
          this.notifierService
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

  // Clean up subscriptions
  ngOnDestroy() {
    this._subscription?.forEach(v => v.unsubscribe());
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
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
