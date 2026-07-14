import { 
  ChangeDetectorRef,
  Component,
  EventEmitter, 
  OnDestroy, 
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core'; 
import { interval, Subscription, takeUntil } from 'rxjs';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import { Router } from '@angular/router';

import {
  NgbModal,
  NgbModalOptions, 
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ResellerPlansListingService } from 'src/app/modules/partner/reseller-plans/services/resellerplans-listing.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import _ from 'lodash';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ProductService } from 'src/app/services/product.service';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { C3tableService } from 'src/app/modules/standalones/c3-table/c3table.service';
@Component({
  selector: 'app-reseller-plans-listing',
  templateUrl: './reseller-plans-listing.component.html',
  styleUrl: './reseller-plans-listing.component.scss'
})
export class ResellerPlansListingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('macroDetails', { static: true }) macroDetails!: TemplateRef<any>;
  @ViewChild('actions', { static: true }) actions!: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  //properties added for getting the pending status of clone plan and add all offers to a new plan
  private CancelResellerPlansPageTableReload: Subscription | null = null;
  needReload = false;
  planListData: any[] = [];
  filterByOwnedBy: any ='';
  filteredByName: any[] = [];
  filteredPlans: any[] = [];
  // Reload emitter inside datatable
  address:any=[];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  searchKeyword: any;
  StartInd: number = 1;
  SortColumn: string = '';
  SortOrder:string = 'ASC';
  Name: string = '';
  tableResellerPlanList:any;
  currentPageIndex = 0;
  isIntervalClick : boolean = false;
  
  constructor(
    private resellerPlansListingService: ResellerPlansListingService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private pageInfo : PageInfoService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private _productService: ProductService,    
    private c3RouterService:C3RouterService,
    private c3TableService : C3tableService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
  }
  //Action buttons
  Permissions = {
    HasGetPlans: "Denied",
    HasAddPlan: "Denied",
    HasDefinePlanInOtherCurrency: "Denied",
    HasEditPlans: "Denied",
    HasSaveResellerPlanWithAllOffers: "Denied",
    HasCloneResellerPlan: "Denied"
  };
  HasPermission() {
    this.Permissions.HasGetPlans = this._permissionService.hasPermission(this.cloudHubConstants.GET_RESELLER_PLANS);
    this.Permissions.HasAddPlan = this._permissionService.hasPermission(this.cloudHubConstants.BTN_ADD_RESELLER_PLAN);
    this.Permissions.HasEditPlans = this._permissionService.hasPermission(this.cloudHubConstants.BTN_EDIT_RESELLER_PLAN);
    this.Permissions.HasDefinePlanInOtherCurrency = this._permissionService.hasPermission(this.cloudHubConstants.BTN_DEFINE_RESELLER_PLAN_IN_OTHER_CURRENCY);
    this.Permissions.HasSaveResellerPlanWithAllOffers = this._permissionService.hasPermission(this.cloudHubConstants.SAVE_RESELLER_PLAN_WITH_ALL_OFFERS);
    this.Permissions.HasCloneResellerPlan = this._permissionService.hasPermission(this.cloudHubConstants.CLONERESELLERPLAN);
  }
  ngOnInit(): void {
    this.HasPermission();
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    // this.StartInd = this.c3RouterService.getPageIndex();

    this.handleTableConfig();
    this.intervalFunction();
    this.pageInfo.updateBreadcrumbs(['MENUS_SELL_INDIRECT', 'PLAN_MANAGE_BREADCRUMB_BUTTON_MANAGE_RESELLER_PLANS_BREADCRUM']);
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.PLAN_MANAGE_BREADCRUMB_BUTTON_MANAGE_PLANS"), true);
    this._productService.resetData();
  }

  handleTableConfig(): void {
    const self = this;
    this.currentPageIndex = this.StartInd;
    const perPage = this._appService.$rootScope.DefaultPageCount || 10;
    this.datatableConfig = {
      serverSide: true,
      pageLength: perPage,
      order: [[0, 'asc']],
      rowId: 'ID',
      ajax: (dataTablesParameters: any, callback: any) => {
        const {StartInd,Name,SortColumn,SortOrder,length} = 
        mapParamsWithApi(dataTablesParameters);
        const C3Input = this.c3RouterService.getC3Input();
        if ((!C3Input) && this.keyForData && this.Name) {
          this.c3RouterService.setC3Input(this.Name);
        } else {
          this.Name = C3Input || '';
        }
        this.destroyInterval();
        this.Name = this.keyForData && (Name === null || Name === undefined || Name === '')? this.Name : Name;
        this.StartInd = (this.keyForData && StartInd === 1) ? this.StartInd : StartInd;
        this.SortColumn = this.keyForData ? this.SortColumn : SortColumn;
        this.SortOrder = (this.keyForData ? this.SortOrder : SortOrder || 'ASC').toString().toUpperCase();
        if (self.isIntervalClick && this.currentPageIndex != null && this.currentPageIndex >= 0)  {
          this.StartInd = this.currentPageIndex;
        }
        const subscription = this.resellerPlansListingService
          .getReselerPlansList({StartInd: this.StartInd,SortColumn: this.SortColumn,Name:this.Name,SortOrder: this.SortOrder,pageSize: length})
           .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              if (this.currentPageIndex != null && this.currentPageIndex >= 0 && self.isIntervalClick) {
                self.isIntervalClick = false;
                this.c3Table?.page(this.StartInd-1)?.draw('page');
                this.currentPageIndex = 0;
              }
              const [{ TotalRecord: recordsTotal = 0 } = {}] = Data.length > 0 ? Data : [{}];
              this.tableResellerPlanList = Data;
              this.needReload = false;
              Data.filter((plan: any) => {
                if (plan.PlanStatus !== 'Success' && plan.PlanStatus !== 'Error') {
                  this.intervalFunction();
                  this.needReload = true; 
                }
              });
              if (!this.needReload) {
                this.destroyInterval();
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
          title: this.translateService.instant('TRANSLATE.PLAN_TABLE_HEADER_TEXT_NAME'),
          data: 'Name',
          className: 'col-md-3',
          render: function (data) {
            return '<span class="fw-semibold">' + _.escape(data ?? '') + '</span>';
          }
        },
        {
          title: this.translateService.instant('TRANSLATE.PLAN_TABLE_HEADER_TEXT_DESCRIPTION'),
          data: 'Description',
          orderable: false,
          className: 'col-md-3'
        },
        {
          title: this.translateService.instant('TRANSLATE.PLAN_MACRO_DETAILS_LABEL_TEXT'),
          data: null,
          defaultContent: '',
          type: 'string',
          orderable: false,
          ngTemplateRef: { ref: this.macroDetails },
          className: 'col-md-4 text-start'
        },
        {
          title: this.translateService.instant('TRANSLATE.PLAN_TABLE_HEADER_TEXT_ACTIONS'),
          data: null,
          defaultContent: '',
          className: 'text-end col-md-2',
          orderable: false,
          ngTemplateRef: { ref: this.actions, context: { captureEvents: self.onCaptureEvent.bind(self) } }
        }
      ]
    };
  }


  filterForOwnedBy(filterByOwnedBy: any) {
    this.filteredByName = [];
    if (filterByOwnedBy.length > 0) {
      let filteredByNameTransactionData = this.datatableConfig.data.filter(
        (item: any) => {
          if (
            item.OwnedBy.toUpperCase().includes(filterByOwnedBy.toUpperCase())
          ) {
            return item;
          }
        }
      );
      filteredByNameTransactionData.forEach((data) => {
        const filteredPlansExistingIndex =
          this.filteredByName.indexOf(data);
        if (filteredPlansExistingIndex === -1) {
          this.filteredByName= this.filteredByName.concat(data);
        }
      });
    } else {
      this.filteredByName = this.planListData;
    }
   // this.reloadGridWithoutApi();
  }

  searchPlans = _.debounce(()=> {
    if(this.searchKeyword && this.planListData.length>0){
      this.filteredPlans = _.filter(this.planListData,(obj)=>{
        return obj.Name.toLowerCase().includes(this.searchKeyword.toLowerCase());
      });
    } else if (!this.searchKeyword && this.planListData.length > 0) {
      this.filteredPlans = this.planListData;
    }
    this.cdRef.detectChanges();
  },100);

  editPlan(internalPlanId: any, planType: string) {
    const planId = internalPlanId;
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/resellerplans/resellerplandetails`];
    c3Router.extras = {state: { planId: planId, planType: planType }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);

    // this._router.navigate([`partner/resellerplans/resellerplandetails`]
    //   , { state: { planId: planId, planType: planType } });
  }

  addPlan(){
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/resellerplans/resellerplandetails`];
    c3Router.extras = {state: { }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
  }

  setData(){
    return{
      StartInd: this.StartInd,
      SortColumn: this.SortColumn, 
      SortOrder: this.SortOrder,
      searchKeyword: this.searchKeyword
    }
  }


  cloneResellerPlan(plan: any, planType: string) {
    const planId = plan.InternalPlanId;
    const resellerPlanId = plan.ID; 
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/resellerplans/resellerplandetails`];
    c3Router.extras = {state: { planId: planId, planType: planType, resellerPlanId: resellerPlanId }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router); 
  } 

  planProductsCurrencyConversion(internalPlanId: any) { 
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/resellerplans/resellerplancurrencyconversion`];
    c3Router.extras = {state:  { planId: internalPlanId }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);  
  } 

  intervalFunction() {
    if (this.CancelResellerPlansPageTableReload) return;
    this.CancelResellerPlansPageTableReload = interval(3000).subscribe(() => { 
      if (this._router.url === '/partner/resellerplans') {
        this.c3TableService.currentStartIndex = this.StartInd;
        this.isIntervalClick = true;
        this.handleTableConfig();
      } else {
        this.destroyInterval();
      }
    });
  }

  destroyInterval(): void {
    if (this.CancelResellerPlansPageTableReload) {
      this.CancelResellerPlansPageTableReload.unsubscribe();
      this.CancelResellerPlansPageTableReload = null;
    }
  }

  onCaptureEvent(event: Event) { }

  enableEditField(data: any) {

  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    localStorage.removeItem('usageMacroValue');
    localStorage.removeItem('usageMacroTypeId');
    localStorage.removeItem('macroTypeId');
    localStorage.removeItem('macroValue');
    localStorage.removeItem('selectedMacro');
    this.destroyInterval();
  }
}
