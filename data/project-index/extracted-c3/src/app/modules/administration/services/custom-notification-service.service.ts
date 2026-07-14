import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs'; 
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';
import { TaggedEntitiesModule } from 'src/app/shared/models/common';

@Injectable({
  providedIn: 'root'
})
export class CustomNotificationService {
  EntityName:string;
  RecordId:string;
  taggedEntityDetails: TaggedEntitiesModule[] = [];
  private formData = new BehaviorSubject<any[]>([]);
    currentFormData = this.formData.asObservable();

    private localformData = new BehaviorSubject<any[]>([]);
    localcurrentFormData = this.localformData.asObservable();

  apiUrl = environment.apiBaseUrl
  removeAdditionalRow = new BehaviorSubject(null);
  removeAdditionalRow$ = this.removeAdditionalRow.asObservable();
  constructor(
    private _http: HttpClient,
    private _commonService: CommonService
  ) { 
    this.EntityName = this._commonService.entityName;
    this.RecordId = this._commonService.recordId;
  }

  getCustomNotifications(SearchKeyWord:any){
    const option = this._commonService.buildHttpParamsObject(SearchKeyWord)
    return this._http.get<any>(`${this.apiUrl}/customnotification/List/`,{ params:option});
  }
  getList(customNotificationMessageID:any){
    return this._http.get(`${this.apiUrl}/customnotification/getcustomnotificationdetailsbyid/${customNotificationMessageID}`)
  }

  getCustomNotificationdata(){
    return this._http.get(`${this.apiUrl}/customnotification/${this.EntityName}/${this.RecordId}/Event/${0}/`)
  }

  getEntityDetails(){
    return this._http.get(`${this.apiUrl}/common/EntityDetails/`)
  }

  getCustomNotificationEventEntities(EventId:any){
    return this._http.get(`${this.apiUrl}/customnotification/${this.EntityName}/${this.RecordId}/${EventId}/EntityEvents/${0}`)

  }

  getProducrList(reqbody:any){
    return this._http.post(`${this.apiUrl}/customNotification/ElementsByEntityEvents`,reqbody )
  }

  saveCustomNotification(reqbody:any){
    return this._http.post(`${this.apiUrl}/customnotification/SaveCustomNotification`,reqbody )
  }

  updateFormData(data: any) {
    this.formData.next(data);
  }

  updateLocalFormData(data: any) {
    this.localformData.next(data);
  }

  getPlans(){
    return this._http.get(`${this.apiUrl}/plans/withId`)
  }

  deleteNotification(messageId:any){
    return this._http.delete(`${this.apiUrl}/customnotification/DeleteCustomNotification/${messageId}` )
  }

  getTrialPeriodDays() {
    return this._http.get(`${this.apiUrl}/partnerproducts/TrialPeriodDays/${this._commonService.entityName}/${this._commonService.recordId}`);
  }

  clearFormData(): void {
    this.formData.next([]); 
  }

}




