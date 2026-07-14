import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CommissionreportService } from '../../services/commissionreport.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { SearchCriteriaForEarningReport } from '../../models/commission.model';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-earning-report',
  templateUrl: './earning-report.component.html',
  styleUrl: './earning-report.component.scss',
  providers: [C3DatePipe],
})
export class EarningReportComponent extends C3BaseComponent implements OnInit, OnDestroy {

  searchCriteriaForEarning: SearchCriteriaForEarningReport = new SearchCriteriaForEarningReport();
  datatableConfig: ADTSettings;

  billingPeriodId: number;
  agentName:string|null;
  spCode:string|null;
  billingPeriods: any[] = []
  dropdownVisible = false;
  globalDateFormat:any;

  @ViewChild('commissionamount') commissionamount: TemplateRef<any>;
  
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _commissionService: CommissionreportService,
    private _common: CommonService,
    private _pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private datePipe: DatePipe,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
  }

  ngOnInit(): void {
    const subscription = this._common.getBillingPeriods().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.billingPeriods = res.Data;
      this.billingPeriods = this.billingPeriods.sort((a, b) => b.BillingPeriodId - a.BillingPeriodId);
      this.searchCriteriaForEarning.BillingPeriodId = this.billingPeriods[0].BillingPeriodId;
      this.handleTableConfig();
      this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.COMMISSION_REPORTS_TAB_NAME_EARNINGS_REPORT"),true);
      this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'COMMISSION_REPORTS_TAB_NAME_EARNINGS_REPORT']);
      this.globalDateFormat = this._appService.$rootScope.dateFormat;
    })
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, PageSize, AgentName,SPCode } =
            mapParamsWithApi(dataTablesParameters);
          this.searchCriteriaForEarning.EntityName = this._common.entityName;
          this.searchCriteriaForEarning.RecordId = this._common.recordId;
          this.searchCriteriaForEarning.AgentName = AgentName;
          this.searchCriteriaForEarning.SPCode = SPCode
          this.searchCriteriaForEarning.StartInd = StartInd;
          this.searchCriteriaForEarning.PageSize = PageSize;
          this.searchCriteriaForEarning.SortColumn = SortColumn;
          this.searchCriteriaForEarning.SortOrder = SortOrder;
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._commissionService
            .getEarningReport(this.searchCriteriaForEarning).pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => {
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
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_EARNING_DETAILS_TABLE_HEADER_TEXT_AGENT_NAME'),
            className: 'col-md-3 p-0',
            data: 'AgentName',
            searchable: true,
            render : function(data:any, type:any){
              return `<span class="fw-semibold">${data}</span>`
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_EARNING_DETAILS_TABLE_HEADER_TEXT_SP_CODE'),
            className: 'col-md-3',
            data: 'SPCode',
            searchable: true
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_EARNING_DETAILS_TABLE_HEADER_TEXT_CURRENCY_CODE'),
            data: 'CurrencyCode',
            className: 'col-md-3',
            orderable: false
          },
          {
            title: this._translateService.instant('TRANSLATE.PRODUCT_COMMISSION_EARNING_DETAILS_TABLE_HEADER_TEXT_COMMISSION_AMOUNT'),
            className: 'col-md-3 text-end',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.commissionamount,
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


  reload() {
    this.reloadEvent.emit(true);
  }

  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
  }
  billingPeriodDropDownClickOutside() {
    this.dropdownVisible = false;
  }

  getSelectedOptionText(): string {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    var datePipe = new C3DatePipe(this._appService); 
    const selectedOption = this.billingPeriods.find(option => option.BillingPeriodId === this.searchCriteriaForEarning.BillingPeriodId);
    let billingStartDate = datePipe.transform(
      selectedOption.BillingStartDate
    );
    let billingEndDate = this.datePipe.transform( 
      selectedOption.BillingEndDate
    );
    //billingStartDate = billingStartDate?.includes(' ') ? billingStartDate.split(' ')[0] : billingStartDate;
    //billingEndDate = billingEndDate?.includes(' ') ? billingEndDate.split(' ')[0] : billingEndDate;
    return selectedOption ? `${ billingStartDate } - ${ billingEndDate } (${selectedOption.BillingId})` : 'Select an option';
}


  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
