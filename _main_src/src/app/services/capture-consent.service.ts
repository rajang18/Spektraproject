import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CaptureConsentService {
  private refreshTokenCode: any;
  private environmentId: any;
  private realmId: any;
  apiUrl = environment.apiBaseUrl;


  get getRefreshTokenCode() {
    return this.refreshTokenCode;
  }

  set setRefreshTokenCode(val) {
    this.refreshTokenCode = val;
  }

  get getEnvironmentId() {
    return this.environmentId;
  }

  get getRealmId() {
    return this.realmId;
  }
  constructor(private _router: Router, private _http: HttpClient) {
    this.captureXeroConsent();
  }

  getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    let results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  captureXeroConsent() {
    let authCode = this.getUrlParameter('code');
    this.environmentId = this.getUrlParameter('state');
    this.realmId = this.getUrlParameter('realmId');
    this.refreshTokenCode = authCode;
    let toState: any = this._router.url;
    let isXeroConsentAccepted = toState === "/xeroconsentaccepted";
    let isXeroConsentCaptured = toState === "/xeroconsentcaptured";
    let isQuickBooksConsentAccepted = toState === "/quickbooksconsentaccepted";
    let isQuickbooksConsentCaptured = toState === "/quickbooksconsentcaptured";
    let isCPVAccepted = toState.name === "cpvaccepted";
    let isCPVconsentcaptured = toState.name === "cpvconsentcaptured";
    let isMicrosoftPricingAPIAccepted = toState.name === "microsoftpricingapiaccepted";
    let isMicrosoftPricingAPIconsentcaptured = toState.name === "microsoftpricingapiconsentcaptured";

    if ((this.refreshTokenCode !== undefined && this.refreshTokenCode !== null && this.refreshTokenCode.trim() !== '')) {
      if (location.search.indexOf('accounting.transactions') !== -1) {
        if (isXeroConsentAccepted) {
          return;
        }
        else {
          this._router.navigate(["welcome/xeroconsentaccepted", this.environmentId]);
        }
      }
      // saving the quickbooks auth code and realmId to C3
      else if ((this.realmId !== undefined && this.realmId !== null && this.realmId !== '')) {
        if (isQuickBooksConsentAccepted) {
          return;
        }
        else {
          // e.preventDefault();
          this._router.navigate(["welcome/quickbooksconsentaccepted", this.environmentId, this.realmId]);
        }
      }
      else if (this.environmentId.indexOf('microsoftpricingapi') !== -1) {
        if (isMicrosoftPricingAPIAccepted) {
          return;
        }
        else {
          this._router.navigate(["welcome/microsoftpricingapiaccepted", this.environmentId]);
        }
      }
      else {
        if (isCPVAccepted) {
          return;
        }
        else {
          this._router.navigate(["welcome/cpvaccepted", this.environmentId]);
        }
      }
    }

  }

  savePartnerXeroAuthCode(payload) {
    return this._http.post(`${this.apiUrl}/xeroconsent/SavePartnerXeroAuthCode`, payload);
  }

  savePartnerQuickBooksAuthCode(payload) {
    return this._http.post(`${this.apiUrl}/quickbooksconsent/SavePartnerQuickBooksAuthCode`, payload);
  }

  saveMicrosoftPricingAPIRefreshToken(payload) {
    return this._http.post(`${this.apiUrl}/PartnerConsent/saveMicrosoftPricingAPIRefreshToken`, payload);
  }

  saveCpvConsentAccepted(payload) {
    return this._http.post(`${this.apiUrl}/PartnerConsent/refreshtoken`, payload);
  }
}
