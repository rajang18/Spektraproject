import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class EmailNotificationsSettingsService {
  apiUrl = environment.apiBaseUrl;

  constructor(private _http: HttpClient,
    private _common: CommonService,
  ) { }

  getCustomers() {
    return this._http.get(`${this.apiUrl}/customers/activeCustomers`);
  }

  getEventEmailNotificationRecipients(reqBody: any) {
    return this._http.post(`${this.apiUrl}/EmailNotification/Recipients`, reqBody);
  }

  getEventsName(customerC3Id: string | null) {
    return this._http.get(`${this.apiUrl}/EmailNotification/${this._common.entityName}/${this._common.recordId}/Events/Customer/${customerC3Id}`);
  }

  getAllEvents() {
    return this._http.get(`${this.apiUrl}/EmailNotification/${this._common.entityName}/${this._common.recordId}/Events/Customer`);
  }

  getEvents(customerC3Id: string | null) {
    return this._http.get(`${this.apiUrl}/EmailNotification/${this._common.entityName}/${this._common.recordId}/Events/${customerC3Id}`);
  }

  getRecipientTypes() {
    return this._http.get(`${this.apiUrl}/EmailNotification/RecipientTypes`);
  }

  getRoles() {
    return this._http.get(`${this.apiUrl}/EmailNotification/Roles`);
  }

  getEmailNotificationById(emailNotificationId: number) {
    return this._http.get(`${this.apiUrl}/EmailNotification/${this._common.entityName}/${this._common.recordId}/${emailNotificationId}`);
  }

  saveEventEmailNotification(reqBody: any) {
    return this._http.post(`${this.apiUrl}/EmailNotification`, reqBody);
  }

  previewEmailNotification(data: any) {
    return this._http.get(`${this.apiUrl}/EmailNotification/Event/${data}/Preview`);
  }

  deleteEmailNotification(data: any) {
    return this._http.delete(`${this.apiUrl}/EmailNotification/${this._common.entityName}/${this._common.recordId}/${data.ID}`);
  }

  getCustomerTags(c3Id:any){
    return this._http.get(`${this.apiUrl}/customers/${c3Id}/tags`);
  }

}
