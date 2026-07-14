import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import {couponAssignmentAdd } from '../../../models/coupon.model';
import { CouponAssignmentService } from '../../../services/coupon-assignment.service';
import { takeUntil} from 'rxjs';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3tableService, CheckboxType } from 'src/app/modules/standalones/c3-table/c3table.service';

@Component({
  selector: 'app-add-coupon-assignment',
  templateUrl: './add-coupon-assignment.component.html',
  styleUrl: './add-coupon-assignment.component.scss'
})
export class AddCouponAssignmentComponent extends C3BaseComponent implements OnInit,OnDestroy {
  datatableConfig: ADTSettings;
  @ViewChild('checkboxTemplate') checkboxTemplate: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  IsLoadingTable: boolean = true;
  couponAssignmentForm: FormGroup;
  couponDataSource: any[] = [];
  customerData: any[] = [];
  isGridDataLoading:boolean;
  isPlanRelated = false;
  allCheckBoxChecked = { checked: false };
  selectedCustomerList: any[] = [];
  couponAssignmentAdd :couponAssignmentAdd = {
    ID: 0,
    CouponDetailId:null,
    CustomerId:null,
  };
  customerIds: string | null = null;

  CouponAssignmentFilterKeys = {
    ALL: 'all',
    ACTIVE: 'active',
    INACTIVE: 'inactive'
  }
  filterValue = this.CouponAssignmentFilterKeys.ACTIVE; 
  entityName: any;
 
  
  constructor(
    private toastService: ToastService,
    public _router: Router,
    private cdRef: ChangeDetectorRef,
    public _dynamicTemplateService: DynamicTemplateService,
    public _permissionService: PermissionService,
    private _formBuilder: FormBuilder,
    private translateService: TranslateService,
    private _notifierService: NotifierService,
    private couponAssignmentService: CouponAssignmentService,
    private _unsavedChangesService: UnsavedChangesService,
    public pageInfo: PageInfoService,
    private _commonService: CommonService,
    private _appService: AppSettingsService,
    private c3tableService:C3tableService

  ) {  super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.couponAssignmentForm = this._formBuilder.group({
      couponAssignmentAdd_CouponDetailId: [null,Validators.required]
    });
  }

  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
     this.c3tableService.checboxType =CheckboxType.clientSideOnly;
    this.getCouponList();
    this.entityName =this._commonService.entityName;

    if(this._commonService.entityName === 'Partner' ) {
      this.pageInfo.updateTitle(this.translateService.instant("COUPONS_ASSIGNMENT_TAB_HEADING_TEXT_ADD_COUPON_ASSIGNMENT"),true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT','MENU_PARTNER_COUPON']);
    }
    else if(this._commonService.entityName === 'Reseller'){
      this.pageInfo.updateTitle(this.translateService.instant("COUPONS_ASSIGNMENT_TAB_HEADING_TEXT_ADD_COUPON_ASSIGNMENT"),true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','MENU_PARTNER_COUPON']);
    }
  }

  getCouponList() {
    const params = {
      StartInd: 1,
      Name: '',
      SortColumn: 'CustomerName',
      SortOrder: 'asc',
      PageSize: 100000,
      CouponCode: '',
      CouponName: '',
      CustomerName: '' ,
      RecordId: '',
      EndInd: '',
      filterValue: this.filterValue
    };

    const subscription = this.couponAssignmentService
      .getCoupons(params)
      .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => { 
        this.couponDataSource = Data.filter((item: any) => item.IsActive);
      });

    this._subscriptionArray.push(subscription);
  }

  handleTableConfig(oldData = null) {
    this.datatableConfig = null;
    const self = this;
    setTimeout(() => {
      // this.customerData = Data;
      this.datatableConfig = {
        serverSide: false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        data: this.customerData,
        paging: true,         
        columns: [

          {
            title: this.translateService.instant('TRANSLATE.INVOICE_IMPORT_VIEW_TABLE_COLUMN_HEADER_QUALIFIED_NAME'),
            data: 'Name',
            searchable : true,
          },
        ],
      };
     // this.cdRef.detectChanges();
      if(oldData){
        this.c3tableService.setPreviousSelectedData(oldData);
        this.selectedCustomerList = oldData;
      }
    });
  }

  getCouponAssignmentDetails(couponID: any){
    const subscription = this.couponAssignmentService.getCustomers(couponID)
    .pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ Data }: any) => {
        this.customerData = Data;
        let oldSelectedCustomer= this.customerData.filter(v=>v.IsAssigned == true);
        this.c3tableService.totalRecord = this.customerData.length;
        this.handleTableConfig(oldSelectedCustomer);
        
      },
      error:(error: any) => {
        this.toastService.error(this.translateService.instant('TRANSLATE.INVALID_COUPON'));
        this.customerData = [];
        this.handleTableConfig();
      }
 
    });
    this._subscriptionArray.push(subscription);
  }

  selectAllHandler(event){
    if(event){
       this.c3tableService.setPreviousSelectedData(this.customerData);
        this.selectedCustomerList = this.customerData
    }else{
      this.selectedCustomerList = []
      this.c3tableService.setPreviousSelectedData([])
    } 
  }

  onCouponChange(couponId: any): void {
    if (couponId) {
      const Id = typeof couponId === 'object' ? couponId?.ID : couponId;
      this.couponAssignmentAdd.CouponDetailId = Id;
      this.getCouponAssignmentDetails(Id);
    } else {
      this.couponAssignmentAdd.CouponDetailId = null;
      this.selectedCustomerList = [];
      this.customerData = [];
      this.c3tableService.setPreviousSelectedData([]);
      this.handleTableConfig();
    }
  }

  onCaptureEvent(event: Event) { }

  removeFromList(item: any) {
    // Remove from selectedCustomerList
    const index = this.selectedCustomerList.findIndex(customer => customer.ID === item.ID);
    if (index > -1) {
      this.selectedCustomerList.splice(index, 1);
    }
  }
 

  handleSelection(data){
    this.selectedCustomerList = data;
  }

  saveCouponAssignment(): void {
    this.customerIds = this.selectedCustomerList.map(item => item.ID).join(',');
    this.save();
  }

  save(): void {
    const confirmationMessage = this.translateService.instant('TRANSLATE.COUPON_ASSIGNMENT_SAVE_COUPON_ASSIGNMENT_SUCCESS');
    const couponAssignmentsInputs = {
      CouponId: this.couponAssignmentAdd.CouponDetailId,
      CustomerIds: this.customerIds,
      AssignAll: this.selectedCustomerList.length === this.customerData.length
    };
    if (this.couponAssignmentForm.valid) {
      if (!couponAssignmentsInputs.CustomerIds) {
        this.toastService.error(
          this.translateService.instant('TRANSLATE.COUPON_ASSIGNMENT_SELECT_ATLEAST_ONE_CUSTOMER_ERROR'));
      } else {
       const subscription = this.couponAssignmentService.save(couponAssignmentsInputs).pipe(takeUntil(this.destroy$)).subscribe(response => {
          this.couponAssignmentForm.reset();
          this._notifierService.success({ title: confirmationMessage })
          .then(() => {
            this._router.navigate(['/partner/coupon/couponassignment']);
            this.reloadEvent.emit(true);
            this.couponAssignmentForm.markAsPristine();
          });
        });
        this._subscriptionArray.push(subscription);
      }
    }
    else {
      this.couponAssignmentForm.markAllAsTouched();
    }
  }
  
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  back(){
    let callback = ()=>{
      this._router.navigate(['partner/coupon/couponassignment']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.couponAssignmentForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
}


