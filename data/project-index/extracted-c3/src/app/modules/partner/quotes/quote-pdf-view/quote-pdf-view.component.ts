import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { first, Subject, Subscription, takeUntil } from 'rxjs';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DomSanitizer } from '@angular/platform-browser';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { QuoteService } from '../quotes.service';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-quote-pdf-view',
  templateUrl: './quote-pdf-view.component.html',
  styleUrls: ['./quote-pdf-view.component.scss']
})
export class QuotePDFViewComponent extends C3BaseComponent implements OnInit, OnDestroy, OnChanges {
  
  @Input() selectedCustomerDetails: any;
  @Input() DisplayCustomerName: string;
  @Input() frmAddQuote_QuoteName: string;

  @Input() addressDetails: any[];
  @Input() QuoteContact: any;
  @Input() users: any[];
  @Input() quoteLineItemsData: any[];
  @Input() totalQuoteValue: number;
  @Input() DisplayTotalFinalSalePrice: number;
  @Input() totalTaxAmount: number;
  @Input() quoteLineItemsTotalPrice: number;
  @Input() totalDiscount: number;
  @Input() billingCycleSubtotals: { billingCycleName: string; subTotal: number; }[] = [];
  @Input() CommentsToBuyer: string;
  @Input() PurchaseTerms: string;
  @Input() AdditionalCustomerDetails: string;
  @Input() IsShowCounterSign: boolean;
  @Input() IsCounterSign: boolean;
  @Input() PDFlogobase64: string;
  @Input() CurrencySymbol: string;
  @Input() CurrencyDecimalPlaces: number;
  @Input() CurrencyThousandSeperator: string;
  @Input() CurrencyDecimalSeperator: string;
  @Input() currentDate: Date;
  @Input() frmAddQuote_ExpiresOn: string;
  @Input() PaymentTerms : string;
  @Input() CreateByDetails : any;
  @Input()  Ispdfview: any;
  @Input() C3Id: string;
  @Input() selectedAddressId: any;
  @Input() IsCurrentAddress: any;
  @Input() groupByBillingTerm: boolean = false;
  @Input() showPricesExcludeVAT: boolean = true;
  @Input() buyerAddressList: any[] = [];
  PoweredByCompanyName: string;
  AddressLine1: string;
  City: string;
  ZipCode: string;
  Country: string;
  State: string;
  ContactCompanyName: any;
  currentDate1 = new Date();
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();
  // selectedAddressId: number = 0;
  partnerAddressDetails: any;
  AddressLine2: string;
  IsAddressLoading : boolean;
  quotePDFLogoWidth: string ='0';
  quotePDFLogoAlignment: string;
  cleanedPurchaseTerms: any;
  cleanedPaymentTerms: any;
  cleanedCommentsToBuyer: any;
  cleanedAdditionalCustomerDetails: any;
  globalDateFormat :string

  

  constructor(
    private _clientSettingsService: ClientSettingsService,
    public _permissionService: PermissionService,
    public _router: Router,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private _domsanitizer: DomSanitizer,
    private _quotesService: QuoteService,
    private _cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
  }

  fnGetInnerText(htmlElement: any) {
    var a = document.createElement('p')
    a.innerHTML = htmlElement;
    return (a.innerText || a.textContent);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.cleanedPurchaseTerms = this._domsanitizer.bypassSecurityTrustHtml(this.PurchaseTerms);
    this.cleanedPaymentTerms = this._domsanitizer.bypassSecurityTrustHtml(this.PaymentTerms);
    this.cleanedCommentsToBuyer = this._domsanitizer.bypassSecurityTrustHtml(this.CommentsToBuyer);
    this.cleanedAdditionalCustomerDetails = this._domsanitizer.bypassSecurityTrustHtml(this.AdditionalCustomerDetails);

    this._cdRef.detectChanges();

    if (changes.C3Id && changes.C3Id.currentValue) {
      this.getAddressDetails(this.C3Id);
    }

    if (changes.selectedAddressId && changes.selectedAddressId.currentValue) {
      this.selectedAddressId = changes.selectedAddressId.currentValue;
      this.getAddressDetails(this.C3Id);
    }
  }

  ngOnInit(): void {
    const subscription = this._clientSettingsService.getData().pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
        this.AddressLine1 = data?.Data?.AddressLine1;
        this.AddressLine2 = data?.Data?.AddressLine2;
        this.City = data?.Data?.City;
        this.ZipCode = data?.Data?.ZipCode;
        this.Country = data?.Data?.Country;
        this.State = data?.Data?.State;
        this.globalDateFormat = this._appService.$rootScope.dateFormat
    });
    this.getApplicationData();
    this._subscriptionArray.push(subscription);
  }

  // ngOnChanges(changes: SimpleChanges) {
  //   if (changes.C3Id && changes.C3Id.currentValue) {
  //     this.getAddressDetails(this.C3Id);
  //   }
  // }

  getAddressDetails(C3Id: any) {
    const subscription2 = this._quotesService.getPartnerAddress('Customer', this.C3Id).pipe(first(), takeUntil(this.destroy$)).subscribe((data: any) => {
      if (this.selectedAddressId !== 0) {
        this.partnerAddressDetails = data.Data?.find((item: any) => item.AddressId === this.selectedAddressId);
      } else if (this.selectedAddressId === 0) {
        this.partnerAddressDetails = data.Data?.find((item: any) => item.BillFromAddressId === true) ?? data.Data?.find((item: any) => item.IsDefault === true);
      }

      if(this.partnerAddressDetails === undefined || this.partnerAddressDetails === null){
              this.partnerAddressDetails = this.IsCurrentAddress ;
          }
      this.AddressLine1 = this.partnerAddressDetails?.Line1;
      this.AddressLine2 = this.partnerAddressDetails?.Line2
      this.City = this.partnerAddressDetails?.City;
      this.ZipCode = this.partnerAddressDetails?.Zip;
      this.Country = this.partnerAddressDetails?.Country;
      this.State = this.partnerAddressDetails?.State;
    });
    this._subscriptionArray.push(subscription2);
  }

  getApplicationData() {
   const subscription3 = this._appService.getApplicationData().subscribe((response: any) => {
      this.quotePDFLogoWidth = response.Data.QuotePDFLogoWidth; 
      this.quotePDFLogoAlignment = response.Data.QuotePDFLogoAlignment;
      this.ContactCompanyName = response?.Data?.ContactCompanyName;
    });
      this._subscriptionArray.push(subscription3);
  }
  
  hasCheckedAddress(list: any[]): boolean {
  return !!list && list.some(a => a.IsChecked);
}



getTranslatedFullDate(input: string | Date): string {
 //If required we can use it for translating in future.
  const date = input instanceof Date ? input : new Date(input);

  if (isNaN(date.getTime())) return '';

  const day = date.getDate();
  const year = date.getFullYear();

  const monthKey = date.toLocaleString('en-US', { month: 'long' }).toUpperCase(); 
  const translatedMonth = this.translateService.instant('TRANSLATE.' + monthKey); 

  return `${translatedMonth} ${day}, ${year}`;
}


        getLineItemUnitPrice(row: any): number {
    if (row?.BillingCycleName === 'Monthly') {
      return Number(row.DisplayOriginlaSalePrice);
    }

    if (row?.BillingCycleName === 'Annual') {
      return Number(row.DisplayOriginlaSalePrice);
    }

    return Number(row?.DisplayUnitPrice ?? row?.UnitPrice ?? row?.DisplayOriginlaSalePrice ?? 0);
  }

  getLineItemDiscountAmount(row: any): number {
    return Number(row?.DiscountAmount ?? 0);
  }

  getLineItemTotalPrice(row: any): number {
    return Number(row?.TotalPrice ?? 0);
  }

    getLineItemVatPercent(row: any): number {
    return Number(this.selectedCustomerDetails?.TaxPercentage ?? 0);
  }


    getLineItemTotalPriceInclVat(row: any): number {
    return Number(row?.TotalPrice ?? 0) + this.getLineItemVatAmount(row);
  }


    getLineItemVatAmount(row: any): number {
    return Number(row?.TotalPrice ?? 0) * (Number(this.selectedCustomerDetails?.TaxPercentage ?? 0) / 100);
  }


  getLineItemSubscriptionTerm(row: any): string {
    return row?.SubscriptionTermText ?? this.formatSubscriptionTerm(row);
  }

  formatSubscriptionTerm(product: any): string {
    if (!product || product.Validity == null) {
      return '';
    }

    const count = Number(product.Validity) || 0;
    const rawType = (product.ValidityType || '').trim();
    const normalizedType = rawType.replace(/\(s\)/gi, '').trim();

    if (!normalizedType) {
      return `${count}`;
    }

    const lowerType = normalizedType.toLowerCase();
    const pluralSuffix = count === 1 ? '' : 's';

    if (lowerType === 'month' || lowerType === 'year') {
      return `${count} ${normalizedType}${pluralSuffix}`;
    }

    return `${count} ${normalizedType}${count === 1 ? '' : pluralSuffix}`;
  }

  getBillingGroupLabel(row: any): string {
    return this.formatSubscriptionTerm(row) || 'Custom';
  }

  getGroupSubtotal(groupName: string, items: any[]): number {
    const matchingSubtotal = this.billingCycleSubtotals?.find(
      subtotal => subtotal.billingCycleName === groupName
    );

    if (matchingSubtotal) {
      return Number(matchingSubtotal.subTotal);
    }

    return items.reduce((total: number, item: any) => total + this.getDisplayLineItemTotal(item), 0);
  }

  normalizeBillingCycleLabel(name: string): string {
    if (!name) {
      return 'Custom';
    }

    if (name.toLowerCase() === 'annual') {
      return 'Yearly';
    }

    return name;
  }

  getGroupedQuoteLineItems(): { groupName: string; items: any[]; itemCount: number; subtotal: number }[] {
    const groups: { [key: string]: any } = {};

    this.quoteLineItemsData.forEach((item: any) => {
      const key = this.formatSubscriptionTerm(item) || 'Custom';

      if (!groups[key]) {
        groups[key] = {
          groupName: key,
          items: [],
          itemCount: 0,
          subtotal: 0
        };
      }

      groups[key].items.push(item);
      groups[key].itemCount = groups[key].items.length;
    });

    return Object.values(groups).map((group: any) => ({
      groupName: group.groupName,
      items: group.items,
      itemCount: group.itemCount,
      subtotal: this.getGroupSubtotal(group.groupName, group.items)
    }));
  }

  getSummaryRows(): { label: string; amount: number }[] {
    if (this.billingCycleSubtotals?.length > 0) {
      return this.billingCycleSubtotals.map(subtotal => ({
        label: `Subtotal (${this.normalizeBillingCycleLabel(subtotal.billingCycleName)})`,
        amount: subtotal.subTotal
      }));
    }

    if (!this.groupByBillingTerm) {
      return [{
        label: 'Subtotal',
        amount: this.quoteLineItemsTotalPrice
      }];
    }

    return this.getGroupedQuoteLineItems().map(group => ({
      label: `Subtotal (${group.groupName})`,
      amount: group.subtotal
    }));
  }

  getDisplayLineItemVatPercent(row: any): number {
    return !this.showPricesExcludeVAT ? this.getLineItemVatPercent(row) : 0;
  }

  getDisplayLineItemVatAmount(row: any): number {
    return !this.showPricesExcludeVAT ? this.getLineItemVatAmount(row) : 0;
  }

  getDisplayLineItemTotal(row: any): number {
    return this.getLineItemTotalPrice(row);
  }

  getGrandTotalAmount(): number {
    return this.totalQuoteValue || 0;
  }


  getDisplayGrandTotalLabel(): string {
    return `Grand Total (${this.showPricesExcludeVAT ? 'Excl. VAT' : 'Incl. VAT'})`;
  }

  getDisplayQuoteLineItemsTotalPrice(): number {
    return this.quoteLineItemsTotalPrice || 0;
  }

    getTotalDiscountAmount(): number {
    return this.totalDiscount || 0;
  }


  trackByIndex(index: number, item: any): any {
    return index;
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
  
}

