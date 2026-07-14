import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { PublicSignupService } from '../services/public-signup.service';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ApplyNceOfferPopupComponent } from '../../standalones/apply-nce-offer-popup/apply-nce-offer-popup.component';
import { PromotionDetailComponent } from '../../standalones/promotion-detail/promotion-detail.component';
import { MODAL_DIALOG_CLASS, PromotionDetailsPopupConfig } from 'src/app/shared/models/promoton-details.model';
import { ProductItemDetails } from 'src/app/shared/models/product-item-details';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-public-signup-cart',
  templateUrl: './public-signup-cart.component.html',
  styleUrl: './public-signup-cart.component.scss'
})
export class PublicSignupCartComponent extends C3BaseComponent implements OnInit, AfterViewInit {
  page = 'Cart';
  formCart: FormGroup;
  products = [];
  totalItemCount = 0;
  totalPrice = 0.00;
  totalDiscountedPrice = 0.00;
  discount = 0.00;
  currencySymbol = '$';
  currencyDecimalPlaces = '2';
  currencyDecimalSeparator = '.';
  constructorurrencyThousandSeparator = ',';
  isApplyCoupon = true;
  isExistingMsTenant = false;
  cartTotal = 0;
  internalPlanId = null;
  environmentId = null;
  signUpBatchId = null;
  couponCode = null;
  planCouponCode = null;
  validCouponCode = null;
  isCouponValid = false;
  isDiscountApplied = false;
  isCouponValidationInProgress = false;
  //$rootScope.isPlandetails = false;
  //$rootScope.cartTotal = $rootScope.cartTotal ? $rootScope.cartTotal : 0;
  //$rootScope.cartCount = $rootScope.cartCount ? $rootScope.cartCount : 0;
  isMicrosoftProductAvailable = false;
  countOfAddonsCount = 0;
  badQuantity = false;
  NCEProductInCart = [];
  nonNCEProductInCart = [];
  isAgreedtoNCETermsAndConditionOnOrder = false;
  NCETermsAndConditionURL = '';
  NCETermsAndConditionURLText = '';
  enableNCETermsAndCondition = false;
  isPlanlevelCoupon: any;
  defaultTermsAndConditionText = '';
  defaultTermsAndConditionURL = '';
  submitButtonClicked = false;
  billingProviderName = '';
  couponDetails: any;
  planProductIds: any;
  applyDiscountForCustomerProductsModel: ApplyDiscountForCustomerProductsModel;
  productsWithDiscounts: any;
  finalSalePriceOfProductsInCart: any;
  productItemDetails: any = new ProductItemDetails();
  payableAmount = null;
  cartDiscount = null;
  @ViewChild('goBackToShopText', { static: false }) goBackToShopText!: ElementRef;
  activeServiceDetail: any;
  backFromCreateCustomerForm: any;
  billingInformationFormSubmitted: any;
  isSignupState:boolean;

  //Action buttons
  permissions = {
    HasGetCustomerCart: "Allowed",
    HasCartCheckout: "Allowed",
    HasSaveCart: "Allowed",
    HasDeleteCartItem: "Allowed",
    HasManageProductApproval: "Denied",
    HasSubscriptionEndDateAlignment: "Denied",
    AreNcePromotionsEnabled: "Denied",
    HasGetActiveExternalServices: "Denied",
  }; 

  constructor(
    public _permission: PermissionService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    public _publicSignUpService: PublicSignupService,
    public _router: Router,
    public renderer: Renderer2,
    private _modalService: NgbModal,
    private _formBuilder: FormBuilder,
    public _dynamicTemplateService: DynamicTemplateService,
    private cdRef: ChangeDetectorRef,
    private appsettings: AppSettingsService
  ) {
    super(_permission, _dynamicTemplateService, _router, appsettings); this._publicSignUpService.isPlandetails = false;
    this._publicSignUpService.cartTotal = this._publicSignUpService.cartTotal ? this._publicSignUpService.cartTotal : 0;
    this._publicSignUpService.cartCount = this._publicSignUpService.cartCount ? this._publicSignUpService.cartCount : 0;
    this.isPlanlevelCoupon = this._publicSignUpService.alreadyPresentCouponCode;
    this.isSignupState = this._router.url.includes('shop');
    const navigation = this._router.getCurrentNavigation();
    this.backFromCreateCustomerForm = navigation?.extras.state?.['backFromCreateCustomerForm'];
    this.billingInformationFormSubmitted = navigation?.extras.state?.['billingInformationFormSubmitted'];
    if( this.billingInformationFormSubmitted){
      this._publicSignUpService.billingInformationFormSubmitted =  this.billingInformationFormSubmitted
    }
  }
  ngOnInit() {
    this._publicSignUpService.isShopScreen = false;
    this.couponCode = this._publicSignUpService.publicSignupSharedScope.couponCode || null;
    this.cartDiscount = this._publicSignUpService.publicSignupSharedScope.Discount || null;
    this.payableAmount = this._publicSignUpService.publicSignupSharedScope.payableAmount || null;
    this.validCouponCode = this._publicSignUpService.publicSignupSharedScope.couponCode || null;
    this.planCouponCode = this._publicSignUpService.publicSignupSharedScope.planCouponCode || null;
    
    this.formCart = this._publicSignUpService.publicSignupSharedScope.formCart || this._formBuilder.group({
      DefaultTermsAndConditionText: [(this._publicSignUpService.publicSignupSharedScope.DefaultTermsAndConditionText ? true:false) || false, [Validators.requiredTrue]],
      NCETermsAndConditionURLText: [this._publicSignUpService.publicSignupSharedScope.NCETermsAndConditionURLText || false, Validators.requiredTrue],
      isExistingMsTenant: [this._publicSignUpService.publicSignupSharedScope.isExistingMsTenant || false],
    });
    this.formCart.get("DefaultTermsAndConditionText").disable();
    this.formCart.get("NCETermsAndConditionURLText").disable(); 

    if(this._publicSignUpService.CustomerPublicSignUpModel != undefined ||this._publicSignUpService.CustomerPublicSignUpModel != null){
       this._publicSignUpService.CustomerPublicSignUpModel.Domain = this._publicSignUpService.publicSignupSharedScope.Domain || null;
    }
    // need to check with Cynthia
    if (this._publicSignUpService.publicSignupSharedScope.EnvironmentId !== null && this._publicSignUpService.publicSignupSharedScope.EnvironmentId !== undefined && this._publicSignUpService.publicSignupSharedScope.EnvironmentId !== '') {
      this.environmentId = this._publicSignUpService.publicSignupSharedScope.EnvironmentId;
    }
    else {
      this._router.navigate(['welcome']);
      //$state.go('welcome.signup');
    }
    if (this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== null && this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== undefined && this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== '') {
      this.internalPlanId = this._publicSignUpService.publicSignupSharedScope.InternalPlanId;
    }
    else {
      this._router.navigate(['welcome']);
      //$state.go('welcome.signup');
    }
    if (this._publicSignUpService.SignUpBatchId !== null && this._publicSignUpService.SignUpBatchId !== undefined && this._publicSignUpService.SignUpBatchId !== '') {
      this.signUpBatchId = this._publicSignUpService.SignUpBatchId;
    }

    if (this._publicSignUpService.CustomerPublicSignUpModel?.CouponCode !== null && this._publicSignUpService.CustomerPublicSignUpModel?.CouponCode !== undefined && this._publicSignUpService.CustomerPublicSignUpModel?.CouponCode !== '') {
      this.couponCode = this._publicSignUpService.CustomerPublicSignUpModel.CouponCode != this._publicSignUpService.alreadyPresentCouponCode ? this._publicSignUpService.CustomerPublicSignUpModel.CouponCode : null;
      if (this.couponCode !== null) {
        this.validateCoupon();
      }
    }
    

    /*   if (vm.CouponCode !== null || vm.CouponCode !== '' || vm.CouponCode !== undefined) {  
       if ($rootScope.CustomerPublicSignUpModel?.CouponCode && $rootScope.CustomerPublicSignUpModel?.CouponCode != $rootScope.planCouponCode) {
           vm.validCouponCode = $rootScope.CustomerPublicSignUpModel.CouponCode;
           vm.CouponCode = $rootScope.CustomerPublicSignUpModel.CouponCode;
       }
       else {
           vm.CouponCode = null;
       }
   }*/

    if (this._publicSignUpService.CustomerPublicSignUpModel?.CouponCode !== null && this._publicSignUpService.CustomerPublicSignUpModel?.CouponCode !== undefined && this._publicSignUpService.CustomerPublicSignUpModel?.CouponCode !== '') {
      // vm.validCouponCode = $rootScope.CustomerPublicSignUpModel.CouponCode;
      this.couponCode = this._publicSignUpService.CustomerPublicSignUpModel.CouponCode != this._publicSignUpService.alreadyPresentCouponCode ? this._publicSignUpService.CustomerPublicSignUpModel.CouponCode : null;
      //&& vm.validCouponCode !== null && vm.isCouponValid
      if (this.couponCode !== null) {
        this.validateCoupon();
      }
    }
    if (this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== null && this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== undefined && this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== '') {
      this.internalPlanId = this._publicSignUpService.publicSignupSharedScope.InternalPlanId;
      if (this.internalPlanId !== null && this.internalPlanId !== '') {
        const subscription = this._publicSignUpService.getPlanDetails(this.internalPlanId).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          this._publicSignUpService.publicSignupPlanName = res.Data;
        });
        this._subscriptionArray.push(subscription);
      }
    }
    this.productItemDetails.productType = 'public-signup-cart';
    this.hasPermission();
    this.getCartItemsInStorage();
    this.getCartTotal();
  }

  ngAfterViewInit(): void {
    setTimeout(()=>{  
      if(this.goBackToShopText)
      {
        let translatedText = this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_CART_PAGE_TEXT_INFO_NO_PRODUCTS2');
        this.goBackToShopText.nativeElement.innerHTML = translatedText; 
        const anchor = this.goBackToShopText.nativeElement.querySelector('a');
        if (anchor) {
          anchor.classList.add('goBackToShopText-link');
          this.renderer.listen(anchor, 'click', () => this.gotoShop());
        }
      }
    })
    super.ngAfterViewInit()
  }


  getActiveServiceDetails() {
    if (this.permissions.HasGetActiveExternalServices == "Allowed") {
      const subscription = this.appsettings.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.activeServiceDetail = response;
      })
      this._subscriptionArray.push(subscription);
    }
  }

  isExistingMsTenantChange() {
    this._publicSignUpService.publicSignupSharedScope.isExistingMsTenant = this.formCart.get('isExistingMsTenant')?.value;
  }

  hasPermission() {
    this.permissions.HasManageProductApproval = this._permission.hasPermission(CloudHubConstants.MANAGE_PRODUCT_APPROVAL);
    this.permissions.AreNcePromotionsEnabled = this._permission.hasPermission(CloudHubConstants.ARE_NCE_PROMOTIONS_ENABLED);
    this.permissions.HasSubscriptionEndDateAlignment = this._permission.hasPermission(CloudHubConstants.SUBSCRIPTION_END_DATE_ALIGNMENT);
    this.permissions.HasGetActiveExternalServices = this._permission.hasPermission('GET_ACTIVE_EXTERNAL_SERVICE');
  }

  // Recursive function to delete an addon with deleteFlag=true
  deleteProduct(product: any) {
    if (!product.deleteFlag) {
      // Check if Addons exist for the product
      if (product.Addons && product.Addons.length) {
        product.Addons.forEach((eachAddon) => {
          //Deletes eachAddon with deleteFlag=true from product.Addons
          if (eachAddon.deleteFlag === true) {
            product.Addons.splice(product.Addons.indexOf(eachAddon), 1);
          } //Deletes an addon in eachAddon.Addons with deleteFlag=true
          else if (eachAddon.Addons && eachAddon.Addons.length) {
            var newEachAddon = this.deleteProduct(eachAddon);
            product.Addons.splice(product.Addons.indexOf(eachAddon), 1, newEachAddon);
          } else {
            // Do nothing
          }
        });
        return product;
      }
      return product;
    }
  }

  trackByIndex(index: number, item: any): number {
    return index; // or item.id if available
  }

  deleteProductFromCart(product: any) {
    const confirmationText = this._translateService.instant("TRANSLATE.CART_PRODUCT_DELETE_CONFIRMATION");
    
    this._notifierService.confirm({
      title: confirmationText,
      icon: 'error',
      confirmButtonColor: 'green',
      confirmButtonText: "Confirm"
    }).then((result: { isConfirmed: boolean; isDenied: boolean }) => {
      if (!result.isConfirmed) return;
  
      product.deleteFlag = true;
  
      // Filter products using shared logic
      this.products = _.filter(this.products, each => this.deleteProduct(each));
      this._publicSignUpService.publicSignupSharedScope.cartProducts = this.products;
  
      // Separate NCE/non-NCE
      this.NCEProductInCart = _.filter(this.products, p => p.CategoryName === 'OnlineServicesNCE');
      this.nonNCEProductInCart = _.filter(this.products, p => p.CategoryName !== 'OnlineServicesNCE');
  
      this._toastService.success(this._translateService.instant('TRANSLATE.CART_PRODUCT_DELETE_SUCCESS_MESSAGE'));
  
      this.getCartTotal();
  
      if (this.validCouponCode !== null && this.isCouponValid) {
        this.getDiscountAndPayableAmount();
      }
  
      if (this.products.length === 0) {
        this.ngAfterViewInit();
      }
  
      // Refresh products after delay
      this.products = [];
      setTimeout(() => {
        this.products = this._publicSignUpService.publicSignupSharedScope.cartProducts;
      }, 100);
    });
  }
  

  updateCartItemQuantity(cartLineItem: any) {
    cartLineItem.OriginalQuantity = cartLineItem.Quantity;
    if (cartLineItem.LinkedSubscription && cartLineItem.LinkedSubscription.PlanProductId >= 0) {
      if (cartLineItem.IsPrimaryInLinkedProduct) {
        cartLineItem.LinkedSubscription.Quantity = cartLineItem.Quantity;
      }
    }
    if (cartLineItem.LinkedProduct && cartLineItem.LinkedProduct.PlanProductId >= 0) {
      if (cartLineItem.IsPrimaryInLinkedProduct) {
        cartLineItem.LinkedProduct.Quantity = cartLineItem.Quantity;
      }
    }
    this._publicSignUpService.publicSignupSharedScope.cartProducts = this.products;
    this.getCartTotal();
    if (this.validCouponCode !== null && this.isCouponValid) {
      this.getDiscountAndPayableAmount();
    }
  }

  getCartItemsInStorage(products: any = null) {
    if (products != null) {
      this.products = products;
    } else {
      this.products = this._publicSignUpService.publicSignupSharedScope.cartProducts || [];
    }
    this._publicSignUpService.publicSignupSharedScope.DefaultTermsAndConditionText = this.products[0]?.DefaultTermsAndConditionText;
    this.defaultTermsAndConditionURL = this.products[0]?.DefaultTermsAndConditionURL;
    this.defaultTermsAndConditionText = this.products[0]?.DefaultTermsAndConditionText;
    this.NCEProductInCart = _.filter(this.products, (object) => {
      return object.CategoryName == 'OnlineServicesNCE';
    });
    this.nonNCEProductInCart = _.filter(this.products, (object) => {
      return object.CategoryName != 'OnlineServicesNCE';
    });
    if (this.NCEProductInCart != null && this.NCEProductInCart.length > 0) {
      this.NCETermsAndConditionURL = this.NCEProductInCart[0].NCETermsAndConditionURL;
      this.NCETermsAndConditionURLText = this.NCEProductInCart[0].NCETermsAndConditionURLText;
      this.enableNCETermsAndCondition = this.NCEProductInCart[0].EnabledNCETermsAndConditions;
    }
    if (this.nonNCEProductInCart.length != 0 && this.nonNCEProductInCart != undefined) {
      if (this.defaultTermsAndConditionURL != '' && this.nonNCEProductInCart[0].EnableDefaultTermsAndCondition == true) {
        this.formCart.get("DefaultTermsAndConditionText").enable();
      }
      else {
        this.formCart.get("DefaultTermsAndConditionText").disable();
      }
    }
    else {
      this.formCart.get("DefaultTermsAndConditionText").disable();
    }
    if (this.NCEProductInCart.length != 0 && this.NCEProductInCart != undefined) {
      if (this.NCEProductInCart[0].CategoryName == 'OnlineServicesNCE' && this.NCETermsAndConditionURL != '' && this.enableNCETermsAndCondition) {
        this.formCart.get("NCETermsAndConditionURLText").enable();
      }
      else {
        this.formCart.get("NCETermsAndConditionURLText").disable();
      }
    }
    else {
      this.formCart.get("NCETermsAndConditionURLText").disable();
    }
    this.getCartTotal();
  }

  checkoutCart() {
    this._publicSignUpService.publicSignupSharedScope.formCart = this.formCart;

    this.getCartItemsInStorage(this.products);
    this._publicSignUpService.IsExistingMsTenant = this.isExistingMsTenant;
    this.submitButtonClicked = true;

    if (this.formCart.valid || this.formCart.disabled) {
      
      //check if any quantity is 0 or invalid
      this._publicSignUpService.publicSignupSharedScope.cartProducts?.map(e => {
        if (e.Quantity == null || e.Quantity == undefined || e.Quantity == '' || e.Quantity <= 0) {
          this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_INVALID_QUANTITY'));
          this.badQuantity = true;
          return;
        }
        else {
          //first level addons
          if (e.Addons.length && e.Addons.length > 0) {
            e.Addons.map(f => {
              if (f.Quantity == null || f.Quantity == '' || f.Quantity == undefined || f.Quantity <= 0) {
                this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_INVALID_QUANTITY'));
                this.badQuantity = true;
                return;
              }
              else {
                // second level addons
                if (f.Addons.length && f.Addons.length > 0) {
                  f.Addons.map(g => {
                    if (g.Quantity == null || g.Quantity == '' || g.Quantity == undefined || g.Quantity <= 0) {
                      this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_INVALID_QUANTITY'));
                      this.badQuantity = true;
                      return;
                    }
                  });
                }
              }
            });
          }
        }
      }); 

      if (this.badQuantity == true) {
        return;
      }

      // If a user applies a Coupon once and changed the coupon without applying
      if ((this.couponCode !== null && this.couponCode !== '' && this.couponCode !== undefined) && (this.validCouponCode !== null)) {
        if ((this.couponCode !== this.validCouponCode)) {
          this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_CART_CREATION_PLEASE_VALIDATE_THE_COUPON_ENTERED'));
        }
        else {
          this.proceedForCheckout();
        }
      }
      else if ((this.couponCode !== null && this.couponCode !== '' && this.couponCode !== undefined) && (this.validCouponCode === null)) {
        this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_CART_CREATION_PLEASE_VALIDATE_THE_COUPON_ENTERED'));
      }
      else {
        var couponCode = _.chain(this.products).map(each => each.CouponCode).compact().uniq().join(',').value();
        if (this._publicSignUpService.CustomerPublicSignUpModel && this._publicSignUpService.CustomerPublicSignUpModel !== null) {
          //if ($rootScope.alreadyPresentCouponCode !== couponCode) {}
          this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = couponCode;
          this._publicSignUpService.alreadyPresentCouponCode = couponCode;
        }

        this.proceedForCheckout();
      }
    }
    else {
      this.badQuantity = false;
      this.submitButtonClicked = true;
      if (this.formCart.valid || this.formCart.disabled) {
        //check if any quantity is 0 or invalid
        this._publicSignUpService.publicSignupSharedScope.cartProducts?.map(e => {
          if (e.Quantity == null || e.Quantity == undefined || e.Quantity == '' || e.Quantity <= 0) {
            this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_INVALID_QUANTITY'));
            this.badQuantity = true;
            return;
          }
          else {
            //first level addons
            if (e.Addons.length && e.Addons.length > 0) {
              e.Addons.map(f => {
                if (f.Quantity == null || f.Quantity == '' || f.Quantity == undefined || f.Quantity <= 0) {
                  this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_INVALID_QUANTITY'));
                  this.badQuantity = true;
                  return;
                }
                else {
                  // second level addons
                  if (f.Addons.length && f.Addons.length > 0) {
                    f.Addons.map(g => {
                      if (g.Quantity == null || g.Quantity == '' || g.Quantity == undefined || g.Quantity <= 0) {
                        this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_INVALID_QUANTITY'));
                        this.badQuantity = true;
                        return;
                      }
                    });
                  }
                }
              });
            }
          }
        });

        if (this.badQuantity != false) {
          return;
        }

        // If a user applies a Coupon once and changed the coupon without applying
        if ((this.couponCode !== null && this.couponCode !== '' && this.couponCode !== undefined) && (this.validCouponCode !== null)) {
          if ((this.couponCode !== this.validCouponCode)) {
            this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_CART_CREATION_PLEASE_VALIDATE_THE_COUPON_ENTERED'));
          }
          else {
            this.proceedForCheckout();
          }
        }
        else if ((this.couponCode !== null && this.couponCode !== '' && this.couponCode !== undefined) && (this.validCouponCode === null)) {
          this._toastService.error(this._translateService.instant('TRANSLATE.PUBLIC_SIGNUP_CART_CREATION_PLEASE_VALIDATE_THE_COUPON_ENTERED'));
        }
        else {
          var couponCode = _.chain(this.products).map(each => each.CouponCode).compact().uniq().join(',').value();
          if (this._publicSignUpService.CustomerPublicSignUpModel && this._publicSignUpService.CustomerPublicSignUpModel !== null) {
            //if ($rootScope.alreadyPresentCouponCode !== couponCode) {}
            this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = couponCode;
            this._publicSignUpService.alreadyPresentCouponCode = couponCode;
          }
          this.proceedForCheckout();
          //if (vm.Products[0].EnableDefaultTermsAndCondition == true) {
          //    if (!vm.IsAgreedtoNCETermsAndConditionOnOrder) {
          //        notifier.confirm("",
          //            $filter('translate')('CUSTOMER_ORDER_CART_TERMS_AND_CONDITION_IS_NOT_ENABLED_TEXT'),
          //            true,
          //            function () {
          //            },
          //            true
          //        );
          //    }
          //    else {
          //        vm.ProceedForCheckout();
          //    }
          //}
          //else {
          //    vm.ProceedForCheckout();
          //}
        }
      }
    }

  }

  proceedForCheckout() {
    this.billingProviderName = this._publicSignUpService.publicSignupSharedScope.BillingProviderName;
    if (this.billingProviderName === undefined || this.billingProviderName === null) {
      this.billingProviderName = "none";
    }

    if (this.billingProviderName !== undefined && this.billingProviderName !== null && this.billingProviderName.toLowerCase() === 'authorize.net') {
      this.billingProviderName = "authorizenet";
    }

    if (this.billingProviderName !== undefined && this.billingProviderName !== null && this.billingProviderName.toLowerCase() === 'stripe') {
      var url = "https://js.stripe.com/v3";

      var myCoolCode = document.createElement("script");
      myCoolCode.setAttribute("src", url);
      document.body.appendChild(myCoolCode);
    }

    if (this._publicSignUpService.CustomerPublicSignUpModel === undefined || this._publicSignUpService.CustomerPublicSignUpModel === null) { 
      this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/customer`]);
    }
    else {
      var nonLicenseSupportedOffers = _.find(this.products, (item) => {
        return item.CategoryName != "LicenseSupported";
      });

      if (nonLicenseSupportedOffers !== undefined && nonLicenseSupportedOffers !== null) {

        this._publicSignUpService.CustomerPublicSignUpModel.IsInstantPay = false;
      }
      else {
        this._publicSignUpService.CustomerPublicSignUpModel.IsInstantPay = true;
      }

      if (this.isMicrosoftProductAvailable === true && ((this._publicSignUpService.CustomerPublicSignUpModel.IsCustomerConsentProvided === undefined || this._publicSignUpService.CustomerPublicSignUpModel.IsCustomerConsentProvided === null) || (this._publicSignUpService.CustomerPublicSignUpModel.Domain === undefined || this._publicSignUpService.CustomerPublicSignUpModel.Domain === null))) { 
        this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/customer`]);
      }
      else { 
        let paymentroute = 'none'
        if (this.billingProviderName.toLocaleLowerCase() == 'stripe') {
          paymentroute = 'st';
        } 
        else if (this.billingProviderName.toLocaleLowerCase() == 'ezidebit') {
          paymentroute = 'ez';
        } 
        else if (this.billingProviderName.toLocaleLowerCase() == 'billandpay') {
          paymentroute = 'bp';
        } 
        else if (this.billingProviderName.toLocaleLowerCase() == 'authorizenet') {
          paymentroute = 'an';
        }
        else if (this.billingProviderName.toLocaleLowerCase() == 'mcb') {
          paymentroute = 'mcb';
        }
        this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/paymentDetails/${paymentroute}`]);
      }
    }
  }

  // It's only for MCB billing provider to load pre defined javascript code
  getMCBBillingConfig() {
    const subscription = this._publicSignUpService.getBillingProviderConfig(this.internalPlanId, this.billingProviderName).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      var billingConfig = res.Data;
      //vm.merchantId = billingConfig.MerchantId;
      //var url = "https://mcb.gateway.mastercard.com/form/version/58/merchant/" + vm.merchantId + "/session.js";

      //var myCoolCode = document.createElement("script");
      //myCoolCode.setAttribute("src", url);
      //document.body.appendChild(myCoolCode);

      if (this._publicSignUpService.CustomerPublicSignUpModel === undefined || this._publicSignUpService.CustomerPublicSignUpModel === null) {
        this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/customer`]);
        //$state.go('welcome.signup.customer');
      } else {
        this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/paymentDetails-${this.billingProviderName.toLocaleLowerCase()}`]);
        //$state.go('welcome.signup.paymentdetails-' + vm.BillingProviderName.toLowerCase(), { internalPlanId: vm.internalPlanId });
      }
    });
    this._subscriptionArray.push(subscription);
  }

  findCartTotalForAddons(product: any) {
    _.map(product.Addons, each => {
      this._publicSignUpService.cartTotal = this._publicSignUpService.cartTotal + (each.SalePrice * each.Quantity);
      this._publicSignUpService.cartCount += 1;
      if (each.Addons && each.Addons.length > 0) {
        this.findCartTotalForAddons(each);
      }
    });
  }

  getCartTotal() {
    this._publicSignUpService.cartTotal = 0;
    this._publicSignUpService.cartCount = 0;
    _.map(this.products, each => {
      this._publicSignUpService.cartTotal = this._publicSignUpService.cartTotal + (each.SalePrice * each.Quantity);
      this._publicSignUpService.cartCount += 1;
      if (each.Addons && each.Addons.length > 0) {
        this.findCartTotalForAddons(each);
      }
      if (each.LinkedProduct && each.LinkedProduct.PlanProductId >= 0) {
        if (each.IsPrimaryInLinkedProduct) {
          this._publicSignUpService.cartCount += 1;
          //console.log(this._publicSignUpService.cartCount);
          this._publicSignUpService.cartTotal = this._publicSignUpService.cartTotal + (each.LinkedProduct.SalePrice * each.LinkedProduct.Quantity);
        }
      }
    });
    this.getDiscountAndPayableAmount();
  }

  gotoShop() {
    if (!this._publicSignUpService.CustomerPublicSignUpModel) {
      this._publicSignUpService.CustomerPublicSignUpModel = {
        CouponCode: null
      };
    }
    if (this.couponCode === null) {
      this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = null;
    }
    if (this.couponCode !== null) {
      this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = this.couponCode;
    }
    else if (this._publicSignUpService.planCouponCode) { 
      this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = this._publicSignUpService.planCouponCode;
    }
    this.removeCouponApplied();

    if (this._publicSignUpService.publicSignupSharedScope.DOES_ENABLE_AZURE_SEARCH?.toLowerCase() === CloudHubConstants.STATIC_VALUE_TRUE) {
      //$state.go("welcome.signup.azuresearch", { internalPlanId: vm.internalPlanId });
    } else {
      this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/shop`]);
      //$state.go("welcome.signup.plandetails", { internalPlanId: vm.internalPlanId });
    }
  }

  gotoCart() {
    //need to check routing
    if (this._publicSignUpService.publicSignupSharedScope.DOES_ENABLE_AZURE_SEARCH?.toLowerCase() === CloudHubConstants.STATIC_VALUE_TRUE) {
      //Not implemented
    } else {
      this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/shop`]);
      //$state.go("welcome.signup.plandetails", { internalPlanId: vm.internalPlanId });
    }
  }

  validateCoupon() { 
    this.isCouponValidationInProgress = true; 

    if (this._publicSignUpService.CustomerPublicSignUpModel === undefined) {
      this._publicSignUpService.CustomerPublicSignUpModel = {};
    } 

    this._publicSignUpService.publicSignupSharedScope.couponCode = this.couponCode;

    this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = null; 
    const subscription = this._publicSignUpService.validatecoupon(this.couponCode, this.internalPlanId).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
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
          this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = this.couponCode;
          if ((this.couponDetails !== null && this.couponDetails !== undefined) && (this.couponDetails.Discount !== null)) {
            this.getProductsAddedToCart();
            this.getDiscountsForProductsAddedToCart();

          }
        }
      }
    });
    this._subscriptionArray.push(subscription);
  }

  refreshCoupon() {
    this.isApplyCoupon = true;
  }

  checkIfMicrosoftProductIsPresentInCart() {
    var planProductIds = [];
    _.each(this._publicSignUpService.publicSignupSharedScope.cartProducts, (item) => {
      planProductIds.push(item.PlanProductId);
    });
    var combinedString = planProductIds.join(',');

    if (combinedString !== undefined && combinedString !== null) {
      combinedString = combinedString.toString();
    }
    var reqBody = { PlanProductIds: combinedString };
    const subscription = this._publicSignUpService.getProviderListForPlanProductIds(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      var microsoftProducts = _.find(res.Data, (item) => {
        return item.ProviderName === "Microsoft" || item.ProviderName === "microsoft";
      });
      if (microsoftProducts !== undefined && microsoftProducts !== null && microsoftProducts !== "") {
        this.isMicrosoftProductAvailable = true;
      }
    });
    this._subscriptionArray.push(subscription);
  }

  getProductIdsForAddons(product: any) {
    _.map(product.Addons, each => {
      this.planProductIds = this.planProductIds + (this.planProductIds !== null ? "," + each.PlanProductId : each.PlanProductId);
      if (each.Addons && each.Addons.length > 0) {
        this.getProductIdsForAddons(each);
      }
    });
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

  getDiscountsForProductsAddedToCart() {
    if (this.planProductIds !== null) {
      this.applyDiscountForCustomerProductsModel = new ApplyDiscountForCustomerProductsModel();
      this.applyDiscountForCustomerProductsModel.InternalPlanId = this.internalPlanId;
      this.applyDiscountForCustomerProductsModel.Products = this.planProductIds;
      this.applyDiscountForCustomerProductsModel.CouponCode = this.couponCode;
      const subscription = this._publicSignUpService.getDiscountForProducts(this.applyDiscountForCustomerProductsModel).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        this.productsWithDiscounts = res.Data;
        this.applyDiscountForProducts();
      });
      this._subscriptionArray.push(subscription);
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

  getDiscountAndPayableAmount() {
    this.payableAmount = null;
    this.cartDiscount = null;
    let originalPriceofProductsInCart = 0;
    this.finalSalePriceOfProductsInCart = null;
    if (this.products !== null && this.products.length > 0) {
      this.calculateFinalSalePrice();
      if (this.finalSalePriceOfProductsInCart !== null) {
        this.cartDiscount = this._publicSignUpService.cartTotal - this.finalSalePriceOfProductsInCart;
   
        this._publicSignUpService.publicSignupSharedScope.Discount = this.cartDiscount;

        if (this.cartDiscount !== null) {
          this.payableAmount = this._publicSignUpService.cartTotal - this.cartDiscount;
          this._publicSignUpService.publicSignupSharedScope.payableAmount = this.payableAmount;
          this.isDiscountApplied = true;
          this.isCouponValidationInProgress = false;
        }
      }
    }
    this.checkIfMicrosoftProductIsPresentInCart();
  }

  removeDiscount(product: any) {
    product.SalePrice = product.SalePrice;
    product.Discount = product.PlanDiscount;
    product.DiscountType = product.PlanDiscountType;
    product.OriginlaSalePrice = product.OriginlaSalePrice;
    this._publicSignUpService.publicSignupSharedScope.couponCode = null;
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
    if (this._publicSignUpService.CustomerPublicSignUpModel !== undefined && this._publicSignUpService.CustomerPublicSignUpModel !== null) {
      this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = null;
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

  updateAddonQuantity(addon: any) {
    var a = addon.Quantity && addon.Quantity != addon.OriginalQuantity
    var b = this.permissions.HasSaveCart === 'Allowed'
    addon.UpdateButton = true;
  }

  countOfAddons(addonArray: any) {
    addonArray.addonCount = 0
    addonArray?.map(e => {
      if (e.IsAddon == true) {
        addonArray.addonCount = addonArray.addonCount + 1;
      }
    })
    return addonArray.addonCount > 0
  }

  checkPromotionEligibility(product: any) {
    const modalRef = this._modalService.open(ApplyNceOfferPopupComponent, { size: 'lg' });
    modalRef.componentInstance.product = product;
    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  showPromotionDetails(product: any) {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    promotionDetailsConfig.Name = product.PromotionName,
      promotionDetailsConfig.PromotionalId = product.PromotionID,
      promotionDetailsConfig.Description = product.PromotionDescription,
      promotionDetailsConfig.Validity = product.Validity,
      promotionDetailsConfig.ValidityType = product.ValidityType,
      promotionDetailsConfig.BillingCycleName = product.BillingCycleName,
      promotionDetailsConfig.BillingCycleDescriptionKey = product.BillingCycleDescription,
      promotionDetailsConfig.Discount = product.PromotionDiscount,
      promotionDetailsConfig.DiscountType = product.PromotionDiscountType,
      promotionDetailsConfig.EndDate = product.PromotionEndDate,
      promotionDetailsConfig.ShowPublicSignupApplyButton = true

    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
      if (result?.action === "publicsignup-apply-promotion") {
        // integer id in cart
        product.PromotionIntIdInCart = product.PromotionIntID;
      }
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  showLinkProductPromotionDetails(product: any) {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    promotionDetailsConfig.Name = product.PromotionName,
      promotionDetailsConfig.PromotionalId = product.PromotionID,
      promotionDetailsConfig.Description = product.PromotionDescription,
      promotionDetailsConfig.Validity = product.Validity,
      promotionDetailsConfig.ValidityType = product.ValidityType,
      promotionDetailsConfig.BillingCycleName = product.BillingCycleName,
      promotionDetailsConfig.BillingCycleDescriptionKey = product.BillingCycleDescription,
      promotionDetailsConfig.Discount = product.PromotionDiscount,
      promotionDetailsConfig.DiscountType = product.PromotionDiscountType,
      promotionDetailsConfig.EndDate = product.PromotionEndDate,
      promotionDetailsConfig.ShowPublicSignupApplyButton = true

    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
      if (result?.action === "publicsignup-apply-promotion") {
        // integer id in cart
        product.PromotionIntIdInCart = product.PromotionIntID;
      }
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  removePromotion(product) {
    product.PromotionIntIdInCart = null;
  }

  openNCEProductsTermsAndConditionsUrl() {
    window.open(this.NCETermsAndConditionURL, "_blank");
  }

  openDefaultProductsTermsAndConditionsUrl() {
    window.open(this.defaultTermsAndConditionURL, "_blank");
  }

  redirectToBillingInformation() {
    this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/customer`]);
    // $state.go('welcome.signup.customer');
  }

  updateCartItemServiceProviderCustomer(cartLineItem: any) {
    // making the promotionIs as null when change the tenant 
    cartLineItem.PromotionId = null
    let reqBody = {
      WithAddons: false,
      CartItem: JSON.stringify(cartLineItem)
    };
    const subscription = this._publicSignUpService.updateCartItemServiceProviderCustomer(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      const operationResult = res;
      if (operationResult.Status === 'Success') {
        this.getCartItemsInStorage();
        this.getCartTotal();
        this._notifierService.success({ title: this._translateService.instant('TRANSLATE.CART_SUCCESS_MESSAGE_WHILE_CHANGING_PROVIDER_CUSTOMER') });
      } else {
        if (operationResult?.Data?.length > 0) {
          let errMessage = '';
          operationResult?.Data?.forEach(value => {
            errMessage += this._translateService.instant(value.Message, { product: value.Product, quantity: value.Quantity, minQuantity: value.MinQuantity, maxQuantity: value.MaxQuantity }) + '</br>';
          });
          this._notifierService.alert({ title: errMessage });
        } else {
          this._notifierService.alert({ title: this._translateService.instant('TRANSLATE.CART_ERROR_MESSAGE_WHILE_CHANGING_PROVIDER_CUSTOMER') });
        }
      }
    })
    this._subscriptionArray.push(subscription);
  }

  onAddplanAction(data: any) {
    this.onAction(data.product, data.action);
  }

  onAction(product, action) {
    switch (action) {
      // case "manageProduct":
      //     this.manageProducts(product);
      //     break;
      case "updateCartItemServiceProviderCustomer":
        this.updateCartItemServiceProviderCustomer(product);
        break;
      case "updateCartItemQuantity":
        this.updateCartItemQuantity(product);
        break;
      case "deleteProductFromCart":
        this.deleteProductFromCart(product);
        break;
      // case "updateIsProductAvailableForAutoRelease":
      //   this.updateIsProductAvailableForAutoRelease(product);
      //   break;
      // case "checkNcePromotionEligibility":
      //   this.checkPromotionEligibility(product);
      //   break;
      // case "updatePromotionIdInCart":
      //   this.updatePromotionIdInCart(product, false);
      //   break;
      case "promotionDetails":
        this.showPromotionDetails(product);
        break;
      case "linkedProductPromotionDetails":
        this.showLinkProductPromotionDetails(product);
        break;
      // case "checkNceLinkedProductPromotionEligibility":
      //   this.checkNceLinkedProductPromotionEligibility(product);
      //   break;
      // case "updateLinkedProductsPromotionIdInCart":
      //   this.updateLinkedProductsPromotionIdInCart(product.LinkedSubscription);
      //   break;
      // case "updateProductNameInCart":
      //   this.updateProductNameInCart(product);
      //break;
      case "removePromotion":
        this.removePromotion(product);
        break;
      default:
    }
  } 
  
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}

class ApplyDiscountForCustomerProductsModel {
  /// <summary>
  /// Model to hold the Customer Products
  /// </summary>
  InternalPlanId: any | null;
  Products: any | null;
  CouponCode: any | null;
}
