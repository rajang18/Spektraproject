import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = environment.apiBaseUrl + '/Orders';
  public termandcondition = new BehaviorSubject(false);

  constructor(private _http : HttpClient) { }

  public setTermandcondition(e:any){
    this.termandcondition.next(e)
  }
  getOrderDetails(reqBody: any, currentOrderID:any){
    return this._http.post(`${this.apiUrl}/${currentOrderID}`, reqBody)
    .pipe(map((v: any) => v))
  }
  cancellingOrder(reqBody: any){
    return this._http.post(`${this.apiUrl}/cancellingOrder`, reqBody)
    .pipe(map((v: any) => v))
  }
}
