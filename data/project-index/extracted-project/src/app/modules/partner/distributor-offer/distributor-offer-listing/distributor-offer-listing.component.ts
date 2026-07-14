import { ChangeDetectorRef, Component, EventEmitter, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DistributorOfferService } from '../service/distributor-offer.service';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import _, { uniqBy } from 'lodash';
import { NotifierService } from 'src/app/services/notifier.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { Subject, takeUntil} from 'rxjs';
import { NgSelectComponent } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { SubCategories } from 'src/app/shared/models/common';

@Component({
  selector: 'app-distributor-offer-listing',
  templateUrl: './distributor-offer-listing.component.html',
  styleUrl: './distributor-offer-listing.component.scss'
})
export class DistributorOfferListingComponent extends C3BaseComponent implements OnInit, OnDestroy {

  datatableConfig: ADTSettings;
  isEditing: boolean[] = []; 
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('providerSelectionModel') providerSelectionModel: TemplateRef<any>;

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  entityName:string;
  recordId:string;
  filterform:FormGroup;
  BillingCyclesHardcoded:any;
  offerId:number; 
  Name:string
  StartInd:number;
  SortColumn:any;
  SortOrder:any;
  currentTab:any ='distributorOffer';
  SelectedDistributorSubcategoryTypes:string="";
  distributorSubcategories: any[] = [];
  SearchKeyWord: string;
  PageIndex: number;
  PageCount: number;
  Categories: string;
  BillingCycles: any;
  BillingTypes: string;
  ConsumptionTypes: string;
  ValidityType: string;
  ValidityLowerLimit: string;
  ValidityUpperLimit: string;
  CostPriceLowerLimit: number;
  CostPriceUpperLimit: number;
  SalePriceLowerLimit: number;
  SalePriceUpperLimit: number;
  EntityName: string;
  RecordId: any;
  subCategoryId:any;

  isFromSubCategoriesPage:boolean=false;

  permissions = {
    HasSaveOrUpdateDistributorOffer: "Denied",
    HasEditDistributorOffer: "Denied",
    HasDeleteDistributorOffer: "Denied",
    HasAddDistributorOffer: "Denied"
  };


  shouldShowAccountFilter: boolean = false;

    minCostPrice: number = null;
    maxCostPrice: number = null;
    minSalePrice: number = null;
    maxSalePrice: number = null;
    selectedBillingCycles: string = '';
    @ViewChild('selectElement') selectElement!: NgSelectComponent;

 
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (this.selectElement?.isOpen) {
      this.selectElement.close();
    }
  
  }

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef, 
    private _notifierService:NotifierService,
    private _distributorOfferService: DistributorOfferService,
    private _commonService: CommonService,  
    private _toastService: ToastService,
    private _translateService:TranslateService,
    private pageInfo: PageInfoService,
    public _router: Router,
    public _permissionService:PermissionService,
    public _dynamicTemplateService:DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService
  ) { 
      super(_permissionService,_dynamicTemplateService,_router, _appService);
      this._unsavedChangesService.isRedirect.subscribe((res:any)=>{
      if(res){
        this.setActiveTab('manageSubcategories');
        this.actionHeaderLoader();
      }
    })
      this.entityName = this._commonService.entityName;
      this.recordId = this._commonService.recordId;
      this.filterform = this._formBuilder.group({
        minCostPrice: ['',Validators.min(0), ],
        maxCostPrice: ['',Validators.min(0) ],
        minSalePrice: ['',Validators.min(0)],
        maxSalePrice: ['',Validators.min(0)],
        selectedBillingCycles: [''],
         SelectedDistributorSubcategoryTypes: ['']
      });

    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData'];
    this.isFromSubCategoriesPage = this.navigation?.extras.state?.['isFromSubCategoriesPage'];  

    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
      
  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT','DISTRIBUTOR_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.DISTRIBUTOR_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS"),true);
        if(this.isFromSubCategoriesPage){ //nt
      this.currentTab = 'manageSubcategories';
      super.ngOnDestroy();
    }
    else{
      this.currentTab = 'distributorOffer'
    }
    this.handleTableConfig();
    this.getBillingCycles();
    this.hasPermission();
    this.loadDistributorSubcategories();
  }

  hasPermission() {
    this.permissions.HasSaveOrUpdateDistributorOffer = this._permissionService.hasPermission(this.cloudHubConstants.ADD_DISTRIBUTOR_OFFERS);
    this.permissions.HasEditDistributorOffer = this._permissionService.hasPermission(this.cloudHubConstants.EDIT_DISTRIBUTOR_OFFERS);
    this.permissions.HasDeleteDistributorOffer = this._permissionService.hasPermission(this.cloudHubConstants.DELETE_DISTRIBUTOR_OFFERS);
    this.permissions.HasAddDistributorOffer = this._permissionService.hasPermission(this.cloudHubConstants.BTN_ADD_DISTRIBUTOR_OFFERS);
  }

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
          this.Name = this.keyForData && (Name === null || Name === undefined || Name === '')? this.Name : Name;
          this.StartInd = this.keyForData && StartInd == 1? this.StartInd : StartInd;
          this.SortColumn = this.keyForData? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData? this.SortOrder : SortOrder;
          this.keyForData = null;
          //   let nameFilter = Name;
          // if (nameFilter === null || nameFilter === undefined || nameFilter === '') {
          //   nameFilter = this.name
          // }  
          const {
            minCostPrice,
            maxCostPrice,
            minSalePrice,
            maxSalePrice,
            selectedBillingCycles,
            SelectedDistributorSubcategoryTypes,
          } = this.filterform.value;
          const searchParams = {
            SearchKeyWord : this.Name,
            PageIndex: this.getPageIndexValue(this.StartInd,length),
            PageCount:length-1,
            SortColumn:this.SortColumn,
            SortOrder:this.SortOrder,
            Categories:'',
            BillingCycles:Array.isArray(this.selectedBillingCycles) ? this.selectedBillingCycles.join(',') : this.selectedBillingCycles,
            BillingTypes:'',
            ConsumptionTypes:'',
            ValidityType:'',
            ValidityLowerLimit:'',
            ValidityUpperLimit:'',
            CostPriceLowerLimit:this.minCostPrice,
            CostPriceUpperLimit:this.maxCostPrice,
            SalePriceLowerLimit:this.minSalePrice,
            SalePriceUpperLimit:this.maxSalePrice,
            EntityName:this.entityName,
            RecordId:this.recordId == "null" ? null : this.recordId,
            subcategoryIds: Array.isArray(this.SelectedDistributorSubcategoryTypes) ? this.SelectedDistributorSubcategoryTypes.join(',') : this.SelectedDistributorSubcategoryTypes,
          }
          this._subscription && this._subscription?.unsubscribe();
          this._subscription = this._distributorOfferService
            .getList(searchParams)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalPartnerProductCount: recordsTotal }] = Data;
              }
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
        },
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.DISTRIBUTOR_OFFERS_TABLE_HEADER_TEXT_NAME'),
            data: 'Name',
            className : 'col-md-2',
            ngTemplateRef: {
              ref: this.nameTemplate,
              context: {
                userData: {
                  field: 'Name',
                },
                // needed for capturing events inside <ng-template>
                captureEvents: self.enableEditField.bind(self),
              },
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.DISTRIBUTOR_OFFERS_LABEL_TEXT_DESCRIPTION'),
            data: 'Description',
            orderable:false,
            className : 'col-md-3',
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOM_OFFERS_LABEL_TEXT_PROPERTIES'),
            defaultContent: '',
            className : 'col-md-4 text-start',
            ngTemplateRef: {
              ref: this.propertiespills,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable:false
          },
          {
            title: this._translateService.instant('TRANSLATE.DISTRIBUTOR_OFFERS_LABEL_TEXT_COST_PRICE'),
            data: 'PriceforPartner',
            className : 'col-md-1 text-end',
            render: function(data, type, row) {
              return `<span class="pe-6">$${parseFloat(data).toFixed(2)}</span>`;
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.DISTRIBUTOR_OFFERS_LABEL_TEXT_SALE_PRICE'),
            data: 'ProviderSellingPrice',
            className : 'col-md-1 text-end',
            render: function(data, type, row) {
              return `<span class="pe-7">$${parseFloat(data).toFixed(2)}</span>`; 
            }
          },
          {
            type:'string',
            title: this._translateService.instant('TRANSLATE.DISTRIBUTOR_OFFERS_LABEL_TEXT_ACTION'),
            defaultContent: '',
            className : 'col-md-1 text-end',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable:false
          },
        ],
      }
      this._cdref.detectChanges();
    })
  }
  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}

  displayFilter() {
    this.shouldShowAccountFilter = !this.shouldShowAccountFilter;
  }

loadDistributorSubcategories() {
  this._commonService.getCatagoriesWithoutScreen()
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: any) => {
      if (res && res.length) {
        const distributorCategory = res.find((c: any) => c.Name === "DistributorOffers");
        if (distributorCategory) {
          this._commonService.getSubCategories(distributorCategory.Name, false)
            .pipe(takeUntil(this.destroy$))
            .subscribe((subs: any) => {
              this.distributorSubcategories = subs || [];
            });
        }
      }
    });
}


  setData(){

    return{
      SearchKeyWord : this.SearchKeyWord,
      StartInd : this.StartInd,
      Name : this.Name,
      PageCount : this.PageCount,
      SortColumn : this.SortColumn,
      SortOrder : this.SortOrder,
      Categories : this.Categories,
      selectedBillingCycles : this.selectedBillingCycles,
      BillingTypes : this.BillingTypes,
      ConsumptionTypes : this.ConsumptionTypes,
      ValidityType : this.ValidityType,
      ValidityLowerLimit : this.ValidityLowerLimit,
      ValidityUpperLimit : this.ValidityUpperLimit,
      minCostPrice : this.minCostPrice,
      maxCostPrice : this.maxCostPrice,
      minSalePrice : this.minSalePrice,
      maxSalePrice : this.maxSalePrice,
      EntityName : this.EntityName,
      RecordId : this.RecordId,
      subCategoryId:this.subCategoryId,
      SelectedDistributorSubcategoryTypes:this.SelectedDistributorSubcategoryTypes
    }
  }
  searchPartnerOffers() {
    if(this.reloadEvent.closed){
      this.reloadEvent = new EventEmitter();
    }
    if(this.filterform.valid){
      this.reloadEvent.emit(true);
    }
  }

  getPageIndexValue(pageIndex: number,length:number): number {
    return (pageIndex - 1) * length + 1;
  }

  deleteDistributorOffer(data:any){
    const confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_DISTRIBUTOR_OFFER_CONFIRMATION_TEXT',{ distributorOffer: data.Name });
        this._notifierService.confirm({title:confirmationText}).then((result: { isConfirmed: any;}) =>{
          /* Read more about isConfirmed */
          if(result.isConfirmed){
            const subscription = this._distributorOfferService.deleteDistributorOffer(data.ProductId).pipe(takeUntil(this.destroy$)).subscribe(
              (response:any) => {
                
                if(response.Status == 'Success'){
                this._cdref.detectChanges();
                  if (this.reloadEvent.closed) {
                    this.reloadEvent = new EventEmitter();
                  }
                this.reloadEvent.emit(true);
                this._toastService.success(this._translateService.instant('TRANSLATE.POPUP_DELETE_DISTRIBUTOR_OFFER_SUCCESSFUL_TEXT'));
                }
              }
            )
            this._subscriptionArray.push(subscription);
          }
        })
  }

  getBillingCycles(){
    const subscription = this._commonService.getConsumptionBillingCycles().pipe(takeUntil(this.destroy$)).subscribe((response:any) =>{
    this.BillingCyclesHardcoded= uniqBy(response,'BillingCycleId');;
    })
    this._subscriptionArray.push(subscription);
  }

  editofferDetails(offer:any,offerType:string, view:string){
    if(offerType == "add"){
      this.offerId  = 0;
    }
    else{
      this.offerId = offer.ProductId;
    }

    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/distributoroffers/add`];
    c3Router.extras = {state: { offerId: this.offerId, offerType: offerType, view: view}};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
    // this._router.navigate([`partner/distributoroffers/add`]
    // ,{ state: { offerId: this.offerId, offerType: offerType, view: view} });
  }

  newDistributorOfferNavigation(offerType:string, view:string){
    if(offerType == "add"){
      this.offerId  = 0;
    }
    
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/distributoroffers/add`];
    c3Router.extras = {state: { offerId: this.offerId, offerType: offerType, view: view}};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
  }

  resetSearchCriteria() {
    if (this.reloadEvent.closed) {
      this.reloadEvent = new EventEmitter();
    }
    this.filterform.reset();
    this._cdref.detectChanges();
    this.reloadEvent.emit(true);
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  setActiveTab(activeTab:any){
    this.currentTab = activeTab;
    if(this.currentTab == 'distributorOffer'){
    this.datatableConfig = null;
    this.handleTableConfig();  
    this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT','DISTRIBUTOR_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.DISTRIBUTOR_OFFERS_CAPTION_TEXT_CUSTOM_OFFERS"),true);
    }
  }

}
