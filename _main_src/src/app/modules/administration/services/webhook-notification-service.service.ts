import { Injectable, OnInit } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Router } from '@angular/router';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';


@Injectable({
  providedIn: 'root'
})
export class WebhookNotificationService extends C3BaseComponent implements OnInit {

  apiUrl = environment.apiBaseUrl
  constructor(
    private _http: HttpClient,
    private _commonService: CommonService,
    public _permissionService: PermissionService,
    public router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
  ) {
    super(permissionService, dynamicTemplateService, router, _appService) 
  }
  ngOnInit(): void {
  }

  HasCustomNotification: string = 'Denied'; // Example value, replace with actual logic

  getDefaultRoute(): string {
    this.HasCustomNotification = this._permissionService.hasPermission(this.cloudHubConstants.VIEW_UI_NOTIFICATION);
    return this.HasCustomNotification === 'Denied' ? 'webhookNotifications' : 'customNotifications';
  }


  getWebhookNotifications({SearchKeyWord, PageCount,PageIndex, SortColumn,SortOrder,EntityName,RecordId }: any): Observable<any> {
    const params = {
      SearchKeyWord:SearchKeyWord,
      EntityName:EntityName,
      RecordId:RecordId,
      PageCount: PageCount,
      PageIndex: PageIndex,
      SortColumn:SortColumn,
      SortOrder:SortOrder,
    }

    return this._http.get<any>(`${this.apiUrl}/webhooknotification/List/`,{params: params});
  }

  getContactMethods(){
    return this._http.get<any>(`${this.apiUrl}/common/contactMethods/`);
  }

  getWebhookNotification(webhookContactTypeId : any) {
    return this._http.get<any>(`${this.apiUrl}/customNotification/${this._commonService.entityName}/${this._commonService.recordId}/Event/${webhookContactTypeId}`);
  }

  getWebhookNotificationEventEntities({notificationEventId,webhookContactTypeId}:any){
    return this._http.get<any>(`${this.apiUrl}/customNotification/${this._commonService.entityName}/${this._commonService.recordId}/${notificationEventId}/EntityEvents/${webhookContactTypeId}`);
  }

  getData({WebhookNotificationMessageId,EventId,EventEntityId,ProductName,ProviderIds,CategoryIds,BillingCycleIds,ProviderCategories,ConsumptionTypes,Validities,ValidityTypes,SupportedMarket,EntityName,RecordId,PageCount,PageIndex,IsTrailOffer,TrialDuration}:any): Observable<any>{
    const req = {
      WebhookNotificationMessageId: WebhookNotificationMessageId,
      EventId: EventId,
      EventEntityId: EventEntityId,
      ProductName: ProductName,
      ProviderIds: ProviderIds,
      CategoryIds: CategoryIds,
      BillingCycleIds: BillingCycleIds,
      ProviderCategories: ProviderCategories,
      ConsumptionTypes: ConsumptionTypes,
      Validities: Validities,
      ValidityTypes: ValidityTypes,
      SupportedMarket: SupportedMarket,
      EntityName:EntityName,
      RecordId:RecordId,
      PageCount: PageCount,
      PageIndex: PageIndex,
      IsTrailOffer: IsTrailOffer,
      TrialDuration:TrialDuration,
    }
    return this._http.post<any>(`${this.apiUrl}/webhooknotification/ElementsByEntityEvents/`,req);
  }

  saveWebhook(reqBody:any){
    return this._http.post<any>(`${this.apiUrl}/webhooknotification/SaveWebhookNotification/`,reqBody);
  }
  validateWebhookUrl(reqBody:any){
    return this._http.post<any>(`${this.apiUrl}/webhooknotification/sendWebhookNotification/`,reqBody);
  }

  editWebhook(reqBody:any){
    let params=this._commonService.buildHttpParamsObject(reqBody)
    return this._http.get<any>(`${this.apiUrl}/webhooknotification/webhookNotificationById/`, {params:params});
  }

  deleteWebhook(reqBody: any) {
    let params=this._commonService.buildHttpParamsObject(reqBody)
    return this._http.delete(`${this.apiUrl}/webhooknotification/DeleteWebhookNotification`, {params:params});
  }

  
  getProviders() { 
    return this._http.get(`${this.apiUrl}/providers`)
    .pipe(map((v:any)=>{
        return v.Data.filter((provider:any) => provider.IsManagedByPartner === true);
    }))
  }
  getCategories() { 
    return this._http.get(`${this.apiUrl}/categories`)
    .pipe(map((v:any)=>{
        return v.Data
    }))
  }

  getProductTrialDurations() {

    return this._http.get(`${this.apiUrl}/partnerproducts/TrialPeriodDays/${this._commonService.entityName}/${this._commonService.recordId}`)
    .pipe(map((v:any)=>{
        return v.Data
    })) 
    }


    getProductTermDurations() {
          return this._http.get(`${this.apiUrl}/common/productValidityAndValidityTypes`)
        .pipe(map((v:any)=>{
            return v.Data
        })) 
    }

   GetBillingCycles() {
    return this._http.get(`${this.apiUrl}/common/billingcycles`)
    .pipe(map((v:any)=>{
        return v.Data
    })) 
  }

   GetConsumptionTypes() {
    return this._http.get(`${this.apiUrl}/common/ConsumptionTypes`)
    .pipe(map((v:any)=>{
        return v.Data
    })) 
   } 

   getTrialPeriodDays() {
    return this._http.get(`${this.apiUrl}/partnerproducts/TrialPeriodDays/${this._commonService.entityName}/${this._commonService.recordId}`);
  }

    
}
 
