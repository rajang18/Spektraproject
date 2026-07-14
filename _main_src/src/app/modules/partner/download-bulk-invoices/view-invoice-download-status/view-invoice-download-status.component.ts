import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { DownloadBulkInvoicesService } from '../services/download-bulk-invoices.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { TranslationService } from 'src/app/modules/i18n';
import { TranslateModule } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-view-invoice-download-status',
  templateUrl: './view-invoice-download-status.component.html',
  styleUrl: './view-invoice-download-status.component.scss'
})
export class ViewInvoiceDownloadStatusComponent  extends C3BaseComponent implements OnInit{

  @Input() bulkInvoice: any;
  datatableConfig: ADTSettings | any;
  bulkInvoiceDetails:any=null;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  // onCaptureEvent: any;
  constructor(private downloadBulkInvoicesService: DownloadBulkInvoicesService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private notifier: NotifierService,
    private translateService: TranslateService,
    public router: Router,
    private fileService: FileService,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private commonService: CommonService,
    private translation : TranslationService,
    private _ngbactiveModal : NgbActiveModal,
    private _modalService: NgbModal,
    private translationModule: TranslateModule,
    private _appService: AppSettingsService,
  ) { super(permissionService, dynamicTemplateService, router, _appService) }
 
 
  ngOnInit(): void {
    this.bulkInvoiceDetails = this.bulkInvoice;
    this.handleTableConfig();
  }
  
  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, PageSize,length } =
            mapParamsWithApi(dataTablesParameters);
           const subscription = this.downloadBulkInvoicesService
            .getTableinvoiceDownloadStatus({
              downloadBulkInvoiceId:this.bulkInvoiceDetails.ID
            })
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              if (Data.length > 0) {
                  recordsTotal = Data.length;
              }
              callback({
                data: (Data.slice((StartInd - 1) * length, StartInd * length)),
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
            
        },
        columns: [
          { 
            sortable: false,
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_DOWNLOAD_PROGRESS_POPUP_TABLE_HEADER_OWNER'), data: 'Owner',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
           },
          { 
            sortable: false,
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_DOWNLOAD_PROGRESS_POPUP_TABLE_HEADER_USER'), data: 'CustomerName', },
          { 
            sortable: false,
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_DOWNLOAD_PROGRESS_POPUP_TABLE_HEADER_INVOICE_NUMBER'), data: 'InvoiceNumber' },
          { 
            sortable: false,
            title: this.translateService.instant('TRANSLATE.BULK_INVOICE_DOWNLOAD_PROGRESS_POPUP_TABLE_HEADER_STATUS'), data: 'Status' }
        ],
        order:[]
      };
      this.cdRef.detectChanges();
    });
  }

  close() {
    this._modalService.dismissAll();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
