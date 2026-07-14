import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpParamsOptions } from '@angular/common/http';
import { Observable} from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
  providedIn: 'root'
})
export class DownloadBulkInvoicesService {

  apiUrl = environment.apiBaseUrl
  constructor(
    private _http: HttpClient,
    private commonServices: CommonService
  ) { }

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

  GetPlans({ EntityName, RecordID, Customers, resellers }: any) {
    let SearchPlanCriteria = {
      EntityName: EntityName,
      RecordID: RecordID,
      Customers: Customers,
      resellers: resellers
    }
    return this._http.post(`${this.apiUrl}/reports/plans/`, SearchPlanCriteria)
  }

  getBillingPeriods(): Observable<any> {
    return this._http.get<any>(`${this.apiUrl}/common/billingperiods`);
  }

  getInvoiceForDownload(params: any) {
    const option = this.buildHttpParamsObject(params);
    return this._http.get(`${this.apiUrl}/reports/downloadbulkinvoiceforcustomers/`,{ params: option });
  }

  generatebulkinvoicesfordownload(reqBody: any) {
    return this._http.post(`${this.apiUrl}/reports/generatebulkinvoicesfordownload/`, reqBody)
  }

  getbulkinvoicesdownloadprogress(params: any) {
    const option = this.buildHttpParamsObject(params);
    return this._http.get(`${this.apiUrl}/reports/getbulkinvoicesdownloadprogress/`, { params: option });
  }

  getBilledCustomersAndResellers(params: any) {
    const option = this.buildHttpParamsObject(params);
    return this._http.get(`${this.apiUrl}/reports/BilledCustomersAndResellers/`, { params:option });
  }

  GetXeroUriForProvidingConsent() {
    return this._http.get(`${this.apiUrl}/xeroconsent/GetXeroUriForProvidingConsent/${this.commonServices.entityName}/${this.commonServices.recordId}`);
  }

  GetQuickBooksUriForProvidingConsent() {
    return this._http.get(`${this.apiUrl}/quickbooksconsent/GetQuickBooksUriForProvidingConsent/${this.commonServices.entityName}/${this.commonServices.recordId}`);
  }
  
  CheckValidityOfQuickBooksRefreshToken(){
    return this._http.get(`${this.apiUrl}/quickbooksconsent/CheckValidityOfExistingQuickBooksRefreshToken/${this.commonServices.entityName}/${this.commonServices.recordId}`);
  }

  CheckValidityOfXeroRefreshToken(){
    return this._http.get(`${this.apiUrl}/xeroconsent/CheckValidityOfExistingXeroRefreshToken/${this.commonServices.entityName}/${this.commonServices.recordId}`);
  }

  processDownload(uri: any, reqBody: any) {
    return this._http.post(uri, reqBody)
  }

  GetExternalServicePostBatches(billingPeriodId: any) {
    return this._http.get(`${this.apiUrl}/invoices/GetExternalServicePostBatches/${billingPeriodId}`);
  }
  
  GetLatestPostLogStatus(params: any) {
    const option = this.buildHttpParamsObject(params);
    return this._http.get(`${this.apiUrl}/invoices/GetExternalServicePostLogs/`, { params:option });
  }
  GetLatestPostBatchSummary(params: any) {
    const option = this.buildHttpParamsObject(params);
    return this._http.get(`${this.apiUrl}/invoices/GetSummaryForExternalServicePostBatch/`, { params:option  });
  }
  DeleteBulkInvoiceDetails(ID: any) {
    return this._http.put(`${this.apiUrl}/reports/deletebulkinvoices/${ID}`, null);
  }
  DownloadBulkInvoice(BulkInvoiceId: any) {
    return this._http.get(`${this.apiUrl}/reports/getbulkinvoicedownloadlink/${BulkInvoiceId}`);
  }
  getTableinvoiceDownloadStatus(downloadBulkInvoiceId: any) {
    return this._http.get(`${this.apiUrl}/reports/Bulkinvoicesdownloadstatus/${downloadBulkInvoiceId.downloadBulkInvoiceId}`);
  }
  GetCustomers() {
    return this._http.get(`${this.apiUrl}/customers/GetCustomersAndResellersByEntity/${this.commonServices.entityName}/${this.commonServices.recordId}`);
  }

  getApplicationSettings() {
    let applicationSettingsUri = `${environment.apiBaseUrl}/ApplicationSettings/Get`;
    return this._http.get(`${applicationSettingsUri}`);
  }

  uploadInvoicesToXeroApp(reqBody: any) {
    return this._http.post(`${this.apiUrl}/invoices/UploadInvoicesToXero`, reqBody)
  }

  uploadInvoicesToQuickBooksApp(reqBody: any) {
    return this._http.post(`${this.apiUrl}/invoices/UploadInvoicesToQuickBooks`, reqBody)
  }
  uploadInvoicesToBusinessCentralApp(reqBody: any) {
    return this._http.post(`${this.apiUrl}/invoices/UploadInvoicesToBusinessCentral`, reqBody);
  }
}
