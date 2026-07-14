import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PartnerOffersListingService } from '../../services/partner-offers-listing.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import moment from 'moment';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-bulk-upload-view-history',
  templateUrl: './bulk-upload-view-history.component.html',
  styleUrl: './bulk-upload-view-history.component.scss'
})
export class ViewHistoryComponentOfBulkUploadOfPartnerOffers extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings | any;
  propertyData: any;
  @ViewChild('productName') productName: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  @ViewChild('SalePrice') SalePrice: TemplateRef<any>;
  @ViewChild('CostPrice') CostPrice: TemplateRef<any>;
  @ViewChild('createDate') createDate: TemplateRef<any>;
  @ViewChild('property') property: TemplateRef<any>;
  @ViewChild('descriptiontext') descriptiontext: TemplateRef<any>;
  isShowMoreMap: { [key: string]: boolean } = {};
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  shouldShowFilter: boolean = false;
  selectedStatus: string = "";
  DefaultDate: any = null;
  endDate: any = null;
  startDate: any = null;
  oneMonth:any;
  oneTime:any;
  monthly:any;
  annual:any;
  triennual:any;
  today: Date = new Date();
  todayDate: NgbDateStruct = {
    year: this.today.getFullYear(),
    month: this.today.getMonth() + 1,
    day: this.today.getDate()
  }
  download: Boolean = false;
  reqBody:any;
  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _partnerOffersListingService: PartnerOffersListingService,
    private _commonService: CommonService,
    public _router: Router,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _modalService: NgbModal,
    private _notifierService: NotifierService,
    private _unsavedChangesService: UnsavedChangesService,
    public pageInfo: PageInfoService,
    private _appService: AppSettingsService,
    private _fileService: FileService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
  }
  ngOnInit(): void {
    this.oneMonth = this.cloudHubConstants.PARTNER_OFFER_BULK_UPLOAD_ONEMONTH;
    this.oneTime = this.cloudHubConstants.PARTNER_OFFER_BULK_UPLOAD_ONETIME;
    this.monthly = this.cloudHubConstants.PARTNER_OFFER_BULK_UPLOAD_MONTHLY;
    this.annual = this.cloudHubConstants.PARTNER_OFFER_BULK_UPLOAD_ANNUAL;
    this.triennual = this.cloudHubConstants.PARTNER_OFFER_BULK_UPLOAD_TRIENNIAL;
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.BULK_UPLOAD_OF_PARTNER_OFFER_VIEW_HISTORY_BREADCUM_TEXT"), true);
    this.pageInfo.updateBreadcrumbs(['BULK_UPLOAD_OF_PARTNER_OFFER_BREADCUM_TEXT', 'BULK_UPLOAD_OF_PARTNER_OFFER_VIEW_HISTORY_BREADCUM_TEXT']);
    this.handleTableConfig();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ordering: false,
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          let defaultDate = new Date();
          defaultDate.setMonth(defaultDate.getMonth() - 1);
          if (this.startDate === undefined || this.startDate === null) {
            this.DefaultDate = moment(defaultDate)
          }

          const searchParams = {
            Name: Name || null,
            Status: this.selectedStatus || null,
            StartDate: this.startDate ? this.formatDateObject(this.startDate) : this.DefaultDate.format('YYYY-MM-DD'),
            EndDate: this.endDate === undefined || this.endDate === null ? moment(new Date()).format('YYYY-MM-DD') : this.formatDateObject(this.endDate),
            StartInd,
            EndInd: 5000,
            SortColumn: 'CreateDate',
            SortOrder: 'DESC',
            PageSize,
            EntityName : this._commonService.entityName,
            RecordId : this._commonService.recordId
          }
          this.reqBody = searchParams;


          // if (this.download) {
          //   this._fileService.getFile(`partnerproducts/bulkupload/downloadHistory?v=${(new Date()).getTime()}`, true, searchParams);
          //   this.download = false;
          // }
          
          this._subscription && this._subscription?.unsubscribe();
          this._subscription = this._partnerOffersListingService.getHistoryRecordsForBulkUploadOfPartnerOffers(searchParams).subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            if (Data.length > 0) {
              [{ TotalRows: recordsTotal }] = Data;
            }
            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
          });
        },

        columns: [
          {
            sortable: false,
            className: 'col-md-1 text-start',
            orderable: false,
            title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_OF_PARTNER_OFFER_VIEW_UPLOAD_HISTORY_BATCH_ID'),
            data: 'JobLogId',
          },
          {
            searchable: true,
            className: 'col-md-2 text-start',
            title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_OF_PARTNER_OFFER_VIEW_UPLOAD_HISTORY_PRODUCT_NAME'),
            data: 'Name',
            orderable: true,
            ngTemplateRef: {
              ref: this.productName,
            },
          },
          {
            className: 'col-md-2 text-start',
            title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_OF_PARTNER_OFFER_VIEW_UPLOAD_HISTORY_DESCRIPTION'),
            data: 'Description',
            orderable: false,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.descriptiontext,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: this.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1 text-end',
            title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_TABLE_HEADER_COST_PRICE'),
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.CostPrice
            },
          },
          {
            className: 'col-md-1 text-end',
            title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_PARTNER_OFFER_TABLE_HEADER_SALE_PRICE'),
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.SalePrice
            },
          },
          {
            className: 'col-md-1 text-start',
            title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_OF_PARTNER_OFFER_VIEW_UPLOAD_HISTORY_DATE'),
            data: 'CreateDate',
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.createDate
            },
          },
          {
            className: 'col-md-1 text-start',
            orderable: false,
            title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_OF_PARTNER_OFFER_CREATED_BY'),
            data: 'CreateBy',
          },
          {
            type: 'string',
            className: 'col-md-1 text-start',
            title: this._translateService.instant('TRANSLATE.BULK_UPLOAD_OF_PARTNER_OFFER_VIEW_UPLOAD_HISTORY_STATUS_ERROR_DETAILS'),
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.status
            },
          },
        ],
      };
      this._cdref.detectChanges();
    });
  }

  displayFilter() {
    this.shouldShowFilter = !this.shouldShowFilter;
  }

  searchProduct() {
    this._cdref.detectChanges();
    this.reloadEvent.emit(true);
  }

  formatDateObject(dateObj: any): string {
    const year = dateObj.year;
    const month = String(dateObj.month).padStart(2, '0');
    const day = String(dateObj.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  resetSearchCriteria() {
    this.startDate = null;
    this.endDate = null;
    this.selectedStatus = "";
    this._cdref.detectChanges();
    this.reloadEvent.emit(true);
  }

  backToPartnerOfferBulkUpload() {
    this._router.navigate([`partner/bulkuploadpartneroffer`])
  }

  formattedPills(value: any) {
    let formatted = value.replace(/([a-z])([A-Z])/g, '$1 $2');
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
    return formatted;
  }

  viewProperties(data: any) {
    this.propertyData = data;
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top modal-xl'
    };
    const modalRef = this._modalService.open(this.property, config);
    modalRef.result.then(
      (r) => { },
      (error) => { }
    );
  }

  closeModal() {
    //this.activeModal.close();
    this._modalService.dismissAll();
  }

  onCaptureEvent(event: Event) {
    // Handle captured events if necessary
  }

  getPlainTextTruncatedDescription(data: any, limit: number): string {
    return data.Description.length > limit && !this.isShowMoreMap[data.JobLogId]
      ? data.Description.substring(0, limit) + '...'
      : data.Description;
  }

  showMore(RowNum: any) {
    this.isShowMoreMap[RowNum] = !this.isShowMoreMap[RowNum];
  }

  downloadBulkHistory(){
    this._fileService.getFile(`partnerproducts/bulkupload/downloadHistory?v=${(new Date()).getTime()}`, true, this.reqBody);
    this.download = false;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
