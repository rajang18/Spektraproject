import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { LicenseConsumptionReportService } from 'src/app/services/license-consumption-report.service';
import { catchError, of, takeUntil } from 'rxjs';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { FileService } from 'src/app/services/file.service';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslationModule } from '../../i18n';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { PermissionService } from 'src/app/services/permission.service';
import { Router, RouterLink } from '@angular/router';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonNoRecordComponent } from '../common-no-record/common-no-record.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  standalone: true,
  imports: [CommonModule, NgSelectModule, C3TableComponent, FormsModule, ReactiveFormsModule, TranslationModule, NgbDropdownModule, NgbModule, RouterLink,C3CommonModule,CommonNoRecordComponent],
  selector: 'app-partner-license-consumption-report',
  templateUrl: './partner-license-consumption-report.component.html',
  styleUrl: './partner-license-consumption-report.component.scss'
})
export class PartnerLicenseConsumptionReportComponent extends C3BaseComponent implements OnInit {
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  datatableConfig: ADTSettings;
  entityName: string | null = '';
  recordId: string | null = '';
  customerId: number | null = 0;
  customerC3Id: string | null = '';
  customerName: string | null = '';
  currentProviderTenantId: any;
  tenants: any[] = [];
  tenantsCount: any;
  hasLicenseTrackingAllowed: string = 'false';
  @ViewChild('c3subscriptionNames') c3subscriptionNames: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  isLoading  : boolean = true;
  licenseConsumptionReportData : any[] = [];
 
  //Action buttons
  permissions = {
    HasReleaseSeats: "Denied",
  };

  constructor(
    private _commonService: CommonService,
    private _licenseConsumptionService: LicenseConsumptionReportService,
    private _fileService: FileService,
    private _cdRef: ChangeDetectorRef,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
  }

  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    if (this.entityName === 'Partner' || this.entityName === 'Reseller') {
      var customerIdInt = localStorage.getItem("ReportCustomerID");
      if (customerIdInt != null) {
        this.customerId = Number(customerIdInt);
      }
      this.customerC3Id = localStorage.getItem("ReportC3CustomerID"),
        this.customerName = localStorage.getItem("ReportCustomerName")
    }
    else {
      this.customerC3Id = this.recordId;
    }
    this.hasPermission();
    this.getCustomerTenants();
    this.handleTableConfig();
    
    this.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.LICENSECONSUMPTION_BREADCRUMB_BUTTON_TEXT_LICENSE_CUNSUMPTION'),true);
    if(this.entityName == 'Partner' || this.entityName == 'Reseller'){
      this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','CUSTOMER_REPORTS','LICENSECONSUMPTION_BREADCRUMB_BUTTON_TEXT_LICENSE_CUNSUMPTION']);
    }
    else{
      this.pageInfo.updateBreadcrumbs(['MENU_BREADCRUM_BUTTON_TEXT_MICROSOFT','LICENSECONSUMPTION_BREADCRUMB_BUTTON_TEXT_LICENSE_CUNSUMPTION']);
    }
  }

  backToList() { 
    this.c3RouterService.backToHistory(this.keyForData,'partner/customers');
  }

  hasPermission() {
    this.permissions.HasReleaseSeats = this._permissionService.hasPermission(CloudHubConstants.SAVE_CUSTOMER_PRODUCTS);
  }

  handleTableConfig() {
    if (this.currentProviderTenantId != undefined && this.currentProviderTenantId != null) {
      this.licenseConsumptionReportData  = [];
      this.isLoading = true;
      setTimeout(() => {
        const self = this;
        this.datatableConfig = {
          serverSide: true,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
          ajax: (dataTablesParameters: any, callback: any) => {
            const customerC3Id: string = this.customerC3Id;
            const currentProviderTenatId: string = this.currentProviderTenantId;
            this._subscription && this._subscription?.unsubscribe();
            const subscription =  this._licenseConsumptionService
              .getList({
                customerC3Id,
                currentProviderTenatId
              })
              .pipe(
                catchError((err) => {
                  let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorDetail);
                  this._toastService.error(errmsg, {
                    timeOut: 5000
                  });
                  this.licenseConsumptionReportData  = [];
                  this.isLoading = false;
                  return of(null);
                })
              )
              .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
                Data.forEach((subscription: any) => {
                  let index = Data.indexOf(subscription);
                  if (subscription.C3SubcriptionNames != null) {
                    this.licenseConsumptionReportData.push(subscription);
                    this.isLoading = false;
                    Data[index].C3SubcriptionNames = subscription.C3SubcriptionNames.split(',');
                    if (this._permissionService.hasPermission('ACCESS_USER_LICENSE_TRACKING_VIEW') === 'true') {
                      subscription.CanReduceSeat = subscription.CanReduceSeat ? subscription.CanReleaseSeatInLicenseTracking : subscription.CanReduceSeat;
                    }
                  }
                })
                let recordsTotal = 0;
                if (Data.length > 0) {
                  recordsTotal = Data.length;
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
              title: this._translateService.instant('TRANSLATE.LICENSECONSUMPTION_LIST_TABLE_HEADER_SUBSCRIPTION_NAME'),
              className: " col-md-2",
              data: 'PlanProductName',
              orderable : false,
              render:(data:string)=>{
                return `<span class="fw-semibold">${data}</span>`
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.LICENSECONSUMPTION_LIST_TABLE_HEADER_MAPPED_PRODUCTS'),
              data: 'C3SubcriptionNames',
              orderable : false,
              className: "col-md-3 ",
              defaultContent: '',
              ngTemplateRef: {
                ref: this.c3subscriptionNames,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.LICENSECONSUMPTION_LIST_TABLE_HEADER_PURCHASED_QUANTITY'),
              className: " col-md-2 text-end pe-8",
              data: 'TotalUnits',
              orderable : false,
            },
            {
              title: this._translateService.instant('TRANSLATE.LICENSECONSUMPTION_LIST_TABLE_HEADER_ASSIGNED_QUANTITY'),
              className: "col-md-2 text-end pe-8",
              data: 'ConsumedUnits',
              orderable : false,
            },
            {
              title: this._translateService.instant('TRANSLATE.LICENSECONSUMPTION_LIST_TABLE_HEADER_UNUSED_QUANTITY'),
              className: "col-md-2 text-end pe-8",
              data: 'AvailableUnits',
              orderable : false,
            },
            {
              title: this._translateService.instant('TRANSLATE.LICENSECONSUMPTION_LIST_TABLE_HEADER_TEXT_ACTION'),
              className: "col-md-1 text-end",
              orderable : false,
              defaultContent: '',
              visible: this.permissions.HasReleaseSeats === 'Allowed',
              ngTemplateRef:this.permissions.HasReleaseSeats === 'Allowed'? {
                ref: this.actions,
                context: {
                  captureEvents: self.onCaptureEvent.bind(self)
                }
              }: null
            }
          ]
        }
        this._cdRef.detectChanges();
      })
    }
    else {
      this.getCustomerTenants();
    }
  };

  onCaptureEvent(event: Event) { }

  getCustomerTenants() {
    const subscription =  this._licenseConsumptionService.getCustomerTenants(this.customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status == "Success") {
        this.tenants = response.Data;
        if (this.tenants !== undefined && this.tenants !== null) {
          this.tenantsCount = this.tenants.length;
        }

        this.tenants.forEach((tenant: { IsDefault: boolean; CustomerRefId: any; }) => {
          if (tenant.IsDefault == true) {
            this.currentProviderTenantId = tenant.CustomerRefId;
          }
        })
        this.handleTableConfig();
      }
    })
    this._subscriptionArray.push(subscription);
  }

  reloadCustomerTenant() {
    this.reloadEvent.emit(true);
  }

  exportLicenseConsumptionForServiceProviderCustomer() {
    this._fileService.getFile(`Customers/${this.customerC3Id}/Providers/Microsoft/tenants/${this.currentProviderTenantId}/licenseconsumptionreportAsCsv`)
  }

  releaseUnusedSeats(product: any) {
    product.C3SubcriptionNames = null;
    this.hasLicenseTrackingAllowed = this._permissionService.hasPermission('ACCESS_USER_LICENSE_TRACKING_VIEW');
    const subscription =  this._licenseConsumptionService.releaseUnusedSeats(this.entityName, this.recordId, this.hasLicenseTrackingAllowed, product).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status == "Success") {
        this._toastService.success(this._translateService.instant('USER_LICENSE_TRACKING_NOTIFICATION_REQUEST_TO_RELEASE_SEATS_IS_BEING_PROCESSED'));
        this.reloadCustomerTenant();
      }
      else {
        this._toastService.error(this._translateService.instant('USER_LICENSE_TRACKING_NOTIFICATION_ERROR_OCCURRED_WHILE_RELEASING_SEATS'));
      }
    })
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
