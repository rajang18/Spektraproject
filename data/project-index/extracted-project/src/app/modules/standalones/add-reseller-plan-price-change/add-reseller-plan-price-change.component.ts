import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PlansListingService } from '../../partner/plans/services/plans-listing.service';
import * as _ from 'lodash';
import { ResellerPlansListingService } from '../../partner/reseller-plans/services/resellerplans-listing.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { Subject, Subscription, takeUntil, } from 'rxjs';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-add-reseller-plan-price-change',
  standalone: true,
  imports: [NgbModule, TranslateModule,C3CommonModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-reseller-plan-price-change.component.html',
  styleUrl: './add-reseller-plan-price-change.component.scss'
})
export class AddResellerPlanPriceChangeComponent implements OnInit, OnDestroy {
  _subscription: Subscription;
  data: any = {};
  productVariantId: any;
  validity: any;
  validityType: any;
  planProductName: any;
  providerReferenceId: any;
  billingTypeName: any;
  billingCycleName: any;
  priceChangeEffectivenessType: any;
  effectivenessTypeId: any;
  offerPriceListData: any = [];
  changeOfferPrice: any;
  selectedConsumptionType: any;
  categoryName: any;
  selectedSalePriceOption: any = 'price';
  macroTypeId: any;
  macros: any;
  macroValue: any;
  isGridDataLoading: boolean = false;
  shouldShowPriceLockWarningkMessage: any;
  maxPrice: any;
  minPrice: any;
  canPriceLead: any;
  canPriceLag: any;
  resellerPriceChangeFormGroup: FormGroup;
  private destroy$ = new Subject<void>;
  HasResellerUsagePlanMacro: any;
  buttonClicked = false;
  _subscriptionArray: Subscription[] = [];

  get cloudHubConstants() {
    return CloudHubConstants;
  }

  constructor(
    public _activeModal: NgbActiveModal,
    private _planService: PlansListingService,
    private _resellerPlanService: ResellerPlansListingService,
    private _cdref: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _toasterService: ToastService,
    private _translateService: TranslateService,
    private _unsavedChangesService: UnsavedChangesService
  ) {
    this.resellerPriceChangeFormGroup = this._formBuilder.group({
      priceChangeEffectivenessType: ['', [Validators.required]],
      salePriceOption: ['', Validators.required],
      newSalePrice: ['',],
      macroType: ['',],
      macroValue: ['',]
    });

    this.resellerPriceChangeFormGroup.get('salePriceOption').setValue(this.selectedSalePriceOption);
    this.resellerPriceChangeFormGroup.updateValueAndValidity();
  }

  ngOnInit(): void {
    this.productVariantId = this.data.ProductVariantId;
    this.validity = this.data.Validity;
    this.validityType = this.data.ValidityType;
    this.planProductName = this.data.Name;
    this.providerReferenceId = this.data.ProviderReferenceId;
    this.billingTypeName = this.data.BillingTypeName;
    this.billingCycleName = this.data.BillingCycleName;
    this.selectedConsumptionType = this.data.SelectedConsumptionType;
    this.categoryName = this.data.CategoryName;
    this.macros = this.data.Macros;
    this.selectedSalePriceOption = 'price';
    this.shouldShowPriceLockWarningkMessage = this.data.ShouldShowPriceLockWarningMessage;
    this.maxPrice = this.data.ProviderSellingPrice;
    this.minPrice = this.data.PriceForPartner;
    this.canPriceLead = this.data.CanPriceLead;
    this.canPriceLag = this.data.CanPriceLag;
    this.HasResellerUsagePlanMacro = this.data.HasResellerUsagePlanMacro;
    if (this.data.ProviderSellingPrice < this.data.PriceForPartner) {
      this.maxPrice = this.minPrice = this.data.PriceForPartner;
    }
    this.getPriceChangeEffectivenessType();
    this.getResellerPlanOfferCurrencyRates();
  }

  getPriceChangeEffectivenessType() {
    const subscription = this._planService.getPriceChangeEffectivenessType().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.priceChangeEffectivenessType = _.filter(response.Data, (item) => {
        return item.Name.toLocaleLowerCase() === 'immediateeffect';
      });
      //this.effectivenessTypeId = this.priceChangeEffectivenessType[0].ID;
      //this.resellerPriceChangeFormGroup.get('priceChangeEffectivenessType').setValue(this.effectivenessTypeId);
      this.resellerPriceChangeFormGroup.updateValueAndValidity();
    })
    this._subscriptionArray.push(subscription);
  }

  onSalePriceOptionClick(value: any) {
    this.selectedSalePriceOption = value;
    if (value === 'macro') {
      _.each(this.offerPriceListData, (obj) => {
        obj.NewPrice = 0;
      });
      this.resellerPriceChangeFormGroup.get('macroType').setValidators(Validators.required);
    } else {
      this.resellerPriceChangeFormGroup.get('macroType').reset();
      this.resellerPriceChangeFormGroup.get('macroType').removeValidators(Validators.required);
    }
    this.resellerPriceChangeFormGroup.get('macroType').updateValueAndValidity();

  }

  getResellerPlanOfferCurrencyRates() {
    this.isGridDataLoading = true;
    const subscription = this._resellerPlanService.getResellerPlanOfferCurrencyRates(this.productVariantId, this.billingCycleName, this.validity, this.validityType).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.offerPriceListData = response.Data;
      this.isGridDataLoading = false;
    })
    this._subscriptionArray.push(subscription);
  }

  ok() {
    this.getFormData();
    this.buttonClicked = true;
    if (this.selectedSalePriceOption === 'price') {
      let obj = _.filter(this.offerPriceListData, (obj) => {
        return obj.NewPrice === null || obj.NewPrice === undefined || obj.NewPrice === '';
      });
      if (obj.length > 0) {
        this._toasterService.error(this._translateService.instant('TRANSLATE.SALE_PRICE_EMPTY_ERROR'));
        return;
      }
    }
    this.resellerPriceChangeFormGroup.markAllAsTouched();
    if (this.resellerPriceChangeFormGroup.valid) {
      let searchCriteriaData: any[] = [];
      _.each(this.offerPriceListData, (datum) => {
        var serachData =
        {
          //ProductVariantId: datum.PlanProductId,
          CurrencyCode: datum.CurrencyCode,
          SalePrice: datum.SalePrice,
          NewPrice: datum.NewPrice,
          EffectivenessTypeId: this.effectivenessTypeId,
          ProductPricingDetailsId: datum.ProductPricingDetailsId,
          ChangeOption: this.selectedSalePriceOption,
          MacroId: this.macroTypeId?.ID,
          MacroName: this.macroTypeId?.Name,
          MacroValue: this.macroTypeId?.NeedsPercent ? this.macroValue : 0,
          SelectedConsumptionType: this.selectedConsumptionType,
          IsCustomPrice: true
        };
        searchCriteriaData.push(serachData);
        let searchCriteria = {
          searchCriteriaString: JSON.stringify(searchCriteriaData)
        };
        let result = { SearchCriteria: searchCriteria };
        this._activeModal.close(result);
      })
    }
  }

  cancel() {
    this._activeModal.close()
  }

  getFormData() {
    this.effectivenessTypeId = this.resellerPriceChangeFormGroup.get('priceChangeEffectivenessType')?.value;
    this.selectedSalePriceOption = this.resellerPriceChangeFormGroup.get('salePriceOption')?.value;
    this.macroTypeId = this.resellerPriceChangeFormGroup.get('macroType')?.value;
    this.macroValue = this.resellerPriceChangeFormGroup.get('macroValue')?.value;
  }

  onSelectMacro() {
    this.macroTypeId = this.resellerPriceChangeFormGroup.get('macroType')?.value;
    if (this.macroTypeId.NeedsPercent) {
      this.resellerPriceChangeFormGroup.get('macroValue')?.setValidators(Validators.required)
    } else {
      this.resellerPriceChangeFormGroup.get('macroValue')?.removeValidators(Validators.required);
    }
    this.resellerPriceChangeFormGroup.get('macroValue')?.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
  

  onChangeInput(row: any, event: Event) {
    let val = (event.target as HTMLInputElement).value
    row.NewPrice = val;
  }
}
