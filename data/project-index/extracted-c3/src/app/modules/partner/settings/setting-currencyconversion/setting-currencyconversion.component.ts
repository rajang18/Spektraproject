import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { forkJoin, takeUntil } from 'rxjs';
import { CurrencyconversionsettingService } from '../services/currencyconversionsetting.service';
import { CurrencyCodeData } from '../models/currencyconversion.model';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-setting-currencyconversion',
  templateUrl: './setting-currencyconversion.component.html',
  styleUrl: './setting-currencyconversion.component.scss'
})
export class SettingCurrencyconversionComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  // _subscription: Subscription;
  sourceCurrency: string | null = null
  targetCurrency: string | null = null
  timePeriod: string | null = null;
  effectiveFromWithOffset: Date | string = null;

  currentDate: any = new Date().toJSON("yyyy/MM/dd HH:mm");
  filtersExpanded = false;

  currencyData: CurrencyCodeData[] = [];
  filteredCurrencyList: CurrencyCodeData[] = [];

  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';

  @ViewChild('effectiveFrom') effectiveFrom: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  globalDateFormat: any;
  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _appService: AppSettingsService,
    private _currencyConvSettingService: CurrencyconversionsettingService,
    private pageInfo: PageInfoService
  ) {
    super(_permissionService, _dynamicTemplateService, _router,_appService)
    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    this.pageInfo.updateTitle(`${message}`, true);
    this.pageInfo.updateBreadcrumbs([''])
  }

  ngOnInit(): void {

    let message = this._translateService.instant('TRANSLATE.MENUS_PARTNER_SETTINGS')
    let title = `<span class='text-primary'>${message}</span>`
    this.pageInfo.updateTitle(title, true);
    this.pageInfo.updateBreadcrumbs([''])

    this.getApplicationData();
    this.handleTableConfig();
    // Making API calls concurrently using forkJoin
    const subscription = forkJoin({
      currecnyList: this._currencyConvSettingService.getCurrencyList(),
    }).pipe(takeUntil(this.destroy$)).subscribe(
      (responses: any) => {
        this.currencyData = responses.currecnyList;
        this.cdRef.detectChanges();
      }
    )
    this._subscriptionArray.push(subscription);
  }

  getApplicationData() {
   const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.globalDateFormat = response.Data.DateFormat;
    });
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;

      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, length } =
            mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._currencyConvSettingService
            .getCurrencyDetailsList({
              SourceCurrency: this.sourceCurrency,
              TargetCurrency: this.targetCurrency,
              TimePeriod: this.timePeriod,
              EffectiveFrom: this.effectiveFromWithOffset != null && this.effectiveFromWithOffset != undefined ? this.convertNgbDateTOJsDate(this.effectiveFromWithOffset) : null,
              StartInd,
              SortColumn: SortColumn,
              SortOrder: SortOrder,
              PageSize: length
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
            title: this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_LIST_TABLE_HEADER_SOURCE_CURRENCY'),
            className: 'col-md-2',
            data: 'SourceCurrency',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_LIST_TABLE_HEADER_TARGET_CURRENCY'),
            className: 'body-alignment-normal col-md-2',
            data: 'TargetCurrency'
          },
          {
            title: this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_LIST_TABLE_HEADER_CONVERSION_RATE'),
            data: 'ConversionRate',
            className: 'text-end col-md-2 pe-4',
            type: "string",
          },
          {
            title: this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_LIST_TABLE_HEADER_CUSTOMER'),
            className: 'body-alignment-normal col-md-2',
            data: 'CustomerName',

          },
          {
            title: this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_LIST_TABLE_HEADER_EFFECTIVE_FROM'),
            className: 'body-alignment-normal col-md-2',
            data: 'EffectiveFrom',
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
            title: this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_LIST_TABLE_HEADER_STATUS'),
            className: 'body-icon-alignment col-md-1',
            data: 'IsActive',
            render: (data: boolean) => {
              // Check the value of PaymentMethod and return the formatted HTML
              if (data === true) {
                return '<span class="fw-bold"><i class=" fs-2 ki-duotone ki-check text-success"></i></span>';
              } else {
                return '<span class="fw-bold"><i class="fs-2 ki-outline ki-cross text-danger"></i></span>';
              }
            },
            orderable: false
          },
          {
            title: this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_LIST_TABLE_HEADER_ACTIONS'),
            className: 'col-md-1 text-end',
            defaultContent: '',
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
        order: [4, 'desc']
      };
      this.cdRef.detectChanges();
    });
  }

  toggleFilters() {
    this.filtersExpanded = !this.filtersExpanded;
  }

  getTargetCurrencyList() {
    this.targetCurrency = null;
    if (this.sourceCurrency != null && this.sourceCurrency != "") {
      this.filteredCurrencyList = this.currencyData.filter(s => s.CurrencyCode !== this.sourceCurrency);
    }
    else {
      this.filteredCurrencyList = [];
    }

  }

  updateDate(event: any) {
    this.effectiveFromWithOffset = this.formatDateObject(event);
  }

  convertNgbDateTOJsDate(date: any) {

    const isoDateString = `${date}T00:00:00.000Z`;

    return isoDateString;
  }

  formatDateObject(dateObj: any): string {
    const year = dateObj.year;
    const month = String(dateObj.month).padStart(2, '0');
    const day = String(dateObj.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  deteteCurrencyConversion(row: any) {
    const confirmationText = this._translateService.instant(
      'TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT');
    this._notifierService
      .confirm({ title: confirmationText, confirmButtonColor: 'green'})
      .then((result: { isConfirmed: any; isDenied: any }) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          const subscription = this._currencyConvSettingService.deteteCurrencyConversion(row).pipe(takeUntil(this.destroy$)).subscribe(res => {
            let successMsg = this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_DELETE_SUCCESS');
            this._toastService.success(successMsg);
            this.reloadEvent.emit(true);
          })
          this._subscriptionArray.push(subscription);
        }
      });
  }

  resetSearchCriteria() {
    this.filteredCurrencyList = [];
    this.sourceCurrency = null;
    this.targetCurrency = null
    this.timePeriod = null;
    this.effectiveFromWithOffset = null;
    this.reloadEvent.emit(true);
  }

  searchCurrencyConversionList() {
    this.reloadEvent.emit(true);
  }

  onCaptureEvent(event: Event) { }

  cloneCurrencyConversion(data: any) {
    this._currencyConvSettingService.setData(data);
    this._router.navigate([`/partner/settings/currencyconversion/addoreditcurrencyconversion`], {
      state: { dataId: data.Id },
    });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
