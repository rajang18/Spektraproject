import { ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CommonService } from 'src/app/services/common.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CountryData, CurrencyData, OnBoardCustomerApiResponse, PlanData, StateApiResponse, StateData } from 'src/app/shared/models/customers.model';
import { emailValidator } from 'src/app/shared/validators/custom-validators';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
    selector: 'app-add-customer',
    templateUrl: './add-customer.component.html',
    styleUrl: './add-customer.component.scss'
})
export class AddCustomerComponent extends C3BaseComponent implements OnInit, OnDestroy {
    customerRegisterForm: FormGroup;
    entityName: string | null;
    plansData: PlanData[];
    supportedCurrenciesData: CurrencyData[];
    countriesData: CountryData[];
    statesData: StateData[];
    successMsg: string;
    isStateDataAvailable: boolean = false;
    addCustomerModel: any;
    thisEmailAddressIsAlredyExistMessage: any;


    constructor(
        private _formBuilder: FormBuilder,
        private _customerListingService: CustomersListingService,
        private _cdref: ChangeDetectorRef,
        private _unsavedChangesService: UnsavedChangesService,
        public _translateService: TranslateService,
        private _commonService: CommonService,
        private _notifierService: NotifierService,
        public _router: Router,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService,
        public pageInfo: PageInfoService,
        private _toastService: ToastService,
        private _appService: AppSettingsService,


    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        // Initialize the customer registration form with validation

        this.customerRegisterForm = this._formBuilder.group({
            plan: ['', Validators.required],
            customerCurrencyCode: ['', Validators.required],
            companyName: ['', Validators.required],
            firstName: ['', [Validators.required,  Validators.minLength(3), Validators.maxLength(50)]],
            lastName: ['', [Validators.required,  Validators.minLength(3), Validators.maxLength(50)]],
            email: ['', [Validators.required, emailValidator()]],
            phoneNumber: ['',],
            checkbox1: ['',],
            checkbox2: [{ value: '', disabled: true }],
            addressOne: ['', [Validators.required, Validators.maxLength(250)]],
            addressTwo: ['', Validators.maxLength(250)],
            city: ['', Validators.required],
            country: [null, Validators.required],
            state: ['',],
            zip: ['', Validators.required],
        });

    }

    // Lifecycle hook to run initialization code

    ngOnInit(): void {
        this.setupFormListeners();
        this.entityName = this._commonService.entityName;
        if (this.entityName) {
            const subscription = forkJoin([
                this._customerListingService.getPlansForCustomers(),
                this._customerListingService.getSupportedCurrencies(this._commonService.entityName),
                this._customerListingService.getCountires(),
            ]).pipe(takeUntil(this.destroy$)).subscribe(([plansData, supportedCurrenciesData, countriesData]) => {
                this.plansData = plansData?.Data || [];
                this.supportedCurrenciesData = supportedCurrenciesData?.Data || [];
                this.countriesData = countriesData?.Data || [];
                this._cdref.detectChanges();
            });
            this._subscriptionArray.push(subscription);
        }

        this.pageInfo.updateTitle(this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_BUTTON_TEXT_ADD_CUSTOMER'), true);
        if (this._commonService.entityName === 'Reseller') {
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS']);
        }
        else if (this._commonService.entityName === 'Partner') {
            this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS', 'CUSTOMER_SUBSCRIPTIONS_BUTTON_TEXT_ADD_CUSTOMER']);
        }

        this.customerRegisterForm.get('country')?.valueChanges.subscribe(() => {
            const stateControl = this.customerRegisterForm.get('state');
            const isRequired = this.statesData?.[0]?.IsStateProvinceMandatory;

            stateControl?.setValidators(isRequired ? [Validators.required] : []);
            stateControl?.updateValueAndValidity();
        });
    }

    searchFn = (term: string, countriesData: any) => {
        return countriesData.Name.toLowerCase().startsWith(term.toLowerCase());
    };

    searchStateFn = (term: string, statesData: any) => {
        return statesData.Name.toLowerCase().startsWith(term.toLowerCase());
    };

    // Submits the form and handles the form submission logic

    submitForm(): void {
        this.customerRegisterForm.markAllAsTouched();
        if (this.customerRegisterForm.valid) {
            this._unsavedChangesService.setUnsavedChanges(false);
            this.createPayload(this._commonService.entityName);
        }
    }

    // Sets up form listeners for various form controls

    setupFormListeners(): void {
        const subscription = this.customerRegisterForm?.get('checkbox1')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(checked => {
            if (checked) {
                this.customerRegisterForm?.get('checkbox2')?.enable();
            } else {
                this.customerRegisterForm?.get('checkbox2')?.disable();
                this.customerRegisterForm.patchValue({ checkbox2: false });
            }
        });

        this._subscriptionArray.push(subscription);
    }

    // Fetches states data based on the selected country code

    getStatesByCountryCode(): void {
        this.customerRegisterForm.controls['state'].setValue('');
        const stateControl = this.customerRegisterForm.get('state');
        this.statesData = [];
        const countryCode = this.customerRegisterForm.controls['country'].value;
        const subscription = this._customerListingService.getStateByCountryCode(countryCode).pipe(takeUntil(this.destroy$)).subscribe((data: Partial<StateApiResponse>) => {
            if (!!data && data?.Data && data?.Data.length > 0) {
                this.isStateDataAvailable = true;
                this.statesData = data.Data;
                const isRequired = this.statesData?.[0]?.IsStateProvinceMandatory;
                if (isRequired) {
                    stateControl?.setValidators([Validators.required]);
                } else {
                    stateControl?.clearValidators();
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

    createPayload(EntityName: string | null): void {
        const {
            plan,
            companyName,
            customerCurrencyCode,
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
            checkbox2,
            checkbox1
        } = this.customerRegisterForm.value;
        let params: any = {
            EntityName: EntityName,
            RecordId: this._commonService.recordId,
            PlanIds: plan,
            CompanyName: companyName,
            CustomerCurrencyCode: customerCurrencyCode,
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            AddEmailAsCustomerAdmin: checkbox1,
            C3ResellerId: null,
            CustomerAddress: {
                Country: country,
                State: state,
                Line1: addressOne,
                City: city,
                Zip: zip
            },
        };

        if (phoneNumber) {
            params.PhoneNumber = phoneNumber;
        }
        if (checkbox2) {
            params.NotifyCustomer = checkbox2;
        }
        if (addressTwo) {
            params.CustomerAddress.Line2 = addressTwo;
        }
        const subscription = this._customerListingService.onBoardNewCustomer(params).pipe(takeUntil(this.destroy$)).subscribe(
            (data: Partial<OnBoardCustomerApiResponse>) => {
                if (data.Status == 'Success') {
                    this.successMsg = this._translateService.instant('TRANSLATE.CUSTOMERS_REGISTRATION_SUCCESS_WITH_OUT_EMAIL', { registeredemail: email });
                    this._notifierService.success({ title: this.successMsg }).then(() => {
                        this._router.navigate([`partner/customers`]);
                    })
                }
            }
        );
        this._subscriptionArray.push(subscription);
    }

    // Lifecycle hook to clean up resources

    ngOnDestroy(): void {
        super.ngOnDestroy();

        this._unsavedChangesService.setUnsavedChanges(false);
    }

    backToCustomers() {
        if (this.customerRegisterForm && !this.customerRegisterForm.pristine) {
            const message = this._translateService.instant(
                'TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT'
            );
            const btnok = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
            this._notifierService.confirm({
                title: message,
                icon: 'info',
                confirmButtonColor: '#49BA7C',
                customClass: {
                    confirmButton: 'bg-success'
                },
                confirmButtonText: btnok,
            }).then((result: { isConfirmed: any, isDismissed: any }) => {
                if (result.isConfirmed) {
                    localStorage.removeItem("customerNameForLinkCustomer")
                    localStorage.removeItem("customerC3IdForLinkCustomer")
                    this._router.navigate([`partner/customers`]);
                }
            })

        } else {
            localStorage.removeItem("customerNameForLinkCustomer")
            localStorage.removeItem("customerC3IdForLinkCustomer")
            this._router.navigate([`partner/customers`]);
        }
    }


    onEmailAddressChange() {
        let Email = this.customerRegisterForm.get('email').value;
        this.thisEmailAddressIsAlredyExistMessage = null;
        if (Email !== undefined && Email !== "" && Email !== null && Email.length > 0) {
            let email = Email;
            let requestFrom = "CustomerUser";

            if (localStorage.getItem("ResellerC3Id") !== undefined && localStorage.getItem("ResellerC3Id") !== null && localStorage.getItem("ResellerC3Id") !== "null") {
                requestFrom = "ResellerCustomerUser";
            }
            const subscription = this._commonService.canAddCustomer(email).pipe(takeUntil(this.destroy$)).subscribe({
                next: (response: any) => {
                    if (response.Status === "Success") {
                        if (!response.Data) {
                            this.thisEmailAddressIsAlredyExistMessage = this._translateService.instant('TRANSLATE.ERROR_MESSAGE_NOTIFICATION_EMAIL_ALREADY_EXISTS', { emailAddress: email });
                            this._toastService.error(this.thisEmailAddressIsAlredyExistMessage || '');
                            this.customerRegisterForm.get('email').setValue(null);
                            this.customerRegisterForm.get('email').updateValueAndValidity();
                        }
                    }
                },
                error: (error: any) => {
                    if (!error.Data) {
                        this.thisEmailAddressIsAlredyExistMessage = this._translateService.instant('TRANSLATE.ERROR_MESSAGE_NOTIFICATION_EMAIL_ALREADY_EXISTS', { emailAddress: email });
                        this._toastService.error(this.thisEmailAddressIsAlredyExistMessage || '');
                        this.customerRegisterForm.get('email').setValue(null);
                        this.customerRegisterForm.get('email').updateValueAndValidity();
                    }
                }

            }
            );
            this._subscriptionArray.push(subscription);
        }
    }
}
