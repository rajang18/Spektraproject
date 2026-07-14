import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { SubscriptionExpiryCheckService } from '../services/subscription-expiry-check.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-subscription-expiry-check-setting',
  templateUrl: './subscription-expiry-check-setting.component.html',
  styleUrl: './subscription-expiry-check-setting.component.scss'
})
export class SubscriptionExpiryCheckSettingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  // _subscription: Subscription;

  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';

  @ViewChild('actions') actions: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _subscriptionExpityCheckService: SubscriptionExpiryCheckService,
    public permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,

  ) {
    super(permissionService, _dynamicTemplateService, _router, _appService);
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title, true);
    this.pageInfo.updateBreadcrumbs([''])
  }
  ngOnInit(): void {
    this.handleTableConfig();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;

      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, length, Name } =
            mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
         const subscription = this._subscriptionExpityCheckService
            .getSubscriptionExpiryCheckList({
              StartInd,
              SortColumn,
              PageSize: length,
              SortOrder,
              Name
            })
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
            title: this._translateService.instant('TRANSLATE.SUBSCRIPTION_RENEWAL_EXPIRATION_TABLE_NAME'),
            data: 'Name',
            render: function (data: any) {
              return `<span class="fw-semibold">${data}</span>`
            },
            searchable: true
          },
          {
            title: this._translateService.instant('TRANSLATE.SUBSCRIPTION_RENEWAL_EXPIRATION_TABLE_DAYS'),
            data: 'Days',
            className: 'text-center'
          },
          {
            title: this._translateService.instant('TRANSLATE.SUBSCRIPTION_RENEWAL_EXPIRATION_TABLE_TERM'),
            data: 'Term',
          },
          {
            title: this._translateService.instant('TRANSLATE.SUBSCRIPTION_RENEWAL_EXPIRATION_TABLE_ACTION'),
            defaultContent: '',
            className: 'text-end column-title-pe-5',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }

  deleteExpiryCheck(id: number) {
    const confirmationText = this._translateService.instant(
      'TRANSLATE.EXPIRATION_NOTIFICATION_DELETE_RECORD_CONFIRMATION_PROMPT');
    this._notifierService
      .confirm({ title: confirmationText, confirmButtonColor: 'red' })
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          const subscription = this._subscriptionExpityCheckService.deleteExpiryCheck(id).pipe(takeUntil(this.destroy$)).subscribe(res => {
            let successMsg = this._translateService.instant('TRANSLATE.EXPIRATION_NOTIFICATION_DELETE_SUCCESS_MSG');
            this._toastService.success(successMsg);
            this.reloadEvent.emit(true);
          })
          this._subscriptionArray.push(subscription);
        }
      });
  }

  editSubscriptionExpiry(data: any) {
    this._subscriptionExpityCheckService.setData(data);
    this._router.navigate([`/partner/settings//renewalnotification/addoreditsubscriptionexpirycheck`], {
      state: { dataId: data.Id },
    });
  }

  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
