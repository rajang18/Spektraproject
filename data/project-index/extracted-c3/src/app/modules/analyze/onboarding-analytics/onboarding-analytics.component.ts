import { ChangeDetectorRef, Component, EventEmitter, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { OnboardingAnalyticsService } from '../services/onboarding-analytics.service';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import _ from 'lodash';
import { CustomAnalyticsService } from 'src/app/services/custom-analytics.service';
import { Subject, takeUntil } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service'; 
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';


@Component({
  selector: 'app-onboarding-analytics',
  templateUrl: './onboarding-analytics.component.html',
  styleUrl: './onboarding-analytics.component.scss'
})
export class OnboardingAnalyticsComponent extends C3BaseComponent implements OnDestroy{

  datatableConfig: ADTSettings;
  frmGetOnboardedCustomersCount: FormGroup = new FormGroup({});
  frmGetOnboardedCustomers: FormGroup = new FormGroup({});
  unitsOfDuration: any[];
  typesOfCustomers: any[];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  private unsubscribe$ = new Subject<void>();
  forms: { [key: string]: FormGroup } = {
    frmGetOnboardedCustomersCount: this.frmGetOnboardedCustomersCount,
    frmGetOnboardedCustomers: this.frmGetOnboardedCustomers
    // Add other forms here
  };
  constructor(
    private _cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    private onboardingAnalyticsService: OnboardingAnalyticsService,
    public router: Router,
    private _formBuilder: FormBuilder,
    private fileService: FileService,
    private _appService:AppSettingsService,
    private customAnalyticsService: CustomAnalyticsService,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private commonService: CommonService, 
    private _pageInfo: PageInfoService,
    private pageInfo: PageInfoService,
    private _unsavedChangesService:UnsavedChangesService,
  ) {
    super(permissionService, dynamicTemplateService, router, _appService);
    this.frmGetOnboardedCustomersCount = this._formBuilder.group({
      DurationUnitGraph: [''],
      TypeofCustomersGraph: [''],
      ResellerGraph: ['', Validators.required],
    });
    this.frmGetOnboardedCustomersCount.get('DurationUnitGraph').setValue("week");
    this.frmGetOnboardedCustomersCount.get('TypeofCustomersGraph').setValue("All Customers");
    this.frmGetOnboardedCustomersCount.get('ResellerGraph').disable();

    this.frmGetOnboardedCustomers = this._formBuilder.group({
      DurationUnitList: [''],
      TypeofCustomersList: [''],
      ResellerList: ['', Validators.required],
    });
    Object.values(this.forms).forEach(form => this.trackFormChanges(form));
    this.frmGetOnboardedCustomers.get('DurationUnitList').setValue("week");
    this.frmGetOnboardedCustomers.get('TypeofCustomersList').setValue("All Customers");
    this.frmGetOnboardedCustomers.get('ResellerList').disable();
    
  }

  EntityNameGraph = null;
  RecordIdGraph = null;
  DurationUnitGraph = null;
  TypeofCustomersGraph = null;
  EntityNameOfUserGraph = null;
  RecordIdOfUserGraph = null;
  ResellerGraph = null;
  buttonClickedGraph: boolean = false;
  buttonClickedList: boolean = false;
  searchParam: any;
  EntityNameList = null;
  RecordIdList = null;
  DurationUnitList = null;
  TypeofCustomersList = null;
  EntityNameOfUserList = null;
  RecordIdOfUserList = null;
  NameList = null;
  C3IdList = null;
  EmailList = null;
  StartIndList = 1;
  EndIndList = 5000;
  PageSizeList = 25;
  SortColumnList = '';
  SortOrderList = '';
  WhereClauseXMLList = null;
  ResellerList = null;
  onboardedCustomersCountDetails: any = null;
  barOptions: any = [];
  ticks = [];
  maxCount = 0;
  tickSize = 1;
  barStackeData = [{
    "color": "green",
    "data": []
  }];
  isPartnerLevel: boolean;
  searchResellerCriteria: any = {};
  resellers: any = [];
  isGFilterExpand: boolean = false;
  isLFilterExpand: boolean = false;
  shouldShowResellerDiv = false;
  shouldShowResellerDiv2 = false;
  
 
  permissions = {
    HasResellers: "Denied",
    HasDownloadCustomerReport: "Denied"
  };

  ngOnInit(): void {
    this.isPartnerLevel = this.commonService.entityName.toLowerCase() == this.cloudHubConstants.ENTITY_PARTNER;
    this.hasPermission();
    this.getResellers();
    this.handleTableConfig();
    this.GetOnboardedCustomersCountForDuration();
    this.unitsOfDuration = [{
      Name: this._translateService.instant('TRANSLATE.ONBOARDING_DURATION_UNIT_WEEK'),
      Value: 'week'
    },
    {
      Name: this._translateService.instant('TRANSLATE.ONBOARDING_DURATION_UNIT_MONTH'),
      Value: 'month'
    },
    {
      Name: this._translateService.instant('TRANSLATE.ONBOARDING_DURATION_UNIT_YEAR'),
      Value: 'year'
    }];
  
    this.typesOfCustomers = [{
      Name: this._translateService.instant('TRANSLATE.ONBOARDING_TYPES_OF_CUSTOMERS_ALL'),
      Value: 'All Customers'
    },
    {
      Name: this._translateService.instant('TRANSLATE.ONBOARDING_TYPES_OF_CUSTOMERS_DIRECT'),
      Value: 'Direct Customers'
    },
    {
      Name: this._translateService.instant('TRANSLATE.ONBOARDING_TYPES_OF_CUSTOMERS_RESELLER'),
      Value: 'Reseller Customers'
    }];

    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_ONBOARDING_BREADCRUMB_BUTTON_TEXT_CUSTOMER_ONBOARDING"),true);
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'MENU_ONBOARDED_CUSTOMERS_REPORT']);
  }

  hasPermission() {
    this.permissions.HasResellers = this.permissionService.hasPermission(this.cloudHubConstants.GET_RESELLERS);
    this.permissions.HasDownloadCustomerReport = this.permissionService.hasPermission(this.cloudHubConstants.DOWNLOADONBOARDEDCUSTOMERSREPORT);
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, PageSize, Email,length } =
            mapParamsWithApi(dataTablesParameters);
          this.searchParam = {
            EntityName: this.commonService.entityName,
            RecordId: this.commonService.recordId,
            DurationUnit: this.frmGetOnboardedCustomers.get("DurationUnitList").value,
            TypeofCustomers: this.frmGetOnboardedCustomers.get("TypeofCustomersList").value,
            EntityNameOfUser: this.frmGetOnboardedCustomers.get("ResellerList").value ? this.cloudHubConstants.ENTITY_RESELLER : null,
            RecordIdOfUser: this.frmGetOnboardedCustomers.get("ResellerList").value ? this.frmGetOnboardedCustomers.get("ResellerList").value.C3Id : null,
            C3Id: this.C3IdList || null,
            Email: Email || null,
            StartInd,
            EndInd: this.EndIndList,
            SortOrder,
            PageSize:length,
            Name: Name,
            SortColumn: SortColumn,
            WhereClauseXML: this.WhereClauseXMLList,
            Reseller: this.frmGetOnboardedCustomers.get("ResellerList").value || null,
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.onboardingAnalyticsService
            .GetOnboardedCustomersList(this.searchParam).pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
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
            className: 'col-md-2',
            title: this._translateService.instant('TRANSLATE.CUSTOMERS_ONBOARDED_BY_DURATION_TABLE_HEADER_NAME'),
            data: 'Name',
            searchable: false,
            render: function(data){
              return `<span class="fw-semibold">${data}</span>`
            }
          },
          {
            className: 'col-md-2',
            title: this._translateService.instant('TRANSLATE.CUSTOMERS_ONBOARDED_BY_DURATION_ONBOARDED_DATE'),
            data: 'OnboardedDate',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            }
          },
          {
            className: 'col-md-3 text-break',
            orderable:false,
            title: this._translateService.instant('TRANSLATE.CUSTOMERS_ONBOARDED_BY_DURATION_BILLING_EMAIL'),
            data: 'Email',
            searchable: false
          },
          {
            className: 'col-md-3',
            orderable:false,
            title: this._translateService.instant('TRANSLATE.CUSTOMERS_ONBOARDED_BY_DURATION_PLAN_NAME'),
            data: 'PlanName',
          }
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  onTypeOfCustomerChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.shouldShowResellerDiv = selectedValue === 'Reseller Customers';
    if(this.shouldShowResellerDiv){
      this.frmGetOnboardedCustomers.get('ResellerList').enable();
    }else{
      this.frmGetOnboardedCustomers.get('ResellerList').disable();
    }
  }

  onTypeOfCustomerChange2(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.shouldShowResellerDiv2 = selectedValue === 'Reseller Customers';
    if(this.shouldShowResellerDiv2){
      this.frmGetOnboardedCustomersCount.get('ResellerGraph').enable();
    }else{
      this.frmGetOnboardedCustomersCount.get('ResellerGraph').disable();
    }
  }

  onSubmit() {
    this.frmGetOnboardedCustomers.markAllAsTouched();
    if (this.frmGetOnboardedCustomers.valid) {
      this.reloadEvent.emit(true);
    }
  }

  GetOnboardedCustomersAfterFilter() {
    this.frmGetOnboardedCustomersCount.markAllAsTouched();
    if (this.frmGetOnboardedCustomersCount.valid) {
      this.GetOnboardedCustomersCountForDuration();
    }
  }

  GetOnboardedCustomersCountForDuration() {
      this.onboardedCustomersCountDetails = null;
      let seachParam = {
        EntityName: this.commonService.entityName,
        RecordId: this.commonService.recordId,
        EntityNameOfUser: this.frmGetOnboardedCustomersCount.get("ResellerGraph").value ? this.cloudHubConstants.ENTITY_RESELLER : null,
        RecordIdOfUser: this.frmGetOnboardedCustomersCount.get("ResellerGraph").value ? this.frmGetOnboardedCustomersCount.get("ResellerGraph").value.C3Id : null,
        DurationUnit: this.frmGetOnboardedCustomersCount.get("DurationUnitGraph").value,
        TypeofCustomers: this.frmGetOnboardedCustomersCount.get("TypeofCustomersGraph").value,
        Reseller: this.frmGetOnboardedCustomersCount.get("ResellerGraph").value || null,
      }
      //logging event into analytics
      this.customAnalyticsService.trackEvent('Click', { Category: 'Button', PageName: 'Onboarding Analytics', ButtonName: 'Search', SearchCriteria: JSON.stringify(seachParam) });
      const subscription = this.onboardingAnalyticsService.GetOnboardedCustomersCountForDuration(seachParam).pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
        this.onboardedCustomersCountDetails = Data.Data;
        let result = Data.Data;
        let data = [];
        let dataForBarStack = [];
        if (result !== null && result.length > 0) {
          let len = result.length;

          //dataForBarStack.push({ color: tinycolor('#032855').toHexString() });
          dataForBarStack.push({ color: '#006400' });

          this.ticks = [];
          for (let j = 0; j < result.length; j++) {
            this.ticks.push([j, result[j].DurationName]);
            data.push([j, result[j].CustomerCount]);
            if (result[j].CustomerCount > this.maxCount) {
              this.maxCount = result[j].CustomerCount
            }
          }

          if (this.maxCount === 0) {
            this.tickSize = 1;
          }
          else if (this.maxCount > 0 && this.maxCount < 10) {
            this.tickSize = 1;
          }
          else {
            this.tickSize = this.maxCount / 10;
          }

          dataForBarStack[0].data = data;
        }
        this.barStackeData = dataForBarStack;
        this.barOptions = this.GetBarOptions();
        this._cdRef.detectChanges();
      });
      this._subscriptionArray.push(subscription);
  }

  GetBarOptions() {
    return {
      series: [
        {
          name: this._translateService.instant('TRANSLATE.TENANT_COUNTS'),
          data: _.map(this.onboardedCustomersCountDetails, "CustomerCount")
        },
      ],
      chart: {
        type: "bar",
        height: 300,
        // stacked: true,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
            horizontal: false,
            columnWidth: 12,
            borderRadius: 5,
            borderRadiusApplication: 'last',
            borderRadiusWhenStacked: 'last',
            dataLabels: {
              position: 'top', 
          },
        },
      },
    dataLabels: {
        enabled: true, 
        offsetY: -30, 
        style: {
            colors: ['#304758'],
            fontSize: '12px',
        },
    },
      xaxis: {
        type: "category",
        categories: _.map(this.onboardedCustomersCountDetails, "DurationName")
      },
      fill: {
        colors: ["#008ffb"],
        opacity: 1

      }
    }
  }


  getResellers() {
    let searchResellerCriteria = {
      SortColumn: "SignupDate",
      SortOrder: "desc",
      PageSize: 1000,
      StartInd: 1
    }
    //hscheck:403
    const subscription = this.onboardingAnalyticsService.getResellers(searchResellerCriteria).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.resellers = Data;
    });
    this._subscriptionArray.push(subscription);
  }



  onResetGraphFilter() {
    this.frmGetOnboardedCustomersCount.reset();
    this.frmGetOnboardedCustomersCount.get('DurationUnitGraph').setValue("week");
    this.frmGetOnboardedCustomersCount.get('TypeofCustomersGraph').setValue("All Customers");
    this.shouldShowResellerDiv2 = false;
  }

  onResetListFilter() {
    this.frmGetOnboardedCustomers.reset();
    this.frmGetOnboardedCustomers.get('DurationUnitList').setValue("week");
    this.frmGetOnboardedCustomers.get('TypeofCustomersList').setValue("All Customers");
    this.shouldShowResellerDiv = false;
  }

  graphFilterExpand() {
    this.isGFilterExpand = !this.isGFilterExpand;
    this.frmGetOnboardedCustomersCount.reset();
    this.frmGetOnboardedCustomersCount.get('DurationUnitGraph').setValue("week");
    this.frmGetOnboardedCustomersCount.get('TypeofCustomersGraph').setValue("All Customers");
    this.shouldShowResellerDiv2 = false;
  }

  listFilterExpand() {
    this.isLFilterExpand = !this.isLFilterExpand;
    this.frmGetOnboardedCustomers.get('DurationUnitList').setValue("week");
    this.frmGetOnboardedCustomers.get('TypeofCustomersList').setValue("All Customers");
    this.shouldShowResellerDiv = false;
  }
  GetOnboardedCustomersList() {
    this.reloadEvent.emit(true);
  }

  GetOnboardedCustomersReport() {
    this.customAnalyticsService.trackEvent('Click', { Category: 'Button', PageName: 'Onboarding Analytics', ButtonName: 'Download Report', SearchCriteria: JSON.stringify(this.searchParam) });
    this.fileService.getFile(`analytics/downloadonboardedcustomers`, true, this.searchParam);

  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
  private trackFormChanges(form: FormGroup) {
    // form.valueChanges.pipe(
    //   distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
    //   takeUntil(this.unsubscribe$ )
    // ).subscribe(() => {
    //   //this._unsavedChangesService.setUnsavedChanges(form.dirty);
    // });
  }

  onCaptureEvent(event: Event) { }

}
