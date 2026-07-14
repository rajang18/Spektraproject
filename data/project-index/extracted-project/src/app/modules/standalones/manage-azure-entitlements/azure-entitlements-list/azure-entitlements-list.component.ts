import { ChangeDetectorRef, Component, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { C3TableComponent } from '../../c3-table/c3-table.component';
import { TranslationModule } from 'src/app/modules/i18n/translation.module';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { ManageAzureEntitlementsService } from 'src/app/services/manage-azure-entitlements.service';
import { FormsModule } from '@angular/forms';
import { mapParamsWithApi } from '../../c3-table/c3-table-utils';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { AzureEntitlementsAddComponent } from '../azure-entitlements-add/azure-entitlements-add.component'; 
import { interval, switchMap, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { ToastService } from 'src/app/services/toast.service'; 
import { NgClass } from '@angular/common';
import { Entity } from 'src/app/shared/models/enums/enums';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { NotifierService } from 'src/app/services/notifier.service';
@Component({
  selector: 'app-azure-entitlements-list',
  standalone: true,
  imports: [TranslationModule, C3TableComponent, FormsModule, NgbTooltip,C3CommonModule, NgClass],
  templateUrl: './azure-entitlements-list.component.html',
  styleUrl: './azure-entitlements-list.component.scss'
})
export class AzureEntitlementsListComponent extends C3BaseComponent implements OnInit {

  entityName: string | null;
  recordId: string | null;
  currentCustomer: any = null;
  isPartnerLevel: boolean = false;
  allCustomers: any[] = [];
  subscriptionDataSource: any[] = [];
  allSubscriptions: any[] = [];
  currentSubscription: any = null;
  provider = 'Microsoft';
  Tenants: any[] = [];
  allTenants: any[] = [];
  selectedServiceProviderCustomerId: any = null;
  currentC3CustomerId: any = null;
  providerTenantsCount: number | null = null;
  providerCoustomerCount: number | null = null;
  entitlementList: any[] = [];
  parentProviderSubscriptionId: any = null;
  currentEntity: any = null;
  currentRecordId: any = null;
  pageMode = "list";
  timerHandleForAddEntitlementStatus: any
  isShowStatus = false;
  isSowSiteDepartment = false;
  datatableConfig: ADTSettings;
  currentSubscriptionId: any;
  customerId: any;
  addEntitlementStatus: any;
  readyToComplete: boolean;
  currentBatchId: any;
  templateContent: any;
  azureplan: any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  constructor(private _commonService: CommonService,
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
    private _notifierService: NotifierService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
  }

  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT'),true);
    this.pageInfo.updateBreadcrumbs(['MENUS_CUSTOMER_MICROSOFT','ENTITLEMENT_MANAGEMENT']);
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;

    if (this.entityName === Entity.Partner || this.entityName === Entity.Reseller) {
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

  getTenants() {

    if (this.currentC3CustomerId) {
      this.currentEntity = this.entityName == Entity.Partner ? Entity.Customer : this.entityName;
      this.currentRecordId = this.entityName == Entity.Partner ? this.currentC3CustomerId : this.recordId;

      const subscription = this._ManageAzureEntitlementsService.getTenants(this.provider, this.currentEntity, this.currentRecordId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.allTenants = response;
        this._cdRef.detectChanges();
        this.allTenants.sort((a, b) => a.CustomerName > b.CustomerName ? 1 : -1);
        this.Tenants = [...this.allTenants];
        if (this.Tenants !== undefined && this.Tenants !== null) {
          this.providerTenantsCount = this.Tenants.length;
        }
        this.selectedServiceProviderCustomerId = this.Tenants[0].CustomerRefId;
        this.getAzureSubscriptions();
      });
      this._subscriptionArray.push(subscription);
    }
    else {
      this.providerTenantsCount = 0;
    }
  }

  handleTableConfig() { 
    this.pageMode = "list"
    const self = this;
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
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
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._ManageAzureEntitlementsService.getEntitlements(this.currentSubscriptionId, searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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
            title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_LABEL_ENTITLEMENT_NAME'),
            data: 'Name',
            searchable:true
          },
          {
            title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_LABEL_ENTITLEMENT_ID'),
            data: 'EntitlementId'
          },
          {
            title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_LABEL_SITE_NAME'),
            data: 'SiteName'
          },
          {
            title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_LABEL_DEPARTMENT_NAME'),
            data: 'DepartmentName'
          },
          {
            title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_LABEL_CREATED_DATE'),
            data: 'CreatedDate',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          }
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  complete() {
    const subscription = this._ManageAzureEntitlementsService.complete(this.currentBatchId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === "Success") {
        this._toastService.success(this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_NOTIFICATION_COMPLETED'));
        this.handleTableConfig();
        this.isShowStatus = false;
      }
    });
    this._subscriptionArray.push(subscription);
  }

  loadStatusView() {
    let statusSearchModel = {
      CustomerC3Id: this.currentC3CustomerId,
      ServiceProviderCustomerId: this.selectedServiceProviderCustomerId,
      AzurePlanId: this.subscriptionDataSource[0].SubscriptionId
    };

    const subscription = this._ManageAzureEntitlementsService.loadStatusView(statusSearchModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === "Success") {
        this.addEntitlementStatus = response.Data;
        let progresscount = 0;
        this.addEntitlementStatus.forEach((entitlement: any) => {
          if (entitlement.Status === "InProgress" || entitlement.Status === "Submitted") {
            progresscount++;
          } else {
            if (!(progresscount > 0)) {
              this.readyToComplete = true;
            }
          }
        });
        if (this.addEntitlementStatus.length > 0) {
          this.currentBatchId = this.addEntitlementStatus[0].BatchId;
          this.pageMode = "status";
          if (!this.readyToComplete) {
            this.pollForStatusOfBulkAddEntitlement();
          }
          this.isShowStatus = true;
        } else {
          this.isShowStatus = false;
        }
        this._cdRef.detectChanges();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  // function to poll for status in periodic interval

  pollForStatusOfBulkAddEntitlement() {
    this.stopPollingForAddEntitlementStatus();

    if (this.readyToComplete === false && this.timerHandleForAddEntitlementStatus === 0 && this.pageMode === 'status') {
      const subscription = this.timerHandleForAddEntitlementStatus = interval(30000).pipe(
        switchMap(() => {
          this.loadStatusView();
          return [];
        })
      ).pipe(takeUntil(this.destroy$)).subscribe();
      this._subscriptionArray.push(subscription);
    }
  }

  // function to terminate the process of polling

  stopPollingForAddEntitlementStatus() {
    if (this.timerHandleForAddEntitlementStatus) {
      this.timerHandleForAddEntitlementStatus.unsubscribe();
      this.timerHandleForAddEntitlementStatus = null;
    }
  }

  addEntitlement() {
    var reqBody =
    {
      currentC3CustomerId: this.currentC3CustomerId,
      azurePlanId: this.subscriptionDataSource[0].SubscriptionId,
      serviceProviderCustomerId: this.selectedServiceProviderCustomerId
    }
    const modalRef = this._modalService.open(AzureEntitlementsAddComponent, { size: 'lg' });
    modalRef.componentInstance.templateContent = this.templateContent;
    modalRef.componentInstance.reqBody = reqBody;
    modalRef.result.then((model) => {
      model.CustomerC3Id = this.currentC3CustomerId;
      model.ServiceProviderCustomerId = this.selectedServiceProviderCustomerId;
      model.AzurePlanId = this.subscriptionDataSource[0].SubscriptionId;
    const subscription = this._ManageAzureEntitlementsService.azureEntitlements(model).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if(response.Status === "Success"){
        this._notifierService.success({title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_NOTIFICATION_ENQUEUED_REQUEST')});
        this.loadStatusView()
      }
      else{
      this._notifierService.success({title: this._translateService.instant('TRANSLATE.ENTITLEMENT_MANAGEMENT_NOTIFICATION_ENQUEUED_REQUEST_FAILED')});
      }
    });
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  getAzureSubscriptions() {
    this.currentSubscriptionId = null;
    this.subscriptionDataSource = [];
    if (this.currentC3CustomerId !== null && this.selectedServiceProviderCustomerId !== null) {

      var providerId = this.Tenants?.filter((e: any) => e?.CustomerRefId == this.selectedServiceProviderCustomerId)[0]?.ProviderId;

      const subscription = this._ManageAzureEntitlementsService.getAzureSubscriptions({
        CustomerC3Id: this.currentC3CustomerId,
        ProviderCustomerId: this.selectedServiceProviderCustomerId,
        CurrencyCode: null,
        EntityName: this._commonService.entityName,
        RecordId: this._commonService.recordId,
        ProviderId: providerId
      })
        .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
          if (Data !== null) {
            //this.subscriptionDataSource = Data;
            this.azureplan = Data.filter((sub: { IsAzurePlan: boolean; }) => sub.IsAzurePlan === true);
            if (this.azureplan != undefined && this.azureplan != null) {
              this.subscriptionDataSource = this.azureplan;
              this.currentSubscriptionId = this.azureplan[0]?.SubscriptionId;
              //this.allSubscriptions = Data;
              this._cdRef.detectChanges();
              //this.customerId = Data.length > 0 ? this.allSubscriptions[0].InternalCustomerId : "";
              if (this.currentSubscriptionId !== undefined) {
                this.handleTableConfig();
                this.reloadEvent.emit(true);
              }
            }
          }
        });
        this._subscriptionArray.push(subscription);
    }
  }

  onCustomerChange() {
    this.currentEntity = this.entityName == Entity.Partner ? Entity.Customer : this.entityName;
    this.currentRecordId = this.entityName == Entity.Partner ? this.currentC3CustomerId : this.recordId;
    this.getTenants();
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
        this.providerCoustomerCount = this.allCustomers.length;
        if (!this.currentC3CustomerId) {
          this.currentC3CustomerId = this.allCustomers[0].C3Id;
        }
      }
      this.onCustomerChange();
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
