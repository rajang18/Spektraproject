import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { MenuService } from 'src/app/services/menu.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { AuthService } from 'src/app/shared/models/auth/auth.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { TranslateService } from '@ngx-translate/core';
import { SyncStateService } from './sync-state.service';
import { takeUntil } from 'rxjs';
import { IntegrationCenterService } from 'src/app/modules/partner/integration-center/integration-center.service';

@Component({
  selector: 'app-integration-center',
  templateUrl: './integration-center.component.html',
  styleUrl: './integration-center.component.scss'
})
export class IntegrationCenterComponent extends C3BaseComponent implements OnInit {
  tabsList: any[] = [
    { label: 'INTEGRATION_INSTRUCTIONS', link: 'instructions' },
    { label: 'INTEGRATION_BUSINESS_CENTRAL_CONFIGURATION', link: 'configuration' },
    { label: 'INTEGRATION_ENTITY_MAPPING', link: 'customer-mapping' }, 
    { label: 'INTEGRATION_BULK_ENTITY_MAPPING', link: 'bulk-customer-mapping' },
    { label: 'INTEGRATION_INVOICE', link: 'invoice' }
  ];
  activeTab: string = 'invoice';
  activeServiceDetail: any;
  hasAnyPermission: boolean = false;
  isloaded: boolean = false;
  isSyncing: boolean = false; 
  isHideTabsRoute: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private commonService: CommonService,
    public userContext: UserContextService,
    private appSettingService: AppSettingsService,
    private userContextService: UserContextService,
    private menuService: MenuService,
    private _authService: AuthService,
    private _triggerEvent: CommonEventTrigerredService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public pageInfo: PageInfoService,
    public _translateService: TranslateService,
    public syncService: SyncStateService,
    private cdRef: ChangeDetectorRef,  
    private integrationCenterService: IntegrationCenterService
  ) {
    super(_permissionService, _dynamicTemplateService, router, appSettingService)
    this.hasPermission();
    this.getActiveServiceDetails(); 
    this.router.events.subscribe(() => {
      const child = this.route.firstChild;
      this.activeTab = child?.snapshot.routeConfig?.path || 'invoice'; 
      
      const currentUrl = this.router.url;
      this.isHideTabsRoute = currentUrl.includes('customer-mapping-add');
    });
  }
    permissions = {
        HasGetBusinessCentralConfiguration: "Denied",
        HasUpdateBusinessCentralConfiguration: "Denied",
        HasSyncBusinessCentralData: "Denied",
        HasGetBusinessCentralEntityMappingDetails: "Denied",
        HasAddBusinessCentralEntityMapping: "Denied",
        HasRemoveBusinessCentralEntityMapping: "Denied",
        HasGetInvoiceLineItemsForBusinessCentral: "Denied",
        HasUploadInvoicesToBusinessCentral: "Denied",
        HasGetBusinessCentralPostLogs: "Denied",
    };

  hasPermission() {
    this.permissions.HasGetBusinessCentralConfiguration = this._permissionService.hasPermission(this.cloudHubConstants.GET_BUSINESS_CENTRAL_CONFIGURATION);
    this.permissions.HasUpdateBusinessCentralConfiguration = this._permissionService.hasPermission(this.cloudHubConstants.UPDATE_BUSINESS_CENTRAL_CONFIGURATION);
    this.permissions.HasSyncBusinessCentralData = this._permissionService.hasPermission(this.cloudHubConstants.SYNC_BUSINESS_CENTRAL_DATA);
    this.permissions.HasGetBusinessCentralEntityMappingDetails = this._permissionService.hasPermission(this.cloudHubConstants.GET_BUSINESS_CENTRAL_ENTITY_MAPPING_DETAILS);
    this.permissions.HasAddBusinessCentralEntityMapping = this._permissionService.hasPermission(this.cloudHubConstants.ADD_BUSINESS_CENTRAL_ENTITY_MAPPING);
    this.permissions.HasRemoveBusinessCentralEntityMapping = this._permissionService.hasPermission(this.cloudHubConstants.REMOVE_BUSINESS_CENTRAL_ENTITY_MAPPING);
    this.permissions.HasGetInvoiceLineItemsForBusinessCentral = this._permissionService.hasPermission(this.cloudHubConstants.GET_INVOICE_LINE_ITEMS_FOR_BUSINESS_CENTRAL);
    this.permissions.HasUploadInvoicesToBusinessCentral = this._permissionService.hasPermission(this.cloudHubConstants.UPLOAD_INVOICES_TO_BUSINESS_CENTRAL);
    this.permissions.HasGetBusinessCentralPostLogs = this._permissionService.hasPermission(this.cloudHubConstants.GET_BUSINESS_CENTRAL_POST_LOGS);
    this.checkOverallPermission();
  }

  checkOverallPermission() {
    this.hasAnyPermission = Object.values(this.permissions).some(
      (val) => val === "Allowed"
    );
  }

  getActiveServiceDetails() {
    const subscription = this.integrationCenterService.GetActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
    this.activeServiceDetail = response?.Data?.Name || '';     
    setTimeout(() => {
        this.isloaded = true;
        this.cdRef.detectChanges(); 
      }, 500);
    })
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant("BUSINESS_CENTRAL_INTEGRATION_CENTER"), true);
    this.pageInfo.updateBreadcrumbs(['BUSINESS_CENTRAL_INTEGRATION']);
    
    const syncSub = this.syncService.isSyncing$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      this.isSyncing = state;
      this.cdRef.detectChanges();
    });
    this._subscriptionArray.push(syncSub);
  }
}