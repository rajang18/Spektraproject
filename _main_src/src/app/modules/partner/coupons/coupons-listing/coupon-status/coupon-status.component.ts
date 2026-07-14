
import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TranslationService } from 'src/app/modules/i18n';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import {CouponStatusService} from 'src/app/modules/partner/coupons/services/coupon-status.service'
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';


@Component({
  selector: 'app-coupon-status',
  templateUrl: './coupon-status.component.html',
  styleUrl: './coupon-status.component.scss'
})
export class CouponStatusComponent {

  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  datatableConfig:ADTSettings;
  _subscription:Subscription;
  entityName: any;
  globalDateFormat = null;
  @ViewChild('expireson') expireson: TemplateRef<any>;
  destroy$ = new Subject<void>();

  constructor(
    // service
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private translationService: TranslationService,
    private couponStatusService:CouponStatusService,
    public pageInfo: PageInfoService,
    private _commonService: CommonService,
    private _appService: AppSettingsService,
  ){



  }

  ngOnInit(): void{
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.translationService.setLanguage(this.translationService.getSelectedLanguage());
    this.handleTableConfig();
    this.entityName =this._commonService.entityName;

    if(this._commonService.entityName === 'Partner' ) {
      this.pageInfo.updateTitle(this.translateService.instant("COUPONS_STATUS_TAB_HEADING_TEXT_COUPONS_STATUS"),true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT','MENU_PARTNER_COUPON']);
    }
    else if(this._commonService.entityName === 'Reseller'){
      this.pageInfo.updateTitle(this.translateService.instant("COUPONS_STATUS_TAB_HEADING_TEXT_COUPONS_STATUS"),true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','MENU_PARTNER_COUPON']);
    }
  }


  handleTableConfig() { 
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        // remove sorting
        ordering:false, 
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          let { StartInd, Name, SortColumn, SortOrder, CustomerName, PageSize } =
            mapParamsWithApi(dataTablesParameters);

            // well when u clear the space the customer name goes as ''
            // sp doesnt have ISNULL(@somevar,'') <> '' instead of checking is not null
            if(CustomerName == undefined || CustomerName == ''){
              CustomerName = null;
            }
            this._subscription && this._subscription?.unsubscribe();
            this._subscription = this.couponStatusService.getList(StartInd, CustomerName, SortColumn, SortOrder, PageSize).pipe(takeUntil(this.destroy$)).
            subscribe(({ Data }: any) => {
              let recordsTotal = 0; 
              
              if(Data.length > 0){
                [{ TotalRows: recordsTotal }] = Data ;
              }

              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            })
        },
         columns:[
            {
              className:'col-lg-3 ',
              title:this.translateService.instant('TRANSLATE.COUPON_STATUS_TABLE_HEADER_TEXT_CUSTOMER_NAME'),
              data:"CustomerName",
              searchable : true,
              defaultContent: '',
              orderable: false,
              render: function (data: any, type: any, row: any) {
                return `<span class="fw-semibold">${data}</span>`;
              }
            }, 
            {
              className:'col-lg-3',
              title:this.translateService.instant('TRANSLATE.COUPON_STATUS_TABLE_HEADER_TEXT_COUPON_NAME'),
              data:"CouponName",
              defaultContent: '',
              orderable: false,
              searchable:false,
            },
            {
              className:'col-lg-2',
              title:this.translateService.instant('TRANSLATE.COUPON_STATUS_TABLE_HEADER_TEXT_COUPON_CODE'),
              data:"CouponCode",
              defaultContent: '',
              orderable: false,
              searchable:false,
            },
            {
              className:'col-lg-2',
              title:this.translateService.instant('TRANSLATE.COUPON_STATUS_TABLE_HEADER_TEXT_PLAN_NAME'),
              data:"PlanName",
              defaultContent: '',
              orderable: false,
              searchable:false,
            },
            {
              className:'col-lg-2',
              title:this.translateService.instant('TRANSLATE.COUPON_STATUS_TABLE_HEADER_TEXT_EXPIRE_ON'),
              data:"ExpiresOn",
              defaultContent: '',
              orderable: false,
              searchable:false,
              type: 'string',
              ngTemplateRef: {
                ref: this.expireson,
              }
            }
         ],
      };
      this.cdRef.detectChanges();
    });
  }

  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {

  }
  
   ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe();
   }


}
