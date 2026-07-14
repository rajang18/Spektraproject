import { CommonModule } from '@angular/common';
import { Component, Input, OnInit} from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule, NgbPopover, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; 
import { PlansListingService } from '../../partner/plans/services/plans-listing.service'; 
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'; 
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import _ from 'lodash';
import { CommonService } from 'src/app/services/common.service';
import { CurrencyPipe } from "../../../shared/pipes/currency.pipe"; 
import { ToastService } from 'src/app/services/toast.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { Subject, Subscription, takeUntil } from 'rxjs';


@Component({
  selector: 'app-editable-contract-details',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    NgbModule, TranslateModule,C3CommonModule, FormsModule, ReactiveFormsModule, NgbPopoverModule,
    CurrencyPipe
  ],
  templateUrl: './editable-contract-details.component.html',
  styleUrl: './editable-contract-details.component.scss'
})
export class EditableContractDetailsComponent implements OnInit {
  _subscription: Subscription;
  priceChangeEffectivenessType: any;
  effectivenessTypeId: number;
  billingTypes: any;
  slabTableRowInFocus: any;
  slabProducts: any;
  pricingSlabs: any[] = [];
  consumptionTypes: any;
  simpleForm: FormGroup;
  frmPricingSlabs: FormGroup;
  buttonClicked = false;
  isEditOrAddLineItemEnabled: number = 0;
  isAddingNewSlab = false;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();


  get cloudHubConstants() {
    return CloudHubConstants;
  }

  @Input() product: any;
  @Input() currencyCode: any;

  constructor(
    private _modalService: NgbModal,
    public _activeModal: NgbActiveModal,
    private _translateService: TranslateService,
    private _planService: PlansListingService,
    private _toaster: ToastService,
    private fb: FormBuilder,
    private _commonService: CommonService
  ) {
    this.simpleForm = this.fb.group({
      effectivenessTypeId: [''],
    });
    this.frmPricingSlabs = this.fb.group({
      pricingSlabsArray: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.getConsumptionTypes();
    if (!this.product.PlanProductId) {
      this.getPricingSlabForNewPlanOffer();
    }
    else {
      this.getPricingSlabForOldPlanOffer();
    }
    this.getPriceChangeEffectivenessType();
  }

  get pricingSlabsArray() {
    return this.frmPricingSlabs.get('pricingSlabsArray') as FormArray
  }

  getPricingSlabForNewPlanOffer() {
    if (!this.product.Slabs) {
      const subscription = this._planService.getPricingSlabs(this.product, this.currencyCode).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        this.pricingSlabs = res.Data;
        if (this.product.Slabs && this.product.Slabs.length) {
          this.pricingSlabs = _.cloneDeep(this.product.Slabs);
        }
        this.pricingSlabs.forEach((slab) => {
          this.pricingSlabsArray.push(this.createRowFormGroup(slab));
        });
        this.pricingSlabsArray.controls.forEach((row) => {
          this.enableOrDisableBillingTypeSelectTag(row);
        })
      });
      this._subscriptionArray.push(subscription);

    }
    if (this.product.Slabs && this.product.Slabs.length) {
      this.pricingSlabs = _.cloneDeep(this.product.Slabs);
      this.pricingSlabs.forEach((slab) => {
        this.pricingSlabsArray.push(this.createRowFormGroup(slab));
      });
      this.pricingSlabsArray.controls.forEach((row) => {
        this.enableOrDisableBillingTypeSelectTag(row);
      });
    }
  }

  getPricingSlabForOldPlanOffer() {
      const subscription = this._planService.getPricingSlabsManageScreen(this.product, this.currencyCode, false).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.pricingSlabs = res.Data;
      if (this.product.Slabs && this.product.Slabs.length) {
        this.pricingSlabs = _.cloneDeep(this.product.Slabs);
      }
      this.pricingSlabs.forEach((slab) => {
        this.pricingSlabsArray.push(this.createRowFormGroup(slab));
      });
      this.pricingSlabsArray.controls.forEach((row) => {
        this.enableOrDisableBillingTypeSelectTag(row);
      });
    })
    this._subscriptionArray.push(subscription);
  }

  createRowFormGroup(rowData: any): FormGroup {
    return this.fb.group({
      id: [rowData.Id],
      minValue: [rowData.MinValue],
      maxValue: [rowData.MaxValue],
      editMaxValue: [rowData.EditMaxValue || '', Validators.required],
      costToPartner: [rowData.CostToPartner],
      salePrice: [rowData.SalePrice],
      editSalePrice: [rowData.EditSalePrice || '', Validators.required],
      billingTypeId: [rowData.BillingTypeId],
      editBillingTypeId: [rowData.EditBillingTypeId || '', Validators.required],
      billingTypeName: [rowData.BillingTypeName],
      isEditing: [rowData.IsEditing || false],
      isError: [rowData.IsError || false],
      isNew: [rowData.IsNew || false]
    });
  }

  enableOrDisableBillingTypeSelectTag(row: any) {
    if (!this.getFormControlValue(row, 'isEditing')) {
      row?.get('billingTypeId').disable();
    }
    else {
      row?.get('billingTypeId').enable();
    }
  }

  getFormControlValue(form: AbstractControl, controlName: string) {
    return form?.get(controlName)?.value;
  }

  getPriceChangeEffectivenessType() {
    const subscription = this._planService.getPriceChangeEffectivenessType().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.priceChangeEffectivenessType = _.filter(response.Data, (item) => {
        return item.Name.toLocaleLowerCase() !== 'CurrentCycle'.toLocaleLowerCase() && item.Name.toLocaleLowerCase() === 'immediateeffect';
      });
      this.effectivenessTypeId = this.priceChangeEffectivenessType[0].ID;
    })
    this._subscriptionArray.push(subscription);
  }

  getConsumptionTypes() {
    const subscription = this._commonService.getConsumptionTypes().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.consumptionTypes = res;
      this.getBillingTypes();
    })
    this._subscriptionArray.push(subscription);
  }

  getBillingTypes() {
    const subscription = this._commonService.getConsumptionBillingTypes().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      var contractConsumptionTypeId = _.result(_.find(this.consumptionTypes, each => each.Name.toLowerCase() === CloudHubConstants.CONSUMPTION_CONTRACT), 'ID', 0);
      this.billingTypes = _.filter(res, billingType => {
        return billingType.ConsumptionTypeId === contractConsumptionTypeId;
      });
    })
    this._subscriptionArray.push(subscription);
  }

  cancel() {
    this._modalService.dismissAll();
  }

  ok() {
    this.product.Slabs = this.pricingSlabs;
    this._activeModal.close(this.pricingSlabs);
  }

  getPopoverText(): string {
    if (!this.slabTableRowInFocus) {
      return '';
    }

    const { MinValue, MaxValue } = this.slabTableRowInFocus;
    return MaxValue
      ? this._translateService.instant('PLANS_MANAGE_CONTRACT_DETAILS_POPOVER_TEXT_FOR_PRICING_SLAB_MINVALUE_VALIDATION_WITH_MAX', { minValue: MinValue, maxValue: MaxValue })
      : this._translateService.instant('PLANS_MANAGE_CONTRACT_DETAILS_POPOVER_TEXT_FOR_PRICING_SLAB_MINVALUE_VALIDATION_WITHOUT_MAX', { minValue: MinValue });
  }

  togglePopover(isError: boolean, popover: NgbPopover): void {
    if (isError) {
      popover.open();
    } else {
      popover.close();
    }
  }

  processPriceSlabInsertion(row: any, pricingSlabsArray: any) {
    if (this.getFormControlValue(row, 'editMaxValue') > this.slabTableRowInFocus.MinValue && (this.getFormControlValue(row, 'editMaxValue') < this.slabTableRowInFocus.MaxValue || this.slabTableRowInFocus.MaxValue === null)) {
      row?.get('isError').setValue(false);
      const idx = pricingSlabsArray.controls.findIndex(control => {
        return control.get('id')?.value === this.slabTableRowInFocus.Id;
      });
      if (idx > -1) {
        // Assuming `pricingSlabsArray` is the FormArray and `idx` is already calculated
        const formGroup = pricingSlabsArray.at(idx) as FormGroup; // Access the specific FormGroup

        // Update the MinValue in the form control
        formGroup.patchValue({
          minValue: this.getFormControlValue(row, 'editMaxValue') ? parseInt(this.getFormControlValue(row, 'editMaxValue')) + 1 : null,
        });

        // If you need to update a local array (like `cc.PricingSlabs`), do it explicitly
        if (this.pricingSlabs && this.pricingSlabs[idx]) {
          this.pricingSlabs[idx].MinValue = this.getFormControlValue(row, 'editMaxValue') ? parseInt(this.getFormControlValue(row, 'editMaxValue')) + 1 : null;
        }
      }
    } else {
      row?.get('isError').setValue(true);
    }
  }

  saveSlabTableData(row, index) {
    this.buttonClicked = true;
    if (row.valid) {
      this.pricingSlabs[index].CostToPartner = this.getFormControlValue(row, 'costToPartner');
      this.pricingSlabs[index].SalePrice = this.getFormControlValue(row, 'editSalePrice');
      this.pricingSlabs[index].BillingTypeId = this.getFormControlValue(row, 'editBillingTypeId');
      this.pricingSlabs[index].BillingTypeName = _.result(_.find(this.billingTypes, { 'BillingTypeId': parseInt(this.getFormControlValue(row, 'editBillingTypeId')) }), 'BillingTypeName');
      if (this.getFormControlValue(row, 'isNew')) {
        this.pricingSlabs[index].MaxValue = this.getFormControlValue(row, 'editMaxValue');
      }
      this.pricingSlabs[index].IsEditing = false;
      this.pricingSlabs[index].IsNew = false;
      this.pricingSlabs[index].IsError = false;
      this.isAddingNewSlab = false;
      this.pricingSlabsArray.clear();
      this.pricingSlabs.forEach((slab) => {
        this.pricingSlabsArray.push(this.createRowFormGroup(slab));
      });
      this.pricingSlabsArray.controls.forEach((row) => {
        this.enableOrDisableBillingTypeSelectTag(row);
      });
    }
  }

  editSlabTableRow(row: any) {
    if (!this.pricingSlabsArray.controls.some((item: any) => { return this.getFormControlValue(item, 'isEditing') || this.getFormControlValue(item, 'isNew') })) {
      row.get('editMaxValue').setValue(this.getFormControlValue(row, 'maxValue'));
      row.get('editSalePrice').setValue(this.getFormControlValue(row, 'salePrice'));
      row.get('editBillingTypeId').setValue(this.getFormControlValue(row, 'billingTypeId'));
      row.get('isEditing').setValue(true);
      this.enableOrDisableBillingTypeSelectTag(row);
    }
    else {
      this._toaster.error(this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_DETAILS_POPOVER_ERROR_'));
    }
  }

  cancelSlabTableChanges(row) {
    if (this.getFormControlValue(row, 'isNew')) {
      const idx = this.pricingSlabsArray.controls.findIndex(
        (control) => control.get('id')?.value === this.slabTableRowInFocus.Id
      );

      if (idx > -1) {
        this.pricingSlabs[idx].MinValue = this.slabTableRowInFocus.MinValue;
      }

      this.pricingSlabs = this.pricingSlabs.filter((item: any) => {
        return !item.IsNew
      });
    }
    this.isAddingNewSlab = false;
    this.pricingSlabsArray.clear();
    this.pricingSlabs.forEach((slab) => {
      this.pricingSlabsArray.push(this.createRowFormGroup(slab));
    });
    this.pricingSlabsArray.controls.forEach((row) => {
      this.enableOrDisableBillingTypeSelectTag(row);
    });
  }

  addNewSlabTableRow(row: any, i: number) {
    if (!this.pricingSlabsArray.controls.some((item: any) => { return this.getFormControlValue(item, 'isEditing') || this.getFormControlValue(item, 'isNew') })) {

      this.slabTableRowInFocus = { ...this.pricingSlabs[i] };

      const maxItem: any = _.maxBy(this.pricingSlabs, 'Id');
      const maxId = maxItem.Id || 0; // Get max Id
      const newRow = {
        Id: maxId + 1,
        MinValue: this.getFormControlValue(row, 'minValue'),
        MaxValue: null,
        EditMaxValue: null,
        CostToPartner: this.getFormControlValue(row, 'costToPartner'),
        SalePrice: this.getFormControlValue(row, 'salePrice'),
        EditSalePrice: this.getFormControlValue(row, 'salePrice'),
        BillingTypeId: this.getFormControlValue(row, 'billingTypeId'),
        EditBillingTypeId: this.getFormControlValue(row, 'billingTypeId'),
        IsEditing: true,
        IsNew: true,
        IsError: false,
      };
      this.pricingSlabs[i].MinValue = null;
      this.isAddingNewSlab = true;
      this.pricingSlabs.splice(i, 0, newRow);
      this.pricingSlabsArray.clear();
      this.pricingSlabs.forEach((slab) => {
        this.pricingSlabsArray.push(this.createRowFormGroup(slab));
      });
      this.pricingSlabsArray.controls.forEach((row) => {
        this.enableOrDisableBillingTypeSelectTag(row);
      });
    }
    else {
      this._toaster.error(this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_DETAILS_POPOVER_ERROR_'));
    }
  }

  deleteSlabTableRow(row: any) {
    var editable = 0;
    this.pricingSlabs = this.pricingSlabs.filter((item, idx) => {
      const minValue = item.MinValue;
      if (minValue < this.getFormControlValue(row, 'minValue')) {
        editable = idx;
        console.log(editable);
      }
      return minValue !== this.getFormControlValue(row, 'minValue');
    });
    this.pricingSlabs[editable].MaxValue = this.getFormControlValue(row, 'maxValue')
    this.pricingSlabsArray.clear();
    this.pricingSlabs.forEach((slab) => {
      this.pricingSlabsArray.push(this.createRowFormGroup(slab));
    });
    this.pricingSlabsArray.controls.forEach((row) => {
      this.enableOrDisableBillingTypeSelectTag(row);
    });
  }

  disableSubmitButton() {
    return this.isAddingNewSlab || this.pricingSlabsArray.controls.some(row => row.get('isEditing')?.value);
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}