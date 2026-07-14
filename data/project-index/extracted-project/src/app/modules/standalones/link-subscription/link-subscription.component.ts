import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PartnerModule } from '../../partner/partner.module';
import { PlansListingService } from '../../partner/plans/services/plans-listing.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { PromotionDetailComponent } from '../promotion-detail/promotion-detail.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-link-subscription',
  standalone: true,
  imports: [NgbModule, TranslateModule, CurrencyPipe,C3CommonModule,CommonModule,C3TableComponent,C3CommonModule],
  templateUrl: './link-subscription.component.html',
  styleUrl: './link-subscription.component.scss'
})
export class LinkSubscriptionComponent implements OnInit {
  
  private subscription: Subscription;
  tableOffersList:any;
  offersListData:any;
  data:any;
  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('name') nameTemplate: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('billingCycle') billingCycle: TemplateRef<any>;
  dataLength:any;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();

  constructor(
    private planService: PlansListingService,
    public activeModal: NgbActiveModal,
    private _translateService:TranslateService,
    private _modalService: NgbModal,
    private _appService: AppSettingsService,
  ){

  }

  ngOnInit(): void {
    this.handleConfig()
  }

  handleConfig() {
    let reqModel = {
      CurrencyCode: this.data.CurrencyCode,
      ProductId: this.data.ProductId,
      BillingCycleId: this.data.BillingCycleId,
      MarketCode: this.data.MarketCode
    };
    const subscription = this.planService.planProductForLink(reqModel).pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      let uniqueData: any[] = [];
      this.dataLength = data.length;
      let seenIds = new Set();
      data.forEach((record: any) => {
        if (!seenIds.has(record.ProductVariantId)) {
          seenIds.add(record.ProductVariantId);
          uniqueData.push(record);
        }
      });
      this.offersListData = uniqueData;
      this.offersListData.forEach((product: any) => {
        product.Settings = JSON.parse(product.Settings);
        product.ProviderSettings = JSON.parse(product.ProviderSettings);
      });

      this.tableOffersList = this.offersListData
      setTimeout(() => {

        const self = this;
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
          data:this.tableOffersList,
          ordering:false,
          columns: [
            {
              searchable: true,
              title: this._translateService.instant('TRANSLATE.LINKED_SUBSCRIPTION_TABLE_HEADER_TEXT_OFFER_NAME'),
              data: 'Name',
              orderable: false,
              className: 'col-md-6',
              ngTemplateRef: {
                ref: this.nameTemplate,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self)
                }
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.LINKED_SUBSCRIPTION_TABLE_HEADER_TEXT_BILLING_CYCLE'),
              data: 'BillingCycleDescriptionKey',
              className: 'col-md-4',
              orderable: false,
              ngTemplateRef: {
                ref: this.billingCycle,

                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self)
                }
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.LINKED_SUBSCRIPTION_TABLE_HEADER_TEXT_ACTION'),
              defaultContent: '',
              className: 'col-md-2',
              orderable: false,
              ngTemplateRef: {
                ref: this.actions,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self)
                }
              }
            },
          ]
        };
      })
    });
    this._subscriptionArray.push(subscription);

  }

  onLazyLoad(item: any) {
    item.loaded = true;  
}

  onCaptureEvent(event: Event) {
  }

  addOffer(data:any){
    var result = { SelectedOffer: data };
    this.activeModal.close(result)
  }
  viewPromotion(product:any){
    var promotionDetail = {
      Name: product.PromotionName,
      PromotionalId: product.NCEPromotionID,
      Description: product.PromotionDescription,
      Validity: product.Validity,
      ValidityType: product.ValidityType,
      BillingCycleName: product.BillingCycleName,
      BillingCycleDescriptionKey: product.BillingCycleDescriptionKey,
      Discount: product.PromotionDiscount,
      DiscountType: product.PromotionDiscountType,
      EndDate: product.PromotionEndDate
    };
    const modalRef = this._modalService.open(PromotionDetailComponent);
    modalRef.componentInstance.promotionDetail = promotionDetail;
    modalRef.result.then((response) => {
      
    }).catch((reason) => {
      console.log('Dismissed: ', reason);
    });

  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

  closeModalPopup(){
    this._modalService.dismissAll();
  }
}
