import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CouponAssignmentService } from 'src/app/modules/partner/coupons/services/coupon-assignment.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';
import { C3RouterService } from 'src/app/services/c3-router.service';
@Component({
  selector: 'app-coupon-assignment',
  templateUrl: './coupon-assignment.component.html',
  styleUrl: './coupon-assignment.component.scss'
})
export class CouponAssignmentComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  isEditing: boolean[] = [];
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  @ViewChild('couponApplicability') couponApplicability: TemplateRef<any>;
  @ViewChild('assidnedOn') assidnedOn: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isCouponAssignmentRoute: boolean;
  entityName: any;
  permissions = {
    HasCouponAssignmentList: "Denied",
    HasSaveCouponAssignment: "Denied",
    HasUpadeCouponAssignmentStatus: "Denied"
  };
  recordId :string;

  CouponAssignmentFilterKeys = {
    ACTIVE: 'COUPON_STATUS_FLAG_ACTIVE',
    INACTIVE: 'COUPON_STATUS_FLAG_INACTIVE'
  }

  FilterValue = [];

  constructor(
    private couponAssignmentService: CouponAssignmentService, 
    private _appService: AppSettingsService,
    public _router: Router,
    private cdRef: ChangeDetectorRef,
    public _dynamicTemplateService: DynamicTemplateService,
    public _permissionService: PermissionService,
    private translateService: TranslateService,
    private _notifierService: NotifierService,
    public route: ActivatedRoute,
    public pageInfo: PageInfoService,
    private _commonService: CommonService,
    private c3RouterService:C3RouterService
  ) {  super(_permissionService, _dynamicTemplateService, _router, _appService)
      this.FilterValue = [this.CouponAssignmentFilterKeys.ACTIVE]
  }
 
  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.handleTableConfig();
    this.hasPermissionAccessAssignment();
    this.entityName =this._commonService.entityName;
    this.recordId = this._commonService.recordId;

    if(this._commonService.entityName === 'Partner' ) {
      this.pageInfo.updateTitle(this.translateService.instant("COUPONS_ASSIGNMENT_TAB_HEADING_TEXT_COUPONS_ASSIGNMENT"),true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT','MENU_PARTNER_COUPON']);
    }
    else if(this._commonService.entityName === 'Reseller'){
      this.pageInfo.updateTitle(this.translateService.instant("COUPONS_ASSIGNMENT_TAB_HEADING_TEXT_COUPONS_ASSIGNMENT"),true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','MENU_PARTNER_COUPON']);
    }
  }

  hasPermissionAccessAssignment() {
    this.permissions.HasCouponAssignmentList = this._permissionService.hasPermission(this.cloudHubConstants.GET_COUPON_ASSIGNMENT);
    this.permissions.HasSaveCouponAssignment = this._permissionService.hasPermission(this.cloudHubConstants.BTN_SAVE_COUPON_ASSIGNMENT);
    this.permissions.HasUpadeCouponAssignmentStatus = this._permissionService.hasPermission(this.cloudHubConstants.CHANGE_COUPON_ASSIGNMENT_STATUS);
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize,CustomerName,CouponName,CouponCode } =
          mapParamsWithApi(dataTablesParameters);
          const RecordId: string = '';
          const EndInd: string = '';
          const FilterValue = Array.isArray(this.FilterValue) ? this.FilterValue.join(',').replace('COUPON_STATUS_FLAG_ACTIVE', 'Active').replace('COUPON_STATUS_FLAG_INACTIVE', 'InActive') : undefined;
          const subscription =   this.couponAssignmentService
            .getList({ StartInd, SortColumn, SortOrder, CouponCode, CouponName, FilterValue, CustomerName, EndInd, PageSize,EntityName:this.entityName,RecordId:this.recordId })
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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
            className:'col-md-2 text-bold',
            title: this.translateService.instant('TRANSLATE.COUPON_ASSIGNMENTS_TABLE_HEADER_TEXT_CUSTOMER_NAME'),
            data: 'CustomerName',
            searchable : true,
            defaultContent: '',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
          },

          {
            className:'col-md-2 body-alignment-normal',
            title: this.translateService.instant('TRANSLATE.COUPON_ASSIGNMENTS_TABLE_HEADER_TEXT_COUPON_NAME'),
            data: 'CouponName',
            searchable : true,
            defaultContent: '',
          },

          {
            className:'col-md-2',
            title: this.translateService.instant('TRANSLATE.COUPON_ASSIGNMENTS_TABLE_HEADER_TEXT_COUPON_DESCRIPTION'),
            data: 'CouponDescription',
            orderable:false,
            defaultContent: '',
          },

          {
            className:'col-md-2 body-alignment-normal',
            title: this.translateService.instant('TRANSLATE.COUPON_ASSIGNMENTS_TABLE_HEADER_TEXT_COUPON_CODE'),
            data: 'CouponCode',
            searchable : true,
            defaultContent: '',
          },

          {
            className:'col-md-1 body-alignment-normal',
            title: this.translateService.instant('TRANSLATE.COUPON_ASSIGNMENTS_TABLE_HEADER_TEXT_COUPON_ASSIGNMENT_STATUS'),
            defaultContent: '',
            orderable:false,
            ngTemplateRef: {
              ref: this.status,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },

          {
            className:'col-md-1 body-alignment-normal',
            title: this.translateService.instant('TRANSLATE.COUPON_ASSIGNMENTS_TABLE_HEADER_TEXT_ASSIGNED_ON'),
            data: 'AssignedOn',
            defaultContent: '',
            orderable:false,
            ngTemplateRef: {
              ref: this.assidnedOn,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },

          {
            className:'col-md-1 body-alignment-normal',
            title: this.translateService.instant('TRANSLATE.COUPON_ASSIGNMENTS_TABLE_HEADER_TEXT_COUPON_APPLICABILITY'),
            data: 'CouponApplicability',
            orderable:false,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.couponApplicability,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },

          {
            className:'col-md-1 text-end',
            title: this.translateService.instant('TRANSLATE.COUPON_ASSIGNMENTS_TABLE_HEADER_TEXT_ACTIONS'),
            defaultContent: '',
            orderable : false,
            visible: this.permissions.HasUpadeCouponAssignmentStatus === 'Allowed',
            ngTemplateRef: this.permissions.HasUpadeCouponAssignmentStatus === 'Allowed' ? {
              ref: this.actions
                } : null
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  onCaptureEvent(event: Event) { }

  enableEditField(data: any) {

  }

  getCouponStatuses() {
    return Object.entries(this.CouponAssignmentFilterKeys);
  }

  checkedSelectedCouponList(status){
    return this.FilterValue.includes(status);
  }
 
  UpdateSelectedStatus(filterName: any, event: any) {

    const index = this.FilterValue.indexOf(filterName);
    if (index === -1) {
      this.FilterValue.push(filterName);
    } else {
      if (this.FilterValue.length > 1) {
        this.FilterValue.splice(index, 1);
      }
      else {
        event.preventDefault();
        this.cdRef.detectChanges();
        return;
      }
    }
    this.reloadEvent.emit(true);
  }

  ChangeCouponAssignmentStatus(couponAssignment: any) {
    let confirmationText = '';
    if (couponAssignment.IsActive) {
      confirmationText = this.translateService.instant(
        'TRANSLATE.CHANGE_COUPON_STATUS_TO_DISABLE_CONFIRM'
      );

     
    } else {
      confirmationText = this.translateService.instant(
        'TRANSLATE.CHANGE_COUPON_STATUS_TO_ENABLE_CONFIRM'
      );

    }

    this._notifierService.confirm({title:confirmationText}).then((result: { isConfirmed: any; isDenied: any }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        const subscription =  this.couponAssignmentService
          .ChangeCouponAssignmentStatus(couponAssignment, couponAssignment.CouponId, couponAssignment.CustomerId, couponAssignment.CouponAssignmentId)
          .pipe(takeUntil(this.destroy$)).subscribe((response) => {
            let success = this.translateService.instant(
              'TRANSLATE.STATUS_UPDATED_SUCCESSFULLY_MESSAGE'
            );
            
            this._notifierService.success({title:success});
            this.reloadEvent.emit(true);
            this.c3RouterService.setC3Input();
          });
          this._subscriptionArray.push(subscription);
      }
    });
    
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
