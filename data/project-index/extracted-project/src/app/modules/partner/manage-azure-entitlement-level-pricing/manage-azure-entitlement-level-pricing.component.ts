import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageAzureEntitlementsService } from 'src/app/services/manage-azure-entitlements.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Entity } from 'src/app/shared/models/enums/enums';
import { AzureEntitlementLevelPriceChangePopupComponent } from '../../standalones/azure-entitlement-level-price-change-popup/azure-entitlement-level-price-change-popup.component';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { FileService } from 'src/app/services/file.service';
import { catchError, of } from 'rxjs';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-manage-azure-entitlement-level-pricing',
  templateUrl: './manage-azure-entitlement-level-pricing.component.html',
  styleUrl: './manage-azure-entitlement-level-pricing.component.scss'
})
export class ManageAzureEntitlementLevelPricingComponent extends C3BaseComponent implements OnInit {
  entityName: string | null;
  recordId: string | null;
  isPartnerLevel: boolean = false;
  providerTenantsCount: number | null = null;
  providerCustomerCount: number | null = null;
  currentC3CustomerId: any = null;
  allCustomers: any[] = [];
  provider = 'Microsoft';
  currentEntity: any = null;
  currentRecordId: any = null;
  allTenants: any[] = [];
  Tenants: any[] = [];
  selectedServiceProviderCustomer: any = {};
  subscriptionDataSource: any[] = [];
  azureplan: any;
  currentSubscriptionId: any;
  allSubscriptions: any[] = [];
  customerId: any;
  tenantServiceProviderCustomerId: any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  dateFormat: string = "";
  datatableConfig: ADTSettings;
  showHelpText: boolean = false;
  dataLoading: boolean = true;
  @ViewChild('name') name: TemplateRef<any>;
  @ViewChild('createDate') createDate: TemplateRef<any>;
  @ViewChild('price') price: TemplateRef<any>;
  @ViewChild('action') action: TemplateRef<any>;
  @ViewChild('buttonRef') buttonRef!: ElementRef;
  @ViewChild('buttonRef1') buttonRef1!: ElementRef;

  constructor(
    private _commonService: CommonService,
    private _ManageAzureEntitlementsService: ManageAzureEntitlementsService,
    private _translateService: TranslateService,
    private _cdRef: ChangeDetectorRef,
    private _modalService: NgbModal,
    private pageInfo: PageInfoService,
    private _toastService: ToastService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private _fileService: FileService,
    private _notifierService: NotifierService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
  }

  permissions = {
    HasExportAzureEntitlementLevelPricing: 'Denied',
    HasManageAzureEntitlementLevelPricing: 'Denied',
  }

  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENUS_AZURE_ENTITLEMENT_LEVEL_PRICING"), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_CUSTOMER_MICROSOFT', 'MENUS_AZURE_ENTITLEMENT_LEVEL_PRICING']);
    this.hasPermissons();
    this.getApplicationData();
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;

    if (this.entityName === "Partner" || this.entityName === "Reseller") {
      this.isPartnerLevel = true;
    }

    if (!this.isPartnerLevel) {
      if (this.entityName === Entity.Partner || this.entityName === Entity.Reseller) {
        this.isPartnerLevel = true;
        this.getTenants();
      }
      else if (this.entityName === Entity.Customer) {
        this.currentC3CustomerId = this.recordId;
        this.onCustomerChange();
      }
      else {
        const subscription = this._commonService.getContextByEntityAndRecordId().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          this.currentC3CustomerId = response.CustomerC3Id;
          this.onCustomerChange();
        });
        this._subscriptionArray.push(subscription);
      }
    }
    else {
      this.getCustomers();
    }
  }

  hasPermissons() {
    this.permissions.HasExportAzureEntitlementLevelPricing = this._permissionService.hasPermission('EXPORT_MICROSOFT_AZURE_ENTITLEMENT_LEVEL_PRICING');
    this.permissions.HasManageAzureEntitlementLevelPricing = this._permissionService.hasPermission('MANAGE_MICROSOFT_AZURE_ENTITLEMENT_LEVEL_PRICING');
  }
  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.dateFormat = response.Data.DateFormat;
    });
    this._subscriptionArray.push(subscription);
  }

  getCustomers() {
    this.allCustomers = [];
    const subscription = this._ManageAzureEntitlementsService.getCustomers(this.provider).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      var data = response;
      data.filter((item: any) => {
        var i = this.allCustomers.findIndex(x => (x.C3Id == item.C3Id));
        if (i <= -1) {
          this.allCustomers.push(item);
        }
      });
      this.allCustomers.sort(e => e.Name);
      if (this.allCustomers !== undefined && this.allCustomers !== null && this.allCustomers.length > 0) {
        this.providerCustomerCount = this.allCustomers.length;
        if (!this.currentC3CustomerId) {
          this.currentC3CustomerId = this.allCustomers[0].C3Id;
        }
      }
      else {
        this.providerCustomerCount = 0;
      }
      this.onCustomerChange();
    });
    this._subscriptionArray.push(subscription);
  }

  onCustomerChange() {
    this.dataLoading = true;
    this.currentEntity = this.entityName == Entity.Partner ? Entity.Customer : this.entityName;
    this.currentRecordId = this.entityName == Entity.Partner ? this.currentC3CustomerId : this.recordId;
    this.getTenants();
  }

  getTenants() {
    if (this.currentC3CustomerId) {
      this.currentEntity = this.entityName == Entity.Partner ? Entity.Customer : this.entityName
      this.currentRecordId = this.entityName == Entity.Partner ? this.currentC3CustomerId : this.recordId

      const subscription = this._ManageAzureEntitlementsService.getTenants(this.provider, this.currentEntity, this.currentRecordId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.allTenants = response;
        this._cdRef.detectChanges();
        this.allTenants.sort((a, b) => a.CustomerName > b.CustomerName ? 1 : -1);
        this.Tenants = [...this.allTenants];
        if (this.Tenants !== undefined && this.Tenants !== null) {
          this.providerTenantsCount = this.Tenants.length;
        }
        else {
          this.providerTenantsCount = 0;
        }
        this.selectedServiceProviderCustomer = this.Tenants[0];
        this.tenantServiceProviderCustomerId = this.selectedServiceProviderCustomer.ServiceProviderCustomerId;
        this.getAzureSubscriptions();
      });
      this._subscriptionArray.push(subscription);
    }
    else {
      this.providerTenantsCount = 0;
    }
  }

  onTenantChange() {
    this.dataLoading = true;
    this.selectedServiceProviderCustomer = this.Tenants.find((v) => v.ServiceProviderCustomerId == this.tenantServiceProviderCustomerId);
    this.getAzureSubscriptions();
  }

  getAzureSubscriptions() {
    if (this.currentC3CustomerId !== null && this.selectedServiceProviderCustomer !== null) {
      const subscription = this._ManageAzureEntitlementsService.getAzureSubscriptionsForEntitlementLevelPricing({
        CustomerC3Id: this.currentC3CustomerId,
        ProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
        CurrencyCode: null,
        EntityName: this._commonService.entityName,
        RecordId: this._commonService.recordId,
        ProviderId: this.selectedServiceProviderCustomer.ProviderId
      })
        .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
          if (Data !== null) {
            this.subscriptionDataSource = Data;
            this.azureplan = Data.filter((sub: { IsAzurePlan: boolean; }) => sub.IsAzurePlan === true);
            this.subscriptionDataSource = this.azureplan;
            this.currentSubscriptionId = this.azureplan[0]?.InternalCustomerProductId;
            this.allSubscriptions = Data;
            this._cdRef.detectChanges();
            this.customerId = Data.length > 0 ? this.allSubscriptions[0].InternalCustomerId : "";
            this.handleTableConfig();
          }
        });
        this._subscriptionArray.push(subscription);
    }
  }

  handleTableConfig() {
    this.datatableConfig = null;
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: 10,
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, } =
            mapParamsWithApi(dataTablesParameters);
          const searchParams = {
            Name,
            StartInd,
            PageSize,
            SortColumn,
            SortOrder,
          }
          const subscription = this._ManageAzureEntitlementsService.getEntitlementsForPricing(this.currentSubscriptionId, searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            if (Data.length > 0) {
              [{ TotalRows: recordsTotal }] = Data;
            }
            this.dataLoading = false;
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
            title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_LABEL_ENTITLEMENT_NAME'),
            data: 'Name',
            className: 'col-md-4',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.name,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: this.onCaptureEvent.bind(self),
              },
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_LABEL_ENTITLEMENT_ID'),
            data: 'EntitlementId',
            className: 'col-md-4'
          },
          {
            title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_LABEL_CREATED_DATE'),
            data: 'CreatedDate',
            className: 'col-md-2',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_LABEL_PRICE'),
            data: 'Price',
            className: 'col-md-1 text-end pe-3',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.price,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: this.onCaptureEvent.bind(self),
              },
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_LABEL_ACTION'),
            defaultContent: '',
            className: 'col-md-1 text-end column-title-pe-5',
            orderable: false,
            ngTemplateRef: this.permissions.HasManageAzureEntitlementLevelPricing == 'Allowed' ? {
              ref: this.action,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: this.onCaptureEvent.bind(self),
              },
            } : null,
            visible: this.permissions.HasManageAzureEntitlementLevelPricing == 'Allowed'
          },
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  exportFilter() {
    let selectAll = false;
    this._fileService.getFile(
      `azureSubscriptions/${this.currentSubscriptionId}/${selectAll}/GetAllEntitlementsForPricingReportExportCSV/`,
      true
    );
  }

  exportAll() {
    let selectAll = true;
    this._fileService.getFile(
      `azureSubscriptions/${this.currentSubscriptionId}/${selectAll}/GetAllEntitlementsForPricingReportExportCSV/`,
      true
    );
  }

  editPriceDetails(data: any) {
    const modalRef = this._modalService.open(AzureEntitlementLevelPriceChangePopupComponent, { size: 'lg' });
    modalRef.componentInstance.data = data;
    modalRef.result.then((result) => {
      if (result) {
        let reqBody = {
          AzurePlanName: this.subscriptionDataSource[0].SubscriptionName,
          AzurePlanId: this.subscriptionDataSource[0].SubscriptionId,
          EntitlementName: data.Name,
          OldPrice: data.Price,
          NewPrice: result.newPrice,
        }
        const subscription = this._ManageAzureEntitlementsService.saveEntitlementPrice(data.EntitlementInternalCustomerProductId, reqBody)
          .pipe(
            catchError((err) => {
              let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
              this._toastService.error(errmsg, {
                timeOut: 5000
              });
              return of(null);
            })
          ).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
            if (res.Status == 'Success') {
              this._toastService.success(this._translateService.instant("TRANSLATE.ENTITLEMENT_MANAGEMENT_PRICE_CHANGE_SUCCESSFULLY"));
              this.handleTableConfig();
            }
          });
          this._subscriptionArray.push(subscription);
      }
      setTimeout(() => this.buttonRef.nativeElement.blur(), 100);
      setTimeout(() => this.buttonRef1.nativeElement.blur(), 100);
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  revertPriceDetails(data: any) {
    let confirmationText = this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_POPUP_CONFIRMATION_REVERT_SALE_PRICE');
    this._notifierService.confirm({ title: confirmationText, confirmButtonColor: 'green' })
      .then((result: { isConfirmed: boolean }) => {
        if (result.isConfirmed) {
          let reqBody = {
            AzurePlanName: this.subscriptionDataSource[0].SubscriptionName,
            AzurePlanId: this.subscriptionDataSource[0].SubscriptionId,
            EntitlementName: data.Name,
            OldPrice: data.Price,
            NewPrice: this.subscriptionDataSource[0].Price,
          }
          const subscription = this._ManageAzureEntitlementsService.revertEntitlementPrice(data.EntitlementInternalCustomerProductId, reqBody)
            .pipe(
              catchError((err) => {
                let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
                this._toastService.error(errmsg, {
                  timeOut: 5000
                });
                return of(null);
              })
            ).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
              if (res.Status == 'Success') {
                this._toastService.success(this._translateService.instant("TRANSLATE.ENTITLEMENT_MANAGEMENT_PRICE_REVERTED_SUCCESSFULLY"));
                this.handleTableConfig();
              }
            })
            this._subscriptionArray.push(subscription);
        }
      });
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
  onCaptureEvent(event: Event) { }
}
