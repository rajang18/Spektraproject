import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import _ from 'lodash';
import { BehaviorSubject, map, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommonService } from './common.service';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  apiUrl = environment.apiBaseUrl;
  private productsApiUrl = environment.apiBaseUrl + '/products';
  productItems: any[] = [];
  filterBy = "";
  tempId: number = 1;
  private cancelableApiSubjectProductsForGridView = new BehaviorSubject<void>(undefined);

  constructor(private _http: HttpClient, private _commonService: CommonService, private _loaderService: LoaderService) { }

  resetData(){
    this.productItems = [];
    this.filterBy = "";
    this.tempId = 1;
  }
  
  deleteProductFromLocalStorage(productToDelete: any, productList: any[]): any {
    return _.filter(productList, (each: any) => {
      if (productToDelete.TempId !== each.TempId && (!productToDelete.InternalLinkPlanProductId || productToDelete.InternalLinkPlanProductId !== each.InternalPlanProductId)) {
        if (each.Addons && each.Addons.length) {
          each.Addons = this.deleteProductFromLocalStorage(productToDelete, each.Addons);
        }
        return each;
      }
    });
  }

  getPricingSlabs(id: string, body: any) {
    const option = this._commonService.buildHttpParamsObject(body)
    return this._http.get<any>(`${this.apiUrl}/products/MeteredBilling/${id}/Plan/PricingSlabs`,{params: option})
    // return this._http.post(`${this.apiUrl}/products/MeteredBilling/${id}/Plan/PricingSlabs`, body)
      .pipe(map((v: any) => {
        return v.Data
      }));
  }

  // Method to trigger the API call
  triggerCancelableApiCallProductsForGridView(params:any) {
    this.cancelableApiSubjectProductsForGridView.next(params); // This triggers the API call
  }

  getCustomerProductsForGrid(reqBody: any) {
    return this.cancelableApiSubjectProductsForGridView.pipe(
      switchMap(params => {
        this._loaderService.startLoading();
        if (params === null || params === undefined) {
          params = reqBody;
        }
        return this._http.post(`${this.productsApiUrl}/grid`, params)
        .pipe(map((v: any) => v.Data));
      })
    );
  }

  getErrorDetails(internalCustomerProductId: string) {
    return this._http.get(`${this.apiUrl}/carts/errordetails/${internalCustomerProductId}`);
  }

  ignoreProduct(internalCustomerProductId: string) {
    return this._http.get(`${this.apiUrl}/carts/ignore/${internalCustomerProductId}`);
  }

  getAllProductStatus(productIds: any) {
    return this._http.post(`${this.productsApiUrl}/${this._commonService.entityName}/${this._commonService.recordId}/status`, { PurchasedProductIds: productIds })
      .pipe(map((v: any) => v.Data))
  }

  getMeteredBillingSlabs(productSubscriptionId: string, requestBody: any) {
    return this._http.get(`${this.productsApiUrl}/MeteredBilling/${productSubscriptionId}/Subscription/PricingSlabs`, requestBody);
  }

  getCustomerProductsForList(reqBody: any) {
    return this._http.post(`${this.productsApiUrl}/list`, reqBody)
      .pipe(map((v: any) => v.Data))
  }

  getContractSlabDetails(product: any) {
    return this._http.get(`${this.apiUrl}/plans/Products/` + product.PlanProductId + `/SlabProducts`);
  }

  getContractPricingSlabs(product: any) {
    let url = '';
    if (product.ProductSubscriptionId !== undefined && product.ProductSubscriptionId !== null && product.ProductSubscriptionId !== 0) {
      url = `${this.apiUrl}/plans/Subscription/` + product.ProductSubscriptionId + `/PricingSlabs`;
    }
    else {
      url = `${this.apiUrl}/plans/Products/` + product.PlanProductId + `/PricingSlabs`;
    }
    return this._http.get(url);
  }

  deactivateProduct(product: any) {
    return this._http.post(`${this.productsApiUrl}/${product.InternalCustomerProductId}/deactivate`, null);
  }

  getProviderCustomersWhoNotProvidedCustomerConsent() {
    return this._http.get(`${this.apiUrl}/termsAndConditions/${this._commonService.entityName}/${this._commonService.recordId}/ProviderCustomersWhoNotProvidedCustomerConsent`);
  }

  checkIfTransactionsAreEnabledForCustomer() {
    return this._http.get(`${this.apiUrl}/customers/CheckIfTransactionsAreEnabled/${this._commonService.entityName}/${this._commonService.recordId}`);
  }

  checkIfCustomerAllowedToChangeProductQuantityFromList() {
    return this._http.get(`${this.apiUrl}/customers/CheckIfCustomerAllowedToChangeProductQuantityFromList/${this._commonService.entityName}/${this._commonService.recordId}`);
  }
}