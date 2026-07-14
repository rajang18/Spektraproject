import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BaseApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<TResponse>(url: string, params?: HttpParams): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}${url}`, { params });
  }

  post<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
    return this.http.post<TResponse>(`${this.baseUrl}${url}`, body);
  }

  put<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
    return this.http.put<TResponse>(`${this.baseUrl}${url}`, body);
  }

  delete<TResponse>(url: string): Observable<TResponse> {
    return this.http.delete<TResponse>(`${this.baseUrl}${url}`);
  }
}
