import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { catchError, of, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { QuoteService } from '../quotes.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { IndividualConfig } from 'ngx-toastr';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { MODAL_DIALOG_CLASS, ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { ReportPopupComponent } from 'src/app/modules/standalones/report-popup/report-popup.component';
import { CloneQuoteCustomerComponent } from 'src/app/modules/standalones/clone-quote-customer/clone-quote-customer.component';
import { PlansListingService } from '../../plans/services/plans-listing.service';
import { QuoteCustomLineItemComponent } from '../quote-custom-line-item/quote-custom-line-item.component';


@Component({
  selector: 'app-quote-list',
  templateUrl: './quote-list.component.html',
  styleUrl: './quote-list.component.scss'
})
export class QuoteListComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings | any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  name: string = null;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('QuoteStatus') QuoteStatus: TemplateRef<any>;
  @ViewChild('amount') amount: TemplateRef<any>;
  activeCustomers: any[] = [];
    // Reload emitter inside datatable
    reloadEvent: EventEmitter<boolean> = new EventEmitter();
    PageMode = "list";
    allSelected = true;
    statusFilter = [];
    categoryFilter = [];
    owners = [];
    allOwnerSelected = true;
    selectStatus = [];
    selectCategory = [];
    selectQuote = [];
    selectStatuslist : any [];
    selectQuoteOwnerlist: any[];
    selectCategorylist : any [];
    entityName: any;
    public toastrConfig: Partial<IndividualConfig> = {
      enableHtml: true
    };
    Name:string;
    StartInd:number;
    SortColumn:any;
    SortOrder:any;
    QuotationName:string;
    CustomerName:string;
    PageCount:number;
    PageIndex:number;
    StatusIds:any;
    QuoteOwnerIds:any;
    ProviderCategories:any;
    ProviderCategory = false;
  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private pageInfo: PageInfoService,
    private _fileService: FileService,
    private _common: CommonService,
    private renderer: Renderer2,
    private _cdRef: ChangeDetectorRef,
    private _quotesService: QuoteService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService,
    private modalService: NgbModal
    
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this._quotesService = _quotesService;
    this._notifierService = _notifierService;
    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
  }

  get cloudHubConstants() {
    return CloudHubConstants;
  }

  permissions =
    {
      ApproveQuote: "Denied",
      DeleteQuote: "Denied",
      SaveQuote: "Denied"
    };

  HasPermissions() {
    this.permissions.ApproveQuote = this._permissionService.hasPermission(('APPROVE_QUOTE'));
    this.permissions.DeleteQuote = this._permissionService.hasPermission(('DELETE_QUOTE'));
    this.permissions.SaveQuote = this._permissionService.hasPermission(('SAVE_QUOTE'));
  }
  


  ngOnInit(): void {
    this.HasPermissions();
    this.handleTableConfig();
    this.getStatus();
    this.getQuoteOwner();
    this.getActiveCustomers();
    this.segmentforfilter();
    this.entityName = this._common.entityName;

    if(this._common.entityName === 'Partner' ) {
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_BREADCRUMB_BUTTON_TEXT_QUOTES"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT','MENU_BREADCRUMB_BUTTON_TEXT_QUOTES']);
    }
    else if(this._common.entityName === 'Reseller'){
      this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_BREADCRUMB_BUTTON_TEXT_QUOTES"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','MENU_BREADCRUMB_BUTTON_TEXT_QUOTES']);
    }
  }

  setDefaulsInputVal(){
    setTimeout(()=>{
      this.c3RouterService.setC3Input(this.CustomerName,1)
    },0)
  }

  downloadGridReport(){
    const moduleName = "partner.quote";
        const subscription = this._common.getDownloadableReportColumns({ entity: this._common.entityName, moduleName: moduleName, recordId:this._common?.recordId || null }).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          /* Creating config model */
          let reportConfig = new ReportPopupConfig();
          reportConfig.Columns = response.Data;
          reportConfig.title = 'QUOTE_REPORT_FILE_TYPES_HEADER';
          reportConfig.isSubmitButton = false;
          reportConfig.IsColumnsAvailable = true;
          reportConfig.IsSubHeaderAvailable = true;
          reportConfig.showFavourite = false;
          reportConfig.EmailInstructionText = 'QUOTE_REPORT_FILE_TYPES_EMAIL_INSTRUCTION_UPDATED';
          reportConfig.actionTooltipText = 'QUOTE_REPORT_FILE_TYPES_ICON_DESCRIPTION';
          /* selecting Size of popup based on condition */
          const config: NgbModalOptions = {
            modalDialogClass: reportConfig.IsSubHeaderAvailable ? MODAL_DIALOG_CLASS : '',
          };
          const modalRef = this.modalService.open(ReportPopupComponent, config);
          modalRef.componentInstance.reportConfig = reportConfig;
          modalRef.result.then((result) => {
            if (result) {
              let selectedColumn: any = [];
              result.Columns.map((e: any) => {
                if (e.IsChecked === true) {
                  selectedColumn.push(e.ColumnName);
                }
              });
              let columns = selectedColumn.join(',');
              let emailIsEmpty = (result?.Email == null || result?.Email == "" || result?.Email == undefined);
              const statusIds = Array.isArray(this.selectStatuslist) && this.selectStatuslist.length? this.selectStatuslist.join(',') : null;
              const quoteOwnerIds = Array.isArray(this.selectQuoteOwnerlist) && this.selectQuoteOwnerlist.length? this.selectQuoteOwnerlist.join(',') : null;
              const segments = Array.isArray(this.selectCategorylist) && this.selectCategorylist.length? this.selectCategorylist.join(',') : null;
              let reqbody = {
                ColumnsName: columns,
                FileType: result.FileType,
                Email: result.Email,
                RecordId : this._common.recordId,
                EntityName : this._common.entityName,
                StatusIds: statusIds,
                QuoteOwnerIds: quoteOwnerIds,
                Segments : segments,
                SearchKeyword: this.Name,
                CustomerName: this.CustomerName
              }
              if (columns != '' && columns.length > 0) {
                this._fileService.post('quotes/downloadquotes', true, reqbody);
              } else {
                this._toastService.error(
                  this._translateService.instant(
                    'TRANSLATE.DOWNLOAD_CUSTOMER_ATLEAST_SELECT_ONE_COLUMN_ERROR'
                  )
                );
              }
            }
          },
            (reason) => {
              modalRef.close();
            });
        });
        this._subscriptionArray.push(subscription);
  }
  
  cloneQuote(row: any) {
    const modalRef = this.modalService.open(CloneQuoteCustomerComponent, {
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: 'lg',
      backdrop: 'static',
    });
    modalRef.componentInstance.currentQuoteId = row?.QuotationId;
    modalRef.componentInstance.currentCustomerId = Number(row?.CustomerIdInt);
    modalRef.result.then(
    (result) => {
      if (result) {
          this.reloadEvent.emit(true);
      }
    },
    () => {}
  );
    this.cdRef.detectChanges();
  }
  
  handleTableConfig() { 
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn,SortOrder, length, QuotationName, CustomerName } =
            mapParamsWithApi(dataTablesParameters);
          this.Name = this.keyForData && (QuotationName === null || QuotationName === undefined || QuotationName === '')? this.Name : QuotationName;
          this.StartInd = this.keyForData && StartInd == 1? this.StartInd : StartInd;
          this.SortColumn = this.keyForData? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData? this.SortOrder : SortOrder;
          this.CustomerName = this.keyForData? this.CustomerName : CustomerName;
          let setDefaultInput:boolean = false
          if(this.CustomerName && this.keyForData){
            setDefaultInput = true;
          };
          this.keyForData = null;
          const searchParams = {
            SortColumn:this.SortColumn,
            SortOrder:this.SortOrder,
            PageCount: length - 1 ,
            PageIndex: (this.StartInd - 1) * length + 1,
            EntityName: this._common.entityName,
            RecordId: this._common.recordId,
            SearchKeyWord: this.Name,
            CustomerName: this.CustomerName,
            StatusIds: Array.isArray(this.selectStatuslist) ? this.selectStatuslist.join(',') : undefined,
            QuoteOwnerIds: Array.isArray(this.selectQuoteOwnerlist) ? this.selectQuoteOwnerlist.join(',') : undefined,
            Segments: Array.isArray(this.selectCategorylist) ? this.selectCategorylist.join(',') : undefined,

          }

          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._quotesService.getquotesList(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
 
              if (Data.length > 0) {
                [{ TotalQuoteCount: recordsTotal }] = Data; 
              }
              if(setDefaultInput){
                self.setDefaulsInputVal()
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
            searchable: true,
            title: this._translateService.instant('TRANSLATE.QUOTE_TABLE_HEADER_TEXT_NAME'),
            data: 'QuotationName', 
            className: 'col-md-2',
            ngTemplateRef: {
              ref: this.nameTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            orderable:false,
            searchable: true,
            title: this._translateService.instant('TRANSLATE.QUOTE_TABLE_HEADER_TEXT_CUSTOMER_NAME'),
            data: 'CustomerName',
            className: 'col-md-2'
          },
          {
            title: this._translateService.instant('TRANSLATE.QUOTE_TABLE_HEADER_TEXT_CREATE_DATE'),
            data: 'CreateDate',
            className: 'col-md-2',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          {
            orderable:false,
            title: this._translateService.instant('TRANSLATE.QUOTE_TABLE_HEADER_TEXT_EXPIRATION_DATE'),
            data: 'ExpirationDate',
            className: 'col-md-2',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            },
          },
          {
            orderable:false,
            title: this._translateService.instant('TRANSLATE.QUOTE_TABLE_HEADER_TEXT_STATUS'),
            data: 'QuoteStatus',
            className: 'col-md-1',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.QuoteStatus,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            orderable:false,
            title: this._translateService.instant('TRANSLATE.QUOTE_TABLE_HEADER_TEXT_QUOTE_OWNER'),
            data: 'QuoteOwner',
            className: 'col-md-2 text-break',
          },
          {
            orderable:false,
            title: this._translateService.instant('TRANSLATE.QUOTE_TABLE_HEADER_TEXT_QUOTE_AMOUNT'),
            data: 'Amount',
            className: 'col-md-2 text-end',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.amount,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.QUOTE_TABLE_HEADER_TEXT_ACTION'),
            className: 'col-md-2 text-end',
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
        
      };
      this._cdRef.detectChanges();
    });
  }
  onCaptureEvent(event: Event) { }

  getStatus() {
    const subscription = this._quotesService.getStatus().pipe(takeUntil(this.destroy$)).subscribe(response => {
      this.statusFilter = response.Data;
      this.statusFilter.forEach((v) =>{v.selected = true})
      this.selectStatus = this.statusFilter;
    });
    this._subscriptionArray.push(subscription);
  }

  getQuoteOwner(){
    const subscription = this._quotesService.getQuoteOwner().pipe(takeUntil(this.destroy$)).subscribe(response => {
      this.owners = response.Data;
      this.owners.forEach((v) =>{v.selected = true})
      this.selectQuote = this.owners;
    });
    this._subscriptionArray.push(subscription);
  }

  updatePageMode(pageMode) {
    this.PageMode = pageMode;
  }

  toggleAllSelection() {
    this.allSelected = !this.allSelected;
    this.statusFilter.forEach((status) => {
      status.selected = this.allSelected;
    });
    this.filterQuoteByStatus();
    this._cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }
  
  toggleAllCategorySelection()
  {
     this.ProviderCategory = !this.ProviderCategory;

  this.categoryFilter.forEach((category) => {
    category.selected = this.ProviderCategory;
  });

  this.filterQuoteByCategory();
  this._cdRef.detectChanges();
  
  }

  toggleStatusSelection(selectedStatus: any) {
    selectedStatus.selected = !selectedStatus.selected;
    this.allSelected = this.statusFilter.every((status) => status.selected);
    this.filterQuoteByStatus();
    this._cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }

  toggleCategorySelection(selectedCategory: any) {

  this.ProviderCategory = this.categoryFilter.every(
    (category) => category.selected
  );

  this.filterQuoteByCategory();
}

  filterQuoteByStatus() {
    this.selectStatuslist = [];
    this.selectStatus.forEach((item) => {
      if (item.selected == true) {
        this.selectStatuslist.push(item.ID);
      }
    })
    this.FilterQuote();
  }


  filterQuoteByCategory() {

  this.selectCategorylist = this.categoryFilter
    .filter(item => item.selected)
   .map(item => item.ProviderCategoryName);

  this.FilterQuote();
}


  ToggleAllOwnerSelection() {
    this.allOwnerSelected = !this.allOwnerSelected;
    this.owners.forEach((owner) => {
      owner.selected = this.allOwnerSelected;
    });
    this.selectQuote = this.allOwnerSelected ? [...this.owners] : [];
    this.filterQuoteByQuoteOwner();
    this._cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }
  
  ToggleQuoteOwnerSelection(owner) {
    owner.selected = !owner.selected;
    this.allOwnerSelected = this.owners.every((status) => status.selected);
    this.filterQuoteByQuoteOwner();
    this._cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }

  filterQuoteByQuoteOwner() {
    this.selectQuoteOwnerlist = [];
    this.owners.forEach((item) => {
      if (item.selected === true) {
        this.selectQuoteOwnerlist.push(item.Email);
      }
    });
    this.FilterQuote();
  }

  FilterQuote() {
    this.reloadEvent.emit(true);
  }

  getActiveCustomers() {
    const subscription = this._common.getCustomers().pipe(takeUntil(this.destroy$)).subscribe(function (response: any) {
        this.activeCustomers = response.Data;
    });
    this._subscriptionArray.push(subscription);
  }

  QuoteApproval(quotationId, quoteVersionId, isQuoteLineItemsDirectPurchaseAllowed, currencyCode, CustomerIdInt,isNewCustomerChecked: boolean ){

    // skip the active customer validation and go straight to approval
  if (isNewCustomerChecked) {
    this._proceedWithApproval( quotationId, quoteVersionId, isQuoteLineItemsDirectPurchaseAllowed, currencyCode,isNewCustomerChecked);
    return;
  }
    let isActiveCustomer = false;
      const subscription = this._common.getCustomers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.activeCustomers = response.Data;
        //Check if customer exists then only process the quote
        if (this.activeCustomers) {
          this.activeCustomers.forEach((customer: any) => {
              if (customer.ID == CustomerIdInt) {
                  isActiveCustomer = true;
              }
          })
      }
      this._subscriptionArray.push(subscription);
      if (isActiveCustomer) {
          var confirmationText = null;
          if (isQuoteLineItemsDirectPurchaseAllowed) {
              confirmationText = 'CONFIRMATION_TEXT_AUTOMATIC_PURCHASE'
          }
          else {
              confirmationText = 'CONFIRMATION_TEXT_MANUAL_PURCHASE'
          }
          this._notifierService.aprrove({ title: this._translateService.instant('TRANSLATE.'+confirmationText), confirmButtonColor: "green" }).then((result) => {
            if (result.isConfirmed ) {
              var reqBody = {
                QuoteId: quotationId,
                QuoteVersionId: quoteVersionId,
                RecordId: this._common.recordId,
                EntityName: this._common.entityName,
                CurrencyCode: currencyCode,
                IsQuoteLineItemsDirectPurchaseAllowed: isQuoteLineItemsDirectPurchaseAllowed
              };

            const subscription = this._quotesService.approveQuote(reqBody).pipe(
              // catchError((err) => {
              //   let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
              //   this._toastService.error(errmsg, {
              //     timeOut: 5000
              //   });
                //return of(null); })
             
            ).pipe(takeUntil(this.destroy$))
            .subscribe((response: any) => {
                if (response?.Data != null) {
                    var orderNumber = response.Data;
                    if (orderNumber != null && orderNumber != "NO_ORDER_PLACED") {
                      this._notifierService.success({title:this._translateService.instant('TRANSLATE.OUOTE_APPROVAL_CONFIRMATION_SUCCESS_MESSAGE', { OrderNumber: orderNumber })});
                    }
                    else if (orderNumber != null && orderNumber == "NO_ORDER_PLACED") {
                        this._notifierService.success({title:this._translateService.instant('TRANSLATE.OUOTE_APPROVAL_SUCCESS_MESSAGE')});
                    }
                    this.reloadEvent.emit(true);
                }
            })
            this._subscriptionArray.push(subscription);
          }
          });
      }
      else {
          this._toastService.error(this._translateService.instant("TRANSLATE.QUOTE_CUSTOMER_DELETE_VALIDATION_ERROR"));
      }
    });
  }

  private _proceedWithApproval(quotationId,quoteVersionId,isQuoteLineItemsDirectPurchaseAllowed,currencyCode,isNewCustomerChecked?: boolean
) {
  const confirmationText = isQuoteLineItemsDirectPurchaseAllowed ? 'CONFIRMATION_TEXT_AUTOMATIC_PURCHASE' : 'CONFIRMATION_TEXT_MANUAL_PURCHASE';

  this._notifierService.aprrove({
      title: this._translateService.instant('TRANSLATE.' + confirmationText),
      confirmButtonColor: 'green',
    })
    .then((result) => {
      if (result.isConfirmed) {
        const reqBody = {
          QuoteId: quotationId,
          QuoteVersionId: quoteVersionId,
          RecordId: this._common.recordId,
          EntityName: this._common.entityName,
          CurrencyCode: currencyCode,
          IsQuoteLineItemsDirectPurchaseAllowed: isQuoteLineItemsDirectPurchaseAllowed,
          IsNewCustomerChecked: isNewCustomerChecked 
        };

        const subscription = this._quotesService.approveQuote(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response?.Data != null) {
              const orderNumber = response.Data;
              if (isNewCustomerChecked) {
                          this._notifierService.success({
                            title: this._translateService.instant(
                              'TRANSLATE.OUOTE_APPROVAL_SUCCESS_MESSAGE_FOR_NEW_CUSTOMER'
                            ),
                          });
                  }
                      else if (orderNumber != null && orderNumber != 'NO_ORDER_PLACED') {
                        this._notifierService.success({
                          title: this._translateService.instant(
                            'TRANSLATE.OUOTE_APPROVAL_CONFIRMATION_SUCCESS_MESSAGE',
                            { OrderNumber: orderNumber }
                          ),
                        });
                      }
                      else if (orderNumber == 'NO_ORDER_PLACED') {
                        this._notifierService.success({
                          title: this._translateService.instant(
                            'TRANSLATE.OUOTE_APPROVAL_SUCCESS_MESSAGE'
                          ),
                        });
                      }
              this.reloadEvent.emit(true);
            }
          });
        this._subscriptionArray.push(subscription);
      }
    });
}
  editQuote(quoteVersionId, quoteStatus){
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/createquotes`];
    c3Router.extras = {state:{ QuoteVersionId: quoteVersionId, pageType: 'Edit', QuotesStatus: quoteStatus }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);

    // this._router.navigate(['partner/createquotes'], {state:{ QuoteVersionId: quoteVersionId, pageType: 'Edit', QuotesStatus: quoteStatus }});
  }

  setData(){
    return{
      SortColumn: this.SortColumn,
      SortOrder: this.SortOrder,
      PageCount: this.PageCount,
      PageIndex: this.PageIndex,
      StartInd: this.StartInd,
      EntityName: this._common.entityName,
      RecordId: this._common.recordId,
      Name: this.Name,
      CustomerName: this.CustomerName,
      StatusIds: this.StatusIds,
      QuoteOwnerIds: this.QuoteOwnerIds
    }
  }

  deleteQuote(quoteId) {
    const reqBody = {
      QuoteId: quoteId,
      QuoteStatus: CloudHubConstants.QUOTE_LIST_STATUS_DELETED,
      EntityName: this._common.entityName,
      RecordId: this._common.recordId,
      LoggedInUser: this._common.loggedInUserName
    }
    const confirmationMessage = this._translateService.instant('TRANSLATE.POPUP_DELETE_QUOTE_CONFIRMATION_TEXT');
    this._notifierService.confirm({ title: confirmationMessage }).then((result: { isConfirmed: any; isDenied: any; }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        const subscription = this._quotesService.deleteQuote(reqBody).pipe(takeUntil(this.destroy$)).subscribe(response => {
          this._toastService.success(this._translateService.instant('TRANSLATE.DELETE_QUOTE_SUCCESSFULLY'));
          this.reloadEvent.emit(true);
        });
        this._subscriptionArray.push(subscription);
      }
    });
  }

  addQuote() {
    this._router.navigate(['partner/createquotes'], {state:{ QuoteVersionId: 0, pageType: 'Add' }});
  }

  viewQuote(quoteVersionId) {
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/createquotes`];
    c3Router.extras = {state:{ QuoteVersionId: quoteVersionId, pageType: 'View' }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
    // this._router.navigate(['partner/createquotes'], {state:{ QuoteVersionId: quoteVersionId, pageType: 'View' }});
  }

  copyToClipboard(quoteVersionId: string): void {
    let env: any = localStorage.getItem('currentSiteId');
    env = JSON.parse(env);
    let envid = env;
  
    const subscription = this._quotesService.getQuoteDetails(quoteVersionId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      const quoteDetails = response.Data;
      const quoteURL = quoteDetails.QuoteDetails.QuoteURL;
  
      const shareableUrl = `${window.location.protocol}//${window.location.host}/quote/${envid}/${quoteURL}`;
  
      navigator.clipboard.writeText(shareableUrl).then(() => {
        this._notifierService.success({
          title: this._translateService.instant('TRANSLATE.QUOTE_COPY_CONFIRMATION_SUCCESS_MESSAGE')
        });
      }).catch(() => {
        this._notifierService.alert({
          title: this._translateService.instant('TRANSLATE.QUOTE_COPY_CONFIRMATION_ERROR_MESSAGE')
        });
      });
    });
    this._subscriptionArray.push(subscription);
  }

 segmentforfilter(){
  const subscription = this._common.getProviderCategories()
  .pipe(takeUntil(this.destroy$))
  .subscribe((res:any)=>{

    this.categoryFilter = res.Data || [];

    this.categoryFilter.forEach((v) =>{
      v.selected = false
    });

  });

  this._subscriptionArray.push(subscription);
}
  

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
 
}
