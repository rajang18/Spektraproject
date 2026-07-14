import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { CustomerconfigurationserviceService } from 'src/app/services/customerconfigurationservice.service';
import { PermissionService } from 'src/app/services/permission.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Component({
  selector: 'app-schedule-renewals',
  templateUrl: './schedule-renewals.component.html',
  styleUrl: './schedule-renewals.component.scss'
})
export class ScheduleRenewalsComponent implements OnInit, OnDestroy{
  currentUrl : any = '';
  activetab : any = '';
  entityName : any= '';
  recordId : any= '';
  isShowScheduleRenewalTab : any = 'No';
  showScheduleRenewalMenuBasedOnconfiguration: boolean = false;
  isScheduleRenewalConfigEnabled : any = "No";
  isUpgradeNCEProductEnabled : any = "No";
  imperonsationContext : any;
  isDefaultImpersonator: boolean = false;
  currenttab: any = 'nceschedulerenewalslisting';
  permissions: { 
    hasNCEScheduleRenewalTab: string;
    hasCustomOfferRenewalTab: string;
  } = {
    hasNCEScheduleRenewalTab: "Denied",
    hasCustomOfferRenewalTab: "Denied"
  };
  showCustomOfferScheduleRenewalMenu: boolean = true;
  private unsubscribe$ = new Subject<void>(); // Used to track component destruction
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();
  
  constructor(
    private pageInfo: PageInfoService,
    private _translateService: TranslateService,
    private _router: Router,
    private _cdref: ChangeDetectorRef,
    private _commonService: CommonService,
    private _CustomerconfigurationserviceService: CustomerconfigurationserviceService,
    private _permissionService : PermissionService
  ) {
    this.loadPermissions();
    this.currentUrl = this._router.url;
    if (this.currentUrl.includes('/renewalmanager')) {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_TAB"),true);
      this.pageInfo.updateBreadcrumbs(['MENU_RENEWAL_MANAGER', 'SCHEDULE_RENEWAL_NCE_LISTING_HEADER_TAB']);
      this.activetab = 'nceschedulerenewalslisting';
    }
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.isScheduleRenewalConfigEnabled = 'No'; 
    if (this.entityName.toLowerCase() === 'customer') {
      this.loadImpersonationContext();
      this.loadTenantConfigurations();
    } else {
      this.showScheduleRenewalMenuBasedOnconfiguration = true;
      this.navigateToRenewalListing();
    }
  }
  
  loadImpersonationContext() {
    this.imperonsationContext = JSON.parse(localStorage.getItem('impersonationContext') ?? '{}');
    if (this.imperonsationContext?.Username?.includes('DEFAULT(')) {
      this.isDefaultImpersonator = true;
    }
  }
  
  loadTenantConfigurations() {
    const subscription = this._CustomerconfigurationserviceService.GetTenantConfigurations(this.entityName, this.recordId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success' && Array.isArray(response.Data) && response.Data.length > 0) {
        const data = response.Data;
        const scheduleRenealConfig = data.find(x => x.Name === "ShowNextScheduleRenewalMenu");
        const scheduleRenewalUpgradeProduct = data.find(x => x.Name === "ShowUpgradeButtonForNCEProducts");
        this.isScheduleRenewalConfigEnabled = scheduleRenealConfig?.Value || 'No';
        this.isUpgradeNCEProductEnabled = scheduleRenewalUpgradeProduct?.Value || 'No';
        this.evaluateScheduleRenewalTab();
      }
    });
    this._subscriptionArray.push(subscription);
  }
  
  evaluateScheduleRenewalTab() {
    if (this.isUpgradeNCEProductEnabled === 'Yes' && this.isScheduleRenewalConfigEnabled === 'Yes' && this.permissions.hasNCEScheduleRenewalTab == "Allowed" || (this.permissions.hasNCEScheduleRenewalTab == "Allowed" && this.isDefaultImpersonator)) {
      this.isShowScheduleRenewalTab = 'Yes';
      this.showScheduleRenewalMenuBasedOnconfiguration = true;
      this.navigateToRenewalListing();
    } else {
      if(this.permissions.hasCustomOfferRenewalTab == "Allowed"){
        this.isShowScheduleRenewalTab = 'No';
        this.showScheduleRenewalMenuBasedOnconfiguration = false;
        this._router.navigate(['renewalmanager/renewalconsent']);
      }
    }
    this.updateHeaders();
    
  }
  
  navigateToRenewalListing() {
    if(this.permissions.hasNCEScheduleRenewalTab == "Allowed"){
      this._router.navigate(['renewalmanager/nceschedulerenewalslisting']);
    }
  }
  
  ngOnInit(): void {
    this.updateHeaders();

    const subscription = this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd), // Only listen to NavigationEnd events
        takeUntil(this.unsubscribe$) // Auto-unsubscribe on destroy
      )
      .pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.showCustomOfferScheduleRenewalMenu = this._router.url !== '/renewalmanager/manageScheduleRenewalListing';
      });
      this._subscriptionArray.push(subscription);
  }

  loadPermissions(): void {
    this.permissions.hasNCEScheduleRenewalTab = this._permissionService.hasPermission(CloudHubConstants.VIEW_NCE_SCHEDULE_RENEWAL_LISTING);
    this.permissions.hasCustomOfferRenewalTab = this._permissionService.hasPermission(CloudHubConstants.VIEW_CUSTOM_OFFER_SCHEDULE_RENEWAL_LISTING);
  }

    setActiveTab(tab: any) {
        this.currenttab = tab;
    if (tab == 'nceschedulerenewalslisting') {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_TAB"),true);
      this.pageInfo.updateBreadcrumbs(['MENU_RENEWAL_MANAGER', 'SCHEDULE_RENEWAL_NCE_LISTING_HEADER_TAB']);
    }
    else if (tab == 'renewalconsent') {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.SCHEDULE_RENEWAL_CUSTOM_OFFER_LISTING_HEADER_TAB"),true);
      this.pageInfo.updateBreadcrumbs(['MENU_RENEWAL_MANAGER', 'SCHEDULE_RENEWAL_CUSTOM_OFFER_LISTING_HEADER_TAB']);
    }
    this._cdref.detectChanges();
  }

  updateHeaders(){
    if((this.entityName == "Partner" || this.entityName == "Reseller") && this.permissions.hasNCEScheduleRenewalTab == "Denied"){
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_RENEWAL_MANAGER"),true);
      this.pageInfo.updateBreadcrumbs(['MENU_RENEWAL_MANAGER']);
    }
    if(this.entityName == "Customer" && this.permissions.hasNCEScheduleRenewalTab == "Denied" && this.permissions.hasCustomOfferRenewalTab == "Allowed"){
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.SCHEDULE_RENEWAL_CUSTOM_OFFER_LISTING_HEADER_TAB"),true);
      this.pageInfo.updateBreadcrumbs(['MENU_RENEWAL_MANAGER', 'SCHEDULE_RENEWAL_CUSTOM_OFFER_LISTING_HEADER_TAB']);
    }
    if((this.entityName == "Customer") && this.permissions.hasNCEScheduleRenewalTab == "Denied" &&  this.permissions.hasCustomOfferRenewalTab == "Denied"){
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_RENEWAL_MANAGER"),true);
      this.pageInfo.updateBreadcrumbs(['MENU_RENEWAL_MANAGER']);
    }
    if((this.entityName == "Customer") && (this.permissions.hasNCEScheduleRenewalTab == "Allowed" || this.showScheduleRenewalMenuBasedOnconfiguration) &&  this.permissions.hasCustomOfferRenewalTab == "Denied"){
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_RENEWAL_MANAGER"),true);
      this.pageInfo.updateBreadcrumbs(['MENU_RENEWAL_MANAGER']);
    }
    this._cdref.detectChanges();
  }

  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this.unsubscribe$.next(); // Emit value to trigger unsubscription
    this.unsubscribe$.complete(); // Complete the Subject to clean up resources
  }

}
