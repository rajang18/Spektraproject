import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscription, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppData, LocalStorageData, RootScope, UserInfo, UserProfile } from '../shared/models/appsettings.model';
import { ResponseData } from '../shared/models/common';
import { CommonService } from './common.service'; 
import { ClientSettingsService } from './client-settings.service'; 

@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {
  _subscription: Subscription;
  apiUrl = `${environment.apiBaseUrl}/ApplicationSettings/Get`;
  apiBaseUrl = environment.apiBaseUrl;
  private cachedSettings: Observable<any[]> | null = null; 
  private cachedActivePSA: Observable<any[]> | null = null;
  public rootScope:RootScope = new RootScope();

  public get $rootScope():RootScope
  {
    if(this.rootScope){
      return this.rootScope
    }else{
      this._subscription = this.cachedSettings.subscribe(res=>{
        this.rootScope.settings = res;
        this.rootScope.productsInCart = [];
        this.rootScope.selectedResellerSettings.CurrencySymbol = this.rootScope.settings.CurrencySymbol;
        this.rootScope.selectedResellerSettings.CurrencyDecimalPlaces = this.rootScope.settings.CurrencyDecimalPlaces;
        this.rootScope.selectedResellerSettings.CurrencyThousandSeperator = this.rootScope.settings.CurrencyThousandseparator;
        this.rootScope.selectedResellerSettings.CurrencyDecimalSeperator = this.rootScope.settings.CurrencyDecimalSeparator;
        this.rootScope.selectedResellerSettings.MinimumChargeAmount = this.rootScope.settings.MinimumChargeAmount;
        this.rootScope.IsCustomBilling = this.rootScope.settings.IsCustomBilling; 
      });
      this.rootScope.applicationName = '';
      this.rootScope.billingPeriods = [];
      this.rootScope.billingPeriodId = "";
      this.rootScope.dateFormat = "MMM dd, yyyy";
      this.rootScope.dateTimeFormat = "MMM dd, yyyy HH:mm:ss";
      this.rootScope.impersonatedResellerUserEmail = "";
      this.rootScope.impersonatedUserEmail = "";
      this.rootScope.fromSubscription = false;
      this.rootScope.isMandateProfile = false;
      ///// BEGIN: To be deleted
      this.rootScope.customerC3Id = null;
      this.rootScope.resellerC3Id = null;
      ///// END: To be deleted
      this.rootScope.isCartAvailable = false;
      this.rootScope.userContext = { entityName: null, recordId: null, userC3Id: null, roleName: null, resellerC3Id: null };

      // this.rootScope.month = [
      //     { Code: '01', Name: 'January' },
      //     { Code: '02', Name: 'February' },
      //     { Code: '03', Name: 'March' },
      //     { Code: '04', Name: 'April' },
      //     { Code: '05', Name: 'May' },
      //     { Code: '06', Name: 'June' },
      //     { Code: '07', Name: 'July' },
      //     { Code: '08', Name: 'August' },
      //     { Code: '09', Name: 'September' },
      //     { Code: '10', Name: 'October' },
      //     { Code: '11', Name: 'November' },
      //     { Code: '12', Name: 'December' }
      // ];
    }
  }


  constructor(
    private _http: HttpClient,
    private commonService:CommonService,  
    private _clientSettings:ClientSettingsService 
  ) {} 
  
  getApplicationData(isrefresh=false) {
    let appRootData:any[] = [];
    if (this.cachedSettings && !isrefresh) {
      
      return this.cachedSettings;
    } 
    return this._http.get(`${this.apiUrl}/`)
      .pipe( 
        tap((v:any) => {
          appRootData  = v.Data
          this.setRootScope(v.Data);
          this.cachedSettings = of(v)
        }),
        switchMap(res=>{
         return  this._clientSettings.getData()
        }),switchMap((response:any)=>{          
          this.$rootScope.IsCustomBilling = response.Data.IsCustomBilling;
          let loggedInLogo = response?.Data?.LoggedInLogoPath;
          if(loggedInLogo) localStorage.setItem('loggedInLogo',  loggedInLogo);
          this.$rootScope.settings = {...appRootData, ...response} 
          return this.commonService.getBillingPeriods()
        }),
        switchMap((response:any)=>{
          this.$rootScope.billingPeriods = response.Data;
          if (this.$rootScope.billingPeriods !== null && this.$rootScope.billingPeriods.length > 0) {
            this.$rootScope.billingPeriodId = "" + this.$rootScope.billingPeriods[this.$rootScope.billingPeriods.length - 1].BillingPeriodId;
          } 
          return this.cachedSettings
        })
      );  
  }

  private setRootScope(data:any){ 
    this.rootScope.settings = data;
    this.rootScope.applicationName = data.ApplicationName;
    this.rootScope.dateFormat = data.DateFormat;
    this.rootScope.dateTimeFormat = data.DateTimeFormat;  
    this.rootScope.NCETermsAndConditionURL = data.NCETermsAndConditionURL;
    this.$rootScope.DefaultPageCount = Number(data.DefaultPageCount);
    this.$rootScope.PortalSessionTimeOut = data.PortalSessionTimeOut? Number(data.PortalSessionTimeOut) : null;
    this.$rootScope.PortalSessionTimeOutWarning = data.PortalSessionTimeOutWarning ? Number(data.PortalSessionTimeOutWarning) : null;
    this.$rootScope.DefaultTermsAndCondtionsUrl = data.DefaultTermsAndConditionURL; 
    this.$rootScope.PartnerPreferenceLanguages = data.PartnerPreferenceLanguages; 
    this.rootScope.CountryCode = data.CountryCode;
  }

  getAvailableEnvironments() {   
    return this._http.get(`${environment.apiBaseUrl}/environments`,
      {headers: { 'X-Skip-Impersonation-Context': 'true' }});
  }

  getUserContext() {
    return this._http.get(`${environment.apiBaseUrl}/usercontext`,
      {headers: { 'X-Skip-Impersonation-Context': 'true' }});
  }

  getUserProfileContext() {
    return this._http.get<ResponseData<UserProfile>>(`${environment.apiBaseUrl}/usercontext/profile`)
      .pipe(
        
        map(v => {
          if(v.Status != 'Success' ){
            return of(null);
          } 
          return <UserProfile>v.Data
        }), // Map the response data to the UserProfile type
        catchError(error => {
          // Log the error to the console for debugging
          console.error('Error fetching user profile context:', error); 
          // You can return a fallback value, an empty object, or an Observable of your choice
          return of(null); // Return null or a default UserProfile in case of an error
        })
      );
  }

  getActiveBillingProvider() {
    return this._http.get(`${environment.apiBaseUrl}/common/ActiveBillingProvider`);
  }


  getLocalStoaregeSavedData(): Observable<LocalStorageData> {
    let userInfo: UserInfo = {} as UserInfo;
    let appData: AppData = {} as AppData;
    let isloaded = true;
    let errors = false;

    try {
      userInfo = JSON.parse(localStorage.getItem('userinfo') || '{}');
      appData = JSON.parse(localStorage.getItem('appdata') || '{}');
      isloaded = false;
    } catch (error) {
      isloaded = false;
      errors = true;
    }

    return of({
      isloaded,
      userInfo,
      appData,
      errors
    });
  }

  getGlobalTenantsSettings(entityName:string|null , currentState:string){
    return this._http.get(`${environment.apiBaseUrl}/tenantConfiguration/${this.commonService.entityName}/${this.commonService.recordId}/GlobalTenantConfigurations/${currentState}/`);

  }

  getPartnerSettings(entityName:string|null , currentState:string){
    return this._http.get(`${environment.apiBaseUrl}/PartnerSettings/${this.commonService.entityName}/${this.commonService.recordId}/Settings/${currentState}/`);

  }

  partnerSettings(currentState:string,reqBody: any){
    return this._http.post(`${environment.apiBaseUrl}/PartnerSettings/${currentState}/`,reqBody);

  }

  updateGlobalTenantConfigurations(reqBodyOfCustomerGlobalSettings: any){
    return this._http.post(`${environment.apiBaseUrl}/tenantConfiguration/UpdateGlobalTenantConfigurations/`,reqBodyOfCustomerGlobalSettings);

  }

  partnerSettingsSmtpTest(Name:string){
    return this._http.post(`${environment.apiBaseUrl}/PartnerSettings/smtptest/${Name}/`,null);

  }

  getFilterEmailConfiguration(entityName:string|null,recordId:string|null, currentState:string){
    return this._http.get(`${environment.apiBaseUrl}/PartnerSettings/${entityName}/${recordId}/Settings/${currentState}/`);

  }

  getActiveServiceDetail(){
    if (this.cachedActivePSA) {
      return this.cachedActivePSA
    }
    return this._http.get<ResponseData<any[]>>(`${environment.apiBaseUrl}/psa/activeservicedetails/`)
      .pipe(
        map(v => v.Data),
        tap(v => this.cachedActivePSA = of(v))
      ); 
  }

  testConnectivityToPSA( Name:string, entityName:string|null, recordId:string|null){
    return this._http.get(`${environment.apiBaseUrl}/psa/test/${Name}/connectivity/${entityName}/${recordId}`);

  }


  setDefaultEnvironment(id: string): Observable<any> {
    const url = `${environment.apiBaseUrl}/Environments/${id}/SetDefault`;
    return this._http.put(url, {}); 
  }

  updatePreferredLanguage(reqBody: any){
    return this._http.post(`${environment.apiBaseUrl}/usercontext/UpdatePreferredLanguage/`,reqBody);
  }

  resetCache(){
    this.cachedSettings = null;
  }
}

