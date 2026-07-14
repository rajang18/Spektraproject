import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { CustomerconfigurationserviceService } from 'src/app/services/customerconfigurationservice.service';
import { PermissionService } from 'src/app/services/permission.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Injectable({ providedIn: 'root' })
export class RenewalGuard implements CanActivate {
  private entityName: string = '';
  recordId : any= '';
  isShowScheduleRenewalTab : any = 'No';
  showScheduleRenewalMenuBasedOnconfiguration: boolean = false;
  isScheduleRenewalConfigEnabled : any = "No";
  isUpgradeNCEProductEnabled : any = "No";
  imperonsationContext : any;
  isDefaultImpersonator: boolean = false;
  private permissions: { 
    hasNCEScheduleRenewalTab: string;
    hasCustomOfferRenewalTab: string;
  } = {
    hasNCEScheduleRenewalTab: "Denied",
    hasCustomOfferRenewalTab: "Denied"
  };

  constructor(
    private _permissionService: PermissionService,
    private _commonService: CommonService,
    private _router: Router,
    private _CustomerconfigurationserviceService: CustomerconfigurationserviceService
  ) {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.isScheduleRenewalConfigEnabled = 'No';
    if (this.entityName.toLowerCase() === 'customer') {
      this.loadImpersonationContext();
      this.loadTenantConfigurations();
    }
  }

  private loadPermissions(): void {
    this.permissions.hasNCEScheduleRenewalTab = this._permissionService.hasPermission(CloudHubConstants.VIEW_NCE_SCHEDULE_RENEWAL_LISTING);
    this.permissions.hasCustomOfferRenewalTab = this._permissionService.hasPermission(CloudHubConstants.VIEW_CUSTOM_OFFER_SCHEDULE_RENEWAL_LISTING);
  }

  loadImpersonationContext() {
    this.imperonsationContext = JSON.parse(localStorage.getItem('impersonationContext') ?? '{}');
    if (this.imperonsationContext?.Username?.includes('DEFAULT(')) {
      this.isDefaultImpersonator = true;
    }
  }

  loadTenantConfigurations(): Observable<any> {
    return this._CustomerconfigurationserviceService.GetTenantConfigurations(this.entityName, this.recordId)
      .pipe(
        map((response: any) => {
          if (response.Status === 'Success' && Array.isArray(response.Data) && response.Data.length > 0) {
            const data = response.Data;
            const scheduleRenealConfig = data.find(x => x.Name === "ShowNextScheduleRenewalMenu");
            const scheduleRenewalUpgradeProduct = data.find(x => x.Name === "ShowUpgradeButtonForNCEProducts");
            this.isScheduleRenewalConfigEnabled = scheduleRenealConfig?.Value || 'No';
            this.isUpgradeNCEProductEnabled = scheduleRenewalUpgradeProduct?.Value || 'No';
            this.evaluateScheduleRenewalTab();
          }
          return response;
        }),
        catchError(error => {
          console.error('Error loading tenant configurations:', error);
          return of(null);
        })
      );
  }
  

  evaluateScheduleRenewalTab() {
    if (this.isUpgradeNCEProductEnabled === 'Yes' && this.isScheduleRenewalConfigEnabled === 'Yes' && this.permissions.hasNCEScheduleRenewalTab == "Allowed" || (this.permissions.hasNCEScheduleRenewalTab == "Allowed" && this.isDefaultImpersonator)) {
      this.isShowScheduleRenewalTab = 'Yes';
      this.showScheduleRenewalMenuBasedOnconfiguration = true;
    } 
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    this.loadPermissions();
    return this.loadTenantConfigurations().pipe(
      map(() => {
        const hasPermission = this.permissions.hasNCEScheduleRenewalTab === "Allowed";
        
        if (this.isAccessAllowedForPartnerOrReseller(hasPermission)) {
          return true; 
        } else if (this.isAccessAllowedForCustomer(hasPermission)) {
          return true;
        } else {
          this._router.navigate(['/renewalmanager']);
          return false;
        }
      }),
      catchError(() => {
        this._router.navigate(['/renewalmanager']);
        return of(false);
      })
    );
  }
  
  private isAccessAllowedForPartnerOrReseller(hasPermission: boolean): boolean {
    return (this.entityName === "Partner" || this.entityName === "Reseller") && hasPermission;
  }
  
  private isAccessAllowedForCustomer(hasPermission: boolean): boolean {
    return this.entityName === "Customer" &&
           this.isShowScheduleRenewalTab === "Yes" &&
           this.showScheduleRenewalMenuBasedOnconfiguration &&
           hasPermission || this.isDefaultImpersonator;
  }
  
}
