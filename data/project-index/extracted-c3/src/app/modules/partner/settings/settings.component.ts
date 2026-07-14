import { Component, OnDestroy } from '@angular/core';
import { SettingsTab } from './settingsTabs';
import { PermissionService } from 'src/app/services/permission.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnDestroy {
  activeTab: string = 'general'; 
  settingsTab= SettingsTab;
  activeServiceDetail:any;
  loadingData:boolean = true;
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();
  setActiveTab(tab: any) {
    if (!tab || !tab.route) return;
    this.settingsTab.forEach(v => {
      v.active = v.route === tab.route;
    });
    this.activeTab = tab.route;
  }

  constructor(public _permissionService: PermissionService,
    public _router:Router,
    private _pageInfo: PageInfoService,
    private _translateService: TranslateService,
    public _appSettingsService:AppSettingsService){
    const subscription = _appSettingsService.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((res:any)=>{
      this.activeServiceDetail = res;
      if(this.activeServiceDetail?.Name.toLowerCase() == CloudHubConstants.PSA_NAME_AUTOTASK){
        let autotask=this.settingsTab.find(v=>v.route == 'autotask')
        autotask.permissionKeys.forEach(p => {
          if (p.length > 0 && this._permissionService.hasPermission(p) == "Allowed") {
            autotask.visible = true;
          } else {
            autotask.visible = false;
          }
        })
      }else if(this.activeServiceDetail?.Name.toLowerCase() == CloudHubConstants.PSA_NAME_CONNECTWISE){
        let connectWise=this.settingsTab.find(v=>v.route == 'connectwiseManage')
        connectWise.permissionKeys.forEach(p => {
          if (p.length > 0 && this._permissionService.hasPermission(p) == "Allowed") {
            connectWise.visible = true;
          } else {
            connectWise.visible = false;
          }
        })
      }
    });
    this._subscriptionArray.push(subscription);
    this.seSettingsTabs();
    let url = this._router.url.replace('/partner/settings/',"");
    // child routes are not present in settingsTab
    // hence adding an or condition to fix the issue
    // also when we go to inner routes the parent route should be highlighted
    this.setActiveTab(this.settingsTab.find(v=>v.route == url || url.toLowerCase().indexOf(v.route.toLowerCase()) > -1 ));
    this._pageInfo.updateTitle(this._translateService.instant('TRANSLATE.MENU_TOPBAR_SETTINGS'),true);
  }

  seSettingsTabs(){
    this.settingsTab.forEach(v => { 
      if (v.route != 'autotask' && v.route != 'connectwiseManage') {
        v.permissionKeys.forEach(p => {
          if (p.length > 0 && this._permissionService.hasPermission(p) == "Allowed" && v.visible) {
            v.visible = true;
          } else {
            v.visible = false;
          }
        })
      }
    })
    this.loadingData = false
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
  
}
