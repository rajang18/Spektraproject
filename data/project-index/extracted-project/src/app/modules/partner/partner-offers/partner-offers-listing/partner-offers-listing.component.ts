import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PartnerOffersListingService } from 'src/app/modules/partner/partner-offers/services/partner-offers-listing.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import Swal from 'sweetalert2';
import { CommonService } from 'src/app/services/common.service';
import { FileService } from 'src/app/services/file.service';
import {
  MODAL_DIALOG_CLASS,
  ReportPopupConfig,
} from 'src/app/shared/models/report-popup.model';
import { ReportPopupComponent } from 'src/app/modules/standalones/report-popup/report-popup.component';
import { BillingCycles, BillingTypes, Categories, TermDuration, consumptionTypes } from 'src/app/shared/models/common';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import _ from 'lodash';
import { NgSelectComponent } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { trailDays } from '../partner-offers.module';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { forkJoin, takeUntil } from 'rxjs';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Component({
  selector: 'app-partner-offers-listing',
  templateUrl: './partner-offers-listing.component.html',
  styleUrl: './partner-offers-listing.component.scss',
})
export class PartnerOffersListingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  customerImpersonateConfig: ADTSettings;
  isEditing: boolean[] = [];
  offerId: number;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('description') description: TemplateRef<any>;
  @ViewChild('priceForPartner') priceForPartner: TemplateRef<any>;
  @ViewChild('providerSellingPrice') providerSellingPrice: TemplateRef<any>;
  successMessage = 'Customer Name update success';
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  shouldShowFilter: boolean = false;
  configName: string = "";
  name: string = "";
  providers: any[];
  billingCycles: BillingCycles[] = [];
  billingtypes: BillingTypes[] = [];
  categories: Categories[] = [];
  consumptionTypes: consumptionTypes[] = [];
  productTermDurations: TermDuration[] = [];
  isDisabled: boolean = true;
  configValue: string = '';
  minValidity: number = null;
  maxValidity: number = null;
  selectedValidityType: string = null;
  minCostPrice: number = null;
  maxCostPrice: number = null;
  minSalePrice: number = null;
  maxSalePrice: number = null;
  FeedName: string = null;
  selectedCategories: any[] = [];
  selectedBillingCycles: any[] = [];
  selectedBillingTypes: any[] = [];
  selectedConsumptionTypes: any[] = [];
  selectedCategoryTypes: any[] = [];
  considerDeleted: boolean = false;
  IsTrailOffer: boolean = false;
  selectedValidityTypes: any[] = [];
  trialPeriodDays: trailDays[];
  SelectedTrialDuration: any[] = [];
  TrialDurationSelection: any[] = [];
  subCategories: any[] = [];
  SelectedSubcategoryTypes: any[] = [];

  PageIndex: number = 0;
  length: any;
  SearchKeyWord: string = '';
  SortColumn: string = '';
  SortOrder: string = 'asc';
  PageCount: number = 10;
  Categories: string = 'custom,licensesupported,customtrial';
  BillingCycles: string | null = null;
  BillingTypes: string | null = null;
  ConsumptionTypes: string | null = null;
  ValidityType: string = '';
  ValidityLowerLimit: number | null = null;
  ValidityUpperLimit: number | null = null;
  CostPriceLowerLimit: number | null = null;
  CostPriceUpperLimit: number | null = null;
  SalePriceLowerLimit: number | null = null;
  SalePriceUpperLimit: number | null = null;
  ConsiderDeleted: boolean = false;
  Name: string = '';
  StartInd: number = 1;


  Permissions = {
    HasSaveOrUpdatePartnerOffer: "Denied",
    HasEditPartnerOffer: "Denied",
    HasDeletePartnerOffer: "Denied",
    HasAddPartnerOffer: "Denied",
    HasEditContractOffer: "Denied",
    HasDeleteContractOffer: "Denied",
    HasAddContractOffer: "Denied",
    HasAddUsageBasedPartnerOffer: "Denied",
    HasGetProductTags: "Denied",
    HasAddTrailOffer: "Denied",
    HasFilterTrailOffer: "Denied",
    HasParterTrailOffer: "Denied",
    HasBulkUploadForPartnerOffer: "Denied"
  };
  @ViewChild('selectElement') selectElement!: NgSelectComponent;
  @ViewChild('selectElement1') selectElement1!: NgSelectComponent;
  @ViewChild('selectElement2') selectElement2!: NgSelectComponent;
  @ViewChild('selectElement3') selectElement3!: NgSelectComponent;
  @ViewChild('selectElement4') selectElement4!: NgSelectComponent;
  @ViewChild('selectElement5') selectElement5!: NgSelectComponent;

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (this.selectElement?.isOpen) {
      this.selectElement.close();
    }
    if (this.selectElement1?.isOpen) {
      this.selectElement1.close();
    }
    if (this.selectElement2?.isOpen) {
      this.selectElement2.close();
    }
    if (this.selectElement3?.isOpen) {
      this.selectElement3.close();
    }
    if (this.selectElement4?.isOpen) {
      this.selectElement4.close();
    }
    if (this.selectElement5?.isOpen) {
      this.selectElement5.close();
    }
  }


  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  MeteredBillingBillingTypes: any[];
  constructor(
    private PartnerOffersListingService: PartnerOffersListingService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _commonService: CommonService,
    private _fileService: FileService,
    public pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router,_appService)
      this.navigation = this._router.getCurrentNavigation();
      this.keyForData = this.navigation?.extras.state?.['keyForData']; 
      if (this.keyForData) {
        this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
        this.persistPropertySet();
      }
  }

  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.hasPermission();
    this.handleTableConfig();
    this.getProviders();
    this.getBillingCycles();
    this.getTermDuration();
    this.getBillingTypes();
    this.getConsumptionTypes();
    this.getCategories();
    this.getSubCategories();
    
    if (this.Permissions.HasParterTrailOffer == "Allowed") {
      this.getTrialPeriodDays()
    }

    if (this._commonService.entityName == 'Partner') {
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'CUSTOM_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS']);
    }
    if (this._commonService.entityName == 'Reseller') {
      this.pageInfo.updateBreadcrumbs(['MENUS_SELL', 'CUSTOM_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS']);
    }

    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.CUSTOM_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS"), true);
  }

  hasPermission() {
    this.Permissions.HasSaveOrUpdatePartnerOffer = this._permissionService.hasPermission(this.cloudHubConstants.SAVE_OR_UPDATE_PARTNER_OFFER);
    this.Permissions.HasEditPartnerOffer = this._permissionService.hasPermission(this.cloudHubConstants.EDIT_PARTNER_OFFER);
    this.Permissions.HasDeletePartnerOffer = this._permissionService.hasPermission(this.cloudHubConstants.BTN_DELETE_PARTNER_OFFER);
    this.Permissions.HasAddPartnerOffer = this._permissionService.hasPermission(this.cloudHubConstants.BTN_ADD_PARTNER_OFFER);
    this.Permissions.HasEditContractOffer = this._permissionService.hasPermission(this.cloudHubConstants.BTN_EDIT_CONTRACT_OFFER);
    this.Permissions.HasDeleteContractOffer = this._permissionService.hasPermission(this.cloudHubConstants.BTN_DELETE_CONTRACT_OFFER);
    this.Permissions.HasAddContractOffer = this._permissionService.hasPermission(this.cloudHubConstants.BTN_ADD_CONTRACT_OFFER);
    this.Permissions.HasAddUsageBasedPartnerOffer = this._permissionService.hasPermission(this.cloudHubConstants.ADDUSAGEBASEDPARTNEROFFER);
    this.Permissions.HasGetProductTags = this._permissionService.hasPermission(this.cloudHubConstants.GETPRODUCTTAGS);
    this.Permissions.HasAddTrailOffer = this._permissionService.hasPermission(this.cloudHubConstants.CREATE_PARTNER_TRIAL_OFFER);
    this.Permissions.HasFilterTrailOffer = this._permissionService.hasPermission(this.cloudHubConstants.GET_PARTNER_TRIAL_OFFER_FILTER);
    this.Permissions.HasParterTrailOffer = this._permissionService.hasPermission(this.cloudHubConstants.GET_PARTNER_TRIAL_OFFER);
    this.Permissions.HasBulkUploadForPartnerOffer = this._permissionService.hasPermission(this.cloudHubConstants.BTN_BULK_UPLOAD_PARTNER_OFFER);
  }

  displayFilter() {
    this.shouldShowFilter = !this.shouldShowFilter;
  }

  getProviders() {

   const subscription = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let providers = response;
      this.providers = providers.filter((e: any) => {
        return e.Name !== 'Partner'
      });
    });
    this._subscriptionArray.push(subscription);
  }

  getBillingCycles() {

    const subscription = this._commonService.getConsumptionBillingCycles().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.billingCycles = response;
    });
    this._subscriptionArray.push(subscription);
  }

  getConsumptionTypes() {

    const subscription = this._commonService.getConsumptionTypes().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.consumptionTypes = response;
    });
    this._subscriptionArray.push(subscription);
  }

  formattedPills(value: any) {
    let formatted = value.replace(/([a-z])([A-Z])/g, '$1 $2');
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
    return formatted;
  }

  getCategories() {

    const subscription = this._commonService.getCategories('partnerOffers').pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.categories = response;

      this.categories = _.filter(this.categories, function (item) {
        return item.IsManagedByPartner === true;
      });

        let trialCategory: any = {
          ID: 0,
          Name: "customtrial",
          CategoryDescriptionKey: "CATEGORY_DESC_CUSTOM_TRIAL",
        }
        this.categories.push(trialCategory);    
    });
    this._subscriptionArray.push(subscription);
  }

  getSubCategories() {
    const licenseSupported$ = this._commonService.getSubCategories(CloudHubConstants.CATEGORY_LICENSE_SUPPORTED, false);
    const customCategory$ = this._commonService.getSubCategories(CloudHubConstants.CATEGORY_CUSTOM, false);

    const subscription = forkJoin([licenseSupported$, customCategory$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([licenseSupported, customCategory]: [any, any]) => {
        this.subCategories = [...licenseSupported, ...customCategory];
      });

    this._subscriptionArray.push(subscription);
  }

  getBillingTypes() {

    const subscription = this._commonService.getConsumptionBillingTypes().subscribe((response: any) => {
      let allBillingTypes = response;
      this.MeteredBillingBillingTypes = _.filter(allBillingTypes, each => each.ConsumptionTypeName === 'Usage' && (each.BillingTypeName === 'Price' || each.BillingTypeName === 'Unit'));
      this.billingtypes = _.filter(allBillingTypes, each => !((each.BillingTypeName === 'Price' || each.BillingTypeName === 'Markup') && each.ConsumptionTypeName === 'Usage'));
    });
    this._subscriptionArray.push(subscription);
  }

  getTermDuration() {

   const subscription = this._commonService.getTermDuration().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.productTermDurations = response;
    });
    this._subscriptionArray.push(subscription);
  }

  getTrialPeriodDays() {

    const subscription = this.PartnerOffersListingService.getTrialPeriodDays().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.trialPeriodDays = response;
    });
    this._subscriptionArray.push(subscription);
  }

  // onselectedBillingCycles({
  //   this.planId = this.selectedPlan.InternalPlanId;
  // })

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
            let C3Input = this.c3RouterService.getC3Input();
            if(!C3Input && this.keyForData && this.Name){
              this.c3RouterService.setC3Input(this.Name)
            }else{
              this.Name = C3Input || ''
            }
            this.loaderService.startLoading();
          //this.Name = this.keyForData && (Name === null || Name === undefined || Name === '')? this.Name : Name;
          this.StartInd = this.keyForData && StartInd == 1? this.StartInd : StartInd;
          this.SortColumn = this.keyForData? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData? this.SortOrder : SortOrder;
          this.length = this.keyForData? this.length : length;
          this.keyForData = null;

          let nameFilter = Name;
          if (nameFilter === null || nameFilter === undefined || nameFilter === '') {
            nameFilter = this.Name
          }
          const searchParams = {
            PageIndex: (StartInd - 1) * length + 1,
            SearchKeyWord: Name,
            SortColumn,
            SortOrder,
            PageCount: length - 1,
            Categories: this.selectedCategoryTypes && this.selectedCategoryTypes.length ? this.selectedCategoryTypes.join(",") : "custom,licensesupported,customtrial",
            BillingCycles: this.selectedBillingCycles && this.selectedBillingCycles.length ? this.selectedBillingCycles.join(",") : null,
            BillingTypes: this.selectedBillingTypes && this.selectedBillingTypes.length ? this.selectedBillingTypes.join(",") : null,
            ConsumptionTypes: this.selectedConsumptionTypes && this.selectedConsumptionTypes.length ? this.selectedConsumptionTypes.join(",") : null,
            Validities: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? _.map(this.selectedValidityTypes, 'Validity').join() : null,
            ValidityType: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? _.map(this.selectedValidityTypes, 'ValidityType').join() : null,
            ValidityLowerLimit: this.minValidity,
            ValidityUpperLimit: this.maxValidity,
            CostPriceLowerLimit: this.minCostPrice,
            CostPriceUpperLimit: this.maxCostPrice,
            SalePriceLowerLimit: this.minSalePrice,
            SalePriceUpperLimit: this.maxSalePrice,
            ConsiderDeleted: this.considerDeleted,
            IsTrailOffer: this.IsTrailOffer,
            TrialDuration: this.SelectedTrialDuration && this.SelectedTrialDuration.length > 0 ? this.SelectedTrialDuration.join() : _.map(this.TrialDurationSelection, 'Days').join(),
            SubcategoryIds: this.SelectedSubcategoryTypes && this.SelectedSubcategoryTypes.length ? this.SelectedSubcategoryTypes.join(","): null
          }
          // Apply logic for IsTrailOffer based on selectedCategoryTypes
          if (this.selectedCategoryTypes.length > 0) {
            if (this.selectedCategoryTypes.length == this.categories.length) {
              searchParams.IsTrailOffer = null;
            }
          }
          if (searchParams.Categories != null) {
            if (searchParams.Categories.includes('custom,licensesupported,customtrial')) {
              searchParams.IsTrailOffer = null;
            }
          }
          this.selectedCategoryTypes.forEach(category => {
            if (category.toLowerCase() == this.cloudHubConstants.CATEGORY_CUSTOM_TRIAL) {
              searchParams.IsTrailOffer = true;
            }
          });
          const subscription = this.PartnerOffersListingService.getList(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            if (Data.length > 0) {
              [{ TotalPartnerProductCount: recordsTotal }] = Data;
            }
            this.loaderService.stopLoading();

            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
          });
          this._subscriptionArray.push(subscription);
        },

        columns: [
          {
            searchable: true,
            className: 'col-md-2',
            title: this.translateService.instant('TRANSLATE.CUSTOM_OFFERS_TABLE_HEADER_TEXT_NAME'),
            data: 'Name',
            render: (data: any, type: any, row: any) => {
              let trialSymbol = '';
              if (row.ProductForTrial != null && row.ProductForTrial !== undefined) {
                trialSymbol = `<sup class="text-warning fw-bold">${this.translateService.instant('TRANSLATE.PLAN_MANAGE_TRAIL_OFFER_SYMBOL_TRAIL_OFFER')}</sup>`
              }
              let deletedInfo = '';
              if (!row.IsActive) {
                deletedInfo = `<small class="text-danger datatable-cell">${this.translateService.instant('TRANSLATE.CUSTOM_OFFERS_TEXT_INFO_DELETED')}</small>`;
              }
              return `<span class="fw-semibold">${data}</span> ${trialSymbol} ${deletedInfo}`;
            }
          },
          {
            className: 'col-md-3',
            title: this.translateService.instant('TRANSLATE.CUSTOM_OFFERS_LABEL_TEXT_DESCRIPTION'),
            data: 'Description',
            orderable: false,
            ngTemplateRef: {
              ref: this.description,
            },
          },
          {
            className: 'col-md-4 text-start',
            title: this.translateService.instant('TRANSLATE.CUSTOM_OFFERS_LABEL_TEXT_PROPERTIES'),
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.propertiespills,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },

          {
            className: 'col-md-1 pe-3 text-end',
            title: this.translateService.instant('TRANSLATE.CUSTOM_OFFERS_TABLE_HEADER_TEXT_COST_PRICE'),
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.priceForPartner
            },
          },
          {
            className: 'col-md-1 pe-4 text-end',
            title: this.translateService.instant('TRANSLATE.CUSTOM_OFFERS_TABLE_HEADER_TEXT_SALE_PRICE'),
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.providerSellingPrice
            },
          },
          {
            className: 'col-md-1 text-center',
            title: this.translateService.instant('TRANSLATE.PLAN_TABLE_HEADER_TEXT_ACTIONS'),
            defaultContent: '',
            orderable: false,
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
      this.cdRef.detectChanges();
    });
  }

  getCountryCodeFromCustomers() {

    const subscription = this._commonService.getTermDuration().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.providers = response.Data;
    })
    this._subscriptionArray.push(subscription);
  }

  editPartnerDetails(offer: any, offerType: string) {
    if (offerType == "add") {
      this.offerId = 0;
    }
    else {
      this.offerId = offer.ProductId;
    }
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/customoffer/partnerofferdetails`];
    c3Router.extras = {state: { offerId: this.offerId, offerType: offerType }};
    c3Router.data = this.setData();
    this.c3RouterService.navigate(c3Router);
    // this._router.navigate([`partner/customoffer/partnerofferdetails`]
    //   , { state: { offerId: this.offerId, offerType: offerType } });
  }

  editcontractOfferDetails(offer: any, offerType: string) {
    if (offerType == "add") {
      this.offerId = 0;
    }
    else {
      this.offerId = offer.ProductId;
    }
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/contactofferdetails`];
    c3Router.extras = {state: { offerId: this.offerId, offerType: offerType }};
    c3Router.data = this.setData();
    this.c3RouterService.navigate(c3Router);
    // this._router.navigate([`partner/customoffer/partnerofferdetails`]
    //   , { state: { offerId: this.offerId, offerType: offerType } });
  }

  setData(){
    return{
      StartInd: this.StartInd,
      SearchKeyWord: this.SearchKeyWord,
      Name: this.Name,
      SortColumn: this.SortColumn,
      SortOrder: this.SortOrder,
      PageCount: this.PageCount,
      selectedCategoryTypes: this.selectedCategoryTypes,
      selectedBillingCycles: this.selectedBillingCycles,
      selectedBillingTypes: this.selectedBillingTypes,
      selectedConsumptionTypes: this.selectedConsumptionTypes,
      selectedValidityType: this.selectedValidityType,
      ValidityLowerLimit: this.ValidityLowerLimit,
      ValidityUpperLimit: this.ValidityUpperLimit,
      CostPriceLowerLimit: this.CostPriceLowerLimit,
      CostPriceUpperLimit: this.CostPriceUpperLimit,
      SalePriceLowerLimit: this.SalePriceLowerLimit,
      SalePriceUpperLimit: this.SalePriceUpperLimit,
      ConsiderDeleted: this.ConsiderDeleted,
      IsTrailOffer: this.IsTrailOffer,
      length: this.length,
      SelectedSubcategoryTypes: this.SelectedSubcategoryTypes
    }
  }

  // editcontractOfferDetails(offer: any, offerType: string) {
  //   if (offerType == "add") {
  //     this.offerId = 0;
  //   }
  //   else {
  //     this.offerId = offer.ProductId;
  //   }
  //   let c3Router = new C3Router();
  //   c3Router.keepHistory = true;
  //   c3Router.commands = [`partner/contactofferdetails`];
  //   c3Router.extras = {state: { offerId: this.offerId, offerType: offerType }};
  //   c3Router.data = this.setData();
  //   this.c3RouterService.navigate(c3Router);
  // }
  

  deleteCustomOffer(offer: any) {

    let confirmationText = this.translateService.instant(
      'TRANSLATE.POPUP_DELETE_PARTNER_OFFER_CONFIRMATION_TEXT',
      { customOfferName: offer.Name }
    );
    if (offer.ProductForTrial !== null) {
      const trialOfferText = this.translateService.instant(
        'TRANSLATE.POPUP_DELETE_PARTNER_TRIAL_OFFER_SUPERSCRIPT'
      );
      confirmationText += `${trialOfferText}`;
    }
    Swal.fire({
      title: confirmationText,
      showCancelButton: true,
      confirmButtonText: 'Ok',
      icon: 'warning',
      confirmButtonColor: 'red'
    }).then((result: { isConfirmed: any; isDenied: any }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        const subscription = this.PartnerOffersListingService.deleteCustomOffer(
          offer.ProductId
        ).pipe(takeUntil(this.destroy$)).subscribe((response) => {
          let success = this.translateService.instant(
            'TRANSLATE.POPUP_DELETE_PARTNER_OFFER_SUCCESSFUL_TEXT',
            { customOfferName: offer.Name }
          );
          this.toastService.success(success);
          this.reloadEvent.emit(true);
        });
        this._subscriptionArray.push(subscription);
      }
    });

  }

  downloadGridReport() {
    const moduleName = 'partner.partneroffers';
    const subscription=this._commonService
      .getDownloadableReportColumnsForPlans({ moduleName: moduleName }).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        /* Creating config model */
        let reportConfig = new ReportPopupConfig();
        reportConfig.Columns = response.Data;
        reportConfig.title = 'PARTNER_OFFERS_REPORT_FILE_TYPES_HEADER';
        reportConfig.isSubmitButton = true;
        reportConfig.IsColumnsAvailable = true;
        reportConfig.IsSubHeaderAvailable = true;
        reportConfig.EmailInstructionText = this.translateService.instant('TRANSLATE.PARTNER_OFFERS_REPORT_FILE_TYPES_EMAIL_INSTRUCTION');
        reportConfig.actionTooltipText = this.translateService.instant('TRANSLATE.PARTNER_OFFERS_REPORT_FILE_TYPES_ICON_DESCRIPTION');
        /* selecting Size of popup based on condition */
        const config: NgbModalOptions = {
          modalDialogClass: reportConfig.IsSubHeaderAvailable
            ? MODAL_DIALOG_CLASS
            : '',
        };
        const modalRef = this.modalService.open(ReportPopupComponent, config);
        modalRef.componentInstance.reportConfig = reportConfig;
        modalRef.result.then(
          (result) => {
            if (result) {
              let selectedColumn: any = [];
              result.Columns.map((e: any) => {
                if (e.IsChecked === true) {
                  selectedColumn.push(e.ColumnName);
                }
              });
              let columns = selectedColumn.join(',');
              let reqbody = {
                ColumnsName: columns,
                EntityName: this._commonService.entityName,
                RecordId: this._commonService.recordId,
                Name: this.name,
                Categories: this.selectedCategoryTypes && this.selectedCategoryTypes.length ? this.selectedCategoryTypes.join(",") : "custom,licensesupported,customtrial",
                BillingCycles: this.selectedBillingCycles && this.selectedBillingCycles.length ? this.selectedBillingCycles.join(",") : null,
                BillingTypes: this.selectedBillingTypes && this.selectedBillingTypes.length ? this.selectedBillingTypes.join(",") : null,
                ConsumptionTypes: this.selectedConsumptionTypes && this.selectedConsumptionTypes.length ? this.selectedConsumptionTypes.join(",") : null,
                Validities: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? _.map(this.selectedValidityTypes, 'Validity').join() : null,
                ValidityType: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? _.map(this.selectedValidityTypes, 'ValidityType').join() : null,
                ValidityLowerLimit: this.minValidity,
                ValidityUpperLimit: this.maxValidity,
                CostPriceLowerLimit: this.minCostPrice,
                CostPriceUpperLimit: this.maxCostPrice,
                SalePriceLowerLimit: this.minSalePrice,
                SalePriceUpperLimit: this.maxSalePrice,
                ConsiderDeleted: this.considerDeleted,
                IsTrailOffer: this.IsTrailOffer,
                Email: result.Email === '' ? null : result.Email,
                FileType: result.FileType,
                TrialDuration: this.SelectedTrialDuration && this.SelectedTrialDuration.length > 0 ? this.SelectedTrialDuration.join() : _.map(this.TrialDurationSelection, 'Days').join()
              }
              // Apply logic for IsTrailOffer based on selectedCategoryTypes
              if (this.selectedCategoryTypes.length > 0) {
                if (this.selectedCategoryTypes.length == this.categories.length) {
                  reqbody.IsTrailOffer = null;
                }
              }
              if (reqbody.Categories != null) {
                if (reqbody.Categories.includes('custom,licensesupported,customtrial')) {
                  reqbody.IsTrailOffer = null;
                }
              }
              this.selectedCategoryTypes.forEach(category => {
                if (category.toLowerCase() == this.cloudHubConstants.CATEGORY_CUSTOM_TRIAL) {
                  reqbody.IsTrailOffer = true;
                }
              });
              if (columns != '' && columns.length > 0) {
                this._fileService.getFile('reports/PartnerOffers/DownloadByFileType', true, reqbody);
              } else {
                this.toastService.error(
                  this.translateService.instant(
                    'TRANSLATE.DOWNLOAD_CUSTOMER_ATLEAST_SELECT_ONE_COLUMN_ERROR'
                  )
                );
              }
            }
          },
          (reason) => {
            /* Closing modal reference if cancelled or clicked outside of the popup*/
            modalRef.close();
          }
        );
      });
      this._subscriptionArray.push(subscription);
  }

  searchCustomers() {
    this.reloadEvent.emit(true);
  }

  resetSearchCriteria() {
    this.minValidity = null;
    this.maxValidity = null;
    this.selectedValidityType = null;
    this.minCostPrice = null;
    this.maxCostPrice = null;
    this.minSalePrice = null;
    this.maxSalePrice = null;
    this.selectedCategories = [];
    this.selectedBillingCycles = [];
    this.selectedBillingTypes = [];
    this.selectedConsumptionTypes = [];
    this.selectedCategoryTypes = [];
    this.considerDeleted = false;
    this.IsTrailOffer = false;
    this.selectedValidityTypes = [];
    this.SelectedTrialDuration = [];
    this.SelectedSubcategoryTypes = [];
    this.cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }


  toggleShowFullDescription(row: any) {
    row.IsShowFullDescription = !row.IsShowFullDescription;
  }

  bulkUploadForPartnerOffer() {
    this._router.navigate([`partner/bulkuploadpartneroffer`])
  }

  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
