import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { EngageService } from '../../service/engage.service';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-engage-list',
  templateUrl: './engage-list.component.html',
  styleUrl: './engage-list.component.scss'
})
export class EngageListComponent extends C3BaseComponent implements OnInit {
  datatableConfig: ADTSettings;
  isEditing: boolean[] = [];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('name') name: TemplateRef<any>;
  @ViewChild('body') body: TemplateRef<any>;
  @ViewChild('effectiveFrom') effectiveFrom: TemplateRef<any>;
  @ViewChild('expiresOn') expiresOn: TemplateRef<any>;



  entityName: string;
  recordId: string;
  globalDateFormat: any;
  isShowMore: { [key: string]: boolean } = {};
  isShowMoreEntities: { [key: string]: boolean } = {};

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _engageService: EngageService,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private pageInfo: PageInfoService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
  }
  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_ADMINISTRATION_ENGAGE"), true);
    this.pageInfo.updateBreadcrumbs(['MENU_ADMINISTRATION', { value: 'MENU_ADMINISTRATION_ENGAGE', useInnerHTML: true }, 'ENGAGE_BREADCRUMB_LIST']);
    this.handleTableConfig();
    this.globalDateFormat = this._appService.$rootScope.oldDateTimeFormat;
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ordering: false,
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, length } =
            mapParamsWithApi(dataTablesParameters);
          const searchParams = {
            StartInd,
            PageSize: length
          }
          const subscription = this._engageService
            .getList(searchParams)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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
          this._subscriptionArray.push(subscription);
        },

        columns: [
          {
            className: 'col-md-2',
            type: 'string',
            title: this._translateService.instant('TRANSLATE.ENGAGE_HEADER_PAGE'),
            orderable: false,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.name,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-2',
            title: this._translateService.instant('TRANSLATE.ENGAGE_HEADER_ENTITES'),
            orderable: false,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.nameTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            render: function (data, type, row, meta) {
              return `<span class="fw-semibold">${data}</span>`
            },
          },
          {
            className: 'col-md-2',
            orderable: false,
            title: this._translateService.instant('TRANSLATE.ENGAGE_HEADER_TITLE'),
            data: 'Title',
          },
          {
            className: 'col-md-3',
            orderable: false,
            title: this._translateService.instant('TRANSLATE.ENGAGE_HEADER_MESSAGE'),
            data: 'Body',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.body,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1',
            title: this._translateService.instant('TRANSLATE.ENGAGE_HEADER_EFFECTIVE_FROM'),
            data: 'EndDate',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.effectiveFrom,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1',
            title: this._translateService.instant('TRANSLATE.ENGAGE_HEADER_EXPIRES_ON'),
            data: 'StartDate',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.expiresOn,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-1 text-center',
            type: 'string',
            orderable: false,
            title: this._translateService.instant('TRANSLATE.ENGAGE_HEADER_ACTIONS'),
            defaultContent: '',
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
      this._cdref.detectChanges();
    });
  }

  showMore(Id: any) {
    this.isShowMore[Id] = !this.isShowMore[Id];
  }

  showMoreEntities(Id: any){
    this.isShowMoreEntities[Id] = !this.isShowMoreEntities[Id];
  }

  getPlainTextTruncatedDescription(data: any, limit: number): string {
    const plainText = data.Body.replace(/<[^>]+>/g, '');
    return plainText.length > limit && !this.isShowMore[data.Id]
      ? plainText.substring(0, limit) + '...'
      : plainText;
  }

  getEntities(data: any, limit: number): string {
    const plainText = data.Entities;
    return plainText.length > limit && !this.isShowMoreEntities[data.Id]
      ? plainText.substring(0, limit) + '...'
      : plainText;
  }

  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }

  deleteEngageNotification(data: any) {
    const confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_WEB_NOTIFICATION_CONFIRMATION_TEXT2');
    this._notifierService.confirm({ title: confirmationText, confirmButtonColor: 'green' }).then((result: { isConfirmed: any; }) => {
      /* Read more about isConfirmed */
      if (result.isConfirmed) {
        const subscription = this._engageService.delete(data.ID).pipe(takeUntil(this.destroy$)).subscribe(
          (response: any) => {
            if (response.Status == 'Success') {
              this._cdref.detectChanges();
              this.reloadEvent.emit(true);
              this._toastService.success(this._translateService.instant('TRANSLATE.POPUP_WEB_NOTIFICATION_DELETED2'));
            }
          }
        )
        this._subscriptionArray.push(subscription);
      }
    })

  }

  editEngageDetails(data: any) {
    this._router.navigate([`partner/engage/add`]
      , { state: { engegeDetails: data } });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
