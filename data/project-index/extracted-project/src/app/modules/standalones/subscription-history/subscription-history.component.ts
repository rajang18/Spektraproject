import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  NgbModule,
  NgbDropdownModule,
  NgbTooltipModule,
  NgbDatepickerModule,
  NgbModal,
  NgbModalOptions,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { SubscriptionHistoryService } from 'src/app/services/subscription-history.service';
import { ConvertCommaSeparatedStringToListPipe } from 'src/app/shared/pipes/convert-comma-separated-string-to-list.pipe';
import { TranslationModule } from '../../i18n';
import { PartnerModule } from '../../partner/partner.module';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { CpvpartnerconsentComponent } from '../templates/cpvpartnerconsent/cpvpartnerconsent.component';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { CommonService } from 'src/app/services/common.service';
import { mapParamsWithApi } from '../c3-table/c3-table-utils';
import {
  ADTColumns,
  ADTSettings,
} from 'angular-datatables/src/models/settings';
import moment from 'moment';
import {
  MODAL_DIALOG_CLASS,
  ReportPopupConfig,
} from 'src/app/shared/models/report-popup.model';
import { ReportPopupComponent } from '../report-popup/report-popup.component'; 
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { ProductMappingService } from '../../partner/prod-mapping/services/productmapping.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CurrencyPipe } from "../../../shared/pipes/currency.pipe";
import { OrderByPipe } from "../../../shared/pipes/order-by.pipe";
import { C3DatePipe, DateTimeUTCFilterPipe } from "../../../shared/pipes/dateTimeFilter.pipe";
import { DateUtility } from 'src/app/shared/utilities/utility';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import _ from 'lodash';


@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    TranslationModule,
    EditorModule,
    CpvpartnerconsentComponent,
    NgSelectModule,
    HttpClientModule, 
    NgbModule,
    NgbDropdownModule,
    C3TableComponent,
    NgbTooltipModule,
    NgbDatepickerModule,
    FormsModule,
    PartnerModule, 
    ConvertCommaSeparatedStringToListPipe,
    NgSelectModule,
    OrderByPipe,
    CurrencyPipe,
    C3DatePipe,
    DateTimeUTCFilterPipe,
    PermissionDirective
],
  providers: [SubscriptionHistoryService,DateTimeUTCFilterPipe ,C3DatePipe],
  selector: 'app-subscription-history',
  templateUrl: './subscription-history.component.html',
  styleUrl: './subscription-history.component.scss',
})
export class SubscriptionHistoryComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings  |any;
  @ViewChild('subscriptionpills') subscriptionpills: TemplateRef<any>;
  @ViewChild('actionCol') actionCol: TemplateRef<any>;
  @ViewChild('price') price: TemplateRef<any>;
  @ViewChild('newPrice') newPrice: TemplateRef<any>;
  @ViewChild('quantity') quantity: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  productName: any;
  onCaptureEvent: any;
  SelectedCustomerC3Id: any;
  RecordId: any;
  SelectedProvider: any;
  SelectedCategory: any;
  SelectedBillingCycles: any;
  SelectedProviderCategories: any;
  SelectedConsumptionTypesToFilter: any;
  Search: any = {};
  hasSiteEnabled: string = 'Denied';
  customers: any;
  customersDropdown: any[];
  customerDetails: any[];
  BillingPeriods: any[];
  filtersExpanded: boolean = false;
  EntityName: string = 'Customer';
  ProviderSelection: any = [];
  Providers: any = [];
  Categories: any = [];
  ProviderCategories: any = [];
  BillingCycleSelection: any = [];
  BillingCycles: any = [];
  ConsumptionTypeSelection: any = [];
  ConsumptionTypes: any = [];
  CategorySelection: any = [];
  category: any;
  filteredProviderCategories: any = [];
  ProviderCategorySelection: any = [];
  isRefreshInprocess: boolean = true;
  pageMode: string;
  filteredCategories: any = [];
  billingPeriodId: string;
  defaultSelectedBillingPeriodIndex: any = 1;
  activeServiceDetail: any;
  EffectiveFrom:any;
  EffectiveTo: any;
  PageSize: any;
  StartInd: any;
  SortColumn: any
  SortOrder: any;
  maxDate: NgbDateStruct;
  SelectedSubCategoryFilter: any;
  subCategories: any;
  SubCategorySelection: any = [];
  isCustomSelected: boolean = false;
  permissions = {
    GetCustomersListToPickForExternalService: "Denied",
    InitiateUploadToAutotask: "Denied",
    InitiateUploadToConnectwise: "Denied",
    GetProductMappings: "Denied",
    UploadToExternalService: "Denied",
    DeactivatePSALog: "Denied",
    ValidateForExternalServiceUpload: "Denied"
  };
  pageStartInd: number;
  constructor(
    private SubscriptionHistoryService: SubscriptionHistoryService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _fileService: FileService,
    private _commonService: CommonService,
    private _productMappingService: ProductMappingService,
    private _appSettings: AppSettingsService,
    public pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    public c3RouterService: C3RouterService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appSettings);
    const subscription = _appSettings.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.activeServiceDetail = res;
      if (this.activeServiceDetail?.Name.toLowerCase() == CloudHubConstants.PSA_NAME_AUTOTASK) {
        this.activeServiceDetail.key = "BTN_TEXT_UPLOAD_TO_AUTOTASK";
      } else {
        this.activeServiceDetail.key = "BTN_TEXT_UPLOAD_TO_CONNECTWISE";
      }
      this.actionHeaderLoader();
    })
    this._subscriptionArray.push(subscription);
    this.getCustomers();
    this.getProviders();
    this.getCategoriesForSubscription();
    this.getProvidersCategories();
    this.getBillingPeriodsForSubscription();
    this.getConsumptionTypes();
    this.getBillingCycles();
    this.EntityName = _commonService.entityName;
    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData'];
    if (this.keyForData) {
        this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
        this.persistPropertySet();
        this.SelectedBillingCycles = this.searchParams.BillingCycleIds;
        this.SelectedProviderCategories = this.searchParams.ProviderCategories;
        // this.SelectedConsumptionTypesToFilter = this.searchParams.SelectedConsumptionTypesToFilter;
        this.Search.Customers = this.searchParams.Customers;
        this.Search.SearchKeyword = this.searchParams.SearchKeyword;
        this.Search.EffectiveFrom = this.searchParams.EffectiveFrom;
        this.Search.EffectiveTo = this.searchParams.EffectiveTo;
        this.Search.BillingPeriod = this.searchParams.BillingPeriodId;
        this.pageStartInd = this.searchParams.StartInd;
        // this.ProviderSelection = this.searchParams.ProviderSelection;
        this.BillingCycleSelection = this.searchParams.BillingCycleSelection;
        this.ConsumptionTypeSelection = this.searchParams.ConsumptionTypeSelection;
        this.CategorySelection = this.searchParams.CategorySelection;
        this.ProviderCategorySelection = this.searchParams.ProviderCategorySelection;
        // if(this.ProviderSelection){
        //   setTimeout(()=>{
        //     this.filterCategories(true);
        //     this.filterProviderCategories(true);
        //     this.filterByProvider();
        //   },1000)
        // }
    }
  }

  ngOnInit(): void {
    this.hasPermission();
    const subscription = this._productMappingService.isRefreshInprocess$.pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.isRefreshInprocess = res;
      this.cdRef.detectChanges();
      //this.actionHeaderLoader(); 
    })
    const today = new Date();
    this.maxDate = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
    this._subscriptionArray.push(subscription);
    this.getCustomers();
    this.getProviders();
    this.getCategoriesForSubscription();
    this.getProvidersCategories();
    this.getBillingPeriodsForSubscription();
    this.getConsumptionTypes();
    this.getBillingCycles();
    this.handleTableConfig();
    if (this._commonService.entityName === 'Customer') {
      this.pageInfo.updateTitle(this.translateService.instant('TRANSLATE.PARTNER_CUSTOMER_REPORTS'), true);
      this.pageInfo.updateBreadcrumbs(['PARTNER_CUSTOMER_REPORTS']);
    }
    if (this._commonService.entityName === 'Reseller') {
      this.pageInfo.updateTitle(this.translateService.instant('TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'), true);
      this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS']);
    }
    if (this._commonService.entityName === 'Partner') {
      this.pageInfo.updateTitle(this.translateService.instant('TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'), true);
      this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS']);
    }
  }

  hasPermission() {
    this.permissions.GetCustomersListToPickForExternalService = this._permissionService.hasPermission(this.cloudHubConstants.GET_CUSTOMERS_LIST_TO_PICK_FOR_EXTERNAL_SERVICE);
    this.permissions.InitiateUploadToAutotask = this._permissionService.hasPermission(this.cloudHubConstants.UPLOAD_TO_AUTOTASK);
    this.permissions.InitiateUploadToConnectwise = this._permissionService.hasPermission(this.cloudHubConstants.UPLOAD_TO_CONNECTWISE);
    this.permissions.ValidateForExternalServiceUpload = this._permissionService.hasPermission(this.cloudHubConstants.VALIDATE_UPLOAD_TO_EXTERNAL_SERVICE);
    this.permissions.GetProductMappings = this._permissionService.hasPermission(this.cloudHubConstants.GET_ENTITY_AND_PRODUCT_MAPPING);
    this.permissions.UploadToExternalService = this._permissionService.hasPermission(this.cloudHubConstants.UPLOAD_TO_EXTERNAL_SERVICE);
    this.permissions.DeactivatePSALog = this._permissionService.hasPermission(this.cloudHubConstants.DEACTIVATE_PSA_LOG);
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      let dateUtility = new DateUtility();
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        order: [7, 'desc'],
        ADTSettings: {
            enableEscapeHTML: true
          },
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          this.pageStartInd = (StartInd - 1) * length;
          let startDate = this.Search.EffectiveFrom
            ? {
              year: this.Search.EffectiveFrom.year,
              month: this.Search.EffectiveFrom.month - 1,
              day: this.Search.EffectiveFrom.day,
            }
            : null;
          let endDate = this.Search.EffectiveTo
            ? {
              year: this.Search.EffectiveTo.year,
              month: this.Search.EffectiveTo.month - 1,
              day: this.Search.EffectiveTo.day,
            } : null;
            this.SortColumn = this.keyForData ? this.SortColumn : SortColumn;
            this.SortOrder = this.keyForData ? this.SortOrder : SortOrder;
            this.keyForData = null;
          let requestBody = {
            ProviderIds: this.SelectedProvider ? this.SelectedProvider.join() : null,
            CategoryIds: this.SelectedCategory ? this.SelectedCategory.join() : null,
            BillingCycleIds: this.SelectedBillingCycles ? this.SelectedBillingCycles.join() : null,
            ProviderCategories: this.SelectedProviderCategories ? this.SelectedProviderCategories.join() : null,
            ConsumptionTypes: this.SelectedConsumptionTypesToFilter ? this.SelectedConsumptionTypesToFilter.join() : null,
            SearchKeyword: this.Search.SearchKeyword,
            Customers: this._commonService.entityName === 'Customer' ? this._commonService.recordId : this.Search.Customers ? this.Search?.Customers?.map((item: any) => item)?.join() : null,
            EffectiveFrom: this.Search.EffectiveFrom ?dateUtility.convertToMomentFormat(this.Search.EffectiveFrom): null,
            EffectiveTo: this.Search.EffectiveTo ? dateUtility.convertToMomentFormat(this.Search.EffectiveTo) : null,
            BillingPeriodId: this.Search.BillingPeriod | 0,
            PageSize: length,
            StartInd: this.pageStartInd,
            SortColumn: this.SortColumn,
            SortOrder:this.SortOrder,
            SubCategoryIds: this.SelectedSubCategoryFilter ? this.SelectedSubCategoryFilter.join() : null,
          };
           this.EffectiveFrom=  this.Search.EffectiveFrom ?dateUtility.convertToMomentFormat(this.Search.EffectiveFrom): null;
           this.EffectiveTo = this.Search.EffectiveTo ? dateUtility.convertToMomentFormat(this.Search.EffectiveTo) : null;
           this.PageSize= length,
           this.StartInd  = StartInd
           this.SortColumn = SortColumn,
           this.SortOrder = SortOrder,
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.SubscriptionHistoryService.getSubscriptionHistory(
            requestBody
          ).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            if (Data && Data.length > 0) {
              this.applyEscapeHTML(Data);
              this.hasSiteEnabled = Data[0].HasSiteEnabled;
            }
            let recordsTotal: number = 0;
            if (Data.length > 0) {
              [{ TotalRecordsCount: recordsTotal }] = Data;
            }
            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
          });
          this._subscriptionArray.push(subscription);
        },
        columns:
          this.EntityName === 'Customer'
            ? this.customerColumns
            : this.partnerColumns,
      };
      this.cdRef.detectChanges();
    });
  }

  get partnerColumns(): ADTColumns[] {
    return [
      {
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_CUSTOMER_NAME'
        ),
        data: 'CustomerName',
        className: 'col-md-3',
        render: function (data: any, type: any, row: any) {
          return `<span class="fw-semibold">${data}</span>`
        }
      },
      {
        type: 'string',
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_OFFER_NAME'
        ),
        className: 'col-md-3',
        data: 'FriendlyName',
        defaultContent: '',
        ngTemplateRef: {
          ref: this.subscriptionpills,
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_QUANTITY'
        ),
        data: 'NewQuantity',
        className: 'text-end pe-4 col-md-1',
        orderable: false,
        render: (data: string, type: any, row: any, meta: any) => {
          let spanText = '';
          if (row.NewQuantity !== row.OldQuantity)
            spanText = `<span class="text-muted mt-1 fw-semibold fs-8 ms-2">${this.translateService.instant('TRANSLATE.FROM')} ${row.OldQuantity}</sub></span>`
          return `<span>${data}</span></br>  ${spanText}`

        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_PRICE'
        ),
        data: 'NewPrice',
        className: 'text-end pe-4 col-md-1',
        orderable: false,
        ngTemplateRef: {
          ref: this.price,
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_NEW_PRICE'
        ),
        data: 'NewPrice',
        className: 'text-end pe-4 col-md-1',
        orderable: false,
        ngTemplateRef: {
          ref: this.newPrice,
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_OLD_STATUS'
        ),
        data: 'OldStatusDescription',
        orderable: false,
        className: 'col-md-1',
        render: (data: string) => {

          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'active' || this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'succeeded') {
            return `<span class="label font-weight-bold label-inline badge badgeColorApproved" >${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'deleted') {
            return `<span class="label font-weight-bold label-inline badge badgeColorDeleted">${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'in-provision') {
            return `<span class="label font-weight-bold label-inline badge badgeColorInprovision">${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'suspended') {
            return `<span class="badge badge-light-secondary text-gray-500">${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'expired' || this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'disabled' || this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'cancelled') {
            return `<span class="label font-weight-bold label-inline badge badgeColorExpired">${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'completed') {
            return `<span class="label font-weight-bold label-inline badge badgeColorPrimary ">${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
          else {
            return `<span class="label font-weight-bold label-inline badge badgeColorExpired" >${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_STATUS'
        ),
        className: 'col-md-1',
        data: 'NewStatusDescription',
        orderable: false,
        render: (data: string, type: any, row: any, meta: any) => {
          let spanText = '';
          if (row.NewStatusName !== row.OldStatusName)
            spanText = `<span class="d-inline-block text-muted mt-1 fw-semibold fs-8 ms-2">${this.translateService.instant('TRANSLATE.FROM')} ${this.translateService.instant('TRANSLATE.' + row.OldStatusDescription)}</sub></span>`
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'active' || this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'succeeded') {
            return `<span class="label font-weight-bold label-inline badge badgeColorApproved" >${this.translateService.instant('TRANSLATE.' + data)}</span></br> ${spanText}`
          }
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'deleted') {
            return `<span class="label font-weight-bold label-inline badge badgeColorDeleted">${this.translateService.instant('TRANSLATE.' + data)}</span></br> ${spanText}`
          }
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'in-provision') {
            return `<span class="label font-weight-bold label-inline badge badgeColorInprovision">${this.translateService.instant('TRANSLATE.' + data)}</span></br> ${spanText}`
          }
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'suspended') {
            return `<span class="badge badgeColorSuspended">${this.translateService.instant('TRANSLATE.' + data)}</span></br> ${spanText}`
          }
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'expired' || this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'disabled' || this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'cancelled') {
            return `<span class="label font-weight-bold label-inline badge badgeColorExpired">${this.translateService.instant('TRANSLATE.' + data)}</span></br> ${spanText}`
          }
          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'completed') {
            return `<span class="label font-weight-bold label-inline badge badgeColorPrimary">${this.translateService.instant('TRANSLATE.' + data)}</span></br> ${spanText}`
          }
          else {
            return `<span class="badge badge-light-danger" >${this.translateService.instant('TRANSLATE.' + data)}</span></br> ${spanText}`
          }
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_DATE'
        ),
        className: 'col-md-1 text-start',
        defaultContent: '',
        data: 'CreatedDate',
        ngTemplateRef: {
          ref: this.actionCol,
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_USER'
        ),
        className: 'col-md-1',
        data: 'CreatedBy',
        render: function (data: any) {
          return `<span class="d-block text-wrap w-100px">${data}</span>`
        }
      },
    ];
  }

  get customerColumns(): ADTColumns[] {
    return [
      {
        orderable: false,
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_CUSTOMER_NAME'
        ),
        data: 'CustomerName',
        className: 'col-md-3',
        render: function (data: any, type: any, row: any) {
          return `<span class="fw-semibold">${data}</span>`
        }
      },
      {
        type: 'string',
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_OFFER_NAME'
        ),
        data: 'FriendlyName',
        className: 'col-md-3',
        defaultContent: '',
        ngTemplateRef: {
          ref: this.subscriptionpills,
        },
      },
      {
        orderable: false,
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_QUANTITY'
        ),
        data: 'NewQuantity',
        ngTemplateRef: {
          ref: this.quantity,
        },
        className: 'text-end pe-4 col-md-1'
      },
      {
        orderable: false,
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_PRICE'
        ),
        data: 'NewPrice',
        ngTemplateRef: {
          ref: this.price,
        },
        className: 'text-end pe-4 col-md-1'
      },
      {
        orderable: false,
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_NEW_PRICE'
        ),
        data: 'NewPrice',
        className: 'text-end pe-4 col-md-1',
        ngTemplateRef: {
          ref: this.newPrice,
        },
      },
      {
        orderable: false,
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_OLD_STATUS'
        ),
        data: 'OldStatusDescription',
        className: 'col-md-1',
        render: (data: string) => {

          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'active') {
            return `<span class="badge badge-light-success" >${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
          else {
            return `<span class="badge badge-secondary" >${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
        }
      },
      {
        orderable: false,
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_STATUS'
        ),
        className: 'col-md-1',
        data: 'NewStatusDescription',
        ngTemplateRef: {
          ref: this.status,
        },
        render: (data: string) => {

          if (this.translateService.instant('TRANSLATE.' + data).toLowerCase() === 'active') {
            return `<span class="badge badge-light-success" >${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
          else {
            return `<span class="badge badge-secondary" >${this.translateService.instant('TRANSLATE.' + data)}</span>`
          }
        },
      },
      {
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_DATE'
        ),
        data: 'CreatedDate',
        className: 'col-md-1 text-start',
        defaultContent: '',
        ngTemplateRef: {
          ref: this.actionCol,
        },
      },
      {
        orderable: false,
        title: this.translateService.instant(
          'TRANSLATE.SUBSCRIPTION_HISTORY_TABLE_HEADER_TEXT_USER'
        ),
        data: 'CreatedBy',
        className: 'col-md-1',
        render: function (data: any) {
          return `<span class="d-block text-wrap w-100px">${data}</span>`
        }
      },
    ];
  }

  downloadReport() {
    const moduleName = 'partner.business.subscriptionhistory';
    const subscription = this._commonService
      .getDownloadableReportColumnsForPlans({ moduleName: moduleName })
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        /* Creating config model */
        let reportConfig = new ReportPopupConfig();
        reportConfig.Columns = response.Data;
        reportConfig.title = 'SUBSCRIPTION_HISTORY_REPORT_FILE_TYPES_HEADER';
        reportConfig.isSubmitButton = true;
        reportConfig.IsColumnsAvailable = true;
        reportConfig.IsSubHeaderAvailable = true;
        reportConfig.EmailInstructionText =
          'TRANSLATE.REPORT_POPUP_SUBSCRIPTION_HISTORY_SEND_EMAIL_INSTRUCTION';
        reportConfig.actionTooltipText = 'TRANSLATE.REPORT_POPUP_SUBSCRIPTION_HISTORY_ACTION_ICON_DESCRIPTION';
        /* selecting Size of popup based on condition */
        const config: NgbModalOptions = {
          modalDialogClass: reportConfig.IsSubHeaderAvailable
            ? MODAL_DIALOG_CLASS
            : '',
        };
        const modalRef = this.modalService.open(ReportPopupComponent, config);
        modalRef.componentInstance.reportConfig = reportConfig;
        modalRef.result.then(
          (result) => {
            if (result) {
              let selectedColumn: any = [];
              result.Columns.map((e: any) => {
                if (e.IsChecked === true) {
                  selectedColumn.push(e.ColumnName);
                }
              });
              let columns = selectedColumn.join(',');
              let requestBody: any = {
                ProviderIds: this.SelectedProvider
                  ? this.SelectedProvider.join()
                  : null,
                CategoryIds: this.SelectedCategory
                  ? this.SelectedCategory.join()
                  : null,
                BillingCycleIds: this.SelectedBillingCycles
                  ? this.SelectedBillingCycles.join()
                  : null,
                ProviderCategories: this.SelectedProviderCategories
                  ? this.SelectedProviderCategories.join()
                  : null,
                ConsumptionTypes: this.SelectedConsumptionTypesToFilter
                  ? this.SelectedConsumptionTypesToFilter.join()
                  : null,
                SearchKeyword: this.Search.SearchKeyword,
                Customers:
                  this._commonService.entityName === 'Customer'
                    ? this._commonService.recordId
                    : this.Search.Customers
                      ? this.Search.Customers.map((item: any) => item).join()
                      : null,
                EffectiveFrom: this.Search.EffectiveFrom
                  ? moment(this.Search.EffectiveFrom)
                    .startOf('day')
                    .format('YYYY, MM, DD HH:mm')
                  : null,
                EffectiveTo: this.Search.EffectiveTo
                  ? moment(this.Search.EffectiveTo)
                    .endOf('day')
                    .format('YYYY, MM, DD HH:mm')
                  : null,
                BillingPeriodId: this.Search.BillingPeriod
                  ? this.Search.BillingPeriod
                  : 0,
                PageSize: 500000,
                StartInd: 0,
                // SortColumn: SortColumn,
                // SortOrder: this.Search.SortOrder,
                ColumnsName: columns,
                Email: result.Email,
                FileType: result.FileType,
              };
              if (columns != '' && columns.length > 0) {
                this._fileService.getFile(
                  'reports/SubscriptionHistoryReport',
                  true,
                  requestBody
                );
              } else {
                this.toastService.error(
                  this.translateService.instant(
                    'TRANSLATE.DOWNLOAD_CUSTOMER_ATLEAST_SELECT_ONE_COLUMN_ERROR'
                  )
                );
              }
            }
          },
          (reason) => {
            /* Closing modal reference if cancelled or clicked outside of the popup*/
            modalRef.close();
          }
        );
      });
      this._subscriptionArray.push(subscription);
  }

  getCustomers() {
    this.customers = null;
    this.customersDropdown = [];
    const subscription = this._commonService.getCustomers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customersDropdown = [
        {
          C3Id: 'AllCustomers',
          Name: this.translateService.instant(
            'TRANSLATE.REPORT_SELECT_CUSTOMER_All'
          ),
        },
      ];
      if (this._commonService.entityName === 'Partner') {
        let reseller = [
          {
            EntityName: ' ',
            C3Id: 'AllResellers',
            Name: this.translateService.instant(
              'TRANSLATE.REPORT_SELECT_RESELLER_ALL'
            ),
          },
        ];
        this.customersDropdown = [...this.customersDropdown, ...reseller];
      }
      this.customerDetails = [];
      this.customerDetails = this.customerDetails.concat(response.Data);
      this.customerDetails.forEach((obj: any) => {
        let customer = [{ C3Id: obj.C3Id, Name: obj.Name }];
        this.customersDropdown = [...this.customersDropdown, ...customer];
      });
      this.customers = this.customerDetails;
    });
    this._subscriptionArray.push(subscription);
  }
  
  isProviderSelected(provider: any) {
    return this.ProviderSelection.some(p => p.Description === provider.Description);
  }
  isCategorySelected(category: any) {
    return this.CategorySelection.some(p => p.Description === category.Description);
  }
  isproviderCategorySelected(providerCategory: any) {
    return this.ProviderCategorySelection.some(p => p.ProviderCategoryName === providerCategory.ProviderCategoryName);
  }

  toggleProviderSelection(provider: any) {
    let idx = this.ProviderSelection.indexOf(provider);
    // Is currently selected
    if (idx > -1) {
      this.ProviderSelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.ProviderSelection.push(provider);
    }

    this.filterCategories();
    this.filterProviderCategories();
    this.filterByProvider();
  }

  filterCategories(isFunctionDefault?:boolean) {
    this.filteredCategories = this.Categories.filter((category: any) => {
      return (
        this.ProviderSelection.findIndex(
          (provider: any) => provider.ID == category.ProviderId
        ) > -1
      );
    });
    if(isFunctionDefault){
      return
    }
    if (
      (localStorage.getItem('ResellerC3Id') == undefined ||
        localStorage.getItem('ResellerC3Id') == 'null' ||
        localStorage.getItem('ResellerC3Id') == null) &&
      localStorage.getItem('EntityName') != undefined &&
      localStorage.getItem('EntityName') != 'null' &&
      localStorage.getItem('EntityName') != null &&
      localStorage.getItem('EntityName') == 'Customer'
    ) {
      if (
        this.filteredCategories != undefined &&
        this.filteredCategories != null &&
        this.filteredCategories.length > 0
      ) {
        let distributorOffersIndex = this.filteredCategories.findIndex(
          (each: any) => {
            each.Name === 'DistributorOffers';
          }
        );
        if (
          distributorOffersIndex != undefined &&
          distributorOffersIndex != null &&
          distributorOffersIndex >= 0
        ) {
          this.filteredCategories.splice(distributorOffersIndex, 1);
        }
      }
    }
    //Reset values in selection
    this.CategorySelection = this.CategorySelection.filter((category: any) => {
      return (
        this.filteredCategories.findIndex((each: any) => {
          each.ID === category.ID;
        }) > -1
      );
    });
    var partnerSelected = this.ProviderSelection.filter(provider => {
      return provider.Name === 'Partner'
    });
    if (partnerSelected.length === 0) {
      this.SubCategorySelection = [];
      this.isCustomSelected = false;
      this.filterBySubCategory();
    }
    this.SelectedCategory = this.CategorySelection.ID;
  }

  filterProviderCategories(isFunctionDefault?:boolean) {
    this.filteredProviderCategories = this.ProviderCategories.filter(
      (category: any) => {
        return (
          this.ProviderSelection.findIndex(
            (provider: any) => provider.ID === category.ProviderId
          ) > -1
        );
      }
    );
    if(isFunctionDefault){
      return
    }
    //Reset values in selection
    this.ProviderCategorySelection = this.ProviderCategorySelection.filter(
      (category: any) => {
        return (
          this.filteredProviderCategories.findIndex((each: any) => {
            each.ID === category.ID;
          }) > -1
        );
      }
    );
    this.SelectedProviderCategories =
      this.ProviderCategorySelection.ProviderCategoryName;
    this.cdRef.detectChanges();
  }

  filterByProvider() {
    this.SelectedProvider = [];
    this.SelectedProvider = this.ProviderSelection.map((obj: any) => obj.ID);
  }

  filterByBillingCycle() {
    this.SelectedBillingCycles = [];
    this.SelectedBillingCycles = this.BillingCycleSelection.map(
      (obj: any) => obj.ID
    );
  }

  getProviders() {
    const subscription = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.Providers = response || [];
    });
    this._subscriptionArray.push(subscription);
  }

  getCategoriesForSubscription() {
    const subscription = this._commonService
      .getCategoriesForSubscription()
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.Categories = response.Data;
        if(this.ProviderSelection){
            this.filterCategories(true);
        }
      });
      this._subscriptionArray.push(subscription);
  }

  getConsumptionTypes() {
    const subscription = this._commonService.getConsumptionTypes().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.ConsumptionTypes = response;
    });
    this._subscriptionArray.push(subscription);
  }

  getBillingCycles() {
    const subscription = this._commonService.getBillingCycles().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.BillingCycles = response;
    });
    this._subscriptionArray.push(subscription);
  }

  getProvidersCategories() {
    const subscription = this._commonService
      .getProvidersForSubscription()
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.ProviderCategories = response.Data;
        if(this.ProviderSelection){
          this.filterProviderCategories(true);
          this.filterByProvider();
        }
      });
      this._subscriptionArray.push(subscription);
  }

  getBillingPeriodsForSubscription() {
    this.BillingPeriods = [];
    const subscription = this._commonService
      .getBillingPeriodsForSubscription()
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.BillingPeriods = response.Data.reverse() || [];;
        if (this.BillingPeriods !== null && this.BillingPeriods.length > 0) {
          this.billingPeriodId =
            '' +
            this.BillingPeriods[
              this.BillingPeriods.length -
              this.defaultSelectedBillingPeriodIndex
            ].BillingPeriodId;
        }
      });
      this._subscriptionArray.push(subscription);
  }

  compareCustomers(option1: any, option2: any): boolean {
    return option1 && option2 ? option1.C3Id === option2.C3Id : option1 === option2;
  }

  toggleBillingCycleSelection(billingCycle: any) {
    let idx = this.BillingCycleSelection.indexOf(billingCycle);
    // Is currently selected
    if (idx > -1) {
      this.BillingCycleSelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.BillingCycleSelection.push(billingCycle);
    }

    this.filterByBillingCycle();
  }

  toggleConsumptionTypeSelection(consumptionType: any) {
    let idx = this.ConsumptionTypeSelection.indexOf(consumptionType);
    // Is currently selected
    if (idx > -1) {
      this.ConsumptionTypeSelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.ConsumptionTypeSelection.push(consumptionType);
    }

    this.filterByConsumptionType();
  }

  filterByConsumptionType() {
    this.SelectedConsumptionTypesToFilter = [];
    this.SelectedConsumptionTypesToFilter = this.ConsumptionTypeSelection.map(
      (obj: any) => obj.ID
    );
  }

  toggleCategorySelection(category: any) {
    var idx = this.CategorySelection.indexOf(category);
    // Is currently selected
    if (idx > -1) {
      this.CategorySelection.splice(idx, 1);
      this.SubCategorySelection = this.SubCategorySelection.filter(e => e.CategoryName != category.Name);
    }
    else {  // Is newly selected
      this.CategorySelection.push(category);
    }
    this.isCustomSelected = this.CategorySelection.some(item => item.Name.toLowerCase() === 'custom' || item.Name.toLowerCase() === 'distributoroffers' || item.Name.toLowerCase() === 'licensesupported');
    if (['custom', 'distributoroffers', 'licensesupported'].includes(category.Name.toLowerCase())) {
      let categories: any = _.map(this.CategorySelection, 'Name')
      categories = categories.join(',');
      if (categories.length > 0) {
        this._commonService.getSubCategories(categories, true).subscribe((res: any) => {
          this.subCategories = res
          this.cdRef.detectChanges();
        })
      }
      else {
        this.subCategories = [];
      }
      if (!this.isCustomSelected) {
        this.SubCategorySelection = [];
        this.filterBySubCategory();
      }
    }
    this.filterByCategory();
  }

  isSubCategorySelected(subCategory: any): boolean {
      return this.SubCategorySelection.some(item => item.Id === subCategory.Id);
  }
  

  toggleProviderSubCategorySelection(subCategory: any){
    let idx = this.SubCategorySelection.indexOf(subCategory);
    // Is currently selected
    if (idx > -1) {
      this.SubCategorySelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.SubCategorySelection.push(subCategory);
    }
    this.filterBySubCategory();
  }

  filterBySubCategory() {
    this.SelectedSubCategoryFilter = [];
    this.SelectedSubCategoryFilter = this.SubCategorySelection.map(
      (obj: any) => obj.Id
    );
  }

  filterByCategory() {
    this.SelectedCategory = [];
    this.SelectedCategory = this.CategorySelection.map((obj: any) => obj.ID);
  }

  toggleProviderCategorySelection(providerCategory: any) {
    let idx = this.ProviderCategorySelection.indexOf(providerCategory);
    // Is currently selected
    if (idx > -1) {
      this.ProviderCategorySelection.splice(idx, 1);
    } else {
      // Is newly selected
      this.ProviderCategorySelection.push(providerCategory);
    }

    this.filterByProviderCategory();
  }

  filterByProviderCategory() {
    this.SelectedProviderCategories = [];
    this.SelectedProviderCategories = this.ProviderCategorySelection.map(
      (obj: any) => obj.ProviderCategoryName
    );
  }

  filter() {
    this.reloadEvent.emit(true);
  }

  moveToSelectCustomersToValidate() {
    localStorage.setItem("billingPeriodIdForViewPostLogs", this.billingPeriodId);
    localStorage.setItem("EffectiveFrom", this.Search.EffectiveFrom ? this.Search.EffectiveFrom : null);
    localStorage.setItem("EffectiveTo", this.Search.EffectiveTo ? this.Search.EffectiveTo : null);
    localStorage.removeItem("selectedCustomerForPSAValidate");
    // this._router.navigate(['/partner/selectCustomersToValidate']);
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/selectCustomersToValidate`];
    c3Router.extras = { state: {} };
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
  }

  setData() {
    return {
      SelectedProvider: this.SelectedProvider,
      SelectedCategory: this.SelectedCategory,
      BillingCycleIds: this.SelectedBillingCycles,
      ProviderCategories: this.SelectedProviderCategories,
      SelectedConsumptionTypesToFilter: this.SelectedConsumptionTypesToFilter,
      SearchKeyword: this.Search.SearchKeyword,
      Customers: this.Search.Customers,
      EffectiveFrom: this.Search.EffectiveFrom,
      EffectiveTo: this.Search.EffectiveTo,
      BillingPeriodId: this.Search.BillingPeriod,
      PageSize: length,
      StartInd: this.pageStartInd,
      SortColumn:this.SortColumn,
      SortOrder:this.SortOrder,
      ProviderSelection: this.ProviderSelection || [],
      BillingCycleSelection: this.BillingCycleSelection || [],
      ConsumptionTypeSelection: this.ConsumptionTypeSelection || [],
      CategorySelection: this.CategorySelection || [],
      ProviderCategorySelection: this.ProviderCategorySelection || [],
      SelectedSubCategoryFilter: this.SelectedSubCategoryFilter,
      SubCategorySelection: this.SubCategorySelection || []
    };
}

  goToProductMapping() {
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`/partner/prodMapping/refresh-mapping`];
    c3Router.extras = { state: {} };
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
  }

  resetFilters() {
    this.Search.BillingPeriod = null;
    this.Search.Customers = null;
    this.Search.SearchKeyword = null;
    this.Search.EffectiveFrom = null;
    this.Search.EffectiveTo = null;
    this.ProviderSelection = [];
    this.BillingCycleSelection = [];
    this.ConsumptionTypeSelection = [];
    this.CategorySelection = [];
    this.ProviderCategorySelection = [];
    this.filteredCategories = [];
    this.filteredProviderCategories = [];
    this.SelectedProvider = '';
    this.SelectedCategory = '';
    this.SelectedBillingCycles = '';
    this.SelectedProviderCategories = null;
    this.SelectedConsumptionTypesToFilter = null;
    this.SubCategorySelection = [];
    this.subCategories = [];
    this.SelectedSubCategoryFilter = null;
    this.reloadEvent.emit(true);
  }


  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
function getActiveServiceDetail() {
  throw new Error('Function not implemented.');
}

