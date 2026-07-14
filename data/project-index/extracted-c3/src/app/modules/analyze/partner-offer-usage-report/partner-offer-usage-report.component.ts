import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FileService } from 'src/app/services/file.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CommonService } from 'src/app/services/common.service';
import { PartnerOfferUsageReportService } from '../services/partner-offer-usage-report.service';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { CommonModule } from '@angular/common';
import _ from 'lodash';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { OrderByPipe } from "../../../shared/pipes/order-by.pipe";
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-partner-offer-usage-report',
  standalone: true,
  imports: [C3TableComponent, TranslateModule, FormsModule, CurrencyPipe, CommonModule, OrderByPipe,NgSelectModule,NgbModule,C3CommonModule],schemas:[CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './partner-offer-usage-report.component.html',
  styleUrl: './partner-offer-usage-report.component.scss'
})
export class PartnerOfferUsageReportComponent extends C3BaseComponent implements OnDestroy{
  datatableConfig: ADTSettings| any;
  isEditing: boolean[] = [];
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('createCol') createCol: TemplateRef<any>;
  @ViewChild('cost') cost: TemplateRef<any>;
  @ViewChild('usageDate') usageDate: TemplateRef<any>;

  


  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  BillingPeriodId: any;
  billingPeriodId: any = '';
  BillingPeriods: any = [];
  searchcriteria: any = [];
  totalCost: any = 0;
  CurrencySymbol: any;
  CurrencyDecimalPlaces: any;
  CurrencyThousandSeparator: any;
  CurrencyDecimalSeparator: any;
  currentC3CustomerId: null;
  customers: any = [];
  globalDateFormat: any;

  constructor(
    private partnerOfferUsageReportService: PartnerOfferUsageReportService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public router: Router,
    private fileService: FileService,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private commonService: CommonService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private currencyPipe: CurrencyPipe

  ) { super(permissionService, dynamicTemplateService, router, _appService) }

  ngOnInit(): void {
    this.handleTableConfig();
    this.getBillingPeriods();
    this.getCustomers();
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.MENU_PARTNER_OFFER_USAGE_REPORT"),true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'MENU_PARTNER_OFFER_USAGE_REPORT']);
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        order:[6,'desc'],
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, PageSize, CustomerName } =
            mapParamsWithApi(dataTablesParameters);
          this.searchcriteria = {
            EntityName: this.commonService.entityName,
            RecordId: this.commonService.recordId,
            StartInd,
            SortColumn,
            SortOrder,
            PageSize,
            BillingPeriodId: this.billingPeriodId,
            CustomerC3Id: CustomerName ? CustomerName : null
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.partnerOfferUsageReportService
            .getpartnerUsageReport(this.searchcriteria, this.commonService.entityName, this.commonService.recordId).pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
              }
              if (Data !== null && Data.length > 0) {
                this.totalCost = Data[0].TotalCost;
                this.CurrencySymbol = Data[0].CurrencySymbol;
                this.CurrencyDecimalPlaces = Data[0].CurrencyDecimalPlaces;
                this.CurrencyThousandSeparator = Data[0].CurrencyThousandSeparator;
                this.CurrencyDecimalSeparator = Data[0].CurrencyDecimalSeparator;
              } else {
                this.totalCost = 0;
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
            className: 'col-lg-2 pe-2',
            title: this.translateService.instant('TRANSLATE.PARTNER_PRODUCT_USAGE_REPORT_TITLE_CUSTOMER_NAME'),
            data: 'CustomerName',
            selectable: true,
            optionsArray: this.customers,
            render : function(data:any, type:any, row:any){
              return `<span class="fw-semibold">${data}</span>`;
            }
          },
          {
            className: 'col-lg-2 pe-2',
            orderable: false,
            title: this.translateService.instant('TRANSLATE.PARTNER_PRODUCT_USAGE_REPORT_TITLE_PRODUCT_NAME'),
            data: 'ProductName'
          },
          {
            className: 'col-lg-1 pe-2',
            orderable: false,
            title: this.translateService.instant('TRANSLATE.PARTNER_PRODUCT_USAGE_REPORT_TITLE_PRODUCT_ID'),
            data: 'ProductId',
          },
          {
            className: 'col-lg-1 text-end pe-5',
            orderable: true,
            title: this.translateService.instant('TRANSLATE.PARTNER_PRODUCT_USAGE_REPORT_TITLE_UNITS'),
            data: 'Units'
          },
          {
            className: 'col-lg-1 pe-2',
            orderable: false,
            title: this.translateService.instant('TRANSLATE.PARTNER_PRODUCT_USAGE_REPORT_TITLE_UNIT_OF_MEASURE'),
            data: 'UnitOfMeasure',
          },
          {
            className: 'col-lg-1 pe-2',
            orderable: false,
            title: this.translateService.instant('TRANSLATE.PARTNER_PRODUCT_USAGE_REPORT_TITLE_DESCRIPTION'),
            data: 'Description',
          },
          {
            orderable: true,
            className: 'col-lg-1 pe-2 body-action-alignment',
            title: this.translateService.instant('TRANSLATE.PARTNER_PRODUCT_USAGE_REPORT_TITLE_USAGE_DATE'),
            data:'UsageDate',
            ngTemplateRef: {
              ref: this.usageDate,
              context: {
              },
            },
          },
          {
            orderable: true,
            title: this.translateService.instant('TRANSLATE.PARTNER_PRODUCT_USAGE_REPORT_TITLE_COST_TO_CUSTOMER'),
            data:'CostToCustomer',
            className: 'col-lg-1 pe-2 text-end',
            render : function(data:any, type:any, row:any){
              return `<span class="text-end d-block fw-bold">${self.currencyPipe.transform(data)}</span>`
            },
            defaultContent: '',
            ngTemplateRef: {
              ref: this.cost,
            },
          },
          {
            className: 'col-lg-1 pe-2',
            orderable: false,
            title: this.translateService.instant('TRANSLATE.PARTNER_PRODUCT_USAGE_REPORT_TITLE_CURRENCY_CODE'),
            data: 'CurrencyCode',
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  exportUsageReport() {
    const searchcriteria = this.searchcriteria
    searchcriteria.PageSize = 10000000;
    searchcriteria.StartInd = 0;
    searchcriteria.SortColumn = 'UsageDate';
    searchcriteria.SortOrder = 'DESC';
    this.fileService.getFile(`reports/${this.commonService.entityName}/${this.commonService.recordId}/partner/usage/export`, true, searchcriteria)
  }

  getBillingPeriods() {    
    this.BillingPeriods = [];
    const subscription = this.partnerOfferUsageReportService.getBillingPeriods().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.BillingPeriods = response.Data;
    })
    this._subscriptionArray.push(subscription);
  };

  reloadData() {
    this.reloadEvent.emit(true)
  }

  getCustomers() {
    this.customers = [{ "id": "", "name": ((this.translateService.instant("TRANSLATE.PARTNER_OFFER_USAGE_REPORT_ALL_CUSTOMERS_TEXT"))) }];
    this.currentC3CustomerId = null;
    const subscription = this.partnerOfferUsageReportService.getCustomers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let customers = response.Data; 
      if (customers !== undefined && customers !== null && customers.length > 0) {
        _.map(customers, (x) => {
          if (!_.find(this.customers, { 'id': x.C3Id })) {
            this.customers.push({ "id": x.C3Id, "name": x.Name });
          }
        });
      }
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
