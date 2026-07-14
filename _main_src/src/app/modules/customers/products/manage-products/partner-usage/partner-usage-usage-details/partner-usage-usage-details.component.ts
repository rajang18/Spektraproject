import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import moment from 'moment';
import { ManageProductService } from 'src/app/services/manage-product.service';
import _ from 'lodash';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-partner-usage-usage-details',
  templateUrl: './partner-usage-usage-details.component.html',
  styleUrl: './partner-usage-usage-details.component.scss'
})
export class PartnerUsageUsageDetailsComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  _subscription: Subscription;
  currentSubscription: any;
  usageDate: Date | string = null;
  billingPeriodId = null;
  billingPeriods: any[] = [];
  dateFormat: string = "";
  totalCost: any;
  maxDate: NgbDateStruct;
  dropdownVisible: boolean = false;
  aLLPeriods: any = '';
  selectedBillingPeriod: any;
  destroy$ = new Subject<void>();

  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  @ViewChild('costtocustomer') costtocustomer: TemplateRef<any>;
  @ViewChild('usagedateTemp') usagedateTemp: TemplateRef<any>;
  _subscriptionArray: Subscription[] = [];

  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _manageService: ManageProductService,
    private _appService: AppSettingsService,
    private pageInfo: PageInfoService
  ) {
    if (localStorage.getItem("product") !== undefined || localStorage.getItem("product") !== null || localStorage.getItem("product") !== '' || localStorage.getItem("product") !== "") {
      this.currentSubscription = JSON.parse(localStorage.getItem("product"));
    }
    else {
      this._router.navigate(['customer/products']);
    }
  }

  //Action buttonsGetBillingPeriods
  permissions = {
    HasDownloadAzureEstimateReport: "Denied"
  };

  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT"),true);
    this.pageInfo.updateBreadcrumbs(['CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT',]);
    const today = new Date();
    this.maxDate = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
    this.hasPermission();
    this.getApplicationData();
    this.getBillingPeriod();
  }
  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.dateFormat = response.Data.DateFormat;
    });
    this._subscriptionArray.push(subscription);
  }
  hasPermission() {
    this.permissions.HasDownloadAzureEstimateReport = this._permissionService.hasPermission(CloudHubConstants.ACTION_DOWNLOAD_AZURE_ESTIMATE_REPORT);
  }

  getBillingPeriod() {
    this.billingPeriods = [];
    const subscription = this._manageService.getBillingPeriod().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.billingPeriods = res.Data;
      _.each(this.billingPeriods, (billingPeriod) => {
        if (new Date(billingPeriod.BillingStartDate) < new Date() && new Date(billingPeriod.BillingEndDate) > new Date()) {
          this.billingPeriodId = billingPeriod.BillingPeriodId.toString();
          //this.reloadEvent.emit(true);
        }
      });
      let index = this.billingPeriods.findIndex(
        (item: any) => item.BillingPeriodId == this.billingPeriodId
      );
      if (index != -1) {
        this.selectedBillingPeriod = this.billingPeriods[index];
      }
      else {
        this.selectedBillingPeriod = null;
      }

      this.billingPeriods = this.billingPeriods.sort((a, b) => b.BillingPeriodId - a.BillingPeriodId);
      this.handleTableConfig();
    })
    this._subscriptionArray.push(subscription);
  }

  searchFilter() {
    this.reloadEvent.emit(true);
  }

  resetFilters() { 
    _.each(this.billingPeriods, (billingPeriod) => {
      if (new Date(billingPeriod.BillingStartDate) < new Date() && new Date(billingPeriod.BillingEndDate) > new Date()) {
        this.billingPeriodId = billingPeriod.BillingPeriodId.toString();
      }
    }); 
    this.usageDate = null; 
    this.reloadEvent.emit(true);
  }

  updateDate(event: any) {
    this.usageDate = this.formatDateObject(event);
  }


  formatDateObject(dateObj: any): string {
    const year = dateObj.year;
    const month = String(dateObj.month).padStart(2, '0');
    const day = String(dateObj.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  handleTableConfig() {
    let subscription
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          let reqBody: any = {
            SortColumn, SortOrder, PageSize,
            StartInd: StartInd - 1,
            ProductId: this.currentSubscription.InternalCustomerProductId,
            BillingPeriodId: this.billingPeriodId,
            UsageDate: moment(this.usageDate).format("YYYY, MM, DD")
          };
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._manageService.getUsageDetails(this.currentSubscription.InternalCustomerProductId, reqBody)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalRecords: recordsTotal }] = Data;
                this.totalCost = Data[0].TotalCost
              }
              else {
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
            title: this._translateService.instant('TRANSLATE.PARTNER_USAGE_PRODUCT_USAGE_TAB_DESCRIPTION'),
            data: 'Description',
            className: 'col-md-2',
            render: (data: string) => {
              if (data != null) {
                return `<span class="fw-semibold">${data}</span>`
              }
              else {
                return `<span></span>`
              }
            },
            orderable: false
          },
          {
            title: this._translateService.instant('TRANSLATE.PARTNER_USAGE_PRODUCT_USAGE_TAB_UNITS'),
            data: 'Units',
            className: 'col-md-2 text-end pe-6'
          },
          {
            title: this._translateService.instant('TRANSLATE.PARTNER_USAGE_PRODUCT_USAGE_TAB_UNIT_OF_MEASURE'),
            data: 'UnitOfMeasure',
            className: 'col-md-2',
            orderable: false
          },
          {
            title: this._translateService.instant('TRANSLATE.PARTNER_USAGE_PRODUCT_USAGE_TAB_COST_TO_CUSTOMER'),
            data: 'CostToCustomer',
            defaultContent: '',
            className: 'col-md-2 text-end pe-6',
            ngTemplateRef: {
              ref: this.costtocustomer,
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.PARTNER_USAGE_PRODUCT_USAGE_TAB_CURRENCY_CODE'),
            data: 'CurrencyCode',
            className: 'col-md-2',
            orderable: false
          },
          {
            title: this._translateService.instant('TRANSLATE.PARTNER_USAGE_PRODUCT_USAGE_TAB_USAGE_DATE'),
            data: 'UsageDate',
            defaultContent: '',
            className: 'col-md-2 text-start',
            ngTemplateRef: {
              ref: this.usagedateTemp,
            },
          }
        ],
        order: [[5, 'desc']]
      };
    });
    
  }

  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
  }

  checkBillingPeriodChange(periodData: any) {
    let obj = this.billingPeriods.find(e => e.billingPeriodId == periodData)
    this.toggleDropdown();
    if (obj) {
      this.billingPeriodId = obj?.BillingPeriodId;
      this.selectedBillingPeriod = obj;
    } else {
      this.billingPeriodId = null;
      this.selectedBillingPeriod = null;
    }
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
