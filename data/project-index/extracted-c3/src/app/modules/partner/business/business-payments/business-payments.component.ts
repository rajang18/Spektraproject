import { ChangeDetectorRef, Component, ComponentFactoryResolver, ElementRef, EventEmitter, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { BuisnessService } from 'src/app/services/buisness.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { RecordAdvancePaymentComponent } from './record-advance-payment/record-advance-payment.component';
import { PaymentTransactionDetailsComponent } from './payment-transaction-details/payment-transaction-details.component';
import { NotifierService } from 'src/app/services/notifier.service';
import _ from 'lodash'
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-business-payments',
  templateUrl: './business-payments.component.html',
  styleUrl: './business-payments.component.scss'
})
export class BusinessPaymentsComponent extends C3BaseComponent implements OnInit, OnDestroy {

  @ViewChild('iconTemplate') iconTemplate: TemplateRef<any>;
  @ViewChild('actionCol') actionCol: TemplateRef<any>;
  @ViewChild('remainingAmount') remainingAmount: TemplateRef<any>;
  @ViewChild('paidAmount') paidAmount: TemplateRef<any>;
  @ViewChild('usedAmount') usedAmount: TemplateRef<any>;

  datatableConfig: ADTSettings;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  tablePurchasedProductForReport: any;
  PaymentStatusesSelected: any = [];
  PaymentStatus: any[] =[
    {
      Id: 1,
      Name: 'Success',
      Description: 'PAYMENT_STATUS_DESC_SUCCESS',
      value : 'Charged,Accepted'
    },
    {
      Id: 2,
      Name: 'InProgress',
      Description: 'PAYMENT_STATUS_DESC_INPROGRESS',
      value:'InProgress'
    },
    {
      Id: 3,
      Name: 'Failed',
      Description: 'PAYMENT_STATUS_DESC_FAILED',
      value:'Declined,TechnicalError'
    },
  ];
  modalRef: any;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-500px',
  };
  filteredPayments: any[];
  paymentDetails: any;
  SearchCriteriaForPayments  : any = {};
  Statuses: any =[];
  childTable: ElementRef;
  businessListExpanded: boolean = false;
  dropdownVisible = false;
  globalDateFormat: string;
  allSelected = false;
  
  constructor(
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    private translateService: TranslateService,
    private _commonService: CommonService,
    private _buisnessService: BuisnessService,
    private _cdRef: ChangeDetectorRef,
    private renderer: Renderer2,
    private resolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
    private _notifierService : NotifierService,
    private _toastService : ToastService,
    private pageInfo: PageInfoService,
    private appSettingService:AppSettingsService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, appSettingService);
  }

  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.handleTableConfig();
    this.getPaymentStatus();
    this.pageInfo.updateTitle(this.translateService.instant("CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"),true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS']);
    this.updateSelectedStatus(this.PaymentStatus[0].Value)
}

handleTableConfig() {
  setTimeout(() => {
    const self = this;
    this.datatableConfig = {
      serverSide: true,
      ordering: true,
      pageLength: (this.appSettingService.$rootScope.DefaultPageCount || 10),
      scrollCollapse: true,
      scrollY: '270px',
      ajax: (dataTablesParameters: any, callback: any) => {
        const { StartInd, SortColumn, SortOrder, PageSize, length,QualifiedName } =
          mapParamsWithApi(dataTablesParameters);
          this.paymentDetails = [];
          if (this.PaymentStatusesSelected !== null && this.PaymentStatusesSelected.length > 0) {
            this.SearchCriteriaForPayments.Statuses = null;
            this.PaymentStatusesSelected.forEach((paymentStatus: any)=>{
              if (this.SearchCriteriaForPayments.Statuses !== null && this.SearchCriteriaForPayments.Statuses.length > 0) {
                this.SearchCriteriaForPayments.Statuses = this.SearchCriteriaForPayments.Statuses + "," + paymentStatus;
            }
            else {
              this.SearchCriteriaForPayments.Statuses = paymentStatus;
            }
            });
        }
        const subscription = this._buisnessService.getTransactions({
          EntityName: this._commonService.entityName,
          RecordId: this._commonService.recordId,
          PageSize: length,
          QualifiedName: QualifiedName,
          SortColumn: SortColumn,
          SortOrder: SortOrder,
          StartInd: StartInd,
          Statuses: this.PaymentStatusesSelected.length > 0 ? this.PaymentStatusesSelected.join(',') : '',
        }).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
          this.businessListExpanded = false;
          this.paymentDetails = Data;
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
      order: [2,'desc'],
      columns: [
        {
          // searchable: true,
          className: 'dt-icon-control',
          orderable: false,
          defaultContent: '',
          ngTemplateRef: {
            ref: this.iconTemplate,
            context: {
              // needed for capturing events inside <ng-template>
              captureEvents: self.onCaptureEvent.bind(self),
            },
          },
        },
        {
          className:'col-md-2',
          title: this.translateService.instant(
            'TRANSLATE.PAYMENTS_LIST_TABLE_HEADER_CUSTOMER_RESELLER'
          ),
          data: 'QualifiedName',
          render:function (data : any, type: any, row: any){
            return `<span class="fw-semibold">${data}</span>`
          }
        },
        {
          title: this.translateService.instant(
            'TRANSLATE.INVOICE_LIST_TABLE_HEADER_TRANSACTION_DATE'
          ),
          data:'TransactionDate',
          className: 'col-md-2 pe-2',
          defaultContent: '',
          render: (data: string) => {
            var datePipe = new C3DatePipe(this.appSettingService);
            return datePipe.transform(data);
          }
        },
        {
          title: this.translateService.instant(
            'TRANSLATE.INVOICE_LIST_TABLE_HEADER_TRANSACTION_AMOUNT'
          ),
          data: 'PaidAmount',
          className: 'col-md-1 text-end pe-2',
          render: function(data: any, type: any,row: any){
            return `<span class="pe-7">${data}</span>`
          },
          ngTemplateRef: {
            ref: this.paidAmount,
          }
        },
        {
          title: this.translateService.instant(
            'TRANSLATE.INVOICE_LIST_TABLE_HEADER_USED_AMOUNT'
          ),
          data: 'UsedAmount',
          className: 'col-md-1 text-end pe-2',
          // render: function(data: any, type: any,row: any){
          //   return `<span class="pe-7">${data}</span>`
          // },
          ngTemplateRef: {
            ref: this.usedAmount,
          }
        },
        {
          title: this.translateService.instant(
            'TRANSLATE.INVOICE_LIST_TABLE_HEADER_REMAINING_AMOUNT'
          ),
          data: 'RemainingAmount',
          className: 'col-md-1 text-end pe-2',
          // render: function(data: any, type: any,row: any){
          //   return `<span class="pe-7">${data}</span>`
          // },
          ngTemplateRef: {
            ref: this.remainingAmount,
          }
        },
        {
          className:'col-md-2 pe-2',
          orderable:false,
          title: this.translateService.instant(
            'TRANSLATE.INVOICE_LIST_TABLE_HEADER_TRANSACTION_REMARKS'
          ),
          render: function (data: any, type: any, row: any) {
            if (!data) {
              return `<span class="word-wrap-custom text-muted"></span>`;
            }

            const str = self.translateService.instant(data);
            return `<span class="word-wrap-custom">${str}</span>`;
          },
          data: 'Remarks',
        },
        {
          className:'col-md-2 text-end pe-2',
          title: this.translateService.instant(
            'TRANSLATE.INVOICE_LIST_TABLE_HEADER_TRANSACTION_STATUS'
          ),
          data: 'StatusDescription',
          render: (data: string) => {
            if(data === 'PAYMENTS_STATUS_DESC_SUCCESS'){
              return `<span class="badge badge-light-success" >${this.translateService.instant('TRANSLATE.' + data)}</span>`
            }
            else if(data === 'PAYMENTS_STATUS_DESC_FAILED'){
              return `<span class="badge badge-light-danger" >${this.translateService.instant('TRANSLATE.' + data)}</span>`
            }
            else{
              return `<span class="badge badge-secondary" >${this.translateService.instant('TRANSLATE.' + data)}</span>`
            }
          },
        },
      ],
    }
    this.cdRef.detectChanges();
  });
}


toggleAllSelection() {
  this.allSelected = !this.allSelected;
  if (this.allSelected) {
    this.PaymentStatus.forEach((status) => {
      if (!this.PaymentStatusesSelected.includes(status.Value)) {
        this.PaymentStatusesSelected.push(status.Value);
      }
    });
  } else {
    this.PaymentStatusesSelected = [];
    this.PaymentStatusesSelected.push(this.PaymentStatus[0].Value)
  }
  this._cdRef.detectChanges();
  this.reloadEvent.emit(true); // Emit reload
}


updateSelectedStatus(status : string) {
  let existingStatus = this.PaymentStatusesSelected.filter((s : any)=> s === status );
  
  if (existingStatus.length > 0) {
      let index = this.PaymentStatusesSelected.indexOf(status);
      this.PaymentStatusesSelected.splice(index, 1);
      if(this.PaymentStatusesSelected.length==0){
        existingStatus = [];
      }
      this.allSelected = false;
  }
  else {
    this.PaymentStatusesSelected.push(status);
    if(this.PaymentStatus.length == this.PaymentStatusesSelected.length){
      this.allSelected = true;
    }
  }
  this.reloadEvent.emit(true);
}

checkedSelectedPaymentStatusList(statusName: string) {
  if (!this.PaymentStatusesSelected) {
    return false;
  }  
  const statusFound = this.PaymentStatusesSelected.includes(statusName);
  return statusFound;
}




 filterPaymentTransactionsByStatus(statusInput : any) {
  this.filteredPayments = [];
  if (statusInput.length > 0) {
    statusInput.forEach((statusdata: any) => {
          let filteredPaymentData = this.paymentDetails.filter((item : any)=> {
              if (item.Status !== null && statusdata?.toUpperCase() === item.Status.toUpperCase()) {
                  return item;
              }
          });
          filteredPaymentData.forEach((data : any) => {
              let filteredPaymentIndex = this.filteredPayments.indexOf(data);
              if (filteredPaymentIndex === -1) {
                  this.filteredPayments = this.filteredPayments.concat(data);
              }

          });
      });
  }
  else
      this.filteredPayments = this.paymentDetails;
}

 recordAdvancePayment() {
  this.proceedToGetAdvancePaymentDetails();
}

proceedToGetAdvancePaymentDetails() {
  this.modalRef = this.modalService.open(RecordAdvancePaymentComponent,this.modalConfig);
  this.modalRef.result.then((response) => {
    if(response){
      if (response.paymentDetail !== null || response.paymentDetail !== '' || response.paymentDetail !== undefined) {
       let message = this.translateService.instant("TRANSLATE.RECORD_ADVANCE_PAYMENT_CONFIRMATION",
          {
            amount: response.paymentDetail.paidAmount,
            currencyCode: response.paymentDetail.currency
          }
        );
        let btnok = this.translateService.instant("TRANSLATE.BUTTON_TEXT_OK");
        this._notifierService.confirm({ title: message,  icon: 'info', confirmButtonColor: '#49BA7C',confirmButtonText: btnok}).
        then((result : {isConfirmed : any , isDismissed : any}) =>{
          if (result.isConfirmed){
            let postData = {
                          InvoiceId: null,
                          PaidAmount: response.paymentDetail.paidAmount,
                          PaymentDate: response.paymentDetail.paymentDate,
                          ReMarks: response.paymentDetail.remarks,
                          EntityName: response.paymentDetail.currentEntity,
                          RecordId: response.paymentDetail.customerC3Id,
                          CurrencyCode: response.paymentDetail.currency
                      };
                      const subscription = this._buisnessService.proceedToGetAdvancePaymentDetails(postData).pipe(takeUntil(this.destroy$)).subscribe((response : any)=>{

                        const message = this.translateService.instant(
                          'TRANSLATE.RECORD_ADVANCE_PAYMENT_SUCCESS_MESSAGE',
                        );
                        this._toastService.success(message);
                        this.reloadEvent.emit(true);
                      }); 
                      this._subscriptionArray.push(subscription);          
          }
        });
    }
    }
  },
    (reason) => {
      /* Closing modal reference if cancelled or clicked outside of the popup*/
      this.modalRef.close();
    });
}

onCaptureEvent(event: Event) {}

 getPaymentStatus() {
  let allStatus = [{
      Id: 1, Name: "Success", Description: "PAYMENT_STATUS_DESC_SUCCESS", Value: "Charged,Accepted"
  }, {
      Id: 2, Name: "InProgress", Description: "PAYMENT_STATUS_DESC_INPROGRESS", Value: "InProgress"
  }, {
      Id: 3, Name: "Failed", Description: "PAYMENT_STATUS_DESC_FAILED", Value: "Declined,TechnicalError"
  }];
  this.PaymentStatus = allStatus;
}

toggleAllRows() {
  let self = this;
  const table = $(this.childTable.nativeElement).DataTable();
  table.rows().every(function (rowIdx, tableLoop, rowLoop) {
    const row = this;
    if (row?.data()) {
      if(!self.businessListExpanded){
        row.child.hide();
        row.data()['Collapse'] = false;
      }
      else {
          row.data()['Collapse'] = true;
          self.loadChildComponent(row);
        }
    }
  });
  this._cdRef.detectChanges();
}

toggleDropdown() {
  this.dropdownVisible = !this.dropdownVisible;
}


onTableReady(table: ElementRef) {
  this.childTable = table;
  //litsen click event
  this.renderer.listen(this.childTable.nativeElement, 'click', (event) => {
    if (
      event.target.closest('td') &&
      event.target.classList.contains('clicked-icon')
    ) {
      // You can now access the table element and perform operations on it
      const tr = event.target.closest('tr');
      const table = $(this.childTable.nativeElement).DataTable();
      const row = table.row(tr);
      if (row?.data()) {
        if (row.child.isShown()) {
          row.child.hide();
          row.data()['Collapse'] = false;
        } else {
          row.data()['Collapse'] = true;
          this.loadChildComponent(row);
        }
        this._cdRef.detectChanges();
      }
    }
  });
}

loadChildComponent(row: any) {
  let data = row?.data()?.InvoiceDetails?.Data || [];
  console.table(data);
  if (data?.length > 0) {
    const componentFactory = this.resolver.resolveComponentFactory(
      PaymentTransactionDetailsComponent
    );
    const componentRef =
      this.viewContainerRef.createComponent(componentFactory);
    // Set the searchParams input of the ChildTableComponent
    componentRef.instance.data = data || [];
    // Trigger change detection to ensure the data is displayed correctly
    componentRef.changeDetectorRef.detectChanges();
    row.child(componentRef.location.nativeElement).show();
  }
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());

  }

 recordMultiplePayments() {
  this._router.navigate([`partner/multiplepayments`]);	 
  // $state.go('partner.recordmultiplepayment');
}
}
