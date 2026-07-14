import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
    providedIn: 'root'
})
export class PaymentProfileService {
    apiUrl = environment.apiBaseUrl
    entityName: string | null;
    recordId: string | null;


    constructor(
        private _http: HttpClient,
        private _commonService: CommonService,
    ) {
        this.entityName = this._commonService.entityName;
        this.recordId = this._commonService.recordId;
    }

    getCustomerBillingProfile() {
        return this._http.get(`${this.apiUrl}/billing/${this.entityName}/${this.recordId}/billingcustomerdetail`)
            .pipe(map((v: any) => {
                return v.Data
            }))
    }

    getCustomerBillingProvider() {
        return this._http.get(`${this.apiUrl}/common/ActiveBillingProvider/`)
    }

    getMCBBillingConfig() {
        return this._http.get(`${this.apiUrl}/billing/${this.entityName}/${this.recordId}/config`)
    }

    getSupportedPaymentTypes(billingProvider: any) {
        return this._http.get(`${this.apiUrl}/common/billingProviders/${billingProvider}/enabledPaymentMethods`)
    }

    onPaymentDetailsSubmitted(data: any) {
        return this._http.post(`${this.apiUrl}/profile/${this.entityName}/${this.recordId}/PaymentProfile`, data)
    }

    getPendingPaymentProfiles() {
        return this._http.get(`${this.apiUrl}/paymentProfiles/${this.entityName}/${this.recordId}/pendingPaymentProfiles/true`);
    }

    getPaymentProfiles() {
        return this._http.get(`${this.apiUrl}/profile/${this.entityName}/${this.recordId}/PaymentProfile`)
    }

    getLatesPaymentProfile(billingProviderReferenceID: any){
        return this._http.get(`${this.apiUrl}/billing/${billingProviderReferenceID}/GetLatestPaymentProfile`)

    }

    getIsMandateProfile() {
        return this._http.get(`${this.apiUrl}/profile/validateMandateProfile`)
    }

    saveProviderCustomerConsent(consentData: any) {
        return this._http.post(`${this.apiUrl}/termsAndConditions/saveProviderCustomerConsent`, consentData)
    }

    updateSpecialQualification(payLoad: any) {
        return this._http.post(`${this.apiUrl}/customers/UpdateCustomerQualifications`, payLoad)
    }

    setDefaultPaymentOption(profileId: any) {
        return this._http.post(`${this.apiUrl}/profile/${this.entityName}/${this.recordId}/PaymentProfile/${profileId}`, null)
    }

    deletePaymentOption(profileId: any) {
        return this._http.delete(`${this.apiUrl}/profile/${this.entityName}/${this.recordId}/PaymentProfile/${profileId}`)
    }

    SyncProviderCustomerProfile(CustomerC3Id: any) {
        return this._http.post(`${this.apiUrl}/customers/${CustomerC3Id}/SyncProviderCustomerProfile`, null)
    }
    geHostedToken(billingProviderReferenceID: any): Observable<any> {
        return this._http.get<any>(`${this.apiUrl}/billing/${billingProviderReferenceID}/GetHostedToken`);

    }

    createCustomer(customerDetails: any): Observable<any> {
        const url = `${this.apiUrl}/customers/${this.entityName}/${this.recordId}/FromBilling`;
        return this._http.post(url, null).pipe(
            switchMap((result: any) => {
                const customerInBilling = result.Data;
                const billingUrl = `${this.apiUrl}/billing/customers`;
                return this._http.post(billingUrl, {
                    BillingProviderUserId: customerInBilling.BillingProviderReferenceID,
                    BillingProviderAddressId: customerInBilling.BillingProviderAddressId
                }).pipe(
                    map(() => customerInBilling),
                    catchError((error: any) => {
                        throw error;
                    })
                );
            }),
            catchError((error: any) => {
                throw error;
            })
        );
    }

    createPaymentAccount(customerdetails: any, payload: any): Observable<any> {
        const paymentAccountDetails = {
            ...payload,
            BillingProviderUserId: customerdetails.BillingProviderReferenceID,
            EntityName: this.entityName,
            RecordId: this.recordId
        };
        return this._http.post(`${this.apiUrl}/billing/paymentprofiles`, paymentAccountDetails);

    }

   validateBankAccount(billingAccountData: any) {
        return this._http.post(`${this.apiUrl}/billing/validateBankAccount`,billingAccountData);
    }


}