import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { PendingPaymentStatusService } from 'src/app/services/pending-payment-status.service';
import { PermissionService } from 'src/app/services/permission.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import _ from 'lodash';
import { ToastService }  from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil ,forkJoin} from 'rxjs';

@Component({
  selector: 'app-pending-status',
  templateUrl: './pending-status.component.html',
  styleUrl: './pending-status.component.scss'
})
export class PendingStatusComponent extends C3BaseComponent implements OnInit {

  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';

  config:any = null;
  pendingPaymentDetails:any = [];
  getPendingPaymentStatus:any = "Denied";
  IsReloadAllInitiated = false;
  isGridDataLoading:boolean = true;
  hasUpdatedStatus = false;
  
  @ViewChild("paidtemplate") paidtemplate:TemplateRef<any>; 
  @ViewChild("action") action:TemplateRef<any>;
  @ViewChild("C3PaymentStatus") C3PaymentStatus:TemplateRef<any>;

  onCaptureEvent(event: Event) { }

  constructor(private paymentStatusService:PendingPaymentStatusService,
              private commonService:CommonService,
              private translateService: TranslateService,
              public _permissionService:PermissionService,
              private _toastrService:ToastService,
              public _dynamicTemplateService: DynamicTemplateService,
              public _router: Router,
              public pageInfo: PageInfoService, 
              public _cdref:ChangeDetectorRef,
              private _appService: AppSettingsService, 

  ){
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.HasPermissionAccess()
  }

  ngOnInit(): void {
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.PAGE_HEADER_TEXT_PAYMENT_STATUS_INVOICE_DETAIL"), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'BREADCRUMB_TEXT_PAYMENT_STATUS_INVOICE_DETAIL']);   
    this.isGridDataLoading = true;
    this.GetPendingPayments();
  }

   HasPermissionAccess() {
    this.getPendingPaymentStatus = this._permissionService.hasPermission(CloudHubConstants.GET_PENDING_PAYMENT_STATUS);
  }

  GetPendingPayments(){
    const self = this;
    this.isGridDataLoading = true;

    const subscription = this.paymentStatusService.GetPendingPaymentStatus(this.commonService.entityName, this.commonService.recordId).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
      
      this.isGridDataLoading = false;

      this.pendingPaymentDetails = Data;
      this.pendingPaymentDetails = this.pendingPaymentDetails.map(e=>{
        e.IsLoading = false;
        return e;
      });
         
      this.config = {
        serverSide:false,
        order:[5,'asc'],
        pageLength: (this._appService.$rootScope.DefaultPageCount ||  10),
        data:this.pendingPaymentDetails, 
        columns:[
          {
            title:this.translateService.instant("TRANSLATE.PENDING_PAYMENT_VIEW_TABLE_COLUMN_HEADER_ENTITY_NAME"),
            searchable: true,
            sortable:false,
            defaultContent: '',
            className: 'col-2 fw-bold',
            data:"EntityName"
          },
          {
            title: this.translateService.instant("TRANSLATE.PENDING_PAYMENT_VIEW_TABLE_COLUMN_HEADER_RECORD_NAME"),
            searchable: true,
            sortable:false,
            defaultContent: '',
            className: 'col-2',
            data:"RecordName"
          },
          {
            title:this.translateService.instant("TRANSLATE.PENDING_PAYMENT_VIEW_TABLE_COLUMN_HEADER_INVOICE_NUMBER"),
            searchable: false,
            sortable:false,
            defaultContent: '',
            className: 'col-2',
            data:"InvoiceNumber"
          },
          { 
            title:this.translateService.instant("TRANSLATE.PENDING_PAYMENT_VIEW_TABLE_COLUMN_HEADER_PAID_AMOUNT"),
            searchable: false,
            sortable:false,
            defaultContent: '',
            data:"PaidAmount",
            className: 'col-1 text-end',
            ngTemplateRef: {
              ref: this.paidtemplate,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            }
          },
          {
            title:this.translateService.instant("TRANSLATE.PENDING_PAYMENT_VIEW_TABLE_COLUMN_HEADER_C3_PAYMENT_STATUS"),
            searchable: false,
            sortable:false,
            defaultContent: '',
            data:"C3PaymentStatusDescription",
            className: 'col-2',
            ngTemplateRef: {
              ref: this.C3PaymentStatus,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            }
          },
          {
            title:this.translateService.instant("TRANSLATE.PENDING_PAYMENT_VIEW_TABLE_COLUMN_HEADER_BILLING_PAYMENT_STATUS"),
            searchable: false,
            sortable:true,
            defaultContent: '',
            className: 'col-2',
            data:"BillingPaymentStatus" 
          },
          {
            title: this.translateService.instant("TRANSLATE.PENDING_PAYMENT_VIEW_TABLE_COLUMN_HEADER_ACTION"),
            defaultContent: '',
            searchable: false,
            sortable:false,
            className: 'col-1',
            ngTemplateRef: {
              ref: this.action,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              }
            }
          }       
        ]      
      };
    });
    this._subscriptionArray.push(subscription);
  }

  GetPaymentStatusFromBilling(payment:any) {
    var index = _.indexOf(this.pendingPaymentDetails, payment);
            this.pendingPaymentDetails[index].IsLoading = true;
            this.pendingPaymentDetails[index].BillingPaymentStatus = null;
            this.pendingPaymentDetails[index].FailureReason = null;
            const subscription =  this.paymentStatusService.GetPaymentStatusFromBilling(payment).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
            
              var paymentStatus = Data;
              this.pendingPaymentDetails[index].IsLoading = false;
              this.pendingPaymentDetails[index].BillingPaymentStatus = paymentStatus.PaymentStatus;
              
              this.hasUpdatedStatus = this.pendingPaymentDetails.some(item =>
              !['inprogress'].includes((item['BillingPaymentStatus'] || '').toLowerCase())
              );

              this.isGridDataLoading = true;
              this._cdref.detectChanges();
              this.isGridDataLoading = false;

              this.pendingPaymentDetails[index].FailureReason = paymentStatus.FailureReason;
              this.pendingPaymentDetails[index].TransactionId = paymentStatus.TransactionId;

              this._cdref.detectChanges();
            },error=>{
              this.pendingPaymentDetails[index].IsLoading = false;
            })
            this._subscriptionArray.push(subscription);
  } 

  UpdatePaymentStatus(payment:any) {
    this.pendingPaymentDetails.forEach((item) =>{
      item.IsLoading = true;
    });

    this.IsReloadAllInitiated = true;
    var reqBody = {
        PaymentSubscriptionId: payment.PaymentSubscriptionId,
        TransactionId: payment.TransactionId,
        PaymentStatus: payment.BillingPaymentStatus,
        FailureReason: payment.FailureReason
    };

    const subscription = this.paymentStatusService.UpdatePaymentStatus(reqBody).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
      this.IsReloadAllInitiated = false;
        this._toastrService.success(this.translateService.instant("TRANSLATE.PENDING_PAYMENT_VIEW_NOTIFICATION_TEXT_SUCCESSFULLY_UPDATED_PAYMENT_STATUS", { recordName: payment.RecordName }));
        this.GetPendingPayments();
        this.hasUpdatedStatus = false;
    });
    this._subscriptionArray.push(subscription);
  }

UpdateAllPayments() {
  const paymentsToUpdate = this.pendingPaymentDetails.filter(item =>
    !['inprogress'].includes((item['BillingPaymentStatus'] || '').toLowerCase())
  );

  this.IsReloadAllInitiated = true;

  paymentsToUpdate.forEach(payment => payment.IsLoading = true);

  const updateCalls = paymentsToUpdate.map(payment => {
    const reqBody = {
      PaymentSubscriptionId: payment.PaymentSubscriptionId,
      TransactionId: payment.TransactionId,
      PaymentStatus: payment.BillingPaymentStatus,
      FailureReason: payment.FailureReason
    };

    return this.paymentStatusService.UpdatePaymentStatus(reqBody).pipe(
      takeUntil(this.destroy$)
    );
  });

  forkJoin(updateCalls).subscribe({
    next: () => {
      this.IsReloadAllInitiated = false;
      this._toastrService.success(
        this.translateService.instant("TRANSLATE.PENDING_PAYMENT_VIEW_NOTIFICATION_TEXT_SUCCESSFULLY_UPDATED_PAYMENT_STATUS_FOR_ALL")
      );
      this.GetPendingPayments(); 
       this.hasUpdatedStatus = false;
    },
  });
}

  GetAllPaymentStatusFromBilling() {
    this.IsReloadAllInitiated = true;
    this.pendingPaymentDetails.forEach((item)=> {
        item.IsLoading = true;
        item.BillingPaymentStatus = null;
        item.FailureReason = null;
    });
   
    // if empty 
    // fix infinite button loading issue
    setTimeout(()=>{
      if(this.pendingPaymentDetails?.length  == 0){
        this.IsReloadAllInitiated = false;
      }
    }, 3000)
   
    


    this.pendingPaymentDetails.forEach( (payment) => {
      const subscription =  this.paymentStatusService.GetPaymentStatusFromBilling(payment).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
        this.IsReloadAllInitiated = false;
        var paymentStatus = Data;
        var index = _.indexOf(this.pendingPaymentDetails, payment);
        this.pendingPaymentDetails[index].IsLoading = false;
        this.pendingPaymentDetails[index].BillingPaymentStatus = paymentStatus.PaymentStatus;

        this.hasUpdatedStatus = this.pendingPaymentDetails.some(item =>
           !['inprogress'].includes((item['BillingPaymentStatus'] || '').toLowerCase())
        );
        this.isGridDataLoading = true;
        this._cdref.detectChanges();
        this.isGridDataLoading = false;
        this._cdref.detectChanges();

        this.pendingPaymentDetails[index].FailureReason = paymentStatus.FailureReason;
        this.pendingPaymentDetails[index].TransactionId = paymentStatus.TransactionId;
      });
      this._subscriptionArray.push(subscription);
    });

  }

  ngOnDestroy(): void {
   super.ngOnDestroy();
  }


}
