import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProfabilityCardData } from '../models/dashboard.model';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    apiUrl = environment.apiBaseUrl;
    private cachedBillingPeriods: Observable<any> | null = null;
    constructor(
        private _http: HttpClient
    ) { }
    getCustomersCount(entityName: string | null,recordId:string | null) {
        return this._http.get(`${this.apiUrl}/dashboardcards/customerscount/${entityName}/${recordId}/`)
    }
    getResellersCount() {
        return this._http.get(`${this.apiUrl}/dashboardcards/ResellerCount/`)
    }
    getSubscriptionsCount(entityName: string | null,recordId:string | null) {
        return this._http.get(`${this.apiUrl}/dashboardcards/${entityName}/${recordId}/count`)
    }
    // getSeatsCount(entityName: string | null) {
    //     debugger;
    //     return this._http.get(`${this.apiUrl}/dashboardcards/seatscount/${entityName}/null/`)
    // }
    getSeatsCount(entityName: string | null,recordId: string |null) {
        
        return this._http.get(`${this.apiUrl}/dashboardcards/seatscount/${entityName}/${recordId}/`)
    }

    getProfability(id: number, entityName: string | null,recordId: string | null):Observable<ProfabilityCardData> {
        
        return this._http.get<ProfabilityCardData>(`${this.apiUrl}/dashboardcards/${entityName}/${recordId}/ProfitabilityForDashboard/${id}/`)
    }
   
    getBillingPeriods() {
        if (this.cachedBillingPeriods) {
            return this.cachedBillingPeriods
        }
        return this._http.get(`${this.apiUrl}/common/billingperiods/`)
            .pipe(
            map(v => v),
            tap(v => this.cachedBillingPeriods = of(v))
            ); 
    }

    getPurchaseOfSeats(entityName: string | null,recordID: string | null, timeDuration: string) {
        return this._http.get(`${this.apiUrl}/dashboardcards/purchaseofseats/${entityName}/${recordID}/${timeDuration}/`)
    }

    getProductsCountOnDate(entityName: string | null,recordId:string|null) {
        return this._http.get(`${this.apiUrl}/dashboardcards/productcountsasondate/${entityName}/${recordId}/`)
    }

    getSeatsCountOnDate(entityName: string | null,recordId:string|null) {
         return this._http.get( `${this.apiUrl}/dashboardcards/seatscountasondate/${entityName}/${recordId}/`)
    }

    getRevenueVsCost(entityName: string | null, timeDuration: string | null, provider: string | null,recordId:string |null) {

        return this._http.get(`${this.apiUrl}/dashboardcards/providers/${provider}/revenueversuscost/${entityName}/${recordId}/${timeDuration}/`)
   
    }


    getTopSkus(entityName: string | null,recordId: string | null, timeDuration: string) {
        
        return this._http.get(`${this.apiUrl}/dashboardcards/productseatsbysku/${entityName}/${recordId}/${timeDuration}/10/`)
    }

    getAllSkus(entityName: string | null, recordId: string | null, timeDuration: string) {
        return this._http.get(`${this.apiUrl}/dashboardcards/productseatsbysku/${entityName}/${recordId}/${timeDuration}/all/`)
    }
   // apiService.get('api/dashboardcards/productseatsbysku/' + $rootScope.userContext.entityName + '/' + $rootScope.userContext.recordId + '/' + timePeriod + '/' + numberofSkus, null, null, true).then(function (response) {

   getAllSkusCustomer(entityName: string | null, recordID: string | null, timeDuration: string ) {
        return this._http.get(`${this.apiUrl}/dashboardcards/productseatsbysku/${entityName}/${recordID}/${timeDuration}/all/`)
    }

    getSeatsPurchasedTopProducts(entityName: string | null, timeDuration: string,recordId:string|null) {
        return this._http.get(`${this.apiUrl}/dashboardcards/valuedproductseats/${entityName}/${recordId}/${timeDuration}/`)
    }

    getRevenueTopProducts(entityName: string | null, timeDuration: string,recordId:string|null) {
        return this._http.get(`${this.apiUrl}/dashboardcards/valuedproductsbyrevenue/${entityName}/${recordId}/${timeDuration}/`)


    }
    

    getTopCustomers(entityName: string | null, timeDuration: string,recordId:string|null ) {
        return this._http.get(`${this.apiUrl}/dashboardcards/valuedcustomers/${entityName}/${recordId}/${timeDuration}/`)
    }

    getPendingPayments() {
        return this._http.get(`${this.apiUrl}/dashboardcards/PendingPayments/`);

    }

    getDashboardCards() {
        return this._http.get(`${this.apiUrl}/dashboardcards/`,{
        params:{
          v:'1716978444568',
          ScreenName: 'Dashboard'
        }
        })
    }

    GetIsMandateProfile() {
        return this._http.get(`${this.apiUrl}/profile/validateMandateProfile/`)
    }


    getCategoriesForRevenueVersusCost(entityName: string | null,recordId:string| null) {
        return this._http.get(`${this.apiUrl}/dashboardcards/categoriesforrevenueversuscost/${entityName}/${recordId}/`, {
            params: {
                v: '1717084444309'
            }
        });


    }

    getRevenueVersusCostByCategory(entityName: any, timeDuration: string, recordId:string|null,selectedCategory: string | any, customerEntityName?: string, c3Id?: string) {
        let params: { [key: string]: any } = {
            Category: null,
            EntityName: entityName,
            RecordId: recordId,
            TimePeriod: timeDuration,
            EntityNameOfCustomer:null,
            RecordIdOfCustomer:null
        };
        if(selectedCategory != undefined && selectedCategory != null && selectedCategory!=''){
            params['Category'] = selectedCategory;
        }
        if(customerEntityName != undefined && customerEntityName != null && customerEntityName!=''){
            params['EntityNameOfCustomer'] = customerEntityName;
        }
        if(c3Id != undefined && c3Id != null && c3Id!=''){
            params['RecordIdOfCustomer'] = c3Id;
        }
        
        // if (customerEntityName && c3Id) {
        //     params['EntityNameOfCustomer'] = customerEntityName;
        //     params['RecordIdOfCustomer'] = c3Id;

        // }
        
        return this._http.get(`${this.apiUrl}/dashboardcards/revenueversuscostbycategory/`, { params });
    }


    getCustomersAndResellersByEntity(entityName: string | null, recordId: string | null) {
        return this._http.get(`${this.apiUrl}/customers/GetCustomersAndResellersByEntity/${entityName}/${recordId}/`);

    }

    getInvoicePayments(billingId: number | undefined) {
         return this._http.get( `${this.apiUrl}/dashboardcards/InvoicePaymentDetails/${billingId}/`);
    }
    //my code
    getcustomerRenewalProduct(searchParams: any): Observable<any> {
        return this._http.get(`${this.apiUrl}/dashboardcards/customerRenewalProduct`, { params: searchParams });
      }
    
    getSitesCount(): Observable<any> {
        return this._http.get(`${this.apiUrl}/dashboardcards/SitesCount`);
      }
    
    getDepartmentsCount(): Observable<any> {
        return this._http.get(`${this.apiUrl}/dashboardcards/DepartmentsCount`);
      }
      
    getUserCount(entityName: string | null, recordID: string | null){  
            return this._http.get(`${this.apiUrl}/user/${entityName}/${recordID}/count`);
          }
    getUserTermsAndConditionLogs(): Observable<any> {
        return this._http.get(`${this.apiUrl}/dashboardcards/UserTermsAndConditionLogs`);
      }

    getProductCount(entityName: string | null,recordID: string | null) {
        return this._http.get(`${this.apiUrl}/dashboardcards/${entityName}/${recordID}/count`);
    }

    getProductCountsAsOnDate(entityName: string | null, recordID: string | null){
        return this._http.get(`${this.apiUrl}/dashboardcards/productcountsasondate/${entityName}/${recordID}`);
      }

    getSeatsCountCustomer(entityName: string | null,recordID: string | null) {
        return this._http.get(`${this.apiUrl}/dashboardcards/seatscount/${entityName}/${recordID}`);
    }

    getSeatsCountOnDateCustomer(entityName: string | null,recordID: string | null) {
        return this._http.get(`${this.apiUrl}/dashboardcards/seatscountasondate/${entityName}/${recordID}`);
    }

    getCustomerInvoice() {
        return this._http.get(`${this.apiUrl}/dashboardcards/Invoice`);       
    }



}