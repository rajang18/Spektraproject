import { ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { Router, ActivatedRoute} from '@angular/router';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ProductMappingService } from '../services/productmapping.service';
import { Subject, Subscription, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-prod-mapping',
  templateUrl: './prod-mapping.component.html',
  styleUrl: './prod-mapping.component.scss'
})
export class ProdMappingComponent implements OnInit, OnDestroy {
  activeServiceDetail: any = null;
  isRefreshInprocess: boolean;
  additionType: any;
  isThirdPartySubscriptionPushEnabled: any;
  timerHandleForBulkRefreshPSA: any;
  tabs: any;
  activeTab: string = 'refresh-mapping';
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  _subscription: Subscription;
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();
  get cloudHubConstants() {
    return CloudHubConstants;
  }

  permissions = {
    RefreshExternalEntityListInLocal: "Denied",
    BulkManageEntityAndProductMapping: "Denied"
  };

  constructor(
    public _permissionService: PermissionService,
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    private _productMappingService: ProductMappingService,
    public _route: ActivatedRoute,
    private _pageInfo: PageInfoService,
    public permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private _translateService: TranslateService,
  ) {
    this._productMappingService.refreshStatus(true);
  }

  ngOnInit(): void {
    this.hasPermission();
    this.getApplicationData();
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'])
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"), true);
    const subscription = this._productMappingService.isRefreshInprocess$.pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.isRefreshInprocess = res;
    })
    this._subscriptionArray.push(subscription);
    this.getActiveServiceDetails(); 
    let url = this._router.url.replace('/partner/prodMapping/', "")
    this.setActiveTab(url);
  }

  hasPermission() {
    this.permissions.RefreshExternalEntityListInLocal = this._permissionService.hasPermission(this.cloudHubConstants.REFRESH_EXTERNAL_ENTITY_LIST_IN_LOCAL);
    this.permissions.BulkManageEntityAndProductMapping = this._permissionService.hasPermission(this.cloudHubConstants.BULK_MANAGE_ENTITY_AND_PRODUCT_MAPPING);

  }

  getActiveServiceDetails() {
    const subscription = this._appService.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.activeServiceDetail = response;
      this.cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  getApplicationData() {
    const subscription =this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.additionType = response.Data.ConnectwiseAdditionType;
      this.isThirdPartySubscriptionPushEnabled = response.Data.IsThirdPartySubscriptionPushEnabled;
    });
    this._subscriptionArray.push(subscription);
  }

  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());

  }
}
