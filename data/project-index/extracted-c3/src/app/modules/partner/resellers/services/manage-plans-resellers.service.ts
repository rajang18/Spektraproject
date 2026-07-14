import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ManagePlansResellersService {

  apiUrl = environment.apiBaseUrl
  constructor(
    private _http: HttpClient
  ) { }


  getList({StartIndex, Name, SortColumn, SortOrder, PageSize ,resellerC3Id }: any) {
    return this._http.get(`${this.apiUrl}/resellers/${resellerC3Id}/plans`, {
      params: {
        v: '1717500026666',
        Name,
        StartIndex,
        PageSize,
        SortColumn,
        SortOrder
      }
    });
  }

  update({resellerC3Id, internalPlanId }: any, reqBody: any) {
    return this._http.post(`${this.apiUrl}/resellers/${resellerC3Id}/manage/${internalPlanId}/plan`, reqBody);
  }

}
