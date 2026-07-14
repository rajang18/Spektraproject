import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import _ from 'lodash';
import { PartnerMicrosoftAzureBillingReportService } from 'src/app/services/azure-billing-report.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { DateUtility } from 'src/app/shared/utilities/utility';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-azure-plan-billing',
  templateUrl: './azure-plan-billing.component.html',
  styleUrl: './azure-plan-billing.component.scss'
})
export class AzurePlanBillingComponent extends C3BaseComponent implements OnInit {
  currentC3CustomerId: string;
  currentSubscriptionId: string;
  currentCustomerRefId: string;
  currentCurrencyCode: string;
  billingPeriodId: string;
  currentProductId: string;
  azureItems: any[] = [];
  product: any;
  IsFixedPrice: boolean;
  totalCost: string;
  isGridDataLoading: boolean;
  currentCurrency: any;
  currentSubscriptionName: string;
  billingPeriods: any[] = [];
  dateFormat: string = "MMM dd,yyyy";
  seletedBillingPeriod: string;
  datatableConfig: ADTSettings | any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('ResourceType') ResourceType: TemplateRef<any>;
  @ViewChild('Consumedunits') Consumedunits: TemplateRef<any>;
  @ViewChild('Spend') Spend: TemplateRef<any>;

  constructor(
    private _partnerMicrosoftAzureBillingReportService: PartnerMicrosoftAzureBillingReportService,
    private _commonService: CommonService,
    private _cdr: ChangeDetectorRef,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _pageInfo: PageInfoService,
    public _translateService: TranslateService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.currentC3CustomerId = this._commonService.recordId;
  }

  ngOnInit(): void {
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT"), true);
    this._pageInfo.updateBreadcrumbs(['CUSTOMER_MANAGE_PRODUCT_BREADCRUM_MANAGE_PRODUCT', 'AZURE_UPGRADE_AZURE_PLAN_TEXT']);
    this.product = JSON.parse(localStorage.getItem('product'));
    const subscription = this._commonService.getCurrencySymbolByCode(this.product.CurrencyCode).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.currentCurrency = res.Data;
      this.getBillingPeriods();
      // this.getAzureUsageItem();
    })
    this._subscriptionArray.push(subscription);
    this.handleTableConfig();
  }

  handleTableConfig() {
    this.datatableConfig = null;
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: false,
        pageLength: 10,
        data: this.azureItems,
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.USAGE_SUBSCRIPTION_CUSTOMER_USAGE_DETAILS_TABLE_HEADER_RESOURCE_TYPE'),
            // data: 'Resourcetype',
            sortable: true,
            className: 'col-md-8',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.ResourceType,
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.USAGE_SUBSCRIPTION_CUSTOMER_USAGE_DETAILS_TABLE_HEADER_CONSUMED_UNITS'),
            // data: 'Consumed units',
            className: 'col-md-2',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.Consumedunits,
            },
          },
          {
            sortable: true,
            title: this._translateService.instant('TRANSLATE.USAGE_SUBSCRIPTION_CUSTOMER_USAGE_DETAILS_TABLE_HEADER_CONSUMED_SPEND'),
            // data: 'Spend',
            defaultContent: '',
            className: 'col-md-2 text-end',
            ngTemplateRef: {
              ref: this.Spend,
            },
          }
        ]
      }
      this._cdr.detectChanges();
    })
  }


  getAzureUsageItem() {
    let data = {
      CustomerC3Id: this.currentC3CustomerId,
      SubscriptionId: this.product.ProviderProductId,// !$rootScope.CurrentProduct ? null : $rootScope.CurrentProduct.ProviderProductId;
      CustomerRefId: this.product.ServiceProviderCustomerRefId,//this.currentCustomerRefId,// vm.currentCustomerRefId = !$rootScope.CurrentProduct ? null : $rootScope.CurrentProduct.ServiceProviderCustomerRefId;
      Currency: this.product.CurrencyCode,//this.currentCurrencyCode,// !$rootScope.CurrentProduct ? null : $rootScope.CurrentProduct.CurrencyCode;
      BillingPeriodId: this.billingPeriodId,
      ProductId: this.product.ProductSubscriptionId// product.ProductSubscriptionId.toString();
    };
    const subscription = this._partnerMicrosoftAzureBillingReportService.GetAzureUsageItems(data).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.azureItems = res;
      this.IsFixedPrice = this.azureItems[0] != null ? this.azureItems[0].BillingTypeName === 'Price' : false;
      if (this.azureItems.length > 0) {
        this.totalCost = _.sumBy(this.azureItems, 'TotalCost').toFixed(2);
      }
      else {
        this.totalCost = "0.0";
      }
      this.isGridDataLoading = false;
      // this.datatableConfig.data = this.azureItems || []
      this.handleTableConfig();
    })
    this._subscriptionArray.push(subscription);
  }

  reloadAzureUsageItems() {
    this.seletedBillingPeriod = this.billingPeriodId;
    this.getAzureUsageItem();
  }

  exportBillingDetails() {
    let data = {
      CustomerC3Id: this.currentC3CustomerId,
      SubscriptionId: this.product.ProviderProductId,
      CustomerRefId: this.product.ServiceProviderCustomerRefId,
      Currency: this.product.CurrencyCode,
      BillingPeriodId: this.billingPeriodId,
      ProductId: this.product.ProductSubscriptionId
    };
    this._partnerMicrosoftAzureBillingReportService.ExportBillingDetails(data);
  }
  getMaxBillingPeriodId(): number {
    return Math.max(...this.billingPeriods.map(bp => bp.BillingPeriodId));
  }
  getBillingPeriods() {
    this.billingPeriods = [];
    const subscription = this._partnerMicrosoftAzureBillingReportService.GetBillingPeriods().pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.billingPeriods = res;
      let lastBillingPeriod: any = this.billingPeriods.find(v => v.BillingPeriodId == this.getMaxBillingPeriodId());

      //console.log(lastBillingPeriod);
      this.billingPeriodId = lastBillingPeriod.BillingPeriodId?.toString();
      this.getAzureUsageItem();
      var topBillingPeriod = _.chain(this.billingPeriods)
        .sortBy(function (item) { return item.weight * -1; })
        .reverse().first()
        .value();
      // we have added this condition to overcome the next billing period scenario issue. 
      if (new Date(topBillingPeriod.BillingStartDate) < new Date() && new Date(topBillingPeriod.BillingEndDate) > new Date()) {
        _.each(this.billingPeriods, function (billingPeriod) {
          if (new Date(billingPeriod.BillingEndDate) > new Date()) {
            let d = new DateUtility();
            billingPeriod.BillingEndDate = d.formatDateToISO(new Date());
          }
        });
      }
      this.billingPeriods = _.sortBy(this.billingPeriods, 'BillingStartDate').reverse();
    })
    this._subscriptionArray.push(subscription);
  }

}
