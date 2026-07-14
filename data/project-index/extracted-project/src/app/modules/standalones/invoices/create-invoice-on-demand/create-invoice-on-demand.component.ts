import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDatepickerModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import moment from 'moment';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { InvoicesService } from 'src/app/services/invoices.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { C3DatePipe } from "../../../../shared/pipes/dateTimeFilter.pipe";
import { CommonNoRecordComponent } from '../../common-no-record/common-no-record.component';
import { QuoteService } from 'src/app/modules/partner/quotes/quotes.service';
import { DateUtility } from 'src/app/shared/utilities/utility';

@Component({
  selector: 'app-create-invoice-on-demand',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NgbTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    CurrencyPipe,
    NgSelectModule,
    C3DatePipe,
    CommonNoRecordComponent
],
  templateUrl: './create-invoice-on-demand.component.html',
  styleUrl: './create-invoice-on-demand.component.scss'
})
export class CreateInvoiceOnDemandComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  currentStateName: string = '';
  entityName: string;
  recordC3Id: string;
  billingPeriodId: string | number;
  selectedBillingPeriods: any;
  billingPeriods: any[];
  selectedBillingPeriod: any;
  billingStartDate: any;
  billingEndDate: any;
  saleTypes: any;
  currencyCodes: any;
  customerInvoiceOnDemandModel: any = {};
  currencyDetails: any;
  currencySymbol: any;
  currencyDecimalPlaces: any;
  currencyThousandSeperator: any;
  currencyDecimalSeperator: any;
  operationalEntities: any = [];
  invoiceId: null;
  selectedCustomerName: any;
  customerName: any;
  addressDetails:any = [];
  customerAddressDetails: any ={};
  isGridDataLoading: boolean;
  invoiceDetails: any;
  totalInvoiceAmount: any;
  lineItemsList: any[]=[];

  frmCustomerDetails: FormGroup =  new FormGroup({});
  frmInvoiceLineItems: FormGroup =  new FormGroup({});
  isEditOrAddLineItemEnabled: number = 0;
  isLineItemEditing: boolean = false;
  lineItemSelectedForEditing: any;
  isLineItemOfInvoiceHavingInvalidDates: boolean;
  isInvoiceDueDateValid: boolean;
  lineItemsJSONString: string; 
  selectedAddressId: any;
  IsCurrentAddress:any;

  permissions = {
    HasCreateInvoice: "Denied"
  };
  forms: { [key: string]: FormGroup } = {
    customerDetails: this.frmCustomerDetails,
    invoiceLineItems: this.frmInvoiceLineItems,
    // Add other forms here
  };
  partnerAddressDetails: any= [];
  private readonly dateUtility = new DateUtility();
  private readonly c3DatePipe: C3DatePipe;

  constructor(
    private _commonService: CommonService,
    public _router: Router,
    private _invoiceService: InvoicesService,
    private _appService: AppSettingsService,
    private _fb: FormBuilder,
    private _notifierService: NotifierService,
    private _translateService: TranslateService,
    private _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplate: DynamicTemplateService,
    private _pageInfo: PageInfoService,
    private _unsavedChangesService: UnsavedChangesService,
    private _quoteService: QuoteService,
    

  ) {
    super(_permissionService, _dynamicTemplate, _router, _appService);
    this.c3DatePipe = new C3DatePipe(this._appService);
    this.invoiceId = _router.getCurrentNavigation()?.extras?.state?.invoiceId || null;
    this.IsCurrentAddress = _router.getCurrentNavigation()?.extras?.state?.IsCurrentAddress || null;

    this.currentStateName = this._router.url;
    let entity = localStorage.getItem("entityName");

    if (entity !== undefined && entity !== null && entity !== '' && (_commonService.entityName === 'Partner' || _commonService.entityName === 'Reseller') && this.currentStateName.indexOf("partner") >= 0) {
      this.entityName = entity;
    } else {
      this.entityName = _commonService.entityName;
    }

    let recordId = localStorage.getItem("recordC3Id");
    if (recordId !== undefined && recordId !== null && recordId !== '' && (this._commonService.entityName === 'Partner' || _commonService.entityName === 'Reseller') && this.currentStateName.indexOf("partner") >= 0) {
      this.recordC3Id = recordId;
    } else {
      this.recordC3Id = _commonService.recordId;
    }

    if (localStorage.getItem("billingPeriodIdForCreateInvoice") !== undefined && localStorage.getItem("billingPeriodIdForCreateInvoice") !== null && localStorage.getItem("billingPeriodIdForCreateInvoice") !== '') {
      this.billingPeriodId = localStorage.getItem("billingPeriodIdForCreateInvoice");
    }

    if (localStorage.getItem("SelectBillingPeriods") !== undefined && localStorage.getItem("SelectBillingPeriods") !== null && localStorage.getItem("SelectBillingPeriods") !== '') {
      this.selectedBillingPeriods = JSON.parse(localStorage.getItem("SelectBillingPeriods"));
      if (this.selectedBillingPeriods.length == 1) {
        this.billingPeriodId = this.selectedBillingPeriods[0];
      }
    }
    this.createFormGroup();
    //this.getPartnerBillFromDetails();
    Object.values(this.forms).forEach(form => this.trackFormChanges(form));
  }

  ngOnInit(): void {
    this.getPermissions();
    if (this.invoiceId !== undefined && this.invoiceId !== null && this.invoiceId !== '') {
      this.getOperationalEntityDetails();
      let getInvoiceDetailsPromise = this.getInvoiceDetails();
      // getInvoiceDetailsPromise.then(() => {
      //   this.getBillingPeriods();
      // });
    }
    else {
      this.getCurrencyCodes();
      this.getApplicationData();

      //this.getBillingPeriods();
      this.getOperationalEntityDetails();
    }
    this.getBillingPeriods();
    this.getSaleTypes();
  }
  private trackFormChanges(form: FormGroup) {
    this._subscription = form.valueChanges.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this._unsavedChangesService.setUnsavedChanges(form.dirty);
    });
  }

  getPermissions() {
    this.permissions.HasCreateInvoice = this._permissionService.hasPermission(this.cloudHubConstants.CREATE_INVOICE);
  }

  backToInvoices() {
    let callback = ()=>{
      this._router.navigate(['partner/invoices']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.frmCustomerDetails.dirty || this.frmInvoiceLineItems.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
  


  getApplicationData() {
   const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customerInvoiceOnDemandModel.CurrencyCode = response.Data?.CurrencyCode
      this.currencyCodeSelected();
    });
    this._subscriptionArray.push(subscription);
  }

  getBillingPeriods() {
    this.billingPeriods = [];
    const subscription = this._commonService.getBillingPeriods().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.billingPeriods = response.Data;
      if (this.billingPeriods.length > 0) {
        this.billingPeriodId = parseInt(this.billingPeriodId.toString());
        this.selectedBillingPeriod = _.find(this.billingPeriods, { BillingPeriodId: this.billingPeriodId });
        if (this.selectedBillingPeriod !== undefined && this.selectedBillingPeriod !== null && this.selectedBillingPeriod !== '') {
          this.billingStartDate = this.selectedBillingPeriod.BillingStartDate;
          this.billingEndDate = this.selectedBillingPeriod.BillingEndDate;
        }
      }
    });
    this._subscriptionArray.push(subscription);
  }

  getSaleTypes() {
    const subscription = this._commonService.getSaleTypes().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.saleTypes = Data;
    });
    this._subscriptionArray.push(subscription);
  }

  getCurrencyCodes() {
    const subscription = this._commonService.getSupportedCurrencies().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.currencyCodes = response.Data;
    });
    this._subscriptionArray.push(subscription);
  }


  currencyCodeSelected() {
    const subscription = this._commonService.getCurrencySymbolByCode(this.customerInvoiceOnDemandModel.CurrencyCode).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.currencyDetails = response.Data;
      if (this.currencyDetails !== null) {
        this.currencySymbol = this.currencyDetails.CurrencySymbol;
        this.currencyDecimalPlaces = this.currencyDetails.CurrencyDecimalPlaces;
        this.currencyThousandSeperator = this.currencyDetails.CurrencyThousandSeperator;
        this.currencyDecimalSeperator = this.currencyDetails.CurrencyDecimalSeperator;
      }
    });
    this._subscriptionArray.push(subscription);
  }

  getOperationalEntityDetails() {

    const subscription = this._invoiceService.getInvoicesOperationalEntities(this.entityName, this.recordC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.operationalEntities = response.Data;
      if (this.invoiceId === null) {
        if (this.operationalEntities.length === 1) {
          this.customerInvoiceOnDemandModel.EntityName = this.operationalEntities[0].EntityName;
          this.customerInvoiceOnDemandModel.RecordId = this.operationalEntities[0].C3Id;
          this.selectedCustomerName = this.operationalEntities[0].FriendlyRecordName;
          this.customerName = this.operationalEntities[0].RecordName;
          this.getCustomerAddressDetails(this.customerInvoiceOnDemandModel.EntityName, this.customerInvoiceOnDemandModel.RecordId);
          this.getPartnerBillFromDetails(this.customerInvoiceOnDemandModel?.EntityName == 'Reseller' ? this._commonService.entityName : this.customerInvoiceOnDemandModel?.EntityName, this.customerInvoiceOnDemandModel.RecordId);
        }
        else {
          let entitySelectedByDefault = _.find(this.operationalEntities, { C3Id: this.recordC3Id });
          this.customerInvoiceOnDemandModel.EntityName = entitySelectedByDefault.EntityName;
          this.customerInvoiceOnDemandModel.RecordId = entitySelectedByDefault.C3Id;
          this.selectedCustomerName = entitySelectedByDefault.FriendlyRecordName;
          this.customerName = entitySelectedByDefault.RecordName;
          this.getCustomerAddressDetails(this.customerInvoiceOnDemandModel.EntityName, this.customerInvoiceOnDemandModel.RecordId);
          this.getPartnerBillFromDetails(this.customerInvoiceOnDemandModel?.EntityName == 'Reseller' ? this._commonService.entityName : this.customerInvoiceOnDemandModel?.EntityName, this.customerInvoiceOnDemandModel.RecordId);
        }


      }
    });
    this._subscriptionArray.push(subscription);
  }


  getCustomerAddressDetails(entityName: any, recordId: any) {
    const subscription = this._invoiceService.getInvoicesAddressDetails(entityName, recordId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.addressDetails = response.Data;
      if (this.addressDetails !== null && this.addressDetails.length > 0) {
        this.customerAddressDetails = this.addressDetails[0];
        let valuesForForm = {
          customerName: this.customerName || null,
          selectedCustomerName: (this.invoiceId === null ? this.selectedCustomerName : this.customerInvoiceOnDemandModel.EntityName) || null,
          addressLine1: this.customerAddressDetails.AddressLine1 || null,
          country: this.customerAddressDetails.Country || null,
          city: this.customerAddressDetails.City || null,
          state: this.customerAddressDetails.State || null,
          zip: this.customerAddressDetails.Zip || null,
          invoiceNumber: this.customerInvoiceOnDemandModel.InvoiceNumber || null,
          invoiceDate: this.customerInvoiceOnDemandModel.InvoiceDate || null,
          invoiceDueDate: this.customerInvoiceOnDemandModel.InvoiceDueDate || null,
          currencyCode: this.customerInvoiceOnDemandModel.CurrencyCode || null,
          partnerAddress:this.selectedAddressId
        }
        this.setFrmCustomerDetailsValues(valuesForForm)
      }
    });
    this._subscriptionArray.push(subscription);
  }


  operationalEntitySelected() {
    this.selectedCustomerName = this.getFormControlValue(this.frmCustomerDetails, 'selectedCustomerName');
    let selectedEntity = _.find(this.operationalEntities, { FriendlyRecordName: this.selectedCustomerName });
    this.customerInvoiceOnDemandModel.EntityName = selectedEntity.EntityName;
    this.customerInvoiceOnDemandModel.RecordId = selectedEntity.C3Id;
    this.customerName = selectedEntity.RecordName;
    this.getCustomerAddressDetails(this.customerInvoiceOnDemandModel.EntityName, this.customerInvoiceOnDemandModel.RecordId);
  }

  getInvoiceDetails() {
    this.isGridDataLoading = true;
    const subscription = this._invoiceService.getOnDemandInvoice(this.invoiceId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.invoiceDetails = response.Data;
      if (this.invoiceDetails.Invoice !== null) {
        this.customerInvoiceOnDemandModel.InvoiceNumber = this.invoiceDetails.Invoice.InvoiceNumber;
        this.customerInvoiceOnDemandModel.InvoiceDate = this.localTimeConvert(this.invoiceDetails.Invoice.InvoiceDate);
        this.customerInvoiceOnDemandModel.InvoiceDueDate = this.localTimeConvert(this.invoiceDetails.Invoice.InvoiceDueDate);
        this.customerInvoiceOnDemandModel.InvoiceAmount = this.invoiceDetails.Invoice.InvoiceAmount;
        this.customerInvoiceOnDemandModel.InvoiceId = this.invoiceDetails.Invoice.InvoiceId;
        this.customerInvoiceOnDemandModel.BillingPeriodId = this.invoiceDetails.Invoice.BillingPeriodId;
        this.customerInvoiceOnDemandModel.EntityName = this.invoiceDetails.Invoice.EntityName;
        this.customerInvoiceOnDemandModel.RecordId = this.invoiceDetails.Invoice.C3Id;
        this.customerInvoiceOnDemandModel.CurrencyCode = this.invoiceDetails.Invoice.CurrencyCode;
        this.currencySymbol = this.invoiceDetails.Invoice.CurrencySymbol;
        this.currencyDecimalPlaces = this.invoiceDetails.Invoice.CurrencyDecimalPlaces;
        this.currencyThousandSeperator = this.invoiceDetails.Invoice.CurrencyThousandSeperator;
        this.currencyDecimalSeperator = this.invoiceDetails.Invoice.CurrencyDecimalSeperator;
        this.totalInvoiceAmount = this.invoiceDetails.Invoice.InvoiceAmount;
        this.customerName = this.invoiceDetails.Invoice.RecordName;
        this.invoiceId = this.invoiceDetails.Invoice.InvoiceId;
        this.billingPeriodId = this.invoiceDetails.Invoice.BillingPeriodId;
        this.customerAddressDetails.AddressLine1 = this.invoiceDetails.Invoice?.AddressLine1 || null;
        this.customerAddressDetails.AddressLine2 = this.invoiceDetails.Invoice?.AddressLine2 || null;
        this.customerAddressDetails.City = this.invoiceDetails.Invoice?.City;
        this.customerAddressDetails.State = this.invoiceDetails.Invoice?.State;
        this.customerAddressDetails.Zip = this.invoiceDetails.Invoice?.Zip;
        this.customerAddressDetails.Country = this.invoiceDetails.Invoice?.Country;
        this.selectedAddressId = this.invoiceDetails.Invoice?.BillFromAddressId;
        this.getPartnerBillFromDetails(this.invoiceDetails.Invoice.EntityName, this.invoiceDetails.Invoice.C3Id);
      }

      if (this.invoiceDetails.InvoiceLineItems !== null) {
        this.lineItemsList = [];
        _.each(this.invoiceDetails.InvoiceLineItems, (lineItem) => {
          let lineItemToBeAdded: any = {};
          lineItemToBeAdded.Id = lineItem.InvoiceLineItemId;
          lineItemToBeAdded.ItemName = lineItem.ProductName;
          lineItemToBeAdded.Description = lineItem.InvoiceLineDetail;
          lineItemToBeAdded.Quantity = lineItem.Quantity;
          lineItemToBeAdded.UnitPrice = lineItem.UnitPrice;
          lineItemToBeAdded.LineAmount = lineItem.InvoiceLineAmount;
          lineItemToBeAdded.SalesTax = null;
          lineItemToBeAdded.IsTaxable = lineItem.IsTaxable;
          lineItemToBeAdded.SaleType = lineItem.SaleTypeId;
          lineItemToBeAdded.SaleTypeName = lineItem.SaleTypeName;
          lineItemToBeAdded.StartDate = this.localTimeConvert(lineItem.ChargeStartDate);
          lineItemToBeAdded.EndDate = this.localTimeConvert(lineItem.ChargeEndDate);
          lineItemToBeAdded.isEditing = false;

          this.lineItemsList.push(lineItemToBeAdded);
          this.isLineItemEditing = false;
        });
      }

      /* Set values to forms */
      /*BEGIN fmrCustomerDetails */
      let valuesForForm = {
        customerName: this.customerName || null,
        selectedCustomerName: (this.invoiceId === null ? this.selectedCustomerName : this.customerInvoiceOnDemandModel.EntityName) || null,
        addressLine1: this.customerAddressDetails.AddressLine1 || null,
        country: this.customerAddressDetails.Country || null,
        city: this.customerAddressDetails.City || null,
        state: this.customerAddressDetails.State || null,
        zip: this.customerAddressDetails.Zip || null,
        invoiceNumber: this.customerInvoiceOnDemandModel.InvoiceNumber || null,
        invoiceDate: this.getNgbDateStruct(this.customerInvoiceOnDemandModel.InvoiceDate) || null,
        invoiceDueDate: this.getNgbDateStruct(this.customerInvoiceOnDemandModel.InvoiceDueDate) || null,
        currencyCode: this.customerInvoiceOnDemandModel.CurrencyCode || null,
        partnerAddress: this.selectedAddressId
      };
      this.setFrmCustomerDetailsValues(valuesForForm);
      /*END fmrCustomerDetails */

      /* BEGIN frmInvoiceLineItems */
      this.setFrmInvoiceLineItemsValues(this.lineItemsList);
      /* END frmInvoiceLineItems */

      //this.lineItemDetailsDataSource.reload();
      this.isGridDataLoading = false;
    });
    this._subscriptionArray.push(subscription);
  }

  localTimeConvert(date) {
    return moment(date).local().toDate();
  }

  createFormGroup() {
    this.frmCustomerDetails = this._fb.group({
      customerName: [{ value: '', disabled: true }],
      selectedCustomerName: [, Validators.required],
      addressLine1: [{ value: '', disabled: true }],
      country: [{ value: '', disabled: true }],
      city: [{ value: '', disabled: true }],
      state: [{ value: '', disabled: true }],
      zip: [{ value: '', disabled: true }],
      invoiceNumber: ['', [Validators.required]],
      invoiceDate: [],
      invoiceDueDate: [],
      currencyCode: ['', [Validators.required]],
      partnerAddress: [],
    });

    this.frmInvoiceLineItems = this._fb.group({
      lineItemArray: this._fb.array([])
    });
  }


  addLineItemsControls() {
    const lineItem = this._fb.group({
      id: [0],
      itemName: [, [Validators.required]],
      description: [, [Validators.required]],
      quantity: [, [Validators.required]],
      unitPrice: [, [Validators.required]],
      lineAmount: [],
      isTaxable: [false],
      saleType: [null,],
      saleTypeName: [''],
      startDate: [, [Validators.required]],
      endDate: [, [Validators.required]],
      isEditing: [true],
    });

    this.lineItemArray.push(lineItem);
  }

  addLineItem() {
    this.isEditOrAddLineItemEnabled = this.isEditOrAddLineItemEnabled + 1;
    this.addLineItemsControls();
    this.isLineItemEditing = true;
  }

  get lineItemArray() {
    return this.frmInvoiceLineItems.get('lineItemArray') as FormArray
  }

  setFrmCustomerDetailsValues(val: any) {
    this.frmCustomerDetails.setValue(val);
    this.frmCustomerDetails.updateValueAndValidity();
  }

  setFrmInvoiceLineItemsValues(lineItems: any[]) {
    if (lineItems.length > 0) {
      lineItems.forEach((item: any) => {
        const lineItem = this._fb.group({
          id: [item.Id],
          itemName: [item.ItemName, [Validators.required]],
          description: [item.Description, [Validators.required]],
          quantity: [item.Quantity, [Validators.required]],
          unitPrice: [item.UnitPrice, [Validators.required]],
          lineAmount: [item.LineAmount],
          isTaxable: [item.IsTaxable],
          saleType: [item.SaleType],
          saleTypeName: [item.SaleTypeName],
          startDate: [this.getNgbDateStruct(item.StartDate), [Validators.required]],
          endDate: [this.getNgbDateStruct(item.EndDate), [Validators.required]],
          isEditing: [item.isEditing],

        });
        this.lineItemArray.push(lineItem);
      });
    } else {
      this.lineItemArray.setParent(this._fb.group({}));
    }
  }

  deleteLineItem(row: AbstractControl, index: any) {
    let msg = this._translateService.instant('TRANSLATE.CUSTOMER_INVOICE_ON_DEMAND_DELETE_LINEITEM_CONFIRMATION_MESSAGE')
    let okText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
    this._notifierService.confirm({ title: msg, icon: 'info', confirmButtonText: okText }).then((result: { isConfirmed: any, isDismissed: any }) => {
      if (result.isConfirmed) {
        this.totalInvoiceAmount = this.totalInvoiceAmount - (this.getFormControlValue(row, 'unitPrice') * this.getFormControlValue(row, 'quantity'));
        this.customerInvoiceOnDemandModel.InvoiceAmount = this.totalInvoiceAmount;
        this.lineItemArray.removeAt(index);
      }
    });
  }

  editLineItem(row: AbstractControl, index: any) {
    this.getFormControl(row, 'isEditing').setValue(true);
    this.isLineItemEditing = true;
    row.updateValueAndValidity();
    this.lineItemSelectedForEditing = _.cloneDeep(row.getRawValue());
  }

  cancelChanges(row: AbstractControl, index: any) {
    if (this.isEditOrAddLineItemEnabled !== 0) {
      this.isEditOrAddLineItemEnabled = this.isEditOrAddLineItemEnabled - 1;
    }

    let id = this.getFormControlValue(row, 'id')
    // if (id === 0) {
    //   this.lineItemsList = _.filter(this.lineItemsList, (item) => {
    //     return id !== item.Id;
    //   });
    // }
    if (id === 0) {
      this.lineItemArray.removeAt(index);
    }
    this.resetRow(row, index);

    //this.ResetRow(row, rowForm);
    //vm.lineItemDetailsDataSource.reload();
  }

  resetRow(row: AbstractControl, index: any) {
    if (this.isEditOrAddLineItemEnabled !== 0) {
      this.isEditOrAddLineItemEnabled = this.isEditOrAddLineItemEnabled - 1;
    }
    this.isLineItemEditing = false;
    row.setValue(this.lineItemSelectedForEditing);
  }

  saveLineItem(row: AbstractControl, index: any) {
    row.markAllAsTouched();
    if (row.valid) {
      if (this.isEditOrAddLineItemEnabled !== 0) {
        this.isEditOrAddLineItemEnabled = this.isEditOrAddLineItemEnabled - 1;
      }

      //Here we will not save the lineItem until the user clicks Save button.
      //If the user adds a lineItem, push it into the list with an index that is created in UI
      //Once the Invoice is saved, the lineItem will have the Internal Id of the Database as index
      let formValue = this.lineItemArray.getRawValue();
      let newId = null;
      let maxElement = null;
      if (formValue?.length > 0) {
        maxElement = _.maxBy(formValue,'id');
        newId = maxElement.id + 1;
      } else {
        newId = 1
      }

      this.getFormControl(row, 'id').setValue(newId);
      let selectedSaleType = _.find(this.saleTypes, { ID: this.getFormControlValue(row, 'saleType') ? parseInt(this.getFormControlValue(row, 'saleType')) : null });
      if (selectedSaleType !== undefined && selectedSaleType !== null && selectedSaleType !== '') {
        //row.SaleTypeName = selectedSaleType.Name;
        this.getFormControl(row, 'saleTypeName').setValue(selectedSaleType.Name)
      } else {
        this.getFormControl(row, 'saleTypeName').setValue(null)
      }
      this.totalInvoiceAmount = 0;
      _.each(formValue, (lineItem) => {
        this.totalInvoiceAmount = this.totalInvoiceAmount + (lineItem.unitPrice * lineItem.quantity);
      });


      this.getFormControl(row, 'lineAmount')?.setValue(this.getFormControlValue(row, 'unitPrice') * this.getFormControlValue(row, 'quantity'));
      this.getFormControl(row, 'isEditing').setValue(false);
      this.isLineItemEditing = false;

      row.updateValueAndValidity();

      this.customerInvoiceOnDemandModel.InvoiceAmount = this.totalInvoiceAmount;
      //vm.lineItemDetailsDataSource.reload();
    }
  }


  createInvoice() {
    this.isInvoiceDueDateValid = true;
    this.isLineItemOfInvoiceHavingInvalidDates = false;
    let invoiceDate = this.getDate(this.getFormControlValue(this.frmCustomerDetails, 'invoiceDate'));
    let invoiceDueDate = this.getDate(this.getFormControlValue(this.frmCustomerDetails, 'invoiceDueDate'));
    if (invoiceDate > invoiceDueDate) {
      this.isInvoiceDueDateValid = false;
    }

    let formValue = this.lineItemArray.getRawValue();

    _.each(formValue, (lineItem) => {
      if (this.getDate(lineItem?.startDate) > this.getDate(lineItem?.endDate)) {
        this.isLineItemOfInvoiceHavingInvalidDates = true;
      }
    });

    if (!this.isInvoiceDueDateValid) {
      let msg = this._translateService.instant('TRANSLATE.CUSTOMER_INVOICE_ON_DEMAND_DUE_DATE_ERROR');
      this._toastService.error(msg)
      return;

    }

    if (this.isLineItemOfInvoiceHavingInvalidDates) {
      let msg = this._translateService.instant('TRANSLATE.CUSTOMER_INVOICE_ON_DEMAND_CHARGE_END_DATE_ERROR');
      this._toastService.error(msg);
      return;

    }

    if (!(formValue.length > 0)) {
      let msg = this._translateService.instant('TRANSLATE.CUSTOMER_INVOICE_ON_DEMAND_LINEITEMS_COUNT_ERROR');
      this._toastService.error(msg);
      return;

    }

    if (this.isInvoiceDueDateValid && !this.isLineItemOfInvoiceHavingInvalidDates && (formValue.length > 0)) {
      this.saveInvoice();
    }
  }

  saveInvoice() {
    this.frmCustomerDetails.markAllAsTouched();
    this.frmInvoiceLineItems.markAllAsTouched();
    if (this.frmCustomerDetails.valid && this.frmInvoiceLineItems.valid) {
      this.saveValuesFromCustomerForm();
      this.saveValuesFromLineItemForm();

      this.lineItemsJSONString = this.createLineItemsJSONObject(this.lineItemsList);
      this.customerInvoiceOnDemandModel.LineItems = this.lineItemsJSONString;
      this.customerInvoiceOnDemandModel.InvoiceId = this.invoiceId;
      this.customerInvoiceOnDemandModel.BillingPeriodId = this.billingPeriodId;
      this.customerInvoiceOnDemandModel.InvoiceDate = moment(this.customerInvoiceOnDemandModel.InvoiceDate).format('LL');
      this.customerInvoiceOnDemandModel.InvoiceDueDate = moment(this.customerInvoiceOnDemandModel.InvoiceDueDate).format('LL');
      this.customerInvoiceOnDemandModel.RecordName = this.customerName;
      this.customerInvoiceOnDemandModel.BillFromAddressId = this.selectedAddressId;
      const subscription = this._invoiceService.createInvoice(this.customerInvoiceOnDemandModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        localStorage.setItem("invoiceNumber", this.customerInvoiceOnDemandModel.InvoiceNumber);
        this.frmCustomerDetails.reset();

        if (this.invoiceId !== undefined && this.invoiceId !== null && this.invoiceId !== '' && this.currentStateName.includes('partner/createinvoice')) {
          this._router.navigate(['partner/invoice'], { state: { invoiceId: this.invoiceId } });
        }
        else {
          this._router.navigate(['partner/invoices']);
        }
      });
      this._subscriptionArray.push(subscription);
    }
  }

  createLineItemsJSONObject(lineItems) {
    let lineItemsToBeSaved = lineItems;
    _.each(lineItemsToBeSaved, (lineItem) => {
      lineItem.StartDate = moment(lineItem.StartDate).format('LL');
      lineItem.EndDate = moment(lineItem.EndDate).format('LL');
    });
    let generatedJSONString = JSON.stringify(lineItemsToBeSaved);
    return generatedJSONString;
  }

  cancelInvoiceCreation() {
    let msg = this._translateService.instant('TRANSLATE.CUSTOMER_INVOICE_ON_DEMAND_CANCEL_SAVING_CHANGES_POPUP_TEXT');
    let okText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
    this._notifierService.confirm({ title: msg, confirmButtonText: okText}).then((result: { isConfirmed: any, isDismissed: any }) => {
      if (result.isConfirmed) {
        this.customerInvoiceOnDemandModel = {};
        this.lineItemsList = [];
        this.frmCustomerDetails.reset();
        if (this.invoiceId !== undefined && this.invoiceId !== null && this.invoiceId !== '' && this.currentStateName.includes('partner/createinvoice')) {
          this._router.navigate(['partner/invoice'], { state: { invoiceId: this.invoiceId } });
        }
        else {
          this._router.navigate(['partner/invoices']);
        }
      }
    });
  }


  saveValuesFromCustomerForm() {
    let frmCustomerDetails = this.frmCustomerDetails.getRawValue();
    this.customerName = frmCustomerDetails?.customerName;
    if (this.invoiceId === null) {
      this.selectedCustomerName = frmCustomerDetails?.selectedCustomerName;
    }
    else {
      this.customerInvoiceOnDemandModel.EntityName = frmCustomerDetails?.selectedCustomerName;
    }

    this.customerAddressDetails.AddressLine1 = frmCustomerDetails?.addressLine1;
    this.customerAddressDetails.Country = frmCustomerDetails?.country;
    this.customerAddressDetails.City = frmCustomerDetails?.city;
    this.customerAddressDetails.State = frmCustomerDetails?.state;
    this.customerAddressDetails.Zip = frmCustomerDetails?.zip;

    this.customerInvoiceOnDemandModel.InvoiceNumber = frmCustomerDetails?.invoiceNumber;
    this.customerInvoiceOnDemandModel.InvoiceDate = this.getDate(frmCustomerDetails?.invoiceDate);
    this.customerInvoiceOnDemandModel.InvoiceDueDate = this.getDate(frmCustomerDetails?.invoiceDueDate);
    this.customerInvoiceOnDemandModel.CurrencyCode = frmCustomerDetails?.currencyCode;
  }

  saveValuesFromLineItemForm() {
    let frmInvoiceLineItems = this.lineItemArray.getRawValue();
    this.lineItemsList = [];
    frmInvoiceLineItems.forEach((lineItem: any) => {
      let lineItemToBeAdded: any = {};
      lineItemToBeAdded.Id = lineItem.id;
      lineItemToBeAdded.ItemName = lineItem.itemName;
      lineItemToBeAdded.Description = lineItem.description;
      lineItemToBeAdded.Quantity = lineItem.quantity;
      lineItemToBeAdded.UnitPrice = lineItem.unitPrice;
      lineItemToBeAdded.LineAmount = lineItem.lineAmount;
      lineItemToBeAdded.SalesTax = null;
      lineItemToBeAdded.IsTaxable = lineItem.isTaxable;
      lineItemToBeAdded.SaleType = lineItem.saleType;
      lineItemToBeAdded.SaleTypeName = lineItem.saleTypeName;
      lineItemToBeAdded.StartDate = this.localTimeConvert(this.getDate(lineItem.startDate));
      lineItemToBeAdded.EndDate = this.localTimeConvert((this.getDate(lineItem.endDate)));
      lineItemToBeAdded.isEditing = lineItem.isEditing;

      this.lineItemsList.push(lineItemToBeAdded);
    })
  }

  getDate(date:any) {
    //let date = this.getFormControlValue(form, controlName);
    if (date) {
      return new Date(date.year, date.month - 1, date.day);
    }
    return null;
  }
  convertToDateFormat(date: any) {
    if (!date) {
      return ''
    }
    const dateObj = new Date(date.year, date.month - 1, date.day);
    const isoDate = this.dateUtility.formatDateToISO(dateObj);
    return this.c3DatePipe.transform(isoDate);
  }
 
  getNgbDateStruct(date:any){
    if(date){
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      }
    }
    return null;
  }

  getFormControlValue(form: AbstractControl, controlName: string) {
    return form?.get(controlName)?.value;
  }

  getFormControl(form: AbstractControl, controlName: string) {
    return form?.get(controlName);
  }

   getPartnerBillFromDetails(entityName:any,C3Id:any) {
    const subscription = this._quoteService.getPartnerAddress(entityName, C3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this.partnerAddressDetails = response.Data;
        let defaultAddress = this.partnerAddressDetails.find(address => address.IsDefault === true);
        let customerAssignedAddress = this.partnerAddressDetails.find(address => address.BillFromAddressId === true);
        if(this.invoiceId){
          let exist = this.partnerAddressDetails.find(e => e.AddressId === this.selectedAddressId);
          if(exist != undefined){
            this.frmCustomerDetails.get('partnerAddress')?.setValue(this.selectedAddressId)
          }
          else{
              this.partnerAddressDetails.push(this.IsCurrentAddress);
               this.selectedAddressId = defaultAddress.AddressId;
          }
        }
        else if(customerAssignedAddress){
          this.selectedAddressId = customerAssignedAddress.AddressId;
        }
        else{
          if (defaultAddress) {
            this.selectedAddressId = defaultAddress.AddressId;
          }
        }
      }
    })
   }

   onBillFromAddressIdChange(){
    this.selectedAddressId = this.frmCustomerDetails.get('partnerAddress').value;
   }

  getFormattedAddress(address: any): string {
    if (!address) return '';
    return [
      address.Line1,
      address.Line2,
      address.City,
      address.State,
      address.Zip,
      address.Country
    ]
    .filter(part => !!part)
    .join(', ');
  }
  


  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._pageInfo.updateTitle(this._translateService.instant('TRANSLATE.CREATE_INVOICE_ON_DEMAND_HEADER_TEXT'),true);
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'MENUS_PARTNER_REVENUE_AND_COST_SUMMARY', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_REVENUE_AND_COST_SUMMARY', 'LABLE_TEXT_SLAB', 'CREATE_INVOICE_ON_DEMAND_HEADER_TEXT']);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
