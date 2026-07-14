import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
  providedIn: 'root'
})
export class BulkPurchaseProductMappingService{
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

    onDownloadCSV(){
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/bulkEntityMapping?v=${(new Date()).getTime()}`)
    }

    onDownloadCSVHelper(){
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/entityMappingHelper`)
    }

    onDownloadProductCSVHelper(){
        return this._http.get(`${this.apiUrl}/psa/${this.entityName}/${this.recordId}/productMappingHelper`)
    }
}