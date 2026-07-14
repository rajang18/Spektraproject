import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Subject, Subscription, first, of, switchMap, takeUntil } from 'rxjs';
import {  DashboardCardsData, PortletColumn, PortletTargetActions, Section } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { CommonService } from 'src/app/services/common.service';
import { IsMandateFileResponse } from 'src/app/shared/models/menus.model';
import { BannerNotificationService } from '../../partner/banner-notification/Service/banner-notification.service';
import { BannerService } from 'src/app/services/banner.service';
import { TranslateService } from '@ngx-translate/core';
import { EngageService } from '../../partner/engage/service/engage.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { WidgetLoaderService } from '../dashboard-widgets/widget-loader.service';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { ShopService } from '../../customers/services/shop.service';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  entityName: string | null;
  isMandateProfile: boolean;
  portletsActions = PortletTargetActions;
  dashboardCards: Partial<DashboardCardsData>;
  _subscription: Subscription;
  _subscriptionArray: Subscription[] = []; 
  notifier$ = new Subject();
  // ---- Purchase may fail (Shop-like warning banner) ----
showAlert: boolean = true;
purchaseFailedMessage: string;
provider = 'Microsoft';  
ProviderCustomersWhoNotProvidedCustomerConsent = null;
ProviderTenantsCount: number = null;
provider_custom_consent_not_provided: any = ``
CanPaurchase: boolean = null;
destroy$ = new Subject<void>();
 ProviderTenants = null;



  constructor(
    private dashboardService: DashboardService,
    private cdref: ChangeDetectorRef,
    private commonService: CommonService,
    private translateService: TranslateService,
    private _bannerService: BannerService,
    private notifier: NotifierService,
    private appSettingService: AppSettingsService,
    private _bannerNotification: BannerNotificationService,
    private _engageService: EngageService,
    private userContext: UserContextService,
    private widgetLoaderService: WidgetLoaderService,
    public _shopService: ShopService,
    private renderer: Renderer2, private el: ElementRef,
     public _router: Router,
    private pageInfo: PageInfoService

  ) { 
        this.provider_custom_consent_not_provided = this.translateService.instant('TRANSLATE.PROVIDER_CUSTOMER_CONSENT_DETAILS_NOT_PROVIDED_ERROR_MESSAGE')

 const sub1 = this.commonService.getProviderTenants(this.provider)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(e => {
                        this.ProviderTenants = e.Data;
                        this.ProviderTenantsCount = this.ProviderTenants.length ? this.ProviderTenants.length : 0;
                    });
                    
                 if (localStorage.getItem("impersonationContext") != undefined && localStorage.getItem("impersonationContext") != null && localStorage.getItem("impersonationContext") != "") {
                    var impersonationContext = JSON.parse(localStorage.getItem("impersonationContext"));
                    if (impersonationContext.UserRole != undefined && impersonationContext.UserRole != null && impersonationContext.UserRole != "") {
                        this.CanPaurchase = this.translateService.instant(impersonationContext.UserRole) != this.translateService.instant("TRANSLATE.ROLE_NAME_CUSTOMER_ADMIN_LITE");
                    }
                    else {
                        this.CanPaurchase = localStorage.getItem("RoleName") != this.translateService.instant("TRANSLATE.ROLE_NAME_CUSTOMER_ADMIN_LITE");
                    }
                }
                else {
                    this.CanPaurchase = localStorage.getItem("RoleName") != this.translateService.instant("TRANSLATE.ROLE_NAME_CUSTOMER_ADMIN_LITE");
                }

  }

  /**
   * Component Ng OnInit
   */
  ngOnInit(): void {
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.Dashboard"), true);
  //    const token = localStorage.getItem('token');
  // if (!token) {
  //   // No token found, redirect to welcome/login page
  //   window.location.href = `${window.location.protocol}//${window.location.host}/welcome`;
  //   return; // stop further init
  // }
    this.entityName = this.commonService.entityName;

    const sub = this.appSettingService.getUserContext().pipe(
      takeUntil(this.notifier$),
      first()).subscribe((res: any) => {
      if (res.Data == undefined || res.Data == null || res.Data.length <= 0) {
        this.userNotFound();
      }
    })
    this._subscriptionArray.push(sub);
    const sub1 = this.appSettingService.getAvailableEnvironments().pipe(
      takeUntil(this.notifier$),
      first()).subscribe((res: any) => {
      if (res.Data == undefined || res.Data == null || res.Data.length <= 0) {
        this.userNotFound();
      }
    })
    this._subscriptionArray.push(sub1);

    // get the dashboard data
    this.handleDashboardCardData();
    this.renderbanner();
    this.loadEngageNotification();
      this.getProviderCustomersWhoNotProvidedCustomerConsent();
       this.entityName = this.commonService.entityName;

  if (this.entityName === 'Customer') {
  this.getProviderTenantsCount();
}


  }

  userNotFound() {
    let title = this.translateService.instant('TRANSLATE.USER_DETAILS_NOT_FOUND_HEADER');
    let body = this.translateService.instant('TRANSLATE.USER_DETAILS_NOT_FOUND_BODY');
    this.notifier.alert({ title: title, text: body }).then((result: { isConfirmed: any }) => {
      this.userContext.logOut();
    });
  }

  /**
   * Retrieve the dashboard data
   */
  handleDashboardCardData(): void {
    const sub = this.dashboardService.GetIsMandateProfile()
      .pipe(
        takeUntil(this.notifier$),
        switchMap((data: Partial<IsMandateFileResponse>) => {
          this.isMandateProfile = data?.Data?.IsMandateProfile != null ? data.Data.IsMandateProfile : true;
          return !this.isMandateProfile ? this.dashboardService.getDashboardCards() : of(null);
        })
      )
      .subscribe((res: any) => {
        this.dashboardCards = res?.Data;
        if (this.dashboardCards?.Sections) {
          this.dashboardCards.Sections.forEach((section: Section) => {
            section.PortletColumns = section.PortletColumns.map((columnData: PortletColumn) => ({
              ID: columnData?.ID || 0,
              ColumnSizeClass: columnData?.ColumnSizeClass || '',
              PortletSectionID: columnData?.PortletSectionID || 0,
              DisplayOrder: columnData?.DisplayOrder || 0,
              Show: true
            }));
          });
          this.cdref.detectChanges();
        }
      });
      this._subscriptionArray.push(sub);
  }

  /**
   *
   * @param section
   * @param column
   * @returns
   */
  getPortletsBySectionAndColumn(section: Section, column: PortletColumn): any[] {
    const portlets = this.dashboardCards?.Portlets?.filter((item: any) => {
      return (item.PortletSectionID === section?.ID &&
        item.ColumnPosition === (column.DisplayOrder - 1));
    });

    //KB: If the Portlets count is zero, mark the column as hidden.
    column.Show = (portlets != null && portlets.length > 0);
    return portlets || [];
  }

  renderbanner() {
    const sub = this._bannerNotification.loadBanner('Dashboard')
    .pipe(
      takeUntil(this.notifier$)
    )
    .subscribe((response: any) => {
      if (response.Status === 'Success' && response.Data !== null && response.Data?.[0]?.MessageBody) {
        const messageBody = this.translateService.instant(response.Data[0]?.MessageBody);
        const messageType = response.Data[0]?.MessageType;
        this._bannerService.show(messageType, messageBody)
      }
    })
    this._subscriptionArray.push(sub);
  }

  loadEngageNotification() {
    let pageName: string;
    if (this.entityName === 'Partner' || this.entityName === 'Reseller') {
      pageName = "PartnerDashboard";
    } else if (this.entityName === 'Customer') {
      pageName = "CustomerDashboard";
    }
    const sub = this._engageService.engageNotification(pageName)
    .pipe(
      takeUntil(this.notifier$)
    )
    .subscribe((response: any) => {
      if (response.Status === 'Success' && response.Data !== null && response.Data.length > 0) {
        let loadEngageNotification = response.Data[0];

        const data = {
          title: loadEngageNotification.Title,
          description: loadEngageNotification.BodyText,
          btnColor: loadEngageNotification.BtnColor,
          btnText: loadEngageNotification.BtnText,
          btnTextColor: loadEngageNotification.BtnTextColor,
          btnUrl: loadEngageNotification.ButtonUrl
        }

        this._bannerService.showWithTemplate(loadEngageNotification.BackgroundTemplate, data);
      }
    })
    this._subscriptionArray.push(sub);
  }

  /**
   * Component Destroyed
   */
  ngOnDestroy(){
    this._subscription?.unsubscribe()
    this.notifier$?.next(null);
    this.notifier$?.complete;
    this._bannerService.clear();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this.widgetLoaderService.unloadAllComponent();
  }

// setTranslateText() {
//   this.purchaseFailedMessage = this.translateService.instant(
//     'TRANSLATE.ERROR_MESSAGE_PURCHASES_MAY_FAIL_DESCRIPTION'
//   );
// }

  setTranslateText() {
        setTimeout(() => {
            const container = this.el.nativeElement.querySelector('.provider_custom_consent_not_provided'); // Assume the HTML has a container class

            if (container) {
                container.innerHTML = this.provider_custom_consent_not_provided;

                // Find the anchor tag and apply the routerLink programmatically
                const anchor = container.querySelector('a');
                if (anchor) {
                    // Prevent default browser behavior and use Angular's router navigation
                    this.renderer.listen(anchor, 'click', (event) => {
                        event.preventDefault(); // Prevent page reload
                        this._router.navigate(['/home/profile/provider/Microsoft']); // Angular route navigation
                    });
                }
            }
        }, 1000)
    }

//  getProviderCustomersWhoNotProvidedCustomerConsent() {
//   this.ProviderCustomersWhoNotProvidedCustomerConsent = null;

//   const subscription = this._shopService
//     .getProviderCustomersWhoNotProvidedCustomerConsent()
//     .pipe(takeUntil(this.destroy$))
//     .subscribe(e => {
//       this.ProviderCustomersWhoNotProvidedCustomerConsent = e;
//     });

//   this._subscriptionArray.push(subscription);
// }

  getProviderCustomersWhoNotProvidedCustomerConsent() {
        // var getProviderCustomersWhoNotProvidedCustomerConsentUri = "api/termsAndConditions/" + $rootScope.userContext.entityName + '/' + $rootScope.userContext.recordId + "/ProviderCustomersWhoNotProvidedCustomerConsent";
        this.ProviderCustomersWhoNotProvidedCustomerConsent = null;
        const subscription = this._shopService.getProviderCustomersWhoNotProvidedCustomerConsent().pipe(takeUntil(this.destroy$)).subscribe(e => {
            this.ProviderCustomersWhoNotProvidedCustomerConsent = e;
        })
        this._subscriptionArray.push(subscription);
    }

getProviderTenantsCount() {
  const sub = this.commonService.getProviderTenants(this.provider) // or this.entityName if needed
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      const tenants = res?.Data || [];
      this.ProviderTenantsCount = tenants.length;
    });
  this._subscriptionArray.push(sub);
}

}
