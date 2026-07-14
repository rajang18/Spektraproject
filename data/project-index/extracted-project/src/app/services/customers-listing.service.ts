import { HttpClient, HttpEventType, HttpHeaders, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { CountriesResponseData, PlanApiResponse, StateApiResponse, SupportedCurrenciesData, customerDetails } from '../shared/models/customers.model';
import { Environment } from 'prismjs';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class CustomersListingService {
  apiUrl = environment.apiBaseUrl;
  private cachedCustomersCountryCode: Observable<any> | null = null;
  private cachedPlansWithNameAndId: Observable<any> | null = null;
  public fetchBulkOnboardStatus$ = new BehaviorSubject(false);
  constructor(
    private _http: HttpClient,
    private _commonService: CommonService
  ) { }

  setBulkOnboardStatus(event:boolean){
    this.fetchBulkOnboardStatus$.next(event);
  }

  getList(searchParams: any) {
    let rawParams = searchParams;
    searchParams = {};
    for (let key in rawParams) {
      if (
        rawParams[key] !== undefined &&
        rawParams[key] !== null &&
        rawParams[key] !== "" &&
        !(Array.isArray(rawParams[key]) && rawParams[key].length === 0)
      ) { 
        searchParams[key] = rawParams[key];
      }
    }
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/customers/`, { params: option });
  }

  upDateName(data: customerDetails, c3Id: string) {
    return this._http.post(`${this.apiUrl}/customers/${c3Id}/UpdateName`, {
      customerId: data.ID,
      customerName: data.Name
    }, {
      params: {
        v: '1714029750585',
      }
    });

  }

  getCustomerAdminUser(c3Id: string) {
    return this._http.get(`${this.apiUrl}/customers/${c3Id}/GetCustomerAdminUsers`)
  }

  getResellerImpersonation(c3Id: string) {
    return this._http.get(`${this.apiUrl}/resellers/${c3Id}/usersForImpersonation`)
  }

  getPlansForCustomers(): Observable<PlanApiResponse> {
    return this._http.get<PlanApiResponse>(`${this.apiUrl}/plans/`, {
      params: {
        v: '1717500026666',
        PageSize: 5000,
        SortColumn: '',
        SortOrder: '',
        StartInd: 1,
      }
    }
    )

  }
  getSupportedCurrencies(entityName: string | null): Observable<SupportedCurrenciesData> {
    return this._http.get<SupportedCurrenciesData>(`${this.apiUrl}/common/${entityName}/null/SupportedCurrencies`)
  }

  getCountires(): Observable<CountriesResponseData> {
    return this._http.get<CountriesResponseData>(`${this.apiUrl}/common/countries/`)

  }
  getStateByCountryCode(countryCode: string): Observable<StateApiResponse> {
    return this._http.get<StateApiResponse>(`${this.apiUrl}/common/StateProvinceByCountryCode/${countryCode}/`);
  }
  onBoardNewCustomer(data: any) {
    return this._http.post(`${this.apiUrl}/onboardCustomer/OnboardNewCustomer/`, data)

  }

  getAccountManagerDetailsOfCustomer(row: any) {
    return this._http.get(`${this.apiUrl}/accountManagers/Customer/${row.C3Id}/GetAccountManagerDetailsOfEntity`);
  }

  getPlanListForFilter() {
    if (this.cachedPlansWithNameAndId) {
      return this.cachedPlansWithNameAndId
    }
    return this._http.get(`${this.apiUrl}/plans/withId`)
      .pipe( 
        tap(v => this.cachedPlansWithNameAndId = of(v))
      ); 
  }

  getCustomersCountryCode() {
    if (this.cachedCustomersCountryCode) {
      return this.cachedCustomersCountryCode
    }
    return this._http.get(`${this.apiUrl}/customers/GetDistinctCountryCodeFromCustomers`)
      .pipe( 
        tap(v => this.cachedCustomersCountryCode = of(v))
      ); 
  }

  getCustomersUniqueIdentifiers() {
    return this._http.get(`${this.apiUrl}/common/UniqueIdentifiersForCustomer/${this._commonService.entityName}/${this._commonService.recordId}`)
  }

  reloadReconReport(body: any) {
    return this._http.post(`${this.apiUrl}/customers/ReloadReconReportAllCustomerWebJob`, body);
  }

  loadReconWebJobStatus(body: any) {
    return this._http.post(`${this.apiUrl}/customers/LoadReconWebJobStatus`, body);
  }
  reloadCustomerReconReport(C3Id: string): Observable<any> {
    return this._http.get(`${this.apiUrl}/customers/${C3Id}/ReloadReconReport`);
  }

  reloadCustomerReconReportWebJob(C3Id: string, inputModel: any): Observable<any> {
    return this._http.post(`${this.apiUrl}/customers/${C3Id}/ReloadReconReportWebJob`, inputModel);
  }

  getLoadReconWebJobStatus(jobStatusForLoadReconReportModel: any): Observable<any> {
    return this._http.post(`${this.apiUrl}/customers/LoadReconWebJobStatus`, jobStatusForLoadReconReportModel);
  }

  getActiveLoadReconWebJob(): Observable<any> {
    return this._http.get(`${this.apiUrl}/customers/ActiveLoadReconWebJob`);
  }

  getServiceProviderCustomerByC3Id(customerC3Id: string | null) {
    return this._http.get(`${this.apiUrl}/customers/ServiceProviderCustomer/${customerC3Id}`);
  }

  updateDefaultProviderTenant(row: any) {
    return this._http.put(`${this.apiUrl}/customers/${row.CustomerC3Id}/Providers/${row.ProviderName}/Tenants/${row.CustomerRefId}/Default`, row);
  }

  bulkAddTenant(payload: any) {
    return this._http.post(`${this.apiUrl}/bulkaddtenants/staged/list`, payload);
  }

  bulkaddtenants(payload: any) {
    return this._http.post(`${this.apiUrl}/bulkaddtenants`, payload);
  }

  completeBulkTenantAdd(currentBatchId: any) {
    return this._http.post(`${this.apiUrl}/bulkaddtenants/status/Completed/batch/${currentBatchId}`, null);
  }

  Resumeserviceprovidercall(currentBatchId: any) {
  return this._http.post(`${this.apiUrl}/bulkaddtenants/Resume/batch/${currentBatchId}`, null);
}

  lookUpCustomerDetailsInBillingWithBillingCustomerId(billingProviderReferenceID: string): Observable<StateApiResponse> {
    return this._http.get<StateApiResponse>(`${this.apiUrl}/billing/customers/${billingProviderReferenceID}`,{headers: {'X-Skip-Error-Msg': 'true'}})
  }

  customerBillingProfileLookUpStatus(customerC3Id: any, billingProviderReferenceID: any): Observable<StateApiResponse> {
    return this._http.get<StateApiResponse>(`${this.apiUrl}/billing/customers/${customerC3Id}/billingcustomer/${billingProviderReferenceID}/billingcustomerdetail`,{headers: {'X-Skip-Error-Msg': 'true'}})
  }

  proceedToOnboard(activeBillingProvider: string, body: any) {
    return this._http.post(`${this.apiUrl}/billing/OnboardBillingCustomer/${activeBillingProvider}`, body);
  }

  deLinkCustomerBillingProfile(customerC3Id: string) {
    return this._http.put(`${this.apiUrl}/customers/${customerC3Id}/delinkBillingCustomer`, null);
  }

  loadingCustomersData() {
    return this._http.get(`${this.apiUrl}/customers/activeCustomers`);
  }

  loadData(customerC3Id: any) {
    return this._http.post(`${this.apiUrl}/customers/${customerC3Id}/SyncProviderCustomerProfile`, null);
  }

  reloadCustomerConsentData(customerC3Id: any) {
    return this._http.post(`${this.apiUrl}/customers/${customerC3Id}/SyncProviderCusomerConsent`, null);
  }

  getProviderCustomer(providerCustomerId: string, providerName: string) {
    return this._http.get(`${this.apiUrl}/customers/${this._commonService.entityName}/${this._commonService.recordId}/ProviderCustomer/${providerCustomerId}/Provider/${providerName}`);
  }

  getMatchingSubscriptionForOnboarding(providerName: string, providerCustomerId: string, planId: string, customerCurrencyCode: string, customerC3Id: string | null) {
    return this._http.get(`${this.apiUrl}/onboardCustomer/MatchSubscriptions/${this._commonService.entityName}/${this._commonService.recordId}/Provider/${providerName}/${providerCustomerId}/Plan/${planId}/${customerCurrencyCode}/${customerC3Id}`);
  }

  validateCustomerSubscriptionMappings(postData: any) {
    return this._http.post(`${this.apiUrl}/onboardCustomer/ValidateCustomerSubscriptionMappings`, postData);
  }

  checkIfResellerHasLinkWithProvider() {
    return this._http.get(`${this.apiUrl}/onboardCustomer/${this._commonService.entityName}/${this._commonService.recordId}/CheckIfResellerHasLinkWithProvider/Microsoft`);
  }

  getNonOnboardedCustomersFromProvider() {
    return this._http.get(`${this.apiUrl}/onboardCustomer/${this._commonService.entityName}/${this._commonService.recordId}/Provider/Microsoft/GetNonOnboardedCustomersFromProvider`);
  }

  onboardExistingCustomer(postData: any) {
    return this._http.post(`${this.apiUrl}/onboardCustomer/OnboardExistingCustomer`, postData);
  }

  deleteCustomer(customerC3Id: string) {
    return this._http.put(`${this.apiUrl}/customers/${customerC3Id}/delete`, null);
  }
  getCustomerDetailsByC3Id(customerC3Id: string | null) {
    return this._http.get(`${this.apiUrl}/customers/${customerC3Id}`);
  }

  createNewCustomerInProvider(postData: any) {
    return this._http.post(`${this.apiUrl}/onboardCustomer/CreateNewCustomerInProvider`, postData);
  }

  checkLogicalResellerCanCreateProviderCustomer() {
    return this._http.get(`${this.apiUrl}/onboardCustomer/CheckLogicalResellerCanCreateProviderCustomer/${this._commonService.entityName}/${this._commonService.recordId}`);
  }

  pendingBulkOnBoardCustomerRecords() {
    return this._http.post(`${this.apiUrl}/bulkOnboardCustomers/${this._commonService.entityName}/${this._commonService.recordId}/PendingBulkOnBoardCustomerRecords`, null);
  }

  updateBulkOnboardCustomersStatusToComplete(postData: any) {
    return this._http.post(`${this.apiUrl}/bulkOnboardCustomers/UpdateBulkOnboardCustomersStatusToComplete`, postData);
  }

  downloadSubscriptionMappingDetails(postData: any) {
    return this._http.post(`${this.apiUrl}/bulkOnboardCustomers/DownloadSubscriptionMappingDetails`, postData);
  }

  getNonOnboardedCustomers() {
    return this._http.get(`${this.apiUrl}/onboardCustomer/${this._commonService.entityName}/${this._commonService.recordId}/Provider/Microsoft/l`);
  }

  saveBulkOnboardMicrosoftCustomer(postData: any) {
    return this._http.post(`${this.apiUrl}/bulkOnboardCustomers`, postData);
  }

  checkTenantAvailability(customerC3Id: string, providerId: any, customerProviderRefId: string) {
    return this._http.post(`${this.apiUrl}/onboardCustomer/CheckTenantAvailability/${customerC3Id}/${providerId}/${customerProviderRefId}`, null);
  }

    getProviderCustomerForAttestation(providerCustomerId: string, providerName: string) {
    return this._http.get(`${this.apiUrl}/customers/${this._commonService.entityName}/${this._commonService.recordId}/ProviderCustomerForAttestation/${providerCustomerId}/Provider/${providerName}`);
  }
}
