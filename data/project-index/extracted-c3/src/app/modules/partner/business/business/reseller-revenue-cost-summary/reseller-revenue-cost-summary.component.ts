
import {
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  EventEmitter,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { BuisnessService } from 'src/app/services/buisness.service';
//import { BusinessDetailsListingComponent } from './business-details/business-details-listing.component';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { ResellerDetailsRevenueCostSummaryComponent } from './reseller-details-revenue-cost-summary/reseller-details-revenue-cost-summary.component';
import { groupBy } from 'lodash';
import { NotifierService } from 'src/app/services/notifier.service';
import { FileService } from 'src/app/services/file.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
declare var $: any; // Import jQuery in Angular

@Component({
  selector: 'app-reseller-revenue-cost-summary',
  templateUrl: './reseller-revenue-cost-summary.component.html',
  styleUrl: './reseller-revenue-cost-summary.component.scss'
})
export class ResellerRevenueCostSummaryComponent extends C3BaseComponent implements OnInit {
   
  destroy$ = new Subject<void>();
  datatableConfig: ADTSettings | any;
  @ViewChild('SelectAggtype') SelectAggtype: TemplateRef<any>;
  @ViewChild('totalCostOnPartner') totalCostOnPartner: TemplateRef<any>;
  @ViewChild('totalBilledAmount') totalBilledAmount: TemplateRef<any>;
  @ViewChild('totalProfitAmount') totalProfitAmount: TemplateRef<any>;
  @ViewChild('totalCostOnReseller') totalCostOnReseller: TemplateRef<any>;
  @ViewChild('totalResellerBilledAmount') totalResellerBilledAmount: TemplateRef<any>;
  @ViewChild('totalResellerProfitAmount') totalResellerProfitAmount: TemplateRef<any>;
  selectedBillingPeriods: any = null;
  BillingPeriods: any = [];
  isCustomBilling: string = null;
  billingPeriodId: any = null;
  selectedBillingPeriodId = this.billingPeriodId;
  isDataExist: boolean = false;
  activePageSize: number = 10;
  dropdownVisible = false;
  dropdownVisibleAutocomplete = false;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  _subscriptionArray: Subscription[] = [];
  childTable: ElementRef;
  selectedAggType = "Customer";
  Aggtypes: any = [];
  ResellerProfitList: any = [];
  ResellerTypes: any = [];
  SelectedResellers: any = [];
  C3UserId = null;
  LoggedInUserName = null;
  defaultSelectedBillingPeriodIndex: number;
  TotalCostOnPartner = 0;
  TotalBilledAmount = 0;
  TotalProfitAmount = 0;
  TotalCostOnReseller = 0;
  TotalResellerBilledAmount = 0;
  TotalResellerProfitAmount = 0;
  TotalResellerProfitPercentage = 0;
  TotalProfitPercentage = 0;
  FinalResult = [];
  allData: any = [];
  filtersExpanded: boolean = false;
  // CurrencySymbol= "£";
  // CurrencyDecimalPlaces="2";
  // CurrencyDecimalSeperator= ".";
  // CurrencyThousandSeperator= ",";
  //SelectedAggtypes:any=null;
  currentAggType="Customer";
  globalDateFormat: any = '';


  constructor(
    private _cdRef: ChangeDetectorRef,
    private _buisnessService: BuisnessService,
    private renderer: Renderer2,
    private notifier: NotifierService,
    private resolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
    private translateService: TranslateService,
    public _router: Router,
    public common: CommonService,
    private _fileService: FileService,
    public clientSettingsService: ClientSettingsService,
    private pageInfo: PageInfoService,
    private appSettingService:AppSettingsService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,

  ) { 
    super(_permissionService, _dynamicTemplateService, _router, appSettingService);

    this.activePageSize = this.appSettingService.$rootScope.DefaultPageCount

  }

  ngOnInit(): void {
    this.globalDateFormat = this.appSettingService.$rootScope.dateFormat;
    const subscription = this.clientSettingsService.getData().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.isCustomBilling = Data.Data.IsCustomBilling.toLowerCase();
      //this.selectedBillingPeriodId = this.billingPeriodId;
      this.GetBillingPeriods();
      this.GetResellers();
      this.GetAggtypes();
     
      this.pageInfo.updateTitle(this.translateService.instant("CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"),true);
      this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS']);
    });
    this._subscriptionArray.push(subscription);
  }

  ResetFilters() {
    this.SelectedResellers = [];
    this.selectedAggType = "Customer";
    this.reloadGrid();
  }

  filterForm() {
    this.filtersExpanded = !this.filtersExpanded
  }

  GetResellers() {
    var dataFltr = [];
    var data = [
      { "id": 1, "Name": this.translateService.instant('TRANSLATE.SELECT_ALL_RESELLER'), "Value": null },
    ];
    if (this.ResellerProfitList && this.ResellerProfitList.length > 0) {
      this.ResellerProfitList.forEach((v, i) => {
        if (i == 0) {
          dataFltr.push(v.C3Id);
          data.push({ "id": i + 2, "Name": v.ResellerName, "Value": v.C3Id })
        }
        else if (dataFltr && !dataFltr.find(r => r == v.C3Id)) {
          dataFltr.push(v.C3Id);
          data.push({ "id": i + 2, "Name": v.ResellerName, "Value": v.C3Id })
        }
      })
    }
    this.ResellerTypes = data;
  };


  GetAggtypes() {
    let data = [
      { "id": 1, "Name": this.translateService.instant('TRANSLATE.REVENUE_AND_COST_SUMMARY_PROVIDER'), "Value": "Provider" },
      { "id": 2, "Name": this.translateService.instant('TRANSLATE.REVENUE_AND_COST_SUMMARY_CATEGORY'), "Value": "Category" },
      { "id": 3, "Name": this.translateService.instant('TRANSLATE.REVENUE_AND_COST_SUMMARY_SALETYPE'), "Value": "SaleType" },
      { "id": 4, "Name": this.translateService.instant('TRANSLATE.REVENUE_AND_COST_SUMMARY_CUSTOMER'), "Value": "Customer" }
    ];

    this.Aggtypes = data;
  };
  handleTableConfig() {
    this.ResellerProfitList.forEach(row => {
      this.Aggtypes.forEach(v => {
        $('#' + v.Value + row.InvoiceLineItemId + 'Sub' + row.Id).hide();
      })
    });
    // if (this.SelectedResellers && this.SelectedResellers.length > 0 && !this.SelectedResellers.find(v => v.Value == null)) {
    //   this.SelectedResellers.forEach(v => {
    //     this.SelectedResellers = this.SelectedResellers ? this.SelectedResellers + "," + v.Value : v.Value;
    //   })
    // }
    const self = this;
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: true,
        // dom: '<"clear">rt<"bottom"ip><"clear">',
        pageLength: this.activePageSize || 10,
        ADTSettings: {
          enableEscapeHTML: true
        },
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, length } =
            mapParamsWithApi(dataTablesParameters);
          const searchParams: any = {
            // PageSize: this.activePageSize || 10,
            RecordId: this.common.recordId,
            EntityName: this.common.entityName,
            BillingPeriodId:
              this.selectedBillingPeriodId ||
              this.billingPeriodId,
            SelectedResellers: this.SelectedResellers?.join(','),
            SelectedAggTypes: this.selectedAggType,
            LoggedInUserName: this.LoggedInUserName,
            C3UserId: null,
          };
          if(this.SelectedResellers && this.SelectedResellers.length > 0 && this.SelectedResellers.includes("")){
            searchParams.SelectedResellers = "";
          }
          if(this.SelectedResellers.length == 0){
            searchParams.SelectedResellers = "";
          }
          const subscription = this._buisnessService
            .GetResellerProfitFromDistributer(searchParams)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              this.applyEscapeHTML(Data);
              this.allData = Data;
              this.TotalCostOnPartner = 0;
              this.TotalBilledAmount = 0;
              this.TotalProfitAmount = 0;
              this.TotalCostOnReseller = 0;
              this.TotalResellerBilledAmount = 0;
              this.TotalResellerProfitAmount = 0;
              this.TotalResellerProfitPercentage = 0;
              this.TotalProfitPercentage = 0;

              let d = Data;
              this.ResellerProfitList = d;
              var result = null;
              if (this.selectedAggType == "Customer") {
                result = groupBy(this.ResellerProfitList, ({ C3Id }) => C3Id);
              }
              if (this.selectedAggType == "Provider") {
                result = groupBy(this.ResellerProfitList, ({ ProviderName }) => ProviderName);
              }
              if (this.selectedAggType == "SaleType") {
                result = groupBy(this.ResellerProfitList, ({ SaleType }) => SaleType);
              }
              if (this.selectedAggType == "Category") {
                result = groupBy(this.ResellerProfitList, ({ CategoryName }) => CategoryName);
              }
              this.FinalResult = [];
              Object.keys(result).forEach((key) => {
                this.FinalResult.push(result[key][0]);
              })
              this.FinalResult.forEach(v => {
                this.TotalCostOnPartner = this.TotalCostOnPartner + v.TotalCostOnPartner;
                this.TotalBilledAmount = this.TotalBilledAmount + v.TotalBilledAmount;
                this.TotalProfitAmount = this.TotalProfitAmount + v.TotalProfitAmount;
                this.TotalCostOnReseller = this.TotalCostOnReseller + v.TotalCostOnReseller;
                this.TotalResellerBilledAmount = this.TotalResellerBilledAmount + v.TotalResellerBilledAmount;
                this.TotalResellerProfitAmount = this.TotalResellerProfitAmount + v.TotalResellerProfitAmount;
              })
              this.TotalProfitPercentage = (this.TotalProfitAmount / this.TotalCostOnPartner) * 100;
              this.TotalResellerProfitPercentage = (this.TotalResellerProfitAmount / this.TotalCostOnReseller) * 100;
              //(revenue- cost/reveneue) * 100
              if (!this.SelectedResellers || this.SelectedResellers.length == 0) {
                this.GetResellers();
              }
              this._cdRef.detectChanges();
              let recordsTotal = 0;
              if (this.FinalResult.length > 0) {
                self.isDataExist = true;
                recordsTotal = this.FinalResult.length;
                let obj = {
                  TotalText: 'GRAND_TOTAL',
                  TotalCostOnPartner: this.TotalCostOnPartner,
                  TotalBilledAmount: this.TotalBilledAmount,
                  TotalProfitAmount:this.TotalProfitAmount,
                  TotalProfitPercentage:this.TotalProfitPercentage,
                  TotalCostOnReseller:this.TotalCostOnReseller,
                  TotalResellerBilledAmount:this.TotalResellerBilledAmount,
                  TotalResellerProfitAmount:this.TotalResellerProfitAmount,
                  TotalResellerProfitPercentage:this.TotalResellerProfitPercentage,
                  CurrencySymbol:Data[0].CurrencySymbol,
                  CurrencyDecimalPlaces: Data[0].CurrencyDecimalPlaces,
                  CurrencyThousandSeperator: Data[0].CurrencyThousandSeperator,
                  CurrencyDecimalSeperator: Data[0].CurrencyDecimalSeperator,
                }
                this.FinalResult.push(obj);
              } else {
                self.isDataExist = false;
              }
              callback({
                data: this.FinalResult,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        order: [1, 'asc'],
        columns: [
          {
            className: 'dt-control',
            orderable: false,
            data: null,
            defaultContent: '',
          },
          {
            className: 'col-md-2 text-lg-start',
            title: this.translateService.instant('TRANSLATE.RESELLER_PROFIT_DISTRIBUTOR_NAME'),
            type: "string",
            defaultContent: '',
            ngTemplateRef: {
              ref: this.SelectAggtype,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1 text-end pe-2',
            title: this.translateService.instant('TRANSLATE.RESELLER_PROFIT_COST_ON_PARTNER'),
           // data: 'TotalCostOnPartner'
           type: "number",
           defaultContent: '',
            ngTemplateRef: {
              ref: this.totalCostOnPartner,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-2 text-end pe-2',
            title: this.translateService.instant('TRANSLATE.RESELLER_PROFIT_BILLED_AMOUNT'),
           // data: 'TotalBilledAmount'
           type: "number",
           defaultContent: '',
           ngTemplateRef: {
             ref: this.totalBilledAmount,
             context: {
               // needed for capturing events inside <ng-template>
               captureEvents: self.onCaptureEvent.bind(self),
             },
           },

          },
          {
            className: 'col-md-1 text-end pe-2',
            title: this.translateService.instant('TRANSLATE.RESELLER_PROFIT_PROFIT_AMOUNT'),
           // data: 'TotalProfitAmount'
           type: "number",
           defaultContent: '',
           ngTemplateRef: {
             ref: this.totalProfitAmount,
             context: {
               // needed for capturing events inside <ng-template>
               captureEvents: self.onCaptureEvent.bind(self),
             },
           },

          },
          {
            sortable: false,
            className: 'col-md-1 text-end pe-2',
            title: this.translateService.instant('TRANSLATE.RESELLER_PROFIT_TABLE_HEADER_TEXT_PROFIT_PERCENTAGE'),
            data: 'TotalProfitPercentage',
            render: (data: string, type: any, row: any, meta: any) => {
              // Check the value of PaymentMethod and return the formatted HTML
              if (data) {
                if (parseFloat(data) > 0) {
                  return (
                    '<span class="text-success font-green-jungle"> <i class="text-success fa-solid fa-arrow-up"></i>' +
                    parseFloat(data).toFixed(2) +
                    '%</span>'
                  );
                } else if (parseFloat(data) < 0) {
                  return (
                    '<span class="text-danger font-red-sunglo"> <i class="text-danger fa-solid fa-arrow-down"></i>' +
                    parseFloat(data).toFixed(2) +
                    '%</span>'
                  );
                }
                return (
                  '<span class="text-primary">' +
                  parseFloat(data).toFixed(2) +
                  '%</span>'
                );
              } else {
                return data || '';
              }
            },
          },
          {
            className: 'col-md-1 text-end pe-2',
            title: this.translateService.instant('TRANSLATE.RESELLER_PROFIT_COST_ON_RESELLER'),
            //data: 'TotalCostOnReseller'
            type: "number",
            defaultContent: '',
            ngTemplateRef: {
              ref: this.totalCostOnReseller,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
       
          {
            className: 'col-md-2 text-end pe-2',
            title: this.translateService.instant('TRANSLATE.RESELLER_PROFIT_RESELLER_BILLED_AMOUNT'),
            //data: 'TotalResellerBilledAmount'
            type: "number",
            defaultContent: '',
            ngTemplateRef: {
              ref: this.totalResellerBilledAmount,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1 text-end pe-2',
            title: this.translateService.instant('TRANSLATE.RESELLER_PROFIT_TABLE_HEADER_TEXT_PROFIT'),
            //data: 'TotalResellerProfitAmount'
            type: "decimal",
            defaultContent: '',
            ngTemplateRef: {
              ref: this.totalResellerProfitAmount,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            sortable: false,
            className: 'col-md-1 text-end pe-2',
            title: this.translateService.instant('TRANSLATE.RESELLER_PROFIT_TABLE_HEADER_TEXT_RESELLER_PROFIT_PERCENTAGE'),
            data: 'TotalResellerProfitPercentage',
            render: (data: string, type: any, row: any, meta: any) => {
              // Check the value of PaymentMethod and return the formatted HTML
              if (data) {
                if (parseFloat(data) > 0) {
                  return (
                    '<span class="text-success font-green-jungle"> <i class="text-success fa-solid fa-arrow-up"></i>' +
                    parseFloat(data).toFixed(2) +
                    '%</span>'
                  );
                } else if (parseFloat(data) < 0) {
                  return (
                    '<span class="text-danger font-red-sunglo"> <i class="text-danger fa-solid fa-arrow-down"></i>' +
                    parseFloat(data).toFixed(2) +
                    '%</span>'
                  );
                }
                return (
                  '<span class="text-primary">' +
                  parseFloat(data).toFixed(2) +
                  '%</span>'
                );
              } else {
                return data || '' ;
              }
            },
          },
        ],
      };
      this._cdRef.detectChanges();
    })
  }

  ReloadTableData() {
    this.reloadEvent.emit(true);
  }

  onPageSizeChange(pageSize: number) {
    if (pageSize) this.activePageSize = pageSize;
    this.reloadGrid()
  }

  onTableReady(table: ElementRef) {
    this.childTable = table;
    //litsen click event
    this.renderer.listen(this.childTable.nativeElement, 'click', (event) => {
      if (
        event.target.closest('td') &&
        event.target.classList.contains('dt-control')
      ) {
        // You can now access the table element and perform operations on it
        const tr = event.target.closest('tr');
        const table = $(this.childTable.nativeElement).DataTable();
        const row = table.row(tr);
        if (row?.data()) {
          if (row.child.isShown()) {
            row.child.hide();
          } else {
            this.fetchChildlineItemsForSummaryView(row, row.data());
          }
        }
      }
    });
  }

  fetchChildlineItemsForSummaryView(row: any, data: any) {
    const allResultData: any = {
      allData: this.allData,
      FinalResult: this.FinalResult,
      selectedAggType: this.selectedAggType,
      C3Id: data?.C3Id || '',
      ProviderName: data?.ProviderName || '',
      SaleType: data?.SaleType || '',
      CategoryName: data?.CategoryName || '',
    };
    this.loadChildComponent(row, allResultData);
  }

  loadChildComponent(row: any, allResultData: any) {
    const componentFactory = this.resolver.resolveComponentFactory(ResellerDetailsRevenueCostSummaryComponent);
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    componentRef.instance.allResultData = allResultData;
    componentRef.changeDetectorRef.detectChanges();
    row.child(componentRef.location.nativeElement).show();
  }

  reloadGrid() {
    this.dropdownVisible = false;
    this.dropdownVisibleAutocomplete = false;
    this.reloadEvent.emit(true);
    setTimeout(() => {
      this.currentAggType = this.selectedAggType;
    },600);
  }

  GetBillingPeriods() {
    this.BillingPeriods = [];
    let isNextMonthRequired = this.isCustomBilling == 'true';
    let isNextMonthRequiredDueToCustomBilling = this.isCustomBilling == 'true';
    let categoeries = null;

    if (this.isCustomBilling == 'true') {
      this.defaultSelectedBillingPeriodIndex = 2
    } else {
      this.defaultSelectedBillingPeriodIndex = 1
    }

    const subscription = this._buisnessService.GetBillingPeriods({ isNextMonthRequired, categoeries, isNextMonthRequiredDueToCustomBilling }).pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.BillingPeriods = Data.Data;
      if (this.BillingPeriods !== null && this.BillingPeriods.length > 0) {
        this.billingPeriodId = "" + this.BillingPeriods[this.BillingPeriods.length - this.defaultSelectedBillingPeriodIndex].BillingPeriodId;
      }
      this.selectedBillingPeriodId = this.billingPeriodId;
      this.BillingPeriods.reverse();
      this.handleTableConfig();
    });
    this._subscriptionArray.push(subscription);
  };

  onProfitabilityReport() {
    if (this.FinalResult.length > 0) {
      let SearchCriteria = {
        BillingPeriodId: this.selectedBillingPeriodId || this.billingPeriodId,
        C3UserId: null,
        EntityName: this.common.entityName,
        RecordId: this.common.recordId,
        LoggedInUserName: null,
        SelectedAggtypes: this.selectedAggType,
        SelectedResellers: this.SelectedResellers?.join(',') || ""
      }
      this._fileService.post(`reports/ProfitabilityByReseller/Download`, true, SearchCriteria);
    } else {
      this.notifier.alert({ title: this.translateService.instant("TRANSLATE.RESELLER_PROFIT_SUMMARY_REPORT_NO_DATA") })
    }
  }

    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
      this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    }
  onCaptureEvent(event: Event) { }

}
