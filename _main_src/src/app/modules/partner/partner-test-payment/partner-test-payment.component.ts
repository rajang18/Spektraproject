import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Subscription, takeUntil } from 'rxjs';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router'; // Import Router
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { NotifierService } from 'src/app/services/notifier.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { TestPaymentsService } from '../customers/services/customer-test-payment.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { PaymentProfileService } from '../../home/profile/services/paymentprofile.service';


@Component({
  selector: 'app-partner-test-payment',
  templateUrl: './partner-test-payment.component.html',
  styleUrls: ['./partner-test-payment.component.scss']
})
export class PartnerTestPaymentComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {

  entityName: string | null;
  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isEditing: boolean[] = [];
  c3Id: string | null;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  customerName: any;
  isAnyPaymentFailure: boolean = false;
  declare _subscription: Subscription;
  globalDateFormat: string;
  amount: any;
  billingProvider: any;
  supportedPaymentTypes: any;
  stripeBankAccountTransactionEnabled: any;

  constructor(
    private toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    private pageInfo: PageInfoService,
    private _translateService: TranslateService,
    private _testPaymentsService: TestPaymentsService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    public _paymentProfileService: PaymentProfileService,
    private _notifierService: NotifierService,
    private c3RouterService: C3RouterService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);

    this.navigation = this._router.getCurrentNavigation();

    this.c3Id = this.navigation?.extras.state?.['c3Id'];
    if (!this.c3Id) {
      this._router.navigate(['partner/customers']);
    }

    this.customerName = this.navigation?.extras.state?.['Name'];
    if (!this.customerName) {
      this._router.navigate(['partner/customers']);
    }

    this.entityName = this.navigation?.extras.state?.['EntityName'];
    if (!this.entityName) {
      this._router.navigate(['partner/customers']);
    }
  }
  ngOnInit(): void {
    this.handleTableConfig();
    this.fetchApplicationData();
    this.getPaymentProfiles();
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
  }

  getPaymentProfiles() {
    this._subscription = this._testPaymentsService.getPaymentProfiles(this.entityName,this.c3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.stripeBankAccountTransactionEnabled = response.Data;
      this.cdRef.detectChanges();
    })
  }
  fetchApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.amount = res.Data.MinimumChargeAmount;
    });
    this._subscriptionArray.push(subscription);
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let title: string = this._translateService.instant('TRANSLATE.CUSTOMER_TEST_PAYMENT_HEADER_TEXT_PAYMENTS_FOR');
    title = title + `<span class="text-primary">${this.customerName}</span>`
    this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE', 'BREADCRUMB_HEADER_TEST_PAYMENT']);
    this.pageInfo.updateTitle(title, true);
  }
  handleTableConfig() {
    const self = this;
    const customerC3Id = this.c3Id;
    this.datatableConfig = null;
    const subscription = this._testPaymentsService.getTestPayments(this.entityName, customerC3Id!).pipe(takeUntil(this.destroy$)).subscribe(
      ({ Data }: any) => {
        setTimeout(() => {
          this.isAnyPaymentFailure = Data.some((tp: any) => tp.PaymentStatusName === "Failed");
          this.datatableConfig = {
            serverSide: false,
            pageLength: 10,
            data: Data,
            columns: [
              {
                title: this._translateService.instant('TRANSLATE.CUSTOMERS_INVOICEPAYMENTS_TABLE_HEADER_DATE'),
                data: 'PaymentDate',
                className: 'col-md-2 text-left',
                render: (data: string) => {
                  var datePipe = new C3DatePipe(this._appService);
                  return datePipe.transform(data);
                },
              },
              {
                title: this._translateService.instant('TRANSLATE.CUSTOMERS_INVOICEPAYMENTS_TABLE_STATUS'),
                data: 'PaymentStatusName',
                className: 'col-md-6 text-left',
              },
              {
                title: this._translateService.instant('TRANSLATE.CUSTOMERS_INVOICEPAYMENTS_TABLE_FAILURE_REASON'),
                data: 'FailureReason',
                className: 'col-md-4 text-right',
                visible: this.isAnyPaymentFailure,
                render: (data: string, type: any, row: any) => {
                  return this.isAnyPaymentFailure ? data : '';
                }
              },
            ],
            order: [[0, 'desc']],
          };
          this.cdRef.detectChanges();
        });
      },
      error => {
        this.toastService.error('Error loading test payments.');
      }
    );
    this._subscriptionArray.push(subscription);
  }
  onCaptureEvent(event: Event) { }

  RecordPayment() {
    if (this.stripeBankAccountTransactionEnabled === false) {
      this.toastService.error(this.translateService.instant("TRANSLATE.CANNOT_INITIATE_PAYMENT_AS_BANK_ACCOUNT_IS_NOT_VERIFIED"));

    }
    else {
      const pendingPayments = this.datatableConfig.data.filter((payment: any) => {
        return payment.PaymentStatusName === "InProgress";
      });

      if (pendingPayments.length > 0) {
        this.toastService.error(this.translateService.instant('TRANSLATE.CANNOT_INITIATE_PAYMENT'));
      } else {
        const confirmationMessage = this.translateService.instant('TRANSLATE.INITIATE_TEST_PAYMENT_CONFIRMATION', { amount: this.amount });
        this._notifierService.confirm({ title: confirmationMessage, confirmButtonColor: 'green', }).then((result) => {
          if (result.isConfirmed) {
            const subscription = this._testPaymentsService.recordPayment(this.entityName, this.c3Id, this.amount)
              .pipe(takeUntil(this.destroy$)).subscribe({
                next: (response: any) => {
                  this.toastService.success(this.translateService.instant('TRANSLATE.AUTO_PAYMENT_REQUEST_SUCCESS'));
                  this.handleTableConfig();
                },
                error: (error: any) => {
                  this.toastService.error(this.translateService.instant("TRANSLATE.ERROR_IN_PAYMENT_PROCESS"));
                }
              });
            this._subscriptionArray.push(subscription);
          }
        });
      }
    }
  }

  backToCustomers() {
    this.c3RouterService.backToHistory(this.keyForData, 'partner/customers');
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
