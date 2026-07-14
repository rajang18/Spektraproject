import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import _ from "lodash";
import { CommonService } from "src/app/services/common.service";
import { InvoiceDetailService } from "src/app/services/invoice-detail.service";
import { UpdateInvoicePropertyComponent } from "../pop-ups/update-invoice-property/update-invoice-property.component";
import { InvoicesService } from "src/app/services/invoices.service";
import { ToastService } from "src/app/services/toast.service";
import { TranslateService } from "@ngx-translate/core";
import { AppSettingsService } from "src/app/services/app-settings.service";
import { Subject, Subscription, takeUntil } from "rxjs";

@Component({
  template: ''
})
export abstract class BaseInvoiceDetailComponent implements OnInit, OnDestroy {

  @Input() templateName: any;
  @Input() invoiceDetails: any;
  @Input() permissions: any;
  @Input() lineItemTypes: any;
  @Input() lineItemDetails: any;
  @Input() invoiceLineItemTaxBreakUps: any;
  @Input() invoiceSubTaxes: any;
  @Input() totalDiscountAmount: any;
  @Input() totalPostTaxAmount: any;
  @Input() OnAction: EventEmitter<any>;
  @Input() showCostOnPartner: any;
  @Input() extraDetails: any;

  canManageInvoice: any;
  showInvoiceSummaryInEntityCurrency: boolean = false;
  conversionRateForEntity: any = null;
  totalDiscountAmountInEntityCurrency: any = 0;
  totalPostTaxAmountInEntityCurrency: any = 0;
  isMultipleMarketSupport: boolean = false;
  canManagePO: any;
  propertyUpdateModel: any = {};
  invoiceLineItemsByCategory: any;
  invoiceLineItemsByProduct: any[]=[];
  tptTaxes: any[] = [];
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();


  constructor(
    public _invoiceDetailService: InvoiceDetailService,
    public _commonService: CommonService,
    public _modalService: NgbModal,
    public _invoiceService: InvoicesService,
    public _toastService: ToastService,
    public _translateService: TranslateService,
    public _cdRef:ChangeDetectorRef,
    public _appService: AppSettingsService,
  ) { }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.lineItemTypes = this.lineItemTypes;
    this.showInvoiceSummaryInEntityCurrency = this.invoiceDetails.ShowInvoiceSummaryInEntityCurrency;
    this.conversionRateForEntity = this.invoiceDetails.ConversionRateForEntity;
    this.invoiceLineItemsByCategory = this.extraDetails?.invoiceLineItemsByCategory;
    this.invoiceLineItemsByProduct = this.extraDetails?.invoiceLineItemsByProduct;
    this.tptTaxes = this.extraDetails?.tptTaxes;
    //console.log(this.extraDetails)
    this.canManagePO = (this.permissions.HasUpdateSubscriptionPONumber === 'Allowed' && this.invoiceDetails.CanManageInvoice)
    this.isMultipleMarketSupports();
  }

  addOrEditAdjustment(lineItemId, action) {
     this.OnAction.emit({ lineItemId: lineItemId, action: action });
    // if (isValid) {
    //   this.callOnAction(lineItemId, 'edit');
    //   this.$apply();
    // }
  }

  deleteAdjustment(lineItemId, action) {
     this.OnAction.emit({ lineItemId: lineItemId, action: action });
    // if (isValid) {
    //   callOnAction(lineItemId, 'delete');
    //   this.$apply();
    // }
  }

  getSubTotalOfCategory(lineItemType) {
    let subTotal = 0;
    let invoiceItemsByCategory = _.filter(this.lineItemDetails, (item) => {
      return item.ComboOfProviderAndCategory === lineItemType;
    });

    if (invoiceItemsByCategory !== null && invoiceItemsByCategory.length > 0) {
      if (!this.invoiceDetails.IsTaxOnTotals) {
        _.each(invoiceItemsByCategory, (item) => {
          subTotal += item.PostTaxAmount;
        });
      }
      else {
        _.each(invoiceItemsByCategory, (item) => {
          subTotal += item.PreTaxAmount;
        });
      }
    }
    return subTotal;
  }

  getSubTotals(isTaxes) {

    let InvoiceAmount = 0;
    _.each(this.lineItemDetails, (invoice) => {
      if (isTaxes) {
        if (!isNaN(invoice.TaxAmount)) {
          InvoiceAmount += invoice.TaxAmount;
        }
      }
      else if (!isTaxes && invoice.InvoiceLineItemTypeName !== "Adjustments") {
        if (!isNaN(invoice.InvoiceLineAmount)) {
          InvoiceAmount += invoice.InvoiceLineAmount;
        }
      }
    });
    return InvoiceAmount;
  }

  editInvoiceProperty(propertyName, propertyValue, lineitemId, model) {
    let data = {
      propertyName: propertyName,
      propertyValue: propertyValue,
      invoiceGenerationDate: null,
      canManageInvoice: this.canManageInvoice
    };
    const modalRef = this._modalService.open(UpdateInvoicePropertyComponent);
    modalRef.componentInstance.data = data;
    modalRef.result.then((result) => {
      if (result) {
        this.propertyUpdateModel = {};
        this.propertyUpdateModel.Property = propertyName;
        this.propertyUpdateModel.Id = lineitemId;
        this.propertyUpdateModel.Value = result;
        const subscription =  this._invoiceService.updateProperties(this.invoiceDetails.ID, this.propertyUpdateModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
           if (propertyName === 'PONumberLineItem') {
              const lineItem = this.lineItemDetails.find(item => item.ID === lineitemId);
              if (lineItem) {
                lineItem.PONumber = result;
              }
              this._cdRef.detectChanges();
            }
          this._toastService.success(this._translateService.instant('TRANSLATE.INVOICE_PROPERTIED_UPDATED_SUCCESS_MESSAGE'));
          // if (propertyName == 'DueDate') {
          //   this.invoiceDueDate = result;
          // }
          // else if (propertyName == 'PONumber') {
          //   this.PONumber = result;
          // }
        });
        this._subscriptionArray.push(subscription);
      }
    });
  }

  getDiscountOrAdditionalChargeAmounts(isdiscount) {
    let InvoiceAmount = 0;
    _.each(this.lineItemDetails, (invoice) => {
      if (invoice.InvoiceLineItemTypeName === "Adjustments") {
        if (!isNaN(invoice.InvoiceLineAmount)) {
          if (isdiscount && invoice.InvoiceLineAmount < 0) {
            InvoiceAmount += invoice.InvoiceLineAmount;
          }
          else if (!isdiscount && invoice.InvoiceLineAmount > 0) {
            InvoiceAmount += invoice.InvoiceLineAmount;
          }
        }
      }
    });
    return InvoiceAmount;
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

  getSubTotalsInEntityCurrency(isTaxes:any) {
    let InvoiceAmount = 0;
    _.each(this.lineItemDetails, (invoice) => {
      if (isTaxes) {
        if (!isNaN(invoice.TaxAmount)) {
          InvoiceAmount += invoice.TaxAmount;
        }
      }
      else if (!isTaxes && invoice.InvoiceLineItemTypeName !== "Adjustments") {
        if (!isNaN(invoice.InvoiceLineAmount)) {
          InvoiceAmount += invoice.InvoiceLineAmount;
        }
      }
    });
    if (this.showInvoiceSummaryInEntityCurrency && (!isNaN(this.conversionRateForEntity))) {
      InvoiceAmount = InvoiceAmount * this.conversionRateForEntity;
    }
    return InvoiceAmount;
  }

  getDiscountOrAdditionalChargeAmountsInEntityCurrency(isdiscount:any) {
    let InvoiceAmount = 0;
    _.each(this.lineItemDetails, (invoice) => {
      if (invoice.InvoiceLineItemTypeName === "Adjustments") {
        if (!isNaN(invoice.InvoiceLineAmount)) {
          if (isdiscount && invoice.InvoiceLineAmount < 0) {
            InvoiceAmount += invoice.InvoiceLineAmount;
          }
          else if (!isdiscount && invoice.InvoiceLineAmount > 0) {
            InvoiceAmount += invoice.InvoiceLineAmount;
          }
        }
      }
    });
    if (this.showInvoiceSummaryInEntityCurrency && (!isNaN(this.conversionRateForEntity))) {
      InvoiceAmount = InvoiceAmount * this.conversionRateForEntity;
    }
    return InvoiceAmount;
  }

  getSubTaxesAmountInEntityCurrency(taxName:any) {
    let subTaxesAmount = 0;
    let selectedTypeItems = _.filter(this.invoiceLineItemTaxBreakUps, (sub) => {
      return sub.TaxName.toLowerCase() === taxName.toLowerCase();
    });

    _.each(selectedTypeItems, (invoice) => {
      if (!isNaN(invoice.TaxAmount)) {
        subTaxesAmount += invoice.TaxAmount;
      }
    });
    if (this.showInvoiceSummaryInEntityCurrency && (!isNaN(this.conversionRateForEntity))) {
      subTaxesAmount = subTaxesAmount * this.conversionRateForEntity;
    }
    return subTaxesAmount.toFixed(2);
  }

  callOnAction(lineItemId, action) {
    this.OnAction.emit({ lineItemId: lineItemId, action: action });
  }

  isMultipleMarketSupports() {
    const subscription = this._commonService.getSupportedMarkets().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.isMultipleMarketSupport = response.Data.length > 1;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  
  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
