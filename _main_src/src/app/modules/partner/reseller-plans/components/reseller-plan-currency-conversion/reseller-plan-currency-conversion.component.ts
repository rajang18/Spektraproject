import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ResellerPlansListingService } from '../../services/resellerplans-listing.service';
import { TranslateService } from '@ngx-translate/core';
import { PermissionService } from 'src/app/services/permission.service';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { GetResellerPlanProductDetails, GetResellerPlansDetails } from '../../models/reseller-plan.model';
import { CurrencyCodeData, TargetCurrencyData } from 'src/app/shared/models/common';
import { combineLatest, iif, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { MODAL_DIALOG_CLASS, PromotionDetailsPopupConfig } from 'src/app/shared/models/promoton-details.model';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
@Component({
  selector: 'app-reseller-plan-currency-conversion',
  templateUrl: './reseller-plan-currency-conversion.component.html',
  styleUrl: './reseller-plan-currency-conversion.component.scss'
})
export class ResellerPlanCurrencyConversionComponent extends C3BaseComponent implements OnInit,OnDestroy {

  //todo: validation, add , API save 
  planDetailsRegisterForm: FormGroup;
  planDetails: GetResellerPlansDetails = new GetResellerPlansDetails();
  planProductDetails: GetResellerPlanProductDetails[] = [];
  internalPlanId: string | null = null;
  pageMode = 'DefineTargetCurrency';
  currencyCodes: CurrencyCodeData[] = [];
  targetCurrencyCodes: TargetCurrencyData[] = [];
  searchCriteria = {};
  frmPlanProductCurrency = {};
  targetCurrencyCode: string | null = null;
  planTargetCurrency: TargetCurrencyData;
  currencyConvertRate = 0;
  internalPlanIdForApi: string | null = null;
  targetCurrencyCodeForApi: string | null = null;
  buttonClicked = false;
  isDataLoaded = false;
  targetCurrencyCodeFromForm: string | null = null;
  datatableConfig: ADTSettings;
  planProductsDataSource: any[] = []; 
  isLoading: boolean = true;

  @ViewChild('planName') planName: TemplateRef<any>;
  @ViewChild('providerPrice') providerPrice: TemplateRef<any>;
  @ViewChild('salePrice') salePrice: TemplateRef<any>;
  @ViewChild('customHeader') customHeader: TemplateRef<any>;



  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private _modalService:NgbModal,
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _planService: ResellerPlansListingService,
    public pageInfo: PageInfoService,
    private translateService: TranslateService,
    public router: Router,
    public permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService
  ) {

    super(permissionService, _dynamicTemplateService, router, _appService);
    this.planDetailsRegisterForm = this._formBuilder.group({
      planName: ['', Validators.required],
      planCurrencyCode: ['', Validators.required],
      targetCurrencyCode: ['', Validators.required]
    });

    this.navigation = this._router.getCurrentNavigation();
    if (!this.navigation ?.extras.state?.['planId']) {
      localStorage.setItem('planinfo', "");
      this._router.navigate([`partner/resellerplans`]);
    }
    this.internalPlanId = this.navigation?.extras.state?.['planId'];
  }

  Permissions = {
    HasSaveResellerPlanCurrencyConversion: "Denied",
    AreNcePromotionsEnabled: "Denied"
  };

  hasPermission() {
    this.Permissions.HasSaveResellerPlanCurrencyConversion = this.permissionService.hasPermission('ACTION_SAVE_RESELLER_PLAN_IN_OTHER_CURRENCY');
    this.Permissions.AreNcePromotionsEnabled = this.permissionService.hasPermission('ARE_NCE_PROMOTIONS_ENABLED');
  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT','PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS'])
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.PLAN_PRODUCTS_CURRENCY_CONVERSION_TITLE_DEFINE_NEW_CURRENCY"), true);
    
    this.hasPermission();
    this.getPlanDetails();
  }

  getPlanDetails() {
    const subscription = combineLatest([
      this._planService.getCodes(),
    ]).pipe(
      switchMap(([currencyCode]) => {
        this.currencyCodes = currencyCode;

        return iif(() => !!this.internalPlanId,
          this._planService.getResellerPlanDetails(this.internalPlanId),
          of(null)
        )
      }),
      switchMap(plansDetail => {
        if (plansDetail) {
          this.planDetails = <GetResellerPlansDetails>plansDetail;
          this.planDetailsRegisterForm.get('planCurrencyCode')?.disable();
          return this._planService.getTargetCurrency(this.planDetails.CurrencyCode);
        }

        let currencyCode = this._appService.$rootScope.settings.CurrencyCode;
        if (currencyCode == undefined || currencyCode == null || currencyCode == '' || currencyCode == "" || currencyCode == "null") {
          currencyCode = "USD"
        }
        return this._planService.getTargetCurrency(currencyCode);
      })).pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.targetCurrencyCodes = <TargetCurrencyData[]>res;
        this.isDataLoaded = true;
        this.setFormData();
        this._cdref.detectChanges();
      });
      this._subscriptionArray.push(subscription);
  }

  setFormData() {
    if (this.pageMode == "DefineTargetCurrency") {
      this.planDetailsRegisterForm.setValue({
        planName: this.planDetails.Name,
        planCurrencyCode: this.planDetails.CurrencyCode,
        targetCurrencyCode: ""
      })
    }
  }

  setPlanData() {
    this.targetCurrencyCodeFromForm = this.planDetailsRegisterForm.get("targetCurrencyCode")?.value;
  }

  updatePageMode(pageMode: string) {

    // var broadcastMessage = "cutomer-planproductcurrencyconversion-";

    // broadcastMessage = broadcastMessage + pageMode;

    // $rootScope.$broadcast("QuickSideBarEvent", broadcastMessage);
    this.pageMode = pageMode;
    this._cdref.detectChanges();
  }

  loadOffers() {
    this.buttonClicked = true;
    this.setPlanData();
    this.targetCurrencyCodes.forEach(item => {
      if (item.TargetCurrency == this.targetCurrencyCodeFromForm) {
        this.planTargetCurrency = item;
      }
    })
    if (this.planDetailsRegisterForm.valid) {
      this.internalPlanIdForApi = this.internalPlanId;
      this.targetCurrencyCodeForApi = this.planTargetCurrency.TargetCurrency;
      this.targetCurrencyCode = this.planTargetCurrency.TargetCurrency;
      this.currencyConvertRate = this.planTargetCurrency.ConversionRate;
      this.updatePageMode('DefinePlanprices');
      this.handleTableConfig();
    }
  }
  handleTableConfig() {
    let subscription
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: false,
        ordering:false,
        pagingType: 'full_numbers',
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          self.isLoading = true;
          const subscription = this._planService
            .getPlanProductsInTargetCurrency(this.internalPlanId, this.planTargetCurrency.TargetCurrency)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              const updatedData = Data.map((each: any) => {
                each.OriginalTargetSalePrice = each.TargetSalePrice;
                return each;
              });
              this.planProductsDataSource = updatedData;
              self.isLoading = false;
              let recordsTotal = 0;
              if (updatedData.length > 0) {
                recordsTotal = updatedData.length;
              }
              callback({
                data: updatedData,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        columns: [
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_TABLE_HEADER_TEXT_NAME'),
            className: "col-md-6 col-6 col-sm-6 col-lg-6 header-custom-title text-start",
            defaultContent: '',
            ngTemplateRef: {
              ref: this.planName,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
          },

          {
            title: this.translateService.instant('TRANSLATE.LABLE_TEXT_PROVIDER_SELLING_PRICE'),
            className: "col-md-3 col-3 col-sm-3 col-lg-3 text-end",
            defaultContent: '',
            ngTemplateRef: {
              ref: this.providerPrice,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
          },

          {
            title: this.translateService.instant('TRANSLATE.LABLE_TEXT_PROVIDER_SELLING_PRICE'),
            className: "col-md-3 col-3 col-sm-3 col-lg-3 text-end",
            defaultContent: '',
            ngTemplateRef: {
              ref: this.salePrice,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
          }
        ],
      };
      this._cdref.detectChanges();
    });
  }

  

  submitDetails() {
    let planProductIdOfBundles: any[] = [];
    let planProductsDataWithApplyMacroCheck = this.planProductsDataSource.map((each: any) => {
      if (each.OriginalTargetSalePrice != each.TargetSalePrice) {
        each.ShouldApplyMacro = false;
        if (each.CompositeProductId === null) {
          planProductIdOfBundles.push(each.PlanProductId);
        }
      }
      return each;
    });
    planProductsDataWithApplyMacroCheck = planProductsDataWithApplyMacroCheck.map((each: any) => {
      if (planProductIdOfBundles.indexOf(each.CompositeProductId) > -1) {
        each.ShouldApplyMacro = false;
      }
      return each;
    });
    var reqBody = { PlanProductsData: JSON.stringify(planProductsDataWithApplyMacroCheck) };
    const subscription = this._planService.submitCurrencyConversionDetails(this.internalPlanId, this.planTargetCurrency.TargetCurrency, reqBody).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this._router.navigate([`partner/resellerplans`]);
    })
    this._subscriptionArray.push(subscription);
  }
  checkNcePromotionDetails(row: GetResellerPlanProductDetails) {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    promotionDetailsConfig.Name = row.PromotionName,
      promotionDetailsConfig.PromotionalId = row.NCEPromotionID,
      promotionDetailsConfig.Description = row.PromotionDescription,
      promotionDetailsConfig.Validity = row.Validity,
      promotionDetailsConfig.ValidityType = row.ValidityType,
      promotionDetailsConfig.BillingCycleName = row.BillingCycleName,
      promotionDetailsConfig.BillingCycleDescriptionKey = row.BillingCycleDescriptionKey,
      promotionDetailsConfig.Discount = row.PromotionDiscount,
      promotionDetailsConfig.DiscountType = row.PromotionDiscountType,
      promotionDetailsConfig.EndDate = row.PromotionEndDate,
      promotionDetailsConfig.IsPromotionAvailableForCustomer = false,
      promotionDetailsConfig.ShowPromotionLink = row.ShowPromotionLink
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: MODAL_DIALOG_CLASS,
    };
    const modalRef = this._modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }
  onCaptureEvent(event: Event) { }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  backToPlans(){
    let callback = ()=>{ 
      this.c3RouterService.backToHistory(this.keyForData,`partner/resellerplans`);
    }
    this._unsavedChangesService.setUnsavedChanges(this.planDetailsRegisterForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
}
