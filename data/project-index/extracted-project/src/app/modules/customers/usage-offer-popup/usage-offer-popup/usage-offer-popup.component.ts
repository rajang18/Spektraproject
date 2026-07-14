import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { ShopService } from '../../services/shop.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-usage-offer-popup',
  standalone: true,
  imports: [CommonModule, TranslateModule, C3TableComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './usage-offer-popup.component.html',
  styleUrl: './usage-offer-popup.component.scss'
})
export class UsageOfferPopupComponent implements OnInit {

  datatableConfig: ADTSettings;
  @Input() public product: any;
  _subscription: Subscription;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(
    private _shopService: ShopService,
    private _modalService: NgbModal,
    private _translateService: TranslateService,
    private _cdref: ChangeDetectorRef,
    public activeModal: NgbActiveModal,
    private _appSettingsService:AppSettingsService
  ) {

  }

  ngOnInit() {
    this.handleTableConfig();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        paging: false,
        info: false,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, } =
            mapParamsWithApi(dataTablesParameters);
          const reqBody = {
            CurrencyCode: null,
            Screenname: 'Shop',
            Id: this.product.PlanProductId,
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._shopService.getMeteredBillingSlabs(this.product.PlanProductId, 'Shop', reqBody).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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
            title: this._translateService.instant('TRANSLATE.PRICING_SLABS_TABLE_HEADER_DISPLAY_NAME'),
            data: 'DisplayName',
            render: (data: string) => {
              if (data != null) {
                return `<span class="fw-semibold">${data}</span>`
              } else {
                return `<span></span>`
              }
            },
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRICING_SLABS_TABLE_HEADER_MINVALUE'),
            className: 'text-end pe-3',
            data: 'MinValue',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRICING_SLABS_TABLE_HEADER_MAXVALUE'),
            className: 'text-end pe-3',
            data: 'MaxValue',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRICING_SLABS_TABLE_HEADER_SELLING_PRICE_MODAL'),
            className: 'text-end pe-3',
            data: 'SalePrice',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PRICING_SLABS_TABLE_HEADER_TYPE'),
            data: 'BillingTypeName',
            orderable: false,
          },
        ],
        order: []
      };

      this._cdref.detectChanges();
    });
  }

  closeModalPopup() {
    this._modalService.dismissAll();
  }

  ngOnDestroy(){
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}