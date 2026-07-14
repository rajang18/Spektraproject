import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { UploadUsageReportService } from '../../../services/upload-usage-report.service';
import { TranslateService } from '@ngx-translate/core';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CommonService } from 'src/app/services/common.service';
import { FileService } from 'src/app/services/file.service';
import { CustomersDetails } from '../../../models/upload-usage-report.model';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-upload-usage-report-history-listing',
  templateUrl: './upload-usage-report-history-listing.component.html',
  styleUrl: './upload-usage-report-history-listing.component.scss',
  providers: [C3DatePipe],
})
export class UploadUsageReportHistoryListingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: any;
  billingPeriods: any[] = [];
  billingPeriodId: number;
  download = false;
  customers: any[] = [];
  currentC3CustomerId = null;
  provider = "Microsoft";
  customersList: { id: string, name: string }[] = [];
  c3CustomerId: string = null;
  @ViewChild('costonpartner') costonpartner: TemplateRef<any>;
  @ViewChild('usagedate') usagedate: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  globalDateFormat: string;
  dropdownVisible = false;

  constructor(
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _uploadUsageReportSevice: UploadUsageReportService,
    private cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    private _common: CommonService,
    private _fileService: FileService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.REPORT_PARTNER_OFFERS_USAGE_VIEW_UPLOAD_HISTORY_HEADER"), true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_PARTNER_UPLOAD', 'MENU_BREADCRUMB_BUTTON_TEXT_REPORT_USAGE', 'REPORT_PARTNER_OFFERS_USAGE_VIEW_UPLOAD_HISTORY_HEADER']);
  }
  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    let isNextMonthRequired = this._appService.$rootScope.IsCustomBilling == "true";
    let categoeries: any = null;
    let isNextMonthRequiredDueToCustomBilling = this._appService.$rootScope.IsCustomBilling == "true";
    const subscription = this._uploadUsageReportSevice.getBillingPeriod(isNextMonthRequired, categoeries, isNextMonthRequiredDueToCustomBilling).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.billingPeriods = res.Data;
      this.billingPeriods = this.billingPeriods.sort((a, b) => b.BillingPeriodId - a.BillingPeriodId);
      this.billingPeriodId = this.billingPeriods[0].BillingPeriodId;
      this.getCustomers();
    })
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, CustomerName, ProductName } =
            mapParamsWithApi(dataTablesParameters);
          if (this.download) {
            let reqBody: any = {
              StartInd, SortColumn, SortOrder, PageSize,
              EntityName: this._common.entityName,
              RecordId: this._common.recordId,
              BillingPeriodId: this.billingPeriodId,
              CustomerC3Id: CustomerName,
              ProductName: ProductName,
            }
            this._fileService.getFile(`reports/exportUsageUploadHistory?v=${(new Date()).getTime()}`, true, reqBody);
            this.download = false;
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._uploadUsageReportSevice
            .getUsageHistoryReport({
              StartInd, SortColumn, SortOrder, PageSize,
              EntityName: this._common.entityName,
              RecordId: this._common.recordId,
              BillingPeriodId: this.billingPeriodId,
              CustomerC3Id: CustomerName,
              ProductName: ProductName,
            })
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_CUSTOMER_ID'),
            data: 'CustomerId',
            orderable: false,
            className: 'col-md-2',
            render: (data: string) => {
              return `<span class='fw-semibold'>${data}</span>`
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_PRODUCT_ID'),
            data: 'ProductId',
            orderable: false,
            className: 'col-md-2'
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_CUSTOMER_NAME'),
            data: 'CustomerName',
            className: 'col-md-2 text-nowrap',
            selectable: true,
            optionsArray:
              this.customersList,
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_PRODUCT_NAME'),
            data: 'ProductName',
            className: 'col-md-1 text-nowrap',
            searchable: true
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_UNITS'),
            data: 'Units',
            className: 'col-md-1 text-nowrap text-end pe-3',
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_UNIT_OF_MEASURE'),
            data: 'UnitOfMeasure',
            className: 'col-md-1',
            orderable: false
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_COST_ON_PARTNER'), defaultContent: '',
            type: 'string',
            data: 'CostToPartner',
            className: 'col-md-1 text-end pe-3',
            ngTemplateRef: {
              ref: this.costonpartner,
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_CURRENCY_CODE'), data: 'CurrencyCode',
            className: 'col-md-1',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.REPORT_USAGE_STATUS_TABLE_HEADER_USAGE_DATE'), defaultContent: '',
            type: 'string',
            data: 'UsageDate',
            className: 'col-md-2',
            ngTemplateRef: {
              ref: this.usagedate,
            },
          },
        ],
        order: [8, 'desc']
      };
      this.cdRef.detectChanges();
    });
  }

  reload() {
    this.dropdownVisible = false;
    this.reloadEvent.emit(true);
  }

  downloadUsageHistory() {
    this.download = true;
    this.reloadEvent.emit(true);
  }

  getCustomers() {
    this.customers = [];
    this.currentC3CustomerId = null;
    const subscription  = this._uploadUsageReportSevice.getActiveCustomers(this.provider).pipe(takeUntil(this.destroy$)).subscribe(res => {
      var customers = res;
      if (customers !== undefined && customers !== null && customers.length > 0) {
        this.customers = this.getUniqueCustomers(customers);
      }
      this.getCustomersForFilter(customers);
      this.customers = this.customers.sort((a, b) => a.Name.localeCompare(b.Name));
      setTimeout(() => {
        this.cdRef.detectChanges();
      }, 200)
    })
    this._subscriptionArray.push(subscription);

  }

  getUniqueCustomers(customers: CustomersDetails[]) {
    const uniqueNames = new Set();
    return customers.filter(customer => {
      if (uniqueNames.has(customer.Name)) {
        return false;
      } else {
        uniqueNames.add(customer.Name);
        return true;
      }
    });
  }

  getCustomersForFilter(customers: CustomersDetails[]) {
    this.customersList = [{ "id": "", "name": this._translateService.instant('TRANSLATE.PARTNER_OFFER_USAGE_REPORT_ALL_CUSTOMERS_TEXT') }];
    this.c3CustomerId = null;
    customers = customers.sort((a, b) => a.Name.localeCompare(b.Name));
    if (customers && customers.length > 0) {
      customers.forEach(customer => {
        if (!this.customersList.find(c => c.id === customer.C3Id)) {
          this.customersList.push({ id: customer.C3Id, name: customer.Name });
        }
      });
    }
    this.handleTableConfig();
  }

  checkBillingPeriodChange(periodData: any) {
    if (periodData) {
      this.billingPeriodId = periodData?.BillingPeriodId;
    } else {
      this.billingPeriodId = null;
    }
    this.reload();
  }

  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
  }

  closeDropdown(){
    this.dropdownVisible = false;
  }

  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}