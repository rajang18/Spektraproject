import { ChangeDetectorRef, Component } from '@angular/core';
import { Tabs } from '../models/offer.models';
import { CommonService } from 'src/app/services/common.service';
import { PermissionService } from 'src/app/services/permission.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-partner-offers',
  templateUrl: './partner-offers.component.html',
  styleUrl: './partner-offers.component.scss'
})
export class PartnerOffersComponent {
  tabs = Tabs;
  activeTab: Tabs = null;
  HasAccessUserLicenseTracking: any;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();
  setActiveTab(tab: Tabs) {
    this.activeTab = tab;
    // if(tab == 'ManageSubcategories'){
    //   this._commonService.CategoryIds=this.CategoryIds;
    // }
  }
  
isHideManageSubcategories:boolean=false;
isHidePartner:boolean=false;

  constructor(private _commonService: CommonService,
    private router: Router,
    public _permissionService: PermissionService,
    public _cdref:ChangeDetectorRef
  ) {
    this.HasAccessUserLicenseTracking = "Denied";
    this.getLicenseTrackingStatus();
    //console.log(window.location.href);
  }
  

  ngOnInit(): void {
   this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => {
          if (window.location.pathname.indexOf('addsubcategories') > -1) {
          this.isHidePartner = true;
        }
        else{
          this.isHidePartner = false;
        }

        if (window.location.pathname == '/partner/customoffer/partnerofferdetails' || window.location.pathname == '/partner/distributoroffers/addsubcategories') {
          this.isHideManageSubcategories = true;
        }
        else {
          this.isHideManageSubcategories = false;
        }

        this._cdref.detectChanges();
        }, 0);
      }
    });
  }

  getLicenseTrackingStatus() {
    const subscription=this._commonService.getLicenseTrackingStatus().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let licenseTracking = response.Data;
      this.HasAccessUserLicenseTracking = licenseTracking.LicenseTrackingStatus;
      this.activeTab = this.tabs.Offers;
    })
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    this.isHidePartner  =false;
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
}
}

