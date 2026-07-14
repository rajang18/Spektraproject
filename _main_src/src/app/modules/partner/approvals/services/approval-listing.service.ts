import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/services/common.service';

@Injectable({
  providedIn: 'root'
})

export class ApprovalListingService{
    apiUrl= environment.apiBaseUrl
    constructor(
        private _http: HttpClient,
        private _commonService: CommonService
    ) { }

    getList({ StartInd, CustomerName, SortColumn, SortOrder, OrderId,PageSize }: any) {
        const params: any = {
          v: new Date().getTime().toString(),
          EntityName: this._commonService.entityName,
          RecordId: this._commonService.recordId,
          PageSize,
          SortColumn,
          SortOrder,
          StartInd,
          CustomerName: CustomerName || '',
        };
      
        // Conditionally add OrderId to params if it has a value
        if (OrderId) {
          params.OrderId = OrderId;
        }
      
        return this._http.get(`${this.apiUrl}/purchaseRequest/`, { params });
      }

      transactionLimitDetails(cartEntityType: string, CartRecordC3Id: string, purchaseRequestCartId: any) {
        return this._http.get(
          `${this.apiUrl}/customers/transactionLimitDetails/${cartEntityType}/${CartRecordC3Id}/${purchaseRequestCartId}`,
          {headers: { 'X-Skip-Impersonation-Context': 'true' }}
        );
      }
      
      getPurchaseRequestDetails(requestbody: any){
       let params = this._commonService.buildHttpParamsObject(requestbody);
        return this._http.get(`${this.apiUrl}/purchaseRequest/details`,{params:params});
    
      }

      updateCartLineItemsStatus(updateCartLineItemsStatusModel: any) { 
        return this._http.put(`${this.apiUrl}/purchaseRequest/cartLineItems/status`, updateCartLineItemsStatusModel);
      } 

      updateCustomerRequestStatus(updateCartStatusModel: any) { 
        return this._http.put(`${this.apiUrl}/purchaseRequest/cart/status`, updateCartStatusModel);
      } 

      UpdatePurchaseRequestCartLineItemStatus(updateCartLineItemStatusModel: any) { 
        return this._http.put(`${this.apiUrl}/purchaseRequest/cartLineItems/status`, updateCartLineItemStatusModel);
      } 

      getPromotionDetailById(promotionId: number) {
        return this._http.get(`${this.apiUrl}/ProviderPromotions/${promotionId}/detail`);
      }

      approveCart(updateCartStatusModel: any) { 
        return this._http.put(`${this.apiUrl}/purchaseRequest/cart/status`, updateCartStatusModel);
      } 
}