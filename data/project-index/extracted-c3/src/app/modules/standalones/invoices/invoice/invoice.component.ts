import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { InvoicesService } from 'src/app/services/invoices.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss'
})
export class InvoiceComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {

  currentStateName: string;
  statusPrefix: string;
  invoiceNumber: string;
  invoiceId: any;
  validStates: string[] = ['partner/invoice/invoicelineitems', 'partner/invoice/contactlogs', 'home/invoice/lineitems', 'home/invoice/contactlogs', 'home/invoice/comments', 'partner/invoice/comments'];
  orderId: any =null;
  permissions = {
    HasGetContactLogs: "Denied",
    HasGetComments: "Denied"
  }
  tabs: any[] = [];
  selectedTab:string = 'invoice';

  constructor(
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplate: DynamicTemplateService,
    private _commonService: CommonService,
    private _translateService: TranslateService,
    private _pageInfo:PageInfoService,
    private _appService: AppSettingsService,
    private _invoiceService: InvoicesService,

  ) {
    super(_permissionService,_dynamicTemplate,_router, _appService);
    this.currentStateName = _router.url;
    if (this.currentStateName.includes('partner')) {
      this.statusPrefix = 'partner/invoice';
    }
    else {
      this.statusPrefix = 'home/invoice';
    }

    let invoiceId = _router.getCurrentNavigation()?.extras?.state?.invoiceId
    if (invoiceId) {
      this.invoiceId = invoiceId;
    } else {
      this.backToInvoices();
    }

    this.orderId = null;
    if (_router.getCurrentNavigation()?.extras?.state?.orderId) {
        this.orderId = _router.getCurrentNavigation()?.extras?.state?.orderId;
    }

    let invoiceNumber = localStorage.getItem("invoiceNumber");
    if (invoiceNumber !== undefined && invoiceNumber !== null && invoiceNumber !== '') {
      this.invoiceNumber = invoiceNumber;
    }


    if (this.validStates.indexOf(this.currentStateName) === -1) {
      this._invoiceService.dataState = { invoiceId: this.invoiceId };
      _router.navigate([this.statusPrefix + '/invoicelineitems'], { state: { data: { invoiceId: this.invoiceId }} });
    }
  }

  backToInvoices() {
    let route = this.statusPrefix + 's';
    this._router.navigate([route]);
  }


  ngOnInit(): void {
    this.getPermission();
    this.getValidStates();

  }

getPermission() {
  this.permissions.HasGetContactLogs = this._permissionService.hasPermission(this.cloudHubConstants.GET_CONTACT_LOGS);
    this.permissions.HasGetComments = (this._commonService.entityName === "Partner" || this._commonService.entityName === "Reseller") ? this._permissionService.hasPermission(this.cloudHubConstants.ALL_COMMENTS) : this._permissionService.hasPermission(this.cloudHubConstants.menu_customer_comments);
}

 getValidStates() {
   this.tabs = [
     {
      name:'invoice',
       heading: this._translateService.instant('TRANSLATE.INVOICE_TAB_NAME_DETAILS'),
       route: this.statusPrefix + "/invoicelineitems",
       data: {
         invoiceId: this.invoiceId
       },
       active: true,
       visible: true
     },
     {
      name:'contactlogs',
       heading: this._translateService.instant('TRANSLATE.INVOICE_TAB_NAME_NOTIFICATIONS'),
       route: this.statusPrefix + "/contactlogs",
       data: {
         entityName: this.cloudHubConstants.ENTITY_INVOICE,
         recordId: this.invoiceId,
       },
       active: false,
       visible: (this.permissions.HasGetContactLogs !== undefined && this.permissions.HasGetContactLogs === 'Allowed') ? true : false
     },
     {
      name:'comments',
       heading: this._translateService.instant('TRANSLATE.INVOICE_TAB_NAME_COMMENTS'),
       route: this.statusPrefix + "/comments",
       data: {
         entityName: this.cloudHubConstants.ENTITY_INVOICE,
         recordId: this.invoiceId,
       },
       active: false,
       visible: (this.permissions.HasGetComments !== undefined && this.permissions.HasGetComments === 'Allowed') ? true : false
     }
   ];
 }

  swtichTab(tab:any) {
    this.selectedTab = tab.name;
    this._router.navigate([tab.route], {state:{data:tab.data}})
  }

   goToOrdersPage() {
    this.orderId = JSON.parse(localStorage.getItem("orderId"));
    this._router.navigate(['customer/orders'],{state:{ orderId: this.orderId }})

}

ngAfterViewInit(): void {
  super.ngAfterViewInit();
  this._pageInfo.updateTitle(`${this.invoiceNumber}`,true);
  this._pageInfo.updateBreadcrumbs('');
}

  ngOnDestroy(): void {
    super.ngOnDestroy();

  }
}
