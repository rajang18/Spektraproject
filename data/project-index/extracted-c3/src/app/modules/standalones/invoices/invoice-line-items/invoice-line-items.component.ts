import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import _, {  } from 'lodash';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { InvoicesService } from 'src/app/services/invoices.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { InvoiceDetailDirective } from 'src/app/shared/directives/invoice-detail.directive';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { UpdateInvoicePropertyComponent } from '../../pop-ups/update-invoice-property/update-invoice-property.component';
import moment from 'moment';
import { ResendInvoiceComponent } from '../../pop-ups/resend-invoice/resend-invoice.component';
import { FileService } from 'src/app/services/file.service';
import { Subject, takeUntil} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3DatePipe } from "../../../../shared/pipes/dateTimeFilter.pipe";
import { DateUtility} from 'src/app/shared/utilities/utility';
import { QuoteService } from 'src/app/modules/partner/quotes/quotes.service';
import { PartnerAddressDetailsPopupComponent } from '../../partner-address-details-popup/partner-address-details-popup.component';

@Component({
  selector: 'app-invoice-line-items',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    CurrencyPipe,
    InvoiceDetailDirective,
    ReactiveFormsModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    C3DatePipe,
    NgbTooltipModule,
    
],
  templateUrl: './invoice-line-items.component.html',
  styleUrl: './invoice-line-items.component.scss'
})
export class InvoiceLineItemsComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {
@ViewChild('sendInvoiceButton') sendInvoiceButton?: ElementRef<HTMLElement>;
@ViewChild('processAutoPaymentButton') processAutoPaymentButton?: ElementRef<HTMLElement>;
  permissions: any = {
    HasExportInvoicePDF: "Denied",
    HasExportInvoiceCSV: "Denied",
    HasAddAdjustment: "Denied",
    HasInitiatePayment: "Denied",
    HasUpdateDueDate: "Denied",
    HasUpdatePONumber: "Denied",
    HasUpdateSubscriptionPONumber: "Denied",
    HasEditInvoice: "Denied"
  };
  invoiceId: any;
  currentStateName: string;
  isGridDataLoading: boolean;
  HasInvoicePayment: any;
  paymentType: any;
  accountNumber: any;
  allowTransaction: boolean;
  isBankAccountVerified: boolean;
  lineItemDetails: any[] = [];
  invoiceSubTaxes: any[] = [];
  invoiceLineItemTaxBreakUps: any[] = [];
  lineItemTypes: any[] = [];
  invoiceDetails: any = [];
  canShowUnPaidDuesInPdf: any;
  totalPostTaxAmount: any = 0.00;
  totalDiscountAmount: any = 0.00;
  customerName: any;
  recordName: any;
  invoiceDate: any;
  invoiceNumber: any;
  formattedAddress: any;
  billingStartDate: any;
  billingMonth: any;
  billingYear: any;
  billingPeriodId: any;
  billingEndDate: any;
  usageBillingStartDate: any;
  usageBillingEndDate: any;
  addressLine1: any;
  addressLine2: any;
  city: any;
  state: any;
  zip: any;
  taxPercentage: any;
  taxName: any;
  partnerCompanyName: any;
  partnerAddressLine1: any;
  partnerAddressLine2: any;
  partnerCity: any;
  partnerState: any;
  partnerZip: any;
  partnerCountry: any;
  partnerFormattedAddress: any;
  CouponCode: null;
  CouponDescription: null;
  CouponDetailId: null;
  businessNumberKey: any;
  businessNumber: any;
  invoiceDueDate: any;
  invoiceFooterLine: any;
  IsAutopay: any;
  ShipToAddress1: any;
  ShipToAddress2: any;
  ShipToCity: any;
  ShipToState: any;
  ShipToZip: any;
  PONumber: any;
  postTaxAmount: any;
  ShipToFormattedAddress: any;
  currencySymbol: any;
  currencyDecimalPlaces: any;
  currencyThousandSeperator: any;
  currencyDecimalSeperator: any;
  canManageInvoice: any;
  hasMultipleServiceProviderCustomers: any;
  invoiceTypeName: any;
  VATNumber: any;
  isAnyPaymentFailure: boolean;
  currentInvoicePayments: any[] = [];
  totalInvoicePaidAmount: any;
  addInvoicePayment: any = {};
  isAnyPaymentPending: boolean;
  remainingPaymentDetails: any = [];
  globalDateFormat: any = '';
  invoiceDetailsTemplate: any = null;
  unpaidDuesDetailsByInvoiceID: any = [];
  currencyTypes: any[];

  frmAddInvoicePayment: FormGroup;
  recepientsForCustomerInvoiceGeneratedEventEmailNotification: any;
  symbol: any[];
  propertyUpdateModel: any = {};
  sendInvoiceToProvidedEmailsViewModel: any = {}; 
  partnerAddressDetails:any;
  entityName = null;
  recordId = null;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  selectedAddressId: number = 0;
  invoiceEntity: null;
  invoiceRecordId: null;
  IsCurrentAddress:any;
  private initiatePaymentFocusTimeout: any;
  private sendInvoiceFocusTimeout: any;



  constructor(
    public _permissionService: PermissionService,
    public _router: Router,
    private _invoiceService: InvoicesService,
    private _commonService: CommonService,
    private _cdRef: ChangeDetectorRef,
    private _appService: AppSettingsService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _modalService: NgbModal,
    private _fileService: FileService,
    private _fb: FormBuilder,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    private permissionService: PermissionService,
    private dynamicTemplateService: DynamicTemplateService,
    private router : Router,
    private _quotesService: QuoteService,
  ) {
    super(permissionService, dynamicTemplateService, router, _appService)
    this.currentStateName = _router.url
    let data = _router.getCurrentNavigation()?.extras?.state?.data;
    if(!data && this._invoiceService.dataState){
      data = this._invoiceService.dataState;
    }
    if (data?.invoiceId) {
      this.invoiceId = data?.invoiceId;
    } else {
      this.backToInvoices();
    }
    if (this.invoiceId === undefined || this.invoiceId === null || this.invoiceId === '') {
      if (this.currentStateName.includes('partner/invoices/invoicelineitems')) {

        _router.navigate(['partner/invoices"'])
      }
      else if (this.currentStateName.includes('home/invoices/invoicelineitems')) {
        _router.navigate(['home/invoices'])
      }
    }
    else {
      this.getInvoiceLineItems();
    }

    let invoiceNumber = localStorage.getItem("invoiceNumber");
    if (invoiceNumber !== undefined && invoiceNumber !== null && invoiceNumber !== '') {
      this.invoiceNumber = invoiceNumber;
    }

    this.createForm();
    this.getApplicationData();
    
    // this.pageInfo.updateTitle(`${this.invoiceNumber}`,true);
    // this.pageInfo.updateBreadcrumbs('')
  }
  ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    this.getPermissions() ;
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.invoiceDetailsTemplate = response.Data.InvoiceDetailsTemplate
    })
    this._subscriptionArray.push(subscription);
  }

  getAddressDettails(C3Id:any, entityName:any){
          const subscription2 = this._quotesService.getPartnerAddress(entityName, C3Id).pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
           if(this.selectedAddressId !== 0 && this.selectedAddressId != null){
                this.partnerAddressDetails = data.Data?.find((item : any) => item.AddressId === this.selectedAddressId);
            }else if(this.selectedAddressId === 0 && this.selectedAddressId != null){
                this.partnerAddressDetails = 
                 data.Data?.find((item: any) => item.BillFromAddressId === true) 
                 ?? data.Data?.find((item: any) => item.IsDefault === true);
              }
              else if(this.selectedAddressId === null){
                this.partnerAddressDetails = data.Data?.find((item : any) => item.IsDefault === true);
              }
              if(this.partnerAddressDetails === undefined || this.partnerAddressDetails === null){
                //  this.partnerAddressDetails = data.Data?.find((item : any) => item.IsDefault === true);
                 this.partnerAddressDetails = this.IsCurrentAddress ;
              }
              this.partnerAddressLine1 = this.partnerAddressDetails.Line1;
              this.partnerAddressLine2 = this.partnerAddressDetails.Line2
              this.partnerCity = this.partnerAddressDetails.City;
              this.partnerZip = this.partnerAddressDetails.Zip;
              this.partnerState = this.partnerAddressDetails.State;
              this.partnerCountry = this.partnerAddressDetails.Country;
              this.partnerFormattedAddress = this.partnerCity + ',' + this.partnerState + ','+ this.partnerAddressDetails.Country+ ',' +this.partnerZip ;
          });
          this._subscriptionArray.push(subscription2);
      }

  getPermissions() {
    this.permissions.HasExportInvoicePDF = this._permissionService.hasPermission(CloudHubConstants.DOWNLOAD_INVOICE_PDF);
    this.permissions.HasExportInvoiceCSV = this._permissionService.hasPermission(CloudHubConstants.DOWNLOAD_INVOICE_CSV);
    this.permissions.HasAddAdjustment = this._permissionService.hasPermission(CloudHubConstants.BTN_ADD_ADJUSTMENTS);
    this.permissions.HasInitiatePayment = this._permissionService.hasPermission(CloudHubConstants.BTN_INITIATE_PAYMENT);
    this.permissions.HasApproveInvoice = this._permissionService.hasPermission(CloudHubConstants.ACTION_UPDATE_INVOICE_STATUS);
    this.permissions.HasFinalizeInvoice = this._permissionService.hasPermission(CloudHubConstants.ACTION_UPDATE_INVOICE_STATUS);
    this.permissions.hasEditAndDeleteAdjustment = this._permissionService.hasPermission(CloudHubConstants.BTN_ADD_ADJUSTMENTS);
    this.permissions.hasRecordPayment = this._permissionService.hasPermission(CloudHubConstants.BTN_SAVE_PAYMENT);
    this.permissions.hasResendInvoice = this._permissionService.hasPermission(CloudHubConstants.RESENDINVOICE);
    this.permissions.HasUpdateDueDate = this._permissionService.hasPermission(CloudHubConstants.UPDATE_DUEDATE);
    this.permissions.HasUpdatePONumber = this._permissionService.hasPermission(CloudHubConstants.UPDATE_PO_NUMBER);
    this.permissions.HasUpdateSubscriptionPONumber = this._permissionService.hasPermission(CloudHubConstants.UPDATE_SUBSCRIPTION_PO_NUMBER);
    this.permissions.HasEditInvoice = this._permissionService.hasPermission(CloudHubConstants.EDIT_INVOICE);
    this.permissions.HasViewPreviousDues = this._permissionService.hasPermission(CloudHubConstants.GET_PREVIOUS_INVOICE_DUES);
  }

  backToInvoices() {
    let callback = ()=>{
      localStorage.removeItem('billingPeriodId');

      if (this.currentStateName.includes('partner')) {
        this._router.navigate(['partner/invoices']);
      }
      else {
        this._router.navigate(['home/invoices']);
        }
    }
    if(this.frmAddInvoicePayment){
      this._unsavedChangesService.setUnsavedChanges(this.frmAddInvoicePayment.dirty);
    }
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();

  }
  getInvoiceLineItems() {
    const subscription = this._invoiceService.getInvoiceById(this.invoiceId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.isGridDataLoading = true;

      let currentInvoice = response.Data;
      this.HasInvoicePayment = currentInvoice.Invoice.HasInvoicePayment;
      this.paymentType = currentInvoice.Invoice.PaymentType;
      this.accountNumber = currentInvoice.Invoice.AccountNumber;
      this.isBankAccountVerified = currentInvoice.Invoice.IsBankAccountVerified;

      if (this._commonService.entityName === 'Partner') {
        this.allowTransaction = true;
      }
      else if (this._commonService.entityName === 'Reseller' && currentInvoice.Invoice.EntityName !== 'Reseller') {
        this.allowTransaction = true;
      }
      else if (this._commonService.entityName === 'Reseller' && currentInvoice.Invoice.EntityName === 'Reseller') {
        this.allowTransaction = currentInvoice.Invoice.AllowResellerToTransact;
      }
      else if (this._commonService.entityName !== 'Partner' && this._commonService.entityName !== 'Reseller' && currentInvoice.Invoice.EntityName !== 'Reseller') {
        this.allowTransaction = currentInvoice.Invoice.AllowCustomerToTransact;
      }

      //  $(".tooltips").tooltip();
      this.lineItemDetails = [];
      this.invoiceSubTaxes = [];
      this.invoiceLineItemTaxBreakUps = [];
      this.lineItemTypes = [];
      let types = _.each(currentInvoice.InvoiceLineItems, (lineItem) => {
        let exist = _.find(this.lineItemTypes, (itemType) => {
          return itemType === lineItem.ComboOfProviderAndCategory;
        });

        if (!exist) {
          this.lineItemTypes.push(lineItem.ComboOfProviderAndCategory);
        }
      });

      this.lineItemDetails = currentInvoice.InvoiceLineItems;

      this.invoiceLineItemTaxBreakUps = currentInvoice.InvoiceLineItemTaxBreakUps;
      this.invoiceDetails = currentInvoice.Invoice;
      this.canShowUnPaidDuesInPdf = currentInvoice.Invoice.CanShowUnPaidDuesInInvoice;

      if (currentInvoice.InvoiceLineItems !== null && currentInvoice.InvoiceLineItems.length > 0) {
        this.totalPostTaxAmount = this.lineItemDetails[0].TotalPostTaxAmount;
        this.totalDiscountAmount = this.lineItemDetails[0].TotalDiscountAmount;
      }
      _.each(this.invoiceLineItemTaxBreakUps, (subTax) => {
        let isExist = _.filter(this.invoiceSubTaxes, (sub) => {
          return sub.TaxName.toLowerCase() === subTax.TaxName.toLowerCase() && sub.TaxPercentage === subTax.TaxPercentage;
        });

        if (isExist === null || isExist.length === 0) {
          this.invoiceSubTaxes.push(subTax);
        }
      });
      this.getInvoiceDetails(this.invoiceDetails);
      this.getUnpaidDuesByInvoiceId(this.invoiceDetails);
      this.getRemainingPayments();
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getUnpaidDuesByInvoiceId(invoiceDetails: any) {
    const subscription = this._invoiceService.getUnpaidDuesByInvoiceId(invoiceDetails.EntityName, invoiceDetails.RecordId, this.invoiceId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.unpaidDuesDetailsByInvoiceID = response.Data;
      this.currencyTypes = [];
      let types = _.each(this.unpaidDuesDetailsByInvoiceID, (currencyType) => {
        let exist = _.find(this.currencyTypes, (itemCurrencyType) => {
          return itemCurrencyType.CurrencyCode === currencyType.CurrencyCode;
        });

        if (!exist) {
          this.currencyTypes.push(currencyType);
        }
      });
    });
    this._subscriptionArray.push(subscription);
  }


  getInvoiceDetails(invoice) {
    this.invoiceId = invoice.ID;
    this.customerName = invoice.CustomerName;
    this.recordName = invoice.RecordName;
    this.invoiceDate = invoice.InvoiceGeneratedDate;
    this.invoiceNumber = invoice.InvoiceNumber;
    this.formattedAddress = invoice.FormattedAddress;
    this.billingStartDate = invoice.BillingStartDate;
    this.billingMonth = invoice.BillingMonth;
    this.billingYear = invoice.BillingYear;
    this.billingPeriodId = invoice.BillingPeriodId;
    this.billingEndDate = invoice.BillingEndDate;
    this.usageBillingStartDate = invoice.UsageBillingStartDate;
    this.usageBillingEndDate = invoice.UsageBillingEndDate;
    this.addressLine1 = invoice.AddressLine1;
    this.addressLine2 = invoice.AddressLine2;
    this.city = invoice.City;
    this.state = invoice.State;
    this.zip = invoice.Zip;
    this.taxPercentage = invoice.TaxPercentage;
    this.taxName = invoice.TaxName;
    this.partnerCompanyName = invoice.PartnerCompanyName;
    // this.partnerAddressLine1 = invoice.PartnerAddressLine1;
    // this.partnerAddressLine2 = invoice.PartnerAddressLine2;
    // this.partnerCity = invoice.PartnerCity;
    // this.partnerState = invoice.PartnerState;
    // this.partnerZip = invoice.PartnerZip;
    // this.partnerFormattedAddress = invoice.PartnerFormattedAddress || null;
    this.CouponCode = null;
    this.CouponDescription = null;
    this.CouponDetailId = null;
    this.businessNumberKey = invoice.BusinessNumberKey;
    this.businessNumber = invoice.BusinessNumber;
    this.invoiceDueDate = invoice.InvoiceDueDate;
    this.invoiceFooterLine = invoice.InvoiceFooterLine;
    this.IsAutopay = invoice.IsAutopay;
    this.ShipToAddress1 = invoice.PartnerAddressLine1;
    this.ShipToAddress2 = invoice.PartnerAddressLine2;
    this.ShipToCity = invoice.PartnerCity;
    this.ShipToState = invoice.PartnerState;
    this.ShipToZip = invoice.PartnerZip;
    this.PONumber = invoice.PONumber;
    this.postTaxAmount = invoice.PostTaxAmount;
    this.ShipToFormattedAddress = invoice.PartnerFormattedAddress;
    this.currencySymbol = invoice.CurrencySymbol;
    this.currencyDecimalPlaces = invoice.CurrencyDecimalPlaces;
    this.currencyThousandSeperator = invoice.CurrencyThousandSeperator;
    this.currencyDecimalSeperator = invoice.CurrencyDecimalSeperator;
    this.canManageInvoice = invoice.CanManageInvoice;
    this.hasMultipleServiceProviderCustomers = invoice.HasMultipleServiceProviderCustomers;
    this.invoiceTypeName = invoice.InvoiceTypeName;
    this.VATNumber = invoice.VATNumber
    this.invoiceEntity = invoice.EntityName;
    this.invoiceRecordId = invoice.RecordId;
    this.selectedAddressId = invoice.BillFromAddressId;

    this._cdRef.detectChanges();
    this.getInvoicePayments(this.invoiceId);
    this.IsCurrentAddress = {
                     AddressId:this.selectedAddressId,
                     BillFromAddressId: false,
                     City: invoice.PartnerCity,
                     Country: invoice.PartnerCountry,
                     IsDefault: false,
                     Line1: invoice.PartnerAddressLine1,
                     Line2: invoice.PartnerAddressLine2,
                     State: invoice.PartnerState,
                     Zip : invoice.PartnerZip,
                     ShouldDisable: true
              }
    this.getAddressDettails(this.invoiceRecordId, this.invoiceEntity);
  }

  getInvoicePayments(invoiceId) {
    this.isAnyPaymentFailure = false;
    this.currentInvoicePayments = [];
    this.totalInvoicePaidAmount = 0.00;

    const subscription = this._invoiceService.getPaymentsByInvoiceId(invoiceId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      let invoicePayments = response.Data;

      this.currentInvoicePayments = invoicePayments;
      if (this.currentInvoicePayments !== undefined && this.currentInvoicePayments !== null && this.currentInvoicePayments.length > 0) {
        this.totalInvoicePaidAmount = this.currentInvoicePayments[0].TotalInvoicePaidAmount;

        if (this.totalInvoicePaidAmount !== undefined && this.totalInvoicePaidAmount !== null) {
          this.totalInvoicePaidAmount = this.totalInvoicePaidAmount.toFixed(2);
        }
        else {
          this.totalInvoicePaidAmount = 0.00;
        }
      }

      this.addInvoicePayment = [];
      this.isAnyPaymentFailure = _.filter(this.currentInvoicePayments, (cp) => {
        return cp.Status === "Declined" || cp.Status === "TechnicalError";
      }).length > 0;

      this.isAnyPaymentPending = _.filter(this.currentInvoicePayments, (cp) => {
        return cp.Status === "Accepted" || cp.Status === "InProgress";
      }).length > 0;
    });

    this.isGridDataLoading = false;
    this._subscriptionArray.push(subscription);
  }

  getRemainingPayments() {
    let reqBody = {
      EntityName: this.invoiceDetails.EntityName,
      RecordId: this.invoiceDetails.RecordId
    };
    const subscription = this._invoiceService.getRemainingPayments(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.remainingPaymentDetails = response.Data;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getSubTaxesAmount(taxName) {
    let subTaxesAmount = 0;
    let selectedTypeItems = _.filter(this.invoiceLineItemTaxBreakUps, (sub) => {
      return sub.TaxName.toLowerCase() === taxName.toLowerCase();
    });
    _.each(selectedTypeItems, (invoice) => {
      if (!isNaN(invoice.TaxAmount)) {
        subTaxesAmount += invoice.TaxAmount;
      }
    });

    return subTaxesAmount.toFixed(2);
  }

  getSubTotals(isTaxes) {
    let invoiceAmount = 0;
    _.each(this.lineItemDetails, (invoice) => {
      if (isTaxes) {
        if (!isNaN(invoice.TaxAmount)) {
          invoiceAmount += invoice.TaxAmount;
        }
      }
      else if (!isTaxes && invoice.InvoiceLineItemTypeName !== "Adjustments") {
        if (!isNaN(invoice.InvoiceLineAmount)) {
          invoiceAmount += invoice.InvoiceLineAmount;
        }
      }
    });
    return invoiceAmount;
  }

  getTotalDiscountAmount() {
    let discountAmount = 0;
    _.each(this.lineItemDetails, (invoice) => {
      if (!isNaN(invoice.DiscountAmount)) {
        discountAmount += invoice.DiscountAmount;
      }
    });
    return discountAmount.toFixed(2);
  }

  getDiscountOrAdditionalChargeAmounts(isdiscount) {
    let invoiceAmount = 0;
    _.each(this.lineItemDetails, (invoice) => {
      if (invoice.InvoiceLineItemTypeName === "Adjustments") {
        if (!isNaN(invoice.InvoiceLineAmount)) {
          if (isdiscount && invoice.InvoiceLineAmount < 0) {
            invoiceAmount += invoice.InvoiceLineAmount;
          }
          else if (!isdiscount && invoice.InvoiceLineAmount > 0) {
            invoiceAmount += invoice.InvoiceLineAmount;
          }
        }
      }
    });
    return invoiceAmount;
  }


  exportInvoicePDF() {
    const url = `/invoices/${this.invoiceId}/exportInvoicePDF`
    this._fileService.getFile(url);
  }

  exportInvoiceCSV() {
    const url = `/invoices/${this.invoiceId}/exportInvoiceCSV`
    this._fileService.getFile(url);
  }

  addOrEditAdjustment(lineItemId) {
    localStorage.setItem("adjustmentId", lineItemId);
    localStorage.setItem("invoiceId", this.invoiceId);
    // vm.currentStateName === 'partner.invoicelineitems' 
    if (this.currentStateName.includes('partner/invoice/invoicelineitems')) {
      this._router.navigate(['partner/invoice/addadjustment-partner']);
      // $state.go("partner.addadjustment");
    }
    // currentStateName === 'home.invoicelineitems' 
    else if (this.currentStateName.includes('home/invoice/invoicelineitems')) {
      // $state.go("home.addadjustment");
      this._router.navigate(['home/invoice/addadjustment-home']);
    }
  }

  deleteAdjustment(lineItemId) {
    let msg = this._translateService.instant('TRANSLATE.DELETE_INVOICE_ADJUSTMENT_CONFIRMATION');
    let okText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
    this._notifierService.confirm({ title: msg, confirmButtonText: okText, icon: 'info' }).then((result: { isConfirmed: any, isDismissed: any }) => {
      if (result.isConfirmed) {
        const subscription = this._invoiceService.deleteAdjustmentById(lineItemId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          this.getInvoiceLineItems();
          this._cdRef.detectChanges();
        })
        this._subscriptionArray.push(subscription);
      }
    });
  }
private clearinitiateInvoicePaymentButtonFocus() {
  this.initiatePaymentFocusTimeout = setTimeout(() => {
    this.processAutoPaymentButton?.nativeElement?.blur();
    if (typeof window !== 'undefined' && typeof window.focus === 'function') {
      window.focus();
    }
  },285);
}

  initiateInvoicePayment() {
    if (this.isAnyPaymentPending) {
      this._toastService.error(this._translateService.instant('TRANSLATE.CANNOT_INITIATE_PAYMENT'));
    }
    else {
      let invoiceAmount: any = (this.postTaxAmount.toFixed(2) - this.totalInvoicePaidAmount);
      invoiceAmount = invoiceAmount.toFixed(2);

      if (invoiceAmount === undefined || invoiceAmount === null || invoiceAmount <= 0) {
        this._toastService.error(this._translateService.instant('TRANSLATE.INITIATE_PAYMENT_ERROR_WITH_ZERO_AMOUNT'));
      }
      else {
        let msg = this._translateService.instant('TRANSLATE.INITIATE_INVOICE_PAYMENT_CONFIRMATION',
          {
            PaymentType: this.paymentType,
            AccountNumber: this.accountNumber,
            invoiceAmount: invoiceAmount,
            currencySymbol: this.invoiceDetails.CurrencySymbol
          }
        );
        let okText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
        this._notifierService.confirm({ title: msg, confirmButtonText: okText, icon: 'info' }).then((result: { isConfirmed: any, isDismissed: any }) => {
          if (result.isConfirmed) {
            let reqBody = {
              EntityName: this._commonService.entityName,
              RecordId: this._commonService.recordId,
              InvoiceIds: [this.invoiceId]
            };
            const subscription = this._invoiceService.initiateInvoicePayment(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
              let msg = this._translateService.instant('TRANSLATE.AUTO_PAYMENT_REQUEST_SUCCESS');
              this._notifierService.alert({ title: msg });
              this.getInvoiceLineItems();
            })
            this._subscriptionArray.push(subscription);
          }
        }).finally(() => {  
          this.clearinitiateInvoicePaymentButtonFocus();
        });
      }
    }
  }

  saveManualPayment(form: FormGroup) {
    debugger;
    //form.$submitted = true;
    form.markAllAsTouched();
    if (form.valid) {

      let values = this.frmAddInvoicePayment.getRawValue();
      this.addInvoicePayment.PaidAmount = values?.paidAmount;
      this.addInvoicePayment.Remarks = values?.remarks;
      this.addInvoicePayment.PaymentDate = this.getDate(values?.paidDate);

      if (this.addInvoicePayment.PaidAmount === undefined || this.addInvoicePayment.PaidAmount === null || this.addInvoicePayment.PaidAmount <= 0) {
        this._toastService.error(this._translateService.instant('TRANSLATE.RECORD_PAYMENT_ERROR_WITH_ZERO_AMOUNT'));
        // notifier.notifyError($filter('translate')("RECORD_PAYMENT_ERROR_WITH_ZERO_AMOUNT"));
      }
      else {
        let msg = this._translateService.instant('TRANSLATE.RECORD_MANUAL_PAYMENT_CONFIRMATION',
          {
            amount: this.addInvoicePayment.PaidAmount,
            currencySymbol: this.invoiceDetails.CurrencySymbol
          }
        );
        let okText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
        this._notifierService.confirm({ title: msg, confirmButtonText: okText, icon: 'info' }).then((result: { isConfirmed: any, isDismissed: any }) => {
          if (result.isConfirmed) {
            let postData = {
              InvoiceId: this.invoiceId,
              PaidAmount: this.addInvoicePayment.PaidAmount,
              PaymentDate: this.addInvoicePayment.PaymentDate,
              ReMarks: this.addInvoicePayment.Remarks,
              EntityName: this.invoiceDetails.EntityName,
              RecordId: this.invoiceDetails.RecordId
            };
            const subscription = this._invoiceService.saveManualPayment(postData).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
              this._toastService.success("Payment recorded successfully");
              this.frmAddInvoicePayment.reset();
              this.addInvoicePayment = {};
              this.getInvoicePayments(this.invoiceId);
              this.getInvoiceLineItems();
              // form.$submitted = false;
            })
            this._subscriptionArray.push(subscription);
          }
        });
      }
    }
  }

  updateInvoiceStatus(status) {
    if (this.invoiceId !== undefined && this.invoiceId !== null && status !== '') {
      let msg = this._translateService.instant('TRANSLATE.INITIATE_STATUS_UPDATE_CONFIRMATION',
        {
          invoiceStatus: status
        }
      );
      let okText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
      this._notifierService.confirm({ title: msg, confirmButtonText: okText, icon: 'info' }).then((result: { isConfirmed: any, isDismissed: any }) => {
        if (result.isConfirmed) {
          const subscription = this._invoiceService.updateInvoiceStatus(this.invoiceId, status).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMR_INVOICE_LINEITEM_INVOICE_STATUS_UPDATE_SUCCESSFULL_MESSAGE'));
            this.getInvoiceLineItems();
          })
          this._subscriptionArray.push(subscription);
        }
      });
    }
  }

  getSubTotalOfCategory(lineItemType) {
    let subTotal = 0;
    let invoiceItemsByCategory = _.filter(this.lineItemDetails, (item) => {
      return item.ComboOfProviderAndCategory === lineItemType;
    });

    if (invoiceItemsByCategory !== null && invoiceItemsByCategory.length > 0) {
      _.each(invoiceItemsByCategory, (item) => {
        subTotal += item.PostTaxAmount;
      });
    }
    return subTotal;
  }

  getEmailRecepientsPresentForCustomerInvoiceGeneratedEvent() {
    const subscription = this._invoiceService.getRecepientsForSendInvoice(this.invoiceDetails.EntityName, this.invoiceDetails.RecordId).subscribe((response: any) => {
      let emailRecepients = response.Data;
      if (emailRecepients !== undefined && emailRecepients !== null && emailRecepients !== '') {
        this.recepientsForCustomerInvoiceGeneratedEventEmailNotification = emailRecepients;
      }
      // $rootScope.clearTooltip();
      this.proceedToGetEmailList(this.invoiceId);
    });
    this._subscriptionArray.push(subscription);
  }

  getEmailRecepientsList(invoiceId: any) {
    // $rootScope.clearTooltip();
    this.proceedToGetEmailList(invoiceId);
  }

private clearSendInvoiceButtonFocus() {
   this.sendInvoiceFocusTimeout = setTimeout(() => {
      this.sendInvoiceButton?.nativeElement?.blur();
      if (typeof window !== 'undefined' && typeof window.focus === 'function') {
        window.focus();
      }
    });
  }
  proceedToGetEmailList(invoiceId) {

    const modalRef = this._modalService.open(ResendInvoiceComponent);
    modalRef.componentInstance.data = { recepientsForEmailNotification: this.recepientsForCustomerInvoiceGeneratedEventEmailNotification };
    modalRef.result.then((response) => {
      if (response) {
        if (response.EmailsList !== null || response.EmailsList !== '' || response.EmailsList !== undefined) {
          this.sendInvoiceToProvidedEmailsViewModel.InvoiceId = this.invoiceId;
          this.sendInvoiceToProvidedEmailsViewModel.EmailList = response.EmailsList;
          this.sendInvoiceToProvidedEmailsViewModel.EntityName = this.invoiceDetails.EntityName;
          this.sendInvoiceToProvidedEmailsViewModel.RecordId = this.invoiceDetails.RecordId;
  
          const subscription = this._invoiceService.sendInvoieToEmails(this.sendInvoiceToProvidedEmailsViewModel).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
              this._toastService.success(this._translateService.instant('TRANSLATE.INVOICE_EMAIL_POST_SUCCESS_MESSAGE'));
            },
            error: (error: any) => {
              const errorDetail = this._translateService.instant(`TRANSLATE.${error.error.ErrorDetail}`);
              const defaultMessage = error.error.Data[0].DefaultMessage;
              const errorMessage = `${errorDetail}.  ${defaultMessage}.`;              
              this._toastService.error(errorMessage);
            }
          });
          this._subscriptionArray.push(subscription);
        }
      }
    }).finally(() => {
      this.clearSendInvoiceButtonFocus();
    });
  }

  editInvoiceProperty(propertyName, propertyValue, lineitemId) {
    let payload = { propertyName: propertyName, propertyValue: propertyValue, invoiceGenerationDate: this.invoiceDetails.InvoiceGeneratedDate, canManageInvoice: this.canManageInvoice };
    const modalRef = this._modalService.open(UpdateInvoicePropertyComponent);
    modalRef.componentInstance.data = payload;
    modalRef.result.then((result) => {
      if (result) {
        this.propertyUpdateModel = {};
        this.propertyUpdateModel.Property = propertyName;
        this.propertyUpdateModel.Id = lineitemId == null ? this.invoiceDetails.ID : lineitemId;
        this.propertyUpdateModel.Value = this.propertyUpdateModel.Property == "DueDate" ? moment(result).format('LL') : result;
        const subscription = this._invoiceService.updateProperties(this.invoiceDetails.ID, this.propertyUpdateModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          this._toastService.success(this._translateService.instant('TRANSLATE.INVOICE_PROPERTIED_UPDATED_SUCCESS_MESSAGE'));
          if (propertyName == 'DueDate') {
            let d =new DateUtility();
            this.invoiceDueDate = d.formatDateToISO(result); 
          }
          else if (propertyName == 'PONumber') {
            this.PONumber = result;
          }
        });
        this._subscriptionArray.push(subscription);
      }else if(result == "" && propertyName == 'PONumber'){
        this.PONumber = null
      }
    });
  }

  onActionChange(event) {
    let lineItemId = event.lineItemId;
    let action = event.action;
    if (action === 'edit') {
      this.addOrEditAdjustment(lineItemId);
    } else if (action === 'delete') {
      this.deleteAdjustment(lineItemId);
    }
  }

  editInvoice() {
    this._router.navigate(['partner/createinvoice'], { state: { invoiceId: this.invoiceId, IsCurrentAddress: this.IsCurrentAddress } });
    //$state.go("partner.createinvoiceondemand", { invoiceId: vm.invoiceId });
  }

  checkNcePromotionDetails(promotionalId) {

    // // var product = payload.product;
    // var modal = $uibModal.open({
    //     animation: true,
    //     ariaLabelledBy: 'modal-title',
    //     ariaDescribedBy: 'modal-body',
    //     scope: $scope,
    //     templateUrl: 'app/modules/partner.invoices.createinvoiceondemand/partner.invoices.invoicelineitem.promotiondetailspopup.html',
    //     controller: 'AddNcePromotions',
    //     controllerAs: 'cc',
    //     size: 'lg',
    //     resolve: {
    //         //data to be manipulated 
    //         data: function () {
    //             return promotionalId;
    //         }
    //     }
    // });

    // modal.result.then(response => {

    //     // submit

    // }, error => {
    //     //cancel
    // });
  }

  getSubTotalOfUnpaidDuesByCurrency(lineItemType) {
    let subTotal = 0;
    this.symbol = [];
    let unpaidDuesByCurrency = _.filter(this.unpaidDuesDetailsByInvoiceID, (item) => {
      return item.CurrencyCode === lineItemType;
    });

    if (unpaidDuesByCurrency !== null && unpaidDuesByCurrency.length > 0) {
      _.each(unpaidDuesByCurrency, (item) => {
        subTotal += item.PendingAmount;
      });
    }
    return subTotal;
  }

  createForm(){
    this.frmAddInvoicePayment = this._fb.group({
      paidAmount:[,[Validators.required]],
      remarks:[,[Validators.required]],
      paidDate:[,[Validators.required]],
    });
  }

  getDate(date: any) {
    if (date) {
      const d = new Date(date.year, date.month - 1, date.day);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    }
    return null;
  }
  
  editPartnerAddress(){
          const modalRef = this._modalService.open(PartnerAddressDetailsPopupComponent, {
              ariaLabelledBy: 'modal-title',
              ariaDescribedBy: 'modal-body',
              size: 'lg',
              backdrop: 'static',
          });
          modalRef.componentInstance.entityName = this.invoiceEntity == 'Reseller' ? this._commonService.entityName : this.invoiceEntity; // Bind fetched data to the modal
          modalRef.componentInstance.recordId = this.invoiceRecordId;
          modalRef.componentInstance.isMarkAsDefault = true;
          modalRef.componentInstance.CustomerName = this.recordName;
          modalRef.componentInstance.IsSelectedAddressId = this.selectedAddressId;
          modalRef.componentInstance.IsCurrentAddress = this.IsCurrentAddress;
          modalRef.result.then(
              (selectedAddressId) => {
                if (selectedAddressId) {
                  // Save it locally
                  this.selectedAddressId = selectedAddressId.BillFromAddressId;
                  this.getAddressDettails(this.invoiceRecordId, this.invoiceEntity);
                  this.updateBillFromAddress(selectedAddressId.BillFromAddressId);
                }
              },
              (reason) => {
                modalRef.close();
              }
            );    
      }

  updateBillFromAddress(addressId:any ){
     let reqBody = {
      BillFromAddressId : addressId,
      EntityName : this._commonService.entityName,
      RecordId : this._commonService.recordId,
      InvoiceId: this.invoiceId
    };
    const subscription = this._invoiceService.updateBillFromAddress(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === 'Success') {
            //this._toastService.success(this.translateService.instant('PARTNER_BILL_FROM_ADDRESS_UPDATED_SUCCESSFUL_MESSAGE'));
          }
        })
  }


  delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let title= `<span class="text-primary ps-2">${this.invoiceNumber}</span>`;
    this.pageInfo.updateTitle(title, true);
    this.pageInfo.updateBreadcrumbs('');
  }

  ngOnDestroy(): void {
    if (this.initiatePaymentFocusTimeout) {
      clearTimeout(this.initiatePaymentFocusTimeout);
    }
    if (this.sendInvoiceFocusTimeout) {
      clearTimeout(this.sendInvoiceFocusTimeout);
    }
    this._invoiceService.dataState = null;
    this._unsavedChangesService.setUnsavedChanges(false); 
    super.ngOnDestroy();
  }



}
