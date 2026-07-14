import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TestPaymentsService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getTestPayments(entityName: string, recordC3Id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/transaction/${entityName}/${recordC3Id}/TestPayments`);
  }

  recordPayment(entityName: string, recordC3Id: string, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/customers/${entityName}/${recordC3Id}/charge`, amount);
  }

      getPaymentProfiles(entityName: string, recordC3Id: string) {
        return this.http.get(`${this.apiUrl}/transaction/${entityName}/${recordC3Id}/GetBankAccountVerificationStatusForCustomer`)
    }
}
