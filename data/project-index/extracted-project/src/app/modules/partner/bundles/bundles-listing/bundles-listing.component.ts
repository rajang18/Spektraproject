
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { TranslationService } from 'src/app/modules/i18n';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { ToastService } from 'src/app/services/toast.service';
import {BundlesListingService} from "src/app/modules/partner/bundles/services/bundle-listing.service"
import { Router } from '@angular/router';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonService } from 'src/app/services/common.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { FileService } from 'src/app/services/file.service';
import { MODAL_DIALOG_CLASS, ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { ReportPopupComponent } from 'src/app/modules/standalones/report-popup/report-popup.component';
import { NgSelectComponent } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-bundles-listing',
  templateUrl: './bundles-listing.component.html',
  styleUrl: './bundles-listing.component.scss',
})
export class BundlesListingComponent extends C3BaseComponent implements OnDestroy {
  maxValidity: number ;

  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  datatableConfig: ADTSettings | any;;
  // _subscription:Subscription;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('validity') validity: TemplateRef<any>;
  @ViewChild('billingcycle') billingcycle: TemplateRef<any>;
  @ViewChild('name') name: TemplateRef<any>;
  @ViewChild('costprice') costprice: TemplateRef<any>;
  @ViewChild('saleprice') saleprice: TemplateRef<any>;

  //CurrencySymbol: '$', CurrencyDecimalPlaces: '2', CurrencyThousandseparator: ',', CurrencyDecimalSeparator: '.', CurrencyCode: 'USD',

  // grab

  // view child if any
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  shouldShowFilter: boolean = false;
  selectedValidityType: any;
  validityTypes: any[] = [];
  minValidity: number ;
  minCostPrice: number ;
  maxCostPrice: number ;
  minSalePrice: number ;
  maxSalePrice: number ;
  selectedBillingCyclesForTopLevelFilters: any[] = [];
  billingCyclesHardCoded: any[] = [];
  billingCycles: any[] = [];
  selectedBillingTypesForTopLevelFilters: any[] = [];
  billingTypesHardCoded: any[] = [];
  billingTypes: any[] = [];
  selectedConsumptionTypesForTopLevelFilters: any[] = [];
  consumptionTypes: any[] = [];
  considerDeleted: boolean = false;
  selectedCategoriesForTopLevelFilters: any[]=[];
  EntityName: any;
  RecordId: any;
  Name: string = '';
  StartInd: number = 1;
  SortColumn: string = '';
  SortOrder: string = 'asc';
  keyForData: any = null;

  SearchKeyWord: string | null = null;
  PageCount: number = 0;
  PageIndex: number = 0;
  Categories: string = 'bundles';
  PageSize: number = 10;
  length: any;
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

  searchPayload:any={};
  permissions = {
    hasDownloadBundle: "Denied"
  };

  @ViewChild('selectElement') selectElement!: NgSelectComponent;
  @ViewChild('selectElement1') selectElement1!: NgSelectComponent;
  @ViewChild('selectElement2') selectElement2!: NgSelectComponent;
  @ViewChild('selectElement3') selectElement3!: NgSelectComponent;
 
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (this.selectElement.isOpen) {
      this.selectElement.close();
    }
    if (this.selectElement1.isOpen) {
      this.selectElement1.close();
    }
    if (this.selectElement2.isOpen) {
      this.selectElement2.close();
    }
    if (this.selectElement3.isOpen) {
      this.selectElement3.close();
    }
  }


  constructor(
    // service
    private toastService: ToastService,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private translationService: TranslationService,
    private BundlesListingService: BundlesListingService,
    public _router: Router,
    public _pageInfo:PageInfoService,
    private _notifierService: NotifierService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _commonService: CommonService,
    private fileService: FileService,
    private _appService: AppSettingsService, 
    private c3RouterService:C3RouterService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
  }

  ngOnInit(): void {
    this.hasPermission();
    this.EntityName = this._commonService.entityName;
    this.RecordId = this._commonService.recordId;
    if(this._commonService.entityName === 'Reseller'){
      this._pageInfo.updateTitle(this.translateService.instant("PARTNER_BUNDLES_BREADCRUMB_BUTTON_TEXT_PARTNER_BUNDLES"),true);
      this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','PARTNER_BUNDLES_BREADCRUMB_BUTTON_TEXT_PARTNER_BUNDLES']);
    }
    else if(this._commonService.entityName === 'Partner'){
      this._pageInfo.updateTitle(this.translateService.instant("PARTNER_BUNDLES_BREADCRUMB_BUTTON_TEXT_PARTNER_BUNDLES"),true);
      this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT','PARTNER_BUNDLES_BREADCRUMB_BUTTON_TEXT_PARTNER_BUNDLES']);
    }
    
    this.translationService.setLanguage(
      this.translationService.getSelectedLanguage()
    );
    this.handleTableConfig();
    this.getValidityTypes(null);
    this.getBillingCycles();
    this.getBillingTypes();
    this.getConsumptionTypes();
  }

  hasPermission() {
    this.permissions.hasDownloadBundle = this._permissionService.hasPermission(this.cloudHubConstants.BTN_BUNDLE_GRID_DOWNLOADABLE_REPORTS);
  }

  getConsumptionTypes() {
    const subscription = this._commonService.getConsumptionTypes().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.consumptionTypes = res || [];
    });
    this._subscriptionArray.push(subscription);
  }
  getBillingCycles() {
    const subscription = this.BundlesListingService.getBundleBillingCycles().pipe(takeUntil(this.destroy$)).subscribe(
      (res: any) => {
        this.billingCycles = res || [];
        //For use in top level filters we need unfiltered billingcycles
        this.billingCyclesHardCoded = res || [];
      }
    );
    this._subscriptionArray.push(subscription);
  }
  getBillingTypes() {
    const subscription = this.BundlesListingService.getBillingTypes().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.billingTypes = res || [];
      //For use in top level filters we need unfiltered billingcycles
      this.billingTypesHardCoded = res || [];
    });
    this._subscriptionArray.push(subscription);
  }

  resetSearchCriteria() {
    this.minValidity = null;
    this.maxValidity = null;
    this.selectedValidityType = null;
    this.minCostPrice = null;
    this.maxCostPrice = null;
    this.minSalePrice = null;
    this.maxSalePrice = null;
    this.selectedCategoriesForTopLevelFilters = [];
    this.selectedBillingCyclesForTopLevelFilters = [];
    this.selectedBillingTypesForTopLevelFilters = [];
    this.selectedConsumptionTypesForTopLevelFilters = [];
    this.considerDeleted = false;
    // this.getCustomOffersDataSource.page(1);
    // this.getCustomOffersDataSource.reload();
    this.reloadEvent.emit(true);
  }
  searchBundles() {
    this.reloadEvent.emit(true);
  }

  displayFilter() {
    this.shouldShowFilter = !this.shouldShowFilter;
  }

  GetBundleProductReportExportCSV() {
    const moduleName = "partner.bundles";
    const subscription = this._commonService.getDownloadableReportColumns({ entity: this._commonService.entityName, moduleName: moduleName, recordId:this._commonService?.recordId || null }).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      /* Creating config model */
      let reportConfig = new ReportPopupConfig();
      reportConfig.Columns = response.Data;
      reportConfig.title = 'BUNDLE_REPORT_FILE_TYPES_HEADER';
      reportConfig.isSubmitButton = false;
      reportConfig.IsColumnsAvailable = true;
      reportConfig.IsSubHeaderAvailable = true;
      reportConfig.showFavourite = false;
      reportConfig.EmailInstructionText = 'BUNDLE_REPORT_REPORT_FILE_TYPES_INSTRUCTION_UPDATED';
      reportConfig.actionTooltipText = 'BUNDLE_REPORT_FILE_TYPES_ICON_DESCRIPTION';
      /* selecting Size of popup based on condition */
      const config: NgbModalOptions = {
        modalDialogClass: reportConfig.IsSubHeaderAvailable ? MODAL_DIALOG_CLASS : '',
      };
      const modalRef = this.modalService.open(ReportPopupComponent, config);
      modalRef.componentInstance.reportConfig = reportConfig;
      modalRef.result.then((result) => {
        if (result) {
          let selectedColumn: any = [];
          result.Columns.map((e: any) => {
            if (e.IsChecked === true) {
              selectedColumn.push(e.ColumnName);
            }
          });
          let columns = selectedColumn.join(',');
          let emailIsEmpty = (result?.Email == null || result?.Email == "" || result?.Email == undefined);
          let reqbody = {
            ConsiderDeleted :this.searchPayload.ConsiderDeleted,
            ColumnsName: columns,
            EntityName: this._commonService.entityName,
            FileType: result.FileType,
            RecordId: this._commonService.recordId,
            Email: result.Email
          }
          this.fileService.post(`reports/GetBundleProductReportExport`,true,reqbody);
        }
      },
        (reason) => {
          modalRef.close();
        });
    });
    this._subscriptionArray.push(subscription);
  }

  getValidityTypes(period: any) {
    const subscription = this._commonService.getTermDuration().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (period !== null && period === 'Annual') {
        var types = res;
        this.validityTypes = types
          ?.filter((item: any) => {
            return item.ValidityType !== 'Month(s)';
          })
          ?.map((item: any) => item.ValidityType);
      } else {
        this.validityTypes = res?.map((item: any) => item.ValidityType);
      }
      this.validityTypes = Array.from(new Set(this.validityTypes));
    });
    this._subscriptionArray.push(subscription);
  }

  onSelectedPlanChange() {}

  handleTableConfig = () => {
    setTimeout(() => {
      // referencing the global key word to this
      var self = this;

      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          // deserializing
          const { StartInd, Name, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
            let C3Input = this.c3RouterService.getC3Input();
            if(!C3Input && this.keyForData && this.Name){
              this.c3RouterService.setC3Input(this.Name)
            }else{
              this.Name = C3Input || ''
            }
            this.Name = this.keyForData && (Name === null || Name === undefined || Name === '')? this.Name : Name;
            this.StartInd = this.keyForData && StartInd == 1? this.StartInd : StartInd;
            this.SortColumn = this.keyForData? this.SortColumn : SortColumn;
            this.SortOrder = this.keyForData? this.SortOrder : SortOrder;
            this.length = this.keyForData? this.length : length;
            this.keyForData = null;

            this.searchPayload = {
              SearchKeyWord: this.Name ? this.Name : null,
              PageCount: length - 1,
              PageIndex: (this.StartInd - 1) * length + 1,
              Categories: "bundles",
              Name:this.Name,
              SortColumn:this.SortColumn,
              SortOrder:this.SortOrder,
              PageSize:this.length,
              BillingCycles: this.selectedBillingCyclesForTopLevelFilters && this.selectedBillingCyclesForTopLevelFilters.length ?
                    this.selectedBillingCyclesForTopLevelFilters.join() : null,
                BillingTypes: this.selectedBillingTypesForTopLevelFilters && this.selectedBillingTypesForTopLevelFilters.length ?
                    this.selectedBillingTypesForTopLevelFilters.join() : null,
                ConsumptionTypes: this.selectedConsumptionTypesForTopLevelFilters && this.selectedConsumptionTypesForTopLevelFilters.length ?
                    this.selectedConsumptionTypesForTopLevelFilters.join() : null,
                ValidityType: this.selectedValidityType ,
                ValidityLowerLimit: this.minValidity,
                ValidityUpperLimit: this.maxValidity,
                CostPriceLowerLimit: this.minCostPrice,
                CostPriceUpperLimit: this.maxCostPrice,
                SalePriceLowerLimit: this.minSalePrice,
                SalePriceUpperLimit: this.maxSalePrice,
                ConsiderDeleted: this.considerDeleted
            }
          // making an api call
          const subscription = this.BundlesListingService.getList(this.searchPayload).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let recordsTotal =0;
            if(Data.length >0){
               [{ TotalPartnerProductCount: recordsTotal }] = Data;
            }
           

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
            searchable: false,
            className:'body-alignment-normal col-md-2 bold',
            title: this.translateService.instant('TRANSLATE.PARTNER_BUNDLES_TABLE_HEADER_TEXT_NAME'),
            data: 'Name',
            sortable:true,
            defaultContent:'',
            ngTemplateRef: {
              ref: this.name,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          { className:'col-lg-3 body-alignment-normal text-break',
            title: this.translateService.instant('TRANSLATE.PARTNER_BUNDLES_TABLE_HEADER_TEXT_DESC'), 
            sortable:false,
            data:'Description'
          },
          {
            type:'string',
            className:'col-lg-2 body-alignment-normal',
            title: this.translateService.instant('TRANSLATE.PARTNER_BUNDLES_TABLE_HEADER_TEXT_BILLING_CYCLE'),
            data:'BillingCycleDescription',
            defaultContent:"",
            sortable:false,
            ngTemplateRef: {
              ref: this.billingcycle,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            type:'string',
            className:'col-lg-1 body-alignment-normal',
            title: this.translateService.instant("TRANSLATE.PARTNER_BUNDLES_LABEL_TEXT_VALIDITY"),
            defaultContent: '',
            sortable:false,
            ngTemplateRef: {
              ref: this.validity,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            type:'string',
            className:'col-lg-1 body-price-alignment',
            title: this.translateService.instant('TRANSLATE.PARTNER_BUNDLES_LABEL_TEXT_COST_PRICE'),
            defaultContent:"",
            sortable:false,
            ngTemplateRef: {
              ref: this.costprice,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            // data: 'PriceforPartner',
          },
          {
            type:'string',
            className:'col-lg-1 body-price-alignment',
            title: this.translateService.instant('TRANSLATE.PARTNER_BUNDLES_LABEL_TEXT_SALE_PRICE'),
            defaultContent:"",
            sortable:false,
            ngTemplateRef: {
              ref: this.saleprice,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            type:'string',
            className:'col-md-2 text-end',
            title: this.translateService.instant('TRANSLATE.PARTNER_BUNDLES_TABLE_HEADER_TEXT_ACTIONS'),
            defaultContent: '',
            sortable:false,
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
  };

  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}

  deleteBundle(row: any) {
    const BundleId = row.ProductId;
    const customOfferName = row.Name;
    const confirmationMessage = this.translateService.instant(
      'TRANSLATE.POPUP_DELETE_PARTNER_OFFER_CONFIRMATION_TEXT',
      { customOfferName: customOfferName }
    );
    this._notifierService
      .confirm({ title: confirmationMessage })
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          const subscription =  this.BundlesListingService.deleteBundle(BundleId).pipe(takeUntil(this.destroy$)).subscribe(
            (response) => {
              this.toastService.success(
                this.translateService.instant(
                  'TRANSLATE.POPUP_DELETE_PARTNER_OFFER_SUCCESSFUL_TEXT',
                  { customOfferName: customOfferName }
                )
              );
              this.reloadEvent.emit(true);
            },
            (error) => {
              this.toastService.error(
                this.translateService.instant(
                  'TRANSLATE.BUNDLES_CANNOT_BE_DELETED',
                  { customOfferName: customOfferName }
                )
              );
              this.reloadEvent.emit(true);
            }
          );
          this._subscriptionArray.push(subscription);
        } else {
          this.reloadEvent.emit(true);
        }
      });
  }

  editBundleDetails(offer: any, bundleType: any) {
    const BundleId = offer.ProductId;

    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/bundles/Bundledetails`];
    c3Router.extras = {state: { BundleId: BundleId, bundleType: bundleType }};
    c3Router.data = this.setData();
    this.c3RouterService.navigate(c3Router);

    // this._router.navigate([`partner/bundles/Bundledetails`], {
    //   state: { BundleId: BundleId, bundleType: bundleType },
    // });
  }
  newBundle(bundleType: any) {
    
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`/partner/bundles/Bundledetails`];
    c3Router.extras = {state: {bundleType: bundleType }};
    c3Router.data = this.setData();
    this.c3RouterService.navigate(c3Router);

    // this._router.navigate([`partner/bundles/Bundledetails`], {
    //   state: { BundleId: BundleId, bundleType: bundleType },
    // });
  }

  setData(){
    return{
      SearchKeyWord: this.SearchKeyWord,
      PageCount: this.PageCount,
      Categories: this.Categories,
      StartInd: this.StartInd,
      Name: this.Name,
      SortColumn: this.SortColumn,
      SortOrder: this.SortOrder,
      length: this.length,
      selectedBillingCyclesForTopLevelFilters: this.selectedBillingCyclesForTopLevelFilters,
      selectedBillingTypesForTopLevelFilters: this.selectedBillingTypesForTopLevelFilters,
      selectedConsumptionTypesForTopLevelFilters: this.selectedConsumptionTypesForTopLevelFilters,
      selectedValidityType: this.selectedValidityType,
      minValidity: this.minValidity,
      maxValidity: this.maxValidity,
      minCostPrice: this.minCostPrice,
      maxCostPrice: this.maxCostPrice,
      minSalePrice: this.minSalePrice,
      maxSalePrice: this.maxSalePrice,
      ConsiderDeleted: this.ConsiderDeleted
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
