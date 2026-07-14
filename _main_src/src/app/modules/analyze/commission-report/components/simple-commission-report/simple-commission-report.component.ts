import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { TranslateService } from '@ngx-translate/core';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ActiveCustomersDetails, ActiveDepartments, ActiveSites, SearchCriteria } from '../../models/commission.model';
import { CommissionreportService } from '../../services/commissionreport.service';
import { CommonService } from 'src/app/services/common.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';
@Component({
  selector: 'app-simple-commission-report',
  templateUrl: './simple-commission-report.component.html',
  styleUrl: './simple-commission-report.component.scss'
})
export class SimpleCommissionReportComponent extends C3BaseComponent implements OnInit,OnDestroy {
  datatableConfig: ADTSettings | any;
  searchCriteriaForSimpleCommssion: SearchCriteria = new SearchCriteria();
  filtersExpanded = false;
  customers: ActiveCustomersDetails[] = [];
  sites: ActiveSites[] = [];
  departments: ActiveDepartments[] = [];
  selectedCustomerC3Id: string | null= null;
  selectedSiteC3Id: string | null= null;
  selectedSiteDepartmentC3Id: string | null = null;

  toolbarButtonMarginClass = 'ms-1 ms-lg-3';
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  toolbarButtonIconSizeClass = 'svg-icon-1';

  @ViewChild('commissionstartdate') commissionstartdate: TemplateRef<any>;
  @ViewChild('commissionendate') commissionendate: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _commissionService: CommissionreportService,
    private _common: CommonService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
  }

  ngOnInit(): void {
    this.handleTableConfig();
    const subscription = this._common.getCustomers().pipe(takeUntil(this.destroy$)).subscribe((responses: any) => {
      this.customers = responses.Data
      this.cdRef.detectChanges();
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.SIDEBAR_TITLE_MENU_PARTNER_COMMISSION_REPORT"),true);
      this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'SIDEBAR_TITLE_MENU_PARTNER_COMMISSION_REPORT']);
    })
    this._subscriptionArray.push(subscription);
  }
  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ADTSettings: {
          enableEscapeHTML: true
        },
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, PageSize, CustomerName, AgentName, SPCode } =
            mapParamsWithApi(dataTablesParameters);
          this.searchCriteriaForSimpleCommssion.EntityName = this._common.entityName;
          this.searchCriteriaForSimpleCommssion.RecordId = this._common.recordId;
          this.searchCriteriaForSimpleCommssion.CustomerName = CustomerName;
          this.searchCriteriaForSimpleCommssion.AgentName = AgentName;
          this.searchCriteriaForSimpleCommssion.SPCode = SPCode;
          this.searchCriteriaForSimpleCommssion.StartInd = StartInd;
          this.searchCriteriaForSimpleCommssion.PageSize = PageSize;
          this.searchCriteriaForSimpleCommssion.SortColumn = SortColumn;
          this.searchCriteriaForSimpleCommssion.SortOrder = SortOrder;
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._commissionService
            .getSimpleCommissionReport(this.searchCriteriaForSimpleCommssion).pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              this.applyEscapeHTML(Data);
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
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_DETAILS_TABLE_HEADER_TEXT_CUSTOMER_NAME'),
            className: 'col-md-2 pe-2',
            data: 'CustomerName',
            searchable: true,
            render: (data: string, type: any, row: any, meta: any) => {
              return `<span class="fw-semibold">${data}</span>`
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_DETAILS_TABLE_HEADER_TEXT_PRODUCT_NAME'),
            className: 'col-md-2 pe-2',
            data: 'ProductName',
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_DETAILS_TABLE_HEADER_TEXT_PROVIDER_SUBSCRIPTION_ID'),
            data: 'ProviderProductId',
            className: 'col-md-2 pe-2',
            orderable: false
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_DETAILS_TABLE_HEADER_TEXT_INTERNAL_PRODUCT_ID'),
            className: 'col-md-1 pe-2',
            data: 'CustomerProductId',
            orderable: false
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_DETAILS_TABLE_HEADER_TEXT_AGENT_NAME'),
            className: 'col-md-1 pe-2',
            data: 'AgentName'
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_DETAILS_TABLE_HEADER_TEXT_SP_CODE'),
            className: 'col-md-1 text-end pe-2',
            data: 'SPCode'
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_DETAILS_TABLE_HEADER_TEXT_COMMISSION_PERCENTAGE'),
            className: 'col-md-1 text-end pe-2',
            data: 'CommissionPercentage'
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_DETAILS_TABLE_HEADER_TEXT_COMMISSION_START_DATE'),
            className: 'col-md-1 pe-2',
            defaultContent: '',
            data:'CommissionStartDate',
            ngTemplateRef: {
              ref: this.commissionstartdate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_DETAILS_TABLE_HEADER_TEXT_COMMISSION_END_DATE'),
            className: 'col-md-1 text-start pe-2',
            defaultContent: '',
            data:'CommissionEndDate',
            ngTemplateRef: {
              ref: this.commissionendate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  onCaptureEvent(event: Event) { }

  toggleFilters() {
    this.filtersExpanded = !this.filtersExpanded;
  }

  onCustomerChange() {
    if (this.selectedCustomerC3Id !== null) {
      let reqBody = { EntityName: "Customer", RecordId: this.selectedCustomerC3Id }
      const subscription = this._commissionService.getSiteById(reqBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        this.sites = res.Data;
        this.cdRef.detectChanges();
      })
      this._subscriptionArray.push(subscription);
    }
    else {
      this.selectedCustomerC3Id = null;
      this.selectedSiteC3Id = null;
      this.selectedSiteDepartmentC3Id = null;
      this.sites = [];
      this.departments = [];
    }
  }

  onSiteChange() {
    if (this.selectedSiteC3Id !== null) {
      const subscription = this._common.getSiteDepartments(this.selectedSiteC3Id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        this.departments = res.Data;
        this.cdRef.detectChanges();
      })
      this._subscriptionArray.push(subscription);
    }
    else {
      this.selectedSiteC3Id = null;
      this.selectedSiteDepartmentC3Id = null;
      this.departments = [];
    }
  }

  searchCommissionReportList() {
    this.searchCriteriaForSimpleCommssion.CustomerC3Id = this.selectedCustomerC3Id;
    this.searchCriteriaForSimpleCommssion.SiteC3Id = this.selectedSiteC3Id;
    this.searchCriteriaForSimpleCommssion.SiteDepartmentC3Id = this.selectedSiteDepartmentC3Id;
    this.reloadEvent.emit(true);
  }

  resetSearchCriteria() {
    this.searchCriteriaForSimpleCommssion = new SearchCriteria();
    this.sites = [];
    this.departments = [];
    this.selectedCustomerC3Id = null;
    this.selectedSiteC3Id = null;
    this.selectedSiteDepartmentC3Id = null;
    this.reloadEvent.emit(true);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}