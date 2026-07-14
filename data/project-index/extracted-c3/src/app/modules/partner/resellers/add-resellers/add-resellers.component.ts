import { ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService} from '@ngx-translate/core';
import { Subject, catchError, of, takeUntil} from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { CountryData, CurrencyData, PlanData, StateApiResponse, StateData } from 'src/app/shared/models/customers.model';
import { emailValidator } from 'src/app/shared/validators/custom-validators';
import { SweetAlertOptions } from 'sweetalert2';
import { ResellersListingService } from 'src/app/modules/partner/resellers/services/resellers-listing.service';
import { OnBoardresellerApiResponse } from 'src/app/modules/partner/resellers/models/resellers.model';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { ToastService } from 'src/app/services/toast.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-add-resellers',
  templateUrl: './add-resellers.component.html',
  styleUrl: './add-resellers.component.scss'
})
export class AddResellersComponent extends C3BaseComponent implements OnInit, OnDestroy {
  resellerRegisterForm: FormGroup;
  plansData: PlanData[];
  entityName: string | null;
  recordId: string | null;
  supportedCurrenciesData: CurrencyData[];
  countriesData: CountryData[];
  statesData: StateData[];
  successMsg: string;
  isStateDataAvailable: boolean = false;
  emailExists: boolean = false;
  impersonator: string = '';
  hasSupportForResellersWithMPNID: string = 'No'; 

  swalOptions: SweetAlertOptions = {
    buttonsStyling: false,
  };
  isSubmitted: boolean = false;
  Permissions = {
    HasGetResellers: true,
    HasSaveReseller: true
  };
  EmailAddressIsAlredyExistMessage: any;

  constructor(
    private _formBuilder: FormBuilder,
    private _customerListingService: CustomersListingService,
    private _cdref: ChangeDetectorRef,
    private _unsavedChangesService: UnsavedChangesService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    private _ResellersListingService: ResellersListingService,
    private _notifierService: NotifierService,
    public pageInfo: PageInfoService,
    router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private _toastService: ToastService,
    private _appService: AppSettingsService,
  ) {
    super(permissionService, dynamicTemplateService, router, _appService)


    // Initialize the customer registration form with validation

    this.resellerRegisterForm = this._formBuilder.group({
      name: ['', Validators.required],
      companyName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, emailValidator()]],
      phoneNumber: ['', Validators.required],
      addressOne: ['', [Validators.required, Validators.maxLength(250)]],
      addressTwo: ['', Validators.maxLength(250)],
      city: ['', Validators.required],
      country: ['', Validators.required],
      state: ['',],
      zip: ['', Validators.required],
    });
  }

  // Lifecycle hook to run initialization code

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'RESELLER_BREADCRUMB_BUTTON_TEXT_RESELLER', 'RESELLER_CAPTION_TEXT_ADD_RESELLER']);
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.RESELLER_CAPTION_TEXT_ADD_RESELLER"), true);
    this.setupFormListeners();
    this.getApplicationData();
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    if (this.entityName) {
      const subscription = this._customerListingService.getCountires().pipe(takeUntil(this.destroy$)).subscribe(countriesData => {
        this.countriesData = countriesData?.Data || [];
        this._cdref.detectChanges();
      });
      this._subscriptionArray.push(subscription);
    }

    this.resellerRegisterForm.get('country')?.valueChanges.subscribe(() => {
        const stateControl = this.resellerRegisterForm.get('state');
        const isRequired = this.statesData?.[0]?.IsStateProvinceMandatory;

        stateControl?.setValidators(isRequired ? [Validators.required] : []);
        stateControl?.updateValueAndValidity();
    });
  }

  // Submits the form and handles the form submission logic

  submitForm(): void {
    this.isSubmitted = true;
    this.resellerRegisterForm.markAllAsTouched();
    if (this.resellerRegisterForm.valid) {
      this._unsavedChangesService.setUnsavedChanges(false);
      this.saveReseller();
    }
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.hasSupportForResellersWithMPNID = response.Data.HasSupportForResellersWithMPNID;
    });
    this._subscriptionArray.push(subscription);
}

  // Fetches states data based on the selected country code

  getStatesByCountryCode(): void {
    this.resellerRegisterForm.controls['state'].setValue('');
    const stateControl = this.resellerRegisterForm.get('state');
    this.statesData = [];
    const countryCode = this.resellerRegisterForm.controls['country'].value;
    const subscription = this._commonService.getStateByCountryCode(countryCode).pipe(takeUntil(this.destroy$)).subscribe((data: Partial<StateApiResponse>) => {
      if (!!data && data?.Data && data?.Data.length > 0) {
        this.isStateDataAvailable = true;
        this.statesData = data.Data;
        const isRequired = this.statesData?.[0]?.IsStateProvinceMandatory;
        if (isRequired) {
            stateControl?.setValidators([Validators.required]);
        }
      } else {
        this.isStateDataAvailable = false;
        this.statesData = [];
        stateControl?.clearValidators();
      }
      stateControl?.updateValueAndValidity();
    });
    this._subscriptionArray.push(subscription);
  }

  // Creates the payload for the form submission

  createPayload(EntityName: string | null): any {
    const {
      name,
      companyName,
      firstName,
      lastName,
      email,
      country,
      addressOne,
      addressTwo,
      state,
      city,
      zip,
      phoneNumber,
    } = this.resellerRegisterForm.value;

    let params: any = {
      Name: name,
      CompanyName: companyName,
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      Phone: phoneNumber,
      AddressLine1: addressOne,
      Country: country,
      State: state,
      City: city,
      ZipCode: zip
    };

    if (addressTwo) {
      params.AddressLine2 = addressTwo;
    }

    return params;
  }
  saveReseller(): void {
    const payload = this.createPayload(this.entityName);
    const reqBody = {
      JsonPayload: JSON.stringify(payload),
      LoggedInUsername: this._commonService.loggedInUserName,
      Impersonator: this.impersonator,
    };
    const subscription = this._ResellersListingService.onBoardNewReseller(reqBody).pipe(takeUntil(this.destroy$)).subscribe(
      (data: Partial<OnBoardresellerApiResponse>) => {
        if (data.Status == 'Success') {
          this.successMsg = this._translateService.instant('TRANSLATE.RESELLERS_NOTIFICATION_ADDED_RESELLER_SUCCESSFULLY');
          this._notifierService.alert({ title: this.successMsg, icon: 'success' });
          this._router.navigate(['/partner/resellers']);
        }
      }
    );
    this._subscriptionArray.push(subscription);
  }

  setupFormListeners(): void {
    const subscription = this.resellerRegisterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.resellerRegisterForm.dirty) {
        this._unsavedChangesService.setUnsavedChanges(true);
      } else {
        this._unsavedChangesService.setUnsavedChanges(false);
      }
    });
    this._subscriptionArray.push(subscription);
    // this.resellerRegisterForm.get('email')?.valueChanges.subscribe(email => {
    //   this.validateEmail(email);
    // });
  }
  resetForm(): void {
    this.resellerRegisterForm.reset();
    this.isStateDataAvailable = false;
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  //TODO: Function e-mail availability need to be added
  validateEmail(): void {
    const email = this.resellerRegisterForm.controls['email'].value;
    if (email !== undefined && email !== "" && email !== null && email.length > 0) {
      const subscription = this._ResellersListingService.checkEmail(email, this.entityName, this.recordId).pipe(
        catchError((err) => {
          if (err?.error?.ErrorMessage != null && err?.error?.ErrorMessage === 'ERROR_MESSAGE_NOTIFICATION_EMAIL_ALREADY_EXISTS') {
            let errorMessage = this._translateService.instant("TRANSLATE.ERROR_MESSAGE_NOTIFICATION_EMAIL_ALREADY_EXISTS");
            this._toastService.error(errorMessage);
            this.resellerRegisterForm.controls['email'].setValue('');
            this.resellerRegisterForm.get('email')?.setErrors({ emailExists: true });
          }
          else {
            if (err?.error?.ErrorMessage) {
              let errorMessage = 'TRANSLATE.' + err?.error?.ErrorMessage;
              this._toastService.error(this._translateService.instant(errorMessage));
            }
          }
          this._cdref.detectChanges();
          return of(null);
        }))
        .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Status == "Success") {
            if (!response.Data) {

            }
          }
        });
        this._subscriptionArray.push(subscription);
    }
  }

  cancelFormChanges() {
    this.resellerRegisterForm.reset();
    this.isStateDataAvailable = false;
    this._router.navigate(['/partner/resellers']);
  }

  // Lifecycle hook to clean up resources
  ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this._subscription) {
      this._unsavedChangesService.setUnsavedChanges(false);
    }
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  backToList() {
    let callback = () => {
      this._router.navigate(['partner/resellers']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.resellerRegisterForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
}

