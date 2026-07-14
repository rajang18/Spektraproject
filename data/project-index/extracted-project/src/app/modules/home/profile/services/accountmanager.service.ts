import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map} from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
    providedIn: 'root'
})
export class AccountManagerService{
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

    GetAccountManagerDetails(){
        return this._http.get(`${this.apiUrl}/accountManagers/${this.entityName}/${this.recordId}/GetAccountManagerDetailsOfEntity`)
        .pipe(map((v:any)=>{
            return v.Data
        }))
    }

    
}