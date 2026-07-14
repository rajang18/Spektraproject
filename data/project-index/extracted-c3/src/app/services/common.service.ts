import { HttpClient, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Observable, of, map, tap, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CountryData, StateApiResponse, SupportedCurrenciesData } from '../shared/models/customers.model';
import { BillingCycles, Categories, CurrencyConversionOptions, Macros, ResponseData, TermDuration, BillingTypes, BillingPeriodType, CommonProviders } from '../shared/models/common';
import { AuthService } from '../shared/models/auth/auth.service';
import { RenewalPoliciesType } from '../shared/models/enums/enums';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  SelectBillingPeriods: any = null;
  apiUrl = environment.apiBaseUrl;
  CategoryIds:string='';

  public get entityName() {
    return this.getFromLocalStorge('EntityName');
  }

  public get recordId() {
    return this.getFromLocalStorge('RecordId');
  }
  private _user: any;

  public get user() {
    var ExternalProvider = localStorage.getItem("ExternalProvider");
    if (ExternalProvider) {
      var user = null;
      var external_user_name = localStorage.getItem("external_user_name");
      user = {
        userName: '',
        profile : {
          name : ''
        }
      };
      user.profile.name =external_user_name;
      return user;
    } else {
      if (!this._user) {
        const accessToken = this._authService.instance.getActiveAccount()?.idToken ?? "";
        this._user = this._createUser(accessToken);
      }
      return this._user
    }
  }


  public get loggedInUserName() {
    if (!this._user) {
      const accessToken = this._authService.instance.getActiveAccount()?.idToken ?? "";
      this._user = this._createUser(accessToken);
    }
    return this._user.profile.preferred_username
  }

  public get currentImpersonationUserEmail() {
    var currentImpersonatedUserEmail: string | null = null;
    var localStorageContext = localStorage.getItem("resellerImpersonationContext");
    if (localStorageContext !== null) {
      var resellerImpersonationContext = JSON.parse(localStorageContext);
      //$rootScope.impersonatedResellerUserEmail = decodeURIComponent(resellerImpersonationContext.Username);
      currentImpersonatedUserEmail = decodeURIComponent(resellerImpersonationContext.Username);
    }
    return currentImpersonatedUserEmail;
  }

  public get userInfo() {
    var userInfo: any;
    var lsVar = localStorage.getItem("userinfo");
    if (lsVar !== null) {
      userInfo = JSON.parse(lsVar);
    }
    return userInfo;
  }

  private cachedCountires: Observable<CountryData[]> | null = null;
  private cachedCurrencyConversionOptions: Observable<CurrencyConversionOptions[]> | null = null;
  private cachedConsumptionTypes: Observable<any[]> | null = null;

  private cachedBillingCycles: Observable<BillingCycles[]> | null = null;
  private cachedBillingtypes: Observable<BillingTypes[]> | null = null;
  private cachedTermDuration: Observable<TermDuration[]> | null = null;
  private cachedBillingPeriodTypes: Observable<BillingPeriodType[]> | null = null;
  private cachedMacroTypes: Observable<any[]> | null = null;
  private cachedSaleTypes: Observable<any[]> | null = null;
  public get userContext() {
    return localStorage.getItem('userContextList') || null;
  }

  private cachedBillingTypes: Observable<BillingTypes[]> | null = null;
  private cachedEntityRecordIdContext: Observable<any[]> | null = null;

  constructor(
    private _http: HttpClient,
    private _authService: AuthService
  ) { }

  getSupportedCurrencies(): Observable<any> {
    return this._http.get<SupportedCurrenciesData>(`${this.apiUrl}/common/${this.entityName}/${this.recordId}/SupportedCurrencies`);
  }

  getContextByEntityAndRecordId(): Observable<any[]> {
    if (this.cachedEntityRecordIdContext) {
      return this.cachedEntityRecordIdContext
    }
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/common/ContextByEntityAndRecordId`)
      .pipe(
        map(v => v.Data),
        tap(v => this.cachedEntityRecordIdContext = of(v))
      );
  }

  getCountires(): Observable<CountryData[]> {
    if (this.cachedCountires) {
      return this.cachedCountires;
    }
    return this._http.get<ResponseData<CountryData[]>>(`${this.apiUrl}/common/countries`)
      .pipe(
        map(v => v.Data),
        tap(v => this.cachedCountires = of(v))
      );
  }

  getSites() {
    return this._http.get<ResponseData<any>>(`${this.apiUrl}/common/sites`)
  }
  getDepartments() {
    return this._http.get<ResponseData<any>>(`${this.apiUrl}/common/departments`)
  }
  getDomains() {
    return this._http.get<ResponseData<any>>(`${this.apiUrl}/customers/domain`)
  }

  getProviderTenants(provider: string) {
    return this._http.get<ResponseData<any>>(`${this.apiUrl}/customers/${this.entityName}/${this.recordId}/Providers/${provider}/Tenants`);
  }

  getStateByCountryCode(countryCode: string): Observable<StateApiResponse> {
    return this._http.get<StateApiResponse>(`${this.apiUrl}/common/StateProvinceByCountryCode/${countryCode}/`);
  }

  getCurrencyConversionOptions() {
    if (this.cachedCurrencyConversionOptions) {
      return this.cachedCurrencyConversionOptions;
    }
    return this._http.get<ResponseData<CurrencyConversionOptions[]>>(`${this.apiUrl}/CurrencyConversion/Options`)
      .pipe(
        map(v => v.Data),
        tap(v => this.cachedCurrencyConversionOptions = of(v))
      );
  }

  getCurrencySymbols(currency: any) {
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/common/GetCurrencySymbolByCode/${currency}`)
      .pipe(
        map(v => v.Data)
      );
  }

  getConsumptionTypes() {
    if (this.cachedConsumptionTypes) {
      return this.cachedConsumptionTypes;
    }
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/common/ConsumptionTypes`)
      .pipe(
        map(v => v.Data),
        tap(v => this.cachedConsumptionTypes = of(v))
      );
  }

  getBillingCycles() {
    if (this.cachedBillingCycles) {
      return this.cachedBillingCycles;
    }
    return this._http.get<ResponseData<BillingCycles[]>>(`${this.apiUrl}/common/billingCycles`)
      .pipe(map((v: ResponseData<BillingCycles[]>) => v.Data),
        tap(v => this.cachedBillingCycles = of(v))
      );

  }

  getBillingTypes() {
    if (this.cachedBillingTypes) {
      return this.cachedBillingTypes;
    } else {
      return this._http.get(`${this.apiUrl}/common/billingTypes`)
        .pipe(
          map((v: any) => v.Data),
          tap(v => this.cachedBillingTypes = of(v))
        )
    }

  }

  getConsumptionBillingCycles() {
    if (this.cachedBillingCycles) {
      return this.cachedBillingCycles;
    }
    return this._http.get<ResponseData<BillingCycles[]>>(`${this.apiUrl}/common/ConsumptionBillingCycles`)
      .pipe(map((v: ResponseData<BillingCycles[]>) => v.Data),
        tap(v => this.cachedBillingCycles = of(v))
      );

  }

  getConsumptionBillingTypes() {
    return this._http.get(`${this.apiUrl}/common/ConsumptionBillingTypes`)
      .pipe(map((v: any) => v.Data)
      );

  }

  getTermDuration() {
    if (this.cachedTermDuration) {
      return this.cachedTermDuration;
    }
    return this._http.get<ResponseData<TermDuration[]>>(`${this.apiUrl}/common/productValidityAndValidityTypes`)
      .pipe(
        map((v: ResponseData<TermDuration[]>) => v.Data),
        tap(v => this.cachedTermDuration = of(v))
      );
  }


  getMacroTypes() {
    if (this.cachedMacroTypes) {
      return this.cachedMacroTypes;
    }
    return this._http.get<ResponseData<Macros[]>>(`${this.apiUrl}/common/Macros`)
      .pipe(
        map((v: ResponseData<Macros[]>) => v.Data),
        tap(v => this.cachedMacroTypes = of(v))
      );
  }

  getCategories(screenName: string) {
    return this._http.get<ResponseData<Categories[]>>(`${this.apiUrl}/categories/screen/${screenName}/${this.entityName}/${this.recordId}/undefined`)
      .pipe(map(v => v.Data));
  }

  getCategoriesByProviderId(providerId: string) {
    return this._http.get(`${this.apiUrl}/categories/ForProvider/${providerId}`);
  }

  getCategoriesForSubscription() {
    return this._http.get(`${this.apiUrl}/categories`);
  }

  getSubscriptionStatus() {
    return this._http.get(`${this.apiUrl}/common/subscriptionstatus`);
  }

  getBillingPeriodsForSubscription() {
    return this._http.get(`${this.apiUrl}/common/billingperiods`);
  }

  getProviderCategories() {
    return this._http.get(`${this.apiUrl}/Providers/ServiceTypes`);
  }

  ClearCache(): void {
    this.cachedCountires = null;
    this.cachedCurrencyConversionOptions = null;
    this.cachedTermDuration = null;
    this.cachedBillingCycles = null;
    this.cachedBillingTypes = null;
    this.cachedMacroTypes = null;
  }

  getFromLocalStorge(key: string): string | null {
    return localStorage.getItem(key);
  }

  getProviders() {
    return this._http.get<ResponseData<CommonProviders[]>>(`${this.apiUrl}/providers`).pipe(map(v => v.Data));
  }

  getFeedSources() {
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/common/FeedSources`).pipe(map(v => v.Data));

  }

  getProvidersForSubscription() {
    return this._http.get(`${this.apiUrl}/providers/ServiceTypes`);
  }

  getCustomerTagKeys() {
    return this._http.get(`${this.apiUrl}/common/tags`);
  }

  getTagValues(searchParams: any) {
    return this._http.get(`${this.apiUrl}/common/tags`, { params: { tagkey: searchParams.tagkey } });
  }

  getDownloadableReportColumns(params: any) {
    const option = this.buildHttpParamsObject(params)
    return this._http.get(`${this.apiUrl}/Common/DownloadbleReportColumns/`, { params: option })
  }
  getDownloadbleInvoicelineitemReportColumns(params: any) {
    return this._http.get(`${this.apiUrl}/Common/DownloadbleInvoicelineitemReportColumns/`, { params: params })
  }

  getDownloadableGridProductReport(params: any) {
    const option = this.buildHttpParamsObject(params)
    return this._http.get(`${this.apiUrl}/Common/DownloadbleReportColumns/`, { params: option })
  }

  getPlans(EndInd: number, PageSize: number) {
    return this._http.get(`${this.apiUrl}/plans`, {
      params: {
        PageSize: PageSize,
        EndInd: EndInd
      },
    });
  }

  getDownloadableReportColumnsForPartnerOffer(params: any) {
    const option = this.buildHttpParamsObject(params)
    return this._http.get(`${this.apiUrl}/Common/DownloadblePartnerOffersReportColumns/`, { params: option })
  }



  getActiveBillingProvider(customerC3Id: string | null) {
    //const option = this.buildHttpParamsObject(searchParams);
    return this._http.get(`${this.apiUrl}/common/ActiveBillingProvider/${customerC3Id}`)
  }



  getDownloadableReportColumnsForPlans(params: any) {
    const option = this.buildHttpParamsObject(params)
    return this._http.get(`${this.apiUrl}/Common/DownloadbleReportColumns/`, { params: option })
  }

  getPlanOffersByPlanId(url: string, params: any) {
    return this._http.get(`${this.apiUrl}/${url}`, { params });
  }


  //    apiService.post('/api/providerpromotions/getPromotionDetailFromProvider', data).then(function (response) {
  getPromotionDetailFromProvider(data: any) {
    return this._http.post(`${this.apiUrl}/providerpromotions/getPromotionDetailFromProvider`, data);
  }

  buildHttpParamsObject(object: any): HttpParams {
    if (object !== null) {
      Object.keys(object).forEach((e: any) => {
        if (object[e] === null || object[e] === undefined) {
          delete object[e];
        }
      });

      const httpParams: HttpParamsOptions = {
        fromObject:
          object

      } as HttpParamsOptions;

      const options = new HttpParams(httpParams);
      return options;
    } else {
      return new HttpParams();
    }
  }

  buildHttpParamsObjectWithNull(object: any): HttpParams {
    if (object !== null) {
      const httpParams: HttpParamsOptions = {
        fromObject:
          object

      } as HttpParamsOptions;

      const options = new HttpParams(httpParams);
      return options;
    } else {
      return new HttpParams();
    }
  }

  getSitesByCustomerC3Id(C3Id: string | null) {
    return this._http.get(`${this.apiUrl}/Sites/customer/${C3Id}`);
  }

  getSiteDepartments(ownerSiteId: any) {
    return this._http.get(`${this.apiUrl}/Sites/${ownerSiteId}/Departments`);
  }

  getAzurePlanOffers(C3Id: string | null) {
    return this._http.get(`${this.apiUrl}/shop/azureplanproducts/customer/${C3Id}`);
  }

  getLastTenantInfo(C3Id: string | null) {
    return this._http.get(`${this.apiUrl}/customers/${C3Id}/lasttenatdetails`);
  }

  getStateProvinceByCountryCode(country: any) {
    return this._http.get(`${this.apiUrl}/common/StateProvinceByCountryCode/${country}`);
  }

  getAddressValidationRules(countryCode: any, providerName: any) {
    return this._http.get(`${this.apiUrl}/addressValidationRules/Providers/${providerName}/Countries/${countryCode}`);
  }

  canAddCustomer(email: string | null,) {
    return this._http.get(`${this.apiUrl}/user/${email}/CanAddCustomer/${this.entityName}/${this.recordId}`);
  }

  microsoftCustomerAgreementUrl() {
    return this._http.get(`${this.apiUrl}/common/microsoftcustomeragreementurl`)
  }

  validateDomain(providerName: string | null, domain: string | null) {
    return this._http.get(`${this.apiUrl}/providers/${providerName}/ValidateDomain/${domain}`);
  }

  private _createUser(idToken: any) {
    var user = null;
    var parsedJson = this._extractIdToken(idToken);
    if (parsedJson && parsedJson.hasOwnProperty('aud')) {

      //if (parsedJson.aud.toLowerCase() === this._authService.clientId.toLowerCase()) {

      user = {
        userName: '',
        profile: parsedJson
      };

      if (parsedJson.hasOwnProperty('upn')) {
        user.userName = parsedJson.upn;
      } else if (parsedJson.hasOwnProperty('email')) {
        user.userName = parsedJson.email;
      }
      //} else {
      //this._logstatus('IdToken has invalid aud field');
      // }

    }

    return user;
  }

  getBillingPeriodTypes() {
    if (this.cachedBillingPeriodTypes) {
      return this.cachedBillingPeriodTypes;
    }
    return this._http.get<ResponseData<BillingPeriodType[]>>(`${this.apiUrl}/common/BillingPeriodTypes`)
      .pipe(
        map((v: ResponseData<BillingPeriodType[]>) => v.Data),
        tap(v => this.cachedBillingPeriodTypes = of(v))
      );
  }

  getSaleTypes() {
    if (this.cachedSaleTypes) {
      return this.cachedSaleTypes;
    }
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/common/SaleTypes`)
      .pipe(
        map((v: ResponseData<any[]>) => v.Data),
        tap(v => this.cachedSaleTypes = of(v))
      );
  }

  private _extractIdToken(encodedIdToken: any) {
    // id token will be decoded to get the username
    var decodedToken = this._decodeJwt(encodedIdToken);
    if (!decodedToken) {
      return null;
    }

    try {
      var base64IdToken = decodedToken.JWSPayload;
      var base64Decoded = this._base64DecodeStringUrlSafe(base64IdToken);
      if (!base64Decoded) {
        //this._logstatus('The returned id_token could not be base64 url safe decoded.');
        return null;
      }

      // ECMA script has JSON built-in support
      return JSON.parse(base64Decoded);
    } catch (err) {
      //this._logstatus('The returned id_token could not be decoded: ' + err.stack);
    }

    return null;
  }

  private _base64DecodeStringUrlSafe(base64IdToken: string) {
    // html5 should support atob function for decoding
    base64IdToken = base64IdToken.replace(/-/g, '+').replace(/_/g, '/');
    if (window.atob) {
      return decodeURIComponent(escape(window.atob(base64IdToken))); // jshint ignore:line
    }

    // TODO add support for this
    //this._logstatus('Browser is not supported');
    return null;
  }

  private _decodeJwt(jwtToken: any) {
    var idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;

    var matches = idTokenPartsRegex.exec(jwtToken);
    if (!matches || matches.length < 4) {
      console.error('The returned id_token is not parseable.');
      return null;
    }

    var crackedToken = {
      header: matches[1],
      JWSPayload: matches[2],
      JWSSig: matches[3]
    };

    return crackedToken;
  }

  getCustomers() {
    return this._http.get(`${this.apiUrl}/customers/activeCustomers`)
  }

  getCatagoriesWithoutScreen() {
    return this._http.get<ResponseData<Categories[]>>(`${this.apiUrl}/categories`)
      .pipe(map(v => v.Data));
  }

  getCartCount() {
    return this._http.get(`${this.apiUrl}/carts/-1/size`);
  }

  //  apiService.get('api/PartnerConsent/TestMicrosoftPricingAPIAccess/', null).then(function successCallback(response) {
  testMicrosoftPricingAPIAccess() {
    return this._http.get(`${this.apiUrl}/PartnerConsent/TestMicrosoftPricingAPIAccess`);
  }

  //apiService.get('api/PartnerConsent/PartnerProfile/', null)
  partnerProfile() {
    return this._http.get(`${this.apiUrl}/PartnerConsent/PartnerProfile`);
  }

  //apiService.get('api/PartnerConsent/TestCustomerAzureManagementAccess/'+ cspCustomerId,null)
  testCustomerAzureManagementAccess(cspCustomerId: string | null) {
    return this._http.get(`${this.apiUrl}/PartnerConsent/TestCustomerAzureManagementAccess/${cspCustomerId}`)
  }


  getServiceProviderCustomerByC3Id(C3Id: any) {
    return this._http.get(`${this.apiUrl}/customers/ServiceProviderCustomer/${C3Id}`);

  }

  getCustomerById() {
    return this._http.get(`${this.apiUrl}/customers/ById/${this.entityName}/${this.recordId}`);
  }

  getCurrencySymbolByCurrencyCode(Currency: any) {
    return this._http.get(`${this.apiUrl}/common/GetCurrencySymbolByCode/${Currency}`)
  }


  getPlanProductsForNCEUpgrade(sourceInternalProductid: string, planProductId: any) {
    return this._http.get(`${this.apiUrl}/common/getPlanProductsForNCEUpgrade/${sourceInternalProductid}/${planProductId}`);
  }
  getBillingPeriods() {
    return this._http.get(`${this.apiUrl}/common/billingperiods`);
  }

  getCurrencySymbolByCode(currencyCode: any) {
    return this._http.get(`${this.apiUrl}/common/GetCurrencySymbolByCode/${currencyCode}`);
  }

  getSupportedMarkets() {
    return this._http.get(`${this.apiUrl}/common/SupportedMarkets`);
  }

  getPhoneTypes() {
    return this._http.get(`${this.apiUrl}/common/phoneTypes`)
  }

  getEmailTypes() {
    return this._http.get(`${this.apiUrl}/common/emailTypes`)
  }
  getLicenseTrackingStatus() {
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/common/licensetrackingstatus`);
  }

  // apiService.post("/api/Comments/", savePayload).then(function (response) {
  saveComments(payload: any) {
    return this._http.post(`${this.apiUrl}/Comments`, payload);
  }

  // apiService.get('/api/Comments/', reqBody, null, true)
  getComments(reqBody: any) {
    const params = this.buildHttpParamsObject(reqBody);
    return this._http.get(`${this.apiUrl}/Comments`, { params: params });
  }

  getCustomNotificationResponsePopup(obj: any) {
    const params = this.buildHttpParamsObject(obj);
    return this._http.post(`${this.apiUrl}/customnotification/CustomNotificationDisplayDetails`, obj)
  }

  getMCBBillingConfig(internalPlanId: any, BillingProviderName: any) {
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/common/plan/${internalPlanId}/billingProvider/${BillingProviderName}/billingProviderConfig`);
  }

  getCountriesPromise() {
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/common/countries`);
  }

  getBillingPeriodWithCurrentMonth(isNextMonthRequired: any = null, categoeries: any = null, isNextMonthRequiredDueToCustomBilling: any = null) {
    return this._http.get(`${this.apiUrl}/common/billingperiods/${isNextMonthRequired}/${categoeries}/${isNextMonthRequiredDueToCustomBilling}`);
  }

  public setValueInLocalStorage(key: string, value: string): Promise<void> {
    return new Promise((resolve) => {
      localStorage.setItem(key, value);
      resolve(); // Ensure storage operation is completed
    });
  }

  getSubCategories(categories: any,screenName:any) {
    return this._http.get<ResponseData<any[]>>(`${this.apiUrl}/common/SubCategory/${categories}/${screenName}`)
         .pipe(
        map(v => v.Data),
      );
  }

   saveSubCategories(params:any) {
    return this._http.post(`${this.apiUrl}/categories/SaveSubCategories`,params);
  }

    deleteSubCategories(subCategoryId: number) {
    return this._http.delete(`${this.apiUrl}/categories/${subCategoryId}`);
  }

    getSubCategoryList(searchParams:any) {
    // const option = this.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/categories/SubCategories`,{ params: searchParams })
  }

  getScheduledIndex(scheduledActions: { actionType?: string }[] | undefined | null ): number {
    if (!scheduledActions || scheduledActions.length === 0) {
      return RenewalPoliciesType.Unknown;
    }

    const actionType = scheduledActions[0]?.actionType;

    if (!actionType) {
      return RenewalPoliciesType.Unknown;
    }

    const enumValue = RenewalPoliciesType[actionType as keyof typeof RenewalPoliciesType];

    return typeof enumValue === 'number'
      ? enumValue
      : RenewalPoliciesType.Unknown;
  }
}


