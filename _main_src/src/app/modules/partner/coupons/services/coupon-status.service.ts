import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CommonService } from "src/app/services/common.service";
import { environment } from "src/environments/environment";


@Injectable({
    providedIn:"root"
})

export class CouponStatusService{

    apiUrl = environment.apiBaseUrl;
    constructor(private _http: HttpClient,
                private _commonService:CommonService
    ){


    }


    //public string EntityName { get; set; }
    // public string RecordId { get; set; }
    // public string LoggedInUserName { get; set; }
    // public string CustomerName { get; set; }

    // @entityName NVARCHAR(255) = NULL,
	// @recordId NVARCHAR(55) = NULL,
	// @loggedInUserName NVARCHAR(255) = NULL,
	// @customerName NVARCHAR(510) = NULL,

    getList( StartInd, Name, SortColumn, SortOrder, PageSize) {

        var obj = this._commonService.buildHttpParamsObject( {
            v: new Date().getTime().toString(),
            EntityName : this._commonService.entityName,
            RecordId: this._commonService.recordId,
            LoggedInUserName :"",
            CustomerName: Name,
            PageSize: PageSize,
            SortColumn,
            SortOrder,
            StartInd
        },)

        return this._http.get(`${this.apiUrl}/Coupons/GetCouponsStatus`, {
            params:obj
        });

    }





}