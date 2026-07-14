import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProfileContextService {

  constructor() { } 
  private _InfoDetails: any;
  private _UserConfigurations: any;

  public get InfoDetails() {
    return this._InfoDetails;
  }

  public get UserConfigurations() {
    return this._UserConfigurations;
  }

  public setProfileInfo(info: any) {
    this._InfoDetails = info;
  }

  public setUserConfigurations(config: any) {
    this._UserConfigurations = config;
  }
}
