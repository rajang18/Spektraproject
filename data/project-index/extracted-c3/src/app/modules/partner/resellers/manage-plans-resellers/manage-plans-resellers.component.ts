import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings'; 
import { ManagePlansResellersService } from 'src/app/modules/partner/resellers/services/manage-plans-resellers.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SweetAlertOptions } from 'sweetalert2';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-manage-plans-resellers',
  standalone: true,
  imports: [C3TableComponent, CommonModule, TranslateModule, SweetAlert2Module, RouterModule],
  templateUrl: './manage-plans-resellers.component.html',
  styleUrl: './manage-plans-resellers.component.scss'
})
export class ManagePlansResellersComponent extends C3BaseComponent implements OnInit, OnDestroy {
  shouldshow : boolean = false;
  datatableConfig: ADTSettings;
  customerImpersonateConfig: ADTSettings;
  c3Id: string | null;
  isEditing: boolean[] = [];
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  swalOptions: SweetAlertOptions = { buttonsStyling: false };
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  name: string = "";

  Permissions = {
    HasGetResellers: true,
    HasUpdateResellerPlan: this._permissionService.hasPermission('BTN_UPDATE_RESELLER_PLAN_STATUS') === 'Allowed',
    HasAddDistributorOffers: "Denied"
  };

  constructor(
    private ManagePlansService: ManagePlansResellersService,
    private toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private route: ActivatedRoute,
    public pageInfo: PageInfoService,
    router: Router,
    private _notifierService: NotifierService,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,  
    private c3RouterService:C3RouterService,
  ) {
    super(permissionService, dynamicTemplateService, router, _appService)
    this.navigation = this._router.getCurrentNavigation();
    this.c3Id  = this.navigation?.extras.state?.['ResellerC3Id'];
    if(this.c3Id == undefined && this.c3Id == null){
      this._router.navigate(['partner/resellers']);
    }
  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'RESELLER_BREADCRUMB_BUTTON_TEXT_RESELLER','MANAGE_RESELLER_PLANS_CAPTION_TEXT_RESELLER_PLANS']);
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.MANAGE_RESELLER_PLANS_CAPTION_TEXT_RESELLER_PLANS"),true);
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.handleTableConfig();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  handleTableConfig() {
    const resellerC3Id = this.c3Id;
    setTimeout(() => {
      const self = this;
      this.shouldshow = true;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, length } = mapParamsWithApi(dataTablesParameters);
          let nameFilter = Name;
          if (nameFilter === null || nameFilter === undefined || nameFilter === '') {
            nameFilter = this.name;
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.ManagePlansService.getList
            ({ StartIndex : StartInd, Name, SortColumn, SortOrder, PageSize : length, resellerC3Id})
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal:number =0 ;
              if(Data.length >0){
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
            title: this.translateService.instant('TRANSLATE.MANAGE_RESELLER_PLANS_TABLE_HEADER_TEXT_NAME'),
            data: 'Name',
            orderable : true,
            className: 'col-md-4'
          },
          {
            title: this.translateService.instant('TRANSLATE.MANAGE_RESELLER_PLANS_TABLE_HEADER_TEXT_DESCRIPTION'),
            data: 'Description',
            orderable : false,
            className: 'col-md-4'
          },
          {
            title: this.translateService.instant('TRANSLATE.MANAGE_RESELLER_PLANS_TABLE_HEADER_TEXT_ACTIONS'),
            defaultContent: '',
            orderable : false,
            className:"text-end col-md-4",
            ngTemplateRef: {
              ref: this.actions,
            },
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }
  onCaptureEvent(event: Event) {}

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
    }).then((result) => {
      if (result.value) {
        var reqBody = {
          IsActive: action,
        };
        const resellerC3Id = this.c3Id;
        const subscription = this.ManagePlansService.update(
          { resellerC3Id, internalPlanId },
          reqBody
        ).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          if (response.Status == 'Success') {
            this.shouldshow = false;
            this.handleTableConfig();
            this.toastService.success(this.translateService.instant(
              'TRANSLATE.PLAN_ASSIGN_STATUS_SUCCESS'
            ));
          }
        });
        this._subscriptionArray.push(subscription);
      }
    });
  }

  backToResellersList(){
    this.c3RouterService.backToHistory(this.keyForData,'partner/resellers');
  }

}
