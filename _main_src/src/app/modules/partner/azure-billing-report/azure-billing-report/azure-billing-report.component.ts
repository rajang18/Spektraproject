import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { PartnerMicrosoftAzureBillingReportService } from 'src/app/services/azure-billing-report.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { PermissionService } from 'src/app/services/permission.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';


@Component({
  selector: 'app-azure-billing-report',
  templateUrl: './azure-billing-report.component.html',
  styleUrls: ['./azure-billing-report.component.scss']
})
export class AzureBillingReportComponent implements OnInit {
  datatableConfig: ADTSettings;
  _subscription: Subscription;
  _subscriptionArray: Subscription[] = []; 
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('totalCostTemplate') totalCostTemplate: TemplateRef<any>;
  @ViewChild('noDataTemplate') noDataTemplate: TemplateRef<any>;
  private destroy$ = new Subject<void>();
  userInfo: any = {}; // Assume this is set somewhere
  currentC3CustomerId: any;
  currentCurrencyCode: string;
  currentCurrency: any;
  selectedServiceProviderCustomer: any = null;
  currentProductId: any = null;
  dateFormat: string = 'MMM dd, yyyy';
  billingPeriodId: number = 0;
  currencies: any[] = [];
  customers: any[] = [];
  allTenants: any[] = [];
  subscriptionDataSource: any[] = [];
  billingPeriods: any[] = [];
  azureItems: any[] = null;
  totalCost: any;
  entityName: string | null;
  recordId: string | null;
  currentCurrencyArray: any;
  isGridDataLoading: boolean = false;
  isFixedPrice: boolean = false;
  isPartnerLevel: boolean = false;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  allCustomers: any[];
  provider: any;
  IsLoadingTable: boolean;
  currentCustomer: any;
  customerCreationDate: Date;
  currentCustomerId: any;
  isTableLoaded:boolean = false;

  constructor(private AzureBillingReportService: PartnerMicrosoftAzureBillingReportService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private commonService: CommonService,
    private fileService: FileService,
    private _appService: AppSettingsService,
    private _pageInfo: PageInfoService,

  ) { }

  ngOnInit() {
    this.entityName = this.commonService.entityName;
    this.recordId = this.commonService.recordId;
    this.getBillingPeriods();
    this.getCustomers();
    this.totalCost = 0.0;
    this._pageInfo.updateTitle(this.translateService.instant("MENU_AZURE_BILLING_REPORT"), true);
    this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_CUSTOMER_MICROSOFT', 'MENU_AZURE_BILLING_REPORT']);
    this.dateFormat = this._appService.$rootScope.dateFormat;
  }
  getCustomers() {
    this.customers = [];
    const subscription = this.AzureBillingReportService.GetCustomers().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      let data = res;
      data.filter((item: any) => {
        let i = this.customers.findIndex(x => (x.Name == item.Name));
        if (i <= -1) {
          this.customers.push(item);
        }
        if (this.customers.length) {
          this.currentC3CustomerId = this.customers[0].C3Id;
        }
      });
      this.onCustomerChange();

    });
    this._subscriptionArray.push(subscription);
  }

  getBillingPeriods() {
    const subscription = this.AzureBillingReportService.GetBillingPeriods().pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.billingPeriods = data;

      // Find the last billing period based on BillingPeriodId
      const lastBillingPeriod = this.billingPeriods.reduce((max, billingPeriod) =>
        billingPeriod.BillingPeriodId > max.BillingPeriodId ? billingPeriod : max, this.billingPeriods[0]);
      this.billingPeriodId = lastBillingPeriod.BillingPeriodId;

      // Sort billing periods by BillingStartDate descending
      this.billingPeriods = this.billingPeriods.sort((a, b) => new Date(b.BillingStartDate).getTime() - new Date(a.BillingStartDate).getTime());

      // Additional condition to handle next billing period scenario
      const topBillingPeriod = this.billingPeriods[0];
      if (new Date(topBillingPeriod.BillingStartDate) < new Date() && new Date(topBillingPeriod.BillingEndDate) > new Date()) {
        this.billingPeriods = this.billingPeriods.map(billingPeriod => {
          if (new Date(billingPeriod.BillingEndDate) > new Date()) {
            billingPeriod.BillingEndDate = new Date().toISOString();
          }
          return billingPeriod;
        });
      }
      // Ensure the billing periods are still sorted correctly after modification
      this.billingPeriods = this.billingPeriods.sort((a, b) => new Date(b.BillingStartDate).getTime() - new Date(a.BillingStartDate).getTime());
    });
    this._subscriptionArray.push(subscription);
  }


  getAzureUsageItems() {

    if(this.isTableLoaded){
      this.datatableConfig = null;
      this.handleTableConfig();
     //this.reloadEvent.emit(true);
      this.cdRef.detectChanges();
    }else{
      this.isGridDataLoading = false;
      // Reload data table or handle data table
      this.handleTableConfig();
    }
  }


  exportBillingDetails() {
    const reqBody = {
      CustomerC3Id: this.currentC3CustomerId,
      CustomerRefId: this.selectedServiceProviderCustomer.CustomerRefId,
      Currency: this.currentCurrencyCode,
      BillingPeriodId: this.billingPeriodId
    };

    let productIdForData = this.currentProductId;
    if (this.currentProductId == null || this.currentProductId == "") {
      productIdForData = "null";
    }

    this.fileService.post(`azureSubscriptions/${productIdForData}/billingAsCSV`, true, reqBody);

  }

  sum(numbers: number[]) {
    return numbers.reduce((result, current) => result + current, 0);
  }

  onCustomerChange() {
    this.selectedServiceProviderCustomer = null;
    const customerC3Id = this.currentC3CustomerId ? this.currentC3CustomerId : null;
    const subscription = this.AzureBillingReportService.GetCurrencies(customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      let data = res;
      data.filter((item: any) => {
        let i = this.currencies.findIndex((x: any) => (x.CurrencyCode == item.CurrencyCode));
        if (i <= -1) {
          this.currencies.push(item);
        }
      });
      if (this.currencies !== undefined && this.currencies !== null && this.currencies.length > 0) {
        this.currentCurrencyCode = this.currencies[0].CurrencyCode;
        this.getCurrentCurrencyDetails();
      }
      else {
        this.currentCurrencyCode = null;
      }
      this.onCurrencyChange();
    });
    this._subscriptionArray.push(subscription);
  }

  onCurrencyChange() {
    const selectedCustomer = this.customers.find(customer => customer.C3Id === this.currentC3CustomerId);
    this.currentCustomer = selectedCustomer;
    this.currentCustomerId = this.currentCustomer ? this.currentCustomer.ID : null;
    this.currentC3CustomerId = this.currentCustomer ? this.currentCustomer.C3Id : null;
    this.customerCreationDate = this.currentCustomer ? new Date(this.currentCustomer.ProviderCustomerCreateDate) : null;
    this.getTenants();
  }

  getCurrentCurrencyDetails() {
    this.currentCurrencyArray = this.currencies.filter(currency => currency.CurrencyCode === this.currentCurrencyCode);
    this.currentCurrency = this.currentCurrencyArray[0];
  }

  getTenants() {
    this.allTenants = [];
    if (this.currentC3CustomerId) {
      const subscription = this.AzureBillingReportService.GetTenants(this.currentC3CustomerId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.allTenants = response;
        this.cdRef.detectChanges();
        if (this.allTenants && this.allTenants.length > 0) {
          this.selectedServiceProviderCustomer = this.allTenants[0];
          this.getAzureSubscriptions();
        }
      });

      this._subscriptionArray.push(subscription);
    }
  }

  getAzureSubscriptions() {
    const searchData = {
      CustomerC3Id: this.currentC3CustomerId,
      ProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
      CurrencyCode: this.currentCurrencyCode,
      EntityName: this.entityName,
      RecordId: this.recordId,
      ProviderId: this.selectedServiceProviderCustomer.ProviderId
    };

    const subscription = this.AzureBillingReportService.GetAzureSubscriptions(searchData).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.subscriptionDataSource = data;
      this.currentProductId = "";
      this.getAzureUsageItems();
      this.cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    this.isTableLoaded = true;
    const data = {
      CustomerC3Id: this.currentC3CustomerId,
      CustomerRefId: this.selectedServiceProviderCustomer.CustomerRefId,
      Currency: this.currentCurrencyCode,
      BillingPeriodId: this.billingPeriodId,
      ProductId: this.currentProductId == "" ? null : this.currentProductId
    };

    const subscription = this.AzureBillingReportService.GetAzureUsageItems(data).pipe(takeUntil(this.destroy$)).subscribe(response => {
      const usageItems = response;
      this.azureItems = response;
      this.totalCost = this.azureItems.length > 0 ? this.sum(this.azureItems.map(item => item.TotalCost)).toFixed(2) : 0.0;
      setTimeout(() => {
        this.isGridDataLoading = false;
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 50),
          data: usageItems,
          columns: [
            {
              title: this.translateService.instant('TRANSLATE.USAGE_SUBSCRIPTION_CUSTOMER_USAGE_DETAILS_TABLE_HEADER_SUBSCRIPTION_NAME'),
              className: 'col-md-3 ',
              data: 'SubscriptionName',
              render: (data: any, type: any, row: any) => {
                return `<strong>${row.SubscriptionName}</strong>`;
              }
            },
            {
              title: this.translateService.instant('TRANSLATE.USAGE_SUBSCRIPTION_CUSTOMER_USAGE_DETAILS_TABLE_HEADER_RESOURCE_TYPE'),
              className: 'col-md-3 ',
              data: 'Category',
              render: (data: any, type: any, row: any) => `${row.Category} ${row.SubCategory} ${row.ResourceName}`
            },
            {
              title: this.translateService.instant('TRANSLATE.USAGE_SUBSCRIPTION_CUSTOMER_USAGE_DETAILS_TABLE_HEADER_CONSUMED_UNITS'),
              className: 'col-md-3 text-end',
              data: 'AmountUsed',
              render: (data: any, type: any, row: any) => {
                const unit = row.Unit ? ` ${row.Unit}` : '';
                return `<strong>${row.AmountUsed}</strong>${unit}`;
              }
            },
            {
              title: this.translateService.instant('TRANSLATE.USAGE_SUBSCRIPTION_CUSTOMER_USAGE_DETAILS_TABLE_HEADER_CONSUMED_SPEND'),
              className: 'col-md-3 text-end',
              defaultContent: '',
              ngTemplateRef: {
                ref: this.totalCostTemplate,
                context: {
                  captureEvents: this.onCaptureEvent.bind(self),
                },
              },

            },
          ]
        };
        this.cdRef.detectChanges();
      });
    });
    this._subscriptionArray.push(subscription);
  }
  
  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}