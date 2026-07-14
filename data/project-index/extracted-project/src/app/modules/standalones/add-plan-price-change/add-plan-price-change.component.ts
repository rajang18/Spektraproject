import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { PlansListingService } from '../../partner/plans/services/plans-listing.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CommonModule } from '@angular/common'; 
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import _ from 'lodash';
import { Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-add-plan-price-change',
  standalone: true,
  imports: [NgbModule, TranslateModule, CurrencyPipe,C3CommonModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-plan-price-change.component.html',
  styleUrl: './add-plan-price-change.component.scss'
})
export class AddPlanPriceChangeComponent implements OnInit, OnDestroy {
  _subscription: Subscription;
  priceChangeEffectivenessType: any;
  effectivenessTypeId: number;
  data: any = {};
  planProductId = this.data.PlanProductId;
  planProductName = this.data.Name;
  billingTypeName = this.data.BillingTypeName;
  categoryName = this.data.CategoryName;
  isGridDataLoading: boolean;
  gridLoadingDataMessage: string;
  tableOfferPriceList: any[] = [];
  changeOfferPrice: any;
  offerPriceListData: any;
  dataLoaded: boolean = false;
  touched: boolean = false;
  shouldShowPriceLockWarningMessage: boolean = false;
  maxPrice: any;
  minPrice: any;
  canPriceLead: any;
  canPriceLag: any;
  simpleForm: FormGroup;
  buttonClicked = false;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  get cloudHubConstants() {
    return CloudHubConstants;
  }

  constructor(
    public activeModal: NgbActiveModal,
    private planService: PlansListingService,
    private fb: FormBuilder,
      private _toasterService : ToastService,
    private _translateService : TranslateService,
  ) {
    this.simpleForm = this.fb.group({
      effectivenessTypeId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.planProductId = this.data.PlanProductId;
    this.planProductName = this.data.Name;
    this.billingTypeName = this.data.BillingTypeName;
    this.categoryName = this.data.CategoryName;
    this.shouldShowPriceLockWarningMessage = this.data.ShouldShowPriceLockWarningMessage;
    this.maxPrice = this.data.ProviderSellingPrice;
    this.minPrice = this.data.PriceForPartner;
    this.canPriceLead = this.data.CanPriceLead;
    this.canPriceLag = this.data.CanPriceLag;

    const subscription = this.planService.getPriceChangeEffectivenessType().pipe(
      takeUntil(this.destroy$),
      switchMap((res: any) => {
        this.priceChangeEffectivenessType = res.Data.filter((item: any) => {
          if (this.categoryName == "OnlineServicesNCE") {
            return item.Name.toLocaleLowerCase() !== 'CurrentCycle'.toLocaleLowerCase();
          }
          else {
            return item.Name.toLocaleLowerCase() !== 'CurrentCycle'.toLocaleLowerCase();
          }
        });
        
        //this.simpleForm.get('effectivenessTypeId').setValue(this.priceChangeEffectivenessType[0].ID);
        //this.effectivenessTypeId = this.priceChangeEffectivenessType.ID;
        return this.planService.planOfferCurrencyRates(this.planProductId)

      })
    ).subscribe((res: any) => {
      this.offerPriceListData = res.Data;
      this.isGridDataLoading = false;
      this.dataLoaded = true;
    })
    this._subscriptionArray.push(subscription);
  }

  ok() { 
    let searchCriteriaData: any[] = [];
    // this.frmPriceChange.$submitted = true;
    this.buttonClicked = true;
    let inValidNumber = false; 
    inValidNumber = this.offerPriceListData.some(e => e.NewPrice === null || e.NewPrice === undefined || e.NewPrice === '' )

    if(inValidNumber){
      this._toasterService.error(this._translateService.instant('TRANSLATE.SALE_PRICE_EMPTY_ERROR'));
      return;
    }

    if(this.categoryName.toLowerCase() === this.cloudHubConstants.CATEGORY_AZURE_PLAN && this.billingTypeName.toLowerCase() === this.cloudHubConstants.BILLING_TYPE_MS_COST_PERCENTAGE){
      var priceIsLessThanZero = false;
      priceIsLessThanZero = this.offerPriceListData.some(e => e.NewPrice < 0 );
      if(priceIsLessThanZero){
        this._toasterService.error(this._translateService.instant('TRANSLATE.BILLING_TYPE_DESC_MS_COST_PERCENTAGE_SALE_PRICE_WARNING'));
        return;
      }
    }

    if (this.simpleForm.valid) {
      this.effectivenessTypeId = this.simpleForm.get('effectivenessTypeId').value;
      _.each(this.offerPriceListData,(datum) => {
        let serachData =
        {
          PlanProductId: datum.PlanProductId,
          CurrencyCode: datum.CurrencyCode,
          SalePrice: datum.SalePrice,
          NewPrice: datum.NewPrice,
          EffectivenessTypeId: this.effectivenessTypeId,
          IsCustomPrice: true
        };
        searchCriteriaData.push(serachData)
      });
      let searchCriteria = {
        searchCriteriaString: JSON.stringify(searchCriteriaData)
      };
      let result = { SearchCriteria: searchCriteria, NewSalePrice: _.find(searchCriteriaData, each => each.CurrencyCode === this.data.CurrencyCode).NewPrice };
      this.activeModal.close(result)
    }
  }

  cancel() {
    
    //let result = { SelectedOffer: data };
    this.activeModal.close()
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe()
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
