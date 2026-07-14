import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { environment } from 'src/environments/environment';
import { param } from 'jquery';

@Injectable({
  providedIn: 'root',
})
export class CustomerConsentService {
  apiUrl = environment.apiBaseUrl;
  constructor(
    private _http: HttpClient,
    private commonService: CommonService
  ) {}

  createAttestation(reqBody: any) {
    return this._http.post(`${this.apiUrl}/customerconsent/CreateAttestation`, reqBody);
  }

    getAttestationStatus(attestationId:any,providerName:any){
    return this._http.get(`${this.apiUrl}/customerconsent/GetAttestationStatus/${attestationId}/${providerName}`)
  }

   getattestationbyprovidercustomerId(providerCustomerId:any){
    return this._http.get(`${this.apiUrl}/customerconsent/getattestationbyprovidercustomerId/${providerCustomerId}`)
  }

  refreshAttestationStatus(attestationId:any,providerName:any){
    return this._http.get(`${this.apiUrl}/customerconsent/refreshAttestationStatus/${attestationId}/${providerName}`)
  }

  agreementCreation(tenantId: any, customerc3Id: any){
    return this._http.get(`${this.apiUrl}/customerconsent/getDetailsForProviderAgreementCreation/${customerc3Id}/${tenantId}`)
  }

  saveAgreementCreationDetails(reqBody: any){
    return this._http.post(`${this.apiUrl}/customerconsent/saveAgreementCreationDetails`, reqBody)
  }

  sendAttestationDetailsEmailToCustomer(req:any){
    return this._http.get(`${this.apiUrl}/customerconsent/SendMailToCustomer`,{
      params:req
    });
  }

}
