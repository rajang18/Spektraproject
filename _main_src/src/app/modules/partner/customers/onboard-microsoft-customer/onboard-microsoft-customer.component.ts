import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, of, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { CustomerOnboardService } from 'src/app/services/customer-onboard.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { DataSharingModel, EVENT_TYPE } from 'src/app/shared/models/common';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/report-popup.model';

@Component({
  selector: 'app-onboard-microsoft-customer',
  templateUrl: './onboard-microsoft-customer.component.html',
  styleUrls: ['./onboard-microsoft-customer.component.scss'],
})
export class OnboardMicrosoftCustomerComponent implements OnInit, OnDestroy {
  customerC3Id: string | null = null;
  customerName: string | null = null;
  onboardCustomerModel: any = {};
  resellerC3Id: string | null;
  countryList = [
    'TH',
    'VN',
    'TR',
    'PL',
    'ZA',
    'IN',
    'BR',
    'IQ',
    'MM',
    'SS',
    'SA',
    'AE',
    'AM',
    'AZ',
    'BY',
    'HU',
    'KZ',
    'KG',
    'MD',
    'TJ',
    'UA',
    'UZ',
  ];
  lookingUpCustomerDetails: boolean;
  customerLookUpError: null;
  providerCustomer: any = {};
  selectedCurrencyCode: any = null;
  selectedPlan: null;
  thisEmailAddressIsAlredyExistMessage: string = '';

  pageVisibleList: any = [];
  isOrganizationRegistrationNumberRequired: boolean;
  loadingPlans: boolean;
  plansWithStatusAsSuccess: any[];
  plans: any;
  private destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  @ViewChild('collectCustomerDetailsRef')
  collectCustomerDetailsRef: TemplateRef<any>;
  collectCustomerDetailsModalRef: NgbModalRef;

  /* Form */
  formGroup: FormGroup = new FormGroup({});
  formGroupCustomerBasicDetails: FormGroup = new FormGroup({});
  formGroupCustomerOnboardingPlans: FormGroup = new FormGroup({});
  formGroupCustomerDetails: FormGroup = new FormGroup({});

  subscriptionsList: any[] = [];
  subscriptionVarificationModel: any[] = [];
  loadingSubscriptions: boolean;
  tempSubscriptionList: any;
  isProductSharable: any = false;
  nonOnboardedCustomers: any[] | null = [];
  partnerSupportedCurrencies: readonly any[] | null;
  stateProvinces: any[] = [];
  countryValidationRules: any;
  customerLookUpStatus: any[] = [];
  selectedProviderCustomer: null;
  canProceedForOnboardingResellerCustomer: any;
  loadingCSPCustomers: boolean;
  notMappedSubscriptions: any;
  entityName: string | null;
  recordId: string | null;
  hasSupportForResellersWithMPNID: string = 'Yes'; //$rootScope.SelectedResellerSettings.HasSupportForResellersWithMPNID;
  selectedCustomer: any;
  activeBillingProvider: any;
  bufferSize = 10;
  filterednonOnboardedCustomers: any[] | null = [];
  searchCustomer = new Subject<string>();
  forms: { [key: string]: FormGroup } = {
    formGroupCustomerBasicDetails: this.formGroupCustomerBasicDetails,
    formGroupCustomerOnboardingPlans: this.formGroupCustomerOnboardingPlans,
    formGroupCustomerDetails: this.formGroupCustomerDetails,
    formGroup: this.formGroup,
    // Add other forms here
  };

  constructor(
    private _fb: FormBuilder,
    private _customerService: CustomersListingService,
    private _translateService: TranslateService,
    private _toastService: ToastService,
    private _commonService: CommonService,
    private _appSettingService: AppSettingsService,
    public _router: Router,
    private _modalService: NgbModal,
    private _cdRef: ChangeDetectorRef,
    private _onboardService: CustomerOnboardService,
    private _notifierService: NotifierService,
    private _unsavedChangesService: UnsavedChangesService,
    public _pageInfo: PageInfoService
  ) {
    this.entityName = _commonService.entityName;
    this.recordId = _commonService.recordId;
    this.pageVisibleList.push('BasicDetails');

    this.formGroupCustomerBasicDetails = _fb.group({
      selectedProviderCustomer: [],
      providerCustomerId: [''],
    });
    this.formGroupCustomerOnboardingPlans = _fb.group({
      selectedCurrencyCode: [null],
      selectedPlan: [null],
      isProductSharable: [false],
    });
    this.formGroupCustomerDetails = _fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      middleName: [''],
      organizationRegistrationNumber: [{ value: '', disabled: true }],
      email: ['', [Validators.required, Validators.email]],
      addEmailAsCustomerAdmin: [false],
      notifyCustomer: [false],
      phoneNumber: [''],
      addressLine1: ['', [Validators.required, Validators.maxLength(250)]],
      addressLine2: ['', Validators.maxLength(250)],
      addressCity: ['', Validators.required],
      addressState: [''],
      addressZip: [''],
    });

    let providerIdForOnboard = localStorage.getItem('providerIdForOnboard');

    if (
      providerIdForOnboard === undefined ||
      providerIdForOnboard === null ||
      providerIdForOnboard === ''
    ) {
      _router.navigate(['partner/customers/onboardcustomer']);
    }

    let customerC3IdForLinkCustomer = localStorage.getItem(
      'customerC3IdForLinkCustomer'
    );
    if (
      customerC3IdForLinkCustomer !== undefined &&
      customerC3IdForLinkCustomer !== null &&
      customerC3IdForLinkCustomer !== ''
    ) {
      this.customerC3Id = localStorage.getItem('customerC3IdForLinkCustomer');
    }

    let customerNameForLinkCustomer = localStorage.getItem(
      'customerNameForLinkCustomer'
    );
    if (
      customerNameForLinkCustomer !== undefined &&
      customerNameForLinkCustomer !== null &&
      customerNameForLinkCustomer !== ''
    ) {
      this.customerName = localStorage.getItem('customerNameForLinkCustomer');
    }

    if (
      providerIdForOnboard !== undefined &&
      providerIdForOnboard !== null &&
      providerIdForOnboard !== ''
    ) {
      this.onboardCustomerModel.ProviderId = localStorage.getItem(
        'providerIdForOnboard'
      );
    }

    let providerNameForOnboard = localStorage.getItem('providerNameForOnboard');
    if (
      providerNameForOnboard !== undefined &&
      providerNameForOnboard !== null &&
      providerNameForOnboard !== ''
    ) {
      this.onboardCustomerModel.ProviderName = localStorage.getItem(
        'providerNameForOnboard'
      );
    }

    let resellerC3Id = localStorage.getItem('ResellerC3Id');
    if (
      resellerC3Id !== undefined &&
      resellerC3Id !== null &&
      resellerC3Id !== '' &&
      resellerC3Id
    ) {
      this.resellerC3Id = localStorage.getItem('ResellerC3Id');
    }

    const subscription = _onboardService
      .receiveNotification()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        if (
          response.type ===
          EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_SUBSCRIPTION_DATA_CHANGE
        ) {
          this.subscriptionsList = [...response.data.SubscriptionList];
        }

        if (
          response.type ===
          EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_SKIP_PROVIDER_SUBSCRIPTION_FUNCTION
        ) {
          this.skipProviderSubscription(response.data.Product);
        }

        if (
          response.type ===
          EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_TAKE_PROVIDER_SUBSCRIPTION_FUNCTION
        ) {
          this.takeOnProviderSubscription(response.data.Product);
        }

        if (
          response.type ===
          EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_COLLECT_CUSTOMER_DETAILS_FUNCTION
        ) {
          this.subscriptionsList = [...response.data.SubscriptionList];
          this.collectCustomerDetails();
        }
      });
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {
    const subscription = this._appSettingService
      .getApplicationData()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        this.hasSupportForResellersWithMPNID =
          response.Data.HasSupportForResellersWithMPNID;
      });

    if (this._commonService.entityName === 'Partner') {
      this.getNonOnboardedCustomers();
    }

    this.getActiveBillingProvider();
    this.getPartnerSupportedCurrencies();
    this.checkIfResellerIsLinkedWithProvider();
    let customerType = localStorage.getItem('customerType');
    if (this.customerName && !customerType) {
      let title = this._translateService.instant(
        'TRANSLATE.SERVICE_PROVIDER_TENANT_HEADER'
      );
      title = title + ` <span class="text-primary">${this.customerName}</span>`;
      this._pageInfo.updateTitle(title, true);
      if (this._commonService.entityName === 'Reseller') {
        this._pageInfo.updateBreadcrumbs([
          'SIDEBAR_TITLE_MENUS_SELL',
          'PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE',
        ]);
      } else if (this._commonService.entityName === 'Partner') {
        this._pageInfo.updateBreadcrumbs([
          'MENUS_SELL_DIRECT',
          'PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE',
          'SERVICE_PROVIDER_TENANT',
          'DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER',
        ]);
      }
    } else if (this.customerName && customerType) {
      let title = this._translateService.instant(
        'TRANSLATE.LINK_CUSTOMER_HEADER_TEXT'
      );
      title = title + ` <span class="text-primary">${this.customerName}</span>`;
      this._pageInfo.updateTitle(title, true);
      if (this._commonService.entityName === 'Reseller') {
        this._pageInfo.updateBreadcrumbs([
          'SIDEBAR_TITLE_MENUS_SELL',
          'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS',
          'SERVICE_PROVIDER_TENANT',
          'DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER',
        ]);
      } else if (this._commonService.entityName === 'Partner') {
        this._pageInfo.updateBreadcrumbs([
          'MENUS_SELL_DIRECT',
          'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS',
          'SERVICE_PROVIDER_TENANT',
          'DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER',
        ]);
      }
    } else {
      this._pageInfo.updateTitle(
        this._translateService.instant(
          'TRANSLATE.CUSTOMER_SUBSCRIPTIONS_BUTTON_TEXT_ONBOARD_CUSTOMER'
        ),
        true
      );
      if (this._commonService.entityName === 'Reseller') {
        this._pageInfo.updateBreadcrumbs([
          'SIDEBAR_TITLE_MENUS_SELL',
          'PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE',
        ]);
      } else if (this._commonService.entityName === 'Partner') {
        this._pageInfo.updateBreadcrumbs([
          'MENUS_SELL_DIRECT',
          'PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE',
        ]);
      }
    }
    this._subscriptionArray.push(subscription);
  }

  selectNonOnboardedCustomer() {
    //startBlockUI();
    this.selectedCustomer = this.getFormControlValue(
      this.formGroupCustomerBasicDetails,
      'selectedProviderCustomer'
    ); //$select.selected;
    this.onboardCustomerModel.ProviderCustomerId =
      this.selectedCustomer.TenantId;
    this.lookUpCustomerDetails();
  }

  getActiveBillingProvider() {
    const subscription = this._commonService
      .getActiveBillingProvider(null)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        if (response.Status === 'Success' && response.Data !== null) {
          this.activeBillingProvider = response.Data.Name;
        }
      });
    this._subscriptionArray.push(subscription);
  }

  /*Getting partner supported currencies*/
  getPartnerSupportedCurrencies() {
    const subscription = this._commonService
      .getSupportedCurrencies()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        this.partnerSupportedCurrencies = response.Data;
      });
    this._subscriptionArray.push(subscription);
  }

  lookUpCustomerDetails() {
    this.formGroupCustomerDetails.reset();
    this.getCustomerBasicDetails();

    this.lookingUpCustomerDetails = true;
    this.customerLookUpError = null;
    this.providerCustomer = {};
    this.selectedCurrencyCode = null;
    this.selectedPlan = null;
    this.onboardCustomerModel.PlanIds = null;
    this.onboardCustomerModel.CustomerCurrencyCode = null;
    this.onboardCustomerModel.AddEmailAsCustomerAdmin = false;
    this.onboardCustomerModel.NotifyCustomer = false;
    //this.frmCustomerBasicDetails.$submitted = true;
    this.thisEmailAddressIsAlredyExistMessage = '';
    if (this.formGroupCustomerBasicDetails.valid) {
      let planDetailsIndex = this.pageVisibleList.indexOf('PlanDetails');
      if (planDetailsIndex >= 0) {
        this.pageVisibleList.splice(planDetailsIndex, 1);
      }

      let customerDetailsIndex =
        this.pageVisibleList.indexOf('CustomerDetails');
      if (customerDetailsIndex >= 0) {
        this.pageVisibleList.splice(customerDetailsIndex, 1);
      }
      this._cdRef.detectChanges();
      const subscription = this._customerService
        .getProviderCustomer(
          this.onboardCustomerModel.ProviderCustomerId,
          this.onboardCustomerModel.ProviderName
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe((response: any) => {
          if (response.Status === 'Success') {
            this.providerCustomer = response.Data;
            if (
              this.providerCustomer !== undefined &&
              this.providerCustomer !== null
            ) {
              this.getStateProvincesByCountry(
                this.providerCustomer.Address.Country
              );
              if (
                this.providerCustomer.Address.Country != undefined &&
                this.providerCustomer.Address.Country != '' &&
                this.providerCustomer.Address.Country != null
              ) {
                if (
                  this.countryList.includes(
                    this.providerCustomer.Address.Country
                  )
                ) {
                  this.isOrganizationRegistrationNumberRequired = true;
                } else {
                  this.isOrganizationRegistrationNumberRequired = false;
                }
              }

              this.setFormValues(this.providerCustomer);
              this._cdRef.detectChanges();
              this.proceedToOnboard();
              this.lookingUpCustomerDetails = false;
              //stopBlockUI();
            }
          } else if (response.Status === 'Error') {
            this.lookingUpCustomerDetails = false;
            //stopBlockUI();
            this._toastService.error(
              this._translateService.instant(
                'TRANSLATE.' + response.ErrorMessage
              )
            );
          } else {
            this.lookingUpCustomerDetails = false;
            //stopBlockUI();
          }
          this._cdRef.detectChanges();
        });
      this._subscriptionArray.push(subscription);
    }
  }

  proceedToOnboard() {
    if (this.customerC3Id === null) {
      this.getPlans();
    } else {
      //this.block.start();
      this.mapProductsAgainstPlan();
      this.pageVisibleList.push('PlanDetails');
    }
  }

  getPlans() {
    this.loadingPlans = true;
    this.plansWithStatusAsSuccess = [];
    const subscription = this._commonService
      .getPlans(1, 5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        if (response.Status === 'Success') {
          this.plans = response.Data;
          this.plansWithStatusAsSuccess = this.plans.filter((plan: any) => plan.PlanStatus === 'Success');
          this.plans = this.plansWithStatusAsSuccess;
          this.pageVisibleList.push('PlanDetails');
          this.loadingPlans = false;
        } else {
          this.loadingPlans = false;
        }
        this._cdRef.detectChanges();
      });
    this._subscriptionArray.push(subscription);
  }

  onPlanChange() {
    this.onboardCustomerModel.PlanIds = this.getFormControlValue(
      this.formGroupCustomerOnboardingPlans,
      'selectedPlan'
    )?.ID; //$select.selected.ID;
    this.mapProductsAgainstPlan();
  }

  onCurrencyChange() {
    // startBlockUI();
    this.onboardCustomerModel.CustomerCurrencyCode = this.getFormControlValue(
      this.formGroupCustomerOnboardingPlans,
      'selectedCurrencyCode'
    )?.CurrencyCode; // $select.selected.CurrencyCode;
    this.mapProductsAgainstPlan();
  }

  mapProductsAgainstPlan() {
    let customerDetailsIndex = this.pageVisibleList.indexOf('CustomerDetails');
    if (customerDetailsIndex >= 0) {
      this.pageVisibleList.splice(customerDetailsIndex, 1);
    }
    if (
      (this.onboardCustomerModel.CustomerCurrencyCode !== null &&
        this.onboardCustomerModel.CustomerCurrencyCode !== '' &&
        this.onboardCustomerModel.PlanIds !== null &&
        this.onboardCustomerModel.PlanIds !== '') ||
      this.customerC3Id !== null
    ) {
      this.subscriptionsList = [];
      this.subscriptionVarificationModel = [];
      this.loadingSubscriptions = true;
      this._cdRef.detectChanges();
      const subscription = this._customerService
        .getMatchingSubscriptionForOnboarding(
          this.onboardCustomerModel.ProviderName,
          this.onboardCustomerModel.ProviderCustomerId,
          this.onboardCustomerModel.PlanIds,
          this.onboardCustomerModel.CustomerCurrencyCode,
          this.customerC3Id
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response: any) => {
            if (response.Status === 'Success') {
              this.subscriptionsList = response.Data;

              this.subscriptionVarificationModel = this.subscriptionsList;
              this.subscriptionsList.forEach((subscription: any) => {
                subscription.MappingC3PlanProducts = JSON.parse(
                  subscription.MappingC3PlanProducts
                );
              });
              this.tempSubscriptionList = this.subscriptionsList;
              this.loadingSubscriptions = false;

              let data: any = {
                onboardCustomerModel: this.onboardCustomerModel,
                customerC3Id: this.customerC3Id,
                loadingSubscriptions: this.loadingSubscriptions,
                subscriptionsList: this.subscriptionsList,
                pageVisibleList: this.pageVisibleList,
              };
              let updateData: DataSharingModel = {
                type: EVENT_TYPE.EVENT_ONBOARD_UPDATE_DATA_TO_SHARED_NON_SHARED_CHILD,
                data: data,
              };
              this._onboardService.setDataForChildFromParent(updateData);
              this.defineProductSubscriptionType();
              this._cdRef.detectChanges();
            } else {
              this._toastService.error(
                this._translateService.instant('TRANSLATE.AN_ERROR_OCCURED')
              );
              this.loadingSubscriptions = false;
              //stopBlockUI();
            }
            this._subscriptionArray.push(subscription);
          },
          (err) => {
            this._toastService.error(
              this._translateService.instant('TRANSLATE.AN_ERROR_OCCURED')
            );
          }
        );
    } else {
      //stopBlockUI();
    }
  }

  collectCustomerDetails() {
    this.getRawFormData();
    let subscriptionList: any = [];
    subscriptionList = [...this.subscriptionsList];
    subscriptionList.forEach((subscription: any) => {
      subscription.MappingC3PlanProducts = JSON.stringify(
        subscription.MappingC3PlanProducts
      );
    });
    let postData = {
      C3CustomerID: this.customerC3Id,
      CustomerCurrencyCode: this.onboardCustomerModel.CustomerCurrencyCode,
      PlanIds: this.onboardCustomerModel.PlanIds,
      ProviderCustomer: this.providerCustomer,
      AddEmailAsCustomerAdmin:
        this.onboardCustomerModel.AddEmailAsCustomerAdmin,
      NotifyCustomer: this.onboardCustomerModel.NotifyCustomer,
      ProviderId: this.onboardCustomerModel.ProviderId,
      OnboardCustomerProviderSubscriptions: subscriptionList,
      IsProductsSharable: this.isProductSharable,
    };
    const subscription = this._customerService
      .validateCustomerSubscriptionMappings(postData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        let validateCustomerSubscriptionresponse = response.Data;
        if (
          response.Status === 'Success' &&
          validateCustomerSubscriptionresponse.length === 0
        ) {
          this.notMappedSubscriptions = this.subscriptionsList.filter(
            (subscription: any) => {
              if (
                (subscription.MappedC3PlanProductId === undefined ||
                  subscription.MappedC3PlanProductId === null ||
                  subscription.MappedC3PlanProductId === '') &&
                !subscription.IgnoredProduct
              ) {
                return subscription;
              }
            }
          );

          if (this.notMappedSubscriptions.length > 0) {
            let modalConfig: NgbModalOptions = {
              modalDialogClass: MODAL_DIALOG_CLASS,
            };

            this.collectCustomerDetailsModalRef = this._modalService.open(
              this.collectCustomerDetailsRef,
              {
                backdrop: 'static',
                keyboard: false,
                size: 'lg',
              }
            );
            //this._cdRef.detectChanges();
            this.collectCustomerDetailsModalRef.result.then(
              (result) => {
                if (result === 'proceed') {
                  this.getCountryValidationRules(
                    this.providerCustomer.Address.Country,
                    this.onboardCustomerModel.ProviderName
                  );
                }
              },
              (error) => { }
            );
          } else {
            this.getCountryValidationRules(
              this.providerCustomer.Address.Country,
              this.onboardCustomerModel.ProviderName
            );
          }
        } else {
          let commaSeperatedErrors: any | null = null;
          validateCustomerSubscriptionresponse.forEach((error: any) => {
            if (commaSeperatedErrors !== null) {
              commaSeperatedErrors = commaSeperatedErrors + ' , ' + error;
            } else {
              commaSeperatedErrors = error;
            }
          });
          this._toastService.error(commaSeperatedErrors);
          // notifier.notifyError(commaSeperatedErrors);
        }
      });
    this._subscriptionArray.push(subscription);
  }

  getStateProvincesByCountry(country: any) {
    this.stateProvinces = [];
    const subscription = this._commonService
      .getStateProvinceByCountryCode(country)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        this.stateProvinces = response.Data;
      });
    this._subscriptionArray.push(subscription);
  }

  getCountryValidationRules(countryCode: string, providerName: string) {
    this.countryValidationRules = {};
    //startBlockUI();
    const subscription = this._commonService
      .getAddressValidationRules(countryCode, providerName)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        //stopBlockUI();
        if (response.Status === 'Success') {
          this.countryValidationRules = response.Data;
          this.pageVisibleList.push('CustomerDetails');

          /* Adding or updating the validators */
          this.formGroupCustomerDetails
            .get('phoneNumber')
            ?.setValidators(
              Validators.pattern(this.countryValidationRules.PhoneNumberRegex)
            );
          if (this.countryValidationRules.IsStateRequired) {
            this.formGroupCustomerDetails
              .get('addressState')
              ?.setValidators(Validators.required);
          }

          if (this.countryValidationRules.IsPostalCodeRequired) {
            this.formGroupCustomerDetails
              .get('addressZip')
              ?.setValidators([
                Validators.required,
                Validators.pattern(this.countryValidationRules.PostalCodeRegex),
              ]);
          }

          this.formGroupCustomerDetails.updateValueAndValidity();

          this._cdRef.detectChanges();
        }
      });
    this._subscriptionArray.push(subscription);
  }

  onboardCustomer() {
    let obj: any = {
      EventName: 'OnBoardCustomer',
      ProductVariantId: 0,
      planProductId: 0,
      cartId: 0,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      ProductSkuDetails: null,
    };

    this.getRawFormData();
    //todo getCustomNotificationResponsePopup
    // const modalRef = this._modalService.open(UiNotificationPopupComponent, {
    //   backdrop: 'static',
    //   keyboard: false,
    //   size:'md'
    // });
    // modalRef.componentInstance.customnotifyObj = obj;
    // modalRef.result.then((result) => {
    //   if (result) {
    this.submitCustomerDetails();
    // }})
  }

  submitCustomerDetails() {
    //vm.frmCustomerDetails.$submitted = true;
    this.formGroupCustomerDetails.markAllAsTouched();
    if (this.formGroupCustomerDetails.valid) {
      this.subscriptionsList.forEach((subscription: any) => {
        subscription.MappingC3PlanProducts = JSON.stringify(
          subscription.MappingC3PlanProducts
        );
      });

      let postData = {
        C3CustomerID: this.customerC3Id,
        CustomerCurrencyCode: this.onboardCustomerModel.CustomerCurrencyCode,
        PlanIds: this.onboardCustomerModel.PlanIds,
        ProviderCustomer: this.providerCustomer,
        AddEmailAsCustomerAdmin:
          this.onboardCustomerModel.AddEmailAsCustomerAdmin,
        NotifyCustomer: this.onboardCustomerModel.NotifyCustomer,
        ProviderId: this.onboardCustomerModel.ProviderId,
        OnboardCustomerProviderSubscriptions: this.subscriptionsList,
        EntityName: this._commonService.entityName,
        RecordId: this._commonService.recordId,
      };

      const subscription = this._customerService
        .onboardExistingCustomer(postData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.Status === 'Success') {
              this._notifierService.alert({
                title: this._translateService.instant(
                  'TRANSLATE.CUSTOMERONBOARDING_CUSTOMER_CREATED_SUCCESS'
                ),
              });
              this.formGroupCustomerBasicDetails.reset();
              this.formGroupCustomerDetails.reset();
              this.formGroupCustomerOnboardingPlans.reset();
              this.formGroupCustomerBasicDetails.updateValueAndValidity();
              this.formGroupCustomerDetails.updateValueAndValidity();
              this.formGroupCustomerOnboardingPlans.updateValueAndValidity();
              this.showSuccessPage();
              if (this._router.url.includes('linkcustomer')) {
                this._router.navigate([
                  'partner/customers/linkcustomer/onboardmicrosoft',
                ]);
              } else {
                this._router.navigate([
                  'partner/customers/onboardcustomer/microsoft',
                ]);
              }
            }
          },
          error: (error: any) => {
            let commaSeperatedErrors: any = null;
            if (
              error.ErrorMessage !== undefined &&
              error.ErrorMessage.length > 0
            ) {
              let errorList = JSON.parse(error.ErrorMessage);
              errorList.forEach((error: any) => {
                if (commaSeperatedErrors !== null) {
                  commaSeperatedErrors = commaSeperatedErrors + ' , ' + error;
                } else {
                  commaSeperatedErrors = error;
                }
              });
              this._toastService.error(commaSeperatedErrors);
            }
            //stopBlockUI();
          },
        });
      this._subscriptionArray.push(subscription);
    } else if (
      this.formGroupCustomerDetails.get('email')?.errors?.required ||
      this.formGroupCustomerDetails.get('email')?.hasError('email')
    ) {
      //stopBlockUI();
      this._toastService.error(
        this._translateService.instant(
          'TRANSLATE.CUSTOMER_ONBOARDING_EMAIL_VALIDATION_ERROR_MESSAGE'
        )
      );
    } else {
      //stopBlockUI();
    }
  }

  showSuccessPage() {
    this.pageVisibleList.splice(0, this.pageVisibleList.length);
    this.pageVisibleList.push('OnboardedSucess');
    this._cdRef.detectChanges();
  }

  tryAnother() {
    this.plans = []; //.splice(0, vm.plans.length);
    this.pageVisibleList = []; //.splice(0, vm.pageVisibleList.length);
    this.customerLookUpStatus = []; //.splice(0, vm.customerLookUpStatus.length);
    this.subscriptionsList = []; //.splice(0, vm.subscriptionsList.length);

    this.customerLookUpError = null;
    if (
      this.formGroupCustomerBasicDetails !== undefined &&
      this.formGroupCustomerBasicDetails !== null
    ) {
      //need to add formGroup submitted
      this.formGroupCustomerBasicDetails.reset();
    }
    if (
      this.formGroupCustomerDetails !== undefined &&
      this.formGroupCustomerDetails !== null
    ) {
      //need to add formGroup submitted
      this.formGroupCustomerDetails.reset();
    }
    if (
      this.formGroupCustomerOnboardingPlans !== undefined &&
      this.formGroupCustomerOnboardingPlans !== null
    ) {
      //need to add formGroup submitted
      this.formGroupCustomerOnboardingPlans.reset();
    }
    this.onboardCustomerModel = {};
    this.selectedProviderCustomer = null;
    this.onboardCustomerModel.ProviderId = localStorage.getItem(
      'providerIdForOnboard'
    );
    this.onboardCustomerModel.ProviderName = localStorage.getItem(
      'providerNameForOnboard'
    );
    const subscription = this._appSettingService
      .getApplicationData()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        this.onboardCustomerModel.CustomerCurrencyCode =
          response?.CustomerCurrencyCode;
      });
    this.selectedCurrencyCode = null;
    this.selectedPlan = null;
    this.providerCustomer = null;
    if (this._commonService.entityName === 'Partner') {
      this.getNonOnboardedCustomers();
    }

    this.pageVisibleList.push('BasicDetails');
    this._subscriptionArray.push(subscription);
  }

  doneOnbaording() {
    this._router.navigate(['partner/customers']);
    //$state.go("partner.customers", { UseCachedFilters: true });
  }

  onAddEmailAsCustomerAdminChange() {
    /* Updated Model with form Data */
    this.getRawFormData();

    if (!this.onboardCustomerModel.AddEmailAsCustomerAdmin) {
      this.onboardCustomerModel.NotifyCustomer = false;
    } else {
      this.onEmailAddressChange();
    }
  }

  onEmailAddressChange() {
    /* Updated Model with form Data */
    this.getRawFormData();

    this.thisEmailAddressIsAlredyExistMessage = '';
    if (
      this.providerCustomer.Email !== undefined &&
      this.providerCustomer.Email !== '' &&
      this.providerCustomer.Email !== null &&
      this.providerCustomer.Email.length > 0
    ) {
      let email = this.providerCustomer.Email;
      let requestFrom = 'CustomerUser';

      if (
        localStorage.getItem('ResellerC3Id') !== undefined &&
        localStorage.getItem('ResellerC3Id') !== null &&
        localStorage.getItem('ResellerC3Id') !== 'null'
      ) {
        requestFrom = 'ResellerCustomerUser';
      }

      const subscription = this._commonService
        .canAddCustomer(email)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.Status === 'Success') {
              if (!response.Data) {
                this.thisEmailAddressIsAlredyExistMessage =
                  this._translateService.instant(
                    'TRANSLATE.VALIDATION_MESSAGE_EMAIL_ALREADY_EXIST',
                    { emailAddress: email }
                  );
                this._toastService.error(
                  this.thisEmailAddressIsAlredyExistMessage || ''
                );
                this.providerCustomer.Email = null;
                this._cdRef.detectChanges();
              }
            }
          },
          error: (error: any) => {
            if (!error.Data) {
              this.thisEmailAddressIsAlredyExistMessage =
                this._translateService.instant(
                  'TRANSLATE.VALIDATION_MESSAGE_EMAIL_ALREADY_EXIST',
                  { emailAddress: email }
                );
              this._toastService.error(
                this.thisEmailAddressIsAlredyExistMessage || ''
              );
              this.providerCustomer.Email = null;
              this._cdRef.detectChanges();
            }
          },
        });
      this._subscriptionArray.push(subscription);
    }
  }

  skipProviderSubscription(product: any) {
    let subscriptionToSkip: any = this.subscriptionsList.filter(
      (subscription: any) => {
        return (
          subscription.ProviderSubscriptionId ===
          product.ProviderSubscriptionId &&
          subscription.BillingCycleId === product.BillingCycleId
        );
      }
    );

    if (subscriptionToSkip !== null && subscriptionToSkip.length > 0) {
      subscriptionToSkip[0].IgnoredProduct = true;
    }

    let addonsToSkip = this.subscriptionsList.filter((subscription: any) => {
      return (
        subscription.ProviderSubscriptionParentId ===
        product.ProviderSubscriptionId &&
        subscription.BillingCycleId === product.BillingCycleId
      );
    });

    if (addonsToSkip !== null && addonsToSkip.length > 0) {
      addonsToSkip.forEach((addonToRemove: any) => {
        this.skipProviderSubscription(addonToRemove);
      });
    }
  }

  takeOnProviderSubscription(product: any) {
    let subscriptionToTakeOn: any = this.subscriptionsList.filter(
      (subscription: any) => {
        return (
          subscription.ProviderSubscriptionId ===
          product.ProviderSubscriptionId &&
          subscription.BillingCycleId === product.BillingCycleId
        );
      }
    );

    if (subscriptionToTakeOn !== null && subscriptionToTakeOn.length > 0) {
      subscriptionToTakeOn[0].IgnoredProduct = false;
    }

    let parentSubscriptionsToTakeOn = this.subscriptionsList.filter(
      (subscription: any) => {
        return (
          subscription.ProviderSubscriptionId ===
          product.ProviderSubscriptionParentId &&
          subscription.BillingCycleId === product.BillingCycleId
        );
      }
    );

    if (
      parentSubscriptionsToTakeOn !== null &&
      parentSubscriptionsToTakeOn.length > 0
    ) {
      parentSubscriptionsToTakeOn.forEach((parentSubscriptionToTakeOn: any) => {
        this.takeOnProviderSubscription(parentSubscriptionToTakeOn);
      });
    }
  }

  defineProductSubscriptionType() {
    let stateName = '';
    this.subscriptionsList = [...this.tempSubscriptionList];
    let customerDetailsIndex = this.pageVisibleList.indexOf('CustomerDetails');
    if (customerDetailsIndex >= 0) {
      this.pageVisibleList.splice(customerDetailsIndex, 1);
    }

    if (this._router.url.includes('linkcustomer')) {
      stateName = this.isProductSharable
        ? 'partner/customers/linkcustomer/onboardmicrosoft/shared'
        : 'partner/customers/linkcustomer/onboardmicrosoft/nonshared';
    } else {
      stateName = this.isProductSharable
        ? 'partner/customers/onboardcustomer/microsoft/shared'
        : 'partner/customers/onboardcustomer/microsoft/nonshared';
    }

    let data: any = {
      onboardCustomerModel: this.onboardCustomerModel,
      customerC3Id: this.customerC3Id,
      loadingSubscriptions: this.loadingSubscriptions,
      subscriptionsList: this.subscriptionsList,
      pageVisibleList: this.pageVisibleList,
    };
    return this._router.navigate([stateName], { state: { stateData: data } });
  }

  checkIfResellerIsLinkedWithProvider() {
    if (
      this._commonService.entityName === 'Reseller' &&
      this._commonService.recordId !== undefined &&
      this._commonService.recordId !== null &&
      this._commonService.recordId !== ''
    ) {
      const subscription = this._customerService
        .checkIfResellerHasLinkWithProvider()
        .pipe(takeUntil(this.destroy$))
        .subscribe((response: any) => {
          if (response.Status === 'Success') {
            this.canProceedForOnboardingResellerCustomer = response.Data;

            if (this.canProceedForOnboardingResellerCustomer === true) {
              this.getNonOnboardedCustomers();
            }
          }
        });
      this._subscriptionArray.push(subscription);
    } else {
      this.canProceedForOnboardingResellerCustomer = false;
    }
  }

  getNonOnboardedCustomers() {
    // startBlockUI();
    this.loadingCSPCustomers = true;
    const subscription = this._customerService
      .getNonOnboardedCustomersFromProvider()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        this.nonOnboardedCustomers = response.Data;
        this.filterednonOnboardedCustomers = this.nonOnboardedCustomers.slice(
          0,
          this.bufferSize
        );
        this.loadingCSPCustomers = false;
        this._cdRef.detectChanges();
      });
    this._subscriptionArray.push(subscription);

    this.searchCustomer
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.searchOnBoardedCustomers(term))
      )
      .subscribe((data) => {
        this.filterednonOnboardedCustomers = data;
      });
  }

  fetchMore() {
    const len = this.filterednonOnboardedCustomers.length;
    const more = this.nonOnboardedCustomers.slice(len, this.bufferSize + len);
    setTimeout(() => {
      this.filterednonOnboardedCustomers =
        this.filterednonOnboardedCustomers.concat(more);
    }, 200);
  }

  onSearch(event: any) {
    this.searchCustomer.next(event.term);
  }

  searchOnBoardedCustomers(value: string) {
    if (!value || value.length < 2) {
      return of(this.nonOnboardedCustomers.slice(0, this.bufferSize));
    }

    return of(
      this.nonOnboardedCustomers.filter(
        (x) =>
          x.CompanyName.toLowerCase().startsWith(value.toLowerCase()) ||
          x.Domain.toLowerCase().startsWith(value.toLowerCase()) ||
          x.TenantId.toLowerCase().startsWith(value.toLowerCase())
      )
    );
  }

  downloadNonOnboardedCustomerData() {
    const headers = ['Customer name', 'Tenant id', 'Domain name'];

    let csvContent =
      '\uFEFF' +
      headers.join(',') +
      '\n' +
      this.nonOnboardedCustomers
        .map(e =>
          `${[e.CompanyName, e.TenantId, e.Domain].map((value) => {
                const escaped = String(value ?? '').replace(/"/g, '""');
                const safe = /^[\t\r\n ]*[=+\-@]/.test(escaped) ? `'${escaped}` : escaped;
                return `"${safe}"`;
              }).join(',')}`
        )
        .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'non_onboarded_customers.csv';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getFormControl(formGroup: FormGroup, controlName: string) {
    return formGroup.get(controlName);
  }

  getFormControlValue(formGroup: FormGroup, controlName: string) {
    return this.getFormControl(formGroup, controlName)?.value;
  }

  setFormControlValue(formGroup: FormGroup, controlName: string, data: any) {
    let control = this.getFormControl(formGroup, controlName);
    control?.setValue(data);
  }

  /* Pop-up functions */
  closePopup() {
    this.collectCustomerDetailsModalRef.dismiss();
    this.collectCustomerDetailsModalRef.close();
  }

  proceed() {
    setTimeout(() => {
      this.collectCustomerDetailsModalRef.close('proceed');
    });
  }

  setFormValues(providerCustomer: any) {
    this.formGroupCustomerDetails.setValue({
      firstName: providerCustomer.FirstName,
      lastName: providerCustomer.LastName,
      middleName: providerCustomer.MiddleName,
      organizationRegistrationNumber:
        providerCustomer.OrganizationRegistrationNumber,
      email: providerCustomer.Email,
      addEmailAsCustomerAdmin: false,
      notifyCustomer: false,
      phoneNumber: providerCustomer.PhoneNumber,
      addressLine1: providerCustomer.Address?.Line1,
      addressLine2: providerCustomer.Address?.Line2,
      addressCity: providerCustomer.Address.City,
      addressState: providerCustomer.Address.State,
      addressZip: providerCustomer.Address.Zip,
    });
  }

  getRawFormData() {
    let {
      firstName,
      lastName,
      middleName,
      organizationRegistrationNumber,
      email,
      addEmailAsCustomerAdmin,
      notifyCustomer,
      phoneNumber,
      addressLine1,
      addressLine2,
      addressCity,
      addressState,
      addressZip,
    } = this.formGroupCustomerDetails.value;
    organizationRegistrationNumber = this.formGroupCustomerDetails.get(
      'organizationRegistrationNumber'
    ).value;

    this.providerCustomer.FirstName = firstName;
    this.providerCustomer.LastName = lastName;
    this.providerCustomer.MiddleName = middleName;
    this.providerCustomer.OrganizationRegistrationNumber =
      organizationRegistrationNumber;
    this.providerCustomer.Email = email;
    this.onboardCustomerModel.AddEmailAsCustomerAdmin = addEmailAsCustomerAdmin;
    this.onboardCustomerModel.NotifyCustomer = notifyCustomer;
    this.providerCustomer.PhoneNumber = phoneNumber;
    this.providerCustomer.Address.Line1 = addressLine1;
    this.providerCustomer.Address.Line2 = addressLine2;
    this.providerCustomer.Address.City = addressCity;
    this.providerCustomer.Address.State = addressState;
    this.providerCustomer.Address.Zip = addressZip;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this.formGroupCustomerDetails.reset();
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  getCustomerBasicDetails() {
    this.selectedCustomer = this.getFormControlValue(
      this.formGroupCustomerBasicDetails,
      'selectedProviderCustomer'
    ); //$select.selected;
    if (!this.selectedCustomer) {
      if (
        this.entityName === 'Reseller' &&
        this.hasSupportForResellersWithMPNID === 'No'
      ) {
        this.onboardCustomerModel.ProviderCustomerId = this.getFormControlValue(
          this.formGroupCustomerBasicDetails,
          'providerCustomerId'
        ); //$select.selected;
      }
    }
  }
}
