import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from 'src/app/modules/customers/services/shop.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { PermissionService } from 'src/app/services/permission.service';
import * as _ from 'lodash';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { DataSharingModel, EVENT_TYPE } from 'src/app/shared/models/common';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';
import { CreateOrUpdateScheduledRenewalModel } from 'src/app/shared/models/create-or-update-scheduled-renewal.model';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ToastService } from 'src/app/services/toast.service';
import { Utility } from 'src/app/shared/utilities/utility';
import { NotifierService } from 'src/app/services/notifier.service';
import moment from 'moment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { CommonService } from 'src/app/services/common.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { CancelScheduledRenewalReasonPopupComponent } from 'src/app/modules/standalones/cancel-scheduled-renewal-reason-popup/cancel-scheduled-renewal-reason-popup.component';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CustomEnddatePopupComponent } from 'src/app/modules/standalones/custom-enddate-popup/custom-enddate-popup.component';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { catchError, of, Subject, Subscription, takeUntil } from 'rxjs';
import { LoaderService } from 'src/app/services/loader.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
@Component({
  selector: 'app-ncemanage-renewal',
  templateUrl: './ncemanage-renewal.component.html',
  styleUrl: './ncemanage-renewal.component.scss'
})
export class NCEManageRenewalComponent extends C3BaseComponent implements OnInit {
  internalCustomerProductId: string;
  pageMode: string = 'List';
  customEndDateTypes: any[] = [];
  selectedCustomEndDateType: any = null;
  selectedCustomEndDateTypeId: number;
  customEndDate: any = null;
  isSelectedEndDateAlignWithCalendar: boolean = false;
  product: any = {};
  currentProductRenewalDate: any = null;
  cumulativeQuantityForCurrentProduct: any = null;
  enableCreateNewSchedule: boolean = false;
  enableActionButtons: boolean = false;
  scheduledRenewals: any[] = [];
  createOrUpdateScheduledRenewalModel: any = new CreateOrUpdateScheduledRenewalModel();
  eligiblePlanProducts: any[] = [];
  selectedPlanProduct: any = null;
  noEligibleProductsFoundMessageText: string;
  productsWithCoterminousEndDatesForScheduling: any[] = [];
  cancelledReason: any = null;
  isSeatLimitExceed: boolean = false;
  isAlreadyOnhold: boolean = false;
  currentNewPurchasePrice: number = 0.0;
  seatLimitExceedProductName: string = '';
  numberOfLicensesCustomerCanPurchase: number = 0;
  totalTransactionAmount: number = 0.0;
  transactionAmountLimit: number = 0.0;
  sourceSeatsUpgradeQuantity: number = 0;
  invalidChildOffer: any[] = [];
  commitmentEndDate: any = null;
  oldScheduledQuantity: number = 0;
  upgradeProductForm: any = {};
  eligiblePlanProductsWithSameTermAndSKU: any[] = [];
  eligiblePlanProductsWithSameSKU: any[] = [];
  eligiblePlanProductsWithDifferentSKU: any[] = [];
  canShowCustomerSubscriptionEndDateAlignmentChanges: any = null;
  isAlignWithEndDateEnabled: boolean = false;
  oldScheduledProductName: any = null;
  oldScheduledValidity: any = null;
  oldScheduledValidityType: any = null;
  oldScheduledBillingCycleName: any = null;
  oldScheduledPlanProductId: any = null;
  previousApprovedTransactionLimit: number = 0.0;
  NCETermsAndConditionURLText: string;
  NCETermsAndConditionURL: string;
  showTermsAndConditionsForSubscriptionUpdate: any;
  isAgreedOnTermsAndCondition: any;
  datatableConfig: ADTSettings | any;
  IsLoadingTable: boolean;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('termDuration') termDuration: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  isGridDataLoading: boolean;
  eligiblePlanProductsWithSameTerm: any[] = [];
  gridLoadingDataMessage = '';
  ExistingSubscriptions: any;
  previouslyApprovedQuantity: any;
  isDisableSubmitButton: boolean = false;
  globalDateFormat: string;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(private _commonService: CommonService,
    private _manageProductService: ManageProductService,
    private _appService: AppSettingsService,
    private _shopService: ShopService,
    private _commonEventTrigerredService: CommonEventTrigerredService,
    private _translateService: TranslateService,
    private _cdRef: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _modalService: NgbModal,
    private _userContext: UserContextService,
    private pageInfo: PageInfoService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    public _toastService: ToastService,
    public appSetting: AppSettingsService,
    public _loaderService: LoaderService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.gridLoadingDataMessage = this._translateService.instant('TRANSLATE.LOADING_MESSAGE')
    this.showTermsAndConditionsForSubscriptionUpdate = appSetting.$rootScope.settings?.ShowTermsAndConditionsForSubscriptionUpdate
    if (localStorage.getItem("product") !== undefined || localStorage.getItem("product") !== null || localStorage.getItem("product") !== '' || localStorage.getItem("product") !== "") {
      this.product = JSON.parse(localStorage.getItem("product"));
      this.internalCustomerProductId = this.product.InternalCustomerProductId;
    }
    this.createOrUpdateScheduledRenewalModel = new CreateOrUpdateScheduledRenewalModel();

  }

  Permissions = {
    HasBtnCreateScheduleRenewalChanges: "Denied",
    HasBtnUpdateScheduleRenewalChanges: "Denied",
    HasBtnCancelScheduleRenewalChanges: "Denied",
    HasSubscriptionEndDateAlignment: "Denied"
  };

  HasPermission() {
    this.Permissions.HasBtnCreateScheduleRenewalChanges = this._permissionService.hasPermission('BTN_CREATE_SCHEDULE_RENEWAL_CHANGES');
    this.Permissions.HasBtnUpdateScheduleRenewalChanges = this._permissionService.hasPermission('BTN_UPDATE_SCHEDULE_RENEWAL_CHANGES');
    this.Permissions.HasBtnCancelScheduleRenewalChanges = this._permissionService.hasPermission('BTN_CANCEL_SCHEDULE_RENEWAL_CHANGES');
    this.Permissions.HasSubscriptionEndDateAlignment = this._permissionService.hasPermission('SUBSCRIPTION_END_DATE_ALIGNMENT');
  }


  ngOnInit(): void {
    this.HasPermission();
    this.getApplicationData();
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.getProductDetails();
    this.handleTableConfig();
    this.getCustomEndDateTypes();
    this.pageInfo.updateBreadcrumbs(['BREADCRUMB_TEXT_CUSTOMER_PRODUCTS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE"), true);
  }

  isCheckboxRequiredNCE(): boolean {
    return this.NCETermsAndConditionURL !== null && 
            this.NCETermsAndConditionURL!==''&& 
            this.showTermsAndConditionsForSubscriptionUpdate === 'true'
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      // this.NCETermsAndConditionURLText = response.Data.NCETermsAndConditionURLText;
      // this.NCETermsAndConditionURL = response.Data.NCETermsAndConditionURL;
      this.showTermsAndConditionsForSubscriptionUpdate = response.Data.ShowTermsAndConditionsForSubscriptionUpdate;
    });
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    this.enableCreateNewSchedule = false;
    this.datatableConfig = null;
    this._cdRef.detectChanges();
    this._subscription = this._manageProductService.getScheduledRenewals(this.product.InternalCustomerProductId).subscribe(({ Data }: any) => {//ajmal:todo: Nexted subscription
      setTimeout(() => {
        this.IsLoadingTable = false;
        const self = this;
        this.applyEscapeHTML(Data);
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
          data: Data,
          ordering: false,
          ADTSettings: {
            enableEscapeHTML: true
          },
          columns: [
            {
              title: this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TABLE_HEADER_NEW_SKU'),
              data: 'PlanProductName',
              className: 'col-md-2',
              render: (data: string, type: any, row: any, meta: any) => {
                return `<span class="fw-bold">${row.PlanProductName}</span>`
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TABLE_HEADER_QUANTITY'),
              data: 'NewQuantity',
              className: 'col-md-1'
            },
            {
              title: this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TABLE_HEADER_TERM'),
              defaultContent: '',
              className: 'col-md-1 text-start',
              ngTemplateRef: {
                ref: this.termDuration,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              },
            },
            {
              title: this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TABLE_HEADER_NEW_BILLING_CYCLE'),
              defaultContent: '',
              className: 'col-md-1',
              render: (data: string, type: any, row: any, meta: any) => {
                return this._translateService.instant('TRANSLATE.' + row.BillingCycleDescriptionKey)
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TABLE_HEADER_ALIGN_END_DATE'),
              data: 'NewProviderEffectiveEndDate',
              className: 'col-md-1',
              render: (data: string) => {
                var datePipe = new C3DatePipe(this._appService);
                return datePipe.transform(data);
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TABLE_HEADER_SCHEDULED_DATE'),
              data: 'ScheduledDate',
              className: 'col-md-1',
              render: (data: string) => {
                var datePipe = new C3DatePipe(this._appService);
                return datePipe.transform(data);
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TABLE_HEADER_STATUS'),
              defaultContent: '',
              className: 'col-md-1',
              render: (data: string, type: any, row: any, meta: any) => {
                return this._translateService.instant('TRANSLATE.' + row.StatusDescription)
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TABLE_HEADER_CANCEL_REASON'),
              data: 'CancelledReason',
              className: 'col-md-2 text-start',
              render: (data: string) => {
                let cancelreason = "";
                this._subscription = this._translateService.get("TRANSLATE." + data).subscribe((res: string) => {//ajmal:todo: Nexted subscription
                  if (res.includes('TRANSLATE') != true) {
                    cancelreason = res;
                  }
                });
                if (cancelreason != "" && cancelreason != undefined && cancelreason != null) {
                  return `<span>${cancelreason}</span>`;
                }
                else {
                  if (data != "" && data != undefined && data != null) {
                    return `<span>${data}</span>`;
                  }
                  else {
                    return `<span></span>`
                  }
                }
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TABLE_HEADER_TERMS_AND_CONDITIONS'),
              defaultContent: '',
              className: 'col-md-1 text-start',
              visible: this.showTermsAndConditionsForSubscriptionUpdate === 'true',
              render: (data: string, type: any, row: any) => {
                if (row.IsTermsAndConditionsAccepted !== null) {
                  return this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TERMS_AND_CONDITIONS_ACCEPTED')
                }
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.SCHEDULED_RENEWALS_TABLE_HEADER_ACTIONS'),
              defaultContent: '',
              className: 'col-md-1 text-center',
              ngTemplateRef: {
                ref: this.actions,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              },
            },
          ],
        };
        if (Data && Data.length > 0) {
          const scheduledRenewalWithActiveStatus = Data.find((a: any) => a.Status === 'Active');
          const scheduledRenewalWithOnholdStatus = Data.find((x: any) => x.Status === 'OnHold');

          if (scheduledRenewalWithActiveStatus) {
            if (scheduledRenewalWithActiveStatus.Status === 'Active') {
              this.enableCreateNewSchedule = false;
              this.enableActionButtons = true;
            } else {
              this.enableCreateNewSchedule = true;
            }
          }

          if (scheduledRenewalWithOnholdStatus) {
            if (scheduledRenewalWithOnholdStatus.Status === 'OnHold') {
              this.enableCreateNewSchedule = false;
              this.enableActionButtons = false;
            }
          }

          if (!scheduledRenewalWithActiveStatus && !scheduledRenewalWithOnholdStatus) {
            this.enableCreateNewSchedule = true;
          }
        } else {
          this.enableCreateNewSchedule = true;
          this.enableActionButtons = false;
        }

        this._cdRef.detectChanges();
      });
    })

  }
  onCaptureEvent(event: Event) { }

  getIsAlignWithCalendorEndDateSetting() {
    const subscription = this._shopService.getIsAlignWithCalendorEndDateSetting().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      const data = response;
      if (data) {
        this.isAlignWithEndDateEnabled = data.toLowerCase() === 'Align end date with calendar month'.toLowerCase();
        this.createSchedule();
      }
    });
    this._subscriptionArray.push(subscription);
  }


  getCustomEndDateTypes() {
    this.customEndDateTypes = [
      { Id: '1', Name: this._translateService.instant('TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_DEFAULT'), Value: 'Default' },
      { Id: '2', Name: this._translateService.instant('TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_ALIGN_END_DATE_WITH_CALENDAR_MONTH'), Value: 'Align end date with calendar month' },
      { Id: '3', Name: this._translateService.instant('TRANSLATE.CUSTOMER_CART_COTERMINOSITY_DROPDOWN_END_DATE_FROM_EXISTING_SUBSCRIPTIONS'), Value: 'End date from existing subscriptions' }
    ];
  }

  getProductDetails(): void {
    if (!this.internalCustomerProductId) {
      this._router.navigate(['manageproduct/onlineserviceNCE/basicdetails']);
    } else {
      const subscription = this._manageProductService.getProductDetails(this.internalCustomerProductId).pipe(takeUntil(this.destroy$)).subscribe(
        (response: any) => {
          this.product = response?.Data || null;
          if (!this.product) {
            this._router.navigate(['manageproduct/onlineserviceNCE/basicdetails']);
          } else {
            // nce terms and conditions being moved to customer configuration
            this.NCETermsAndConditionURL = this.product.NceTermsAndConditionUrl;
            this.NCETermsAndConditionURLText = this.product.NceTermsAndConditionsText;

            this.currentProductRenewalDate = this.product.AutoRenewDate;
            this.cumulativeQuantityForCurrentProduct = this.product.TotalCumulativeQuantity;
            this.commitmentEndDate = this.product.CommitmentEndDate;
            this.totalTransactionAmount = this.product.TotalTransactionAmount ?? 0.00;
            this.transactionAmountLimit = this.product.TransactionAmountLimit ?? 0.00;
            // Temp fix
            this.product.NewValidity = this.product.Validity;
            this.product.NewValidityType = this.product.ValidityType;
            this.product.NewBillingCycleName = this.product.BillingCycleName;
            //
            this.emitLimitMessageEvent(this.product);
            this.canShowCustomerSubscriptionEndDateAlignmentChanges = this.product.CanShowCustomerSubscriptionEndDateAlignmentChanges;
            this.createOrUpdateScheduledRenewalModel.SupportedMarketCode = this.product.SupportedMarketCode;
          }
      });
      this._subscriptionArray.push(subscription);
    }
  }

  backToBasicDetails() {
    this._router.navigate(['customer/manageproduct/onlineserviceNCE/basicdetails'])
  }


  createSchedule() {
    // this.getIsAlignWithCalendorEndDateSetting();
    this.selectedCustomEndDateType = this.customEndDateTypes.find(endDateType =>
      endDateType.Value === (this.isAlignWithEndDateEnabled ? 'Align end date with calendar month' : 'Default')
    );
    this.selectedCustomEndDateTypeId = this.selectedCustomEndDateType.Id;
    if (this.selectedCustomEndDateType.Value === 'Default') {
      this.customEndDate = null;
      this.isSelectedEndDateAlignWithCalendar = false;
    } else {
      this.setCustomDateBasedOnAlignCalendarMonth();
    }

    this.createOrUpdateScheduledRenewalModel = new CreateOrUpdateScheduledRenewalModel({
      C3CustomerId: this.product.C3CustomerId,
      InternalCustomerProductId: this.product.InternalCustomerProductId,
      SourceProductName: this.product.PlanProductName,
      SourcePlanProductId: this.product.PlanProductId,
      ServiceProviderCustomerRefId: this.product.ServiceProviderCustomerRefId,
      ProviderProductId: this.product.ProviderProductId,
      SourceProviderReferenceId: this.product.ProviderReferenceId,
      SourceValidity: this.product.Validity,
      SourceValidityType: this.product.ValidityType,
      BillingCycleName: this.product.BillingCycleName,
      OldQuantity: this.cumulativeQuantityForCurrentProduct,
      NewQuantity: this.cumulativeQuantityForCurrentProduct,
      NewProviderEffectiveEndDate: this.customEndDate,
      NewEndDateIsAlignWithCalendar: this.isSelectedEndDateAlignWithCalendar,
      EndDateType: this.selectedCustomEndDateType.Value,
      SupportedMarketCode: this.product.SupportedMarketCode
    });

    //changing the page mode
    this.pageMode = "Add";

  }

  onAccordionClick() {
    this.isGridDataLoading = true;

    if (this.pageMode === 'Add') {
      this.getPlanProductsByEligibleSkus();
    } else {
      this.getPlanProductsByEligibleSkus(this.createOrUpdateScheduledRenewalModel);
    }
  }

  backToScheduledRenewals() {
    this.pageMode = "List";
  }

  getPlanProductsByEligibleSkus(scheduledRenewal?: any) {
    const payload = {
      EntityName: null,
      RecordId: null,
      ProviderSubscriptionId: this.product.ProviderProductId,
      ProviderCustomerId: this.product.ServiceProviderCustomerRefId,
      CategoryName: null,
      ProviderName: null,
      RequestType: 'NCEScheduling'
    };

    this.eligiblePlanProductsWithSameTermAndSKU = [];
    this.eligiblePlanProductsWithSameSKU = [];
    this.eligiblePlanProductsWithDifferentSKU = [];

    // Assuming you have a user context service to get entity name and record id
    payload.EntityName = this._commonService.entityName; // Replace with actual value
    payload.RecordId = this._commonService.recordId; // Replace with actual value
    this.isGridDataLoading = true;

    const subscription = this._manageProductService.getTransitionActivity(payload).pipe(takeUntil(this.destroy$)).subscribe(response => {
      if (response && response.length > 0) {
        this.eligiblePlanProducts = response;

        _.each(this.eligiblePlanProducts, product => {
          product.NewValidity = product.Validity;
          product.NewValidityType = product.ValidityType;
          product.NewBillingCycleName = product.BillingCycleName;
        });

        this.eligiblePlanProductsWithSameTerm = _.filter(this.eligiblePlanProducts, product => {
          return product.ProviderReferenceId == this.product.ProviderReferenceId && product.Validity == this.product.Validity && product.ValidityType == this.product.ValidityType;
        });

        this.createOrUpdateScheduledRenewalModel.SupportedMarketCode = this.eligiblePlanProducts[0].SupportedMarketCode;

        _.each(this.eligiblePlanProducts, product => {
          if (product.ProviderReferenceId == this.product.ProviderReferenceId && product.Validity == this.product.Validity && product.ValidityType == this.product.ValidityType) {
            this.eligiblePlanProductsWithSameTermAndSKU.push(product);
          } else if (product.ProviderReferenceId == this.product.ProviderReferenceId) {
            this.eligiblePlanProductsWithSameSKU.push(product);
          } else {
            this.eligiblePlanProductsWithDifferentSKU.push(product);
          }
        });
      }

      if (this.pageMode == 'Edit') {
        for (let i in this.eligiblePlanProducts) {
          if (this.eligiblePlanProducts[i].PlanProductId == scheduledRenewal.NewPlanProductId) {
            this.eligiblePlanProducts[i].Selected = true;
            this.createOrUpdateScheduledRenewalModel.TargetProductName = this.eligiblePlanProducts[i].Name;
            this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId = this.eligiblePlanProducts[i].ProviderReferenceId;
            this.createOrUpdateScheduledRenewalModel.NewPlanProductId = this.eligiblePlanProducts[i].PlanProductId;
            this.createOrUpdateScheduledRenewalModel.NewValidity = this.eligiblePlanProducts[i].Validity;
            this.createOrUpdateScheduledRenewalModel.NewValidityType = this.eligiblePlanProducts[i].ValidityType;
            this.createOrUpdateScheduledRenewalModel.NewBillingCycleId = this.eligiblePlanProducts[i].BillingCycleId;
            this.createOrUpdateScheduledRenewalModel.NewBillingCycleName = this.eligiblePlanProducts[i].BillingCycleName;
            this.createOrUpdateScheduledRenewalModel.Price = this.eligiblePlanProducts[i].FinalSalePrice;
            this.createOrUpdateScheduledRenewalModel.NumberOfLicensesCustomerCanPurchase = this.eligiblePlanProducts[i].NumberOfLicensesCustomerCanPurchase;

            if (this.eligiblePlanProducts[i].TransactionAmountLimit === undefined || this.eligiblePlanProducts[i].TransactionAmountLimit === null || this.eligiblePlanProducts[i].TransactionAmountLimit === '') {
              this.createOrUpdateScheduledRenewalModel.TransactionAmountLimit = null;
            } else {
              this.createOrUpdateScheduledRenewalModel.TransactionAmountLimit = this.eligiblePlanProducts[i].TransactionAmountLimit;
            }

            this.createOrUpdateScheduledRenewalModel.PlanProductCurrentLicenseCount = this.eligiblePlanProducts[i].PlanProductCurrentLicenseCount;
            this.createOrUpdateScheduledRenewalModel.ConsumptionTypeId = this.eligiblePlanProducts[i].ConsumptionTypeId;
            this.createOrUpdateScheduledRenewalModel.PlanProductName = this.eligiblePlanProducts[i].PlanProductName;
            this.createOrUpdateScheduledRenewalModel.SupportedMarketCode = this.eligiblePlanProducts[i].SupportedMarketCode;

            this.selectedPlanProduct = this.eligiblePlanProducts[i];
          } else if (this.createOrUpdateScheduledRenewalModel.SourcePlanProductId == this.createOrUpdateScheduledRenewalModel.NewPlanProductId) {
            this.createOrUpdateScheduledRenewalModel.Price = this.product.FinalSalePrice;
            this.createOrUpdateScheduledRenewalModel.NumberOfLicensesCustomerCanPurchase = this.product.NumberOfLicensesCustomerCanPurchase;

            if (this.product.TransactionAmountLimit === undefined || this.product.TransactionAmountLimit === null || this.product.TransactionAmountLimit === '') {
              this.createOrUpdateScheduledRenewalModel.TransactionAmountLimit = null;
            } else {
              this.createOrUpdateScheduledRenewalModel.TransactionAmountLimit = this.product.TransactionAmountLimit;
            }

            this.createOrUpdateScheduledRenewalModel.PlanProductCurrentLicenseCount = this.product.PlanProductCurrentLicenseCount;
            this.createOrUpdateScheduledRenewalModel.ConsumptionTypeId = this.product.ConsumptionTypeId;
            this.createOrUpdateScheduledRenewalModel.PlanProductName = this.product.PlanProductName;
          }
        }
      }

      this.isGridDataLoading = false;
    });
    this._subscriptionArray.push(subscription);
  }

  selectPlanProductForSubscriptionUpgrade(planProduct: any, index: number) {
    this.selectedCustomEndDateType = _.find(this.customEndDateTypes, (endDateType) => endDateType.Value === 'Default');
    this.selectedCustomEndDateTypeId = this.selectedCustomEndDateType.Id;
    if (this.selectedCustomEndDateType.Value === 'Default') {
      this.customEndDate = null;
      this.isSelectedEndDateAlignWithCalendar = false;
      this.createOrUpdateScheduledRenewalModel.EndDateType = this.selectedCustomEndDateType.Value;
      this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = null;
      this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = false;
    }

    this.createOrUpdateScheduledRenewalModel.TargetProductName = planProduct.Name;
    this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId = planProduct.ProviderReferenceId;
    this.createOrUpdateScheduledRenewalModel.NewPlanProductId = planProduct.PlanProductId;
    this.createOrUpdateScheduledRenewalModel.NewValidity = planProduct.Validity;
    this.createOrUpdateScheduledRenewalModel.NewValidityType = planProduct.ValidityType;
    this.createOrUpdateScheduledRenewalModel.NewBillingCycleId = planProduct.BillingCycleId;
    this.createOrUpdateScheduledRenewalModel.NewBillingCycleName = planProduct.BillingCycleName;

    this.createOrUpdateScheduledRenewalModel.Price = planProduct.FinalSalePrice;
    this.createOrUpdateScheduledRenewalModel.NumberOfLicensesCustomerCanPurchase = planProduct.NumberOfLicensesCustomerCanPurchase;
    if (planProduct.TransactionAmountLimit === undefined || planProduct.TransactionAmountLimit === null || planProduct.TransactionAmountLimit === '') {
      this.createOrUpdateScheduledRenewalModel.TransactionAmountLimit = null;
    } else {
      this.createOrUpdateScheduledRenewalModel.TransactionAmountLimit = planProduct.TransactionAmountLimit;
    }
    this.createOrUpdateScheduledRenewalModel.PlanProductName = planProduct.PlanProductName;
    this.createOrUpdateScheduledRenewalModel.PlanProductCurrentLicenseCount = planProduct.PlanProductCurrentLicenseCount;
    this.createOrUpdateScheduledRenewalModel.ConsumptionTypeId = planProduct.ConsumptionTypeId;
    this.createOrUpdateScheduledRenewalModel.SupportedMarketCode = planProduct.SupportedMarketCode;

    this.sourceSeatsUpgradeQuantity = 0;
    this.selectedPlanProduct = planProduct;
    this.sourceSeatsUpgradeQuantity = _.cloneDeep(this.product.TotalCumulativeQuantity);
  }

  showPromotionDetailForSubscriptionUpgrade(data: any) {
    const subscription = this._manageProductService.showPromotionDetailForSubscriptionUpgrade(data.PromotionIntId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status == "Success") {
        const modalRef = this._modalService.open(PromotionDetailComponent, { size: 'lg' });
        modalRef.componentInstance.promotionDetail = response.Data;
      }
    });
    this._subscriptionArray.push(subscription);
  }

  onQuantityChange() {
    if (!this.product.AllowCustomerToreduceSeats && this.product.CummulativeQuantity > this.createOrUpdateScheduledRenewalModel.NewQuantity) {
      if (this.product.CummulativeQuantity != this.createOrUpdateScheduledRenewalModel.NewQuantity && this.oldScheduledQuantity != 0) {
        this.createOrUpdateScheduledRenewalModel.NewQuantity = this.oldScheduledQuantity;
      } else {
        this.createOrUpdateScheduledRenewalModel.NewQuantity = this.product.CummulativeQuantity;
      }
      this._notifierService.alert(this._translateService.instant('TRANSLATE.MANAGE_RENEWAL_ALERT_MESSAGE_REDUCE_THE_QUANTITY'));
    }
  }

  setCustomDateBasedOnAlignCalendarMonth() {
    this.customEndDate = null;
    let validityType = this.product.ValidityType;
    let validity = this.product.Validity;

    if (this.createOrUpdateScheduledRenewalModel.NewPlanProductId != null && this.createOrUpdateScheduledRenewalModel.NewValidityType != null) {
      validityType = this.createOrUpdateScheduledRenewalModel.NewValidityType;
      validity = this.createOrUpdateScheduledRenewalModel.NewValidity;
      this.isSelectedEndDateAlignWithCalendar = true;
    }

    if (validityType != null) {
      if (this.product.CategoryName === 'OnlineServicesNCE') {
        const reqBody = {
          TenantId: this.product.ServiceProviderCustomerRefId,
          Validity: validity,
          ValidityType: validityType,
          CustomEndDateType: 'calendarMonthAligned',
          StartDate: this.currentProductRenewalDate
        };
        this._loaderService.commonStartLoading();
        const subscription = this._manageProductService.getCoterminousEndDatesForScheduling(reqBody)
          .pipe(
            catchError((err) => {
              let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
              this._toastService.error(errmsg, {
                timeOut: 10000
              });
              return of(null);
            })).subscribe((response: any) => {
              this._loaderService.commonStopLoading();
              this.customEndDate = response.Data[0].ProviderEffectiveEndDate;
              if (this.customEndDate != null) {
                this.customEndDate = this.customEndDate;
                this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = moment(this.customEndDate).format('LL');
                this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = true;
              }
            });
            this._subscriptionArray.push(subscription);
      } else {
        this.customEndDate = Utility.calculateAlignWithCalendorMonthDate(validity, validityType, this.currentProductRenewalDate);
        if (this.customEndDate != null) {
          this.customEndDate = moment(new Date(this.customEndDate)).format('LL');
          this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = moment(new Date(this.customEndDate)).format('LL');
          this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = true;
        }
      }
    }
  }

  selectCustomEndDateType() {
    this.selectedCustomEndDateType = this.customEndDateTypes.find(endDateType =>
      endDateType.Id === this.selectedCustomEndDateTypeId
    );
    if (this.selectedCustomEndDateType != null) {
      //this.selectedCustomEndDateType = selectedType;
      this.createOrUpdateScheduledRenewalModel.EndDateType = this.selectedCustomEndDateType.Value;
      if (this.selectedCustomEndDateType.Value === 'Default') {
        this.customEndDate = null;
        this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = null;
        this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = false;
      } else if (this.selectedCustomEndDateType.Value === 'Align end date with calendar month') {
        this.setCustomDateBasedOnAlignCalendarMonth();
      } else if (this.selectedCustomEndDateType.Value === 'End date from existing subscriptions') {
        this.customEndDate = null;
        if (this.product.CategoryName === 'OnlineServicesNCE') {
          let validityType = this.product.ValidityType;
          let validity = this.product.Validity;

          if (this.createOrUpdateScheduledRenewalModel.NewPlanProductId != null && this.createOrUpdateScheduledRenewalModel.NewValidityType != null) {
            validityType = this.createOrUpdateScheduledRenewalModel.NewValidityType;
            validity = this.createOrUpdateScheduledRenewalModel.NewValidity;
            this.isSelectedEndDateAlignWithCalendar = true;
          }

          const reqBody = {
            TenantId: this.product.ServiceProviderCustomerRefId,
            Validity: validity,
            ValidityType: validityType,
            CustomEndDateType: 'subscriptionAligned',
            StartDate: this.currentProductRenewalDate,
            InternalCustomerProductId: this.internalCustomerProductId,
            TargetPlanProductId: this.createOrUpdateScheduledRenewalModel.NewPlanProductId,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId
          };

          const subscription = this._manageProductService.getCoterminousEndDatesForScheduling(reqBody).pipe(
            catchError((err) => {
              let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
              this._toastService.error(errmsg, {
                timeOut: 10000
              });
              return of(null);
            })).subscribe((response: any) => {
              this.ExistingSubscriptions = response.Data;
              const modalRef = this._modalService.open(CustomEnddatePopupComponent, { size: 'lg' });
              modalRef.componentInstance.existingSubscriptions = response.Data;
              modalRef.result.then((result) => {
                if (result) {
                  this.customEndDate = result.ProviderEffectiveEndDate;
                  if (this.customEndDate) {
                    this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = moment(this.customEndDate).format('LL');
                    this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = false;
                  } else {
                    this.selectedCustomEndDateType = this.customEndDateTypes.find(endDateType => endDateType.Value === 'Default');
                    if (this.selectedCustomEndDateType && this.selectedCustomEndDateType.Value === 'Default') {
                      this.customEndDate = null;
                      this.createOrUpdateScheduledRenewalModel.EndDateType = this.selectedCustomEndDateType.Value;
                      this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = null;
                      this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = false;
                      this.selectedCustomEndDateTypeId = this.selectedCustomEndDateType.Id;
                    }
                  }
                }
              },
                (reason) => {
                  /* Closing modal reference if cancelled or clicked outside of the popup*/
                  this.selectedCustomEndDateType = _.find(this.customEndDateTypes, (endDateType) => { return endDateType.Value == 'Default' });
                  if (this.selectedCustomEndDateType.Value === 'Default') {
                    this.customEndDate = null;
                    this.createOrUpdateScheduledRenewalModel.EndDateType = this.selectedCustomEndDateType.Value;
                    this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = null;
                    this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = false;
                    this.selectedCustomEndDateTypeId = this.selectedCustomEndDateType.Id;
                  }
                  modalRef.close();
                });

              () => {
                // this.selectedCustomEndDateType = _.find(this.customEndDateTypes, (endDateType) => { return endDateType.Value == 'Default' });
                // if (this.selectedCustomEndDateType.Value === 'Default') {
                //   this.customEndDate = null;
                //   this.createOrUpdateScheduledRenewalModel.EndDateType = this.selectedCustomEndDateType.Value;
                //   this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = null;
                //   this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = false;
                // }
              }
            });
            this._subscriptionArray.push(subscription);
        } else {
          const model = {
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            TenantId: this.product.ServiceProviderCustomerRefId,
            InternalCustomerProductId: this.internalCustomerProductId,
            TargetPlanProductId: this.createOrUpdateScheduledRenewalModel.NewPlanProductId
          };

          const subscription = this._manageProductService.productsWithCoterminousEndDatesForScheduling(model).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.ExistingSubscriptions = response.Data;
            const modalRef = this._modalService.open(CustomEnddatePopupComponent, { size: 'lg' });
            modalRef.componentInstance.data = response.Data;
            modalRef.result.then((result) => {
              if (result) {
                this.customEndDate = result.ProviderEffectiveEndDate;
                if (this.customEndDate) {
                  this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = moment(this.customEndDate).format('LL');
                  this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = false;
                } else {
                  this.selectedCustomEndDateType = _.find(this.customEndDateTypes, endDateType => { return endDateType.Value === 'Default' });
                  if (this.selectedCustomEndDateType && this.selectedCustomEndDateType.Value === 'Default') {
                    this.customEndDate = null;
                    this.createOrUpdateScheduledRenewalModel.EndDateType = this.selectedCustomEndDateType.Value;
                    this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = null;
                    this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = false;
                    this.selectedCustomEndDateTypeId = this.selectedCustomEndDateType.Id;
                  }
                }
              }
            },
              (reason) => {
                /* Closing modal reference if cancelled or clicked outside of the popup*/
                this.selectedCustomEndDateType = _.find(this.customEndDateTypes, (endDateType) => { return endDateType.Value == 'Default' });
                if (this.selectedCustomEndDateType.Value === 'Default') {
                  this.customEndDate = null;
                  this.createOrUpdateScheduledRenewalModel.EndDateType = this.selectedCustomEndDateType.Value;
                  this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = null;
                  this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = false;
                  this.selectedCustomEndDateTypeId = this.selectedCustomEndDateType.Id;
                }
                modalRef.close();
              });

            () => {
              // this.selectedCustomEndDateType = _.find(this.customEndDateTypes, (endDateType) => { return endDateType.Value == 'Default' });
              // if (this.selectedCustomEndDateType.Value === 'Default') {
              //   this.customEndDate = null;
              //   this.createOrUpdateScheduledRenewalModel.EndDateType = this.selectedCustomEndDateType.Value;
              //   this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = null;
              //   this.createOrUpdateScheduledRenewalModel.NewEndDateIsAlignWithCalendar = false;
              // }
            }
          });
          this._subscriptionArray.push(subscription);
        }
      }
    }
  }

  cancelScheduledRenewal(scheduledRenewal) {
    this.oldScheduledProductName = null;
    this.oldScheduledValidity = null;
    this.oldScheduledValidityType = null;
    this.oldScheduledBillingCycleName = null;
    this.oldScheduledPlanProductId = null;

    const modalRef = this._modalService.open(CancelScheduledRenewalReasonPopupComponent, { size: 'lg' });
    modalRef.result.then((reason) => {
      if (reason) {
        this.cancelledReason = reason;

        if (this.cancelledReason) {
          const model = {
            C3CustomerId: this.product.C3CustomerId,
            ServiceProviderCustomerRefId: this.product.ServiceProviderCustomerRefId,
            ProviderProductId: this.product.ProviderProductId,
            InternalCustomerProductId: this.product.InternalCustomerProductId,
            InternalScheduleRenewalId: scheduledRenewal.InternalScheduleRenewalId,
            CancelledReason: this.cancelledReason,
            SupportedMarketCode: this.product.SupportedMarketCode
          };

          const subscription = this._manageProductService.cancelScheduledRenewal(model).pipe(takeUntil(this.destroy$)).subscribe(
            (response: any) => {
              if (response.Status === 'Success') {
                this._toastService.success(this._translateService.instant('TRANSLATE.CANCEL_SCHEDULED_RENEWAL_SUCCESS_MESSAGE'));
                this.handleTableConfig();
              } else {
                this._toastService.error(this._translateService.instant('TRANSLATE.CANCEL_SCHEDULED_RENEWAL_FAILED_MESSAGE'));
                this.handleTableConfig();
              }
            });
            this._subscriptionArray.push(subscription);
        }
      }
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  callCreateOrUpdateScheduledRenewal = _.debounce(() => {
    this.isDisableSubmitButton = true;
    this.createOrUpdateScheduledRenewal();
  }, 1000, { leading: true });

  createOrUpdateScheduledRenewal() {
    this.createOrUpdateScheduledRenewalModel.IsAgreedOnTermsAndCondition = this.isAgreedOnTermsAndCondition;
    this.createOrUpdateScheduledRenewalModel.IsESTOffer = this.product.IsEST;
    if ((this.createOrUpdateScheduledRenewalModel.IsAgreedOnTermsAndCondition === null || !this.createOrUpdateScheduledRenewalModel.IsAgreedOnTermsAndCondition) && this.showTermsAndConditionsForSubscriptionUpdate === 'true') {
      this._toastService.error(this._translateService.instant('TRANSLATE.NCE_TERMS_AND_CONDITION_IS_NOT_ACCEPTED_ERROR_MESSAGE'));
      this.isDisableSubmitButton = false;
      return;
    }
    var termsAndConditions = null;
    if (this.NCETermsAndConditionURL !== null && this.NCETermsAndConditionURL !== '' && this.showTermsAndConditionsForSubscriptionUpdate === 'true') {
      termsAndConditions = this.NCETermsAndConditionURL;
    }
    // let termsAndConditions = null;
    // if (this.createOrUpdateScheduledRenewalModel.NCETermsAndConditionURL !== null && this.createOrUpdateScheduledRenewalModel.NCETermsAndConditionURL !== '' && this.createOrUpdateScheduledRenewalModel.ShowTermsAndConditionsForSubscriptionUpdate === 'true') {
    //   termsAndConditions = this.createOrUpdateScheduledRenewalModel.NCETermsAndConditionURL;
    // }

    if (!this.product.AllowCustomerToreduceSeats && this.product.CummulativeQuantity > this.createOrUpdateScheduledRenewalModel.NewQuantity) {
      if (this.product.CummulativeQuantity != this.createOrUpdateScheduledRenewalModel.NewQuantity && this.oldScheduledQuantity != 0) {
        this.createOrUpdateScheduledRenewalModel.NewQuantity = this.oldScheduledQuantity;
      } else {
        this.createOrUpdateScheduledRenewalModel.NewQuantity = this.createOrUpdateScheduledRenewalModel.product.CummulativeQuantity;
      }
      this._toastService.info(this._translateService.instant('TRANSLATE.MANAGE_RENEWAL_ALERT_MESSAGE_REDUCE_THE_QUANTITY'));
      this.isDisableSubmitButton = false;
      return;
    }

    const isUpgrade = !(this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId === undefined || this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId === null || this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId === '');

    if (this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId === undefined || this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId === null || this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId === '') {
      this.createOrUpdateScheduledRenewalModel.TargetProductName = this.product.PlanProductName;
      this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId = this.product.ProviderReferenceId;
      this.createOrUpdateScheduledRenewalModel.NewPlanProductId = this.product.PlanProductId;
      this.createOrUpdateScheduledRenewalModel.NewValidity = this.product.Validity;
      this.createOrUpdateScheduledRenewalModel.NewValidityType = this.product.ValidityType;
      this.createOrUpdateScheduledRenewalModel.NewBillingCycleId = this.product.BillingCycleId;
      this.createOrUpdateScheduledRenewalModel.NewBillingCycleName = this.product.BillingCycleName;
      this.createOrUpdateScheduledRenewalModel.IsAlreadyOnhold = this.product.IsAlreadyOnhold;
      this.createOrUpdateScheduledRenewalModel.Price = this.product.FinalSalePrice;
      this.createOrUpdateScheduledRenewalModel.PlanProductCurrentLicenseCount = this.product.PlanProductCurrentLicenseCount;
      this.createOrUpdateScheduledRenewalModel.NumberOfLicensesCustomerCanPurchase = this.product.NumberOfLicensesCustomerCanPurchase;

      if (this.product.TransactionAmountLimit === undefined || this.product.TransactionAmountLimit === null || this.product.TransactionAmountLimit === '') {
        this.createOrUpdateScheduledRenewalModel.TransactionAmountLimit = null;
      } else {
        this.createOrUpdateScheduledRenewalModel.TransactionAmountLimit = this.product.TransactionAmountLimit;
      }
      this.createOrUpdateScheduledRenewalModel.ConsumptionTypeId = this.product.ConsumptionTypeId;
      this.createOrUpdateScheduledRenewalModel.PlanProductName = this.product.PlanProductName;
    }

    if (this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate != undefined && this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate != null && this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate != '') {
      this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate = moment(this.createOrUpdateScheduledRenewalModel.NewProviderEffectiveEndDate).format('LL');
    }
    this.createOrUpdateScheduledRenewalModel.SourceQuantity = this.product.CummulativeQuantity;
    this.createOrUpdateScheduledRenewalModel.CummulativeQuantity = this.createOrUpdateScheduledRenewalModel.SourceSeatsUpgradeQuantity;
    this.createOrUpdateScheduledRenewalModel.ProviderProductId = this.product.ProviderProductId;

    this.emitLimitMessageEvent(this.createOrUpdateScheduledRenewalModel, isUpgrade, this.createOrUpdateScheduledRenewalModel.NewQuantity);
    this.createOrUpdateScheduledRenewalModel.IsSeatLimitExceeded = this.isSeatLimitExceed;
    this.createOrUpdateScheduledRenewalModel.IsTransactionLimitExceeded = this.transactionAmountLimit > 0 && this.product.TotalTransactionAmount + this.currentNewPurchasePrice > this.transactionAmountLimit;
    this.createOrUpdateScheduledRenewalModel.SupportedMarketCode = this.createOrUpdateScheduledRenewalModel.SupportedMarketCode;
    this.createOrUpdateScheduledRenewalModel.TermsAndConditionsUrl = termsAndConditions;

    if (this.pageMode == "Edit") {
      if (this.previouslyApprovedQuantity < this.createOrUpdateScheduledRenewalModel.NewQuantity || this.createOrUpdateScheduledRenewalModel.NewPlanProductId != this.oldScheduledPlanProductId) {
        this.createOrUpdateScheduledRenewalModel.IsSeatLimitExceeded = this.isSeatLimitExceed;
      } else {
        this.createOrUpdateScheduledRenewalModel.IsSeatLimitExceeded = false;
      }

      if (this.createOrUpdateScheduledRenewalModel.NewPlanProductId == this.oldScheduledPlanProductId) {
        if (this.previouslyApprovedQuantity >= this.createOrUpdateScheduledRenewalModel.NewQuantity) {
          this.createOrUpdateScheduledRenewalModel.IsTransactionLimitExceeded = false;
        }
      }
      if (this.previousApprovedTransactionLimit >= this.currentNewPurchasePrice) {
        this.createOrUpdateScheduledRenewalModel.IsTransactionLimitExceeded = false;
      }
    }
    if (this.createOrUpdateScheduledRenewalModel.IsSeatLimitExceeded || this.createOrUpdateScheduledRenewalModel.IsTransactionLimitExceeded) {
      const limitText = this.isSeatLimitExceed && this.createOrUpdateScheduledRenewalModel.IsTransactionLimitExceeded
        ? 'seat limit and transaction limit'
        : (this.isSeatLimitExceed ? 'seat limit is' : 'transaction limit is');
      const confirmationMessage = this._translateService.instant('TRANSLATE.SUBSCRIPTION_NEXTSCHEDULING_CHANGES_PROCEED_WITH_LIMIT_IS_SURPASSED', {
        limitText: limitText
      });
      this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
        if (result.isConfirmed) {
          const subscription= this._manageProductService.createOrUpdateScheduledRenewal(this.product.InternalCustomerProductId, this.createOrUpdateScheduledRenewalModel)
            .pipe(
              // catchError((err) => {
              //   let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
              //   this._toastService.error(errmsg, {
              //     timeOut: 10000
              //   });
              //   this._cdRef.detectChanges();
              //   this.isDisableSubmitButton = false;
              //   return of(null);
              // })
            ).subscribe((response: any) => {
              if (response.Status === "Success") {
                this.pageMode = "List";
                this.isDisableSubmitButton = false;
                this.isAgreedOnTermsAndCondition = false;
                this.handleTableConfig();
              }
            });
            this._subscriptionArray.push(subscription);
        }
        this.isDisableSubmitButton = false;
        this.emitLimitMessageEvent(this.product);

      })
    } else {
      const subscription = this._manageProductService.createOrUpdateScheduledRenewal(this.product.InternalCustomerProductId, this.createOrUpdateScheduledRenewalModel)
        .pipe(
          // catchError((err) => {
          //   let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
          //   this._toastService.error(errmsg, {
          //     timeOut: 10000
          //   });
          //   this._cdRef.detectChanges();
          //   this.isDisableSubmitButton = false;
          //   return of(null);
          // })
        ).subscribe((response: any) => {
          if (response.Status === "Success") {
            this.pageMode = "List";
            this.isDisableSubmitButton = false;
            this.isAgreedOnTermsAndCondition = false;
            this.handleTableConfig();
          }
        });
        this._subscriptionArray.push(subscription);
    }

  }

  cancelChangesInManageRenewal() {
    this.createOrUpdateScheduledRenewalModel = null;
    this.selectedCustomEndDateType = null;
    this.customEndDate = null;
    this.isSelectedEndDateAlignWithCalendar = false;
    this.cumulativeQuantityForCurrentProduct = this.product.TotalCumulativeQuantity;
    this.selectedPlanProduct = null;
    this.productsWithCoterminousEndDatesForScheduling = [];
    this.isAgreedOnTermsAndCondition = false;
    this.pageMode = 'List';
    this.handleTableConfig();
  }

  updateScheduledRenewal(scheduledRenewal: any) {
    this.selectedCustomEndDateType = null;
    this.customEndDate = null;
    this.isSelectedEndDateAlignWithCalendar = false;
    this.oldScheduledProductName = scheduledRenewal.PlanProductName;
    this.oldScheduledValidity = scheduledRenewal.NewValidity;
    this.oldScheduledValidityType = scheduledRenewal.NewValidityType;
    this.oldScheduledBillingCycleName = scheduledRenewal.NewBillingCycle;
    this.oldScheduledPlanProductId = scheduledRenewal.NewPlanProductId;
    this.previouslyApprovedQuantity = scheduledRenewal.NewQuantity;

    //Setting the custom end date type based on the existing scheduled renewal
    this.selectedCustomEndDateType = this.customEndDateTypes.find(endDateType =>
      endDateType.Value === scheduledRenewal.EndDateType
    );
    this.selectedCustomEndDateTypeId = this.selectedCustomEndDateType.Id;

    this.customEndDate = scheduledRenewal.NewProviderEffectiveEndDate;
    this.isSelectedEndDateAlignWithCalendar = scheduledRenewal.NewEndDateIsAlignWithCalendar;

    this.createOrUpdateScheduledRenewalModel = new CreateOrUpdateScheduledRenewalModel({
      C3CustomerId: this.product.C3CustomerId,
      InternalCustomerProductId: this.product.InternalCustomerProductId,
      SourceProductName: this.product.PlanProductName,
      SourcePlanProductId: this.product.PlanProductId,
      ServiceProviderCustomerRefId: this.product.ServiceProviderCustomerRefId,
      ProviderProductId: this.product.ProviderProductId,
      SourceProviderReferenceId: this.product.ProviderReferenceId,
      SourceValidity: this.product.Validity,
      SourceValidityType: this.product.ValidityType,
      BillingCycleName: this.product.BillingCycleName,
      OldQuantity: this.cumulativeQuantityForCurrentProduct,
      SourceQuantity: this.cumulativeQuantityForCurrentProduct,
      NewQuantity: scheduledRenewal.NewQuantity,
      TargetProductName: scheduledRenewal.PlanProductName,
      TargetProviderReferenceId: scheduledRenewal.NewProviderReferenceId,
      NewPlanProductId: scheduledRenewal.NewPlanProductId,
      NewValidity: scheduledRenewal.NewValidity,
      NewValidityType: scheduledRenewal.NewValidityType,
      NewBillingCycleId: scheduledRenewal.NewBillingCycleId,
      NewBillingCycleName: scheduledRenewal.NewBillingCycle,
      SupportedMarketCode: this.product.SupportedMarketCode,
      Price: scheduledRenewal.FinalSalePrice,
      NumberOfLicensesCustomerCanPurchase: scheduledRenewal.NumberOfLicensesCustomerCanPurchase,
      NewProviderEffectiveEndDate: scheduledRenewal.NewProviderEffectiveEndDate ? this.localTimeConvert(scheduledRenewal.NewProviderEffectiveEndDate) : null,
      NewEndDateIsAlignWithCalendar: scheduledRenewal.NewEndDateIsAlignWithCalendar,
      EndDateType: this.selectedCustomEndDateType.Value,
      InternalScheduleRenewalId: scheduledRenewal.InternalScheduleRenewalId
    });

    this.oldScheduledQuantity = scheduledRenewal.NewQuantity;

    const isUpgrade = !(this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId === undefined || this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId === null || this.createOrUpdateScheduledRenewalModel.TargetProviderReferenceId === '');

    this.emitLimitMessageEvent(this.createOrUpdateScheduledRenewalModel, isUpgrade, this.createOrUpdateScheduledRenewalModel.NewQuantity);

    if (this.currentNewPurchasePrice >= 0) {
      this.previousApprovedTransactionLimit = this.currentNewPurchasePrice;
    }

    this.currentNewPurchasePrice = 0.0;
    this.pageMode = 'Edit';

  }

  localTimeConvert(date) {
    return moment(date).local().toDate();
  }

  resetItemsBeforeCheckQuantity() {
    this.isSeatLimitExceed = false;
    this.currentNewPurchasePrice = 0.0;
    this.seatLimitExceedProductName = '';
    //this.numberOfLicensesCustomerCanPurchase = 0;
  }

  checkQuantity(product: any, isUpgrade: boolean = false) {
    // Make sure before calling this function , you are calling ResetItemsBeforeCheckQuantity() function also
    let result = false;
    let targetQuantity = product.NewQuantity - product.OldQuantity;
    let oldQuantity = isUpgrade ? 0 : product.OldQuantity;

    if (!this.isAlreadyOnhold) {
      this.isAlreadyOnhold = product.IsAlreadyOnhold;
    }

    if (product.OldQuantity < product.NewQuantity || isUpgrade) {
      let multiplier = 1.0;

      if (product.NewBillingCycleName == 'Triennial') {
        if (product.Validity == 3) {
          multiplier = 1.0;
        }
      }
      if (product.NewBillingCycleName == 'Annual') {
        if (product.Validity == 3) {
          multiplier = 3.0;
        }
      }
      if (product.NewBillingCycleName == 'Monthly') {
        if (product.Validity == 1 && product.ValidityType == 'Year(s)') {
          multiplier = 12.0;
        }
        if (product.Validity == 3 && product.ValidityType == 'Year(s)') {
          multiplier = 36.0;
        }
      }
      if (isUpgrade) {
        targetQuantity = product.NewQuantity;
      }

      this.currentNewPurchasePrice = this.currentNewPurchasePrice + (product.Price * (targetQuantity) * multiplier)
    }

    if (!this.isSeatLimitExceed) {
      let totalQuantity = (product.PlanProductCurrentLicenseCount - oldQuantity) + product.NewQuantity
      if (totalQuantity > product.NumberOfLicensesCustomerCanPurchase && product.NumberOfLicensesCustomerCanPurchase != 0) {
        this.isSeatLimitExceed = oldQuantity < product.NewQuantity;
        this.seatLimitExceedProductName = product.ProductSubscriptionName == null ? product.PlanProductName : product.ProductSubscriptionName;
        this.numberOfLicensesCustomerCanPurchase = product.NumberOfLicensesCustomerCanPurchase;
      }
    }
    if ((product.CummulativeQuantity - (oldQuantity - product.NewQuantity)) === 0 && product.ConsumptionTypeId) {
      return true;
    }
    else {
      if (product.Addons && product.Addons.length > 0) {
        for (let eachAddon of product.Addons) {
          if (product.CummulativeQuantity == 0 && product.Quantity == 0 && eachAddon.Quantity > 0) {
            this.invalidChildOffer.push(eachAddon.PlanProductName);
          }
          //Check and return if any of the add-on has Zero Quantity (second or third level add-on)
          if (this.checkQuantity(eachAddon)) {
            result = true;
            return true;
          }
        }
      }
    }
    return result;
  }

  updateQuantityForRenewal(selectedPlanProduct: any, newQuantity: number) {
    if (selectedPlanProduct && newQuantity) {
      selectedPlanProduct.Quantity = newQuantity;
      selectedPlanProduct.Price = selectedPlanProduct.FinalSalePrice;
      selectedPlanProduct.OldQuantity = 0;
      selectedPlanProduct.ProviderProductId = null;

      this.emitLimitMessageEvent(selectedPlanProduct, true, newQuantity);
    }
  }

  emitLimitMessageEvent(product: any, isUpgrade: boolean = false, targetQuantity: number = null) {
    this.resetItemsBeforeCheckQuantity();
    this.checkQuantity(product, isUpgrade);

    if (isUpgrade) {
      let multiplier = 1.0;
      if (this.product.BillingCycleName == 'Triennial') {
        if (product.Validity == 3) {
          multiplier = 1.0;
        }
      }
      if (this.product.BillingCycleName == 'Annual') {
        if (this.product.Validity == 3) {
          multiplier = 3.0;
        }
      }
      if (this.product.BillingCycleName == 'Monthly') {
        if (this.product.Validity == 1 && this.product.ValidityType == 'Year(s)') {
          multiplier = 12.0;
        }
        if (this.product.Validity == 3 && this.product.ValidityType == 'Year(s)') {
          multiplier = 36.0;
        }
      }
      this.currentNewPurchasePrice = this.currentNewPurchasePrice - (this.product.Price * targetQuantity * multiplier);
    }

    const data: DataSharingModel = {
      type: EVENT_TYPE.EVENT_CUSTOMER_PRODUCTS_TRANSACTION_LIMIT_DATA,
      data: {
        TransactionAmountLimit: this.product.TransactionAmountLimit,
        TotalTransactionAmount: this.product.TotalTransactionAmount,
        CurrentNewPurchasePrice: this.currentNewPurchasePrice
      }
    };

    this._commonEventTrigerredService.setDataForParentFromChild(data);
    this._cdRef.detectChanges();
  }

  hideCursorInNgSelect() {
    setTimeout(() => {
      const inputElement = document.querySelector('ng-select input');
      if (inputElement) {
        (inputElement as HTMLElement).blur();  // Remove focus after selection
      }
    }, 100);
  }

  ngOnDestroy(){
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
