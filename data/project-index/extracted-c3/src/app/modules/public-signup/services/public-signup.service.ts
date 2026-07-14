import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { map, Observable, Subject } from 'rxjs';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { ResponseData } from 'src/app/shared/models/common';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublicSignupService {
  publicSignupPlanName: any;
  SignUpBatchId: any;
  isPlandetails: any;
  cartTotal: any;
  cartCount: any;
  alreadyPresentCouponCode: any;
  CustomerPublicSignUpModel: CustomerPublicSignupModel | any;
  planCouponCode: any;
  IsExistingMsTenant: boolean = false;
  IsPaymentSkipped: any;
  wizardControl: any;
  publicSignupSharedScope: PublicSignupScope;
  apiUrl = environment.apiBaseUrl;
  publicSignupUrl = this.apiUrl + '/publicsignup';
  filterBySearchKeywordSubject = new Subject();
  isShopScreen = true;
  backFromCreateCustomerForm: boolean = false;
  billingInformationFormSubmitted: boolean = false;
  isNotLogScreen = true;
  searchKeyword: string = null;
  isDiscountApplied: boolean = false;
  isEmailAddressValid: boolean = null;
  IsAlignWithEndDateEnabled: boolean = null;

  constructor(
    private _http: HttpClient,
    private _commonService: CommonService,
    private _clientSettingsService: ClientSettingsService
  ) { }

  getPlanDetails(internalPlanId: any) {
    return this._http.get(`${this.apiUrl}/publicsignup/plan/${internalPlanId}/details`);
  }

  getBillingprovider(internalPlanId: any) {
    return this._http.get(`${this.apiUrl}/publicsignup/billingProvider/${internalPlanId}`);
  }

  getBillingProviderConfig(internalPlanId: any, billingProviderName: any) {
    return this._http.get(`${this.apiUrl}/common/plan/${internalPlanId}/billingProvider/${billingProviderName}/billingProviderConfig`);
  }

  validatecoupon(couponCode: any, internalPlanId: any) {
    return this._http.get(`${this.apiUrl}/publicsignup/validatecoupon/${couponCode}/Plan/${internalPlanId}`);
  }

  getProviderListForPlanProductIds(reqBody: any) {
    return this._http.post(`${this.apiUrl}/publicsignup/getproviderlistforplanproductids`, reqBody);
  }

  getDiscountForProducts(reqBody: any) {
    const params = this._commonService.buildHttpParamsObject(reqBody);
    return this._http.get(`${this.apiUrl}/publicsignup/getdiscountforproducts`, { params: params });
  }

  planDetailsUri(internalPlanId: any) {
    return this._http.get(`${this.apiUrl}/publicsignup/plan/${internalPlanId}/details`);
  }

  getBatchid() {
    return this._http.get(`${this.apiUrl}/publicsignup/batchid`)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  getBillingProvider(internalPlanId: any) {
    return this._http.get(`${this.apiUrl}/publicsignup/billingProvider/${internalPlanId}`);
  }

  checkDomainAvialbility(reqBody: any) {
    return this._http.post(`${this.apiUrl}/publicsignup/getproviderlistforplanproductids`, reqBody);
  }

  getCountries() {
    return this._http.get(`${this.apiUrl}/publicsignup/batchid`);
  }

  getCountryValidationRules(countryCode: any, providerName: any) {
    return this._http.get(`${this.apiUrl}/addressValidationRules/Providers/${providerName}/Countries/${countryCode}`);
  }

  getResellerRelationshipURL(internalPlanId: any) {
    return this._http.get(`${this.apiUrl}/publicsignup/partnerTenantId/${internalPlanId}`);
  }

  sumbitCustomerDetails(customerPublicSignUpModel: any) {
    return this._http.post(`${this.apiUrl}/publicsignup/customer`, customerPublicSignUpModel);
  }

  getBillingProviderConfigForPayment(internalPlanId: any) {
    return this._http.get(`${this.apiUrl}/publicsignup/billingProviderconfig/${internalPlanId}`);
  }

  setBillingCustomer(reqBody: any) {
    return this._http.post(`${this.apiUrl}/publicsignup/billingcustomer`, reqBody);
  }

  geHostedToken(billingProviderReferenceID: any): Observable<any> {
    return this._http.get<any>(`${this.apiUrl}/publicsignup/${billingProviderReferenceID}/GetHostedToken`);
  }

  getSupportedPaymentTypes(internalPlanId: any, billingProviderName: any) {
    return this._http.get(`${this.apiUrl}/common/plan/${internalPlanId}/billingProviders/${billingProviderName}/supportedpaymentTypes`);
  }

  setCustomer(reqBody: any) {
    return this._http.post(`${this.apiUrl}/publicsignup/customer`, reqBody);
  }


  getBillingConfig(planId: string, billingProvider: string) {
    return this._http.get(`${this.apiUrl}/common/plan/${planId}/billingprovider/${billingProvider}/billingproviderconfig`);
  }

  getIsAlignWithCalendorEndDateSetting(planId: string) {
    return this._http.get(`${this.publicSignupUrl}/DefaultCoterminosityTypeByPlanId/${planId}`);
  }

  getPlanDetails1(planId) {
    return this._http.get(`${this.publicSignupUrl}/${planId}/details`);

  }

  getProductsForSignup(reqBody: any) {
    return this._http.post(`${this.publicSignupUrl}/plan`, reqBody);
  }

  getNewBatchId() {
    return this._http.get(`${this.publicSignupUrl}/batchId`);
  }

  updateCartItemServiceProviderCustomer(reqBody: any) {
    return this._http.post(`${this.apiUrl}/carts/${this._commonService.entityName}/${this._commonService.recordId}/item`, reqBody)
      .pipe(map((v: any) => v))
  }

  validateDomain(domain: any) {
    return this._http.post(`${this.apiUrl}/publicsignup/validatedomain/Microsoft/${domain}`, null);
  }

  onEmailAddressChange(InternalPlanId: any, email: any) {
    return this._http.post(`${this.apiUrl}/publicsignup/validatecustomer/${InternalPlanId}/${email}`, null);
  }


  getClientSettings() {
    return this._clientSettingsService.getData();
  }

  getPublicSignupScope() {
    return this.publicSignupSharedScope;
  }

  setPublicSignUpCartProduct(product: any) {
    this.publicSignupSharedScope.cartProducts.push(product);
  }

  getCustomerPublicSignUpLogs(signUpBatchId: any) {
    return this._http.get(`${this.apiUrl}/publicsignup/${signUpBatchId}/logs`);
  }


  getCustomerSignUpStatus(signUpBatchId: any, environmentId: any) {
    return this._http.get(`${this.apiUrl}/publicsignup/batch/${signUpBatchId}/environment/${environmentId}/status`);
  }

  submitRequestForSignup(customerPublicSignUpModel: any) {
    return this._http.post(`${this.apiUrl}/publicsignup/customer`, customerPublicSignUpModel);
  }

  getPublicSignUpPlanName(InternalPlanId: any) {
    return this._http.get(`${this.apiUrl}/publicsignup/plan/${InternalPlanId}/details`);
  }

  getSupportedMarkets(InternalPlanId: any) {
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/publicsignup/supportedMarkets/${InternalPlanId}`).pipe(map(v => v.Data));
  }

  getNCEAddonBaseOfferForPublicSignup(planProductId : any){
    return this._http.get<ResponseData<any[]>>(`${this.publicSignupUrl}/NCEAddonBaseOfferForPublicSignup/${planProductId}`).pipe(map(v => v.Data));
  }

  
  getMCBBillingConfig(internalPlanID: any, billingProvider:string) {
    return this._http.get(`${this.apiUrl}/common/plan/${internalPlanID}/billingprovider/${billingProvider}/billingproviderconfig`)
  }

  GetPaymentProfileStatus(sessionId:string){
    return this._http.get(`${this.apiUrl}/publicsignup/getPaymentProfileStatus/sessionId/${sessionId}`)
  }

  ResumePublicSignup(batchId:string){
    return this._http.post(`${this.apiUrl}/publicsignup/${batchId}/resume`, null);
  }

  validate3DSToken(postData: any){
    return this._http.post(`${this.apiUrl}/publicsignup/validate3DSecure`, postData).pipe(map((res: any) => {
      return res.Data;
    }));
  }

  createSetupIntent(requestBody: any) {
    return this._http.post(`${this.apiUrl}/publicsignup/createPublicSignupIntent`, requestBody)
  }

  getStripePaymentDetails(requestBody: any) {
    return this._http.post(`${this.apiUrl}/publicsignup/getStripePaymentDetails`, requestBody)
  }

  setPublicSignupScope(clientSettings: any) {
    this.publicSignupSharedScope.CLIENT_ID = clientSettings.ADClientId;
    this.publicSignupSharedScope.CacheKey = clientSettings.CacheKey.toLowerCase();
    this.publicSignupSharedScope.DateFormat = clientSettings.DateFormat;
    this.publicSignupSharedScope.CurrencySymbol = clientSettings.CurrencySymbol;
    this.publicSignupSharedScope.CurrencyDecimalPlaces = clientSettings.CurrencyDecimalPlaces;
    this.publicSignupSharedScope.CurrencyThousandseparator = clientSettings.CurrencyThousandseparator;
    this.publicSignupSharedScope.CurrencyDecimalSeparator = clientSettings.CurrencyDecimalSeparator;
    this.publicSignupSharedScope.CurrencyCode = clientSettings.CurrencyCode;
    this.publicSignupSharedScope.PoweredByCompanyURL = clientSettings.PoweredByCompanyURL;
    this.publicSignupSharedScope.PoweredByCompanyName = clientSettings.PoweredByCompanyName;
    this.publicSignupSharedScope.ContactCompanyName = clientSettings.ContactCompanyName;
    this.publicSignupSharedScope.CompanyUrl = clientSettings.CompanyUrl;
    this.publicSignupSharedScope.PartnerPreferenceLanguages = clientSettings.PartnerPreferenceLanguages;
    this.publicSignupSharedScope.CustomTheme = clientSettings.CustomTheme;
    this.publicSignupSharedScope.WELCOME_PAGE_BUTTON_STYLE = clientSettings.WelcomePageButtonStyle;
    this.publicSignupSharedScope.WELCOME_LOGO_PATH = clientSettings.WelcomeLogoPath;
    this.publicSignupSharedScope.PUBLIC_SIGNUP_LOGO_PATH = clientSettings.PublicSignUpLogoPath;
    this.publicSignupSharedScope.PUBLIC_SIGNUP_ADMIN_PORTAL = clientSettings.PublicSignupAdminPortal;
    this.publicSignupSharedScope.PUBLIC_SIGNUP_LEARNER_PORTAL = clientSettings.PublicSignupLearnerPortal;
    this.publicSignupSharedScope.PUBLIC_SIGNUP_BANNER_MAIN_HEADING = clientSettings.PublicSignupBannerMainHeading;
    this.publicSignupSharedScope.PUBLIC_SIGNUP_BANNER_PARAGRAPH_HEADING = clientSettings.PublicSignupBannerParagraphHeading;
    this.publicSignupSharedScope.PUBLIC_SIGNUP_TERMS_AND_CONDITIONS1 = clientSettings.PublicSignupTermsAndConditions1;
    this.publicSignupSharedScope.PUBLIC_SIGNUP_TERMS_AND_CONDITIONS2 = clientSettings.PublicSignupTermsAndConditions2;
    this.publicSignupSharedScope.PUBLIC_SIGNUP_SUPPORT = clientSettings.PublicSignupSupport;
    this.publicSignupSharedScope.PUBLIC_SIGNUP_BANNER = clientSettings.PublicSignUpBanner;
    this.publicSignupSharedScope.LOGGEDIN_LOGO_PATH = clientSettings.LoggedInLogoPath;
    this.publicSignupSharedScope.FAVICON_LOGO_PATH = clientSettings.FaviconLogoPath;
    this.publicSignupSharedScope.LINK_TO_CONTACT = clientSettings.LinkToContact;
    this.publicSignupSharedScope.DEFAULT_LANDING_PAGE_URL = clientSettings.DefaultLandingPageURL;
    this.publicSignupSharedScope.DOES_ENABLE_AZURE_SEARCH = clientSettings.IsPublicCatalogueBackedByAzureSearch;
    this.publicSignupSharedScope.IS_PUBLIC_SIGNUP_FILTER_AVAILABLE_FOR_CUSTOMER = clientSettings.IsFilterAvailableForCustomer;
    this.publicSignupSharedScope.MinimumChargeAmount = clientSettings.MinimumChargeAmount;
    this.publicSignupSharedScope.DefaultPageCount = clientSettings.DefaultPageCount;
    /*Update root scope values*/
    this.publicSignupSharedScope.ApplicationName = clientSettings.APPLICATION_NAME;
    this.publicSignupSharedScope.WelcomeLogoPath = clientSettings.WELCOME_LOGO_PATH;
    this.publicSignupSharedScope.WelcomePageButtonStyle = clientSettings.WELCOME_PAGE_BUTTON_STYLE;
    this.publicSignupSharedScope.PublicSignUpLogo = clientSettings.PUBLIC_SIGNUP_LOGO_PATH;
    this.publicSignupSharedScope.PublicSignUpBanner = clientSettings.PUBLIC_SIGNUP_BANNER;
    this.publicSignupSharedScope.PublicSignupAdminPortal = clientSettings.PublicSignupAdminPortal;
    this.publicSignupSharedScope.PublicSignupSupport = clientSettings.PublicSignupSupport;
    this.publicSignupSharedScope.PublicSignupCloudlabsWebsite = clientSettings.PublicSignupCloudlabsWebsite;
    this.publicSignupSharedScope.PublicSignupLearnerPortal = clientSettings.PublicSignupLearnerPortal;
    this.publicSignupSharedScope.PublicSignupBannerParagraphHeading = clientSettings.PublicSignupBannerParagraphHeading;
    this.publicSignupSharedScope.PublicSignupBannerMainHeading = clientSettings.PublicSignupBannerMainHeading;
    this.publicSignupSharedScope.PublicSignupTermsAndConditions1 = clientSettings.PUBLIC_SIGNUP_TERMS_AND_CONDITIONS1;
    this.publicSignupSharedScope.PublicSignupTermsAndConditions2 = clientSettings.PUBLIC_SIGNUP_TERMS_AND_CONDITIONS2;
    this.publicSignupSharedScope.IsFilterAvailableForCustomer = clientSettings.IS_PUBLIC_SIGNUP_FILTER_AVAILABLE_FOR_CUSTOMER;
    this.publicSignupSharedScope.IsPublicCatalogueBackedByAzureSearch = clientSettings.DOES_ENABLE_AZURE_SEARCH;
    this.publicSignupSharedScope.NCETermsAndConditionURLText = clientSettings.NCETermsAndConditionURLText;
    this.publicSignupSharedScope.DefaultTermsAndConditionText = clientSettings.DefaultTermsAndConditionText;
  }
}
class CustomerPublicSignupModel {
  ProviderName?: null;
  CompanyName?: null;
  FirstName?: null;
  LastName?: null;
  MiddleName?: null;
  OrganizationRegistrationNumber?: null;
  Email?: null;
  Domain?: string | null;
  AddEmailAsCustomerAdmin?: false;
  NotifyCustomer?: false;
  InternalPlanId?: null;
  CustomerCurrencyCode?: null;
  BillingCustomerAddressId?: null;
  BillingProviderReferenceID?: null;
  PaymentType?: null;
  CreditCardNumber?: null;
  AccountNumber?: null;
  CustomerAddress?: any;
  PhoneNumber?: null;
  OnboardBatchId?: null;
  IsCustomerConsentProvided?: null;
  EnvironmentId?: null;
  TenantId?: null;
  IsExistingMsTenant?: null;
  CouponCode?: null;
}

export class PublicSignupScope {
  EnvironmentId?: string;
  InternalPlanId?: string;
  BillingProviderName?: string;
  CLIENT_ID?: string;
  CacheKey?: string;
  DateFormat?: string;
  CurrencySymbol?: string;
  CurrencyDecimalPlaces?: string;
  CurrencyThousandseparator?: string;
  CurrencyDecimalSeparator?: string;
  CurrencyCode?: string;
  PoweredByCompanyURL?: string;
  PoweredByCompanyName?: string;
  ContactCompanyName?: string;
  CompanyUrl?: string;
  PartnerPreferenceLanguages?: string;
  CustomTheme?: string;
  WELCOME_PAGE_BUTTON_STYLE?: string;
  WELCOME_LOGO_PATH?: string;
  PUBLIC_SIGNUP_LOGO_PATH?: string;
  PUBLIC_SIGNUP_ADMIN_PORTAL?: string;
  PUBLIC_SIGNUP_LEARNER_PORTAL?: string;
  PUBLIC_SIGNUP_BANNER_MAIN_HEADING?: string;
  PUBLIC_SIGNUP_BANNER_PARAGRAPH_HEADING?: string;
  PUBLIC_SIGNUP_TERMS_AND_CONDITIONS1?: string;
  PUBLIC_SIGNUP_TERMS_AND_CONDITIONS2?: string;
  PUBLIC_SIGNUP_SUPPORT?: string;
  PUBLIC_SIGNUP_BANNER?: string;
  LOGGEDIN_LOGO_PATH?: string;
  FAVICON_LOGO_PATH?: string;
  LINK_TO_CONTACT?: string;
  DEFAULT_LANDING_PAGE_URL?: string;
  DOES_ENABLE_AZURE_SEARCH?: string;
  IS_PUBLIC_SIGNUP_FILTER_AVAILABLE_FOR_CUSTOMER?: string;
  MinimumChargeAmount?: string;
  DefaultPageCount?: string;
  ApplicationName?: string;
  WelcomeLogoPath?: string;
  WelcomePageButtonStyle?: string;
  PublicSignUpLogo?: string;
  PublicSignUpBanner?: string;
  PublicSignupAdminPortal?: string;
  PublicSignupSupport?: string;
  PublicSignupCloudlabsWebsite?: string;
  PublicSignupLearnerPortal?: string;
  PublicSignupBannerParagraphHeading?: string;
  PublicSignupBannerMainHeading?: string;
  PublicSignupTermsAndConditions1?: string;
  PublicSignupTermsAndConditions2?: string;
  IsFilterAvailableForCustomer?: string;
  IsPublicCatalogueBackedByAzureSearch?: string;
  cartProducts?: any[] = [];
  BatchId?: string;
  DefaultTermsAndConditionText?: boolean;
  NCETermsAndConditionURLText?: boolean;
  DefaultTermsAndConditionChecked?: boolean;
  NCETermsAndConditionURLChecked?: boolean;
  formCart?: FormGroup;
  couponCode?: string;
  planCouponCode?: string;
  isExistingMsTenant?: boolean;
  frmExistingMsTenant?: FormGroup;
  frmCustomerPublicSignUp?: FormGroup;
  customerPublicSignUpModel?: any;
  Discount?: number;
  payableAmount?: number;
  Domain?: string;
}