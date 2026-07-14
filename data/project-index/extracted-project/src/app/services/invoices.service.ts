import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class InvoicesService {

  apiUrl = environment.apiBaseUrl;
  public dataState: any;
  constructor(private _http: HttpClient, private _commonService: CommonService) { }

  getInvoices(reqBody) {
    const body = this._commonService.buildHttpParamsObject(reqBody);
    return this._http.get(`${this.apiUrl}/invoices`, { params: body });
  }

  getInvoicesPayments(searchParams) {
    const params = this._commonService.buildHttpParamsObject(searchParams);
    return this._http.get(`${this.apiUrl}/invoices/payments`, { params: params });
  }

  getInvoicesOperationalEntities(entityName: any, recordC3Id: any) {
    return this._http.get(`${this.apiUrl}/invoices/operationalEntities/${entityName}/${recordC3Id}`);
  }

  getInvoicesAddressDetails(entityName: string | null, recordId: string | null) {
    return this._http.get(`${this.apiUrl}/invoices/addressDetails/${entityName}/${recordId}`)
  }

  getOnDemandInvoice(invoiceId: any) {
    return this._http.get(`${this.apiUrl}/invoices/onDemandInvoice/details/${invoiceId}`)
  }

  createInvoice(payload: any) {
    return this._http.post(`${this.apiUrl}/invoices/createInvoice`, payload);
  }


  getInvoiceById(invoiceId) {
    return this._http.get(`${this.apiUrl}/invoices/${invoiceId}`);
  }


  getPaymentsByInvoiceId(invoiceId) {
    return this._http.get(`${this.apiUrl}/invoices/${invoiceId}/payments`);

  }


  getRemainingPayments(reqBody) {
    const params = this._commonService.buildHttpParamsObject(reqBody);
    return this._http.get(`${this.apiUrl}/invoices/remainingPayments`, { params: params })

  }


  getUnpaidDuesByInvoiceId(entityName: any, recordId: any, invoiceId: any) {
    return this._http.get(`${this.apiUrl}/invoices/getUnpaidDuesByInvoiceId/${entityName}/${recordId}/${invoiceId}`)
  }

  deleteAdjustmentById(lineItemId: any) {
    return this._http.delete(`${this.apiUrl}/invoices/DeleteAdjustmentById/${lineItemId}`)
  }

  initiateInvoicePayment(payload: any) {
    return this._http.post(`${this.apiUrl}/invoices/initiateInvoicePayment`, payload);
  }

  saveManualPayment(postData: any) {
    return this._http.post(`${this.apiUrl}/invoices/savemanualpayment`, postData);

  }

  updateInvoiceStatus(invoiceId: any, status: any) {
    return this._http.put(`${this.apiUrl}/invoices/${invoiceId}/status/${status}`, null);
  }

  getRecepientsForSendInvoice(entityName: any, recordId: any) {
    return this._http.get(`${this.apiUrl}/invoices/GetRecepientsForSendInvoice/${entityName}/${recordId}`);
  }

  updateProperties(invoiceId: any, payload: any) {
    return this._http.post(`${this.apiUrl}/invoices/${invoiceId}/updateProperties`, payload);
  }

  sendInvoieToEmails(payload: any) {
    return this._http.post(`${this.apiUrl}/invoices/SendInvoiceToEmails`, payload);
  }

  // apiService.get('api/invoices/GetAdjustmentDetails/' + this.addAdjustment.ID, null).then(function (response) {
    getAdjustmentDetails(id:any){
      return this._http.get(`${this.apiUrl}/invoices/GetAdjustmentDetails/${id}`);
    }

  //apiService.get('api/invoices/subscriptions/' + this.invoiceId, null).then(function (response) {
  getSubscriptions(invoiceId:any){
    return this._http.get(`${this.apiUrl}/invoices/subscriptions/${invoiceId}`);
  }

   //apiService.post('api/invoices/SaveAdjustment', this.addAdjustment).then(function (response) {
   saveAddjustment(payload){
    return this._http.post(`${this.apiUrl}/invoices/SaveAdjustment`,payload);
   }

    updateBillFromAddress(payload){
        return this._http.post(`${this.apiUrl}/invoices/${payload.EntityName}/${payload.RecordId}/UpdateBillFromAddress`,payload )
    }
  
}
