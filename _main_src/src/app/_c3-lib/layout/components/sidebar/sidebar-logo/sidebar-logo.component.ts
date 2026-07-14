import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LayoutType } from '../../../core/configs/config';
import { LayoutService } from '../../../core/layout.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { SideMenuHeaderData } from 'src/app/shared/models/menus.model';

@Component({
  selector: 'app-sidebar-logo',
  templateUrl: './sidebar-logo.component.html',
  styleUrls: ['./sidebar-logo.component.scss'],
})
export class SidebarLogoComponent implements OnInit, OnDestroy {
  private unsubscribe: Subscription[] = [];
  @Input() toggleButtonClass: string = '';
  @Input() toggleEnabled: boolean;
  @Input() toggleType: string = '';
  @Input() toggleState: string = '';
  defaultLogo:string = 'https://c3v2sbqastor.blob.core.windows.net/profileimages/5f889a-9ca13d-CSP-Logo.png';
  currentLayoutType: LayoutType | null;
  sideMenuHeaderdata:SideMenuHeaderData
  toggleAttr: string;
  imgLoadingFailed: boolean = false;
  iconClicked:boolean=true;
  constructor(
    private layout: LayoutService,
    private _appSettingService: AppSettingsService
   ) {}
   

  ngOnInit(): void {
    this.iconClicked=true;
    this.toggleAttr = `app-sidebar-${this.toggleType}`;
    const layoutSubscr = this.layout.currentLayoutTypeSubject
      .asObservable()
      .subscribe((layout) => {
        this.currentLayoutType = layout;
      });
      this.getApplicationData();
      // this._appSettingService.getLocalStoaregeSavedData().subscribe(data=>{
      //   // this.sideMenuHeaderdata = data?.appData as unknown as SideMenuHeaderData;
      //   // this.imgLoadingFailed = false;
      // })
    this.unsubscribe.push(layoutSubscr);
  }
  getApplicationData() {
    this._appSettingService.getApplicationData().subscribe((response: any) => {
      this.sideMenuHeaderdata = response.Data;
    })
  }
  Clickedicon(){ 
    this.iconClicked=!this.iconClicked; 
    document.body.setAttribute('data-kt-app-sidebar-hoverable', 'true');
  }
  handleImageError(event:any){
    this.imgLoadingFailed = true
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
