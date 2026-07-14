import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil} from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { StateApiResponse } from 'src/app/shared/models/customers.model';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { PermissionService } from 'src/app/services/permission.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';

@Component({
  selector: 'app-customer-link-billing-profile',
  templateUrl: './customer-link-billing-profile.component.html',
  styleUrl: './customer-link-billing-profile.component.scss'
})
export class CustomerLinkBillingProfileComponent  extends C3BaseComponent implements OnInit, OnDestroy {
  activeBillingProvider: any;
  billingProviderHelplines: string;
  billingDetailsForm: FormGroup;
  customerBillingProfileLookUpStatus: any[] = [];
  onboardCustomerBillingModel: any = {};
  customerC3Id: string; 
  proceedToOnboardBillingProfile: boolean = false;
  constructor(private _commonService: CommonService,
    private _customersListingService: CustomersListingService,
    private _notifierService: NotifierService,
    public _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _cdRef: ChangeDetectorRef,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _formBuilder: FormBuilder,
    private _unsavedChangesService: UnsavedChangesService,
    public _pageInfo:PageInfoService,
    private _appService: AppSettingsService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    // Initialize the customer details in billing system

    this.billingDetailsForm = this._formBuilder.group({
      BillingProviderReferenceID: ['', Validators.required],
    });
  }
 

  // Lifecycle hook to run initialization code

  ngOnInit(): void {
    const subscription = this._activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.customerC3Id = params['id']
      this.getActiveBillingProvider();
      this.onClickLookUpCustomerDetails();
      //this.proceedToOnboard();
      this.billingDetailsForm.markAsUntouched();
    })
    this._subscriptionArray.push(subscription);
  }

  // Getting active billing provider
  // If no active billing provider is there then we are considering as custom

  getActiveBillingProvider() {
    const subscription = this._commonService.getActiveBillingProvider(this.customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === "Success" && response.Data !== null) {
        this.activeBillingProvider = response.Data.Name;
        this.billingProviderHelplines = this.activeBillingProvider.trim();
        this._cdRef.detectChanges();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  /* Looking of customer details in billing system.
  * 1. We are checking the provider customer details in local(c3) billing system.
  * 2. If exists we are throwing an error saying that customer billing details already exists
  * 3. If not exists in local(c3), we are checking the provider customer details in billing system.
  * 4. If exists we are getting thouse details and bind with UI. And going forward
  * 5. If not exist in billing system, then we are giving an alert saying that no details and going forward.
 */

  onClickLookUpCustomerDetails() {
    this.billingDetailsForm.markAllAsTouched();
    if (this.billingDetailsForm.valid) {
      if (this.customerBillingProfileLookUpStatus.length > 0) {
        this.customerBillingProfileLookUpStatus.splice(0, 1);
      }
      const subscription = this._customersListingService.lookUpCustomerDetailsInBillingWithBillingCustomerId(this.billingDetailsForm.value.BillingProviderReferenceID).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: StateApiResponse) => {
          if (response.Status === "Success" && this.activeBillingProvider === "EziDebit") {
            this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_BILLING_ONBOARDING_CUSTOMER_ALREADY_EXISTS_ERROR'));
          }
          else if (response.Status === "BusinessRuleFail") {
            if (response.ErrorMessage !== "Existing") {
              this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMER_BILLING_ONBOARDING__CUSTOMER_ONBAORDING_IN_PROGRESS'));
            }
          }
          else {
            let name = this._translateService.instant('TRANSLATE.CUSTOMERS_ONBOARDING_LOOKUP_BILLING_INPROGRESS');
            this.customerBillingProfileLookUpStatus.push({ name: name, status: "inprogress", errors: "" });
            this._cdRef.detectChanges();
            const subscription = this._customersListingService.customerBillingProfileLookUpStatus(this.customerC3Id, this.billingDetailsForm.value.BillingProviderReferenceID).pipe(takeUntil(this.destroy$)).subscribe({
              next: (response: StateApiResponse) => {
                if (response.Status === "Success") {
                  this.onboardCustomerBillingModel = response.Data;
                  this.onboardCustomerBillingModel.C3CustomerID = this.customerC3Id;

                  let customerDetailFromBilling = [this.onboardCustomerBillingModel.AddressLine1, this.onboardCustomerBillingModel.AddressLine2, this.onboardCustomerBillingModel.City, this.onboardCustomerBillingModel.StateProvince, this.onboardCustomerBillingModel.PostalCode, this.onboardCustomerBillingModel.Country];
                  let customerAddressDetailNonBlanks = customerDetailFromBilling.filter(a => a !== null && a.length > 0);
                  let formattedAddress = customerAddressDetailNonBlanks.join(',');
                  this.customerBillingProfileLookUpStatus[0].status = "done";
                  this.customerBillingProfileLookUpStatus[0].successMessage = this._translateService.instant('TRANSLATE.CUSTOMERS_ONBOARDING_LOOKUP_BILLING_SUCCESS', { ID: this.onboardCustomerBillingModel.BillingProviderReferenceID });
                  this.proceedToOnboardBillingProfile = true;
                }
                else {
                  this.proceedToOnboardBillingProfile = false;
                  this.customerBillingProfileLookUpStatus[0].status = "error";
                  this.customerBillingProfileLookUpStatus[0].errors = response.ErrorMessage;
                }
                this._cdRef.detectChanges();
              },
              error: (err: StateApiResponse) => {
                this.proceedToOnboardBillingProfile = false;
                this.customerBillingProfileLookUpStatus[0].status = "error";
                this.customerBillingProfileLookUpStatus[0].errors = err.ErrorMessage;
                this._cdRef.detectChanges();
              }
            });
          }
        },
        error: (err: StateApiResponse) => { }
      });
      this._subscriptionArray.push(subscription);
    }
  }

  proceedToOnboard() {
    const subscription = this._customersListingService.proceedToOnboard(this.activeBillingProvider, this.onboardCustomerBillingModel).pipe(takeUntil(this.destroy$)).subscribe(
      (response: any) => {
        if (response.Status === "Success") {
          this._notifierService.alert(
            { title: this._translateService.instant('TRANSLATE.CUSTOMER_BILLING_ONBOARDING_CREATED_SUCCESS') });
          this._router.navigate([`partner/customers`]);
        }
      })
      this._subscriptionArray.push(subscription);
  }

  backToCustomers() {
    let callback = ()=>{
      this._router.navigate(['partner/customers']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.billingDetailsForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  // Lifecycle hook to clean up resources

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
