import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment'; 
// import { environment } from 'src/environments/environment';

interface layoutData {
  Id: number,
  Menu: string,
  Heading: boolean,
  Text: string,
  Sref: string,
  Icon: string,
  IsSideMenu: boolean,
  OrderSequence: number,
  ParentMenu: number | null
  children?: layoutData[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientSettingsService {
   apiUrl = `${environment.apiBaseUrl}/ClientSettings`;
  private cachedSettings: Observable<any[]> | null = null; 

  sideMenuData: layoutData[] = []
  sideMenu: layoutData[] = [];
  
  constructor(private _http: HttpClient) { }

  getData() {
    if (this.cachedSettings) {
      return this.cachedSettings;
    } 
    return this._http.get(this.apiUrl)
    .pipe( 
      tap((v:any) => {
        this.cachedSettings = of(v);  
      }));
  }
 
  getWelcomeLayout(){
    return this._http.get(`${environment.apiBaseUrl}/PartnerSettings/welcomePageView`)
  }

  clearCache(){
    this.cachedSettings = null;
  }

}
