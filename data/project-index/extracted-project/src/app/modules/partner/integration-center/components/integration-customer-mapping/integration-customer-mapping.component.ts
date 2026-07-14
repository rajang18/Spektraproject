import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { IntegrationCenterService } from '../../integration-center.service';
import { takeUntil } from 'rxjs';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-integration-customer-mapping',
  standalone: false,
  templateUrl: './integration-customer-mapping.component.html',
  styleUrl: './integration-customer-mapping.component.scss',
})
export class IntegrationCustomerMappingComponent
  extends C3BaseComponent
  implements OnInit
{
   shouldShowFilter: boolean = false;
  isLoading: boolean = true;
  datatableConfig: ADTSettings | any;
  datatableConfig1: ADTSettings | any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';

  @ViewChild('actions') actions: TemplateRef<any>;

  offerId: any;
  StartInd: number = 1;
  customerId:string='';
  comapnyId:string='';
  C3ID:string='';
  searchbyname : string = ' ';
  isActive : boolean = false;

  constructor(
    public router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private appsettings: AppSettingsService,
    private cdRef: ChangeDetectorRef,
    private integerationService:IntegrationCenterService,
    private commonService: CommonService,
    private _translateService: TranslateService,
    private c3RouterService: C3RouterService,
    private pageInfo: PageInfoService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _fileService: FileService,    
  ) {
    super(permissionService, dynamicTemplateService, router, appsettings);
    this.hasPermission();
  }

  permissions = {
       
        HasGetBusinessCentralEntityMappingDetails: "Denied",
        HasAddBusinessCentralEntityMapping: "Denied",
        HasRemoveBusinessCentralEntityMapping: "Denied",
    };

    hasPermission() { 
        this.permissions.HasGetBusinessCentralEntityMappingDetails = this._permissionService.hasPermission(this.cloudHubConstants.GET_BUSINESS_CENTRAL_ENTITY_MAPPING_DETAILS);
        this.permissions.HasAddBusinessCentralEntityMapping = this._permissionService.hasPermission(this.cloudHubConstants.ADD_BUSINESS_CENTRAL_ENTITY_MAPPING);
        this.permissions.HasRemoveBusinessCentralEntityMapping = this._permissionService.hasPermission(this.cloudHubConstants.REMOVE_BUSINESS_CENTRAL_ENTITY_MAPPING);
    }
    
  ngOnInit(): void {
    this.searchbyname = this._translateService.instant('PLACEHOLDER_FOR_TEXT_SEARCH_BY_NAME')
    this.pageInfo.updateTitle(this._translateService.instant("BUSINESS_CENTRAL_INTEGRATION_CENTER"), true);
    this.pageInfo.updateBreadcrumbs(['BUSINESS_CENTRAL_INTEGRATION']);
    this.handleTableConfig();
  }

  handleTableConfig() {
  setTimeout(() => {
    const self = this;
    this.datatableConfig = {
      serverSide: true,
      ordering: false,
      pageLength: (this.appsettings.$rootScope.DefaultPageCount || 10),
      ajax: (dataTablesParameters: any, callback: any) => {
        const { 
          StartInd, 
          SortColumn, 
          SortOrder, 
          PageSize, 
          RecordName,                
          BusinessCentralCompanyName,  
          BusinessCentralCustomerName, 
        } = mapParamsWithApi(dataTablesParameters);

        const subscription = this.integerationService
          .GetMappedBusinessCentralCustomers({
            RecordName: RecordName,
            RecordC3Id: this.C3ID,
            BusinessCentralCompanyName: BusinessCentralCompanyName,
            BusinessCentralCompanyId: this.comapnyId,
            BusinessCentralCustomerName: BusinessCentralCustomerName,
            BusinessCentralCustomerId: this.customerId,

            IncludeInActiveMappings: this.isActive, 
            StartInd: StartInd,
            PageSize: PageSize,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            
            if (Data && Data.length > 0) {
              recordsTotal = Data[0].TotalRows;
            }

            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
          });

        this._subscriptionArray.push(subscription);
      },
    };
    
    this.invoiceLineItemsColumns();
    this.cdRef.detectChanges();
  });
}

      invoiceLineItemsColumns() {
      this.datatableConfig.columns = [
        {
          className: 'col-md-3 text-bold',
          title: this._translateService.instant('TRANSLATE.CUSTOMER_MAPPING_HEADER_CUSTOMER_NAME_TITLE'),
          data: 'RecordName',
          searchable: true,
          sortable: false,
          defaultContent: '',
          render: function (data: any, type: any, row: any) {
            const textClass = row.IsActive === false || row.IsActive === 0 ? 'text-danger' : '';
            return `
              <span class="fw-semibold ${textClass}">${data}</span>
              <div class="text-muted small">${row.RecordC3Id || ''}</div>
            `;
          }
        },
        {
          className: 'col-md-3 body-alignment-normal',
          title: this._translateService.instant('TRANSLATE.CUSTOMER_MAPPING_HEADER_COMPANY_NAME_AND_ID_TITLE'),
          data: 'BusinessCentralCompanyName',
          searchable: true,
          sortable: false,
          defaultContent: '',
          render: function (data: any, type: any, row: any) {
            return `
              <div class="fw-semibold">${data || ''}</div>
              <div class="text-muted small">${row.BusinessCentralCompanyId || ''}</div>
            `;
          }
        },
        {
          className: 'col-md-3',
          title: this._translateService.instant('TRANSLATE.CUSTOMER_MAPPING_HEADER_CUSTOMER_NAME_AND_ID_TITLE'),
          data: 'BusinessCentralCustomerName',
          searchable: true,
          orderable: false,
          defaultContent: '',
          render: function (data: any, type: any, row: any) {
            return `
              <div class="fw-semibold">${data || ''}</div>
              <div class="text-muted small">${row.BusinessCentralCustomerId || ''}</div>
            `;
          }
        },
        {
          type: 'string',
          className: 'col-md-1 text-center align-middle',
          title: this._translateService.instant('TRANSLATE.CUSTOMER_MAPPING_HEADER_CREATED_DATE_TITLE'),
          data: 'CreatedDate',
          render: (data: string) => {
            var datePipe = new C3DatePipe(this.appsettings);
            return datePipe.transform(data);
          },
          orderable: true,
        },
        {
          className: 'col-md-1 text-center align-middle',
          title: this._translateService.instant('TRANSLATE.TABLE_HEADER_TEXT_ACTIONS'),
          defaultContent: '',
          orderable: false,
          ngTemplateRef: { ref: this.actions }
        },
      ];
    }


  addCustomerMappingData(rowData: any,pageType:string) {
    // this.router.navigate([
    //   '/partner/integrationcenter/customer-mapping-add',
    //   rowData,
    // ]);
    if (pageType == "add") {
          this.offerId = 0;
        }
        else {
          this.offerId = rowData?.ProductId;
        }
        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/integrationcenter/customer-mapping-add`];
        c3Router.extras = {state: { offerId: this.offerId, pageType: pageType }};
        c3Router.data = this.setData();
        this.c3RouterService.navigate(c3Router);
  }

   deleteMappedCustomer(data: any) {
        const params ={
            RecordName: data.RecordName,
            RecordEntityName : data.EntityName,
            RecordC3Id: data.RecordC3Id,
          }
        let deleteCustomerConfirmation = this._translateService.instant('TRANSLATE.INTEGRATION_BUSINESS_CENTRAL_POPUP_DELETE_CUSTOMER_CONFIRMATION_TEXT', { RecordName: data.RecordName });
        this._notifierService.confirmDeletion({ title: deleteCustomerConfirmation }).then((result: { isConfirmed: any, isDenied: any }) => {
            if (result.isConfirmed) {
                const subscription = this.integerationService.DeleteMappedCustomer(params).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                    if (response.Status === "Success") {
                        this._toastService.success(this._translateService.instant('TRANSLATE.DELETE_CUSTOMER_SUCCESS'));
                        //this.resetSearchCriteria();
                    }
                    else {
                        this._toastService.error(this._translateService.instant('TRANSLATE.DELETE_CUSTOMER_FAILURE'));
                        //this.resetSearchCriteria();
                    }
                    this.reloadEvent.emit(true);
                });
                this._subscriptionArray.push(subscription);
            }
        });
    }

     displayFilter() {
    this.shouldShowFilter = !this.shouldShowFilter;
  }

    resetSearchCriteria() {
    this.comapnyId=null;
    this.C3ID=null;
    this.customerId=null;
    this.isActive=false;
    this.cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }

  searchCustomers() {
    this.reloadEvent.emit(true);
  }

  setData(){
    return{
      StartInd: this.StartInd,
    }
  }

  ActiveFilter(state){
  this.datatableConfig = null;
  this.isActive=state;
  this.handleTableConfig();
  }


  onCaptureEvent(event: Event) {}
  onDownloadCSVHelper(){
    this._fileService.getFile(`businessCentral/GetUnmappedBusinessCentralCustomers/${this.commonService.entityName}/${this.commonService.recordId}/Download?v=${(new Date()).getTime()}`, true);
  }
   onDownloadCSVHelper2(){
    this._fileService.getFile(`businessCentral/${this.commonService.entityName}/${this.commonService.recordId}/CustomerMappingHelper?v=${(new Date()).getTime()}`, true);
  }

  onDownloadMappedCustomersCSV(state:boolean) {

  const params = {
    RecordName: '',
    RecordC3Id: this.C3ID,
    BusinessCentralCompanyName: '',
    BusinessCentralCompanyId: '',
    BusinessCentralCustomerName: '',
    BusinessCentralCustomerId: '',
    IncludeInActiveMappings: state, 
    StartInd: 1,
    PageSize: 1000,
    SortColumn: '',
    SortOrder: 'ASC',
   };
  

  const queryString = new URLSearchParams(params as any).toString();

  this._fileService.getFile(
    `businessCentral/GetEntityMappingsForBusinessCentral/Download?${queryString}&v=${new Date().getTime()}`,
    true
  );
}
}
