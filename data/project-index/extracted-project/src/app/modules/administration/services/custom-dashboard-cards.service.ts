import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomDashboardCardsService {

  apiUrl = environment.apiBaseUrl

  constructor(
    private _http: HttpClient,
    private _commonService: CommonService,
  ) { }

  getCustomCards(searchParams: any) {
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get<any>(`${this.apiUrl}/dashboardcards/List`,{params: option});
  }


  getAssignCards(searchParams: any) {
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get<any>(`${this.apiUrl}/dashboardcards/AssignedList`,{params: option});
  }

  saveCustomCardDetails(reqBody:any){
    return this._http.post<any>(`${this.apiUrl}/dashboardcards/SaveCustomCard`,reqBody);
  }

  deleteCustomCardById(cardId:any){
    return this._http.delete<any>(`${this.apiUrl}/dashboardcards/DeleteCustomCards/${cardId}`);
  }

  getCustomersAssignedCards(searchParams: any) {
    const option = this._commonService.buildHttpParamsObject(searchParams)
    return this._http.get<any>(`${this.apiUrl}/dashboardcards/GetAssignedCustomersOfCards`,{params: option});
  }

  assignCustomCard(customCardId: any, IsAssigned: any,entityName:any,recordId:any){
    return this._http.post<any>(`${this.apiUrl}/dashboardcards/AssignCardsToCustomers/${customCardId}/${entityName}/${recordId}/${IsAssigned}`, null);
  }

  saveCardAssignmentDetails(reqBody:any){
    return this._http.post<any>(`${this.apiUrl}/dashboardcards/SaveCardAssignments/`,reqBody);
  }

  getCustomers(){
    return this._http.get<any>(`${this.apiUrl}/customers/GetCustomersAndResellersByEntity/${this._commonService.entityName}/${this._commonService.recordId}`);
  }
  
  upload(file: File): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', `${this.apiUrl}/dashboardcards/withfile`, formData, {
      responseType: 'json',
    });

    return this._http.request(req);
  }

  saveCustomCardWithImage(reqBody:any){
    return this._http.post<any>(`${this.apiUrl}/dashboardcards/withfile`,reqBody);
  }
}
