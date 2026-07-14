import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { BuisnessService } from 'src/app/services/buisness.service';

@Component({
  selector: 'app-business-details-listing',
  templateUrl: './business-details-listing.component.html',
  styleUrl: './business-details-listing.component.scss'
})
export class BusinessDetailsListingComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() searchParams:any;
  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  _subscription: Subscription;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('costonPartner') costonPartner: TemplateRef<any>;
  @ViewChild('billedAmount') billedAmount: TemplateRef<any>;
  @ViewChild('profit') profit: TemplateRef<any>;
  @ViewChild('profitpercentage') profitpercentage: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  destroy$ = new Subject<void>();

  constructor(
    private _buisnessService : BuisnessService,
    private _cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private _appSettingsService:AppSettingsService
  ){}

  ngOnInit(): void {
    this.handleTableConfig();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          let nameFilter = Name;
          if (
            nameFilter === null ||
            nameFilter === undefined ||
            nameFilter === ''
          ) {
            nameFilter = '';
          }
          this._subscription && this._subscription?.unsubscribe();
          this._subscription = this._buisnessService
            .getBuisnessListlineItemsForSummaryView(this.searchParams)
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
        },

        columns: [
          // {
          //   className: 'dt-control',
          //   orderable: false,
          //   data: null,
          //   defaultContent: '',
          // },
          {
            title: 'Name',
            defaultContent: '',
            className:'pe-2 w-25-per',
            width: '25%',  // Set the width of the first column
            ngTemplateRef: {
              ref: this.nameTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.REVENUE_BY_CUSTOMER_GRAPH_LABEL_COST_ON_PARTNER'),
            defaultContent: '',
            className:'text-end pe-2 w-17-per',
            width: '17%',
            ngTemplateRef: {
              ref: this.costonPartner,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.REVENUE_AND_COST_SUMMARY_BILLED_AMOUNT'),
            defaultContent: '',
            className:'text-end pe-2 w-17-3-per',
            width: '17.3%',
            ngTemplateRef: {
              ref: this.billedAmount,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_PROFIT'),
            defaultContent: '',
            className:'text-end pe-2 w-12-5-per',
            width: '12.5%',
            ngTemplateRef: {
              ref: this.profit,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            // className: 'pe-9',
            title: this.translateService.instant('TRANSLATE.CUSTOMERS_TABLE_HEADER_TEXT_PROFIT_PERCENTAGE'),
            defaultContent: '',
            className:'text-end pe-2 w-18-per',
            width: '18%',
            ngTemplateRef: {
              ref: this.profitpercentage,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className:'text-start pe-2',
            width: '35%',
            title: this.translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_ACTIONS'),
            defaultContent: '',
            orderable: false,
            type: 'string',
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

  onCaptureEvent(event: Event) {}

  ngOnChanges(changes: SimpleChanges): void {
    this._cdRef.detectChanges();
  }

  ngAfterViewInit(): void { }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe();
  }

}
