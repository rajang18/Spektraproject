import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map} from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LicenseChangeReportService {

  apiUrl = environment.apiBaseUrl
  constructor(
    private _http: HttpClient,
  ) { }

  getLicenseChangeReport({ StartDate, EndDate, CustomerC3Id, EntityName, RecordId, StartInd, Name, SortColumn, SortOrder, PageSize }: any) {
    const postData = {
      StartDate: StartDate,
      EndDate: EndDate,
      CustomerC3Id: CustomerC3Id,
      EntityName: EntityName,
      RecordId: RecordId,
      PageSize: PageSize,
      StartInd: StartInd,
      SortColumn: SortColumn,
      SortOrder: SortOrder
    }
    return this._http.post(`${this.apiUrl}/reports/${EntityName}/${RecordId}/GetLicenseChangeReport/?v=${(new Date()).getTime()}`, postData);
  }

  getCustomersList({ EntityName, RecordId }: any) {
    return this._http.get(`${this.apiUrl}/customers/GetCustomersAndResellersByEntity/${EntityName}/${RecordId}/?v=${(new Date()).getTime()}`)
      .pipe(map((v: any) => {
        return v.Data
      }))
  }
}