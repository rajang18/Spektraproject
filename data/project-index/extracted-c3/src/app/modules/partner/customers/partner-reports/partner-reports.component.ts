import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router} from '@angular/router';
import { PartnerReportsTabs } from '../models/customer-tags.model';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { CommonService } from 'src/app/services/common.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-partner-reports',
  templateUrl: './partner-reports.component.html',
  styleUrl: './partner-reports.component.scss'
})
export class PartnerReportsComponent extends C3BaseComponent implements OnInit, AfterViewInit,OnDestroy {
  customerId: number | null;
  customerC3Id: string | null;
  customerName: string | null;
  customerIdIntString: string | null;
  entityName: string | null = '';
  recordId: string | null = '';
  showHelpText = false;


  tabs = PartnerReportsTabs;
  activeTab: string = this.tabs.ReconciliationReport;

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  constructor(
    public _router: Router,
    public _permissionService: PermissionService,
    public _translateService: TranslateService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _commonService : CommonService,
    private _pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService, 
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.navigation = this._router.getCurrentNavigation();
    this.customerId = this.navigation?.extras.state?.['CustomerId'];
    this.customerC3Id = this.navigation?.extras.state?.['CustomerC3Id'];
    this.customerName = this.navigation?.extras.state?.['CustomerName'];
    if (this.customerId) {
      this.customerIdIntString = this.customerId.toString();
    }

    if (this.customerId == undefined || this.customerId == null) {
      this._router.navigate([`partner/customers`])
    }
  }

  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    if (this.customerId !== undefined && this.customerId !== null && this.customerIdIntString !== "null") {
      localStorage.setItem("ReportCustomerID", this.customerIdIntString);
    }
    if (this.customerC3Id !== undefined && this.customerC3Id !== null && this.customerC3Id !== "null") {
      localStorage.setItem("ReportC3CustomerID", this.customerC3Id);
    }
    if (this.customerName !== undefined && this.customerName !== null && this.customerName !== "null") {
      localStorage.setItem("ReportCustomerName", this.customerName);
    }
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_REPORTS"),true);
    this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','CUSTOMER_REPORTS','CUSTOMER_RECONCILIATION_REPORT'])
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  backToCustomer(){
    this.c3RouterService.backToHistory(this.keyForData,`partner/customers`);
  }

  navigateTab(link:string) { 
    this.c3RouterService.backToHistory(this.keyForData,`partner/customers/reports/${link}`,true);
  }
}
