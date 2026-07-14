import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ScheduleRenewalListingService } from '../../services/schedule-renewal-listing.service';
import { CommonService } from 'src/app/services/common.service';
import { TranslateService } from '@ngx-translate/core';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CancelScheduledRenewalReasonPopupComponent } from 'src/app/modules/standalones/cancel-scheduled-renewal-reason-popup/cancel-scheduled-renewal-reason-popup.component';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { ToastService } from 'src/app/services/toast.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-nce-schedule-renewals-listing',
  templateUrl: './nce-schedule-renewals-listing.component.html',
  styleUrl: './nce-schedule-renewals-listing.component.scss'
})
export class NceScheduleRenewalsListingComponent extends C3BaseComponent implements OnInit {
  datatableConfig: ADTSettings | any;
  customerC3Id : any='';
  entityName : any = '';
  recordId : any = '';
  cancelledReason : any = '';
   // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
   @ViewChild('actions') actions: TemplateRef<any>;
   @ViewChild('validity') validity: TemplateRef<any>;
   @ViewChild('newSKUName') newSKUName: TemplateRef<any>;



  constructor(public _permissionService:PermissionService,
              public _dynamicTemplateService:DynamicTemplateService,
              public _router: Router,
              private _appService: AppSettingsService,
              private _scheduleRenewalListingRenewalService : ScheduleRenewalListingService,
              private _cdref : ChangeDetectorRef,
              private _commonService : CommonService,
              private _translateService: TranslateService,
              private _modalService: NgbModal,
              private _manageProductService: ManageProductService,
              private _toastService: ToastService,
              private pageInfo: PageInfoService
  ){
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.pageInfo.updateBreadcrumbs(['MENU_RENEWAL_MANAGER','SCHEDULE_RENEWAL_NCE_LISTING_HEADER_TAB']);
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_TAB"),true);
  }

  ngOnInit() : void{
    this.handleTableConfig();
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    if(this.entityName.toLowerCase() == this.cloudHubConstants.ENTITY_CUSTOMER){
      this.customerC3Id = this._commonService.recordId;
    }
  } 

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      let entityName = this._commonService.entityName;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, length, PageSize, PurchasedProductName } = mapParamsWithApi(dataTablesParameters);
          const searchParams = {
            PageIndex:(StartInd - 1) * PageSize + 1,
            PageCount: PageSize - 1,
            SearchkeyWord: PurchasedProductName,
            SortColumn: SortColumn || '',
            SortOrder: SortOrder,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            CustomerC3Id: this.customerC3Id
          }
          const subscription = this._subscription = this._scheduleRenewalListingRenewalService.getNCEScheduleRenewalsListing(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            if (Data.length > 0) {
              [{ TotalProductCount: recordsTotal }] = Data;
            }
            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
          })
          this._subscriptionArray.push(subscription);
        },
        columns : [
          {
            sortable: true,
            className:'col-md-2',
            title:this._translateService.instant('TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_CUSTOMER_NAME_TITLE'),
            visible: this._commonService.entityName === 'Partner' || this._commonService.entityName === 'Reseller',
            data:'CustomerName',
            render: function(data: any, type: any, row: any) {
              if (entityName === 'Partner' || entityName === 'Reseller') {
                return `<span class="fw-semibold">${data}</span>`;
              }
              return `<span>${data}</span>`;
            }
          
          },
          {
            searchable:true,
            className:'col-md-2',
            title: this._translateService.instant('TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_SKU_TITLE'),
            data:'PurchasedProductName',
            orderable: true,
            render: function(data: any, type: any, row: any) {
              if (entityName === 'Customer') {
                return `<span class="fw-semibold">${data}</span>`;
              }
              return `<span>${data}</span>`;
            }
          },
          {
            className:'col-md-1 text-end',
            title: this._translateService.instant('TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_SOURCE_QUANTITY_TITLE'),
            data: 'SourceQuantity',
            orderable:false
          },
          {
            className:'col-md-1 text-end',
            title: this._translateService.instant('TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_NEW_QUANTITY_TITLE'),
            data: 'NewQuantity',
            orderable:false
          },
          {
            type: 'string',
            className:'col-md-1',
            title: this._translateService.instant('TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_TERM_DURATION_TITLE'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.validity,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
          },
          {
            className:'col-md-1',
            title: this._translateService.instant('TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_BILLING_CYCLE_TITLE'),
            data:'SourceBillingCycle',
            orderable: false,
          },
          {
            type: 'string',
            className: 'col-md-1',
            title: this._translateService.instant('TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_END_DATE_TITLE'),
            data: 'NewProviderEffectiveEndDate',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
            orderable:false
          },
          {
            className: 'col-md-1',
            title: this._translateService.instant('TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_SCHEDULE_DATE_TITLE'),
            data: 'ScheduledDate',
             render: (data: string) => {
                          var datePipe = new C3DatePipe(this._appService);
                          return datePipe.transform(data);
                        },
            orderable: true
          },
          {
            type: 'string',
            className: 'col-md-2',
            title: this._translateService.instant('TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_NEW_SKU_TITLE'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.newSKUName,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          },
          {
            type: 'string',
            className: 'col-md-1 text-center',
            title: this._translateService.instant('TRANSLATE.SCHEDULE_RENEWAL_NCE_LISTING_HEADER_ACTION_TITLE'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          }
        ]

      }
      this._cdref.detectChanges();
    })
  }
  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}


  editScheduleRenewal(product : any){
    let internalCustomerProductId = product.InternalCustomerProductId;
    const productComponentDetails = {InternalCustomerProductId : internalCustomerProductId, ComponentName: "NCESchedueLisiting", PageMode:"Edit", C3UserId : product.C3UserId}
    this._router.navigate(['/renewalmanager/manageScheduleRenewalListing'],{state : productComponentDetails});
  }

  cancelScheduledRenewal(scheduledRenewal : any) {
    const modalRef = this._modalService.open(CancelScheduledRenewalReasonPopupComponent, { size: 'lg' });
    modalRef.result.then((reason) => {
      if (reason) {
        this.cancelledReason = reason;

        if (this.cancelledReason) {
          const model = {
            C3CustomerId: scheduledRenewal.CustomerC3Id,
            ServiceProviderCustomerRefId: scheduledRenewal.ServiceProviderCustomerRefId,
            ProviderProductId: scheduledRenewal.ProviderProductId,
            InternalCustomerProductId: scheduledRenewal.InternalCustomerProductId,
            InternalScheduleRenewalId: scheduledRenewal.InternalScheduleRenewalId,
            CancelledReason: this.cancelledReason,
            SupportedMarketCode: scheduledRenewal.SupportedMarketCode
          };

          const subscription = this._manageProductService.cancelScheduledRenewal(model).pipe(takeUntil(this.destroy$)).subscribe(
            (response: any) => {
              if (response.Status === 'Success') {
                this._toastService.success(this._translateService.instant('TRANSLATE.CANCEL_SCHEDULED_RENEWAL_SUCCESS_MESSAGE'));
              } else {
                this._toastService.error(this._translateService.instant('TRANSLATE.CANCEL_SCHEDULED_RENEWAL_FAILED_MESSAGE'));
              }
              this.reloadEvent.emit(true);
            }
          );
          this._subscriptionArray.push(subscription);
        }
      }
    },
      (reason) => {
        modalRef.close();
      });
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe()
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
