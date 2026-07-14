import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { PlansListingService } from '../../partner/plans/services/plans-listing.service';
import { mapParamsWithApi } from '../c3-table/c3-table-utils';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';

@Component({
  selector: 'app-contract-details',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    C3TableComponent,
    CurrencyPipe
  ],
  templateUrl: './contract-details.component.html',
  styleUrl: './contract-details.component.scss'
})
export class ContractDetailsComponent implements OnInit,OnDestroy {
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  pricingSlabsDatatableConfig: ADTSettings;
  slabProductsDatatableConfig: ADTSettings;

  @Input() public product: any;
  @Input() public currencyCode: any;

  @ViewChild('salePrice') salePrice: TemplateRef<any>;
  @ViewChild('maxValue') maxValue: TemplateRef<any>;
  subscription: Subscription;
  destroy$ = new Subject<void>();
  pricingSlab = [];
  productSlab = [];

  constructor(
    private _modalService: NgbModal,
    private _translateService: TranslateService,
    private _planService: PlansListingService,
    private _appSettingsService:AppSettingsService
  ) {

  }

  ngOnInit(): void {
        this.getPricing();
        this.getProductData();
    
  }

  getPricing(){
    this._planService.getPricingSlabs(this.product, this.currencyCode).pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => {
              this.pricingSlab = Data;
              this.pricingSlabsData();
            });
  }
  getProductData(){
    this._planService.getSlabProducts(this.product).pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => {
              this.productSlab = Data;
              this.slabProductsData();
            });
  }

  pricingSlabsData() {
    setTimeout(() => {
      const self = this;
      this.pricingSlabsDatatableConfig = {
        serverSide: false,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        info:false,
        paging:true,
        data: this.pricingSlab,
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_DETAILS_POPUP_TABLE_TITLE_MINVALE'),
            data: 'MinValue',
            className: 'text-end pe-3',
            orderable: false,
            render:(data:string)=>{
              return `<span>${data}</span>`
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_DETAILS_POPUP_TABLE_TITLE_MAXVALUE'),
            defaultContent: '',
            orderable: false,
            className: 'text-end pe-3',
            ngTemplateRef: {
              ref: this.maxValue,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_DETAILS_POPUP_TABLE_SALE_PRICE'),
            defaultContent: '',
            className: 'text-end p-3',
            ngTemplateRef: {
              ref: this.salePrice,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_DETAILS_POPUP_TABLE_BILLING_TYPE'),
            data: 'BillingTypeName',
            orderable: false,
          },
        ],
        order:[]
      };
    });
  }

  slabProductsData() {
    setTimeout(() => {
      const self = this;
      this.slabProductsDatatableConfig = {
        serverSide: false,
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        info:false,
        paging:true,
        data:this.productSlab,
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.CUSTOM_OFFERS_ADD_EDIT_FORM_LABEL_PROVIDER'),
            data: 'ProviderName',
            className: 'text-start',
            orderable: false,
            render:(data:string)=>{
              return `<span class="fw-semibold">${data}</span>`
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOM_OFFERS_ADD_EDIT_FORM_LABEL_CATAGORY'),
            data: 'CategoryName',
            className: 'text-start',
            orderable: false,
          },
        ],
        order:[]
      };
    });
  }

  closeModalPopup() {
    //this.activeModal.close();
    this._modalService.dismissAll();
  }

  onCaptureEvent(event: Event) { }

  ngOnDestroy() {
    this.subscription?.unsubscribe()
    this.destroy$.next()
    this.destroy$.complete()
  }
}
