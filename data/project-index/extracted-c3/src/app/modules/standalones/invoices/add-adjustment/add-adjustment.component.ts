import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import moment from 'moment';
import { Subject, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { InvoicesService } from 'src/app/services/invoices.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AdjustmentTypeEnum } from 'src/app/shared/models/enums/enums';



@Component({
  selector: 'app-add-adjustment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    NgbDatepickerModule,
    NgSelectModule
  ],
  templateUrl: './add-adjustment.component.html',
  styleUrl: './add-adjustment.component.scss'
})
export class AddAdjustmentComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  addAdjustment: any = {};
  invoiceId: string;
  currentStateName: any;
  frmAddAdjustments: FormGroup
  dateFormat: any;
  IsSubmitEnabled: boolean;
  currentCustomerAllSubscriptions: any;
  defaultTaxID: boolean;
  defaultTaxIdTaxPercentage: number;
  providers: any; 
  constructor(
    public _router: Router,
    private _translateService: TranslateService,
    private _toastService: ToastService,
    private _invoiceService: InvoicesService,
    private _appService: AppSettingsService,
    private _commonService: CommonService,
    private _fb: FormBuilder,
    private _cdRef: ChangeDetectorRef,
    public _permissionService: PermissionService,
    public _dynamicTemplate: DynamicTemplateService,
    private _pageInfo: PageInfoService,
    private _unsavedChangesService: UnsavedChangesService,
  ) {

    super(_permissionService, _dynamicTemplate, _router, _appService);
    this.currentStateName = _router.url;

    if (localStorage.getItem("invoiceId") !== undefined && localStorage.getItem("invoiceId") !== null && localStorage.getItem("invoiceId") !== "") {
      this.invoiceId = localStorage.getItem("invoiceId");
    }
    this.addAdjustment.InvoiceId = this.invoiceId;

    if (localStorage.getItem("adjustmentId") !== undefined && localStorage.getItem("adjustmentId") !== null && localStorage.getItem("adjustmentId") !== "") {
      this.addAdjustment.ID = localStorage.getItem("adjustmentId") || 0;
    }

    if (this.invoiceId === undefined || this.invoiceId === null) {
      if (this.currentStateName.includes('partner')) {
        _router.navigate(['partner/invoices']);
        //$state.go("partner.invoices");
      }
      else {
        _router.navigate(['home/invoices']);
        //$state.go("home.invoices");
      }
    }
    else {
      if (this.addAdjustment.ID !== undefined && this.addAdjustment.ID !== null && this.addAdjustment.ID !== '0' && this.addAdjustment.ID !== 0) {
        this.getAdjustmentDetails();
      }
      else {
        this.getSubscriptions();
        this.getProviders();
      }
    }
    this.createForm();

  }

  ngOnInit(): void {

  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.dateFormat = response.Data.DateFormat;
    });
    this._subscriptionArray.push(subscription);
  }

  localTimeConvert(date) {
    return moment(date).local().toDate();
  }

  saveAdjustment() {
    let data = null //$rootScope.dateFormat;
    this.getFormValue();
    this.frmAddAdjustments.markAllAsTouched();

    if (this.addAdjustment.StartDate > this.addAdjustment.EndDate) {
      this._toastService.error(this._translateService.instant('TRANSLATE.INVOICE_SAVE_ADJUSTMENT_DATE_ERROR'));
      return;
    }

    if (this.frmAddAdjustments.valid) {
      this.getFormValue();
      const subscription = this._invoiceService.saveAddjustment(this.addAdjustment).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.frmAddAdjustments.reset();
        this.backToInvoiceLineItems();
      });
      this._subscriptionArray.push(subscription);
    }
  }


  getAdjustmentDetails() {
    const subscription = this._invoiceService.getAdjustmentDetails(this.addAdjustment.ID).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let adjustmentDetails = response.Data;
      if (adjustmentDetails !== undefined && adjustmentDetails !== null) {
        this.addAdjustment.AdjustmentDetails = adjustmentDetails.Details;
        this.addAdjustment.AdjustmentAmount = adjustmentDetails.AdjustmentAmount;
        this.addAdjustment.IsCredit = adjustmentDetails.IsCredit;
        this.addAdjustment.SubscriptionName = adjustmentDetails.SubscriptionName;
        this.addAdjustment.IsTaxable = adjustmentDetails.IsTaxable;
        this.addAdjustment.ProviderName = adjustmentDetails.ProviderName;
        this.addAdjustment.StartDate = this.localTimeConvert(adjustmentDetails.StartDate);
        this.addAdjustment.EndDate = this.localTimeConvert(adjustmentDetails.EndDate);
      }

      this.setFormValue();
      this.IsSubmitEnabled = true;
    });
    this._subscriptionArray.push(subscription);
  }

  updateAdjustmentCreditType(adjustmentCreditType) {
    let type = this.getFormControl('isCredit')?.value;
    if (adjustmentCreditType === "Credit") {
      this.addAdjustment.IsCredit = true;
    }
    else {
      this.addAdjustment.IsCredit = false;
    }
  }
  
  backToInvoiceLineItems() {
    let callback = ()=>{
      if (localStorage.getItem("adjustmentId") !== null) {
        localStorage.removeItem("adjustmentId");
      }
 
      if (this.currentStateName.includes('partner')) {
        // this._router.navigate(['partner/invoice/invoicelineitems'], { state: { invoiceId: this.invoiceId } });
        this._router.navigate(['partner/invoice'], { state: { invoiceId: this.invoiceId } });
        //$state.go("partner.invoice.lineitems", { invoiceId: vm.invoiceId });
      }
      else if(this.currentStateName.includes('home')) {
        this._router.navigate(['home/invoice/invoicelineitems'], { state: { invoiceId: this.invoiceId } });
        //$state.go("home.invoice.lineitems", { invoiceId: this.invoiceId });
      }
    }
    this._unsavedChangesService.setUnsavedChanges(this.frmAddAdjustments.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

  checkIfTaxable() {//Note: vm.defaultTaxID = tax id if it exists when saletype is null
    //Case: When defining a new adjustment we initialize vm.addAdjustment.IsTaxable as null. If it's an existing adjustment it will hold the true/false value from IsTaxable field in InvvoiceLineItems table. 

    this.addAdjustment.IsTaxable = false;
    this.getFormControl('isTaxable')?.setValue(this.addAdjustment.IsTaxable);
    this.addAdjustment.SubscriptionId = this.getFormControl('subscriptionId')?.value;
    let selectedProduct = _.find(this.currentCustomerAllSubscriptions, each => each.ID.toString() === this.addAdjustment.SubscriptionId.toString());
    if (selectedProduct) {
      this.getFormControl('providerId').reset();
      this.getFormControl('providerId').clearValidators();
      this.getFormControl('providerId').updateValueAndValidity();
    } else {
      this.getFormControl('providerId').reset();
      this.getFormControl('providerId').setValidators(Validators.required);
      this.getFormControl('providerId').updateValueAndValidity();
    }
    let selectedProductTax = selectedProduct ? selectedProduct.TaxPercentage : null;
    if ((this.defaultTaxID && this.defaultTaxIdTaxPercentage > 0 && selectedProductTax !== 0) || (selectedProduct && selectedProduct.TaxID && selectedProduct.TaxPercentage > 0)) {//If this is a new adjustment, we check if the customer is taxable based onthis.defaultTaxID OR if product is taxable using taxid defined on product
      this.addAdjustment.IsTaxable = true;
    }
    this.getFormControl('isTaxable')?.setValue(this.addAdjustment.IsTaxable);
    this.frmAddAdjustments.updateValueAndValidity();
  }

  getSubscriptions() {
    const subscription =  this._invoiceService.getSubscriptions(this.invoiceId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.currentCustomerAllSubscriptions = response.Data;
      if (this.currentCustomerAllSubscriptions && this.currentCustomerAllSubscriptions.length > 0) {
        this.defaultTaxID = this.currentCustomerAllSubscriptions[0].DefaultTaxID;
        this.defaultTaxIdTaxPercentage = this.currentCustomerAllSubscriptions[0].DefaultTaxPercentage;
        this.checkIfTaxable();
      } else if (!this.addAdjustment.ID) {
        this.addAdjustment.IsTaxable = false;
      }
      this.IsSubmitEnabled = true;
      this.getFormControl('isTaxable')?.setValue(this.addAdjustment.IsTaxable);
      this.frmAddAdjustments.updateValueAndValidity();
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getProviders() {
    const subscription = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.providers = response;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  createForm() {
    this.frmAddAdjustments = this._fb.group({
      adjustmentDetails: ['', Validators.required],
      adjustmentAmount: [, Validators.required],
      isCredit: [AdjustmentTypeEnum.ADDITION_CHARGE,],
      subscriptionId: [null,],
      subscriptionName: ['',],
      providerId: ['', Validators.required],
      providerName: ['',],
      startDate: [this.getNgbDateStruct(new Date()), Validators.required],
      endDate: [this.getNgbDateStruct(new Date()), Validators.required],
      isTaxable: [],
    })
  }

  getFormControl(controlName: string) {
    return this.frmAddAdjustments.get(controlName);
  }

  getDate(date: any) {
    //let date = this.getFormControlValue(form, controlName);
    if (date) {
      return new Date(date.year, date.month - 1, date.day,new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());
    }
    return null;
  }

  getNgbDateStruct(date: any) {
    if (date) {
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      }
    }
    return null;
  }

  getFormValue() {
    let value = this.frmAddAdjustments.getRawValue();
    this.addAdjustment.AdjustmentDetails = value?.adjustmentDetails;
    this.addAdjustment.AdjustmentAmount = value.adjustmentAmount;
    this.addAdjustment.IsCredit = value?.isCredit === AdjustmentTypeEnum.CREDIT ? true : false;
    this.addAdjustment.SubscriptionId = value?.subscriptionId;
    this.addAdjustment.SubscriptionName = value?.SubscriptionName;
    this.addAdjustment.ProviderId = value?.providerId;
    this.addAdjustment.ProviderName = value?.providerName;
    this.addAdjustment.IsTaxable = value?.isTaxable;
    this.addAdjustment.StartDate = this.localTimeConvert(this.getDate(value.startDate));
    this.addAdjustment.EndDate = this.localTimeConvert(this.getDate(value.endDate));

    if (this.addAdjustment.SubscriptionName) {

    }
  }

  setFormValue() {
    this.frmAddAdjustments.setValue({
      adjustmentDetails: this.addAdjustment.AdjustmentDetails,
      adjustmentAmount: this.addAdjustment.AdjustmentAmount,
      isCredit: this.addAdjustment.IsCredit ? AdjustmentTypeEnum.CREDIT : AdjustmentTypeEnum.ADDITION_CHARGE,
      subscriptionId: null,
      subscriptionName: this.addAdjustment.SubscriptionName,
      providerId: null,
      providerName: this.addAdjustment.ProviderName,
      startDate: this.getNgbDateStruct(this.addAdjustment.StartDate),
      endDate: this.getNgbDateStruct(this.addAdjustment.EndDate),
      isTaxable: this.addAdjustment.IsTaxable,
    });

    this.getFormControl('providerId').reset();
    this.getFormControl('providerId').clearValidators();
    this.getFormControl('providerId').updateValueAndValidity();
  }


  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let msg = '';
    if (this.addAdjustment.ID === '0') {
      msg = this._translateService.instant('TRANSLATE.CUSTOMER_INVOICELINEDETAILS_TITLE_ADD');
    } else {
      msg = this._translateService.instant('TRANSLATE.CUSTOMER_INVOICELINEDETAILS_TITLE_EDIT');
    }
    msg += ' '+ this._translateService.instant('TRANSLATE.CUSTOMER_INVOICELINEDETAILS_TITLE_ADJESTMENT');
    this._pageInfo.updateTitle(msg, true);
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_REVENUE_AND_COST_SUMMARY', 'INVOICE_LIST_CAPTION_TEXT_INVOICES', 'ADD_ADJUSTMENT_HEADER_TEXT_ADD_ADJUSTMENT']);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  
} 
