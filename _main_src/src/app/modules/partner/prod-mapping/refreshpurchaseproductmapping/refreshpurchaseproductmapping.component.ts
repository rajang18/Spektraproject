import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router'; 
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service'; 
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service'; 
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ProductMappingService } from '../services/productmapping.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { ToastService } from 'src/app/services/toast.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-refreshpurchaseproductmapping',
  templateUrl: './refreshpurchaseproductmapping.component.html',
  styleUrl: './refreshpurchaseproductmapping.component.scss'
})
export class RefreshpurchaseproductmappingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  EntityName: string;
  activeServiceDetail: any;
  isManualContractMapping: boolean = false;
  isRefreshInprocess: boolean = true;
  isDataLoaded: boolean = true;
  lastRefreshedOn: number;
  timerHandleForBulkRefreshPSA: any = null;
  @ViewChild('actionHeader') actionHeader: TemplateRef<any>;

  constructor( 
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    private _translateService:TranslateService,
    public _permissionService: PermissionService,
    public notifierService: NotifierService,
    private _pageInfo:PageInfoService,
    private toastService:ToastService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appSettings: AppSettingsService,
    _commonService: CommonService,
    private _productMappingService: ProductMappingService,
    public c3RouterService: C3RouterService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appSettings);
    this.EntityName = _commonService.entityName;
    this._productMappingService.refreshStatus(true);
  }

  ngOnInit(): void {
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE','CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'])
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"), true);
    const subscription = this._productMappingService.isRefreshInprocess$.pipe(takeUntil(this.destroy$)).subscribe(res=>{
      if( this.isRefreshInprocess != res){
        this.isRefreshInprocess = res;
      }  
      this.isDataLoaded = this._productMappingService.isFirstTime;
      this.lastRefreshedOn = this._productMappingService.lastRefreshedOn;
    });

    this._subscriptionArray.push(subscription);
    this._productMappingService.refreshStatus(true);
    this.getActiveServiceDetail();
    this.cdRef.detectChanges();
  }

  getActiveServiceDetail() {
    const subscription = this._appSettings.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.activeServiceDetail = response.Data;
      if (this.activeServiceDetail != undefined && this.activeServiceDetail != null) {
        if (this.activeServiceDetail.Name.toLowerCase() === "autotask") {
          this.getContractMappingType();
        }
        else {
          this.isManualContractMapping = true;
        }
      }
      this.cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }


  getContractMappingType() {
    const subscription =this._productMappingService.getContractMappingType().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let value = response.Data
      if (value?.toLowerCase() === this.translateService.instant('TRANSLATE.CONSTANT_FULL_AUTOMATIC_MAPPING')?.toLowerCase()) {
        this.isManualContractMapping = false;
      }
      else {
        this.isManualContractMapping = true;
      }
    })
    this._subscriptionArray.push(subscription);
  }

  onRefresh() {
    this._productMappingService.timerHandleForBulkRefreshPSA = null;
    const subscription = this._productMappingService.onRefresh().pipe(takeUntil(this.destroy$)).subscribe({
      next: (_: any) => {
        this.isRefreshInprocess = true;
        let msg1 = this.translateService.instant('TRANSLATE.EXTERNAL_DATA_SERVICE_LOCAL_ENTITY_REFRESH_TEXT');
        this.toastService.success(msg1);
        this._productMappingService.PollForLatestBatchStatus();
      }, error: (_) => {
        let titleText = this.translateService.instant('TRANSLATE.UPDATED_FAILED_C3_PSA_DATA_FAIL');
        let msg1 = this.translateService.instant('TRANSLATE.UPDATED_FAILED_C3_PSA_DATA_STATUS_MESSAGE');
        this.notifierService.alert({
          title: titleText, icon: 'error', text: msg1
        }).then((result: { isConfirmed: any, isDismissed: any }) => {
          if (result.isConfirmed) {
            this.isRefreshInprocess = false;
            this._productMappingService.StopPolling();
            this.actionHeaderLoader();
          }
        });
        this._productMappingService.StopPolling();
      }
    })
    this._subscriptionArray.push(subscription);
  }
  
  backToSubscriptionHistory(){
    this.c3RouterService.backToHistory(this.keyForData,'/partner/business/subscriptionhistory');
  }
 
ngOnDestroy(): void {
  super.ngOnDestroy();
}

}
