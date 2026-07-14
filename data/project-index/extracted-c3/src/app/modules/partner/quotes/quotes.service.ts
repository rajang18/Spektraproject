import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';
import { Observable, map, of } from 'rxjs';
import html2pdf from 'html2pdf.js';

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  
  dictOfQuoteLineItems:{[key:string]:string} = {}
  apiUrl = environment.apiBaseUrl;
  quotesUrl = this.apiUrl + '/quotes';
  constructor(
    private _http: HttpClient,
    private _commonService: CommonService,
  ) { }


  getquotesList(searchParams: any) {
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.quotesUrl}/quotelist`, { params: option });
  }
  exportQuotePDF(quoteId: string){
    return this._http.get(`${this.quotesUrl}/view/${quoteId}`,)
      .pipe(map((response: any) => {
        return response;
      }));
  }

  getStatus(): Observable<any>{
    return this._http.get(`${this.quotesUrl}/quotestatus/${this._commonService.entityName}/${this._commonService.recordId}`);
  }

  getQuoteOwner(): Observable<any>{
    return this._http.get(`${this.quotesUrl}/quoteowner/${this._commonService.entityName}/${this._commonService.recordId}`);
  }

  getQuoteCustomers(): Observable<any> {
    return this._http.get(`${this.quotesUrl}/quotecustomer/${this._commonService.entityName}/${this._commonService.recordId}`);
  }

  getQuoteUserDetails(userId: string): Observable<any> {
    return this._http.get(`${this.quotesUrl}/${userId}/quoteuserdetails`);
  }

  getQuoteByVersionId(quoteVersionId: string): Observable<any> {
    return this._http.get(`${this.quotesUrl}/${quoteVersionId}`);
  }
  
  saveQuote(reqBody: any){
    return this._http.post(`${this.quotesUrl}/save`, reqBody);
  }
  
  getPartnerLogos(): Observable<any> {
    const entityName = this._commonService.entityName;
    const recordId = this._commonService.recordId;
    return this._http.get(`${this.apiUrl}/PartnerSettings/${this._commonService.entityName}/${this._commonService.recordId}/Settings/PartnerLogos`);
  }

  deleteQuote(reqBody): Observable<any>{
    return this._http.delete(`${this.quotesUrl}/deletequote`,{params: reqBody});
  }

  getCustomerAdminUsers(customerC3Id: any) {
    return this._http.get(`${this.apiUrl}/customers/${customerC3Id}/GetCustomerAdminUsers`);
  }

  getAddress(entityName:any,recordId:any ) {
    return this._http.get(`${this.apiUrl}/profile/${entityName}/${recordId}/address`);
  }

  getCustomerForQuotes(){
    return this._http.get(`${this.quotesUrl}/quotecustomer/${this._commonService.entityName}/${this._commonService.recordId}`);
  }

  getQuoteDetails(QuoteVersionId: any) {
      return this._http.get(`${this.quotesUrl}/${QuoteVersionId}`);
    }

    exportPDF(elementId: string, customerName: string, quoteName: string): void {
      const element = document.getElementById(elementId);
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        timeZone: 'UTC' 
      };
      const dateString = date.toLocaleDateString('en-US', options);
      const filename = `${customerName}-${quoteName}-${dateString}.pdf`;
      const opt = {
        margin: 0.3,
        filename: filename,
        image: { type: 'jpeg', quality: 2 },
        html2canvas: { scale: 2, useCORS: true, y: 0, scrollY: 0 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'p' }
      };
  
      html2pdf().set(opt).from(element).save();
    }

    getPlanProductsForquotes(reqBody: any) {
      return this._http.post(`${this.quotesUrl}/productsforquotelineitems`,reqBody);
    }
    
    getEmailData(quoteId: string): Observable<any> {
      return this._http.get(`${this.quotesUrl}/${this._commonService.entityName}/${this._commonService.recordId}/${quoteId}/emaildata`);
    }

    approveQuote(reqBody: any){
      return this._http.post(`${this.quotesUrl}/approve`, reqBody);
    }

    getPartnerAddress(entityName:any,recordId:any ) {
      return this._http.get(`${this.apiUrl}/profile/${entityName}/${recordId}/PartnerAddress`);
    }

  cloneQuote(payload: any) {
    return this._http.post(`${this.quotesUrl}/clonequote`, payload
    );
  }

    getBranchForQuote(customerC3Id:any ){
     return this._http.get(`${this.quotesUrl}/branch/${customerC3Id}`);
    }

    getAllQuote(entityName:any,recordId:any ) {
      return this._http.get(`${this.quotesUrl}/${entityName}/${recordId}/getAllQuote`);
    }

     getEntityUsers(reqBody: any) {
    return this._http.post(`${this.quotesUrl}/GetEntityUsers`, reqBody);
}
  
}