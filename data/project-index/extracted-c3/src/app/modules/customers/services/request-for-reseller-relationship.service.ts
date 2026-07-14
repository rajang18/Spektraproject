import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map} from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RequestForResellerRelationshipService {

  apiUrl = environment.apiBaseUrl
  constructor(
      private _http: HttpClient,
  ) { }


  GetResellerRelationshipDetails(providerName:any,EntityName:any,RecordId:any): Observable<any> {
    return this._http.get(`${this.apiUrl}/customers/ResellerRelationshipRequestDetails/Providers/${providerName}/${EntityName}/${RecordId}`)
    .pipe(map((v: any) => {
        return v.Data
    }));
}
}
