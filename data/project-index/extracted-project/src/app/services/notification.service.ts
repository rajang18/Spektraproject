import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    apiUrl = environment.apiBaseUrl
    constructor(
        private _http: HttpClient
    ) { }

    getList({ StartInd, SortColumn, SortOrder, PageSize, StartDate, EndDate, TargetEntity, Status, EventId, CustomerC3Id, TenantId, EntityName, RecordId }: any) {
        const postData = {
            StartDate: StartDate,
            EndDate: EndDate,
            CustomerC3Id: CustomerC3Id,
            StartInd:StartInd,
            PageSize: PageSize,
            SortColumn: SortColumn,
            SortOrder:SortOrder,
            TargetEntity:TargetEntity,
            Status: Status,
            EventId:EventId,
            TenantId:TenantId
        }
        return this._http.post(`${this.apiUrl}/activitylog/${EntityName}/${RecordId}/?v=${(new Date()).getTime()}`,postData);
    }
    getEvent(EntityName: string, RecordId: any): Observable<any> {
        return this._http.get(`${this.apiUrl}/activitylog/${EntityName}/${RecordId}/events`)
        .pipe(map((v: any) => {
            return v.Data
        }));
    }

    getActiveCustomers(): Observable<any> {
        return this._http.get(`${this.apiUrl}/customers/activeCustomers/`)
        .pipe(map((v: any) => {
            return v.Data
        }));
    }

    getviewMessage(ContactLogId: any): Observable<any> {
        return this._http.get(`${this.apiUrl}/activitylog/${ContactLogId}`)
        .pipe(map((v: any) => {
            return v.Data
        }));
    }

    getWebhookViewMessage(reqBody:any){
        return this._http.post(`${this.apiUrl}/activitylog/retry/`,reqBody); 
    }
}
