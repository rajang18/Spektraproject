import { AfterViewInit,Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil} from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { BusinessCommentsService } from '../../../customers/services/comments.service';
import moment from 'moment';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-record-advance-payment',
  templateUrl: './record-advance-payment.component.html',
  styleUrl: './record-advance-payment.component.scss'
})
export class RecordAdvancePaymentComponent extends C3BaseComponent implements OnInit,OnDestroy, AfterViewInit {

  @ViewChild('addTenantModal') addTenantModal: TemplateRef<any>;

  formGroup: FormGroup;
  customers: any = [];
  selectedCustomer = null;
  currentC3CustomerId: any = null;
  currentEntity: any;
  partnerSupportedCurrencies: any = [];
  selectedCurrencyCode: any = null;
  currency: any = null;
  advancePaymentDetails: any = [];
  paidAmount: any = null;
  remarks: any = null;
  paymentDate: any = null;
  isAdvancePaymentDetailsValid: any = null; 

  constructor(
    private _translateService: TranslateService,
    private _toastService: ToastService,
    public _permissionService: PermissionService,
    public _router: Router,
    private _commonService: CommonService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _fb: FormBuilder,
    private businessCommentsService: BusinessCommentsService,
    private activemodal: NgbActiveModal,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService, 
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.formGroup = this._fb.group({
      selectedCustomer: ['', Validators.required],
      selectedCurrencyCode: ['', Validators.required],
      paidAmount: ['', Validators.required],
      remarks: ['', Validators.required],
      paymentDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.getCustomers();
    this.getPartnerSupportedCurrencies();
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.formGroup.markAsUntouched();
  }


  getCustomers() {
    //hscheck
    this.customers = [];
    const subscription = this.businessCommentsService.getActiveCustomers(this._commonService.entityName, this._commonService.recordId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customers = response.Data;
    })
    this._subscriptionArray.push(subscription);
  }

  onCustomerChange() {
    this.selectedCustomer = this.formGroup.get('selectedCustomer')?.value;
    if (this.selectedCustomer !== null) {
      this.currentC3CustomerId = this.selectedCustomer.C3Id;
      this.currentEntity = this.selectedCustomer.EntityName;
    }
  }

  /*Getting partner supported currencies*/
  getPartnerSupportedCurrencies() {
    //hscheck
    const subscription = this._commonService.getSupportedCurrencies().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.partnerSupportedCurrencies = response.Data;
    });
    this._subscriptionArray.push(subscription);

  }

  onCurrencyChange() {
    this.selectedCurrencyCode = this.formGroup.get('selectedCurrencyCode')?.value;
    if (this.selectedCurrencyCode !== null) {
      this.currency = this.selectedCurrencyCode.CurrencyCode;
    }
  }

  submitChanges() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      let { selectedCustomer, selectedCurrencyCode, paidAmount, remarks, paymentDate } = this.formGroup.value;
      let paydate = paymentDate ? { year: paymentDate.year, month: paymentDate.month - 1, day: paymentDate.day, } : null;
      this.paidAmount = paidAmount;
      this.remarks = remarks;
      this.paymentDate = paydate ? moment(paydate).startOf('day').format('YYYY, MM, DD HH:mm') : null;
      if (this.currentC3CustomerId != null) {
        this.advancePaymentDetails.customerC3Id = this.currentC3CustomerId;
        this.advancePaymentDetails.paidAmount = this.paidAmount;
        this.advancePaymentDetails.remarks = this.remarks;
        this.advancePaymentDetails.paymentDate = this.paymentDate;
        this.advancePaymentDetails.currentEntity = this.currentEntity;
        this.advancePaymentDetails.currency = this.currency;

        if (this.advancePaymentDetails !== null || this.advancePaymentDetails !== '' || this.advancePaymentDetails !== undefined) {
          this.isAdvancePaymentDetailsValid = true;
        }
        if (this.isAdvancePaymentDetailsValid) {
          let result = { paymentDetail: this.advancePaymentDetails };
          this.advancePaymentDetails = [];
          this.activemodal.close(result);
        }
      }
      else {
        const message = this._translateService.instant(
          'TRANSLATE.RECORD_ADVANCE_PAYMENT_ERROR_MESSAGE_CUSTOMER_REQIRED'
        );
        this._toastService.error(message)
      }
    }
  }


  cancel() {
    this.formGroup.reset();
    this.formGroup = null;
    this.advancePaymentDetails = [];
    this.activemodal.dismiss();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this._unsavedChangesService.setUnsavedChanges(false);
  }

}

