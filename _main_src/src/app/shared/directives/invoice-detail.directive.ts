import { Directive, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewContainerRef } from '@angular/core';
import _ from 'lodash';
import { InvoiceDetailService } from 'src/app/services/invoice-detail.service';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'appInvoiceDetail',
  standalone: true
})
export class InvoiceDetailDirective implements OnInit, OnChanges {

  @Input() templateName: any;
  @Input() invoiceDetails: any;
  @Input() permissions: any;
  @Input() lineItemTypes: any;
  @Input() lineItemDetails: any;
  @Input() invoiceLineItemTaxBreakUps: any;
  @Input() invoiceSubTaxes: any;
  @Input() totalDiscountAmount: any;
  @Input() totalPostTaxAmount: any;

  @Output() OnAction: EventEmitter<any> = new EventEmitter();
  showCostOnPartner = false;


  showInvoiceSummaryInEntityCurrency = false;
  conversionRateForEntity = null;
  totalDiscountAmountInEntityCurrency = 0;
  totalPostTaxAmountInEntityCurrency = 0;

  isMultipleMarketSupport = false;
  tptTaxes: any[] = [];
  invoiceLineItemsByCategory: any;
  invoiceLineItemsByProduct: any[]=[];

  cc: any = {}
  canManageInvoice: any;
  constructor(
    private viewContainerRef: ViewContainerRef,
    private _invoiceDetailService: InvoiceDetailService,
  ) { }

  ngOnInit(): void {    
    
  }

  loadComponent() {

    let extraDetails = {
      invoiceLineItemsByProduct: this.invoiceLineItemsByProduct,
      invoiceLineItemsByCategory: this.invoiceLineItemsByCategory,
      tptTaxes:this.tptTaxes,
    }
    const componentType = this._invoiceDetailService.getComponentType(this.templateName ?? 'default') ?? this._invoiceDetailService.getComponentType('default');
    if (componentType) {
      this._invoiceDetailService.loadComponent(this.viewContainerRef, componentType, this.invoiceDetails, this.permissions, this.lineItemTypes, this.lineItemDetails, this.invoiceLineItemTaxBreakUps, this.invoiceSubTaxes, this.totalDiscountAmount, this.totalPostTaxAmount,this.OnAction,this.showCostOnPartner,extraDetails)
    }

  }

  getInvoiceLineItemsForTPT() {
    this.tptTaxes = [];
    let tptCategories = [
      {
        Name: 'Managed Support',
        ID: 1
      },
      {
        Name: 'Licensing',
        ID: 2
      },
      {
        Name: 'Microsoft Azure',
        ID: 3
      },
      {
        Name: 'Adjustments',
        ID: 4
      }
    ];

    /*TPT Data preparation: Begin*/
    this.invoiceLineItemsByCategory = [];
    _.forEach(this.lineItemDetails, each => {
      if (each.ComboOfSaleTypeAndCategory === 'Service - Custom' && each.InvoiceLineItemTypeName !== 'Adjustments') {
        each.TPTCategory = 'Managed Support';
      } else if (each.ComboOfSaleTypeAndCategory === 'Product - Azure' || each.ComboOfSaleTypeAndCategory === 'Product - AzurePlan') {
        each.TPTCategory = 'Microsoft Azure';
      } else if (each.InvoiceLineItemTypeName === 'Adjustments') {
        each.TPTCategory = 'Adjustments';
        each.ProviderProductId = !each.ProviderProductId || each.ProviderProductId === '' ? 'Adjustments' : each.ProviderProductId;
      }
      else if ((each.Category === 'Custom' || each.Category === 'OnlineServices' || each.Category === 'Bundles') && each.ConsumptionType === 'Quantity') {
        each.TPTCategory = 'Licensing';
      } else if (each.Category === 'Custom' && each.ConsumptionType === 'Usage') {
        each.TPTCategory = 'Partner Usage';
      } else {
        each.TPTCategory = each.Category
      }
    });

    this.invoiceLineItemsByCategory = _.groupBy(this.lineItemDetails, 'TPTCategory');
    _.forEach(this.invoiceLineItemsByCategory, (value, key) => {
      this.invoiceLineItemsByCategory[key] = _.groupBy(this.invoiceLineItemsByCategory[key], function (item) {
        return item.ProviderProductId;
      });
    });

    this.invoiceLineItemsByProduct = [];
    _.forEach(this.invoiceLineItemsByCategory, (value, key) => {
      let invoiceLineItemAmtByCategory = 0;
      let postTaxAmountByCategory = 0;
      let preTaxAmountByCategory = 0;
      let products = _.map(value, (val, key) => {
        if (val && val.length > 0) {
          invoiceLineItemAmtByCategory += _.chain(val).map('InvoiceLineAmount').sum().value(); //Quantity * Unit Price
          postTaxAmountByCategory += _.chain(val).map('PostTaxAmount').sum().value(); //Quantity * Unit Price - Discount + Tax
          preTaxAmountByCategory += _.chain(val).map('PreTaxAmount').sum().value(); //Quantity * Unit Price - Discount
          _.map(val, each => {
            if (each.TaxName && each.TaxName != '' && each.TaxPercentage > 0) {
              let tax = _.find(this.tptTaxes, { 'TaxName': each.TaxName });
              if (!tax) {
                this.tptTaxes.push({
                  TaxName: each.TaxName,
                  TaxPercentage: each.TaxPercentage,
                  TaxableSubtotal: each.InvoiceLineAmount
                });
              }

              if (tax) {
                tax.TaxableSubtotal += each.InvoiceLineAmount;
              }
            }
          });
          return {
            ProviderProductId: key,
            ProductName: val[0].ProductName, //? val[0].ProductName.replace(/\(.*linked to.*\)/i, '') : '',
            //LinkedProductName: val[0].ProductName && val[0].ProductName.search('linked to') !== -1 ? val[0].ProductName.replace(/[^)]+(?![^(]*\))/, '').replace(/linked to|\)|\(/g, '') : '',
            TaxName: val[0].TaxName,
            TaxAmount: val[0].TaxAmount,
            ProductSequence: val[0].ProductSequence,
            TaxPercentage: key !== 'Adjustments' ? val[0].TaxPercentage : 0, //If the item is an adjustment not linked to any subscription, then we can't go by the taxability of first item.
            InvoiceLineAmount: _.chain(val).map('InvoiceLineAmount').sum().value(),  //Quantity * Unit Price
            UnitPrice: val[0].ConsumptionType !== 'Usage' ? val[0].EffectivePrice : val[0].UnitPrice,
            PreTax: _.chain(val).map('PreTaxAmount').sum().value(), //Quantity * Unit Price - Discount
            PostTax: _.chain(val).map('PostTaxAmount').sum().value(), //Quantity * Unit Price - Discount + Tax
            Products: val,
            ShowProducts: false,
            IsTaxable: val[0].IsTaxable
          };
        }
      });
      this.invoiceLineItemsByProduct.push({
        Category: key,
        TPTCategoryId: _.find(tptCategories, { Name: key }) ? _.find(tptCategories, { Name: key }).ID : 5,
        InvoiceLineItemAmtByCategory: invoiceLineItemAmtByCategory,  //Quantity * Unit Price
        PostTaxAmountByCategory: postTaxAmountByCategory, //Quantity * Unit Price - Discount + Tax
        PreTaxAmountByCategory: preTaxAmountByCategory, //Quantity * Unit Price - Discount
        ShowProducts: false,
        ProductSummaries: _.sortBy(products, 'ProductSequence')
      });
      this.invoiceLineItemsByProduct = _.sortBy(this.invoiceLineItemsByProduct, 'TPTCategoryId');
      //this.tptTaxes = _.uniq(this.tptTaxes, false, 'TaxName');
    })
    /*TPT Data preparation: End*/
  }

  ngOnChanges(changes: SimpleChanges): void {
    let lineItemDetailsChange = changes?.lineItemDetails?.currentValue;
    if (lineItemDetailsChange) {
      this.onLineItemDetailsChange();
    }

    let invoiceSubTaxesChange = changes?.invoiceSubTaxes?.currentValue;
    if (invoiceSubTaxesChange) {
      if (this.invoiceSubTaxes !== undefined && this.invoiceSubTaxes !== null && this.invoiceSubTaxes.length > 0) {
        this.invoiceSubTaxes = this.invoiceSubTaxes;
      }
    }
    this.loadComponent();
  }

  onLineItemDetailsChange() {
    if (this.templateName === 'tpt') {
      this.getInvoiceLineItemsForTPT();
    }
    if (this.lineItemDetails !== null && this.lineItemDetails !== undefined && this.lineItemDetails.length > 0) {
      this.showCostOnPartner = this.lineItemDetails[0].ShowCostOnPartner;
    }
    if (this.invoiceDetails !== undefined && this.invoiceDetails !== null) {
      this.showInvoiceSummaryInEntityCurrency = this.invoiceDetails.ShowInvoiceSummaryInEntityCurrency;
      this.conversionRateForEntity = this.invoiceDetails.ConversionRateForEntity;
      if (this.totalDiscountAmount !== undefined && this.totalDiscountAmount !== null) {
        this.totalDiscountAmountInEntityCurrency = this.totalDiscountAmount * this.conversionRateForEntity;
      }
      if (this.totalPostTaxAmount !== undefined && this.totalPostTaxAmount !== null) {
        this.totalPostTaxAmountInEntityCurrency = this.totalPostTaxAmount * this.conversionRateForEntity;
      }
    }
  }
}
