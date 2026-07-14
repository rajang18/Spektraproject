import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';
import { map, Observable, of, tap } from 'rxjs';
import { Categories, ProviderCategoriesInFilter, ResponseData } from '../shared/models/common';

@Injectable({
  providedIn: 'root'
})
export class BuisnessService {
  apiUrl = environment.apiBaseUrl
  private cachedProviderCategoriesInFilter: Observable<ProviderCategoriesInFilter[]> | null = null;
  groupByResult: any;

  constructor(
    private _http: HttpClient,
    private _commonService: CommonService,

  ) { }

  saveOrUpdateFavouriteColumns(req:any){
    return this._http.post<any>(
      `${this.apiUrl}/reports/saveOrUpdateFavouriteColumns`,{...req}
    );
  }

  getBuisnessList(searchParams: any) {
    const option = this._commonService.buildHttpParamsObject(searchParams);
    return this._http.get(`${this.apiUrl}/billing/revenue`, { params: option });
  }
  getTransactionList(selectedBillingPeriodId: any) {
    return this._http.get(`${this.apiUrl}/transaction/${selectedBillingPeriodId}`, { params: {} });
  }
  getBuisnessListlineItemsForSummaryView(searchParams: any) {
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/billing/lineItemsForSummaryView`, { params: option });
  }

  getInvoices(Entity: string, C3Id: string, billingPeriodId: string, invoiceGenerateReason: string): Observable<any> {
    return this._http.post<any>(
      `${this.apiUrl}/invoices/${Entity}/${C3Id}/billingperiod/${billingPeriodId}/Generate/${invoiceGenerateReason}`,
      null
    );
  }

  GetDefaultView(resellerId:any){
    return this._http.get(`${this.apiUrl}/billing/RevenueAndCostSummaryDefaultView/${resellerId}`)
  }
    getInitiateInvoicePayment(searchParams: any) {
    return this._http.post(`${this.apiUrl}/invoices/initiateInvoicePayment`, searchParams, { params: {} });
  }

  getTransactions(searchParams: any) {
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/invoices/allpayments`, { params: option });
  }

  proceedToGetAdvancePaymentDetails(postData: any) {
    return this._http.post(`${this.apiUrl}/invoices/savemanualpayment`, postData);
  }

  getData(searchParams: any,reset:boolean = false) {
    if(reset){
      return of(null);
    }
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/invoices/PaymentsReportImportStatus`, { params: option });
  }

  importMultiplePayments(reqBody: any) {
    return this._http.post(`${this.apiUrl}/invoices/importMultiplePayments`, reqBody);
  }

  getDataForCatalogue(SearchCriteria: any) {
    const option = this._commonService.buildHttpParamsObject(SearchCriteria)
    return this._http.get(`${this.apiUrl}/customers/CustomerAndResellerDetailsByEntity`, { params: option });
  }

  GetBillingPeriods({isNextMonthRequired, categoeries, isNextMonthRequiredDueToCustomBilling}:any){
    return this._http.get(`${this.apiUrl}/common/billingperiods/${isNextMonthRequired}/${categoeries}/${isNextMonthRequiredDueToCustomBilling}`);
  }
  
  GetResellerProfitFromDistributer(searchParams:any){
    return this._http.post(`${this.apiUrl}/billing/reseller/revenue`, searchParams);
  }

  GetSubscriptionHistory(reqBody:any){
    return this._http.post(`${this.apiUrl}/SubscriptionHistory/list`, reqBody);
  }

  GetSubscriptionHistoryByDate(reqBody:any){
    return this._http.post(`${this.apiUrl}/SubscriptionHistory/bydate`, reqBody);
  }

  getCategoriesForSubscription() {
    return this._http.get<ResponseData<Categories[]>>(`${this.apiUrl}/categories`)
    .pipe(map(v => v.Data));
  }

  getProviderCategoriesInFilter() {
    if (this.cachedProviderCategoriesInFilter) {
        return this.cachedProviderCategoriesInFilter;
    }
    return this._http.get<ResponseData<ProviderCategoriesInFilter[]>>(`${environment.apiBaseUrl}/providers/serviceTypes`)
        .pipe(map(v => v.Data),
            tap(v => this.cachedProviderCategoriesInFilter = of(v))
        );
}
}
