import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerTagsService {

  apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient,
    ) { }

    getList({customerC3Id }: any) {
        return this._http.get(`${this.apiUrl}/customers/${customerC3Id}/tags`, {
            params: {
                v: '1718007240595',
            },
        });
    }

    saveTag(reqbody:any){
        return this._http.post(`${this.apiUrl}/customers/tags`,reqbody )
    }

    deleteTag(reqbody:any){
        return this._http.delete(`${this.apiUrl}/customers/${reqbody.C3Id}/tags/${reqbody.TagId}`)
    }
}
