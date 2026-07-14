import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import { Subject, Subscription, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { CustomerConsentService } from 'src/app/services/customer-consent.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { Entity } from 'src/app/shared/models/enums/enums';

@Component({
  selector: 'app-link-new-microsoft-customer',
  templateUrl: './link-new-microsoft-customer.component.html',
  styleUrl: './link-new-microsoft-customer.component.scss'
})
export class LinkNewMicrosoftCustomerComponent implements OnInit, OnDestroy {
  entityEnum: typeof Entity = Entity;
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
  considerNewMicrosoftCustomerAgreement:any;
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
    private _customerConsentService: CustomerConsentService,
  ) {
    this.entityName = _commonService.entityName;
    this.recordId = _commonService.recordId;
    let customerC3IdForLinkCustomer = localStorage.getItem("customerC3IdForLinkCustomer") ;
    this.createForm();
    if ( customerC3IdForLinkCustomer !== undefined && customerC3IdForLinkCustomer!== null && customerC3IdForLinkCustomer !== '') {
      this.customerC3Id = customerC3IdForLinkCustomer;
      this.getCustomerDetailsByC3Id();
    }

    let customerNameForLinkCustomer = localStorage.getItem("customerNameForLinkCustomer");

    if (customerNameForLinkCustomer !== undefined && customerNameForLinkCustomer !== null && customerNameForLinkCustomer !== '') {
      this.customerName = customerNameForLinkCustomer;
    }

    let providerIdForOnboard = localStorage.getItem("providerIdForOnboard");
    if (providerIdForOnboard !== undefined && providerIdForOnboard !== null && providerIdForOnboard !== '') {
      this.providerId = providerIdForOnboard;
    }

    let providerNameForOnboard= localStorage.getItem("providerNameForOnboard")
    if (providerNameForOnboard !== undefined && providerNameForOnboard !== null && providerNameForOnboard !== '') {
      this.providerName = localStorage.getItem("providerNameForOnboard");
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
    this.getCustomerAgreementURL();
    this.checkIfResellerIsLinkedWithProvider();
    this.checkLogicalResellerCanCreateProviderCustomer();
    this.getApplicationData();
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

        //Get country code by name
        if (this.countries !== null && this.countries?.length > 0 && this.addCustomerModel.Address.Country.length > 0) {
          let countryMatch = this.countries.filter((x: any) => x.Code == this.addCustomerModel.Address.Country);
          if (countryMatch != undefined && countryMatch != '' && countryMatch != null) {
            if (this.countryList.includes(countryMatch[0].Code)) {
              this.isOrganizationRegistrationNumberRequired = true;
              this.frmAddCustomer.get('organizationRegistrationNumber').setValidators(Validators.required);
            }
            else {
              this.isOrganizationRegistrationNumberRequired = false;
              this.frmAddCustomer.get('organizationRegistrationNumber').clearValidators();
            }
            this.frmAddCustomer.updateValueAndValidity();
          }
        }
        this._cdRef.detectChanges();
        this.onCountryChange(false);
      }
    });
    this._subscriptionArray.push(subscription);
  }

  getCountries() {
    this.countries = [];
    const subscription = this._commonService.getCountires().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.countries = response;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getCustomerAgreementURL() {
    this.customerConsentURL = null;
    const subscription = this._commonService.microsoftCustomerAgreementUrl().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customerConsentURL = response.Data.Value;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }
  //vm.getCustomerAgreementURL();

  onCountryChange(resetDetails = true) {
    this.getFormData()
    this.getStateProvincesByCountry(this.addCustomerModel.Address.Country, resetDetails);
    this.getCountryValidationRules(this.addCustomerModel.Address.Country, this.providerName);

    let countryMatch = (this.countries?.length > 0) ? this.countries?.filter((e: any) => e.Code == this.addCustomerModel.Address.Country) : null;
    if (countryMatch != undefined && countryMatch != '' && countryMatch != null) {
      if (this.countryList.includes(countryMatch[0].Code)) {
        this.isOrganizationRegistrationNumberRequired = true;
      }
      else {
        this.isOrganizationRegistrationNumberRequired = false;
      }
    }
    this._cdRef.detectChanges();
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
  }

  checkDomainAvialbility() {
    // startBlockUI();
    this.isChechingDomainAvailability = true;
    this.domain = "";
    this.getFormData();
    if (this.addCustomerModel.Domain !== undefined && this.addCustomerModel.Domain !== null && this.addCustomerModel.Domain.length > 0) {
      this.isDomainAvailble = null;
      const subscription = this._commonService.validateDomain(this.providerName, this.addCustomerModel.Domain).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === "Success" && response.Data !== null) {
          this.isDomainAvailble = response.Data;
          this.domain = this.addCustomerModel.Domain;
        }
        this.setFormControlValue('isCustomerConsentAcceptanceProvided', false);
        this.isChechingDomainAvailability = false;
        this._cdRef.detectChanges();
      },(error:any)=>{
        const errorObject = JSON.parse(error.error.ErrorMessage);
        const messageToPrint = errorObject.ErrorValue;
        this._toastService.error(this._translateService.instant('TRANSLATE.'+ messageToPrint));
      }
    );
    this._subscriptionArray.push(subscription);
    }
    else {
      this._toastService.error(this._translateService.instant('TRANSLATE.CUSTOMERS_DOMAIN_NAME_INVALID_PROMPT'));
    }

    if (this.addCustomerModel !== null && this.addCustomerModel.Address !== null && this.addCustomerModel.Address.Country !== null && (this.countryValidationRules === undefined || this.countryValidationRules === null || Object.keys(this.countryValidationRules).length === 0)) {
      this.getCountryValidationRules(this.addCustomerModel.Address.Country, this.providerName);
    }

  }


  getCountryValidationRules(countryCode: string | null, providerName: string | null) {
    //startBlockUI();
    this.countryValidationRules = {};
    const subscription = this._commonService.getAddressValidationRules(countryCode, providerName).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === "Success") {
        this.countryValidationRules = response.Data;
        if (this.countryValidationRules?.PhoneNumberRegex !== null && this.countryValidationRules?.PhoneNumberRegex !== undefined && this.countryValidationRules?.PhoneNumberRegex !== '') {
          this.frmAddCustomer.get('phoneNumber').setValidators(Validators.pattern(this.countryValidationRules.PhoneNumberRegex));   
        }
        else{
            this.frmAddCustomer.get('phoneNumber').clearValidators();
        }
        if (this.countryValidationRules?.IsStateRequired) {
          this.frmAddCustomer.get('addressState').setValidators(Validators.required);
        }
         else {
           this.frmAddCustomer.get('addressState').clearValidators();
        }
        if (this.countryValidationRules?.IsPostalCodeRequired) {
          this.frmAddCustomer.get('addressZip').setValidators([Validators.required, Validators.pattern(this.countryValidationRules.PostalCodeRegex)]);
        }
        else {
          this.frmAddCustomer.get('addressZip').clearValidators();
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
    this.getFormData();

    if (!this.frmAddCustomer.valid) {
      let message = this._translateService.instant('TRANSLATE.ERROR_FORM_VALIDATION_FAILED');
      this._toastService.error(this._translateService.instant(message));
    }
    else if (!this.isCustomerConsentAcceptanceProvided && this.considerNewMicrosoftCustomerAgreement === 'No'){
      let message = this._translateService.instant('TRANSLATE.ERROR_PLEASE_CONFIRM_THE_CUSTOMER_ACCEPTANCE_OF_MICROSOFT_CUSTOMER_AGREEMENT');
      this._toastService.error(this._translateService.instant(message));
    }

    else {
      //startBlockUI();
      let postData: any = {
        C3CustomerID: this.customerC3Id,
        ProviderId: this.providerId,
        ProviderCustomer: this.addCustomerModel,
        EntityName: this._commonService.entityName,
        RecordId: this._commonService.recordId,
        IsCustomerConsentProvided: this.isCustomerConsentAcceptanceProvided,
        ProviderName: this.providerName
      };

      const subscription = this._customerService.createNewCustomerInProvider(postData).pipe(takeUntil(this.destroy$)).subscribe({
        next: ((response: any) => {
          if (response.Status === "Success") {
            if (response.Data.AssignDelegatedAdminRelationshipAccessSucceeded) {
              let message = this._translateService.instant('TRANSLATE.CUSTOMERS_REGISTRATION_SUCCESS_WITH_EMAIL_AND_PASSWORD_RESET', {
                userId: response.Data.UserEmail, password: response.Data.Password
              });
              this._notifierService.alert({ title: message, icon: 'info' });
            }
            else {
              let message = this._translateService.instant('TRANSLATE.CUSTOMERS_REGISTRATION_SUCCESS_WITH_EMAIL_AND_PASSWORD_RESET_WITH_GDAP_ERROR', {
                userId: response.Data.UserEmail, password: response.Data.Password
              });
              this._notifierService.alert({ title: message, icon: 'success' });
            }
            this.frmAddCustomer.reset();
            this._router.navigate(['partner/customers']);
            //$state.go("partner.customers", { UseCachedFilters: true });
          }
          //stopBlockUI();
        }),
        error:
          ((error: any) => {
            const errorMessage = this._translateService.instant('TRANSLATE.' + error.error.ErrorMessage); 
            const attributeKey = this._translateService.instant('TRANSLATE.' + error.error.Data[0].AtributeKey); 
            const value = error.error.Data[0].Value; 
            const translatedMessage = `${errorMessage} ${attributeKey}: ${value}`;
      
          this._toastService.error(translatedMessage);           
          this.failedDomain = this.addCustomerModel.Domain;
          this._cdRef.detectChanges();
          })
      });
      this._subscriptionArray.push(subscription);
    }
  }

  cancelAddCustomer() {
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

  checkIfResellerIsLinkedWithProvider() {
    if (this._commonService.entityName === 'Reseller' && (this._commonService.recordId !== undefined && this._commonService.recordId !== null && this._commonService.recordId !== '')) {
      const subscription = this._customerService.checkIfResellerHasLinkWithProvider().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === "Success") {
          this.canProceedForCreatingNewProviderTenant = response.Data;
        }
      });
      this._subscriptionArray.push(subscription);
    }
    else {
      this.canProceedForCreatingNewProviderTenant = false;
    }
    this._cdRef.detectChanges();
  }

  checkLogicalResellerCanCreateProviderCustomer() {
    if (this._commonService.entityName === 'Reseller' && (this._commonService.recordId !== undefined && this._commonService.recordId !== null && this._commonService.recordId !== '')) {
      const subscription = this._customerService.checkLogicalResellerCanCreateProviderCustomer().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === "Success") {
          this.canLogicalResellerProceedForCreatingNewProviderTenant = response.Data;
        }
      });
      this._subscriptionArray.push(subscription);
    }
    else {
      this.canLogicalResellerProceedForCreatingNewProviderTenant = false;
    }
    this._cdRef.detectChanges();
  }

  customerConsentClick() {
    window.open(this.customerConsentURL, "_blank");
  }

  onCustomerConsentIsAcceptedChange() {
    this.getFormData();
    if (this.isCustomerConsentAcceptanceProvided) {
      this.maxConsentDate = new Date();
      this.customerConsentAcceptanceDate = this.localTimeConvert(new Date());
    }
  }

  localTimeConvert(date: any) {
    let localDate = moment.utc(date).toDate();
    return moment(localDate).local().toDate();
  }

  getApplicationData() {
    const subscription = this._appSettingService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.hasSupportForResellersWithMPNID = response.Data.HasSupportForResellersWithMPNID;
      this.considerNewMicrosoftCustomerAgreement = response.Data.ConsiderNewMicrosoftCustomerAgreement;
    });
    this._subscriptionArray.push(subscription);
  }


  createForm() {
    this.frmAddCustomer = this._fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      middleName: ['', Validators.maxLength(50)],
      organizationRegistrationNumber: [''],
      companyName: ['', [Validators.required, Validators.maxLength(50)]],
      domain: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      addressCity: ['', Validators.required],
      addressCountry: [, Validators.required],
      addressState: [''],
      addressZip: [''],
      isCustomerConsentAcceptanceProvided: [false]
    });
  }

  setFormValues(addCustomer: any) {
    this.frmAddCustomer.setValue({
      firstName: addCustomer.FirstName,
      lastName: addCustomer.LastName,
      middleName: addCustomer.MiddleName,
      organizationRegistrationNumber: addCustomer.OrganizationRegistrationNumber,
      companyName: addCustomer.CompanyName,
      domain: addCustomer.Domain,
      email: addCustomer.Email,
      phoneNumber: addCustomer.PhoneNumber,
      addressLine1: addCustomer.Address.Line1,
      addressLine2: addCustomer.Address.Line2,
      addressCity: addCustomer.Address.City,
      addressCountry: addCustomer.Address.Country,
      addressState: addCustomer.Address.State,
      addressZip: addCustomer.Address.Zip,
      isCustomerConsentAcceptanceProvided: false
    });
    this._cdRef.detectChanges();
  }

  getFormData() {
    let {
      firstName,
      lastName,
      middleName,
      organizationRegistrationNumber,
      companyName,
      domain,
      email,
      phoneNumber,
      addressLine1,
      addressLine2,
      addressCity,
      addressCountry,
      addressState,
      addressZip,
      isCustomerConsentAcceptanceProvided
    } = this.frmAddCustomer.value


    this.addCustomerModel.FirstName = firstName;
    this.addCustomerModel.LastName = lastName;
    this.addCustomerModel.MiddleName = middleName;
    this.addCustomerModel.OrganizationRegistrationNumber = organizationRegistrationNumber;
    this.addCustomerModel.CompanyName = companyName;
    this.addCustomerModel.Domain = domain;
    this.addCustomerModel.Email = email;
    this.addCustomerModel.PhoneNumber = phoneNumber;
    this.addCustomerModel.Address.Line1 = addressLine1;
    this.addCustomerModel.Address.Line2 = addressLine2;
    this.addCustomerModel.Address.City = addressCity;
    this.addCustomerModel.Address.Country = addressCountry;
    this.addCustomerModel.Address.State = addressState;
    this.addCustomerModel.Address.Zip = addressZip;
    this.isCustomerConsentAcceptanceProvided = isCustomerConsentAcceptanceProvided;

  }

  setFormControlValue(controlName: string, value: any) {
    this.frmAddCustomer.get(controlName)?.setValue(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
    this.frmAddCustomer.reset();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
