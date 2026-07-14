import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { TaxesSettingService } from '../services/taxes-setting.service';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-taxes-settings',
  templateUrl: './taxes-settings.component.html',
  styleUrl: './taxes-settings.component.scss'
})
export class TaxesSettingsComponent extends C3BaseComponent implements OnInit,OnDestroy {
  datatableConfig: ADTSettings | any;
  // _subscription: Subscription;
  subTaxPercentages: any[] = [];
  hasSubTaxes = false;
  subTax: any = { TaxName: null, TaxPercentage: null };
  addTaxPercentage: any = { Id: null };
  disableTaxPercentage = false;
  taxPercentages: any[] = [];
  searchCriteria = {};

  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';

  @ViewChild('actions') actions: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  //Action Buttons
  Permissions = {
    HasAddOrEditTaxPercentage: "Denied",
    HasDeleteTaxPercentage: "Denied"
  };
  globalDateFormat: any;


  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _taxService: TaxesSettingService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _appService: AppSettingsService,
    private pageInfo: PageInfoService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    let message =`<span class="text-primary">${this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')}</span>` 
    this.pageInfo.updateTitle(`${message}`,true);
    this.pageInfo.updateBreadcrumbs([''])
    
  }

  ngOnInit(): void {
    this.hasPermissionAccess();
    this.handleTableConfig();
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
  }

  hasPermissionAccess() {
    this.Permissions.HasAddOrEditTaxPercentage = this._permissionService.hasPermission('BTN_ADD_OR_UPDATE_TAXES');
    this.Permissions.HasDeleteTaxPercentage = this._permissionService.hasPermission('BTN_DELETE_TAXES');
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, Country, StateProvince, ZIPCode, TaxCode, TaxName, TaxPercentage} =
            mapParamsWithApi(dataTablesParameters);
            this._subscription && this._subscription?.unsubscribe();
          const subscription = this._taxService
            .getTaxPercentages({
              Country: Country,
              StateProvince: StateProvince,
              ZIPCode: ZIPCode,
              TaxCode: TaxCode,
              TaxName: TaxName,
              TaxPercentage: TaxPercentage,
              StartInd, Name, SortColumn, SortOrder, PageSize
            })
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalTaxCount: recordsTotal }] = Data;
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
            title: this._translateService.instant('TRANSLATE.PROFILE_VIEW_BILLING_FORM_LABEL_COUNTRY'),
            data: 'Country',
            className: 'col-md-2 text-left',
            type:'string',
            searchable:true,
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.LABEL_TEXT_STATE_PROVINCE'),
            data: 'StateProvince',
            type:'string',
            className:'col-md-2 text-left',
            searchable:true,
          },
          {
            title: this._translateService.instant('TRANSLATE.LABEL_TEXT_ZIP_CODE'),
            data: 'ZIPCode',
            type:'string',
            className:'col-md-1 text-left',
            searchable:true,

          },
          {
            title: this._translateService.instant('TRANSLATE.LABEL_TEXT_TAX_CODE'),
            data: 'TaxCode',
            type:'string',
            className:'col-md-1 text-left',
            searchable:true,
          },
          {
            title: this._translateService.instant('TRANSLATE.TAX_PERCENTAGES_ADD_EDIT_FORM_LABEL_TAX_NAME'),
            data: 'TaxName',
            type:'string',
            className:'col-md-1 text-left',
            searchable:true
          },
          {
            title: this._translateService.instant('TRANSLATE.TAX_PERCENTAGES_TAXPERCENTAGE_TABLE_HEADERS_EFFECTIVE_FROM'),
            data: 'EffectiveFrom',
            type:'string',
            className:'col-md-2 text-left',
             render: (data: string) => {
                          var datePipe = new C3DatePipe(this._appService);
                          return datePipe.transform(data);
                        },
          },
          {
            title: this._translateService.instant('TRANSLATE.TAX_PERCENTAGES_TAXPERCENTAGE_TABLE_HEADERS_TAX_PERCENTAGE'),
            data: 'TaxPercentage',
            type:'string',
            className:'text-center col-md-1 header-text-left',
            searchable:true,
          },
          {
            title: this._translateService.instant('TRANSLATE.TAX_PERCENTAGES_TAXPERCENTAGE_TABLE_HEADERS_ACTION'),
            defaultContent: '',
            className:'col-md-1 text-end pe-4',
            sortable: false,
            ngTemplateRef: {
              ref: this.actions,
            },
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  
  editTaxPercentage(data:any){
    this._router.navigate([`/partner/settings/taxpercentages/addandedittaxpercentages`], {
      state: { taxId: data.ID },
    });
  }

  deleteTaxPercentage(data:any){
    const confirmationText = this._translateService.instant(
      'TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT');
    this._notifierService
      .confirm({ title: confirmationText , confirmButtonColor: 'red'})
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          const subscription = this._taxService.deleteTaxPercentage(data).pipe(takeUntil(this.destroy$)).subscribe(res=>{
            let successMsg = this._translateService.instant('TRANSLATE.TAX_RULES_DELETE_SUCCESS');
            this._toastService.success(successMsg);
            this.reloadEvent.emit(true);
          })
          this._subscriptionArray.push(subscription);
        }
      });
  }
  onCaptureEvent(event: Event) { }
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
