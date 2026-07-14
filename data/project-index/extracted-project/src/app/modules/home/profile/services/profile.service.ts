import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    apiUrl = environment.apiBaseUrl
    entityName: string | null;
    recordId: string | null;
    contactEntityName:string | null;
    contactRecordId:string | null;
    private removeAdditionalRow = new Subject();
    public removeAdditionalRow$ = this.removeAdditionalRow.asObservable();
 
    setAdditionalRow(val){
        this.removeAdditionalRow.next(val)
    }
    removeEmailAddressRow = new Subject();
    removeEmailAddressRow$ = this.removeEmailAddressRow.asObservable();

    setEmailAddressRow(val){
        this.removeEmailAddressRow.next(val)
    }

    removeAddressRow = new Subject();
    removeAddressRow$ = this.removeAddressRow.asObservable();

    setAddressRow(val){
        this.removeAddressRow.next(val)
    }

    constructor(
        private _http: HttpClient,
        private _commonService: CommonService,
    ) {
        this.entityName = this._commonService.entityName;
        this.recordId = this._commonService.recordId;
    }

    getProviderCustomerDetails() {
        return this._http.get(`${this.apiUrl}/customers/${this.recordId}/Providers/null/Tenants/null`)
            .pipe(map((v: any) => {
                return v.Data
            }))
    }

    getProviderDetails(provider: any) {
        return this._http.get(`${this.apiUrl}/customers/${this.entityName}/${this.recordId}/Providers/${provider}/Tenants/null/Addresses`)
    }

    getPlanOfferCategories() {
        return this._http.get(`${this.apiUrl}/categories/`)
    }

    getDirectSignedProviderCustomerConsentDetails(provider: any) {
        return this._http.get(`${this.apiUrl}/termsAndConditions/${this.entityName}/${this.recordId}/provider/${provider}/directsignedcustomerconsents`)
    }

    getProviderCustomerConsentDetails(provider: any) {
        return this._http.get(`${this.apiUrl}/termsAndConditions/${this.entityName}/${this.recordId}/provider/${provider}/customerconsents`)
    }

    UpdateDefaultValue(data: any) {
        return this._http.put(`${this.apiUrl}/customers/${data.CustomerC3Id}/Providers/${data.Name}/Tenants/${data.ServiceProviderCustomerId}/Default/`, data)
    }

    saveProviderCustomerConsent(consentData: any) {
        return this._http.post(`${this.apiUrl}/termsAndConditions/saveProviderCustomerConsent`, consentData)
    }

    updateSpecialQualification(payLoad: any) {
        return this._http.post(`${this.apiUrl}/customers/UpdateCustomerQualifications`, payLoad)
    }

    SyncProviderCustomerProfile(CustomerC3Id: any) {
        return this._http.post(`${this.apiUrl}/customers/${CustomerC3Id}/SyncProviderCustomerProfile`, null)
    }

    CheckEligibilityToManageConfigurationsByEntity(): Observable<any> {
        return this._http.get(`${this.apiUrl}/profile/CheckEligibilityToManageConfigurationsByEntity/${this.entityName}/${this.recordId}/`)
    }

    getBasicDetails() {
        return this._http.get(`${this.apiUrl}/profile/${this.entityName}/${this.recordId}/basic`)
    }

    saveBasicDetails(data) {
        return this._http.post(`${this.apiUrl}/profile/${this.entityName}/${this.recordId}/basic`, data)
    }

    getAddresses() {
        return this._http.get(`${this.apiUrl}/profile/${this.contactEntityName}/${this.contactRecordId}/address`);
    }

    getAddressesTypes() {
        return this._http.get(`${this.apiUrl}/common/addressTypes`);
    }

    saveAdresses(data) {
        return this._http.post(`${this.apiUrl}/profile/${this.contactEntityName}/${this.contactRecordId}/address/`, data);
    }

    getphones() {
        return this._http.get(`${this.apiUrl}/profile/${this.contactEntityName}/${this.contactRecordId}/phone`);
    }
    savePhones(data) {
        return this._http.post(`${this.apiUrl}/profile/${this.contactEntityName}/${this.contactRecordId}/phone`, data);
    }

    getEmails() {
        return this._http.get(`${this.apiUrl}/profile/${this.contactEntityName}/${this.contactRecordId}/email`);
    }

    saveEmails(data) {
        return this._http.post(`${this.apiUrl}/profile/${this.contactEntityName}/${this.contactRecordId}/email`, data);
    }

    getConfigurationsManagedByCustomer(entityName: any, recordId: any) {
        return this._http.get(`${this.apiUrl}/profile/GetConfigurationsManagedByCustomer/${entityName}/${recordId}`);
    }

    getConfigurationsManagedByReseller(entityName: any, recordId: any) {
        return this._http.get(`${this.apiUrl}/resellerprofile/GetConfigurationsManagedByReseller/${entityName}/${recordId}`);
    }

    updateConfigurationManagedByCustomer(payload) {
        return this._http.post(`${this.apiUrl}/profile/UpdateConfigurationManagedByCustomer`, payload);
    }

    updateConfigurationManagedByReseller(payload) {
        return this._http.post(`${this.apiUrl}/profile/UpdateConfigurationManagedByReseller`, payload);
    }

    revertConfigurationManagedByCustomer(payload) {
        const params = this._commonService.buildHttpParamsObject(payload)
        return this._http.delete(`${this.apiUrl}/profile/RevertConfigurationManagedByCustomer`, { params: params })
    }

    revertConfigurationManagedByReseller(payload) {
        const params = this._commonService.buildHttpParamsObject(payload)
        return this._http.delete(`${this.apiUrl}/profile/RevertConfigurationManagedByReseller`, { params: params })
    }

    savePartnerBillFromId(payload){
        return this._http.post(`${this.apiUrl}/profile/${payload.EntityName}/${payload.RecordId}/SaveBillFromId`,payload )
    }
}