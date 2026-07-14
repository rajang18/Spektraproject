 
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router'; 
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { NotifierService } from 'src/app/services/notifier.service';
import _ from 'lodash';
import { ClipboardService } from 'ngx-clipboard';
import { PublicSignupService } from '../services/public-signup.service';
import { distinctUntilChanged,takeUntil } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
@Component({
    selector: 'app-public-signup-createcustomer',
    templateUrl: './public-signup-createcustomer.component.html',
    styleUrl: './public-signup-createcustomer.component.scss'
})
export class PublicSignupCreatecustomerComponent extends C3BaseComponent implements OnInit, OnDestroy {
    datatableConfig: ADTSettings;

    frmCustomerPublicSignUp: FormGroup = new FormGroup({});
    customerPublicSignUpModel: any = {
        ProviderName: null,
        CompanyName: null,
        FirstName: null,
        LastName: null,
        MiddleName: null,
        OrganizationRegistrationNumber: null,
        Email: null,
        Domain: null,
        AddEmailAsCustomerAdmin: false,
        NotifyCustomer: false,
        InternalPlanId: null,
        CustomerCurrencyCode: null,
        BillingCustomerAddressId: null,
        BillingProviderReferenceID: null,
        PaymentType: null,
        CreditCardNumber: null,
        AccountNumber: null,
        CustomerAddress: {},
        PhoneNumber: null,
        OnboardBatchId: null,
        IsCustomerConsentProvided: null,
        EnvironmentId: null,
        TenantId: null,
        IsExistingMsTenant: null,
        CartItems: null,
    };
    addressModel: any = {};
    thisEmailAddressAlreadyExistsMessage: any = null;
    countries: any = null;
    stateProvinces: any = null;
    isCustomerConsentAcceptanceProvided: boolean = false;
    customerConsentAcceptanceDate: any = null;
    customerConsentURL: any = null;
    providerName: any = null;
    customerCurrencyCode: any = null;
    countryValidationRules: any = {};
    internalPlanId: any = null;
    environmentId: any = null;
    signUpBatchId: any = null;
    isPlandetails: boolean = false;
    isMicrosoftProductAvailable: boolean = false;
    isOrganizationRegistrationNumberRequired: boolean = false;
    countryList: any = ['TH', 'VN', 'TR', 'PL', 'ZA', 'IN', 'BR', 'IQ', 'MM', 'SS', 'SA', 'AE', 'AM', 'AZ', 'BY', 'HU', 'KZ', 'KG', 'MD', 'TJ', 'UA', 'UZ']; //list of countries that requires OrganizationRegistrationNumber
    IsExistingMsTenant: any;//$rootScope.IsExistingMsTenant;
    TenantId: any = null;
    DomainName: any = null;
    Email: any = null;
  frmExistingMsTenant: FormGroup = new FormGroup({});
    requestResellerRelationshipURL: any = 'https://admin.microsoft.com/Adminportal/Home?invType=ResellerRelationship&partnerId=696cf831-0736-4fb8-bf68-eb5e0f0515f4&msppId=0&DAP=true#/BillingAccounts/partner-invitation ';
    isPublicCatalogueBackedByAzureSearch: any;
    BillingProviderName: any;
  Domain: string = "";
    isCheckingDomainAvailability: boolean = false;
    isDomainAvailble: null;
    ResellerRelationship: any;
    maxConsentDate: Date; 
    cartItems: any;
    merchantId: any;
    cartCount: any;
    cartTotal: any;
    cartProducts: any;
    isCouponValidationInProgress = false;
    couponCode: any;
  planCouponCode: string;
    couponDetails: any;
    products: any;
    payableAmount = null;
    cartDiscount = null;
    productsWithDiscounts: any;
    finalSalePriceOfProductsInCart: any;
    isDiscountApplied = false;
    validCouponCode = null;
    isCouponValid = false;
    isApplyCoupon = true;
    planProductIds: any;
    applyDiscountForCustomerProductsModel: ApplyDiscountForCustomerProductsModel;
    NCEProductInCart: any;
    isSignupState:boolean;
    isCheckingEmailAvailability: boolean = false;
    considerNewMicrosoftCustomerAgreement: any;
  isDomainValid: boolean = true; forms: { [key: string]: FormGroup } = {
        customerPublicSignUp: this.frmCustomerPublicSignUp,
        existingMsTenant: this.frmExistingMsTenant
        // Add other forms here
      };
  isEmailValid: boolean = true;
    constructor(
        private toastService: ToastService,
        private cdRef: ChangeDetectorRef,
        private translateService: TranslateService,
        private router: Router,
        private commonService: CommonService,
        private _appService: AppSettingsService,
        private notifierService: NotifierService,
        public _publicSignUpService: PublicSignupService,
        private _fb: FormBuilder,
        private clipboardService: ClipboardService,
        public permissionService: PermissionService,
        public dynamicTemplateService: DynamicTemplateService,
        public _toastService: ToastService,
        private _unsavedChangesService: UnsavedChangesService
    ) {
    super(permissionService, dynamicTemplateService, router, _appService);
        this.createFormGroup();
        Object.values(this.forms).forEach(form => this.trackFormChanges(form));
        const wizardControl = {
            review: 'done',
            account: 'current',
            confirm: 'pending'
        };
        this._publicSignUpService.cartTotal = this._publicSignUpService.cartTotal ? this._publicSignUpService.cartTotal : 0;
        this._publicSignUpService.cartCount = this._publicSignUpService.cartCount ? this._publicSignUpService.cartCount : 0;
        this.isSignupState = this._router.url.includes('shop');

        this.products = this._publicSignUpService.publicSignupSharedScope.cartProducts || [];

        if (this._publicSignUpService.publicSignupSharedScope.EnvironmentId !== null && this._publicSignUpService.publicSignupSharedScope.EnvironmentId !== undefined && this._publicSignUpService.publicSignupSharedScope.EnvironmentId !== '') {
            this.environmentId = this._publicSignUpService.publicSignupSharedScope.EnvironmentId;
        }
        else {
            this._router.navigate(['welcome']);
            // $state.go('welcome.signup');
        }
        if (this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== null && this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== undefined && this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== '') {
            this.internalPlanId = this._publicSignUpService.publicSignupSharedScope.InternalPlanId;
            if (this.internalPlanId !== null && this.internalPlanId !== '') {
                const subscription = this._publicSignUpService.planDetailsUri(this.internalPlanId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                    this._publicSignUpService.publicSignupPlanName = response.Data;
                });
                this._subscriptionArray.push(subscription);
            }
        }
        else {
            this._router.navigate(['welcome']);
        }
        if (this._publicSignUpService.SignUpBatchId !== null && this._publicSignUpService.SignUpBatchId !== undefined && this._publicSignUpService.SignUpBatchId !== '') {
            this.signUpBatchId = this._publicSignUpService.SignUpBatchId;
        }
        else {
            this.signUpBatchId = null;
            const subscription = this._publicSignUpService.getBatchid().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                this.signUpBatchId = response;
                this._publicSignUpService.SignUpBatchId = this.signUpBatchId;
            });
            this._subscriptionArray.push(subscription);
        }

        if (this.customerPublicSignUpModel !== null && this.customerPublicSignUpModel !== undefined) {
            this.customerPublicSignUpModel = this.customerPublicSignUpModel;
            this.addressModel = this.customerPublicSignUpModel.CustomerAddress;
            if (this.addressModel !== null) {
                // let getCountryDetailsPromise = this.getCountriesPromise();
                // getCountryDetailsPromise.then(function () {
                //     this.OnCountryChange(false);
                // });
            }
            // this.onEmailAddressChange();
            // ;
            this.isCustomerConsentAcceptanceProvided = this.customerPublicSignUpModel.IsCustomerConsentProvided || false;
        }
        this.getBillingProvider();
    }

    ngOnInit() {
        this.IsExistingMsTenant = this._publicSignUpService.publicSignupSharedScope.isExistingMsTenant;
        this._publicSignUpService.isShopScreen = false;
        this.checkIfMicrosoftProductIsPresentInCart();
        this.getCountries();
        this.getCustomerAgreementURL();
        this.getCartTotal();
        this.getApplicationData();

      this.couponCode = this._publicSignUpService.publicSignupSharedScope.couponCode || null;
      this.cartDiscount = this._publicSignUpService.publicSignupSharedScope.Discount || null;
      this.payableAmount = this._publicSignUpService.publicSignupSharedScope.payableAmount || null;
      this.validCouponCode = this._publicSignUpService.publicSignupSharedScope.couponCode || null;
      this.planCouponCode = this._publicSignUpService.publicSignupSharedScope.planCouponCode || null;

        //if (this._publicSignUpService.CustomerPublicSignUpModel?.CouponCode !== null && this._publicSignUpService.CustomerPublicSignUpModel?.CouponCode !== undefined && this._publicSignUpService.CustomerPublicSignUpModel?.CouponCode !== '') {
            // vm.validCouponCode = $rootScope.CustomerPublicSignUpModel.CouponCode;
            this.couponCode = this._publicSignUpService.CustomerPublicSignUpModel?.CouponCode != this._publicSignUpService.alreadyPresentCouponCode ? this._publicSignUpService.CustomerPublicSignUpModel.CouponCode : null;
            //&& vm.validCouponCode !== null && vm.isCouponValid
            if (this.couponCode !== null) {
                this.couponCode = this._publicSignUpService.publicSignupSharedScope.couponCode;
                this.validCouponCode = this._publicSignUpService.publicSignupSharedScope.couponCode;
            }
        //} 
    }

    ngOnDestroy() { 
        super.ngOnDestroy();
        this._unsavedChangesService.setUnsavedChanges(false);
    }


    private trackFormChanges(form: FormGroup) {
        const subscription = form.valueChanges.pipe(
          distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
          takeUntil(this.destroy$)
        ).subscribe(() => {
          this._unsavedChangesService.setUnsavedChanges(form.dirty);
        });
        this._subscriptionArray.push(subscription);
      }
    createFormGroup() {
        this.frmCustomerPublicSignUp = this._publicSignUpService.publicSignupSharedScope.frmCustomerPublicSignUp || this._fb.group({
            firstName: ['', [Validators.required, Validators.maxLength(50)]],
            lastName: ['', [Validators.required, Validators.maxLength(50)]],
            companyName: ['', [Validators.maxLength(50)]],
            phoneNumber: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            notifyCustomer: [false],
            line1: ['', [Validators.required, Validators.maxLength(250)]],
            addEmailAsCustomerAdmin: [false],
            line2: ['', Validators.maxLength(250)],
            city: ['', Validators.required],
            zip: ['', Validators.required],
            country: ['', Validators.required],
            state: ['', Validators.required],
            organizationRegistrationNumber: [''],
            domain: [''],
            isCustomerConsentAcceptanceProvided: [''],

        });
        this.frmExistingMsTenant = this._publicSignUpService.publicSignupSharedScope.frmExistingMsTenant || this._fb.group({
            tenantId: ['', [Validators.required, Validators.maxLength(50)]],
            domain: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]]
        });
        this.checkForFormValidationForMSOffers();
    }

    getFormData() {
        let {
            tenantId,
            domain,
            email
        } = this.frmExistingMsTenant.value;

        this.customerPublicSignUpModel.TenantId = tenantId;
        this.customerPublicSignUpModel.Domain = domain;
        this.customerPublicSignUpModel.Email = email;
    }

    getRawFormData() {
        let {
            firstName,
            lastName,
            companyName,
            organizationRegistrationNumber,
            email,
            notifyCustomer,
            phoneNumber,
            addEmailAsCustomerAdmin,
            line1,
            line2,
            city,
            state,
            country,
            zip,
            isCustomerConsentAcceptanceProvided
        } = this.frmCustomerPublicSignUp.value;
        organizationRegistrationNumber = this.frmCustomerPublicSignUp.get('organizationRegistrationNumber').value;

        this.customerPublicSignUpModel.FirstName = firstName;
        this.customerPublicSignUpModel.LastName = lastName;
        this.customerPublicSignUpModel.CompanyName = companyName;
        this.customerPublicSignUpModel.OrganizationRegistrationNumber = organizationRegistrationNumber;
        this.customerPublicSignUpModel.Email = email;
        this.customerPublicSignUpModel.AddEmailAsCustomerAdmin = addEmailAsCustomerAdmin;
        this.customerPublicSignUpModel.NotifyCustomer = notifyCustomer;
        this.customerPublicSignUpModel.PhoneNumber = phoneNumber;
        this.customerPublicSignUpModel.CustomerAddress.Line1 = line1;
        this.customerPublicSignUpModel.CustomerAddress.Line2 = line2;
        this.customerPublicSignUpModel.CustomerAddress.City = city;
        this.customerPublicSignUpModel.CustomerAddress.State = state;
        this.customerPublicSignUpModel.CustomerAddress.Zip = zip;
        this.customerPublicSignUpModel.CustomerAddress.Country = this.addressModel.Country;
        this.customerPublicSignUpModel.IsCustomerConsentAcceptanceProvided = isCustomerConsentAcceptanceProvided;
        this.isCustomerConsentAcceptanceProvided = isCustomerConsentAcceptanceProvided;
    }

    getCountriesPromise() {
        const subscription = this.commonService.getCountriesPromise().pipe(takeUntil(this.destroy$)).subscribe((responses: any) => {
            if (responses && responses.length > 0) {
                this.countries = _.result(responses[0], 'data.Data', []);
                this.onCountryChange(false);
            }
        });
        this._subscriptionArray.push(subscription);
        return
    }

    checkForFormValidationForMSOffers() {
        if (this.isOrganizationRegistrationNumberRequired && this.isMicrosoftProductAvailable) {
          this.frmCustomerPublicSignUp.get('organizationRegistrationNumber')?.addValidators([Validators.required]);
        }
        if (this.isMicrosoftProductAvailable) {
            this.frmCustomerPublicSignUp.get('domain')?.addValidators([Validators.required]);
            this.frmCustomerPublicSignUp.get('isCustomerConsentAcceptanceProvided')?.addValidators([Validators.required]);
        }
        this.frmCustomerPublicSignUp.updateValueAndValidity();
      }

    addCustomer() {
        this.getRawFormData();
        this.frmCustomerPublicSignUp.markAllAsTouched();
         
        this._publicSignUpService.publicSignupSharedScope.frmCustomerPublicSignUp = this.frmCustomerPublicSignUp;
        if(this._publicSignUpService.CustomerPublicSignUpModel !== undefined && this._publicSignUpService.CustomerPublicSignUpModel !== null && this._publicSignUpService.CustomerPublicSignUpModel !== ''){
            this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = this.couponCode; 
        }
        if (this.customerPublicSignUpModel.CompanyName === '' || this.customerPublicSignUpModel.CompanyName == null || this.customerPublicSignUpModel.CompanyName === undefined) {

            if (this.customerPublicSignUpModel.FirstName == null || this.customerPublicSignUpModel.FirstName === undefined && this.customerPublicSignUpModel.LastName == null || this.customerPublicSignUpModel.LastName === undefined) {
                this.customerPublicSignUpModel.CompanyName = '';
            }
            if ((this.customerPublicSignUpModel.FirstName != null || this.customerPublicSignUpModel.FirstName != undefined || this.customerPublicSignUpModel.FirstName !== '') && (this.customerPublicSignUpModel.LastName == null || this.customerPublicSignUpModel.LastName === undefined || this.customerPublicSignUpModel.LastName === '')) {

                this.customerPublicSignUpModel.CompanyName = this.customerPublicSignUpModel.FirstName;
            }
            else if ((this.customerPublicSignUpModel.FirstName === null || this.customerPublicSignUpModel.FirstName === undefined || this.customerPublicSignUpModel.FirstName === '') && (this.customerPublicSignUpModel.LastName != null || this.customerPublicSignUpModel.LastName != undefined || this.customerPublicSignUpModel.LastName != '')) {
                this.customerPublicSignUpModel.CompanyName = this.customerPublicSignUpModel.LastName;
            }
            else {
                this.customerPublicSignUpModel.CompanyName = this.customerPublicSignUpModel.FirstName + ' ' + this.customerPublicSignUpModel.LastName;
            }
        }
        if (this.frmCustomerPublicSignUp.valid) {
            ;
            if (this.isDomainAvailble === false) {
                this._toastService.error(this.translateService.instant('TRANSLATE.PC_TENANT_ALREADY_USED'))
                return;
            }
            if (((this.isCustomerConsentAcceptanceProvided && this.considerNewMicrosoftCustomerAgreement === 'No') ||
            (this.considerNewMicrosoftCustomerAgreement == 'Yes')) && (this._publicSignUpService.isEmailAddressValid !== null && this._publicSignUpService.isEmailAddressValid)) {
               
                //this.customerPublicSignUpModel.CustomerAddress = this.addressModel;
                this.providerName = 'Microsoft';
                this.customerCurrencyCode = 'USD';
                this.customerPublicSignUpModel.InternalPlanId = this._publicSignUpService.publicSignupSharedScope.InternalPlanId;
                this.customerPublicSignUpModel.EnvironmentId = this._publicSignUpService.publicSignupSharedScope.EnvironmentId;
                this.customerPublicSignUpModel.ProviderName = this.providerName;
                this.customerPublicSignUpModel.CustomerCurrencyCode = this.customerCurrencyCode;
                this.customerPublicSignUpModel.IsCustomerConsentProvided = this.isCustomerConsentAcceptanceProvided;
                this.customerPublicSignUpModel.IsMicrosoftProductAvailable = this.isMicrosoftProductAvailable;
                this.customerPublicSignUpModel.AddEmailAsCustomerAdmin = true;
                this.customerPublicSignUpModel.ProviderCustomer = {};
                this.customerPublicSignUpModel.CartItems = this._publicSignUpService.publicSignupSharedScope.cartProducts;

                this._publicSignUpService.CustomerPublicSignUpModel = this.customerPublicSignUpModel;
                this._publicSignUpService.publicSignupSharedScope.customerPublicSignUpModel = this.customerPublicSignUpModel;
                this._publicSignUpService.billingInformationFormSubmitted = true;
                this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/cart`], { state: { billingInformationFormSubmitted: this._publicSignUpService.billingInformationFormSubmitted } });
                // $state.go("welcome.signup.cart", { internalPlanId: this.internalPlanId });
            }
            else if (this.isMicrosoftProductAvailable === false && (this._publicSignUpService.isEmailAddressValid !== null && this._publicSignUpService.isEmailAddressValid)) {
                // this.customerPublicSignUpModel.CustomerAddress = this.addressModel;
                this.providerName = 'Partner';
                this.customerCurrencyCode = 'USD';
                this.customerPublicSignUpModel.InternalPlanId = this.internalPlanId;
                this.customerPublicSignUpModel.EnvironmentId = this.environmentId;
                this.customerPublicSignUpModel.ProviderName = this.providerName;
                this.customerPublicSignUpModel.CustomerCurrencyCode = this.customerCurrencyCode;
                this.customerPublicSignUpModel.IsCustomerConsentProvided = this.isCustomerConsentAcceptanceProvided;
                this.customerPublicSignUpModel.IsMicrosoftProductAvailable = this.isMicrosoftProductAvailable;
                this.customerPublicSignUpModel.AddEmailAsCustomerAdmin = true;
                this.customerPublicSignUpModel.ProviderCustomer = {};
                this._publicSignUpService.CustomerPublicSignUpModel = this.customerPublicSignUpModel;
                this._publicSignUpService.publicSignupSharedScope.customerPublicSignUpModel = this.customerPublicSignUpModel
                this._publicSignUpService.billingInformationFormSubmitted = true;
                this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/cart`], { state: { billingInformationFormSubmitted: this._publicSignUpService.billingInformationFormSubmitted } });
                // $state.go("welcome.signup.cart", { internalPlanId: this.internalPlanId });
            }
            else if (!this.isCustomerConsentAcceptanceProvided && this.isMicrosoftProductAvailable === true) {
                this._toastService.error(this.translateService.instant('TRANSLATE.CUSTOMER_PUBLIC_SIGNUP_DETAILS_CONSENT_ACCEPTANCE_MUST_BE_PROVIDER'))

            }
            else if (this._publicSignUpService.isEmailAddressValid !== null && !this._publicSignUpService.isEmailAddressValid) {
                let email = this.customerPublicSignUpModel.Email;
                this._toastService.error(this.translateService.instant('TRANSLATE.CUSTOMER_PUBLIC_SIGN_UP_EMAIL_VALIDATION_ERROR_MESSAGE', { emailAddress: email }))
            }
        }
        else {
            this._toastService.error(this.translateService.instant('TRANSLATE.CUSTOMER_PUBLIC_SIGN_UP_FORM_VALIDATION_FAILED_MESSAGE'))
        }
    }

    getApplicationData() {
        const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.isPublicCatalogueBackedByAzureSearch = response.Data.IsPublicCatalogueBackedByAzureSearch;
            this.considerNewMicrosoftCustomerAgreement = response.Data.ConsiderNewMicrosoftCustomerAgreement;
        });
        this._subscriptionArray.push(subscription);
    }

    goToPlanDetails() {
        if (this.isPublicCatalogueBackedByAzureSearch?.toLowerCase() === this.cloudHubConstants.STATIC_VALUE_TRUE) {
            // this._router.navigate([`welcome.signup.azuresearch`]);

        } else {
            this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/shop`])
            // $state.go("welcome.signup.plandetails");
        }
    }

    goToCart() {
        if (!this.customerPublicSignUpModel) {
            const wizardControl = {
                review: 'current',
                account: 'pending',
                confirm: 'pending'
            };
        }
        this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/cart`]);

        // $state.go('welcome.signup.cart');
    }

    confirmCopy() {
        this.notifierService.confirm({ title: this.translateService.instant('TRANSLATE.ALERT_MESSAGE_COPIED_TO_CLIPBOARD') })
    }

    getBillingProvider() {
        const subscription = this._publicSignUpService.getBillingProvider(this.internalPlanId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            let billingProvider = response.Data;
            this.BillingProviderName = billingProvider?.Name;
            if (billingProvider === undefined || billingProvider === null || billingProvider.Name === undefined || billingProvider.Name === null) {

                this._router.navigate([`welcome.signup.paymentdetails-none`]);
                // $state.go('welcome.signup.paymentdetails-none');
            }
            else if (this.BillingProviderName.toLowerCase() === "mcb") {
                this.getMCBBillingConfig();
            }
        });
        this._subscriptionArray.push(subscription);
    }



    checkIfMicrosoftProductIsPresentInCart() {
        let planProductIds = [];
        _.each(this._publicSignUpService.publicSignupSharedScope.cartProducts, (item: any) => {
            planProductIds.push(item.PlanProductId);
        });

        let combinedString = planProductIds.join(',');

        if (combinedString !== undefined && combinedString !== null) {
            combinedString = combinedString.toString();
        }
        let reqBody = { PlanProductIds: combinedString };
        const subscription = this._publicSignUpService.getProviderListForPlanProductIds(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            let microsoftProducts = _.find(response.Data, (item: any) => {
                return item.ProviderName === "Microsoft" || item.ProviderName === "microsoft";
            });
            if (microsoftProducts !== undefined && microsoftProducts !== null && microsoftProducts !== "") {
                this.isMicrosoftProductAvailable = true;
            }
        });
        this._subscriptionArray.push(subscription);
    }

  checkDomainAvialbility = _.debounce(() => {
     if (this.IsExistingMsTenant) {
            this.customerPublicSignUpModel.Domain = this.frmExistingMsTenant.get('domain')?.value;
        }
        else {
            this.customerPublicSignUpModel.Domain = this.frmCustomerPublicSignUp.get('domain')?.value;
        }
        if (this.customerPublicSignUpModel.Domain !== '' && this.customerPublicSignUpModel.Domain !== undefined && this.customerPublicSignUpModel.Domain !== null && this.customerPublicSignUpModel.Domain.length > 0) {
            this.isCheckingDomainAvailability = true;
            this.isDomainAvailble = null;
            this.isDomainValid = true;
            this.Domain = "";
            this.cdRef.detectChanges();
            const subscription = this._publicSignUpService.validateDomain(this.customerPublicSignUpModel.Domain).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                if (response.Status === "Success" && response.Data !== null) {
                    this.isDomainAvailble = response.Data;
                    this.Domain = this.customerPublicSignUpModel.Domain;
                    if(this._publicSignUpService.CustomerPublicSignUpModel === undefined){
                        this._publicSignUpService.CustomerPublicSignUpModel =  this.customerPublicSignUpModel;
                        
                    } 
                    this._publicSignUpService.publicSignupSharedScope.Domain = this.Domain;
                    this._publicSignUpService.CustomerPublicSignUpModel.Domain = this.Domain;
                }
                this.isCheckingDomainAvailability = false;
                this._publicSignUpService.billingInformationFormSubmitted = false;
                this.cdRef.detectChanges();
            }, ((error: any) => {
                this.isDomainValid = false;
                this.isCheckingDomainAvailability = false;
                this.cdRef.detectChanges();
            }));
            this._subscriptionArray.push(subscription);
        }
        else {
            this.isDomainAvailble = null;
            this.Domain = '';
            this._toastService.error(this.translateService.instant('TRANSLATE.CUSTOMERS_DOMAIN_NAME_INVALID_PROMPT'))
        }
    }, 200)

    onAddEmailAsCustomerAdminChange() {
        if (!this.customerPublicSignUpModel.AddEmailAsCustomerAdmin) {
            this.customerPublicSignUpModel.NotifyCustomer = false;
        }
        else {
            this.onEmailAddressChange();
        }
    }

    onEmailAddressChange() {
        this.isCheckingEmailAvailability = true;
        if (this.IsExistingMsTenant) {
          this.customerPublicSignUpModel.Email = this.frmExistingMsTenant.get('email')?.value;
        }
        else {
          this.customerPublicSignUpModel.Email = this.frmCustomerPublicSignUp.get('email')?.value;
        }
        this.thisEmailAddressAlreadyExistsMessage = null;
        if (this.customerPublicSignUpModel.Email !== undefined && this.customerPublicSignUpModel.Email !== "" && this.customerPublicSignUpModel.Email !== null && this.customerPublicSignUpModel.Email.length > 0) {
            let email = this.customerPublicSignUpModel.Email;
            this.customerPublicSignUpModel.InternalPlanId = this._publicSignUpService.publicSignupSharedScope.InternalPlanId;
            const subscription = this._publicSignUpService.onEmailAddressChange(this.customerPublicSignUpModel.InternalPlanId, email).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                if (response.Status === "Success") {
                    this._publicSignUpService.isEmailAddressValid = response.Data;
                    this.isCheckingEmailAvailability = false;
                    if (!response.Data) {
                        this.thisEmailAddressAlreadyExistsMessage = this.translateService.instant(
                            'TRANSLATE.CUSTOMER_PUBLIC_SIGN_UP_EMAIL_VALIDATION_ERROR_MESSAGE', { emailAddress: email }
                        );
                        this.toastService.clear();
                        this.toastService.error(this.thisEmailAddressAlreadyExistsMessage);
                    }
                }
            });
            this._subscriptionArray.push(subscription);
        }
    }

    getCountries() {
        this.countries = null;
        const subscription = this.commonService.getCountires().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.countries = response;
            //console.log(this.countries);
            this.cdRef.detectChanges();
        });
        this._subscriptionArray.push(subscription);
    }

    onCountryChange(resetDetails = true) {
        this.addressModel.Country = this.frmCustomerPublicSignUp.get('country')?.value;
        this.getStateProvincesByCountry(this.addressModel.Country, resetDetails);
        this.providerName = 'Microsoft';
        this.getCountryValidationRules(this.addressModel.Country, this.providerName);

        let countryMatch = (this.countries.length > 0) ? this.countries.filter(e => e.Code == this.addressModel.Country) : null;
        if (countryMatch != undefined && countryMatch != '' && countryMatch != null) {
            if (this.countryList.includes(countryMatch[0].Code)) {
                this.isOrganizationRegistrationNumberRequired = true;
            }
            else {
                this.isOrganizationRegistrationNumberRequired = false;
            }
        }
        this._publicSignUpService.publicSignupSharedScope.cartProducts.forEach((market: any) => {
            if (market.CategoryName == "OnlineServicesNCE" || (market.CategoryName == "Bundles" && market.MarketCode)) {
                if (market.MarketCode !== this.addressModel.Country) {
                    this._toastService.error(this.translateService.instant('TRANSLATE.PUBLIC_SINGUP_VALIDATION_NCE_COUNTRY_ERROR'))
                    this.addressModel.Country = null;
                    this.stateProvinces == null
                }
            }
        })
    }

    getStateProvincesByCountry(country, resetDetails) {
        this.stateProvinces = null;
        if (resetDetails) {
            this.customerPublicSignUpModel.CustomerAddress = {};
            this.customerPublicSignUpModel.CustomerAddress.State = null;
            this.customerPublicSignUpModel.CustomerAddress.Zip = null;
            this.customerPublicSignUpModel.CustomerAddress.City = null;
        }
        const subscription = this.commonService.getStateProvinceByCountryCode(country).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response.Data !== null && response.Data.length > 0) {
                this.stateProvinces = response.Data;

            }
            else {
                if (resetDetails) {
                    this.customerPublicSignUpModel.CustomerAddress.State = null;
                }
            }
        });
        this._subscriptionArray.push(subscription);
    }

    getCountryValidationRules(countryCode: any, providerName: any) {
        this.countryValidationRules = {};
        const subscription = this._publicSignUpService.getCountryValidationRules(countryCode, providerName).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response.Status === "Success") {
                this.countryValidationRules = response.Data;
                this.frmCustomerPublicSignUp.get('phoneNumber')?.addValidators([Validators.pattern(this.countryValidationRules.PhoneNumberRegex)]);
                this.frmCustomerPublicSignUp.updateValueAndValidity();
            }
        });
        this._subscriptionArray.push(subscription);
    }

    refreshCoupon() {
        this.isApplyCoupon = true;
    }

    getCustomerAgreementURL() {
        this.customerConsentURL = null;
        const subscription = this.commonService.microsoftCustomerAgreementUrl().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.customerConsentURL = response.Data.Value;
        });
        this._subscriptionArray.push(subscription);
    }

    getResellerRelationshipURL() {
        this.ResellerRelationship = null;
        navigator.clipboard.writeText(this.requestResellerRelationshipURL);
        const subscription = this._publicSignUpService.getResellerRelationshipURL(this.internalPlanId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response.Data !== null && response.Data.length > 0) {
                this.ResellerRelationship = response.Data;
                if (this.ResellerRelationship[0].EntityName === 'Partner') {
                    let resellerRelationshipURL = 'https://admin.microsoft.com/Adminportal/Home?invType=ResellerRelationship&partnerId={{partnerTenantId}}&msppId=0&DAP=true#/BillingAccounts/partner-invitation';
                    this.requestResellerRelationshipURL = resellerRelationshipURL.replace("{{partnerTenantId}}", this.ResellerRelationship[0].PartnerTenantId);
                    this.notifierService.alert({ title: this.translateService.instant('TRANSLATE.ALERT_MESSAGE_COPIED_TO_CLIPBOARD'), icon: 'success', 
                        customClass:{
                            confirmButton:'bg-success'
                          },
                    })
                }
                else if (this.ResellerRelationship[0].EntityName === 'Reseller' && this.ResellerRelationship[0].HasSupportsResellersWithMPNID === false && (this.ResellerRelationship[0].MPNID === null && this.ResellerRelationship[0].MPNID == '')) {
                    let resellerRelationshipURL = 'https://admin.microsoft.com/Adminportal/Home?invType=ResellerRelationship&partnerId={{partnerTenantId}}&msppId=0&DAP=true#/BillingAccounts/partner-invitation';
                    this.requestResellerRelationshipURL = resellerRelationshipURL.replace("{{partnerTenantId}}", this.ResellerRelationship[0].PartnerTenantId);
                    this.notifierService.alert({ title: this.translateService.instant('TRANSLATE.ALERT_MESSAGE_COPIED_TO_CLIPBOARD') })
                }
                else if (this.ResellerRelationship[0].EntityName === 'Reseller' && this.ResellerRelationship[0].HasSupportsResellersWithMPNID === true) {
                    if (this.ResellerRelationship[0].MPNID != undefined && this.ResellerRelationship[0].MPNID != null && this.ResellerRelationship[0].MPNID != '') {
                        let resellerRelationshipURL = 'https://admin.microsoft.com/Adminportal/Home?invType=IndirectResellerRelationship&partnerId={{providerResellerId}}&msppId={{providerBusinessId}}&indirectCSPId={{partnerTenantId}}&DAP={{canConsiderDAP}}#/BillingAccounts/partner-invitation';
                        let requestResellerRelationshipURLWithProviderResellerId = resellerRelationshipURL.replace("{{providerResellerId}}", this.ResellerRelationship[0].ResellerProviderId);
                        let requestResellerRelationshipURLWithResellerBuisnessID = requestResellerRelationshipURLWithProviderResellerId.replace("{{providerBusinessId}}", this.ResellerRelationship[0].MPNID)
                        this.requestResellerRelationshipURL = requestResellerRelationshipURLWithResellerBuisnessID.replace("{{partnerTenantId}}", this.ResellerRelationship[0].PartnerTenantId);
                        this.notifierService.alert({ title: this.translateService.instant('TRANSLATE.ALERT_MESSAGE_COPIED_TO_CLIPBOARD') })
                    }
                    else {
                        this.toastService.warning(this.translateService.instant('TRANSLATE.ALERT_MESSAGE_MISSING_MPNID'))
                    }

                }
            }
        });
        this._subscriptionArray.push(subscription);
    }

    onCustomerConsentIsAcceptedChange() {
        ;
        this.isCustomerConsentAcceptanceProvided = this.frmCustomerPublicSignUp.get('isCustomerConsentAcceptanceProvided')?.value;
        if (this.isCustomerConsentAcceptanceProvided) {
            this.maxConsentDate = new Date();
            this.customerConsentAcceptanceDate = this.localTimeConvert(new Date());
        }
    }

    localTimeConvert(date: any) {
        // let localDate = moment.utc(date).toDate();
        // return dayjs(localDate).local().toDate();
    }

    customerConsentClick() {
        window.open(this.customerConsentURL, "_blank");
    }

    getMCBBillingConfig() {
        const subscription = this.commonService.getMCBBillingConfig(this.internalPlanId, this.BillingProviderName).pipe(takeUntil(this.destroy$)).subscribe((result: any) => {
            let billingConfig = result.Data;
            this.merchantId = billingConfig.MerchantId;
            let url = "https://mcb.gateway.mastercard.com/form/version/58/merchant/" + this.merchantId + "/session.js";
            let myCoolCode = document.createElement("script");
            myCoolCode.setAttribute("src", url);
            document.body.appendChild(myCoolCode);

        });
        this._subscriptionArray.push(subscription);
    }
    getCartItemsInStorage(products: any = null) {
        ;
        if (products != null) {
            this.products = products;
        } else {
            this.products = this._publicSignUpService.publicSignupSharedScope.cartProducts || [];
        }
        this.getCartTotal();
    }

    getCartTotal() {
        this._publicSignUpService.cartTotal = 0;
        this._publicSignUpService.cartCount = 0;
        _.map(this.products, each => {
            this._publicSignUpService.cartTotal = this._publicSignUpService.cartTotal + (each.SalePrice * each.Quantity);
            this._publicSignUpService.cartCount += 1;
            if (each.Addons && each.Addons.length > 0) {
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

    getDiscountAndPayableAmount() {
        this.payableAmount = null;
        this.cartDiscount = null;
        let originalPriceofProductsInCart = 0;
        this.finalSalePriceOfProductsInCart = null;
        if (this.products !== null && this.products.length > 0) {
            this.calculateFinalSalePrice();
            if (this.finalSalePriceOfProductsInCart !== null) {
                this.cartDiscount = this._publicSignUpService.cartTotal - this.finalSalePriceOfProductsInCart;
                if (this.cartDiscount !== null) {
                    this.payableAmount = this._publicSignUpService.cartTotal - this.cartDiscount;
                    this.isDiscountApplied = true;
                    this.isCouponValidationInProgress = false;
                }
            }
        }
        this.checkIfMicrosoftProductIsPresentInCart();
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
        if (this._publicSignUpService.CustomerPublicSignUpModel !== undefined && this._publicSignUpService.CustomerPublicSignUpModel !== null) {
            this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = null;
        }
        if (this._publicSignUpService.publicSignupSharedScope !== undefined && this._publicSignUpService.publicSignupSharedScope !== null)
        {
            this._publicSignUpService.publicSignupSharedScope.couponCode = null;
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
        this._publicSignUpService.publicSignupSharedScope.couponCode = null;
        if (product.Discount !== 0 && product.DiscountType === 'Percentage') {
          product.FinalSalePrice = product.OriginlaSalePrice - (product.OriginlaSalePrice * (product.Discount / 100));
        } else if (product.Discount !== 0 && product.DiscountType === 'Price') {
          product.FinalSalePrice = product.OriginlaSalePrice - product.Discount;
        } else {
          product.FinalSalePrice = product.OriginlaSalePrice;
        }
    }

    checkOutCart() {
        this._publicSignUpService.backFromCreateCustomerForm = true;
        this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/cart`], { state: { backFromCreateCustomerForm: this._publicSignUpService.backFromCreateCustomerForm } });
    }

    validateCoupon() {
        this.isCouponValidationInProgress = true;
        //this._publicSignUpService.CustomerPublicSignUpModel.couponCode = null;  

        if (this._publicSignUpService.CustomerPublicSignUpModel === undefined) {
          this._publicSignUpService.CustomerPublicSignUpModel = {};
        } 

        const subscription = this._publicSignUpService.validatecoupon(this.couponCode, this.internalPlanId).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
            if (res.Status === "Success" && res.Data !== null) {
                this.couponDetails = res.Data;
                if (!this.couponDetails.IsCouponValid) {
                    this._toastService.error(this.translateService.instant('TRANSLATE.INVALID_COUPON'));
                    this.removeCouponApplied();
                }
                else {
                    this.isCouponValid = true;
                    this.isApplyCoupon = false;
                    this.validCouponCode = this.couponCode;
                    this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = this.couponCode;
                    this._publicSignUpService.publicSignupSharedScope.couponCode = this.couponCode;
                    if ((this.couponDetails !== null && this.couponDetails !== undefined) && (this.couponDetails.Discount !== null)) {
                        this.getProductsAddedToCart();
                        this.getDiscountsForProductsAddedToCart();

                    }
                }
            }
        });
        this._subscriptionArray.push(subscription);
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
    sumbitCustomerDetails() {
        this.getFormData();
        this.frmExistingMsTenant.markAllAsTouched();
        this.cartItems = this._publicSignUpService.publicSignupSharedScope.cartProducts;
        this._publicSignUpService.publicSignupSharedScope.couponCode = this.couponCode;
        this._publicSignUpService.CustomerPublicSignUpModel.CouponCode = this.couponCode;
        if (this.frmExistingMsTenant.valid &&  this._publicSignUpService.isEmailAddressValid) {
            if (this.isDomainAvailble == true) {
                this.toastService.error(this.translateService.instant('TRANSLATE.PC_TENANT_NOT_EXISTS'))
                return;
            }
            this.customerPublicSignUpModel.BatchId = this.signUpBatchId;
            this.customerPublicSignUpModel.EnvironmentId = this.environmentId;
            this.customerPublicSignUpModel.ProviderName = 'Microsoft';
            this.customerPublicSignUpModel.CustomerCurrencyCode = this.customerCurrencyCode;
            this.customerPublicSignUpModel.IsCustomerConsentProvided = this.isCustomerConsentAcceptanceProvided;
            this.customerPublicSignUpModel.IsMicrosoftProductAvailable = this.isMicrosoftProductAvailable;
            this.customerPublicSignUpModel.CustomerCurrencyCode = 'USD';
            this.customerPublicSignUpModel.IsExistingMsTenant = true;
            this.customerPublicSignUpModel.CartItems = { CartItems: JSON.stringify(this._publicSignUpService.publicSignupSharedScope.cartProducts) };
            const subscription = this._publicSignUpService.sumbitCustomerDetails(this.customerPublicSignUpModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                if (response.Status === "Success" && response.Status !== null) {
                    const confirmationText = this.translateService.instant('TRANSLATE.CUSTOMER_PUBLIC_SIGN_UP_SUCCESS_MESSAGE')
                    const btndone = this.translateService.instant('TRANSLATE.CUSTOMER_PUBLIC_SIGN_UP_BUTTON_TEXT_DONE')
                    this.notifierService.confirm({ title: confirmationText, icon: 'success', showCancelButton:false, confirmButtonText:this.translateService.instant('TRANSLATE.CUSTOMER_PUBLIC_SIGN_UP_BUTTON_TEXT_DONE') ,  confirmButtonColor: 'green', }).then((result: { isConfirmed: any, isDenied: any }) => {
                        if (result.isConfirmed) {
                            this._publicSignUpService.cartCount = 0;
                            this.cartCount = 0;
                            this._publicSignUpService.cartTotal = 0;
                            this.cartTotal = 0;
                            delete this._publicSignUpService.publicSignupSharedScope.cartProducts;
                            this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/shop`]);
                        }
                    });
                }
            });
            this._subscriptionArray.push(subscription);
        }
        else {
            this.toastService.error(this.translateService.instant('TRANSLATE.CUSTOMER_PUBLIC_SIGN_UP_FORM_VALIDATION_FAILED_MESSAGE'))
        }

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
