import { Component, OnInit, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NgbActiveModal, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import moment from 'moment';
import { NotifierService } from 'src/app/services/notifier.service';
import { QuoteService } from '../quotes.service';
import { ToastService } from 'src/app/services/toast.service';
import { Subject, Subscription, takeUntil} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { ClientSettingsService } from 'src/app/services/client-settings.service';

@Component({
  selector: 'app-quote-custom-line-item',
  templateUrl: './quote-custom-line-item.component.html',
  styleUrls: ['./quote-custom-line-item.component.scss']
})
export class QuoteCustomLineItemComponent implements OnInit,OnDestroy,AfterViewInit{
  customLineItemForm: FormGroup;
  saleTypes: any[] = [];
  billingPeriods: any[] = [];
  formSubmit: boolean=false;

  @Input() customLineItemDetails: any; // Use @Input to receive data from parent

  billingPeriodId: any;
  billingPeriodValue: string | null = null;
  QuoteLineItemId: number = 0;
  destroy$ = new Subject<void>;
  _subscriptionArray: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private activeModal: NgbActiveModal,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _quotesService: QuoteService,
    private notifier: NotifierService,
    private _clientSettingsService: ClientSettingsService,
    private _unsavedChangesService: UnsavedChangesService
  ) {
    this.customLineItemForm = this.fb.group({
      Name: ['', [Validators.required, Validators.maxLength(150)]],
      Description: ['', Validators.required],
      SaleType: ['', Validators.required],
      UnitPrice: [null, [Validators.required, Validators.min(0)]],
      IsTaxable: [false],
      StartDate: [''],
      EndDate: [''],
      InvoiceNumber: [''],
      InvoiceDueDate: [''],
      InvoiceDate: [''],
      BillingEnabled: [true]
    });
  }

  ngOnInit(): void {
    this.getSaleTypes();
    this.getCurrentBillingPeriod();

    if (this.customLineItemDetails) {
      this.getCustomLineItemDetails(this.customLineItemDetails);
    }

    // Subscribe to BillingEnabled toggle changes to enable/disable billing fields
    const subscription = this.customLineItemForm.get('BillingEnabled')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((isBillingEnabled: boolean) => {
        this.toggleBillingFields(isBillingEnabled);
      });
    if (subscription) {
      this._subscriptionArray.push(subscription);
    }

    // Set initial state of billing fields based on BillingEnabled value
    this.toggleBillingFields(this.customLineItemForm.get('BillingEnabled')?.value);
  }

  getSaleTypes(): void {
    const subscription = this._commonService.getSaleTypes().pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.saleTypes = data;
    });
    this._subscriptionArray.push(subscription);
  }

  getCurrentBillingPeriod(): void {
    const subscription = this._commonService.getBillingPeriodsForSubscription().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      const billingPeriods = response.Data;
      if (billingPeriods && billingPeriods.length > 0) {
        this.billingPeriods = billingPeriods;
        this.billingPeriodId = billingPeriods[billingPeriods.length - 1].BillingPeriodId;
        this.updateBillingPeriodValue();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  updateBillingPeriodValue(): void {
    const currentBillingPeriod = this.billingPeriods.find(e => e.BillingPeriodId === this.billingPeriodId);
    if (currentBillingPeriod) {
      this.billingPeriodValue = `${moment(currentBillingPeriod.BillingStartDate).format('LL')} - ${moment(currentBillingPeriod.BillingEndDate).format('LL')}`;
    }
  }

  getCustomLineItemDetails(customLineItem: any): void {
    if (customLineItem) {
      this.customLineItemForm.patchValue({
        Name: customLineItem.CustomLineItemDetails.Name,
        Description: customLineItem.CustomLineItemDetails.Description,
        SaleType: customLineItem.CustomLineItemDetails.SaleTypeId,
        UnitPrice: customLineItem.CustomLineItemDetails.FinalSalePrice,
        StartDate: this.convertDateToNgbDateStruct(new Date(customLineItem.CustomLineItemDetails.StartDate)),
        EndDate: this.convertDateToNgbDateStruct(new Date(customLineItem.CustomLineItemDetails.EndDate)),
        InvoiceNumber: customLineItem.CustomLineItemDetails.InvoiceNumber,
        InvoiceDate: this.convertDateToNgbDateStruct(new Date(customLineItem.CustomLineItemDetails.InvoiceDate)),
        InvoiceDueDate: this.convertDateToNgbDateStruct(new Date(customLineItem.CustomLineItemDetails.DueDate)),
        BillingPeriod: customLineItem.CustomLineItemDetails.BillingPeriodId,
        IsTaxable: customLineItem.CustomLineItemDetails.IsTaxable,
        BillingEnabled: customLineItem.CustomLineItemDetails.IsDefaultCustomLineItem ?? true,
      });
      this.QuoteLineItemId = customLineItem.CustomLineItemDetails.QuoteLineItemId;
    }
  }
  
  convertDateToNgbDateStruct(date: Date): NgbDateStruct {
  
      if(date){
        date =new Date(date);
        return {
          year: date.getFullYear(),
          month: date.getMonth()+1,
          day: date.getDate()
        }
      }
      return null;
    }

  isValueNAN(value:any){
    return isNaN(value)
  }


  submit(): void {
    this.formSubmit = true    
    if (this.customLineItemForm.invalid) {
      // Mark form fields as touched to show validation errors
      this.customLineItemForm.markAllAsTouched();
      return;
    }

    // Only validate billing dates if billing is NOT enabled
    const isBillingEnabled = this.customLineItemForm.get('BillingEnabled')?.value;
    if (!isBillingEnabled) {
      // Extract form values
      const startDate = this.customLineItemForm.get('StartDate')?.value;
      const endDate = this.customLineItemForm.get('EndDate')?.value;
      const invoiceDate = this.customLineItemForm.get('InvoiceDate')?.value;
      const dueDate = this.customLineItemForm.get('InvoiceDueDate')?.value;
    
      if (startDate && endDate && invoiceDate && dueDate) {
        var startDateObj = new Date(startDate.year, startDate.month - 1, startDate.day);
        var endDateObj = new Date(endDate.year, endDate.month - 1, endDate.day);
        var invoiceDateObj = new Date(invoiceDate.year, invoiceDate.month - 1, invoiceDate.day);
        var dueDateObj = new Date(dueDate.year, dueDate.month - 1, dueDate.day);

        // Date validation logic
        if (startDateObj >= endDateObj) {
          this._toastService.error(this.translate.instant('TRANSLATE.VALIDATION_MESSAGE_FOR_START_DATE_LESS_THAN_END_DATE'));
          return;
        }
      
        if (invoiceDateObj >= dueDateObj) {
          this._toastService.error(this.translate.instant('TRANSLATE.VALIDATION_MESSAGE_FOR_INVOICE_DATE_LESS_THAN_DUE_DATE'));
          return;
        }
      }
    }
    const formValues = this.customLineItemForm.value;
    const decimalCheck = (formValues.UnitPrice * 100) % 1 !== 0;
    if (decimalCheck) {
      this._toastService.error(this.translate.instant('TRANSLATE.QUOTE_CUSTOM_LINE_ITEM_UNIT_PRICE_DECIMAL_ERROR'));
      return;
    }
    if (formValues.Name && formValues.Name.length > 150) {
      this._toastService.error(this.translate.instant('TRANSLATE.CUSTOM_LINE_ITEM_MAXLENGTH_ERROR_MESSAGE'));
      return;
    }
    let startdate = formValues.StartDate ? { year: formValues.StartDate.year, month: formValues.StartDate.month - 1, day: formValues.StartDate.day } : null;
    let EndDate = formValues.EndDate ? { year: formValues.EndDate.year, month: formValues.EndDate.month - 1, day: formValues.EndDate.day } : null;
    let InvoiceDate = formValues.InvoiceDate ? { year: formValues.InvoiceDate.year, month: formValues.InvoiceDate.month - 1, day: formValues.InvoiceDate.day } : null;
    let DueDate = formValues.InvoiceDueDate ? { year: formValues.InvoiceDueDate.year, month: formValues.InvoiceDueDate.month - 1, day: formValues.InvoiceDueDate.day } : null;
    const product = {
      QuoteLineItemId: this.QuoteLineItemId,
      PlanProductId: 0,
      Name: formValues.Name,
      Description: formValues.Description,
      Quantity: 1,
      OriginlaSalePrice: formValues.UnitPrice,
      FinalSalePrice: formValues.UnitPrice,
      ProviderPrice: 0,
      DisplayFinalSalePrice: formValues.UnitPrice,
      Discount: 0.00,
      Tax: 0.00,
      SaleTypeId: formValues.SaleType,
      BillingPeriodId: this.billingPeriodId,
      StartDate: startdate ? moment(startdate).format('LL') : '',
      EndDate: EndDate ? moment(EndDate).format('LL') : '',
      InvoiceNumber: formValues.InvoiceNumber || '',
      InvoiceDate: InvoiceDate ? moment(InvoiceDate).format('LL') : '',
      DueDate: DueDate ? moment(DueDate).format('LL') : '',
      CurrencyThousandSeperator: this.customLineItemDetails?.CurrencyThousandSeperator || ',',
      CurrencyDecimalSeperator: this.customLineItemDetails?.CurrencyDecimalSeperator || '.',
      CurrencyCode: this.customLineItemDetails?.CurrencyCode || 'USD',
      CurrencySymbol: this.customLineItemDetails?.CurrencySymbol || '$',
      CurrencyDecimalPlaces: this.customLineItemDetails?.CurrencyDecimalPlaces || 2,
      IsTaxable: formValues.IsTaxable,
      BillingCycleName: 'Monthly',
      IsActive: 1,
      IsDefaultCustomLineItem: formValues.BillingEnabled ?? false
    };

    this.activeModal.close(product);
  }

  cancel(): void {
    this.activeModal.dismiss('cancel');
  }

  toggleBillingFields(isBillingEnabled: boolean): void {
    const billingFields = ['StartDate', 'EndDate', 'InvoiceNumber', 'InvoiceDate', 'InvoiceDueDate'];
    
    billingFields.forEach(fieldName => {
      const field = this.customLineItemForm.get(fieldName);
      if (field) {
        if (isBillingEnabled) {
          // When BillingEnabled is true, billing fields are optional - disable them and clear validators
          field.disable();
          field.clearValidators();
        } else {
          // When BillingEnabled is false, billing fields are required - enable them and add validators
          field.enable();
          field.setValidators(Validators.required);
        }
        field.updateValueAndValidity();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  ngAfterViewInit() {
    setTimeout(() => {
    document.body.setAttribute('tabindex', '-1');     
    document.body.focus();
     this.customLineItemForm.controls['Name'].markAsUntouched();
     }, 10);
     }
}
