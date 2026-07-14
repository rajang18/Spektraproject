import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { LicenseConsumptionSummaryReportService } from 'src/app/modules/analyze/services/license-consumption-summary-report.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-child-table-consumption-summary-report',
  templateUrl: './child-table-consumption-summary-report.component.html',
  styleUrls: ['./child-table-consumption-summary-report.component.scss']
})
export class ChildTableConsumptionSummaryReportComponent implements OnInit {
  @Input() data: any; // Data passed to the child table

  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  
  private _subscription: Subscription;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(
    private _cdRef: ChangeDetectorRef,
    private licenseConsumptionSummaryReportService: LicenseConsumptionSummaryReportService,
    private appSettingService:AppSettingsService,
    private _translateService : TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeTable();
  }

  initializeTable() {
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this.appSettingService.$rootScope.DefaultPageCount ||  10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, EmailAddress, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          this.data.WhereClauseXML = EmailAddress;
          this.data.StartInd = StartInd;
          this.data.PageSize = PageSize;
          this.data.SortColumn = SortColumn;
          this.data.SortOrder = SortOrder;
          if (
            this.data.WhereClauseXML === null ||
            this.data.WhereClauseXML === undefined ||
            this.data.WhereClauseXML === ''
          ) {
            this.data.WhereClauseXML = '';
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.licenseConsumptionSummaryReportService
            .getAssignedUsers(this.data).pipe(takeUntil(this.destroy$))
            .subscribe(( Data : any) => {
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
            title: this._translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_EMAIL_ADDRESS'),
            searchable: true,
            data: 'EmailAddress',
            className: ' col-md-3 text-start ',
            render: (data: string) => {
              return '<span class="fw-semibold">' + data + '</span>';
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_AVAILABLE_IN_PROVIDER'),
            data: 'AvailableInPC',
            className: 'col-md-3 text-center',
            render: (data: boolean) => {
              if (data) {
                return '<i class="fas fa-check text-success"></i>';
              } else {
                return '<i class="fas fa-times text-danger"></i>';
              }
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_AVAILABLE_IN_C3'),
            data: 'AvailableInC3',
            className: 'col-md-3 text-center',
            render: (data: boolean) => {
              if (data) {
                return '<i class="fas fa-check font-green-jungle"></i>';
              } else {
                return '<i class="fas fa-times text-danger"></i>';
              }
            }
          }
        ]
      };

      // Trigger change detection to render the table
      this._cdRef.detectChanges();
    });
  }
  ngOnDestroy(): void {
    if (this._subscription) {
      this._subscription?.unsubscribe();
      this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    }}
}
