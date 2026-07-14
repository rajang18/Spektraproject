import {
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  EventEmitter,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Select2Value } from 'ng-select2-component';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/modules/home/dashboard-widgets/services/dashboard.service';
import { BuisnessService } from 'src/app/services/buisness.service';
import { BusinessTransactionDetailsComponent } from './business-transaction-details/business-transaction-details.component';
import { NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { BusinessTransactionreportpopupComponent } from 'src/app/modules/standalones/business-transactionreportpopup/business-transactionreportpopup.component';
import { FileService } from 'src/app/services/file.service';
import { ToastService } from 'src/app/services/toast.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';

@Component({
  selector: 'app-business-invoices-dues',
  templateUrl: './business-invoices-dues.component.html',
  styleUrl: './business-invoices-dues.component.scss',
  providers: [C3DatePipe],
})
export class BusinessInvoicesDuesComponent implements OnInit {
  dropdownVisible = false;
  isAllselected: boolean = false;
  selectedFruits: { [key: string]: boolean } = {
    apple: false,
    orange: false,
    banana: false,
    grape: false,
  };
  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  _subscription: Subscription;
  @ViewChild('iconTemplate') iconTemplate: TemplateRef<any>;
  @ViewChild('billedAmount') billedAmount: TemplateRef<any>;
  @ViewChild('paidAmount') paidAmount: TemplateRef<any>;
  @ViewChild('pendingAmount') pendingAmount: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  childTable: ElementRef;
  billingPeriodsData: any;
  billingPeriodId: string;
  selectedBillingPeriodId: any;
  isEditMode: boolean = false;
  aLLPeriods: any;
  filterByOwnedBy: any = '';
  paymentStatusData: any[] = [];
  selectedViewOptions: Select2Value[] = [];
  transactionListData: any[] = [];
  paymentStatusesSelected: any[] = [];
  selectedStatus: string = '';
  businessListExpanded: boolean = false;
  filteredTransactions: any[] = [];
  filteredByNameTransactions: any[] = [];
  selectedTransactionList: any[] = [];
  currentBillingPeriodId: string;
  globalDateFormat: any;
  isData: boolean = true;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _buisnessService: BuisnessService,
    private renderer: Renderer2,
    private dashboardWidgetsService: DashboardService,
    private resolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
    private translateService: TranslateService,
    private modalService: NgbModal,
    private _fileService: FileService,
    private _toastService: ToastService,
    private _notifierService: NotifierService,
    private _appService: AppSettingsService,
    private pageInfo: PageInfoService,
    private common: CommonService,
    private _appSetting: AppSettingsService
  ) {
    this.billingPeriodId = _appSetting.$rootScope.billingPeriodId;
    this.selectedBillingPeriodId = this.billingPeriodId;
    this.currentBillingPeriodId = this.billingPeriodId;
    this.billingPeriodsData = _appSetting.$rootScope.billingPeriods;
    this.checkFilterOption();
    // this.defaultSelectedBillingPeriodIndex = _appSetting.$rootScope.IsCustomBilling == 'true' ? 2 : 1;
  }

  updateSelectedStatus(status: string) {
    var existingStatus = this.paymentStatusesSelected.filter(
      (s: any) => s === status
    );
    if (existingStatus.length > 0) {
      var index = this.paymentStatusesSelected.indexOf(status);
      this.paymentStatusesSelected.splice(index, 1);
      this.reloadGridWithoutApi();
    } else {
      this.paymentStatusesSelected.push(status);
    }
    this.filterPaymentTransactionsByStatus(this.paymentStatusesSelected);
  }

  filterPaymentTransactionsByStatus(statusInput: any) {
    this.filteredTransactions = [];
    if (statusInput.length > 0) {
      statusInput.forEach((statusdata: any) => {
        let filteredTransactionData = this.transactionListData.filter(
          (item: any) => {
            if (
              item.PaymentDetails.Data &&
              item.PaymentDetails.Data.length > 0
            ) {
              let count = item.PaymentDetails.Data.filter((payment: any) => {
                if (
                  payment.Status !== null &&
                  (statusdata.toUpperCase() === payment.Status.toUpperCase() ||
                    statusdata.toUpperCase() ===
                    item.InvoiceStatus.toUpperCase())
                ) {
                  return payment;
                }
              }).length;

              if (count > 0) {
                return item;
              } else {
                if (statusdata.toUpperCase() === 'Finalized'.toUpperCase()) {
                  return item.DueStatus === 'DUE_STATUS_FINALIZED';
                }
              }
            } else {
              if (statusdata.toUpperCase() === 'OverDue'.toUpperCase()) {
                return item.DueStatus === 'DUE_STATUS_OVERDUE';
              } else {
                if (statusdata.toUpperCase() === 'Due'.toUpperCase()) {
                  return item.DueStatus === 'DUE_STATUS_DUE';
                } else {
                  if (
                    statusdata.toUpperCase() === 'Finalized'.toUpperCase()
                  ) {
                    return item.DueStatus === 'DUE_STATUS_FINALIZED';
                  }
                }
              }
            }
          }
        );
        filteredTransactionData.forEach((data) => {
          const filteredTransactionsExistingIndex =
            this.filteredTransactions.indexOf(data);
          if (filteredTransactionsExistingIndex === -1) {
            this.filteredTransactions = this.filteredTransactions.concat(data);
          }
        });
      });
    } else {
      this.filteredTransactions = this.transactionListData;
    }
    this.reloadGridWithoutApi();
  }

  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
  }
  billingPeriodDropDownClickOutside() {
    this.dropdownVisible = false;
  }

  showSelectedFirstPeriod() {
    let index = this.billingPeriodsData.findIndex(
      (item: any) => item.BillingPeriodId == this.selectedBillingPeriodId
    );

    if (index != -1) {
      var datePipe = new C3DatePipe(this._appSetting);
      const billingStartDate = datePipe.transform(
        this.billingPeriodsData[index].BillingStartDate,
        this.globalDateFormat
      );
      const billingEndDate = datePipe.transform(
        this.billingPeriodsData[index].BillingEndDate,
        this.globalDateFormat
      );

      return `${billingStartDate} - ${billingEndDate} (${this.billingPeriodsData[index]?.BillingId})`;
    } else {
      return 'All period';
    }
  }


  toggleAllRows() {
    let self = this;
    const table = $(this.childTable.nativeElement).DataTable();
    if (!this.businessListExpanded) {
      table.rows().every(function (rowIdx, tableLoop, rowLoop) {
        const row = this;
        if (row?.data()) {
          row.child.hide();
          row.data()['Collapse'] = false;
        }
      });
    } else {
      table.rows().every(function (rowIdx, tableLoop, rowLoop) {
        const row = this;
        if (row?.data()) {
          row.data()['Collapse'] = true;
          self.loadChildComponent(row);
        }
      });
    }
    this._cdRef.detectChanges();
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
    let data = row?.data()?.PaymentDetails?.Data || [];
    if (data?.length > 0) {
      const componentFactory = this.resolver.resolveComponentFactory(
        BusinessTransactionDetailsComponent
      );
      const componentRef =
        this.viewContainerRef.createComponent(componentFactory);
      // Set the searchParams input of the ChildTableComponent
      componentRef.instance.data = data || [];
      //console.log(data)
      // Trigger change detection to ensure the data is displayed correctly
      componentRef.changeDetectorRef.detectChanges();
      row.child(componentRef.location.nativeElement).show();
    }
  }

  onSelectAllCheckboxChange(value: boolean) {
    this.selectedTransactionList = [];
    if (value) {
      this.transactionListData.forEach((item: any) => {
        if (
          item.DueStatus === 'DUE_STATUS_OVERDUE' ||
          item.DueStatus === 'DUE_STATUS_DUE'
        ) {
          item.IsSelected = true;
          const existingTransaction = this.selectedTransactionList?.find(
            (invoiceId: any) => invoiceId === item.InvoiceId
          );
          if (!existingTransaction) {
            this.selectedTransactionList.push(item.InvoiceId);
          }
        }
      });
      // this.filteredTransactions.forEach((item: any) => {
      //   if (
      //     item.DueStatus === 'DUE_STATUS_OVERDUE' ||
      //     item.DueStatus === 'DUE_STATUS_DUE'
      //   ) {
      //     item.IsSelected = true;
      //   }
      // });
    } else {
      this.transactionListData.forEach((item: any) => {
        item.IsSelected = false;
      });
      this.filteredTransactions.forEach((item) => {
        item.IsSelected = false;
      });
    }
    this.reloadGridWithoutApi();
  }

  downloadReport() {
    const modalRef = this.modalService.open(BusinessTransactionreportpopupComponent, {
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: 'lg',
      backdrop: 'static',
    });
    // modalRef.componentInstance.reportConfig = reportConfig;
    modalRef.result.then(
      (result) => {
        if (result) {
          var reqBody = {
            BillingPeriodId: this.selectedBillingPeriodId,
            PaymentStatusSelected: this.paymentStatusesSelected.join(','),
            InvoicesId: this.selectedTransactionList.join(','),
            Email: result.email
          };
          var fileType = result.fileType;
          var email = result?.email || null;
          var emailIsEmpty =
            result?.email == null ||
            result?.email == null ||
            result?.email == undefined;
          this._fileService.getFile(
            `reports/InvoicesTransactionReport/${fileType}/${email}`,
            true,
            reqBody
          );
        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  downloadInvoicesDues() {
    var requestBody = {
      EntityName: this.common.entityName,
      RecordId: this.common.recordId,
      BillingPeriodId: this.selectedBillingPeriodId,
    };
    this._fileService.getFile(
      'reports/downloadInvoicedues/',
      true,
      requestBody
    );
  }

  payInvoices() {
    if (this.selectedTransactionList.length > 0) {
      let confirmationMessage = this.translateService.instant(
        'TRANSLATE.INITIATE_PENDING_INVOICE_PAYMENT_CONFIRMATION'
      );
      this._notifierService
        .confirm({ title: confirmationMessage })
        .then((result: { isConfirmed: any }) => {
          if (result.isConfirmed) {
            let reqBody = {
              EntityName: 'Partner',
              RecordId: null,
              InvoiceIds: this.selectedTransactionList,
            };
            const subscription = this._buisnessService
              .getInitiateInvoicePayment(reqBody)
              .pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
                this._toastService.success(
                  this.translateService.instant(
                    'TRANSLATE.AUTO_PAYMENT_REQUEST_SUCCESS'
                  )
                );
                this.reloadGrid();
              });
              this._subscriptionArray.push(subscription);
          }
        });
    } else {
      this._toastService.error(
        this.translateService.instant(
          'TRANSLATE.SELECT_MINUMUN_INVOICE_NOTIFICATION'
        )
      );
    }
  }

  ngOnInit(): void {
    this.aLLPeriods = this.translateService.instant('TRANSLATE.CUSTOMER_OPTION_ALL_PERIODS');
    // this.fetchBuisnessPeriods();
    this.handleTableConfig();
    this.pageInfo.updateTitle(this.translateService.instant("CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS']);
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
  }

  reloadGrid() {
    //to hide the dropdown option box
    this.dropdownVisible = false;
    const subscription = this._buisnessService
      .getTransactionList(this.selectedBillingPeriodId)
      .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
        if (Data === 0) {
          this.isData = false;
        } else {
          this.isData = true;
        }
        let data: any[] = Data?.map((row: any) => {
          row['isHide'] = !this.showCheckBox(row);
          return row;
        })
        this.filteredTransactions = data || [];
        this.transactionListData = data || [];
        if (this.paymentStatusesSelected?.length > 0) {
          this.filterPaymentTransactionsByStatus(this.paymentStatusesSelected);
        } else {
          this.datatableConfig.data = data;
          this.reloadEvent.emit(true);
        }
      });
      this._subscriptionArray.push(subscription);
  }
  reloadGridWithoutApi() {
    //to hide the dropdown option box
    this.dropdownVisible = false;
    if (this.paymentStatusesSelected.length == 0) {
      this.filteredTransactions = this.transactionListData;
    }
    if (this.filterByOwnedBy.length == 0) {
      this.filteredByNameTransactions = [];
    }
    if (this.filteredTransactions.length > 0 && this.filterByOwnedBy.length > 0) {
      this.datatableConfig.data = this.filteredTransactions.filter((transaction: any) =>
        transaction.OwnedBy.toUpperCase().includes(this.filterByOwnedBy.toUpperCase())
      );
    }
    else if (this.filterByOwnedBy.length > 0) {
      this.datatableConfig.data = this.filteredByNameTransactions;
    }
    else if (this.filteredTransactions.length > 0 || this.paymentStatusesSelected.length > 0) {
      this.datatableConfig.data = this.filteredTransactions;
    }
    else {
      this.datatableConfig.data = this.transactionListData;
    }
    if (this.datatableConfig.data.length === 0) {
      this.isData = false;
    } else {
      this.isData = true;
    }
    this.reloadEvent.emit(true);
  }

  fetchBuisnessPeriods() {
    const subscription = this.dashboardWidgetsService
      .getBillingPeriods()
      .pipe(takeUntil(this.destroy$)).subscribe((billingPeriods: any) => {
        this.billingPeriodsData =
          billingPeriods?.Data?.reverse() || [];
        this.billingPeriodId =
          billingPeriods.Data[billingPeriods.Data.length - 1].BillingPeriodId;
        this.selectedBillingPeriodId = this.billingPeriodId;
        this.currentBillingPeriodId = this.billingPeriodId;
        this.checkFilterOption();
        this.handleTableConfig();
      });
      this._subscriptionArray.push(subscription);
  }

  checkFilterOption() {
    this.paymentStatusData = [
      {
        Id: 1,
        Name: 'Success',
        Description: 'PAYMENT_STATUS_DESC_SUCCESS',
      },
      {
        Id: 2,
        Name: 'InProgress',
        Description: 'PAYMENT_STATUS_DESC_INPROGRESS',
      },
      {
        Id: 3,
        Name: 'Failed',
        Description: 'PAYMENT_STATUS_DESC_FAILED',
      },
      {
        Id: 4,
        Name: 'PartiallyPaid',
        Description: 'PAYMENT_STATUS_DESC_PARTIAL_PAID',
      },
      {
        Id: 5,
        Name: 'OverDue',
        Description: 'STATUS_OVER_DUE',
      },
      {
        Id: 6,
        Name: 'Due',
        Description: 'STATUS_DUE',
      }
    ];

    if ( this.currentBillingPeriodId && this.selectedBillingPeriodId && this.currentBillingPeriodId === this.selectedBillingPeriodId.toString()) {
      let finalizedStatus = {
        Id: 7,
        Name: 'Finalized',
        Description: 'PAYMENT_STATUS_DESC_FINALIZED'
      };
      this.paymentStatusData.push(finalizedStatus);
    }
  }

  removeOption(id: any) {
    this.selectedBillingPeriodId = this.selectedBillingPeriodId.find(
      (item: any) => item != id
    );
    this.checkFilterOption()
  }

  checkBillingPeriodChange(periodData: any) {
    if (periodData) {
      this.selectedBillingPeriodId = periodData?.BillingPeriodId;
    } else {
      this.selectedBillingPeriodId = null;
    }
    this.checkFilterOption();
    this.reloadGrid();
  }

  handleTableConfig() {
    const self = this;
    const subscription = this._buisnessService
      .getTransactionList(this.selectedBillingPeriodId)
      .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
        if (Data.length === 0) {
          this.isData = false;
        } else {
          this.isData = true;
        }
        let data: any[] = Data?.map((row: any) => {
          row['isHide'] = !this.showCheckBox(row);
          return row;
        })
        self.transactionListData = data || [];
        setTimeout(() => {
          this.datatableConfig = {
            serverSide: false,
            pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
            data: data,
            order: [1, 'asc'],
            columns: [
              // {
              //   className: 'dt-control',
              //   orderable: false,
              //   data: null,
              //   defaultContent: '',
              // },
              {
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
                searchable: true,
                title: this.translateService.instant(
                  'TRANSLATE.PAYMENTS_TABLE_HEADER_OWNED_BY'
                ),
                data: 'OwnedBy',
                className: "",
                render: function (data: any) {
                  return `<span class="fw-semibold">${data}</span>`
                }
              },
              {
                title: this.translateService.instant(
                  'TRANSLATE.PAYMENTS_TABLE_HEADER_INVOICE_NUMBER'
                ),
                className: "",
                data: 'InvoiceNumber',
                width: '20%',
              },
              {

                title: this.translateService.instant(
                  'TRANSLATE.PAYMENTS_TABLE_HEADER_BILLED_AMONT'
                ),
                className: 'text-end pe-2',
                defaultContent: '',
                ngTemplateRef: {
                  ref: this.billedAmount,
                  context: {
                    // needed for capturing events inside <ng-template>
                    captureEvents: self.onCaptureEvent.bind(self),
                  },
                },
              },
              {
                title: this.translateService.instant(
                  'TRANSLATE.PAYMENTS_TABLE_HEADER_PAID_AMONT'
                ),
                className: 'text-end pe-2',
                defaultContent: '',
                ngTemplateRef: {
                  ref: this.paidAmount,
                  context: {
                    // needed for capturing events inside <ng-template>
                    captureEvents: self.onCaptureEvent.bind(self),
                  },
                },
              },
              {
                title: this.translateService.instant(
                  'TRANSLATE.PAYMENTS_TABLE_HEADER_PENDING_AMONT'
                ),
                className: ' text-end pe-2',
                defaultContent: '',
                ngTemplateRef: {
                  ref: this.pendingAmount,
                  context: {
                    // needed for capturing events inside <ng-template>
                    captureEvents: self.onCaptureEvent.bind(self),
                  },
                },
              },
              {
                title: this.translateService.instant(
                  'TRANSLATE.PAYMENTS_TABLE_HEADER_INVOICE_DUE_STATUS'
                ),
                data: 'DueStatus',
                className: "text-start",
                render: function (data: any) {
                  let text: any = "";
                  if (data != undefined && data != null && data != "null") {
                    text = self.translateService.instant(
                      'TRANSLATE.' + data
                    );
                  }
                  return `<span>${text}</span>`
                }
              },
            ],
          };
          this._cdRef.detectChanges();
        });
      });
      this._subscriptionArray.push(subscription);
  }

  showCheckBox(row: any) {
    if (row.HasInvoicePayment && (row.DueStatus === 'DUE_STATUS_OVERDUE' || row.DueStatus === 'DUE_STATUS_DUE')) {
      return true
    } else {
      return false
    }
  }

  handleSelection(event: any) {
    this.selectedTransactionList = event?.map((row: any) => row.InvoiceId);
    this.selectedTransactionList = Array.from(new Set(this.selectedTransactionList))
    if (event?.length > 0) {
      this.transactionListData?.forEach((row: any) => {
        if (
          row.DueStatus === 'DUE_STATUS_OVERDUE' ||
          row.DueStatus === 'DUE_STATUS_DUE'
        ) {
          event?.forEach((selectedRow: any) => {
            if (row.InvoiceId === selectedRow.InvoiceId) {
              row.IsSelected = true;
            }
          });
        }
      });
      this.filteredTransactions?.forEach((row: any) => {
        if (
          row.DueStatus === 'DUE_STATUS_OVERDUE' ||
          row.DueStatus === 'DUE_STATUS_DUE'
        ) {
          event?.forEach((selectedRow: any) => {
            if (row.InvoiceId === selectedRow.InvoiceId) {
              row.IsSelected = true;
            }
          });
        }
      });
    } else {
      this.transactionListData.forEach(function (item) {
        item.IsSelected = false;
      });

      this.filteredTransactions.forEach(function (item) {
        item.IsSelected = false;
      });
    }
  }

  filterForOwnedBy(filterByOwnedBy: any) {
    this.filteredByNameTransactions = [];
    if (filterByOwnedBy.length > 0) {
      let filteredByNameTransactionData = this.datatableConfig.data.filter(
        (item: any) => {
          if (
            item.OwnedBy.toUpperCase().includes(filterByOwnedBy.toUpperCase())
          ) {
            return item;
          }
        }
      );
      filteredByNameTransactionData.forEach((data) => {
        const filteredTransactionsExistingIndex =
          this.filteredByNameTransactions.indexOf(data);
        if (filteredTransactionsExistingIndex === -1) {
          this.filteredByNameTransactions = this.filteredByNameTransactions.concat(data);
        }
      });
    } else {
      this.filteredByNameTransactions = this.transactionListData;
    }
    this.reloadGridWithoutApi();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe();
  }

  onCaptureEvent(event: Event) { }
}
