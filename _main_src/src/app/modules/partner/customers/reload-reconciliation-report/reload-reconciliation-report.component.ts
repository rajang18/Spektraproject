import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { interval, Subscription, switchMap, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reload-reconciliation-report',
  templateUrl: './reload-reconciliation-report.component.html',
  styleUrl: './reload-reconciliation-report.component.scss'
})
export class ReloadReconciliationReportComponent extends C3BaseComponent implements OnInit, OnDestroy {


  reloadCustomers: any[] = [];
  inputModel: any = {};
  JobStatusForLoadReconReportObj: any;
  JobStatusForLoadReconReportList: any;
  ActiveLoadReconWebJobs: any[] = [];

  isAlertEnabled: boolean;
  statusLoading: boolean;
  pageMode: string;
  entityName: string;
  isAnyActivePlanLeft: boolean = true;
  private timerHandle: Subscription | null = null;

  constructor(private _customerService: CustomersListingService,
    private _cdref: ChangeDetectorRef,
    private _translateService: TranslateService,
    public _router: Router,
    private _commonService: CommonService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    public dynamicTemplateService: DynamicTemplateService,
    public permissionService: PermissionService,
    private _toastService: ToastService) {
    super(permissionService, dynamicTemplateService, _router, _appService);
    const navigation = this._router.getCurrentNavigation();
    //this.pageMode = navigation?.extras.state?.['pageMode'] ? navigation?.extras.state?.['pageMode'] :'add';
  }


  ngOnInit() {
    this.entityName = this._commonService.entityName;
    this.getCustomers();
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.RELOAD_RECONCILIATION_STATUS"),true);
    if(this._commonService.entityName === 'Reseller'){
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS','RELOAD_RECONCILIATION_STATUS']);
    }
    else if(this._commonService.entityName === 'Partner'){
      this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS','RELOAD_RECONCILIATION_STATUS']);
    }
  }

  getCustomers() {
    let searchParams:any = {
      Name: null,
      CustomerPlanId: null,
      PaymentMethod: null,
      ProviderId: null,
      MarketCodes: null,
      StartInd: 1,
      PageSize: 100000,/**To Fetch all the customers for reloading recon report*/
      SortColumn: '',
      SortOrder: '',
      PlanId: null,
      TagKey: null,
      TagValues: null,
      ConfigValue: null,
      ConfigName: null,
    };
    const subscription =  this._customerService.getList(searchParams).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      var customerList: any = [];
      this.reloadCustomers = response.Data;
      if (response.Status === "Success") {
        this.reloadCustomers.forEach((obj: any) => {
          obj.Status = "Queued";
          obj.ErrorMessage = '';
          customerList.push({ C3CustomerId: obj.C3Id, ServiceProviderCustomerId: null });
        })
        this.inputModel = { CustomerC3Id: null, Customers: customerList };
      }
      else {
        this._toastService.error(this._translateService.instant('TRANSLATE.RECON_REPORT_RELOAD_INITIAT_FAIL'));
      }

      this._cdref.detectChanges();
      this.reloadCustomerReconReportWebJOB();
      // if (typeof callback == 'function') {
      //     callback();
      // }
    });
    this._subscriptionArray.push(subscription);
  }

  reloadCustomerReconReportWebJOB() {
    const subscription =  this._customerService.reloadReconReport(this.inputModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === "Success") {
        // Need to add swal confirmation
        Swal.fire({
          icon: 'success',
          title: this._translateService.instant('TRANSLATE.RECON_REPORT_RELOAD_INITIAT_SUCCESS'),
          confirmButtonColor:'#49BA7C'
          //text: "Unblock popups for the downloaded file to be opened",
        });
        //notifier.notify($filter('translate')('RECON_REPORT_RELOAD_INITIAT_SUCCESS'));

        this.JobStatusForLoadReconReportObj = response.Data;
        this.JobStatusForLoadReconReportList = this.JobStatusForLoadReconReportObj.C3Customers;
        this.statusLoading = false;
        this.reloadCustomers.forEach((obj: any) => {
          this.JobStatusForLoadReconReportList.forEach((newObj: any) => {
            if (obj.C3Id == newObj.C3CustomerId) {
              obj.Status = newObj.Status;
              obj.ErrorMessage = newObj.ErrorDetails;

              if (newObj.Status == 'Queued' || newObj.Status == 'InProgress') {
                this.statusLoading = true;
                this.ActiveLoadReconWebJobs.push({
                  C3CustomerId: newObj.C3CustomerId,
                  JobLogC3Id: newObj.JobLogC3Id,
                  Status: newObj.Status,
                  CorrelationID: newObj.CorrelationID,
                  ErrorDetails: newObj.ErrorDetails
                });
              }
            }
          })
        })

        if (this.statusLoading) {
          this.pollForStatus();
        }
        else {
          this.stopPolling();
        }
      }
      else {
        this.statusLoading = false;
        this._toastService.error(this._translateService.instant('TRANSLATE.RECON_REPORT_RELOAD_INITIAT_FAIL'));
        this.stopPolling();
      }
      this._cdref.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getLoadReconWebJobStatus() {
    this.statusLoading = true;
    var customers: any = [];
    this.ActiveLoadReconWebJobs.forEach((obj: any) => {
      customers.push({ C3CustomerId: obj.C3CustomerId, JobLogC3Id: obj.JobLogC3Id });
    });
    var jobStatusForLoadReconReportModel = { Customers: customers };
    const subscription = this._customerService.loadReconWebJobStatus(jobStatusForLoadReconReportModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      var isError = false;
      if (response.Status === "Success") {

        var webojobstatusresponse = response.Data;
        this.JobStatusForLoadReconReportList = webojobstatusresponse.C3Customers;

        this.ActiveLoadReconWebJobs = this.JobStatusForLoadReconReportList.filter((obj: any) => {
          return obj.Status == 'Queued' || obj.Status == 'InProgress';
        });

        this.reloadCustomers.forEach((obj: any) => {
          this.JobStatusForLoadReconReportList.forEach((newObj: any) => {
            if (obj.C3Id == newObj.C3CustomerId) {
              if (newObj.Status == 'Failed') {
                newObj.ErrorDetails = 'RECON_CUSTOMER_REPORT_RELOAD_INITIAT_FAIL';
              }
              obj.Status = newObj.ErrorDetails != null && newObj.ErrorDetails.length > 0 ? 'Error' : newObj.Status;
              obj.ErrorMessage = newObj.ErrorDetails;
            }
          })
        });
        this.statusLoading = this.ActiveLoadReconWebJobs.length > 0;
        if (this.statusLoading) {
          this.pollForStatus();
        }
        else {
          this.stopPolling();
        }
      }
      else {
        this.statusLoading = false;
        this.stopPolling();
      }
      this._cdref.detectChanges()
    });
    this._subscriptionArray.push(subscription);
  }


  pollForStatus() {
    this.stopPolling();
    if (this.statusLoading && !this.timerHandle) {
      this.timerHandle = interval(30000).pipe( takeUntil(this.destroy$),
        switchMap(() => {
          // this.getAddMissingOffersPlansStatus();
          // this.isCompleteButtonEnabled();
          this.getLoadReconWebJobStatus();
          return [];
        })
      ).subscribe();
    } else {
      this.statusLoading = false;
    }
  }

  stopPolling() {
    if (this.timerHandle) {
      this.timerHandle.unsubscribe();
      this.timerHandle = null;
    }
  }

  backToCustomers(){
    this._router.navigate(['partner/customers']);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopPolling();
  }
}
