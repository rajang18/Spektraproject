import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { CustomerReportsService } from 'src/app/modules/partner/customers/services/customer-reports.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { productSearchModel } from '../../model/customer-reports.model';
import { FileService } from 'src/app/services/file.service';
import { CommonService } from 'src/app/services/common.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';

@Component({
  selector: 'app-purchased-products-reports',
  templateUrl: './purchased-products-reports.component.html',
  styleUrl: './purchased-products-reports.component.scss',
})
export class PurchasedProductsReportsComponent extends C3BaseComponent {
  datatableConfig: ADTSettings | any;
  customerImpersonateConfig: ADTSettings;
  isEditing: boolean[] = [];
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  SearchCriteria: productSearchModel = new productSearchModel();
  tablePurchasedProductForReport: any;
  maxQuantity: any = null;
  minQuantity: any = null;
  expireInDays: any = null;
  OrderEndDate: any = null;
  @ViewChild('ExpiresOn') ExpiresOn: TemplateRef<any>;
  @ViewChild('OrderedOn') OrderedOn: TemplateRef<any>;
  @ViewChild('ProductName') productName: TemplateRef<any>;
  today: Date = new Date();
  todayDate: NgbDateStruct = {
    year: this.today.getFullYear(),
    month: this.today.getMonth() + 1,
    day: this.today.getDate()
  }
  isGFilterExpand: boolean = false;
  isLFilterExpand: boolean = false;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    private CustomerReportsService: CustomerReportsService,
    private translateService: TranslateService,
    private _fileService: FileService,
    private _commonService: CommonService,
    private pageInfo: PageInfoService,
    public _appSettingsService:AppSettingsService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService


  ) { 
    super(_permissionService, _dynamicTemplateService, _router, _appSettingsService)
  }

  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.handleTableConfig();
    this.pageInfo.updateTitle(this.translateService.instant("MENU_REPORTS_FOR_CUSTOMER"),true);
    this.pageInfo.updateBreadcrumbs(['MENU_REPORTS_FOR_CUSTOMER']);
  }


  graphFilterExpand() {
    this.isGFilterExpand = !this.isGFilterExpand;
  }

  handleTableConfig() {
    this.datatableConfig = null;
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount ||  10),
        order: [1, 'desc'],
        ADTSettings: {
          enableEscapeHTML: true
        },
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.CustomerReportsService.getList({
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            PageSize: PageSize,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            StartInd: StartInd,
            OrderEndDate: new Date(
              `${this.OrderEndDate?.day}-${this.OrderEndDate?.month}-${this.OrderEndDate?.year}`
            ),
            MinQuantity: this.minQuantity,
            MaxQuantity: this.maxQuantity,
            ExpireInDays: this.expireInDays,
          }).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            if (Data.length > 0) {
              [{ TotalRows: recordsTotal }] = Data;
            }

            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
          });
          this._subscriptionArray.push(subscription);
        },

        columns: [
          {
            title: this.translateService.instant('TRANSLATE.PURCHASED_PRODUCTS_REPORT_TABLE_TITLE_PRODUCT_NAME'),
            data: 'ProductName',
            className: 'col-md-3',
            ngTemplateRef: {
              ref: this.productName,
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.PURCHASED_PRODUCTS_REPORT_TABLE_TITLE_ORDERED_ON'),
            data: 'OrderedOn',
            defaultContent: '',
            type: 'string',
            className: 'col-md-3 ',
            ngTemplateRef: {
              ref: this.OrderedOn,
            },
          },

          {
            title: this.translateService.instant('TRANSLATE.PURCHASED_PRODUCTS_REPORT_TABLE_TITLE_RENEWS_ON'),
            data: 'ExpiresOn',
            defaultContent: '',
            type: 'string',
            className: 'col-md-3 ',
            ngTemplateRef: {
              ref: this.ExpiresOn,
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.PURCHASED_PRODUCTS_REPORT_TABLE_TITLE_QUANTITY'),
            data: 'Quantity',
            className: 'col-md-1 text-end pe-8',
          },
          {
            title: this.translateService.instant('TRANSLATE.PURCHASED_PRODUCTS_REPORT_TABLE_TITLE_STATUS'),
            orderable: false,
            data: 'Status',
            className: 'col-md-2 text-center',
            render: (data: string, type: any, row: any, meta: any) => {
              // Check the value of Status and return the formatted HTML
              let statusHTML = '';
              if (data.toLowerCase() === 'active') {
                statusHTML = '<div class="p-2 mb-2 badge badge-light-success">' + data + '</div>';
              } else {
                statusHTML = '<div class="p-2 mb-2 badge badge-secondary">' + data + '</div>';
              }
              return statusHTML;
            }
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }
  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }

  exportToExcel() {
    this._fileService.getFile(
      'analytics/DownloadPurchasedProductsReport',
      true
    );
  }

  resetSearchCriteria() {
    this.minQuantity = null;
    this.maxQuantity = null;
    this.OrderEndDate = null;
    this.expireInDays = null;
    this.reloadEvent.emit(true);
  }

  searchProducts() {
    this.reloadEvent.emit(true);
  }

  ngOnDestroy(){
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
