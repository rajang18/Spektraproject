import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { mapParamsWithApi } from '../../../../standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import {
  NgbModal,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { CouponDetailsService } from 'src/app/modules/partner/coupons/services/coupon-details.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { Router } from '@angular/router';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CommonService } from 'src/app/services/common.service';
import { MODAL_DIALOG_CLASS, ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { ReportPopupComponent } from 'src/app/modules/standalones/report-popup/report-popup.component';
import { FileService } from 'src/app/services/file.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-coupon-details',
  templateUrl: './coupon-details.component.html',
  styleUrl: './coupon-details.component.scss',
})
export class CouponDetailsComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  customerImpersonateConfig: ADTSettings;
  isEditing: boolean[] = [];
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('name') name: TemplateRef<any>;
  @ViewChild('planName') planName: TemplateRef<any>;
  @ViewChild('code') code: TemplateRef<any>;
  @ViewChild('discount') discount: TemplateRef<any>;
  @ViewChild('noOfRecurrences') noOfRecurrences: TemplateRef<any>;
  @ViewChild('createOn') createOn: TemplateRef<any>;
  @ViewChild('ExpiresOn') ExpiresOn: TemplateRef<any>;
  @ViewChild('ValidTill') ValidTill: TemplateRef<any>;
  successMessage = 'Customer Name update success';

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };

  ShouldShowInActive: boolean | null = false;
  ShouldShowExpired: boolean | null = false;
  SelectedCouponList: string[] = [];
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  allSelected = false;
  status = [];
  owners = [];
  allOwnerSelected = true;
  selectStatus = [];
  selectQuote = [];
  selectStatuslist: any[];
  selectQuoteOwnerlist: any[];

  couponStatusConstants = {
    INACTIVE: 'COUPON_STATUS_FLAG_INACTIVE',
    ACTIVE: 'COUPON_STATUS_FLAG_ACTIVE',
    EXPIRED: 'COUPON_STATUS_FLAG_EXPIRED',
  };
  entityName: string;
  permissions = {
    HasSaveCoupon: "Denied",
    HasCouponList: "Denied",
    HasChangeCouponStatus: "Denied",
    HasCouponesGridDownloableReports: "Denied"
  };
  Name:string
  StartInd:number;
  SortColumn:any;
  SortOrder:any;
  PlanName:any;
  Code:any;

  getCouponStatuses() {
    return Object.entries(this.couponStatusConstants);
  }
  constructor(
    private _CouponDetailsService: CouponDetailsService,
    private _toastService: ToastService,
    private _modalService: NgbModal,
    private _cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _commonService: CommonService,
    private _appService: AppSettingsService,
    private _fileService: FileService,
    public pageInfo: PageInfoService,
    private c3RouterService:C3RouterService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.SelectedCouponList.push(this.couponStatusConstants.ACTIVE);
    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
  }

  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.handleTableConfig();
    this.hasPermissionAccess();

    this.entityName = this._commonService.entityName;

    if (this._commonService.entityName === 'Partner') {
      this.pageInfo.updateTitle(this._translateService.instant("MENU_PARTNER_COUPON"),true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'MENU_PARTNER_COUPON']);
    }
    else if (this._commonService.entityName === 'Reseller') {
      this.pageInfo.updateTitle(this._translateService.instant("MENU_PARTNER_COUPON"),true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'MENU_PARTNER_COUPON']);
    }
  }

  hasPermissionAccess() {
    this.permissions.HasCouponList = this._permissionService.hasPermission(this.cloudHubConstants.GET_COUPONS);
    this.permissions.HasSaveCoupon = this._permissionService.hasPermission(this.cloudHubConstants.BTN_SAVE_COUPON);
    this.permissions.HasChangeCouponStatus = this._permissionService.hasPermission(this.cloudHubConstants.CHANGE_COUPON_STATUS);
    this.permissions.HasCouponesGridDownloableReports = this._permissionService.hasPermission(this.cloudHubConstants.BTN_COUPONS_GRID_DOWNLOADABLE_REPORTS);
  }

  setDefaultInputVal(){
    setTimeout(()=>{
      if(this.PlanName) this.c3RouterService.setC3Input(this.PlanName,1)
      if(this.Code) this.c3RouterService.setC3Input(this.Code,2)
    },0)
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, length, PlanName, Code } =
            mapParamsWithApi(dataTablesParameters);
            let C3Input = this.c3RouterService.getC3Input();
            if(!C3Input && this.keyForData && this.Name){
              this.c3RouterService.setC3Input(this.Name,0)
            }else{
              this.Name = C3Input || ''
            }
            if(!C3Input && this.keyForData && this.PlanName){
              this.c3RouterService.setC3Input(this.PlanName,1)
            }if(!C3Input && this.keyForData && this.Code){
              this.c3RouterService.setC3Input(this.Code,2)
            }
          this.Name = this.keyForData && (Name === null || Name === undefined || Name === '')? this.Name : Name;
          this.PlanName = this.keyForData && (PlanName === null || PlanName === undefined || PlanName === '')? this.PlanName : PlanName;
          this.Code = this.keyForData && (Code === null || Code === undefined || Code === '')? this.Code : Code;
          this.StartInd = this.keyForData && StartInd == 1? this.StartInd : StartInd;
          this.SortColumn = this.keyForData? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData? this.SortOrder : SortOrder;
          let setDefaultInput:boolean = false;
          if((this.PlanName || this.Code) && this.keyForData){
            setDefaultInput = true;
          };
          this.keyForData = null;
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._CouponDetailsService
            .getList({
              StartInd:this.StartInd,
              Name:this.Name,
              SortColumn:this.SortColumn,
              SortOrder:this.SortOrder,
              PageSize: length,
              PlanName:this.PlanName?this.PlanName:PlanName,
              Code:this.Code? this.Code:Code,
              ShouldShowExpired: this.ShouldShowExpired,
              ShouldShowInActive: this.ShouldShowInActive,
            })
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              this._CouponDetailsService.couponslist = Data;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
              }
              if(setDefaultInput){
                self.setDefaultInputVal();
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
            searchable:true,
            orderable:true,
            className: 'col-md-2 body-alignment-normal text-bold',
            title: this._translateService.instant('TRANSLATE.COUPON_TABLE_HEADER_TEXT_NAME'),
            data: 'Name',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.name,
            },
          },
          {
            searchable:true,
            orderable:true,
            className: 'col-md-2 body-alignment-normal',
            title: this._translateService.instant('TRANSLATE.COUPON_TABLE_HEADER_TEXT_PLANNAME'),
            data: 'PlanName',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.planName,
            },
          },
          {
            searchable:true,
            orderable:true,
            className: 'col-md-2 body-alignment-normal',
            title: this._translateService.instant('TRANSLATE.COUPON_TABLE_HEADER_TEXT_CODE'),
            data: 'Code',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.code,
            },
          },
          {
            className: 'col-md-1 body-price-alignment pe-3',
            title: this._translateService.instant('TRANSLATE.COUPON_TABLE_HEADER_TEXT_DISCOUNT'),
            data: 'Discount',
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.discount,
            },
          },
          {
            className: 'col-md-1 body-price-alignment pe-3',
            title: this._translateService.instant('TRANSLATE.COUPON_TABLE_HEADER_TEXT_NOOFRECURRENCES'),
            data: 'Recurrences',
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.noOfRecurrences,
            },
          },
          {
            className: 'col-md-1 body-alignment-normal',
            title: this._translateService.instant('TRANSLATE.COUPON_TABLE_HEADER_TEXT_CREATED_ON'),
            data: 'Created on',
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.createOn,
            },
          },
          {
            className: 'col-md-1 body-alignment-normal',
            title: this._translateService.instant('TRANSLATE.COUPON_TABLE_HEADER_TEXT_EXPIRESON'),
            data: 'Expires on',
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.ExpiresOn,
            },
          },
          {
            className: 'col-md-1 body-alignment-normal',
            title: this._translateService.instant('TRANSLATE.COUPON_TABLE_HEADER_TEXT_VALIDTILL'),
            data: 'Valid till',
            orderable: false,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.ValidTill,
            },
          },

          {
            className: 'col-md-1 text-end',
            title: this._translateService.instant('TRANSLATE.COUPON_ASSIGNMENTS_TABLE_HEADER_TEXT_ACTIONS'),
            defaultContent: '',
            orderable: false,
            visible: this.permissions.HasChangeCouponStatus === 'Allowed',
            ngTemplateRef: this.permissions.HasChangeCouponStatus === 'Allowed' ? {
              ref: this.actions
                } : null
          },
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  editcoupon(offer: any, Coupontype: string,) {
    const CouponId = offer.ID;

    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/coupon/addcoupon`];
    c3Router.extras = {state:{CouponId: CouponId, Coupontype: Coupontype}};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);

    // this._router.navigate([`partner/coupon/addcoupon`]
    //   , { state: { CouponId: CouponId, Coupontype: Coupontype } });
  }

  setData(){
    return{
      Name: this.Name,
      StartInd: this.StartInd,
      SortColumn: this.SortColumn,
      SortOrder: this.SortOrder,
      PlanName: this.PlanName,
      Code: this.Code,
    }
  }

  ChangeCouponStatus(coupon: any) {
    let confirmationText = '';
    if (coupon.IsActive) {
      confirmationText = this._translateService.instant(
        'TRANSLATE.CHANGE_COUPON_STATUS_TO_DISABLE_CONFIRM'
      );
    } else {
      confirmationText = this._translateService.instant(
        'TRANSLATE.CHANGE_COUPON_STATUS_TO_ENABLE_CONFIRM'
      );
    }
    this._notifierService.confirm({ title: confirmationText, icon: 'warning', confirmButtonColor: '#F64E60' })
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          const subscription = this._CouponDetailsService
            .ChangeCouponStatus(coupon)
            .pipe(takeUntil(this.destroy$)).subscribe((response) => {
              let success = this._translateService.instant(
                'TRANSLATE.STATUS_UPDATED_SUCCESSFULLY_MESSAGE'
              );
              this._notifierService.alert({ title: success, icon: 'success', confirmButtonColor: '#50C878' })
              this.reloadEvent.emit(true);
              this.c3RouterService.setC3Input();
            });
            this._subscriptionArray.push(subscription);
        }
      });
  }

  checkedSelectedCouponList(status) {
    return this.SelectedCouponList.indexOf(status) != -1
  }

  UpdateSelectedStatus(status: any, event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    // if present then remove
    if (this.SelectedCouponList.indexOf(status) != -1) {
      if(this.SelectedCouponList.length > 1){
        this.SelectedCouponList.splice(
          this.SelectedCouponList.indexOf(status),
          1
        );
      }
      else{
        event.preventDefault();
        this._cdRef.detectChanges();
        return
      }
    }
    // if not exists then add
    else {
      this.SelectedCouponList.push(status);
    }

    // if none exists then keep one status inside either active/inactive/expired
    if (this.SelectedCouponList.length === 0) {
      this.SelectedCouponList.push(status);
    }

    // variables needed to call api
    this.ShouldShowInActive = null;
    let isActiveExists = this.SelectedCouponList.indexOf(this.couponStatusConstants.ACTIVE) != -1;
    let isInActiveExists = this.SelectedCouponList.indexOf(this.couponStatusConstants.INACTIVE) != -1;
    this.ShouldShowExpired = this.SelectedCouponList.indexOf(this.couponStatusConstants.EXPIRED) != -1;

    if (isActiveExists && !isInActiveExists) this.ShouldShowInActive = false;
    else if (!isActiveExists && isInActiveExists)
      this.ShouldShowInActive = true;

    // change detection and reload
    this._cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }

  onCaptureEvent(event: Event) { }

  downloadGridReport() {
    const moduleName = 'partner.coupon';
    const subscription =  this._commonService
      .getDownloadableReportColumnsForPlans({ moduleName: moduleName })
      .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        /* Creating config model */
        let reportConfig = new ReportPopupConfig();
        reportConfig.Columns = response.Data;
        reportConfig.title = 'DOWNLOAD_GRID_POPUP_COUPON_DOWNLOAD_HEADER';
        reportConfig.isSubmitButton = false;
        reportConfig.IsColumnsAvailable = true;
        reportConfig.IsSubHeaderAvailable = false;
        reportConfig.EmailInstructionText = '';
        reportConfig.actionTooltipText = '';
        /* selecting Size of popup based on condition */
        const config: NgbModalOptions = {
          modalDialogClass: reportConfig.IsSubHeaderAvailable
            ? MODAL_DIALOG_CLASS
            : '',
        };
        const modalRef = this._modalService.open(ReportPopupComponent, config);
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
              let reqbody = {
                ColumnNames: columns,
                EntityName: this._commonService.entityName,
                RecordId: this._commonService.recordId,
              };
              if (columns != '' && columns.length > 0) {
                this._fileService.post('Coupons/downloadcoupon', true, reqbody);
              } else {
                this._toastService.error(
                  this._translateService.instant(
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
  
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
