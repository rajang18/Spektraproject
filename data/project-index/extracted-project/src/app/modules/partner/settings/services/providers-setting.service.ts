import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface ProviderSettingsRequest {
  ModifyBy: any; // Replace 'any' with the actual type if known
  ProviderSettings: string;
}
@Injectable({
  providedIn: 'root'
})

export class ProvidersSettingService {

  
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getProviders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/providers/`);
  }

  getProviderSettings(providerName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/providersSetting/${providerName}/`);
  }

  saveProviderSettings(providerName: string, providerSettings: any): Observable<any> {
    const reqBody: ProviderSettingsRequest = {
      ModifyBy: null,
      ProviderSettings: providerSettings
    };
    return this.http.post(`${this.apiUrl}/providersSetting/${providerName}`, reqBody);
  }


  testMicrosoftPricingAPIAccess(): Observable<any> {
    return this.http.get(`${this.apiUrl}/PartnerConsent/TestMicrosoftPricingAPIAccess/`);
  }

  testPartnerAccess(): Observable<any> {
    return this.http.get(`${this.apiUrl}/PartnerConsent/PartnerProfile/`);
  }

  switchToNewSecureModel(): Observable<any> {
    return this.http.post(`${this.apiUrl}/PartnerSettings/DisableOldAndEnableNewPCSettings/`, null);
  }
}
