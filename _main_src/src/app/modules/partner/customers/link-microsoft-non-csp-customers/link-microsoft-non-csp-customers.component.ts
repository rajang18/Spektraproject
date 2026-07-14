import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';

@Component({
  selector: 'app-link-microsoft-non-csp-customers',
  templateUrl: './link-microsoft-non-csp-customers.component.html',
  styleUrl: './link-microsoft-non-csp-customers.component.scss'
})
export class LinkMicrosoftNonCspCustomersComponent implements OnInit, OnDestroy {

  customerC3Id: string;
  customerName: string;
  providerId: string;
  providerName: string;
  addCustomerModel: any;
  countryList = ['TH', 'VN', 'TR', 'PL', 'ZA', 'IN', 'BR', 'IQ', 'MM', 'SS', 'SA', 'AE', 'AM', 'AZ', 'BY', 'HU', 'KZ', 'KG', 'MD', 'TJ', 'UA', 'UZ']; //list of countries that requires OrganizationRegistrationNumber
  countries: any = [];
  isOrganizationRegistrationNumberRequired: boolean;
  customerConsentURL: null;
  stateProvinces: any[];
  isChechingDomainAvailability: boolean;
  domain: string;
  isDomainAvailble: null;
  countryValidationRules: any;
  isCustomerConsentAcceptanceProvided: any;
  failedDomain: any;
  frmAddCustomer: FormGroup;
  thisEmailAddressIsAlredyExistMessage: any;
  canProceedForCreatingNewProviderTenant: any;
  canLogicalResellerProceedForCreatingNewProviderTenant: any;
  customerConsentAcceptanceDate: any;
  maxConsentDate: Date;
  hasSupportForResellersWithMPNID: string = 'No'
  entityName: string = '';
  recordId: string | null = '';
  isTenantAvailable: any;
 private destroy$ = new Subject<void>;
 _subscriptionArray: Subscription[] = [];

  constructor(
    private _customerService: CustomersListingService,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _router: Router,
    private _appSettingService: AppSettingsService,
    private _fb: FormBuilder,
    private _cdRef: ChangeDetectorRef,
    private _unsavedChangesService: UnsavedChangesService,
    private _pageInfo:PageInfoService,

  ) {
    this.entityName = _commonService.entityName;
    this.recordId = _commonService.recordId;
    this.createForm();

    let customerNameForLinkCustomer = localStorage.getItem("customerNameForLinkCustomer");
    if (customerNameForLinkCustomer !== undefined && customerNameForLinkCustomer !== null && customerNameForLinkCustomer !== '') {
      this.customerName = customerNameForLinkCustomer;
    }

    let providerIdForOnboard = localStorage.getItem("providerIdForOnboard");
    if (providerIdForOnboard !== undefined && providerIdForOnboard !== null && providerIdForOnboard !== '') {
      this.providerId = providerIdForOnboard;
    }

    let providerNameForOnboard = localStorage.getItem("providerNameForOnboard")
    if (providerNameForOnboard !== undefined && providerNameForOnboard !== null && providerNameForOnboard !== '') {
      this.providerName = localStorage.getItem("providerNameForOnboard");
    }

    let customerC3IdForLinkCustomer = localStorage.getItem("customerC3IdForLinkCustomer");
    if (customerC3IdForLinkCustomer !== undefined && customerC3IdForLinkCustomer !== null && customerC3IdForLinkCustomer !== '') {
      this.customerC3Id = customerC3IdForLinkCustomer;
      this.getCustomerDetailsByC3Id();
    }


  }
  ngOnInit(): void {
    let title = this._translateService.instant('TRANSLATE.LINK_CUSTOMER_HEADER_TEXT');
    title = title + ` <span class="text-primary">${this.customerName}</span>`
    this._pageInfo.updateTitle(title,true);
      if (this._commonService.entityName === 'Reseller') {
          this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS','SERVICE_PROVIDER_TENANT','DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER']);
      }
      else if (this._commonService.entityName === 'Partner') {
          this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS','SERVICE_PROVIDER_TENANT','DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER']);
      }

    this.getCountries();

  }

  getCountries() {
    this.countries = [];
    const subscription = this._commonService.getCountires().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.countries = response;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  backToCustomers() {
    if (this.frmAddCustomer && !this.frmAddCustomer.pristine) {
      let message = this._translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT')
      let btnConfirmMsg = this._translateService.instant('BUTTON_TEXT_OK');
      this._notifierService.confirm({ title: message, icon: 'info', confirmButtonText: btnConfirmMsg }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          this.frmAddCustomer.clearValidators();
          this.frmAddCustomer.reset();
          this._router.navigate(['partner/customers']);
        }
      });
    } else {
      this._router.navigate(['partner/customers']);
    }
  }

  getCustomerDetailsByC3Id() {
    //startBlockUI();

    const subscription = this._customerService.getCustomerDetailsByC3Id(this.customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === "Success" && response.Data !== null) {
        this.addCustomerModel = response.Data.ProviderCustomer;
        this.getCountryValidationRules(this.addCustomerModel.Address.Country, this.providerName);

        this.setFormValues(this.addCustomerModel);

        if (this.countries !== null && this.countries?.length > 0 && this.addCustomerModel?.Address?.Country?.length > 0) {
          this.addCustomerModel.Address.Country = this.countries.find((x: any) => x.Code === this.addCustomerModel.Address.Country)?.Code;
        }


        //Get country code by name
        // if (this.countries !== null && this.countries?.length > 0 && this.addCustomerModel.Address.Country.length > 0) {
        //   let countryMatch = this.countries.filter((x: any) => x.Code == this.addCustomerModel.Address.Country);
        //   if (countryMatch != undefined && countryMatch != '' && countryMatch != null) {
        //     if (this.countryList.includes(countryMatch[0].Code)) {
        //       this.isOrganizationRegistrationNumberRequired = true;
        //     }
        //     else {
        //       this.isOrganizationRegistrationNumberRequired = false;
        //     }
        //   }
        // }
        this._cdRef.detectChanges();
        this.onCountryChange(false);
      }
    });
    this._subscriptionArray.push(subscription);
  }

  onCountryChange(resetDetails = true) {
    this.getFormData()
    this.getStateProvincesByCountry(this.addCustomerModel.Address.Country, resetDetails);
    this.getCountryValidationRules(this.addCustomerModel.Address.Country, this.providerName);
  }

  getStateProvincesByCountry(country: any, resetDetails: any) {
    //startBlockUI();
    this.stateProvinces = null;
    if (resetDetails) {
      this.setFormControlValue('addressState', null);
      this.setFormControlValue('addressZip', null);
      this.setFormControlValue('addressCity', null);
      this.addCustomerModel.Address.State = null;
      this.addCustomerModel.Address.Zip = null;
      this.addCustomerModel.Address.City = null;
    }

    const subscription = this._commonService.getStateProvinceByCountryCode(country).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Data !== null && response?.Data?.length > 0) {
        this.stateProvinces = response.Data;
        //stopBlockUI();
      }
      else {
        if (resetDetails) {
          this.setFormControlValue('addressState', null);
          this.addCustomerModel.Address.State = null;
        }
        //stopBlockUI();
      }
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getCountryValidationRules(countryCode: string | null, providerName: string | null) {
    //startBlockUI();
    this.countryValidationRules = {};
    const subscription = this._commonService.getAddressValidationRules(countryCode, providerName).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === "Success") {
        this.countryValidationRules = response.Data;
        if(this.countryValidationRules?.PhoneNumberRegex!== null && this.countryValidationRules?.PhoneNumberRegex !== undefined &&this.countryValidationRules?.PhoneNumberRegex !==''){
          this.frmAddCustomer.get('phoneNumber').setValidators(Validators.pattern(this.countryValidationRules.PhoneNumberRegex));
        }
        if (this.countryValidationRules?.IsStateRequired) {
          this.frmAddCustomer.get('addressState').setValidators(Validators.required);
        }
        if (this.countryValidationRules?.IsPostalCodeRequired) {
          this.frmAddCustomer.get('addressZip').setValidators([Validators.required, Validators.pattern(this.countryValidationRules.PostalCodeRegex)]);
        }
        this.frmAddCustomer.updateValueAndValidity();
        //stopBlockUI();
        this._cdRef.detectChanges();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  addCustomer() {
    //vm.frmAddCustomer.$submitted = true;
    this.frmAddCustomer.markAllAsTouched();
    if (this.frmAddCustomer.valid) {
      //startBlockUI();
      this.getFormData()
      let postData: any = {
        C3CustomerID: this.customerC3Id,
        ProviderId: this.providerId,
        ProviderCustomer: this.addCustomerModel,
        EntityName: this._commonService.entityName,
        RecordId: this._commonService.recordId,
        ProviderName: this.providerName
      };
      const subscription = this._customerService.onboardExistingCustomer(postData).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === "Success") {
          let message = this._translateService.instant('TRANSLATE.LINK_MICROSOFT_NON_CSP_CUSTOMER_SUCCESS_MESSAGE');
          this._notifierService.alert({ title: message, icon: 'info' });
          this.frmAddCustomer.reset();
          this._router.navigate(['partner/customers/partnertenants']);
          //$state.go("partner.customers", { UseCachedFilters: true });
        }
        //stopBlockUI();
      });
      this._subscriptionArray.push(subscription);
    }
  }

  checkTenantAvailability(customerProviderRefId: any) {
    const subscription = this._customerService.checkTenantAvailability(this.customerC3Id, this.providerId, customerProviderRefId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let result = response.Data;
      if (result !== null) {
        this.isTenantAvailable = response.Data.HasTenantAvailable;
      } else {
        this.isTenantAvailable = false;
      }
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  cancelAddCustomer() {
    if (this.frmAddCustomer && !this.frmAddCustomer.pristine) {
      let message = this._translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT')
      let btnConfirmMsg = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
      this._notifierService.confirm({ title: message, icon: 'info', confirmButtonText: btnConfirmMsg }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          this.frmAddCustomer.clearValidators();
          this.frmAddCustomer.reset();
          this._router.navigate(['partner/customers']);
        }
      });
    } else {
      this._router.navigate(['partner/customers']);
    }
  }
  onEmailAddressChange() {
    this.getFormData();
    this.thisEmailAddressIsAlredyExistMessage = null;
    if (this.addCustomerModel.Email !== undefined && this.addCustomerModel.Email !== "" && this.addCustomerModel.Email !== null && this.addCustomerModel.Email.length > 0) {
      let email = this.addCustomerModel.Email;
      let requestFrom = "CustomerUser";

      if (localStorage.getItem("ResellerC3Id") !== undefined && localStorage.getItem("ResellerC3Id") !== null && localStorage.getItem("ResellerC3Id") !== "null") {
        requestFrom = "ResellerCustomerUser";
      }

      const subscription = this._commonService.canAddCustomer(email).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === "Success") {
          if (!response.Data) {
            this.thisEmailAddressIsAlredyExistMessage = this._translateService.instant('TRANSLATE.VALIDATION_MESSAGE_EMAIL_ALREADY_EXIST', { emailAddress: email })
            this._toastService.error(this.thisEmailAddressIsAlredyExistMessage);
            //notifier.notifyError($filter('translate')("VALIDATION_MESSAGE_EMAIL_ALREADY_EXIST", { emailAddress: email }));
            this.setFormControlValue('email', null);
            this.addCustomerModel.Email = null;
          }
        }
      });
      this._subscriptionArray.push(subscription);
    }
  }

  getApplicationData() {
    const subscription = this._appSettingService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.hasSupportForResellersWithMPNID = response.Data.HasSupportForResellersWithMPNID;
    });
    this._subscriptionArray.push(subscription);
  }


  createForm() {
    this.frmAddCustomer = this._fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      tenantId: ['', Validators.maxLength(50)],
      companyName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      addressCity: ['', Validators.required],
      addressCountry: [, Validators.required],
      addressState: [''],
      addressZip: [''],
    });
  }

  setFormValues(addCustomer: any) {
    this.frmAddCustomer.setValue({
      firstName: addCustomer.FirstName,
      lastName: addCustomer.LastName,
      tenantId: addCustomer.TenantId,
      companyName: addCustomer.CompanyName,
      email: addCustomer.Email,
      phoneNumber: addCustomer.PhoneNumber,
      addressLine1: addCustomer.Address.Line1,
      addressLine2: addCustomer.Address.Line2,
      addressCity: addCustomer.Address.City,
      addressCountry: addCustomer.Address.Country,
      addressState: addCustomer.Address.State,
      addressZip: addCustomer.Address.Zip,
    });
    this._cdRef.detectChanges();
  }

  getFormData() {
    let {
      firstName,
      lastName,
     //middleName,
      tenantId,
      companyName,
      email,
      phoneNumber,
      addressLine1,
      addressLine2,
      addressCity,
      addressCountry,
      addressState,
      addressZip,
    } = this.frmAddCustomer.value


    this.addCustomerModel.FirstName = firstName;
    this.addCustomerModel.LastName = lastName;
    //this.addCustomerModel.MiddleName = middleName;
    //this.addCustomerModel.OrganizationRegistrationNumber = organizationRegistrationNumber;
    this.addCustomerModel.TenantId = tenantId;
    this.addCustomerModel.CompanyName = companyName;
    this.addCustomerModel.Email = email;
    this.addCustomerModel.PhoneNumber = phoneNumber;
    this.addCustomerModel.Address.Line1 = addressLine1;
    this.addCustomerModel.Address.Line2 = addressLine2;
    this.addCustomerModel.Address.City = addressCity;
    this.addCustomerModel.Address.Country = addressCountry;
    this.addCustomerModel.Address.State = addressState;
    this.addCustomerModel.Address.Zip = addressZip;
    // this.isCustomerConsentAcceptanceProvided = isCustomerConsentAcceptanceProvided;

  }

  setFormControlValue(controlName: string, value: any) {
    this.frmAddCustomer.get(controlName)?.setValue(value);
  }

   ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this._unsavedChangesService.setUnsavedChanges(false);
   }

}
