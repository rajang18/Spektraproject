import { HttpClient, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { customerDetails } from '../../../../shared/models/customers.model';
import { Environment } from 'prismjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
  providedIn: 'root',
})
export class PartnerOffersListingService {
  entityName: string | null = '';
  recordId: string | null = '';

  apiUrl = environment.apiBaseUrl;
  constructor(private _http: HttpClient, private _commonService: CommonService) { }
  
  ngOnInit(){
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
  }


  getList(searchParams: any) {

    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/partnerproducts/`, { params: option }
    );
  }

  upDateName(data: customerDetails, c3Id: string) {
    return this._http.post(
      `${this.apiUrl}/customers/${c3Id}/UpdateName`,
      {
        customerId: data.ID,
        customerName: data.Name,
      },
      {}
    );
  }

  getCustomOfferDetails(offer: any) {
    return this._http.get(`${this.apiUrl}/partnerproducts/${offer}`)
      .pipe(map((v: any) => {

        return v.Data
      }))
  }

  getContractOfferDetails(offer: any) {
    return this._http.get(`${this.apiUrl}/partnerproducts/ContractOffer/${offer}`)
      .pipe(map((v: any) => {

        return v.Data
      }))
  }
  getBillingActionsForPurchase() {
    return this._http.get('assets/data/onpurchase.json');
  }

  getBillingActionsForRelease() {
    return this._http.get('assets/data/onrelease.json');
  }

  getValidityTypes() {
    return this._http.get('assets/data/validitytypes.json');
  }

  saveContractOffer(reqBody: any) {
    return this._http.post(`${this.apiUrl}/partnerproducts/ContractOffer`, reqBody);
  }

  saveCustomOffer(reqBody: any) {
    return this._http.post(`${this.apiUrl}/partnerproducts`, reqBody);
  }

  getMeteredBillingSlabs(productVarientId: any, requestBody: any) {
    return this._http.get(`${this.apiUrl}/products/MeteredBilling/${productVarientId}/Product/PricingSlabs`, requestBody
    )
      .pipe(map((v: any) => {
        return v.Data
      }))

  }

  getBillingSlabs(productVarientId: any) {
    return this._http.get(`${this.apiUrl}/partnerproducts/ContractOffer/${productVarientId}/PricingSlabs`)
      .pipe(map((v: any) => {
        return v.Data
      }))

  }

  getSlabProducts(productVarientId: any) {
    return this._http.get(`${this.apiUrl}/partnerproducts/ContractOffer/${productVarientId}/SlabProducts`)
      .pipe(map((v: any) => {
        return v.Data
      }))

  }

  
  upload(file: File): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', `${this.apiUrl}/partnerproducts/withfile`, formData, {
      responseType: 'json',
    });

    return this._http.request(req);
  }

  saveCustomOfferWithFile(reqBody: any) {
    return this._http.post(`${this.apiUrl}/partnerproducts/withfile`, reqBody);
  }

  deleteCustomOffer(ProductId: any) {
    return this._http.delete(`${this.apiUrl}/partnerproducts/${ProductId}`);
  }

  getTrialPeriodDays() {
    return this._http.get(`${this.apiUrl}/partnerproducts/TrialPeriodDays/${this._commonService.entityName}/${this._commonService.recordId}`).pipe(map((v: any) => {
      return v.Data;
    }));
  }

  getHistoryRecordsForBulkUploadOfPartnerOffers(searchParams:any) {
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/partnerproducts/bulkupload/history`, { params: option });
    }

  getPartnerOfferBulkUploadStatus(searchParams:any){
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get(`${this.apiUrl}/partnerproducts/bulkUpload/status`, {params : option})
  }

  bulkUploadPartnerOffers(batchId:string){
    return this._http.post(`${this.apiUrl}/partnerproducts/bulkUpload/${batchId}/upload`, null);
  }
}
