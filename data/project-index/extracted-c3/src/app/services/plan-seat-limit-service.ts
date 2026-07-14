import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class PlanSeatLimitService{

    apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient
    ) { }

    getList({ StartInd, Name, SortColumn, SortOrder, PageSize, PlanId }: any) {
        return this._http.get(`${this.apiUrl}/plans/${PlanId}/seatlimit`, {
            params: {
                v: new Date().getTime(),
                PageSize: '10',
                SortColumn,
                SortOrder,
                StartInd,
                Name,
                PlanId
            },
        });
    }


    SubmitProducts(planId:number, seatLimits:string){
        return this._http.post(`${this.apiUrl}/plans/saveseatlimitdetails`,{
            v: new Date().getTime(),
            PlanId: planId,
            SeatLimits: seatLimits
        });
    }





}
