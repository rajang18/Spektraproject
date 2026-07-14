import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ProductRenewalManagementService } from 'src/app/services/product-renewal-management.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { FileService } from 'src/app/services/file.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-customer-products-renewalconsent',
  templateUrl: './customer-products-renewalconsent.component.html',
  styleUrl: './customer-products-renewalconsent.component.scss'
})
export class CustomerProductsRenewalconsentComponent extends C3BaseComponent implements OnInit, OnDestroy {
  isGridDataLoading: boolean;
  pageMode: string = 'RenewalManager'
  datatableConfig: ADTSettings | any;
  datatableConfig2: ADTSettings | any;
  historySearchCriteria: any = {};
  showHelpText = false;
  ownerShipDetails : any;
  globalDateFormat:any;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  reloadEvent2: EventEmitter<boolean> = new EventEmitter();

  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('providerEffectiveEndDate') providerEffectiveEndDate: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('noDataTemplate') noDataTemplate: TemplateRef<any>;
  @ViewChild('gridLoadingDataMessage') gridLoadingDataMessage: TemplateRef<any>;
  @ViewChild('subscriptionProductName') subscriptionProductName: TemplateRef<any>;
  @ViewChild('priceCurrencyFilter') priceCurrencyFilter: TemplateRef<any>;


  @ViewChild('propertiespills2') propertiespills2: TemplateRef<any>;
  @ViewChild('providerEffectiveEndDate2') providerEffectiveEndDate2: TemplateRef<any>;
  @ViewChild('noDataTemplate2') noDataTemplate2: TemplateRef<any>;
  @ViewChild('gridLoadingDataMessage2') gridLoadingDataMessage2: TemplateRef<any>;
  @ViewChild('subscriptionProductName2') subscriptionProductName2: TemplateRef<any>;
  @ViewChild('priceCurrencyFilter2') priceCurrencyFilter2: TemplateRef<any>;
  @ViewChild('quantityTemplate') quantityTemplate: TemplateRef<any>;
  @ViewChild('actions2') actions2: TemplateRef<any>;


  constructor(
    private _cdRef: ChangeDetectorRef,
    public _router: Router,
    private _notifierService: NotifierService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _commonService: CommonService,
    private _productRenewalManagementService: ProductRenewalManagementService,
    private _translateService: TranslateService,
    private _toastService: ToastService,
    private _fileService: FileService,
    private _pageInfo: PageInfoService,
    private _appService: AppSettingsService,   
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);

    const navigation = this._router.getCurrentNavigation();
  }

  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.switchTable(this.pageMode);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  switchTable(pageMode) {
    this.pageMode = pageMode;
    // this._cdRef.detectChanges();
    if (pageMode === 'RenewalManager') {
      this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.SCHEDULE_RENEWAL_CUSTOM_OFFER_LISTING_HEADER_TAB"),true);
      this._pageInfo.updateBreadcrumbs(['MENU_RENEWAL_MANAGER','SCHEDULE_RENEWAL_CUSTOM_OFFER_LISTING_HEADER_TAB']);
      this.handleTableConfig();
    }
    if (pageMode === 'RenewalManagerHistory') {
      this._pageInfo.updateTitle(this._translateService.instant('CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_HISTORY_HEADER'),true);
      this._pageInfo.updateBreadcrumbs(['MENU_RENEWAL_MANAGER','SCHEDULE_RENEWAL_CUSTOM_OFFER_LISTING_HEADER_TAB','CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_HISTORY_HEADER']);
   
      this.handleTableConfig2();
    }
  }
  onCaptureEvent(event: Event) { }

  handleTableConfig() {
    let subscription
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          let { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);

          if (SortColumn === null || SortColumn === undefined || SortColumn === '') {
            SortColumn = "RenewsOn";
            SortOrder = "asc";
            // nameFilter = Name
          }
          const searchParams = {
            PageIndex: (StartInd - 1) * PageSize + 1,
            SortColumn,
            SortOrder,
            PageCount: PageSize - 1,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
          }

          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._productRenewalManagementService.getSubscriptionsRenewalDetails(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            _.each(Data, (obj) => {
              if (obj.Ownership) {
                obj.Ownership = obj.Ownership.replace(/,/g, "<br>")
                if (obj.Ownership.indexOf("<br>") === -1) {
                  obj.Ownership = null;
                } else {
                  const text =this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_OWNERSHIP_DETAILS')
                  obj.Ownership = `<h6>${text}</h6>` + obj.Ownership;
                }
              }
            });
            let recordsTotal = 0;
            if (Data.length > 0) {
              [{ TotalRows: recordsTotal = 0 }] = Data;
            }

            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,

            });
            this.isGridDataLoading = false;
          });
          this._subscriptionArray.push(subscription);
        },
        
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_SUBSCRIPTION_NAME_TEXT'),
            defaultContent: '',
            className: 'col-lg-4',
            data: 'ProductName',
            type: 'string',
            ngTemplateRef: {
              ref: this.propertiespills,
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_QUANTITY_TEXT'),
            data: 'Quantity',
            className: 'col-lg-1 text-end pe-3',
            orderable: false,
            type: 'string',
            ngTemplateRef: {
              ref : this.quantityTemplate
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_PRICE_TEXT'),
            defaultContent: '',
            className: 'col-lg-2 text-end pe-3',
            orderable: false,
            type: 'string',
            ngTemplateRef: {
              ref: this.priceCurrencyFilter,
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_RENEWAL_DATE_TEXT'),
            defaultContent: '',
            className: 'col-lg-2',
            data: 'ProviderEffectiveEndDate',
            type: 'string',
            ngTemplateRef: {
              ref: this.providerEffectiveEndDate,
            },
          },

          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_ACTION_TEXT'),
            defaultContent: '',
            className: "col-lg-3 text-center",
            orderable: false,
            type: 'string',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],

      };
      this._cdRef.detectChanges();
    });
  }

  backToProducts() {
    this._router.navigate(['customer/products']);
  }

  gotoRenewalConsent() {
    this._router.navigate(['customer/customerproductsrenewalconsent']);
  }

  customerConsentOnSubscriptionRenewal(row, isConsent) {
    var text = isConsent === true ? "accept" : "reject";
    var productArray = [];
    row.isConsentProvided = isConsent;
    productArray.push(row);
    var body = {
      Product: productArray,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId
    }

    // saveCustomerConsentOnRenewal 
    let confirmationText = this._translateService.instant('TRANSLATE.CUSTOMER_CONSENT_ACCEPT_OR_REJECT_POPUP', { Consent: text, ProductName: row.ProductName });
    this._notifierService.confirm({ title: confirmationText, confirmButtonColor: '#17c653' }).then((result: { isConfirmed: any; }) => {
      if (result.isConfirmed) {
        const subscription = this._productRenewalManagementService.saveCustomerConsentOnRenewal(body).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Status == 'Success') {
            if (isConsent) {
              this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_CONSENT_ACCEPTED_MESSAGE'));
            } else {
              this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_CONSENT_REJECTED_MESSAGE'));
            }
            this.reloadEvent.emit(true);
          } else {
            this._toastService.error(response.data.ErrorMessage);
          }
        })
        this._subscriptionArray.push(subscription);
      }
    });
  }

  navigateToCustomerRenewalManager() {
    this._router.navigate(['customer/customerproductsrenewalconsent']);
  }

  handleTableConfig2() {
    let subscription
    setTimeout(() => {
      const self = this;
      this.datatableConfig2 = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          let { StartInd, Name, SortColumn, SortOrder, PageSize, ProductName } =
            mapParamsWithApi(dataTablesParameters);


          if (SortColumn === null || SortColumn === undefined || SortColumn === '') {
            SortColumn = "CreateDate";
            SortOrder = "desc";
            // nameFilter = Name
          }
          this.historySearchCriteria = {
            StartInd,
            ProductName: ProductName,
            SortColumn,
            SortOrder,
            PageSize,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
          }

          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._productRenewalManagementService.getRenewalConsentHistory(this.historySearchCriteria).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            _.each(Data, (obj) => {
              if (obj.Ownership != null && obj.Ownership != undefined) {
                obj.Ownership = obj.Ownership.replace(/,/g, "<br>")
                if (obj.Ownership.indexOf("<br>") === -1) {
                  obj.Ownership = null;
                } else {
                  obj.Ownership = '<h6>Ownership details</h6>' + obj.Ownership;
                }
              }
            });
            let recordsTotal = 0;
            if (Data.length > 0) {
              [{ TotalRows: recordsTotal = 0 }] = Data;
            }

            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,

            });
            this.isGridDataLoading = false;
          });
          this._subscriptionArray.push(subscription);
        },
        order: [[4, 'desc']],
        columns: [
          {
            searchable: true,
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_HISTORY_PRODUCT_NAME_TEXT'),
            data: 'ProductName',
            defaultContent: '',
            type: 'string',
            ngTemplateRef: {
              ref: this.subscriptionProductName2,
            },
            className: 'col-md-3'
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_HISTORY_QUANTITY_TEXT'),
            data: 'Quantity',
            orderable: false,
            className: 'col-md-1 text-end pe-3'
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_HISTORY_PRICE_TEXT'),
            defaultContent: '',
            orderable: false,
            type: 'string',
            ngTemplateRef: {
              ref: this.priceCurrencyFilter,
            },
            className: 'col-md-1 text-end pe-3'
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_HISTORY_USER_NAME_TEXT'),
            data: 'UserName',
            orderable: false,
            className: 'col-md-2'
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_HISTORY_CREATE_DATE_TEXT'),
            defaultContent: '',
            data: 'CreateDate',
            type: 'string',
            ngTemplateRef: {
              ref: this.providerEffectiveEndDate2,
            },
            className: 'col-md-1'
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_RENEWAL_CONSENT_HISTORY_ACTION_TEXT'),
            defaultContent: '',
            type: "string",
            orderable: false,
            className: "col-md-1",
            ngTemplateRef: {
              ref: this.actions2,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],

      };
      this._cdRef.detectChanges();
    });
  }
  exportReconciliationReport() {
    this._fileService.getFile('reports/ExportReconciliationReport', true)
  }

  downloadHistory() {
    this._fileService.getFile('reports/exportRenewalConsentHistoryReport', true, this.historySearchCriteria);
  }

  getOwnerShipDetails(data : any){
    this.ownerShipDetails = data.Ownership;
  }
}
