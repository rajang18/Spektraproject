import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { PlansListingService } from '../../../services/plans-listing.service';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription,takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import _ from 'lodash';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/report-popup.model';

@Component({
  selector: 'app-currency-conversion-list',
  templateUrl: './currency-conversion-list.component.html',
  styleUrl: './currency-conversion-list.component.scss'
})
export class CurrencyConversionListComponent implements OnInit,OnDestroy {

  @Input() planId: string;
  @Input() targetCurrencyCode: any;
  @Input() planTargetCurrency?: any;
  @Input() currencyConvertRate?: any = 0;
  datatableConfig: ADTSettings;
  planProductsDataSource: any[] = [];
  touched: boolean = false;
  _subscription: Subscription;
  @Input() planInfo: any;
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };

  @ViewChild('planName') planName: TemplateRef<any>;
  @ViewChild('salePrize') salePrize: TemplateRef<any>;
  @ViewChild('salePrice') salePrice: TemplateRef<any>;
  @ViewChild('customHeader') customHeader: TemplateRef<any>;
  @ViewChild('multipleSearch') multipleSearch: TemplateRef<any>;


  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isLoading: boolean = true;

  constructor(
    private _cdref: ChangeDetectorRef,
    private _translateService: TranslateService,
    private _planService: PlansListingService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _appSettingsService: AppSettingsService,
    private modalService: NgbModal,
    public permissionService: PermissionService,
  ) {
    
  }

  ngOnInit(): void {
    this.handleTableConfig();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: false,
        pagingType: 'full_numbers',
        pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          self.isLoading = true;
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._planService.getTargetCurrency(this.planId, this.planTargetCurrency || this.targetCurrencyCode[0].TargetCurrency).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              self.isLoading = false;
              let recordsTotal = 0;
              this.planProductsDataSource = _.map(Data, each => {
                each.OriginalTargetSalePrice = each.TargetSalePrice;
                return each;
              });
              this.planProductsDataSource = this.planProductsDataSource.filter(item => item.CompositeProductId == null);
              if (this.planProductsDataSource.length > 0) {
                recordsTotal = this.planProductsDataSource.length
              }
              callback({
                data: this.planProductsDataSource,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },

        columns: [
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_TABLE_HEADER_TEXT_NAME'),
            className: "col-4 col-sm-4 col-md-4",
            searchable: true,
            orderable: false,
            data: 'PlanOfferQualifiedOfferName',
            defaultContent: '',
            type: 'string',
            ngTemplateRef: {
              ref: this.planName,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            render: function (data: any) {
              return `<span class='col-text-color'>${data}</span>`
            }
          },

          {
            title: this._translateService.instant('TRANSLATE.LABLE_TEXT_COST_TO_PARTNER'),
            className: "col-1 col-sm-1 col-md-1 col-md-1",
            data: 'CostToPartner',
            orderable: false,
          },

          {
            title: this._translateService.instant('TRANSLATE.LABLE_TEXT_PROVIDER_SELLING_PRICE'),
            className: "col-1 col-sm-1 col-md-1 col-md-1",
            data: 'ProviderSellingPrice',
            orderable: false,
          },
          {

            title: this._translateService.instant('TRANSLATE.LABLE_TEXT_SALE_PRICE'),
            className: "col-1 col-sm-1 col-md-1 col-md-1",
            data: 'SalePrice',
            orderable: false,
            ngTemplateRef: {
              ref: this.salePrice,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.LABLE_TEXT_COST_TO_PARTNER'),
            className: "col-1 col-sm-1 col-md-1 col-md-1",
            data: 'TargetCostToPartner',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.LABLE_TEXT_PROVIDER_SELLING_PRICE'),
            className: "col-1 col-sm-1 col-md-1 col-md-1",
            data: 'TargetProviderSellingPrice',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.LABLE_TEXT_SALE_PRICE'),
            data: 'TargetSalePrice',
            className: "col-md-3 col-3 col-sm-3 col-lg-3",
            defaultContent: '',
            ngTemplateRef: {
              ref: this.salePrize,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
          }

        ],
      };
      this._cdref.detectChanges();
    });
  }

  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }


  submitProducts() {
    let planProductIdOfBundles: any[] = [];
    let planProductsDataWithApplyMacroCheck = this.planProductsDataSource.map((each: any) => {
      if (each.OriginalTargetSalePrice != each.TargetSalePrice) {
        each.ShouldApplyMacro = false;
        if (each.CompositeProductId === null) {
          planProductIdOfBundles.push(each.PlanProductId);
        }
      }
      return each;
    });
    planProductsDataWithApplyMacroCheck = planProductsDataWithApplyMacroCheck.map((each: any) => {
      if (planProductIdOfBundles.indexOf(each.CompositeProductId) > -1) {
        each.ShouldApplyMacro = false;
      }
      return each;
    });
    let reqBody = {
      PlanId: this.planId,
      TargetCurrencyCode: this.targetCurrencyCode[0].TargetCurrency,
      PlanProductsData: JSON.stringify(planProductsDataWithApplyMacroCheck)
    };
    const subscription = this._planService.productsWithTargetCurrency(reqBody).pipe(takeUntil(this.destroy$))
      .subscribe((_) => {
        // let successMsg = this._translateService.instant('TRANSLATE.CURRENCY_CONVERSION_CAPTION_TEXT_CURRENCY_CONVERSION_SUCCESS_MSG');
        // this._toastService.success(successMsg);
        this._router.navigate([`partner/plans`]);
      })
      this._subscriptionArray.push(subscription);
  }

  Permissions = {
    AreNcePromotionsEnabled: "Denied"
  };

  hasPermission() {
     this.Permissions.AreNcePromotionsEnabled = this.permissionService.hasPermission('ARE_NCE_PROMOTIONS_ENABLED');
  }

  CheckNcePromotionDetails(product) {
            
    var promotionDetail = {
        Name: product.PromotionName,
        PromotionalId: product.NCEPromotionID,
        Description: product.PromotionDescription,
        Validity: product.Validity,
        ValidityType: product.ValidityType,
        BillingCycleName: product.BillingCycleName,
        BillingCycleDescriptionKey: product.BillingCycleDescription,
        Discount: product.PromotionDiscount,
        DiscountType: product.PromotionDiscountType,
        EndDate: product.PromotionEndDate
    };

    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: MODAL_DIALOG_CLASS,
    };
    const modalRef = this.modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetail;
    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());

  }
}
