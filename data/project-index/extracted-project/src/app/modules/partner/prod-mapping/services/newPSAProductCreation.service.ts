import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map} from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
  providedIn: 'root'
})
export class NewPSAProductCreationService{
apiUrl= environment.apiBaseUrl
entityName: string| null ;
recordId: string | null;


    constructor(
        private _http: HttpClient,
        private _commonService: CommonService,
    ) { 
        this.entityName= this._commonService.entityName;
        this.recordId= this._commonService.recordId;
    }

    getPSACategories(){
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/GetPSACategories`).pipe(
            map((v: any) => v.Data)
          );
    }

    getPSASubCategories(){
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/GetPSASubCategories`).pipe(
            map((v: any) => v.Data)
          );
    }

    getPSASLAs(){
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/GetPSASLAs`).pipe(
            map((v: any) => v.Data)
          );
    }

    getPSAProductTypes(){
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/GetPSAProductTypes`).pipe(
            map((v: any) => v.Data)
          );
    }

    getPSAUOMS(){
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/GetPSAUOMS`).pipe(
            map((v: any) => v.Data)
          );
    }

    createPSAProduct(requestBody: any){
        return this._http.post(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/CreatePSAProduct`,requestBody)
    }


}