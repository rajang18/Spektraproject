import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { MenuService } from 'src/app/services/menu.service';
import { PermissionService } from 'src/app/services/permission.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-business',
  templateUrl: './business.component.html',
  styleUrl: './business.component.scss'
})
export class BusinessComponent implements OnInit,OnDestroy {
      
  destroy$ = new Subject<void>();
  activeTab: string = 'revenueCostsummary';
  entityName: any;
  hasResellerRevenuPermissions:any;
  isDistributor:any;
  private _subscription: Subscription;
  constructor(
    private common: CommonService,
    public _permissionService: PermissionService,
    private router: Router,
    public _dynamicTemplateService: DynamicTemplateService,
    private _menuService : MenuService,
    private _appService: AppSettingsService, 
  ) { 
    // super(_permissionService, _dynamicTemplateService, router, _appService)
  }
  ngOnInit() {
    this.entityName = this.common.entityName;
    this.hasResellerRevenuPermissions= this._permissionService.hasPermission(CloudHubConstants.GET_RESELLER_REVENUE);
    this.isDistributorFn();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe();
  }
  setActiveTab(tab: string) {
    this.activeTab = tab;
    // this._dynamicTemplateService.sendTemplate(this.childTemplate);
  }

  clearSelectBillingPeriods(){
    localStorage.removeItem('SelectBillingPeriods');
    this.common.SelectBillingPeriods = null;
  }

  isDistributorFn(){
    this._subscription = this._menuService.GetMenuItems().pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
      let data = response;
      this.isDistributor = response.find(e => e.parent.Menu === 'sidebar_Seller_Indirect');
    })
  }

}
