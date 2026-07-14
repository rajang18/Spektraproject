import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import _, { } from 'lodash';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { TranslateService } from '@ngx-translate/core';
import { CostSummaryReportService } from 'src/app/services/cost-summary-report.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';
 
@Component({
  selector: 'app-cost-summary-report',
  templateUrl: './cost-summary-report.component.html',
  styleUrl: './cost-summary-report.component.scss'
})

export class CostSummaryReportComponent extends C3BaseComponent implements OnInit, OnDestroy {
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('nttDetails') nttDetails: TemplateRef<any>;

  filterform:FormGroup;
  customers = [];
  resellers = [];
  plans = [];
  shouldShowFilter: boolean = false;
  datatableConfig: ADTSettings;


  searchCriteria = {
    Customers: null,
    Resellers: null,
    Plans: null
  };
  entityName: string;


  constructor(private _costSummaryReport: CostSummaryReportService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private pageInfo: PageInfoService,
    private _formBuilder:FormBuilder,
    private _cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    private translateService: TranslateService,
    private _appService: AppSettingsService, 
  ){
      super(_permissionService, _dynamicTemplateService, _router, _appService);
      this.entityName = this._commonService.entityName;
      this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.COST_SUMMARY_REPORT_TEXT_COST_SUMMARY_REPORT"),true);
      this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'MENU_COST_SUMMARY_REPORT']);

      this.filterform = this._formBuilder.group({
        customer: [''],
        reseller: [''],
        plan: [''],
      });

  }
  
  ngOnInit(): void {
    this.getCustomerList();
    this.getResellerList(); 
    this.getPlans();
    this.handleTableConfig();
  }


  getCustomerList(){ 
    const subscription = this._costSummaryReport.getCustomerForFilter().pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
      if(response.Data && response.Data.length > 0){
        this.customers = _.uniqBy(response.Data, (x) => {
          return x.Name;
        });
        //this.customers = filter('orderBy')(this.customers, 'Name');
        this.customers = _.sortBy(this.customers,["Name"]);  
      }
      //this.customers=response.Data;
    })
    this._subscriptionArray.push(subscription);
  }

  getResellerList(){
    let searchResellerCriteria={
      SortColumn : "SignupDate",
      SortOrder : "desc",
      PageSize : 1000,
      StartInd : 1,
    }
    //hscheck:403
    const subscription = this._costSummaryReport.getReselerListForFilter(searchResellerCriteria).pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
      this.resellers=response.Data;
    })
    this._subscriptionArray.push(subscription);
  }

  getPlans() { 
    const requestBody = { 
       customers: (customerObject => customerObject ? customerObject.C3Id : null)(
        _.find(this.customers, { Name: this.filterform.get('customer').value })
    ),
       Resellers: this.filterform.get('reseller').value ? this.filterform.get('reseller').value : null
       
    }; 
   
        const subscription = this._costSummaryReport.getPlanListForFilter(requestBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.plans = response.Data;
        });
        this._subscriptionArray.push(subscription);
   
  }
  
  displayFilter() {
    this.shouldShowFilter = !this.shouldShowFilter;
  }
  // Method to calculate the return value based on pageIndex
  getPageIndexValue(pageIndex: number,length:number): number {
    return (pageIndex - 1) * length + 1;
  }

  handleTableConfig() {
    this.datatableConfig = null;

    setTimeout(() => {
        this.datatableConfig = {
            serverSide: true,
            ordering: false,
            pageLength:  (this._appService.$rootScope.DefaultPageCount || 10),
            ajax: (dataTablesParameters: any, callback: any) => {
                const { StartInd, length } = mapParamsWithApi(dataTablesParameters);
                const selectedCustomer = this.filterform.get('customer')?.value;
                const selectedReseller = this.filterform.get('reseller')?.value;
                const selectedPlan = this.filterform.get('plan')?.value;
                const reqBody: any = {
                    Customers: this.searchCriteria?.Customers?.length ? this.searchCriteria.Customers.join(',') : null,
                    Plans: this.searchCriteria?.Plans?.length ? this.searchCriteria.Plans.join(',') : null, // Use empty string if null
                    Resellers: this.searchCriteria?.Resellers?.length ? this.searchCriteria.Resellers.join(',') : null,
                    SortColumn: 'Name',
                    SortOrder: 'ASC',
                    PageSize: length-1,
                    StartInd: this.getPageIndexValue(StartInd,length),
                    WhereClauseXML: '' 
                }; 
                const subscription = this._costSummaryReport
                    .getCostSummaryReport(reqBody).pipe(takeUntil(this.destroy$))
                    .subscribe((Data: any) => {
                        //console.log(Data);
                        let recordsTotal = 0;
                        if (Data.Data.length > 0) {
                            [{ TotalCount: recordsTotal }] = Data.Data;
                        }
                        callback({
                            data: Data.Data,
                            recordsTotal: recordsTotal || 0,
                            recordsFiltered: recordsTotal || 0,
                        });
                    });
                    this._subscriptionArray.push(subscription);
            },
            columns: [
                {
                    data: 'EntityName',
                    orderable: false,
                    className: '',
                    ngTemplateRef: {
                        ref: this.nttDetails,
                    },
                }
            ]
        };
        this._cdRef.detectChanges();
    });
}


  searchPartnerOffers() {
    const selectedCustomerName = this.filterform.get('customer')?.value;
    const selectedReseller = this.filterform.get('reseller')?.value;
    const selectedPlan = this.filterform.get('plan')?.value;

    const customerObject = _.find(this.customers, { Name: selectedCustomerName });

    this.searchCriteria.Customers = customerObject ? [customerObject.C3Id] : [];
    const selectedResellerName = selectedReseller ? selectedReseller.$ngOptionLabel : null;
    const matchedReseller = _.find(this.resellers, { Name: selectedResellerName });
    this.searchCriteria.Resellers = matchedReseller ? [matchedReseller.C3Id] : [];

    const selectedPlanName = selectedPlan ? selectedPlan.$ngOptionLabel : null; // This may need adjustment based on how your selectedPlan is structured
    const matchedPlan = _.find(this.plans, { Name: selectedPlanName }); // Use selectedPlanName here
    this.searchCriteria.Plans = matchedPlan ? [matchedPlan.InternalPlanId] : [];

    this.handleTableConfig();
  }

  resetSearchCriteria() {
    this.filterform.reset();
    this.searchCriteria = { Customers: null, Resellers: null, Plans: null };
    this.getPlans();
    this.handleTableConfig();
  }

  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
