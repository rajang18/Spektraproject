import { ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbCalendar, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import moment from 'moment';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CustomerOrdersService } from '../services/customer-orders.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { UserContextService } from 'src/app/services/user-context.service';
import _ from 'lodash';
import { DateTimeFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { CommonService } from 'src/app/services/common.service';
import { takeUntil } from 'rxjs';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent extends C3BaseComponent implements OnDestroy {

  datatableConfig: ADTSettings;
  isEditing: boolean[] = [];
  hasSiteEnabled: false;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild ('cartAction') cartAction:TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  @ViewChild ('siteName') siteName:TemplateRef<any>;
  @ViewChild('departmentName') departmentName: TemplateRef<any>;
  @ViewChild('orderId') orderId: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  shouldShowFilter: boolean = false;
  OrderNumber: any = "";
  Orderedfrom:any = "";
  OrderedTo:any = "";
  CartAction:string = "";
  OrderStatus:string = "";
  today = inject(NgbCalendar).getToday();
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  orderStatus: any[]= [];
  needReload: boolean = false;
  childTable: any| ElementRef<any>;
  page: any;
  pageLength: any = 10;
  defaultPageObj: any;
  previousDate: any;
  maxDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1, 
    day: new Date().getDate()-1
  }; 

  globalDateFormat: any;
  constructor(
    private _customerOrdersService: CustomerOrdersService,
    private cdRef: ChangeDetectorRef,
    private pageInfo: PageInfoService,
    private translateService: TranslateService,
    public _router: Router,
    private appSettings:AppSettingsService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public userContext: UserContextService,
    private _commonService: CommonService,
    private dateTimeFilter: DateTimeFilterPipe,
    private c3RouterService:C3RouterService
  )
  {
    super(_permissionService, _dynamicTemplateService, _router, appSettings)
    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
  }

  ngOnInit(): void {
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.CUSTOMER_ORDERS_BREADCRUMB_BUTTON"), true);
    this.pageInfo.updateBreadcrumbs(['CUSTOMER_ORDERS_BREADCRUMB_BUTTON']);
    let payload:any = null;
    if(this._customerOrdersService.ordersPayload){
      payload=this._customerOrdersService.ordersPayload;
      this.defaultPageObj=this._customerOrdersService.ordersPayload;
    }
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.GetStatusList();
    this.handleTableConfig();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: ( this._appSettingsService.$rootScope.DefaultPageCount || 10),
        order:[2,'desc'],
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, length } =
          mapParamsWithApi(dataTablesParameters);
          const payload = {
            StartInd: StartInd || dataTablesParameters.StartInd || 1,
            Sites: '',
            Orderedfrom: this.Orderedfrom ? this.formatDateObject(this.Orderedfrom) : null,
            SortColumn:SortColumn,
            OrderedTo: this.OrderedTo ? this.formatDateObject(this.OrderedTo) : null,
            SortOrder: SortOrder,
            OrderStatus: this.OrderStatus,
            OrderNumber: this.OrderNumber,
            Page: StartInd,
            CartAction: this.CartAction,
            Departments: dataTablesParameters.Departments || "",
            PageSize: length || dataTablesParameters.PageSize|| 10,
          };
          self._customerOrdersService.ordersPayload = {...payload};
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._customerOrdersService.getOrderList(payload).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let recordsTotal = 0; 
            this.hasSiteEnabled = _.result(Data[0], 'HasSiteEnabled', false);

            if (Data.length > 0) {
              [{ TotalRows: recordsTotal }] = Data;
            }
            self.needReload = false;
            Data.forEach((datum:any)=>{
                if (datum.OrderStatus === 'Ordered') {
                    self.needReload = true;
                }
            })
            if(self.needReload){
              setTimeout(()=>{
                this.reloadEvent.emit(true)
              },15000)
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
          { title: this.translateService.instant('TRANSLATE.ORDER_ID'), className: 'col-md-3 body-alignment-normal',
            defaultContent: '',
            data:'ProviderOrderId',
            ngTemplateRef: {
              ref: this.orderId,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            }
           },
          { title: this.translateService.instant('TRANSLATE.CUSTOMER_ORDERS_TABLE_TITLE_ORDERED_BY'), data: 'OrderdBy',className: 'col-md-2',orderable: false },
          
          { //	Feb 20, 2024 05:02:28 //Feb Tu, 2024 11:09:16
            title: this.translateService.instant('TRANSLATE.ORDER_DETAILS_FIELD_ORDERED_ON'),
            data: 'OrderedOn',
            className: 'col-md-2', 
            render: (data: string) => {
              var datePipe = new DateTimeFilterPipe(this.appSettings);
              return datePipe.transform(data);
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_ORDERS_TABLE_TITLE_STATUS'),
            className: 'col-md-1 body-alignment-normal',
            data:'Status',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.status,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_ORDERS_TABLE_TITLE_SITE_NAME'),
            className: 'col-md-2 body-alignment-normal',
            defaultContent: '',
            data:'SiteName',
            ngTemplateRef: {
              ref: this.siteName,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_ORDERS_TABLE_TITLE_DEPARTMENT_NAME'),
            className: 'col-md-2 body-alignment-normal',
            defaultContent: '',
            data:'DepartmentName',
            ngTemplateRef: {
              ref: this.departmentName,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
           {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_ORDERS_TABLE_TITLE_OPERATION'),
            className: 'col-md-1 body-alignment-normal text-nowrap',
            orderable: false,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.cartAction,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_ORDERS_TABLE_TITLE_ACTION'),
            className: 'col-md-1 text-end',
            orderable: false,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
      };
      this.cdRef.detectChanges();
    });
}

  onCaptureEvent(event: Event) { }

  stopImpersonation(){
    let isCustomerContext = !!this._commonService.currentImpersonationUserEmail;

    if(!isCustomerContext){ 
      var localStorageCustomerContext = localStorage.getItem("impersonationContext");
      var CustomerContext  = JSON.parse(localStorageCustomerContext);
       isCustomerContext =!! decodeURIComponent(CustomerContext.Username);
    }
    if (isCustomerContext) {
    let anchor = document.createElement('a');
    let url = `${window.location.protocol}//${window.location.host}`;
    url = url + "/partner/quotelist";
    localStorage.removeItem("impersonationContext");
    if(!this.userContext.IsResellerImpersonated){
      localStorage.removeItem("RecordId"); 
      localStorage.setItem("EntityName", "Partner");
    }else{
      let resellerImpersonationContext:any = localStorage.getItem("resellerImpersonationContext");
      resellerImpersonationContext = JSON.parse(resellerImpersonationContext);
      localStorage.setItem("RecordId",resellerImpersonationContext.RecordId); 
      localStorage.setItem("EntityName", "Reseller");
    }
    this.userContext.setUserContext();
    anchor.href = url;
    anchor.click();
   }

  }

  formatDateObject(dateObj: any) {
    let {
      year,
      month,
      day
    } = dateObj;
    const mon = {
      year: year,
      month: (month as number) - 1,
      day: day,
    };
    return moment(mon).format(this.appSettings.$rootScope.dateFormat.toUpperCase())
  }

  GetStatusList() {
    const subscription = this._customerOrdersService.GetStatusList().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.orderStatus = response.Data; 
    });
    this._subscriptionArray.push(subscription);
  }

  displayFilter() {
    this.shouldShowFilter = !this.shouldShowFilter;
  }

  SearchOrders() {
    this.reloadEvent.emit(true);
  }

  resetSearchCriteria() {
    this.OrderNumber = "";
    this.OrderStatus ="";
    this.CartAction ="";
    this.Orderedfrom ="";
    this.OrderedTo = "";
    this.cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }

clearStartDate(datePicker: any) {
 this.Orderedfrom = null; 
  datePicker.close();
}

clearEndDate (datePicker: any) {
  this.OrderedTo = null; 
  datePicker.close();
}
 
  // viewOrderDetails(orderId:any){
  //   this._router.navigate([`customer/orders/viewDetails/${orderId}`])
  // }
  
  viewOrderDetails(orderId:any) {
      let c3Router = new C3Router();
      c3Router.keepHistory = true;
      c3Router.commands = [`customer/orders/viewDetails/${orderId}`];
      c3Router.extras = {state: {}};
      c3Router.data = this.setData();
      this.c3RouterService.navigate(c3Router);
      // this._router.navigate([`partner/customoffer/partnerofferdetails`]
      //   , { state: { offerId: this.offerId, offerType: offerType } });
    }
  setData(){
    return{
      StartInd: 1,
      Sites: '',
      Orderedfrom: this.Orderedfrom ? this.formatDateObject(this.Orderedfrom) : null,
      SortColumn:"desc",
      OrderedTo: this.OrderedTo ? this.formatDateObject(this.OrderedTo) : null,
      SortOrder: "OrderedOn",
      OrderStatus: this.OrderStatus,
      OrderNumber: this.OrderNumber,
      Page: 1,
      CartAction: this.CartAction,
      Departments:"",
      PageSize: 25,
    }
  }


ngOnDestroy(): void {
  super.ngOnDestroy();
}
 
}
