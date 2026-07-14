import { ChangeDetectorRef, Component, EventEmitter, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ToastService } from 'src/app/services/toast.service';
import { LicenseSummarySearchModel } from 'src/app/modules/analyze/models/license-summary.model';
import { NgbDatepickerModule, NgbDropdownModule, NgbModalOptions, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core'; 
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { Router, RouterModule } from '@angular/router';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { FileService } from 'src/app/services/file.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ConvertCommaSeparatedStringToListPipe } from 'src/app/shared/pipes/convert-comma-separated-string-to-list.pipe';
import { TranslationModule } from '../../i18n'; 
import { CustomCheckboxComponent } from '../c3-inputs/custom-checkbox/custom-checkbox.component';
import { CustomInputComponent } from '../c3-inputs/custom-input/custom-input.component';
import { CustomSelectComponent } from '../c3-inputs/custom-select/custom-select.component';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { CpvpartnerconsentComponent } from '../templates/cpvpartnerconsent/cpvpartnerconsent.component';
import { LicenseSummaryService } from '../../analyze/services/license-summary.service';
import _ from 'lodash';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe'; 
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { takeUntil } from 'rxjs';

@Component({
  standalone: true,
  imports:[
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    CustomInputComponent,
    CustomCheckboxComponent,
    CustomSelectComponent,
    TranslationModule,
    EditorModule,
    CpvpartnerconsentComponent,
    NgSelectModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    NgbDropdownModule,
    C3TableComponent,
    NgbTooltipModule,
    NgbDatepickerModule,
    FormsModule,
    C3CommonModule,
    C3TableComponent,
    ConvertCommaSeparatedStringToListPipe,
    NgSelectModule,
    ],
  providers:[LicenseSummaryService],
  selector: 'app-license-summary',
  templateUrl: './license-summary-report.component.html',
  styleUrls: ['./license-summary-report.component.scss'],
})
export class LicenseSummaryComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: any;
  isEditing: boolean[] = [];

  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';

  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('CustomerNameID') CustomerNameID: TemplateRef<any>;
  @ViewChild('checkboxconditions') checkboxconditions: TemplateRef<any>;
  @ViewChild('renewalDaysFilter') renewalDaysFilter: TemplateRef<any>;

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };

  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  customerColumns: any[] = [];
  partnerColumns: any[] = [];
  @ViewChild('selectElement') selectElement!: NgSelectComponent;

 
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (this.selectElement.isOpen) {
      this.selectElement.close();
    }
  
  }

  constructor(
    private toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private licenseSummaryService: LicenseSummaryService,
    private router: Router,
    private notifierService: NotifierService,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private commonService: CommonService,
    private fileService: FileService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,


  ) {
    super(permissionService, dynamicTemplateService, router, _appService);
    this.EntityName=this.commonService.entityName;
    this.RecordId = this.commonService.recordId;

  }


  customers: any[] = [];
  renewalDays: any = [];
  defaultPageCount: number = 50;
  tableLicenseSummaryList: any[] = [];
  selectedRenewalDay: any = '';
  SearchCriteria: LicenseSummarySearchModel = new LicenseSummarySearchModel(); //not using for now
  EntityName: string ;
  RecordId: any = null;
  Entity: string = 'Customer';
  selectedCustomer: any;
  SelectedCustomerC3Id:string |null = "AllCustomers" 

  Permissions = {
    HasCustomerRevenue: "Denied",
    HasAutoRenewProductSubscription: "Denied",
    HasGetResellers: "Denied"
  };

  hasPermissions(){
    this.Permissions.HasGetResellers = this._permissionService.hasPermission(this.cloudHubConstants.GET_RESELLERS);
    this.Permissions.HasCustomerRevenue = this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES');
    this.Permissions.HasAutoRenewProductSubscription = this._permissionService.hasPermission(this.cloudHubConstants.CUSTOMER_PRODUCT_AUTO_RENEW_STATUS);
}

  ngOnInit(): void {
    this.hasPermissions();
    this.getRenewalDays();
    this.handleTableConfig();
    
    this.getCustomers();
    this.pageInfo.updateTitle(this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_CAPTION_TEXT_LICENSE_SUMMARY'),true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'LICENSE_SUMMARY_CAPTION_TEXT_LICENSE_SUMMARY']);
    
    this.partnerColumns = [
      {
        searchable: true,
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_SUBSCRIPTION_NAME'),
        data: 'SubscriptionName',
        className: 'col-md-3',
        orderable: false,
        ngTemplateRef: {
          ref: this.propertiespills,
          context: {
            captureEvents: this.onCaptureEvent.bind(self),
          },
        },
      },
      {
        searchable: true,
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_PRODUCT_NAME'),
        data: 'ProductName',
        orderable: false,
        className: 'col-md-2',
      },
      {
        searchable: true,
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_CUSTOMER_NAME'),
        data: 'CustomerName',
        className: 'col-md-2',
        ngTemplateRef: {
          ref: this.CustomerNameID,
          context: {
            captureEvents: this.onCaptureEvent.bind(self),
          },
        },
      },
      {
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_PURCHASED_QUANTITY'),
        data: 'PurchasedQuantity',
        orderable: false,
        className: 'col-md-1 text-end pe-8',
      },
      {
        title: this.translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_AUTO_RENEW_LABEL'),
        data: 'IsAutoRenew',
        orderable: false,
        className: 'col-md-1 text-center pe-2',
        render: (data: boolean, type: any, row: any, meta: any) => {
          if (type === 'display') {
            const isAllowed = row.CategoryName === 'OnlineServicesNCE' && this.Permissions.HasAutoRenewProductSubscription === 'Allowed';
            const tooltip = this.translateService.instant('AUTO_RENEW_DENIED_FOR_PERPETUAL_SOFTWARE');
            return isAllowed
              ? `<input type="checkbox" ${data ? 'checked' : ''} (click)="setAutoRenewMode(${row})">`
              : `<input type="checkbox" ${data ? 'checked' : ''} disabled uib-tooltip="${tooltip}">`;
          }
          return data;
        },
        ngTemplateRef: {
          ref: this.checkboxconditions,
          context: {
            captureEvents: this.onCaptureEvent.bind(self),
          },
        },
      },
      {
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_RENEWS_ON'),
        data: 'RenewsOn', 
        className: 'col-md-1 text-start',
        render: (data: any, type: any, row: any) => {
          if (type === 'display' && data) {
            const date = row.IsAutoRenew ? row.RenewsOn : row.ExpiresOn 
            var datePipe = new C3DatePipe(this._appService); 
            return row.IsAutoRenew === false ? `<span style="color: red;">${datePipe.transform(date)}</span>` : datePipe.transform(date);
          }
          return data;
        }
      },
      
      {
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_RENEWS_IN'),
        data: 'RenewsIn',
        selectable: true,
        disableDefaultSelect:false,
        optionsArray: this.renewalDays,
        className: 'col-md-1 text-start pe-2',
        render: (data: any, type: any, row: any) => {
            if (type === 'display' && data && data >=0) {
                return row.IsAutoRenew === false ? `<span style="color: red;">${data}</span>` : data;
            }
            return data;
        },
    },
      {
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_REPORT_CAPTION_TEXT_RESELLER_NAME'),
        data: 'ResellerName',
        orderable: false,
        className: 'col-md-1 text-start',
        visible:this.commonService.entityName === 'Partner' && this.Permissions.HasGetResellers === 'Allowed',
      },
    ];

    this.customerColumns = [
      {
        searchable: true,
        orderable: false,
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_SUBSCRIPTION_NAME'),
        data: 'SubscriptionName',
        className: 'col-md-3',
        ngTemplateRef: {
          ref: this.propertiespills,
          context: {
            captureEvents: this.onCaptureEvent.bind(self),
          },
        },
      },
      {
        searchable: true,
        orderable: false,
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_PRODUCT_NAME'),
        data: 'ProductName',
        className: 'col-md-2',
      },
      {
        searchable: true,
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_CUSTOMER_NAME'),
        data: 'CustomerName',
        className: 'col-md-2',
        ngTemplateRef: {
          ref: this.CustomerNameID,
          context: {
            captureEvents: this.onCaptureEvent.bind(self),
          },
        },
      },
      {
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_PURCHASED_QUANTITY'),
        orderable: false,
        data: 'PurchasedQuantity',
        className: 'col-md-1 text-end pe-9',
      },
      {
        title: this.translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_AUTO_RENEW_LABEL'),
        data: 'IsAutoRenew',
        orderable: false,
        className: 'col-md-1 pe-2 text-center',
        render: (data: boolean, type: any, row: any, meta: any) => {
          if (type === 'display') {
            const isAllowed = row.CategoryName === 'OnlineServicesNCE' && this.Permissions.HasAutoRenewProductSubscription === 'Allowed';
            const tooltip = this.translateService.instant('AUTO_RENEW_DENIED_FOR_PERPETUAL_SOFTWARE');
            return isAllowed
              ? `<div class=" form-check text-center"><input type="checkbox" ${data ? 'checked' : ''} (click)="setAutoRenewMode(${row})"></div>`
              : `<input type="checkbox" ${data ? 'checked' : ''} disabled uib-tooltip="${tooltip}">`;
          }
          return data;
        },
        ngTemplateRef: {
          ref: this.checkboxconditions,
          context: {
            captureEvents: this.onCaptureEvent.bind(self),
          },
        },
      },
      {
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_RENEWS_ON'),
        data: 'RenewsOn', 
        className: 'col-md-1 text-start',
        render: (data: any, type: any, row: any) => {
          if (type === 'display' && data) { 
            const date = row.IsAutoRenew ? row.RenewsOn : row.ExpiresOn 
            var datePipe = new C3DatePipe(this._appService); 
            return row.IsAutoRenew === false ? `<span style="color: red;">${datePipe.transform(date)}</span>` : datePipe.transform(date);
          }
          return data;
        }
      },
      {
        title: this.translateService.instant('TRANSLATE.LICENSE_SUMMARY_TABLE_HEADER_TEXT_RENEWS_IN'),
        data: 'RenewsIn',
        selectable : true,
        disableDefaultSelect:false,
        optionsArray: this.renewalDays,
        className: 'col-md-1 text-start pe-4',
        render: (data : any, type : any, row: any) => {
          if (type === 'display' && data) {
            return row.IsAutoRenew === false ? `<span style="color: red;">${data}</span>` : data;
          }
          return data;
        },
      },   
    ];
  }


  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        order: [(this.EntityName !== 'Customer') ? 2 : 1, 'asc'],
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, length,ProductName,CustomerName,SubscriptionName, RenewsIn } = mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
          this.SearchCriteria.SubscriptionName = SubscriptionName
          const subscription = this.licenseSummaryService
            .getLicenseSummaryReport({
              CustomerC3Id: (this.EntityName != 'Customer') ? this.SelectedCustomerC3Id : this.RecordId,
              SubscriptionName:SubscriptionName,
              EntityName: this.EntityName,
              RecordId: this.RecordId,
              ProductName:ProductName,
              CustomerName:CustomerName,
              PageSize:length,
              SortColumn: SortColumn,
              StartInd, Name, SortOrder,
              RenewsInDays : RenewsIn
            })
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
        columns:
        this.EntityName === 'Customer'
          ? this.customerColumns
          : this.partnerColumns,
      };
      this.cdRef.detectChanges();
    });
  }
  
  getRenewalDays() {
    this.renewalDays = [{ id: '', name: this.translateService.instant('TRANSLATE.RENEWAL_ALL_DAYS') }];
    const days = [7, 15, 30, 60];
    days.forEach((x) => {
      if (!this.renewalDays.find((day:any) => day.id === x)) {
        this.renewalDays.push({ id: x, name: `${x} ${this.translateService.instant('TRANSLATE.RENEWAL_DAYS_TEXT')}` });
      }
    });
  }

  setAutoRenewMode(product: any) {
    const updatestatus = product.IsAutoRenew ? 'disable' : 'enable';
    const confirmationMessage = this.translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUBSCRIPTION_CHANGE_AUTO_RENEW_STATUS_TEXT', {
      productName: product.SubscriptionName,
      autoRenewStatus: updatestatus,
    });
    this.notifierService.confirm({title:confirmationMessage,confirmButtonColor: 'green',}).then((result) => {
      if (result.isConfirmed) {
        const subscription = this.licenseSummaryService.changeAutoRenewStatus(product.InternalCustomerProductId, !product.IsAutoRenew).pipe(takeUntil(this.destroy$)).subscribe(
          (response) => {
            this.toastService.success(
              this.translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_NCE_SUBSCRIPTION_UPDATED_AUTO_RENEW_SUCCESSFULLY_TEXT', {
                productName: product.SubscriptionName,
              })
            );
            this.reloadEvent.emit(true);
          },
          (error) => {
            this.toastService.error(this.translateService.instant('TRANSLATE.ERROR_UPDATING_AUTO_RENEW_STATUS', {
              productName: product.SubscriptionName,
            }));
            this.reloadEvent.emit(true);
          }
        );
        this._subscriptionArray.push(subscription);
      } else {
        this.reloadEvent.emit(true);
      }
    });
  }
  reloadTableData() {
    this.reloadEvent.emit(true); 
  }

  onCaptureEvent(event: Event) {
    // Handle captured events if necessary
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }


  getCustomers() {
    const subscription = this.licenseSummaryService
      .getCustomersList({
        EntityName: this.EntityName,
        RecordId: this.RecordId
        
      })
      .pipe(takeUntil(this.destroy$)).subscribe((response) => {
        this.customers = [{ EntityName: " ", C3Id: "AllCustomers", Name: this.translateService.instant("TRANSLATE.REPORT_SELECT_CUSTOMER_All") }];
        if (this.EntityName === 'Partner' && this.Permissions.HasGetResellers === 'Allowed') {
          this.customers = this.customers.concat([{ EntityName: " ", C3Id: "AllResellers", Name: this.translateService.instant("TRANSLATE.REPORT_SELECT_RESELLER_ALL") }]);
        }
        // var data = response;
        // this.customers = this.customers.concat(data);
 
        // this.selectedCustomer = this.customers[0];
        
        let data = response;
        this.customers = _.union(this.customers, data);
        //Removing reseller from the list if reseller is denied
        if (this.Permissions.HasGetResellers === 'Denied' && this.commonService.entityName === 'Partner') {
          this.customers = this.customers.filter(e => e.EntityName != "Reseller") 
        }
        this.selectedCustomer = this.customers[0]
      });
      setTimeout(() => {
        this.cdRef.detectChanges(); // Trigger change detection
      }, 1000);
      this._subscriptionArray.push(subscription);
  }
  onSelectedCustomerChange() {
    this.SelectedCustomerC3Id = null;
    if (this.selectedCustomer.C3Id != null) {
      this.SelectedCustomerC3Id = this.selectedCustomer.C3Id;
    } else {
      this.selectedCustomer = null;
    }
    this.reloadEvent.emit(true);
  }


  setNgSelectText(){
    const selectDropdown = document.querySelector('.ng-option.ng-option-disabled') as HTMLInputElement
    if(selectDropdown){
      // Change the text content of the <span>
      selectDropdown.textContent = this.translateService.instant('TRANSLATE.MICROSOFT_USERS_NO_ITEMS_FOUND');
  }
  }

  exportLicenseSummaryReport() {
    this.SelectedCustomerC3Id = this.EntityName !== 'Customer' ? this.SelectedCustomerC3Id : this.RecordId;
    const reqBody = {
      CustomerC3Id: this.SelectedCustomerC3Id,
      CustomerName: this.SearchCriteria.CustomerName,
      RenewsInDays: this.SearchCriteria.RenewsInDays,
      ProviderName: this.SearchCriteria.ProviderName,
      ProviderTenantId: this.SearchCriteria.ProviderTenantID,
      ProductName: this.SearchCriteria.ProductName,
      SubscriptionName: this.SearchCriteria.SubscriptionName,
      Owner: this.SearchCriteria.Owner
    };

  

    this.fileService.getFile(`reports/${this.EntityName}/${this.RecordId}/GetLicenseSummaryReportExportCSV`, true, reqBody);
     
  }

}
