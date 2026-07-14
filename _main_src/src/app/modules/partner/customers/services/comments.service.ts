import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessCommentsService {

  apiUrl = environment.apiBaseUrl;

  constructor(private _http: HttpClient,
    private _common :CommonService
  ) { }

  getRecentComments(reqBody: any) {
    const option = this._common.buildHttpParamsObject(reqBody)
    return this._http.get(`${this.apiUrl}/Comments/getRecentComments`,{params:option
    });
  }

  getComments(reqBody: any) {

    const option = this._common.buildHttpParamsObject(reqBody)
    return this._http.get(`${this.apiUrl}/Comments/`, {params:option
    });
  }

  createComment(saveModel: any) {
    return this._http.post(`${this.apiUrl}/Comments/`, saveModel);
  }

  updateComment(quickEditModel: any) {
    return this._http.put(`${this.apiUrl}/Comments/`, quickEditModel);
  }

  deleteComment(id: string) {
    return this._http.delete(`${this.apiUrl}/Comments/${id}`);
  }

  getActiveCustomers(entityName: string, recordId: string) {
    return this._http.get(`${this.apiUrl}/customers/GetCustomersAndResellersByEntity/${entityName}/${recordId}`);
  }
}
