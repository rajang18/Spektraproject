import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';


@Component({
  selector: 'app-reload-customer-consent',
  templateUrl: './reload-customer-consent.component.html',
  styleUrl: './reload-customer-consent.component.scss'
})
export class ReloadCustomerConsentComponent implements OnInit, OnDestroy {
  _subscription: Subscription;
  CustomerLoadIndex: number;
  UserStatsLoading: number;
  CustomersToRefresh: any[] = [];
  RefreshStatus: any[] = [];
  customerC3Id: string;
  customerId: any;
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();   
  
  constructor(private _customersListingService: CustomersListingService,
    public _router: Router,
    private _cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    public _pageInfo:PageInfoService,

  ) {

    this.customerId = this._router.getCurrentNavigation()?.extras?.state?.customerId;
  }

  // Lifecycle hook to run initialization code

  ngOnInit(): void {
    this.loadingCustomersData();
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_HEADER_TEXT_RELOADING_CUSTOMER_CONSENT_CUSTOMERS"),true);
    this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE','CUSTOMER_HEADER_TEXT_RELOADING_CUSTOMER_CONSENT_CUSTOMERS']);
  }

  loadingCustomersData() {
    const subscription =  this._customersListingService.loadingCustomersData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.CustomerLoadIndex = 0;
      // customer settings reload customer profile
      if (this.customerId !== null && this.customerId !== undefined && this.customerId !== "") {
        this.CustomersToRefresh = response.Data.filter((e: { C3Id: string; }) => e.C3Id === this.customerId);
      }
      // reload for all customers 
      else {
        this.CustomersToRefresh = response.Data;
      }
      this.RefreshStatus.splice(0, this.RefreshStatus.length);
      for (let i = 0; i < this.CustomersToRefresh.length; i++) {
        this.RefreshStatus.push({ name: this.CustomersToRefresh[i].Name, status: "open", errors: "" });
      }
      this._cdRef.detectChanges();

      if (this.CustomerLoadIndex < response.Data.length) {
        this.loadData(this.CustomerLoadIndex);
      }
    });
    this._subscriptionArray.push(subscription);
  }

  loadData(CustomerIndex: number) {

    const customer = this.CustomersToRefresh[CustomerIndex];
    const customerC3Id = customer.C3Id;
    const currentCustomerIndex = CustomerIndex + 1;
    this.UserStatsLoading = (currentCustomerIndex / this.CustomersToRefresh.length) * 100;
    this.RefreshStatus[CustomerIndex].status = "inprogress";
    this._cdRef.detectChanges();

    const subscription =  this._customersListingService.reloadCustomerConsentData(customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === "Success") {
        this.RefreshStatus[CustomerIndex].status = "done";
        this._cdRef.detectChanges();
        this.processNextCustomerRecord();
      }
      else if (response.Status === "Error") {
        this.RefreshStatus[CustomerIndex].status = "error";
        this.RefreshStatus[CustomerIndex].errors = this._translateService.instant('TRANSLATE.' + response.ErrorMessage);
        this._cdRef.detectChanges();
        this.processNextCustomerRecord();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  processNextCustomerRecord() {
    this.CustomerLoadIndex = this.CustomerLoadIndex + 1;

    if (this.CustomerLoadIndex < this.CustomersToRefresh.length) {
      this.loadData(this.CustomerLoadIndex);
    }
    else {
      this._router.navigate(['partner', 'customers']);
    }
  }

  // Lifecycle hook to clean up resources

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
