import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { mapParamsWithApi } from '../../c3-table/c3-table-utils';
import { CommonModule, DatePipe } from '@angular/common';
import { C3TableComponent } from '../../c3-table/c3-table.component';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription, switchMap, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeFilterPipe } from "../../../../shared/pipes/dateTimeFilter.pipe";
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';

@Component({
  selector: 'app-invoice-comments',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    C3TableComponent,
    FormatforInitialsPipe,
    FormsModule,
    DateTimeFilterPipe
],
providers: [DatePipe],
  templateUrl: './invoice-comments.component.html',
  styleUrl: './invoice-comments.component.scss'
})
export class InvoiceCommentsComponent extends C3BaseComponent implements OnInit, OnDestroy,AfterViewInit {
  newComment: any;
  invoiceId: any;
  dataTableConfig: ADTSettings;
  globalDateFormat: any ='';

  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('comments') comments: TemplateRef<any>;
  timerHandle: Subscription;
  invoiceNumber: string;


  constructor(
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    private _cdRef: ChangeDetectorRef,
    public _router: Router,
    public _appSettingsService:AppSettingsService,
    public pageInfo: PageInfoService,
    public _permissionService: PermissionService,
    public _dynamicTemplate: DynamicTemplateService,
  ) {
    
    super(_permissionService,_dynamicTemplate,_router, _appSettingsService);
    let data = _router.getCurrentNavigation()?.extras?.state?.data;
    if (data?.recordId) {
      this.invoiceId = data.recordId;
    }

    let invoiceNumber = localStorage.getItem("invoiceNumber");
    if (invoiceNumber !== undefined && invoiceNumber !== null && invoiceNumber !== '') {
      this.invoiceNumber = invoiceNumber;
    }
  }

  ngOnInit(): void {
    this.globalDateFormat = this._appSettingsService.$rootScope.oldDateTimeFormat;
    this.handleTableConfig();
    this.pollComments();
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let title= `<span class="text-primary ps-2">${this.invoiceNumber}</span>`;
    this.pageInfo.updateTitle(title, true);
    this.pageInfo.updateBreadcrumbs('');
  }

  saveInvoiceComments() {
    let savePayload: any = {
      EntityName: "Invoice",
      RecordId: this.invoiceId,
      Content: this.newComment
    }
    if (savePayload.Content == null || savePayload.Content == '') {
      this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_EMPTY_COMMENTS_SUBMITTED'));
    }
    else {
      const subscription = this._commonService.saveComments(savePayload).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.reloadEvent.emit(true);
      });
      this.newComment = null;
      this._subscriptionArray.push(subscription);
    }
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.dataTableConfig = {
        serverSide: true,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10000),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize } = mapParamsWithApi(dataTablesParameters);
          const searchParams = {
            EntityName: "Invoice",
            RecordId: this.invoiceId,
            StartInd: StartInd,
            PageSize: 10000,
          }
          const subscription = this._commonService.getComments(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            Data.map((e: any) => {
              e.toggleDetails = false;
              e.Replies = JSON.parse(e.Replies)
            });
            if (Data.length > 0) {
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
        ordering:false,
        paging: false,
        language: {
          info: "", // Hide the information text
          infoEmpty: "", // Hide information when no records are present
          infoFiltered: "" // Hide information about filtering
      },
        columns: [
          {
            type: 'string',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.comments
            }
          },

        ],

      };
      this._cdRef.detectChanges();

    });
  }

  pollComments(){
    const subscription = this.timerHandle = interval(15000).pipe(
      switchMap(() => {
        this.reloadEvent.emit(true);
        return [];
      })
    ).pipe(takeUntil(this.destroy$)).subscribe();
    this._subscriptionArray.push(subscription);
  }
   
  ngOnDestroy(): void {
    if(this.timerHandle){
      this.timerHandle.unsubscribe();
    }
    super.ngOnDestroy();
  }
}
