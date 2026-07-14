import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal, NgbModalOptions, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings'; 
import { ManagePlansService } from 'src/app/modules/partner/customers/services/manage-plans.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { takeUntil } from 'rxjs';
@Component({
  selector: 'app-manage-plans',
  standalone: true,
  imports: [C3TableComponent, CommonModule, TranslateModule, SweetAlert2Module, NgbModule, C3CommonModule],
  templateUrl: './manage-plans.component.html',
  styleUrl: './manage-plans.component.scss',
})
export class ManagePlansComponent extends C3BaseComponent implements  OnInit, AfterViewInit, OnDestroy {
  datatableConfig: ADTSettings | any;
  customerImpersonateConfig: ADTSettings;
  c3Id: string | null;
  isEditing: boolean[] = [];
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('actionHeader') actionHeader: TemplateRef<any>;
  successMessage = 'Customer Name update success';
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  showTable:boolean=false;
  customerName: any; 

  constructor(
    private ManagePlansService: ManagePlansService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private route: ActivatedRoute,
    private _notifierService: NotifierService, 
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _pageInfo:PageInfoService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService,
    private activatedRoute: ActivatedRoute
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.navigation = this._router.getCurrentNavigation();
    this.c3Id = this.navigation?.extras.state?.['c3Id'];
    if(this.c3Id == undefined || this.c3Id == null || this.c3Id == ''){
      this._router.navigate([`partner/customers`]);
    }
    this.customerName = this.navigation?.extras.state?.['Name'];
    if(this.customerName == undefined || this.customerName == null || this.customerName == ''){
      this._router.navigate([`partner/customers`]);
    }
  }

  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    const subscription = this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.c3Id = params['id'];
      this.handleTableConfig();
    });
    this._subscriptionArray.push(subscription);
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let title: string = this.translateService.instant('TRANSLATE.PARTNER_CUSTOMER_PLANS_PAGE_TITLE');
    title= title+`<span class="text-primary">${this.customerName}</span>`
    this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT']);
    this._pageInfo.updateTitle(title, true, true);
  }

  handleTableConfig() {
    const self = this;
    this.showTable = false;
    this.datatableConfig = null;
    const customerC3Id = this.c3Id;
    const subscription =  this.ManagePlansService.getList({
      customerC3Id,
    }).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.showTable = true;
      setTimeout(() => {
        this.applyEscapeHTML(Data);
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
          data: Data,
          ADTSettings: {
            enableEscapeHTML: true
          },
          columns: [
            {
              title: this.translateService.instant('TRANSLATE.PLAN_MANAGE_ADD_FORM_TABLE_1_TEXT_PLAN_NAME'),
              data: 'Name',
              className:"col-md-5",
              render: (data: string, type: any, row: any, meta: any) => {
                // return the formatted HTML
                let text = "<span class='fw-semibold'>"+data+"</span>";
                return text;
              }
            },
            {
              title: this.translateService.instant('TRANSLATE.CUSTOMER_PLANS_TABLE_HEADER_PLAN_DESCRIPTION'),
              data: 'Description',
              className:"col-md-5",
              orderable:false,
            },
            {
              orderable:false,
              title: this.translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_ACTIONS'),
              defaultContent: '',
              ngTemplateRef: {
                ref: this.actions,
              },
              className:"col-md-2 text-center"
            },
          ],
        };
        this.cdRef.detectChanges();
      });
    });
    this._subscriptionArray.push(subscription);
  }

  UpdateCustomerPlanStatus(
    internalPlanId: string,
    action: boolean,
    currentPlanStatus: any
  ) {
    let confirmationText = '';
    if (currentPlanStatus !== null && currentPlanStatus === true) {
      confirmationText = this.translateService.instant(
        'TRANSLATE.PARTNER_CUSTOMER_PLAN_DISABLE_CONFIRMATION_TEXT'
      );
    }
    if (currentPlanStatus !== null && currentPlanStatus === false) {
      confirmationText = this.translateService.instant(
        'TRANSLATE.PARTNER_CUSTOMER_PLAN_ENABLE_CONFIRMATION_TEXT'
      );
    }
    if (currentPlanStatus === null) {
      confirmationText = this.translateService.instant(
        'TRANSLATE.PARTNER_CUSTOMER_PLAN_ASSIGN_CONFIRMATION_TEXT'
      );
    }
    this._notifierService.confirm({
      title: confirmationText,
       confirmButtonColor: 'green',
       icon: 'info'
    }).then((result) => {
      if (result.value) {
        var reqBody = {
          IsActive: action,
        };
        const customerC3Id = this.c3Id;
        const subscription =  this.ManagePlansService.update(
          { customerC3Id, internalPlanId },
          reqBody
        ).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Status == 'Success') {
            this.handleTableConfig();
            this.toastService.success('Status was updated successfully');
          }
        });
        this._subscriptionArray.push(subscription);
      }
    });
  }

  backToList() { 
    this.c3RouterService.backToHistory(this.keyForData,'partner/customers');
  }

  ChangePlan() {   
    const customerC3Id = this.c3Id;
    const customerName = this.customerName;
    this._router.navigate([`partner/customers/customerplans`],{state: {customerC3Id: customerC3Id, customerName:customerName}})
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
