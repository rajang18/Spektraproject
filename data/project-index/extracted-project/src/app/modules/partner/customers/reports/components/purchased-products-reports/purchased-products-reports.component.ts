import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { CustomerReportsService } from '../../../services/customer-reports.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { productSearchModel } from '../../model/customer-reports.model';
import { FileService } from 'src/app/services/file.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-purchased-products-reports',
  templateUrl: './purchased-products-reports.component.html',
  styleUrl: './purchased-products-reports.component.scss',
})
export class PurchasedProductsReportsComponent {
  datatableConfig: ADTSettings;
  customerImpersonateConfig: ADTSettings;
  isEditing: boolean[] = [];
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  SearchCriteria: productSearchModel = new productSearchModel();
  tablePurchasedProductForReport: any;
  _subscription: Subscription;
  maxQuantity: any = null;
  minQuantity: any = null;
  expireInDays: any = null;
  OrderEndDate: any = null;
  @ViewChild('ExpiresOn') ExpiresOn: TemplateRef<any>;
  @ViewChild('OrderedOn') OrderedOn: TemplateRef<any>;
  destroy$ = new Subject<void>();

  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    private CustomerReportsService: CustomerReportsService,
    private _fileService: FileService,
    private _commonService: CommonService,
    private _appSettingsService:AppSettingsService
  ) {}

  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.handleTableConfig();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);
          this._subscription = this.CustomerReportsService.getList({
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            PageSize: PageSize,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            StartInd: StartInd,
            OrderEndDate: new Date(
              `${this.OrderEndDate?.day}-${this.OrderEndDate?.month}-${this.OrderEndDate?.year}`
            ),
            MinQuantity: this.minQuantity,
            MaxQuantity: this.maxQuantity,
            ExpireInDays: this.expireInDays,
          }).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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
            title: 'Product name',
            data: 'ProductName',
          },
          {
            title: 'Ordered on',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.OrderedOn,
            },
          },

          {
            title: 'Renews on',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.ExpiresOn,
            },
          },
          {
            title: 'Quantity',
            data: 'Quantity',
          },
          {
            title: 'Status',
            data: 'Status',
          },
        ],
      };
      this.cdRef.detectChanges();
    });
  }
  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}

  exportToExcel() {
    this._fileService.getFile(
      'analytics/DownloadPurchasedProductsReport',
      true
    );
  }

  resetSearchCriteria() {
    this.minQuantity = null;
    this.maxQuantity = null;
    this.OrderEndDate = null;
    this.reloadEvent.emit(true);
  }

  searchProducts() {
    this.reloadEvent.emit(true);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe();
  }

}
