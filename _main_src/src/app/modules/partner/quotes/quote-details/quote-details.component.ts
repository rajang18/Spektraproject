import { ChangeDetectorRef, Component, OnDestroy, OnInit, Renderer2} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { distinctUntilChanged, of, Subject , takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { QuoteService } from '../quotes.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import moment from 'moment';
import { find, take } from 'lodash';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { UserContextService } from 'src/app/services/user-context.service';
import { StepperComponent } from 'src/app/_c3-lib/kt/components'
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbDateStruct, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { QuoteCustomLineItemComponent } from '../quote-custom-line-item/quote-custom-line-item.component';
import { QuoteLineItemPopUpComponent } from '../quote-line-item-pop-up/quote-line-item-pop-up.component';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { QuoteAddnewcustomerComponent } from '../quote-addnewcustomer/quote-addnewcustomer.component';
import { QuoteReviewComponent } from '../quote-review/quote-review.component';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { CartService } from 'src/app/modules/customers/services/cart.service';
import { PartnerAddressDetailsPopupComponent } from 'src/app/modules/standalones/partner-address-details-popup/partner-address-details-popup.component';
import { AccountManagerService } from 'src/app/services/account-manager.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { Department } from '../../settings/models/user-management';

@Component({
    selector: 'app-quote-details',
    templateUrl: './quote-details.component.html',
    styleUrls: ['./quote-details.component.scss']
})
export class QuoteDetailsComponent extends C3BaseComponent implements OnInit,OnDestroy {
  
  frmWizardOne: FormGroup = new FormGroup({});
  frmWizardTwo: FormGroup = new FormGroup({});
  frmWizardFive: FormGroup = new FormGroup({});
  frmWizardFour: FormGroup = new FormGroup({});
  frmWizardThree: FormGroup = new FormGroup({});
  customers = [];
  users: any;
  partnerLogos: any;
  activeTab = "four";
  QuoteStatus = null;
  PageMode : any;
  localStorageNames = [];
  selectedCustomerDetails : any = {};
  currentC3CustomerId = null;
  branchId:any = null;
  EntityId:any = null;
  QuoteContact:any = [];
  QuoteContactList = [];
  entityName = null;
  recordId = null;
  addressDetails = [];
  CurrencyCodes = [];
  CurrencyCode = "";
  CurrencyThousandSeperator: any = ',';
  CurrencyDecimalSeperator: any = '.';
  CurrencyDecimalPlaces = 2;
  CurrencySymbol: any = '$';
  customerId = 0;
  SelectAllColumn = false;
  IsShowCounterSign = false;
  noSignature = 'noSignature';
  includeSignature = 'includeSignature';
  allCustomers: any;
  allQuotes: any[] = [];
  branchList: any = [];
  PDFlogobase64 :any;
  selectedUserList: any[] = [];
  accountManagersData: any = [];
  maxChars = 500;
  currentLength = 0;
  showMaxError: boolean = false;
  permissions = {
    SaveQuote: 'Denied',
    ApproveQuote: 'Denied',
    HasGetAccountManagerDetails: 'Denied'

  };
  default = 'default';
  custom = 'custom';
  stepper: StepperComponent = null; 
  planList: any[] = [];
  isNewCustomer: [false];
 isNewCustomerFlag: boolean = false; 
 private _previousPlanIds: any[] = [];
  allowDrag : boolean = false;
    today: Date = new Date();
  // private _customerListingService: any;
    get todayDate(): NgbDateStruct {
      const tomorrow = new Date(this.today);
      tomorrow.setDate(tomorrow.getDate() + 1); // handles month/year rollover automatically

      return {
        year: tomorrow.getFullYear(),
        month: tomorrow.getMonth() + 1,
        day: tomorrow.getDate()
      };
    }
    
  config =  {
    height: 102,
    focus: false,
    airMode: false,
    disableDragAndDrop: true,
    toolbar: [
      ['edit', ['undo', 'redo']],
      ['style', ['bold']],
      ['alignment', ['ul', 'ol']],
    ],
};

config1: any = {
  height: 103,
  focus: false,
  airMode: false,
  disableDragAndDrop: true,
  
  toolbar: [
    ['edit', ['undo', 'redo']],
    ['style', ['bold']],
    ['alignment', ['ul', 'ol']],
  ],

  callbacks: {
    onKeydown: (e: any) => {
      const text = e.currentTarget.innerText || '';
      // Allow Backspace/Delete
      if (
        text.length >= 500 &&
        e.keyCode !== 8 &&
        e.keyCode !== 46
      )  {
        this.showMaxError = true;
        e.preventDefault();
      } else {
        this.showMaxError = false;
      }
    },
    onPaste: (e: any) => {
      const clipboardData = e.originalEvent.clipboardData.getData('Text');
      const currentText = e.currentTarget.innerText || '';
       if ((currentText.length + clipboardData.length) > 500) {
        this.showMaxError = true;
        e.preventDefault();
      } else {
        this.showMaxError = false;
      }
    }
  }
};

  addressDetailsData: any;
  addressFilteredData: any;
  customerName: any;
  taxType: any;
  ContactCompanyName:any;
  AddressLine1: any;
  City: any;
  ZipCode:any;
  Country: any;
  State: string;
  QuoteVersionId: any;
  productsAndLinkedProducts: any;
  quoteLineItemsList: any =[];
  quoteLineItemsData: any = [];
  initialLineItemPlanProductIds: any[] = [];

  QuoteId: any;
  approverEmail: any;
  quoteURL: any;
  CommentsToBuyer: any;
  AdditionalCustomerDetails:any;
  PurchaseTerms: any;
  PaymentTerms : any;
  IsSign: string;
  IsCounterSign: any;
  statusName: any;
  quoteLineItemSubTotal: number;
  totalQuoteValue: number;
  totalDiscount: number;
  productSubTotal: number;
  DisplayTotalFinalSalePrice: number;
  quoteLineItemsTotalPrice: number = 0;
  groupByBillingTerm: boolean = false;
  groupedQuoteLineItems: any[] = [];
  billingCycleSubtotals: { billingCycleName: string; subTotal: number; }[] = [];
  showPricesExcludeVAT: boolean = true;
  totalTaxAmount: number = 0;
  // When true, VAT columns should be displayed because there's at least one custom taxable line item
  shouldShowVatColumnsDueToCustomTaxable: boolean = false;
  draggedQuoteLineItem: any = null;
  collapsedGroupNames: { [key: string]: boolean } = {};
  linkedProductTaxAmount: number;
  deletedQuoteLineItemIds: any[] =[];
  localStorageQuoteKeyNameParsed: any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
currentDate: Date;
frmAddQuote_ExpiresOn: any;
frmAddQuote_QuoteName: string;
  frmAddQuote_Template: string;
  isFirstPopUp: boolean;
  isSavingQuotedisabled: boolean;
  isUnsavedChange: boolean = false;
  saveQuoteId: null;
  saveQuoteUrl: null;
  formGroupArray : any = [];
  prevCustomerId:any='';
  stateVisited = {
    2: false,
    3: false,
    4: false,
    5: false,
    6: false
  };
  CompletedStateCount = 0;
  isUnsaveChange: boolean;
  QuotesStatus: any; 
  globalDateFormat: any ='';
  disableCondition =false
  // quoteVersionId = $stateParams.QuoteVersionId;
  //  this.quoteVersionId = $stateParams.QuoteVersionId;

    forms: { [key: string]: FormGroup } = {
        WizardOne: this.frmWizardOne,
        WizardTwo: this.frmWizardTwo,
        WizardFive: this.frmWizardFive,
        WizardFour: this.frmWizardFour,
        WizardThree: this.frmWizardThree

    // Add other forms here
  };
  presenttab: number = 0;
  defaultEmail : string = null;
  defaultPurchaseTerms : string = null;
  defaultPaymentTerms : string = null;
  paymenTermDisableOption : boolean = false;
  purchaseTermDisableOption : boolean = false;
  createByDetails : any = null;
  quoteSellerCompanyDetails: any = null;
  partnerAddressDetails: any;
  AddressLine2: any;
  selectedAddressId: number = 0;
  IsCurrentAddress:any;
  BranchEntityName:any;

  get displayCustomerNameForPdf(): string {
    if (this.frmWizardOne?.get('isNewCustomer')?.value === true) {
    return this.frmWizardOne?.get('newCustomerName')?.value || '';
  }
    const branchId = this.frmWizardOne?.get('branch_id')?.value;
    const selectedBranch = this.branchList?.find((branch: any) => branch.RecordIntId === branchId);

    if (selectedBranch) {
      return `${selectedBranch.RecordName || ''}`;
    }

    return this.selectedCustomerDetails?.CustomerName || '';
  }

  savedCustomPaymentTerms : any = null;
  savedDefaultPaymentTerms : any = null;
  savedCustomPurchaseTerms : any = null;
  savedDefaultPurchaseTerms: any = null;
  QuoteCustomerDetails: any = [];
  buyerAddressList: any[] = [];
  

    constructor(
        private cdRef: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        public _router: Router,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService,
        private userContext: UserContextService,
        private translateService: TranslateService,
        private _notifierService: NotifierService,
        private _toastService: ToastService,
        private pageInfo: PageInfoService,
        private _fileService: FileService,
        private _commonService: CommonService,
        private renderer: Renderer2,
        private _cdRef: ChangeDetectorRef,
        private _quotesService: QuoteService,
        private _clientSettingsService: ClientSettingsService,
        private _applicationSettings: AppSettingsService,
        private _modalService: NgbModal,
        private _unsavedChangesService: UnsavedChangesService,
        private _appService: AppSettingsService,
        private c3RouterService: C3RouterService,
        public _cartService: CartService,
        public _accountManagerService: AccountManagerService,
        private _customerListingService:CustomersListingService
    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        this.navigation = this._router.getCurrentNavigation();
        const subscription = this._applicationSettings.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
            this.PDFlogobase64 = data?.Data?.GetImageAsBase64;
            this.ContactCompanyName = data?.Data?.ContactCompanyName;
        })
        this._subscriptionArray.push(subscription);
        const subscription1 = this._clientSettingsService.getData().pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
            this.AddressLine1 = data?.Data?.AddressLine1;
            this.City = data?.Data?.City;
            this.ZipCode = data?.Data?.ZipCode;
            this.Country = data?.Data?.Country;
            this.State = data?.Data?.State;
        });

        this._applicationSettings.getPartnerSettings(this.entityName,'GeneralSettings').subscribe((response : any)=>{
        this.defaultEmail = response?.Data?.find(configuration => configuration.Name == 'DefaultQuoteSender')?.Value;
        this.defaultPurchaseTerms = response?.Data?.find(configuration => configuration.Name == 'QuotePurchaseTerms')?.Value;
        this.defaultPaymentTerms = response?.Data?.find(configuration => configuration.Name == 'QuotePaymentTerms')?.Value;
        if(this.QuoteVersionId == 0){
          this.onPurchasTermsOptionClick('custom');
          this.onPaymentTermsOptionClick('custom');
        }
        
        //this.getQuoteUserDetails();
        setTimeout(()=> {
          this.getQuoteUserDetails();
        },0)
      })
        this._subscriptionArray.push(subscription1);

        this._quotesService.dictOfQuoteLineItems = {}

    this.frmWizardOne = this._formBuilder.group({
      isNewCustomer: [false],
      newCustomerName: ['',[Validators.maxLength(255)]],
      planIds: [[]],
      currencyCode: [''],
      customer_id: ['', Validators.required],
      branch_id: [''],
      frmAddQuote_Template: [''],
      quote_puchasedescription: [''],
      expireDate: ['', Validators.required],
      quote_description: [''],
      quote_customer_additional_details: [''],
      quote_paymentsterm : [''],
      purchaseTermsOption : ['custom'],
      paymentTermsOption : ['custom'],
      frmAddQuote_QuoteName :['', [Validators.required,Validators.maxLength(150)]]
    });

        this.frmWizardTwo = this._formBuilder.group({
            SelectAllColumn: [''],
            checkbox1: [''],
            customerNameToUpdate: [''],
            checkbox2: [''],
        });


    this.frmWizardThree = this._formBuilder.group({
      UserNameUpdate:  [''],
      SelectedEmailType : [''],
      Account_Manager_Id : ['']
    });

        this.frmWizardFive = this._formBuilder.group({
            radios4: ['', Validators.required],
            Checkboxes1: [''],
        });

        this.frmWizardFour = this._formBuilder.group({
            Quantity: [null]
        });

        this.QuoteVersionId = this.navigation?.extras.state?.QuoteVersionId;
        this.PageMode = this.navigation?.extras.state?.pageType;
        this.QuotesStatus = this.navigation?.extras.state?.QuotesStatus;
        /*
          this.QuoteVersionId = this._router.getCurrentNavigation()?.extras.state?.QuoteVersionId;
          this.PageMode = this._router.getCurrentNavigation()?.extras.state?.pageType;
          this.QuotesStatus = this._router.getCurrentNavigation()?.extras.state?.QuotesStatus;
  
        */

        if (this.PageMode === null || this.PageMode == undefined) {
            _router.navigate(['partner/quotelist']);
        }
        Object.values(this.forms).forEach(form => this.trackFormChanges(form));

      this.formGroupArray = [this.frmWizardOne,this.frmWizardTwo,this.frmWizardThree,this.frmWizardFour,this.frmWizardFive];
    
  }


  ngOnInit(): void { 
    this.globalDateFormat = this._appService.$rootScope.dateFormat;

        StepperComponent.bootstrap();
        this.createStepperInstances("#kt_stepper_example_basic");
        this.stepper.on("kt.stepper.next", (stepper) => {
            this.nextStep();
        });
        this.stepper.on("kt.stepper.previous", (stepper) => {
            this.prevStep();
        });
        this.disblecustomer();
        this.checkDisableCondition()
        this.getPlanList();
        this.handleNewCustomerValidation();
        this.frmWizardOne.get('currencyCode')?.valueChanges
  .pipe(takeUntil(this.destroy$))
  .subscribe((selectedCode: string) => {
    if (selectedCode && this.CurrencyCodes?.length > 0) {
      const selectedCurrency = this.CurrencyCodes.find(
        (c: any) => c.CurrencyCode === selectedCode
      );

      if (selectedCurrency) {
        this.CurrencyCode = selectedCurrency.CurrencyCode;
        this.CurrencySymbol = selectedCurrency.CurrencySymbol;
        this.CurrencyDecimalPlaces = selectedCurrency.CurrencyDecimalPlaces;
        this.CurrencyThousandSeperator = selectedCurrency.CurrencyThousandSeperator;
        this.CurrencyDecimalSeperator = selectedCurrency.CurrencyDecimalSeperator;

        this.CalculateQuoteLineItemTotal(this.quoteLineItemsList?.data || []);
      }
    }
  });
        this.entityName = this._commonService.entityName;

        if (this._commonService.entityName === 'Partner') {
            this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.QUOTE_BREADCRUMB_QUOTE_ADD"), true);
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'QUOTE_BREADCRUMB_QUOTE_LIST', 'QUOTE_BREADCRUMB_QUOTE_ADD']);
        }

    else if(this._commonService.entityName === 'Reseller'){
      this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.QUOTE_BREADCRUMB_QUOTE_ADD"), true);
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','QUOTE_BREADCRUMB_QUOTE_LIST','QUOTE_BREADCRUMB_QUOTE_ADD']);
    }
    this.createByDetails = {
      Name : '',
      EmailAddress : ''
    }
    if (this.PageMode && this.PageMode.toLowerCase() === this.cloudHubConstants.ADD) {
      const today = moment();
        let expiryMoment = moment().endOf('month');
         if (today.isSame(expiryMoment, 'day')) {
            expiryMoment = moment().add(1, 'month').endOf('month');
        }
        const expires = this.getNgbDateStruct(expiryMoment);
        this.frmWizardOne.get('expireDate')?.setValue(expires);
        const expireDate = {year: expires.year, month: expires.month - 1,day: expires.day};
        this.frmAddQuote_ExpiresOn = this.formatDateObject(expireDate);
    }
    this.frmWizardOne.get('branch_id')?.disable();
    this.frmWizardOne.get('branch_id')?.value;
  }

    getPlanList(){
           this._customerListingService.getPlansForCustomers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
           this.planList = response?.Data || [];
        });
}  


handleNewCustomerValidation() {
  this.frmWizardOne.get('isNewCustomer')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isChecked: boolean) => {

    const customerCtrl = this.frmWizardOne.get('customer_id');
    const branchCtrl = this.frmWizardOne.get('branch_id');
    const newCustomerCtrl = this.frmWizardOne.get('newCustomerName');
    const planCtrl = this.frmWizardOne.get('planIds');
      const currencyCtrl = this.frmWizardOne.get('currencyCode');

    if (isChecked) {
      this.isNewCustomerFlag = true;
      customerCtrl?.clearValidators();
      newCustomerCtrl?.setValidators([Validators.required]);
      planCtrl?.setValidators([Validators.required]);
      currencyCtrl?.setValidators([Validators.required]);
      branchCtrl?.disable();
      if (this.PageMode !== 'Edit' && this.PageMode !== 'View') {
        customerCtrl?.reset(null);
        branchCtrl?.reset(null);
        this.currentC3CustomerId = null;
        this.branchId = null;
        this.selectedCustomerDetails = null;
        this.addressDetails = null;
        this.addressDetailsData = null;
        this.QuoteContact = [];
        this.QuoteCustomerDetails = [];
      }
    } else {
      this.isNewCustomerFlag = false;
      newCustomerCtrl?.clearValidators();
      planCtrl?.clearValidators();
      customerCtrl?.setValidators([Validators.required]);
      currencyCtrl?.clearValidators();     
      currencyCtrl?.updateValueAndValidity(); 

      if (this.PageMode !== 'Edit' && this.PageMode !== 'View') {
        newCustomerCtrl?.reset(null);
        customerCtrl?.setValue(null);
        branchCtrl?.setValue('');
        this.currentC3CustomerId = null;
        this.selectedCustomerDetails = null;
        this.resetQuoteLineItems();
          this.resetAddressData();
        this.buyerAddressList = [];
      }
       else {
        branchCtrl?.disable();
      }
    }

    customerCtrl?.updateValueAndValidity();
    branchCtrl?.updateValueAndValidity();
    newCustomerCtrl?.updateValueAndValidity();
    planCtrl?.updateValueAndValidity();
    currencyCtrl?.updateValueAndValidity();
  });
}


private resetQuoteLineItems(): void {
  this.quoteLineItemsData = [];
  this.quoteLineItemsList.data = [];
  this.productsAndLinkedProducts = [];
  this.groupedQuoteLineItems = [];
  this.billingCycleSubtotals = [];
  this.deletedQuoteLineItemIds = [];
  this._previousPlanIds = [];
  this.CalculateQuoteLineItemTotal([]);
  this.cdRef.detectChanges();
}
private resetAddressData(): void {
  this.buyerAddressList = [];
  this.addressDetails = [];
  this.addressDetailsData = null;
  this.addressFilteredData = null;
  this.cdRef.detectChanges();
}

    getAddressDettails(C3Id:any){
      let customerC3Id = C3Id ?? null;
        const subscription2 = this._quotesService.getPartnerAddress('Customer', customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
            if(this.selectedAddressId !== 0){
                this.partnerAddressDetails = data.Data?.find((item : any) => item.AddressId === this.selectedAddressId);
            }else if(this.selectedAddressId === 0){
                this.partnerAddressDetails = 
                 data.Data?.find((item: any) => item.BillFromAddressId === true) 
                 ?? data.Data?.find((item: any) => item.IsDefault === true);
                            }
            if(this.partnerAddressDetails === undefined || this.partnerAddressDetails === null){
              // this.partnerAddressDetails =  data.Data?.find((item: any) => item.IsDefault === true);
              this.partnerAddressDetails = this.IsCurrentAddress ;
            }
            this.AddressLine1 = this.partnerAddressDetails?.Line1;
            this.AddressLine2 = this.partnerAddressDetails?.Line2
            this.City = this.partnerAddressDetails?.City;
            this.ZipCode = this.partnerAddressDetails?.Zip;
            this.Country = this.partnerAddressDetails?.Country;
            this.State = this.partnerAddressDetails?.State;
            this.cdRef.detectChanges();
        });
        this._subscriptionArray.push(subscription2);
    }

    checkDisableCondition() {
        this.disableCondition = [this.cloudHubConstants.QUOTE_LIST_STATUS_APPROVED, this.cloudHubConstants.QUOTE_LIST_STATUS_EXPIRED, this.cloudHubConstants.QUOTE_LIST_STATUS_DELETED, this.cloudHubConstants.QUOTE_LIST_STATUS_ORDER_PROCESSED].includes(this.QuoteStatus) || this.PageMode === 'View';

    if (this.disableCondition) {
      this.frmWizardOne.get('frmAddQuote_Template')?.disable();
      this.frmWizardOne.get('customer_id')?.disable();
      this.frmWizardOne.get('branch_id')?.disable();
      this.frmWizardOne.get('frmAddQuote_QuoteName')?.disable();
      this.frmWizardOne.get('expireDate')?.disable();
      this.frmWizardFive.get('radios4')?.disable();
      this.frmWizardFive.get('Checkboxes1')?.disable();
      this.frmWizardOne.get('purchaseTermsOption')?.disable();
      this.frmWizardOne.get('paymentTermsOption')?.disable();
      this.frmWizardThree.get('SelectedEmailType')?.disable();
      // Disable the input field
    } else {
      this.frmWizardOne.get('frmAddQuote_Template')?.enable();
      this.frmWizardOne.get('frmAddQuote_QuoteName')?.enable();
      this.frmWizardOne.get('expireDate')?.enable();
      this.frmWizardFive.get('radios4')?.enable();
      this.frmWizardFive.get('Checkboxes1')?.enable(); // Enable the input field
      this.frmWizardOne.get('purchaseTermsOption')?.enable();
      this.frmWizardOne.get('paymentTermsOption')?.enable();
      this.frmWizardThree.get('SelectedEmailType')?.enable();
    }
    this._cdRef.detectChanges();
  }
  
  disblecustomer() {
  if (this.PageMode === 'Edit') {
    this.frmWizardOne.get('customer_id')?.disable();
    this.frmWizardOne.get('branch_id')?.disable();
    this.frmWizardOne.get('isNewCustomer')?.disable();
    if (this.frmWizardOne.get('isNewCustomer')?.value === true) {
      this.frmWizardOne.get('newCustomerName')?.disable();
      this.frmWizardOne.get('currencyCode')?.disable();
      this.frmWizardOne.get('planIds')?.enable(); 
    }
  } else if (this.PageMode === 'View') {
    this.frmWizardOne.get('customer_id')?.disable();
    this.frmWizardOne.get('branch_id')?.disable();
    this.frmWizardOne.get('isNewCustomer')?.disable();
    if (this.frmWizardOne.get('isNewCustomer')?.value === true) {
      this.frmWizardOne.get('newCustomerName')?.disable();
      this.frmWizardOne.get('currencyCode')?.disable();
      this.frmWizardOne.get('planIds')?.disable();
    }
  } else {
    this.frmWizardOne.get('customer_id')?.enable();
    this.frmWizardOne.get('branch_id')?.enable();
  }
}
  onFormChange() {
    // this.selectedCustomer = this.frmWizardOne.get('customer_id')?.value;
    this.frmAddQuote_Template = this.frmWizardOne.get('frmAddQuote_Template')?.value;
    this.frmAddQuote_QuoteName = this.frmWizardOne.get('frmAddQuote_QuoteName')?.value;
    this.branchId = this.frmWizardOne.get('branch_id')?.value;
      const selectedBranch = this.branchList.find((branch: any) => branch.RecordIntId === this.branchId);
      
      if (selectedBranch) {
         this.EntityId = selectedBranch.EntityId; 
      }
    const validDate = this.frmWizardOne.value.expireDate;
    if (validDate) {
    let expireDate={year:validDate.year,month:validDate.month-1,day:validDate.day}
    this.frmAddQuote_ExpiresOn =this.formatDateObject(expireDate);
  }
    this.CommentsToBuyer = this.frmWizardOne.get('quote_description')?.value;
    this.AdditionalCustomerDetails = this.frmWizardOne.get('quote_customer_additional_details')?.value;
    this.PurchaseTerms = this.frmWizardOne.get('quote_puchasedescription')?.value;
    const checkboxes1Value = this.frmWizardFive.get('Checkboxes1')?.value;
    this.IsCounterSign = checkboxes1Value ? true : false;
    this.PaymentTerms = this.frmWizardOne.get('quote_paymentsterm')?.value;
    this.cdRef.detectChanges();
  }

    getFormControlValue(form: AbstractControl, controlName: string) {
        return form?.get(controlName)?.value;
    }

    getFormControl(form: AbstractControl, controlName: string) {
        return form?.get(controlName);
    }

    editRow(row) {
        row.IsEdit = true;
        this.frmWizardTwo.get('customerNameToUpdate').setValue(row.FullName);
    }

  nextStep() {
    const customer_id = this.frmWizardOne.get('customer_id')?.value;
    const branchId = this.frmWizardOne.get('branch_id')?.value;
      if (customer_id && !branchId && this.PageMode.toLowerCase() == this.cloudHubConstants.ADD) {
          const hasDuplicateQuote = this.allQuotes.some(quote => quote.C3Id === customer_id && quote.EntityId === null && quote.RecordId === null);
        if (hasDuplicateQuote) {
           this._toastService.error(
           this.translateService.instant('TRANSLATE.QUOTE_ERROR_CUSTOMER_NOT_UNIQUE'));
          return;
        }
      }
    let index = this.stepper.getCurrentStepIndex();
    this.presenttab = index;
    let form: FormGroup = this.formGroupArray[index - 1];
    form.markAllAsTouched();
    if (index == 1) {
      form = this.frmWizardOne;
      if (this.frmWizardOne.get('frmAddQuote_QuoteName')?.value.length > 150) {
        this._toastService.error(
          this.translateService.instant('TRANSLATE.QUOTE_NAME_MAXLENGTH_ERROR_MESSAGE'));
        return;
      }
      
    }
    else if (index == 2) {
      form = this.frmWizardTwo;
      if (this.QuoteContact.filter(x => x.IsChecked == true).length > 3) {
        this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_CONTACTS_MAX_VALIDATION_ERROR'));
        return;
      }
       if (this.isNewCustomerFlag) {
    const checkedAddress = this.buyerAddressList?.find(a => a.IsChecked);
    if (!this.buyerAddressList || this.buyerAddressList.length === 0 || !checkedAddress) {
      this._toastService.error(
        this.translateService.instant('TRANSLATE.QUOTE_ADDRESS_REQUIRED_ERROR'));
      return;
    }
  }

      if (!this.stateVisited[2]) {
        this.CompletedStateCount++;
        if(this.QuoteVersionId == 0 && this.stateVisited[2] == false){
          this.onEmailOptionClick('loggedInUser');
        }
        this.stateVisited[2] = true;
      }
    }
    else if (index == 3) {
      form = this.frmWizardThree;
      if (!this.stateVisited[3]) {
        this.CompletedStateCount++;
        this.stateVisited[3] = true;
      }
      if(!this.frmWizardThree.get('Account_Manager_Id').value && this.frmWizardThree.get('SelectedEmailType')?.value == 'selectedAccountManager'){
        this._toastService.error(
           this.translateService.instant('TRANSLATE.QUOTE_ERROR_TEXT_FOR_EMPTY_ACCOUNT_MANAGER'));
          return; 
       }
     
    }
    else if (index == 4) {
      form = this.frmWizardFour;
      if (this.quoteLineItemsData.length == 0 && this.PageMode != 'View') {
        this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_LINE_ITEM_VALIDATION_ERROR'));
        return;
      }
      if (this.quoteLineItemsData.length > 50) {
        this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_LINE_ITEM_MAX_VALIDATION_ERROR'));
        return;
      }
      if (!this.stateVisited['four']) {
        this.CompletedStateCount++;
        this.stateVisited['four'] = true;
      }
      if (this.quoteLineItemsData) {
        this.isUnsaveChange = false;
        this.quoteLineItemsData.forEach((data) => {
          if (data.isEditing === true) {
            this.isUnsaveChange = true;
          }
        });      
        if (this.isUnsaveChange) {
          this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_LINE_ITEM_VALIDATION_ERROR_SAVE_QUOTE_LINE_ITEM_CHNAGE'));
          return;
        }
      }
    }
    else if (index == 5) {
      form = this.frmWizardFive;
      if (!this.stateVisited[5]) {
        this.CompletedStateCount++;
        this.stateVisited[5] = true;
      }
    }
    if (form.valid || this.PageMode == 'View') {
        this.stepper.goNext();
    }
    else {
      this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_LABEL_TEXT_WIZARD_NEXT_ERROR'));
      $("html, body").animate({ scrollTop: 0 }, "slow");
    }
    this._cdRef.detectChanges();
  }

    prevStep() {
        // Handle previous step
        this.stepper.goPrev(); // go previous step
        this.presenttab = this.stepper.getCurrentStepIndex() - 1;
    }

    createStepperInstances(selector: string): void {
        const elements = document.body.querySelectorAll(selector);
        elements.forEach((element) => {
            const item = element as HTMLElement;
            this.stepper = StepperComponent.createInsance(item);
        });
        this.getPartnerPDFLogo();
        this.GetCodes();
        //this.getQuoteUserDetails();
        this.setPermissions();
        this.getCustomerForQuotes();
        this.initialConditions();
    }

    setPermissions(): void {
        this.permissions.SaveQuote = this._permissionService.hasPermission(CloudHubConstants.SAVEQUOTE) ? 'Allowed' : 'Denied';
        this.permissions.ApproveQuote = this._permissionService.hasPermission(CloudHubConstants.APPROVEQUOTE) ? 'Allowed' : 'Denied';
        this.permissions.HasGetAccountManagerDetails = this._permissionService.hasPermission(CloudHubConstants.GETACCOUNTMANAGERDETAILSOFCUSTOMER)? 'Allowed' : 'Denied';
    }

  saveQuote(saveAsDraft: boolean) {
    this.statusName =saveAsDraft ? CloudHubConstants.QUOTE_LIST_STATUS_DRAFT : CloudHubConstants.QUOTE_LIST_STATUS_PUBLISHED;
    this.isSavingQuotedisabled = true;
    if (!this.frmAddQuote_QuoteName || this.frmAddQuote_QuoteName.trim() === '') {
        this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_NAME_REQUIRED_ERROR'));
        return;
    }   
    if (this.frmAddQuote_QuoteName && this.frmAddQuote_QuoteName.length > 150) {
        this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_NAME_MAXLENGTH_ERROR_MESSAGE'));
        return;
    }
    if (!this.frmAddQuote_ExpiresOn) {
        this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_EXPIRATION_DATE_REQUIRED_ERROR'));
        return;
    }
   
    if (this.stepper.getCurrentStepIndex() == 4) {
        if (this.quoteLineItemsData.length == 0) {
            this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_LINE_ITEM_VALIDATION_ERROR'));
            return;
        }
        if (this.quoteLineItemsData.length > 9999) {
            this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_LINE_ITEM_MAX_VALIDATION_ERROR'));
            return;
        }
        if (this.quoteLineItemsData) {
            this.isUnsavedChange = false;
            this.quoteLineItemsData.forEach((data) => {
                if (data.isEditing == true) {
                    this.isUnsavedChange = true;
                }
            })
            if (this.isUnsavedChange) {
                this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_LINE_ITEM_VALIDATION_ERROR_SAVE_QUOTE_LINE_ITEM_CHNAGE'));
                return;
            }
        }
    }
    var quoteDetails = {};
    var quoteContacts = [];
    var quoteLineItems = [];
    var buyerCompany = {};
    let defaultPurchaseTermsValue = this.frmWizardOne.get('purchaseTermsOption')?.value;
    let defaultPaymentTermsValue = this.frmWizardOne.get('paymentTermsOption')?.value;
    let selectedEmailTypeValue = this.frmWizardThree.get('SelectedEmailType')?.value;
     if(!this.frmWizardThree.get('Account_Manager_Id').value && this.frmWizardThree.get('SelectedEmailType')?.value == 'selectedAccountManager'){
        this._toastService.error(
           this.translateService.instant('TRANSLATE.QUOTE_ERROR_TEXT_FOR_EMPTY_ACCOUNT_MANAGER'));
          return; 
       }
    
const isNewCustomer = this.frmWizardOne.get('isNewCustomer')?.value === true;
const newCustomerName = this.frmWizardOne.get('newCustomerName')?.value ?? '';
const currencyCodeValue = this.frmWizardOne.get('currencyCode')?.value ?? '';

if (isNewCustomer) {
    if (!newCustomerName.trim() || !currencyCodeValue) {
        this._toastService.error(
            this.translateService.instant('TRANSLATE.QUOTE_NEW_CUSTOMER_NAME_AND_CURRENCY_REQUIRED_ERROR')
        );
        this.isSavingQuotedisabled = false;
        return;
    }
} else {
    const existingCustomerId = this.frmWizardOne.get('customer_id')?.value;
    if (!existingCustomerId) {
        this._toastService.error(
            this.translateService.instant('TRANSLATE.QUOTE_EXISTING_CUSTOMER_REQUIRED_ERROR')
        );
        this.isSavingQuotedisabled = false;
        return;
    }
}

if (isNewCustomer) {
    const checkedAddresses = this.buyerAddressList?.filter(a => a.IsChecked) ?? [];
    
    if (checkedAddresses.length > 1) {
        this._toastService.error(
            this.translateService.instant('TRANSLATE.QUOTE_ADDRESS_SINGLE_SELECTION_ERROR')
        );
        this.isSavingQuotedisabled = false;
        return;
    }
    
    const checkedAddress = checkedAddresses[0] ?? null;

    buyerCompany = {
        Name: newCustomerName,
        Logo: '',
        AddressId: checkedAddress?.AddressId ?? null,
        Line1: checkedAddress?.Line1 ?? null,
        Line2: checkedAddress?.Line2 ?? null,
        City: checkedAddress?.City ?? null,
        State: checkedAddress?.State ?? null,
        Country: checkedAddress?.Country ?? null,
        Zip: checkedAddress?.Zip ?? null,
        IsChecked: true
    };
} else if (!this.addressDetails || this.addressDetails.length === 0) {
    buyerCompany = {
        Name: this.selectedCustomerDetails?.CustomerName ?? ''
    };
} else {
    const checkedExistingAddress = this.addressDetails.find(a => a.IsChecked) ?? this.addressDetails[0];
  this.getBranchForQuote(this.currentC3CustomerId)
  if(this.branchId && this.branchList.length >0){
    var entity = this.branchList.filter(user => user.RecordIntId == Number(this.branchId));
  }
    buyerCompany = {
        Name: this.selectedCustomerDetails?.CustomerName ?? '',
        SiteName:entity?.[0]?.ParentSiteName ??entity?.[0]?.RecordName ??'',
        DepartmentName:entity?.[0]?.ParentSiteName? entity?.[0]?.RecordName: '',
        Logo: '',
        AddressId: checkedExistingAddress.AddressId,
        Line1: checkedExistingAddress.Line1,
        Line2: checkedExistingAddress.Line2,
        City: checkedExistingAddress.City,
        State: checkedExistingAddress.State,
        Country: checkedExistingAddress.Country,
        Zip: checkedExistingAddress.Zip,
        IsChecked: checkedExistingAddress.IsChecked
    };
}
const useSelectedSender = this.createByDetails && ['default', 'createdDefault', 'loggedInUser', 'selectedAccountManager'].includes(this.createByDetails.Type);
    var sellerInfo = { 
        CompanyName: this.ContactCompanyName,
        Logo:/* this.partnerPDFLogo.Value*/ " ",
        AddressLine1: this.AddressLine1,
        City: this.City,
        State: this.State,
        Country: this.Country,
        ZipCode: this.ZipCode,
        EmailAddress: useSelectedSender? this.createByDetails.EmailAddress: this.users[0].EmailAddress,
        Name: useSelectedSender? (this.createByDetails.Name || this.users[0].Name): this.users[0].Name,
        BillFromAddressId: this.partnerAddressDetails?.AddressId?? null, 
        DefaultPurchaseTermsValue : defaultPurchaseTermsValue,
        DefaultPaymentTermsValue : defaultPaymentTermsValue,
        SelectedEmailType : selectedEmailTypeValue,
        AccountManagerC3Id: this.frmWizardThree.get('Account_Manager_Id')?.value
    }
    quoteDetails = {
        QuoteVersionId: this.QuoteVersionId != undefined ? this.QuoteVersionId : 0,
        QuoteId: this.QuoteId != undefined ? this.QuoteId : 0,
        CustomerId: this.currentC3CustomerId,
        RecordIntId:(!isNewCustomer && this.branchId)?this.branchId:null,
        EntityId:this.EntityId?this.EntityId:null,
        CreateBy: this.users[0].EmailAddress,
        ApprovedBy: this.approverEmail != undefined ? this.approverEmail : null,
        // Name: this.frmAddQuote_QuoteName,
        Name: this.frmWizardOne.getRawValue().frmAddQuote_QuoteName || this.frmAddQuote_QuoteName,
        BuyerCompany: JSON.stringify(buyerCompany),
        SellerCompany: JSON.stringify(sellerInfo),
        QuoteTemplate: this.frmAddQuote_Template ,
        ExpirationDate: moment.utc(this.frmAddQuote_ExpiresOn).format('LL'),
        QuoteURL: this.quoteURL,
        CommentsToBuyer: this.CommentsToBuyer,
        AdditionalCustomerDetails:this.AdditionalCustomerDetails,
        PurchaseTerms: this.PurchaseTerms,
        PaymentTerms : this.PaymentTerms,
        IsSign: this.IsSign == 'includeSignature' ? true : false,
        IsCounterSign: this.IsCounterSign,
        StatusName: saveAsDraft ? CloudHubConstants.QUOTE_LIST_STATUS_DRAFT : CloudHubConstants.QUOTE_LIST_STATUS_PUBLISHED,
        QuoteCreator : this.createByDetails.EmailAddress,
        IsTermWiseSectioning: this.groupByBillingTerm,
	      IsTaxIncluded:this.showPricesExcludeVAT ? false : true,
        IsNewCustomer: this.frmWizardOne.get('isNewCustomer')?.value === true ? true : false,        
        NewCustomerName: this.frmWizardOne.get('isNewCustomer')?.value === true? (this.frmWizardOne.getRawValue().newCustomerName ?? null): null,
        // CurrencyCode: this.frmWizardOne.getRawValue().currencyCode ?? null,
        CurrencyCode: this.frmWizardOne.get('isNewCustomer')?.value === true ? (this.frmWizardOne.getRawValue().currencyCode ?? null) : null,
       PlanIds: this.frmWizardOne.get('isNewCustomer')?.value === true? JSON.stringify(this.frmWizardOne.getRawValue().planIds ?? []): null
    }
    if (this.QuoteContact != undefined && this.QuoteContact != null && this.QuoteContact.length > 0) {
        this.QuoteContact.forEach((contact) => {
            //if (contact.IsChecked) {
                var quoteContact = {
                    QuoteContactId: contact.QuoteContactId != undefined ? contact.QuoteContactId : 0,
                    FirstName: contact.FirstName,
                    LastName: contact.LastName,
                    Email: contact.EmailId,
                    PhoneNumber: contact.PhoneNumber,
                    UserId: contact.UserId,
                    IsActive: contact.IsChecked,
                }
                quoteContacts.push(quoteContact);
                //}
            })
        }
        if (this.quoteLineItemsData && this.quoteLineItemsData != null && this.quoteLineItemsData != undefined && this.quoteLineItemsData.length > 0) {
          // Normalize sequencing fields from the authoritative data source
          this.quoteLineItemsData.forEach((product: any, i: number) => {
            product.SequencingNumber = product.SequencingNumber ?? (i + 1);
            product.GroupSequenceNumber = product.GroupSequenceNumber ?? 0;

            const productToAdd = {
              QuoteLineItemId: product.QuoteLineItemId != undefined ? product.QuoteLineItemId : 0,
              PlanProductId: product.PlanProductId != undefined ? product.PlanProductId : 0,
              PlanName: product.PlanName, 
              Name: product.Name,
              Description: product.Description,
              Quantity: product.Quantity,
              CostPrice: product.ProviderPrice,
              SalePrice: product.DisplayFinalSalePrice,
              Discount: product.Discount != undefined ? product.Discount : 0.00,
              Tax: product.TaxFinalSalePriceAfterDiscount != undefined ? product.TaxFinalSalePriceAfterDiscount : 0.00,
              SaleType: product.SaleTypeId,
              BillingPeriodId: product.BillingPeriodId,
              StartDate: product.StartDate != undefined ? product.StartDate : null,
              EndDate: product.EndDate != undefined ? product.EndDate : null,
              InvoiceNumber: product.InvoiceNumber != undefined ? product.InvoiceNumber : null,
              InvoiceDate: product.InvoiceDate != undefined ? product.InvoiceDate : null,
              DueDate: product.DueDate != undefined ? product.DueDate : null,
              IsActive: product.IsActive || product.QuoteLineItemId,
              DeletedQuoteLineItemIds: this.deletedQuoteLineItemIds.join(','),
              SequencingNumber: product?.SequencingNumber ?? null,
              GroupSequenceNumber: product?.GroupSequenceNumber ?? 0,
              IsDefaultCustomLineItem: product?.IsDefaultCustomLineItem ?? false,
            }
            quoteLineItems.push(productToAdd);
          });
        }
        var element = document.getElementById('sample-table-for-pdf-final');
        var reqBody = {
            QuoteDetails: JSON.stringify(quoteDetails),
            QuoteContacts: JSON.stringify(quoteContacts),
            QuoteLineItems: JSON.stringify(quoteLineItems),
            HtmlTemplate: element.innerHTML

        }

        const subscription = this._quotesService.saveQuote(reqBody).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
                // Adopt the real QuoteId/QuoteVersionId assigned by the backend and refresh the
                // line items from the server. Without this, newly-added items keep QuoteLineItemId 0
                // in local state after a save, so the next save resubmits them as "new" and
                // spSaveQuote inserts duplicate QuoteLineItems rows for them.
                this.QuoteId = response.Data.QuoteId;
                this.QuoteVersionId = response.Data.QuoteVersionId;
                this.deletedQuoteLineItemIds = [];

                if (this.statusName === CloudHubConstants.QUOTE_LIST_STATUS_PUBLISHED) {
                    this.saveQuoteId = response.Data.QuoteId
                    this.saveQuoteUrl = response.Data.QuoteURL

                    this.isSavingQuotedisabled = false;
                    this.QuoteReview();
                } else {
                    this._notifierService.success({ title: this.translateService.instant('TRANSLATE.QUOTE_LABEL_TEXT_SAVE_DRAFT') }).then((result) => {
                        if (result.isConfirmed) { this._router.navigate(['partner/quotelist']); }
                    });

                }
                this.getQuoteDetails();

            }, error: (error: any) => {
                let msg = this.translateService.instant('TRANSLATE.' + error.error.ErrorDetail);
                this._toastService.error(msg)
                return of(null);
            }
        })
        this._subscriptionArray.push(subscription)
        // (response: any) => {

        //     if (this.statusName === CloudHubConstants.QUOTE_LIST_STATUS_PUBLISHED) {
        //         this.saveQuoteId = response.Data.QuoteId
        //         this.saveQuoteUrl = response.Data.QuoteURL

        //         this.isSavingQuotedisabled = false;
        //         this.QuoteReview();
        //     } else {
        //       this._notifierService.success({ title: this.translateService.instant('TRANSLATE.QUOTE_LABEL_TEXT_SAVE_DRAFT') }).then((result) => {
        //         if (result.isConfirmed ) {this._router.navigate(['partner/quotelist']);}
        //         });
        //     }

        // }, error:(error:any)=>{
        //   let msg = this.translateService.instant('TRANSLATE.' + error.error.ErrorDetail);
        //   this._toastService.error(msg)
        // };
        // return of(null);
    }

    GetCodes() {
        const subscription = this._commonService.getSupportedCurrencies().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {

            this.CurrencyCodes = response.Data;
        });
        this._subscriptionArray.push(subscription);
    }


  getQuoteUserDetails(): void {
    let userContext = this._commonService.userInfo;
    let userId = userContext[userContext.length - 1].C3UserId
    const subscription = this._quotesService.getQuoteUserDetails(userId).subscribe((response: any) => {
      this.users = response.Data;
      this.users.forEach(user => {
        user.Type = 'loggedInUser';
      });
      if(this.defaultEmail!= null && !this.disableCondition ){
        let defaultEmailDetails = {
          Name : '',
          EmailAddress : this.defaultEmail,
          Type : 'default'
        };
        this.users.push(defaultEmailDetails);
      }
      
      if (this.PageMode != 'Edit' && this.PageMode != 'View') {
  this.frmWizardThree.get('SelectedEmailType')?.setValue('loggedInUser');
  this.createByDetails.Type = 'loggedInUser';
} else {
  this.getQuoteDetails();
}
    });
    this.fetchAccountManagersData();
    this._subscriptionArray.push(subscription);
  }

  getPartnerPDFLogo(): void {
    const subscription =  this._quotesService.getPartnerLogos().subscribe((response: any) => {
      this.partnerLogos = response.Data;
      this.getPartnerPDFLogo = find(this.partnerLogos, each => each.Name === CloudHubConstants.PDF_LOGO);
    });
    this._subscriptionArray.push(subscription);
  }

    MoveToState(arg0: string) {
        throw new Error('Method not implemented.');
    }

    initialConditions() {
        if (this.PageMode === 'Add') {
            this.getCustomerForQuotes();
        }
    }

    customerContactList() {
        let value = this.frmWizardOne.get('customer_id').value;
        if(this.prevCustomerId !== '' && this.prevCustomerId != value){
          this.frmWizardOne.get('branch_id').reset();
        }
        this.prevCustomerId = this.frmWizardOne.get('customer_id').value
         if (!value) {
        this.selectedCustomerDetails = {};
        this.currentC3CustomerId = null;
        this.QuoteContact = [];          
        this.QuoteCustomerDetails = [];   
        this.addressDetails = [];
        this.addressDetailsData = null;
        return;
    }
        this.selectedCustomerDetails = {};
        this.currentC3CustomerId = value;
        if(!this.branchId){
          let customer = this.customers.filter(user => user.C3Id === value);
           var reqBody = {
              EntityName: this.cloudHubConstants.ENTITY_CUSTOMER,
              RecordId: customer[0].CustomerId
            }
        }else{
          this.getBranchForQuote(this.currentC3CustomerId)
          let entity = this.branchList.filter(user => user.RecordIntId == Number(this.branchId));
          console.log(entity)
          var entityType = (CloudHubConstants[entity[0].EntityName as keyof typeof CloudHubConstants] ??CloudHubConstants.ENTITY_SITEDEPARTMENT) as string;
           reqBody = {
              EntityName: entityType,
              RecordId: this.branchId
          }
        }
        const subscription = this._quotesService.getEntityUsers(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {

            if (response.Data !== undefined && response.Data !== null && response.Data.length > 0) {
                this.QuoteContact = response.Data;
                this.QuoteCustomerDetails = this.QuoteContact;
                 if (this.branchId)
                {
                   this.getBranchForQuote(value);
                  const selectedBranch = this.branchList.find((branch: any) => branch.RecordIntId === this.branchId);
                   if (selectedBranch) {
                  const constantName = selectedBranch.EntityName;
                  this.entityName = CloudHubConstants[constantName as keyof typeof CloudHubConstants] ??CloudHubConstants.ENTITY_SITEDEPARTMENT;
                  this.recordId = selectedBranch.RecordC3Id;
                  this.BranchEntityName = selectedBranch.ParentSiteName? `${selectedBranch.RecordName} - ${selectedBranch.ParentSiteName}`: selectedBranch.RecordName;
                }}
                else{
                  this.entityName = CloudHubConstants.ENTITY_CUSTOMER;
                   this.recordId = this.QuoteContact[0].RecordId;
                }
                //console.log(this.cloudHubConstants.QUOTE_CUSTOMER_ADMIN);
                this.QuoteContact = this.QuoteContact.filter(user => [
                    this.cloudHubConstants.QUOTE_CUSTOMER_ADMIN,
                    this.cloudHubConstants.QUOTE_SITE_ADMIN,
                    this.cloudHubConstants.QUOTE_SITE_DEPARTMENT_ADMIN
                ].includes(user.RoleName) 
                && user.IsPrimaryContext != false);
                this.QuoteContact.map((each) => {
                    return each.IsChecked = true;
                });
                this._quotesService.getAddress(this.entityName, this.recordId).subscribe((response: any) => {
                    this.addressDetailsData = response.Data;
                    this.addressDetails = this.addressDetailsData.filter(address => address.IsDefault === true && address.ContactType === 'Billing');
                    if (this.addressDetails == null || this.addressDetails.length == 0) {
                        this.addressDetails = this.addressDetailsData.filter(address => address.ContactType === 'Billing');
                        if (this.addressDetails.length > 1) {
                            var arrayCount = this.addressDetails.length;
                            this.addressFilteredData = this.addressDetails[arrayCount - 1];
                            this.addressDetails = [this.addressFilteredData];
                        }
                    }
                    if (this.addressDetails.length > 0) {
                        this.addressDetails.forEach(function (address) {
                            address.IsChecked = true;
                        })
                    }
                    //this.addressDetails = this.addressDetails.filter(address => address.IsDefault === true && address.ContactType === 'Billing');
                });
                if (this.allCustomers == null || this.allCustomers == undefined) {

                }
                this.selectedCustomerDetails = this.allCustomers.find(customer => customer.C3Id == this.currentC3CustomerId);
                this.CurrencyCode = this.selectedCustomerDetails.CurrencyCode;
                this.customerId = this.selectedCustomerDetails.CustomerId;
                this.taxType = this.selectedCustomerDetails.TaxTypeName;
                this.CurrencySymbol = this.selectedCustomerDetails.CurrencySymbol;
                this.CurrencyDecimalPlaces = this.selectedCustomerDetails.CurrencyDecimalPlaces;
                this.CurrencyThousandSeperator = this.selectedCustomerDetails.CurrencyThousandSeperator;
                this.CurrencyDecimalSeperator = this.selectedCustomerDetails.CurrencyDecimalSeperator;
                this.customerName = this.selectedCustomerDetails.CustomerName;

                this.CalculateQuoteLineItemTotal(this.quoteLineItemsList.data);
                 
            }
        });
        this._subscriptionArray.push(subscription)
        this.getAddressDettails(value);
         if(this.PageMode.toLowerCase() === this.cloudHubConstants.EDIT || this.PageMode.toLowerCase() === this.cloudHubConstants.VIEW){
            this.frmWizardOne.get('branch_id')?.disable();
        }
         if(this.PageMode.toLowerCase() === this.cloudHubConstants.ADD && !this.frmWizardOne.get('branch_id')?.value){
            this.frmWizardOne.get('branch_id')?.enable();
        }
        this.getBranchForQuote(value);
    }

     getBranchForQuote(customerId:any) {
        const subscription = this._quotesService.getBranchForQuote(customerId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.branchList = response.Data;
            if(this.PageMode.toLowerCase() === this.cloudHubConstants.ADD){
               this.branchList = this.branchList.filter(entity =>
              !this.allQuotes.some(
                quote =>
                  quote.EntityId === entity.EntityId &&
                  quote.RecordId === entity.RecordIntId
              ));
            }
        })
        this._subscriptionArray.push(subscription)
    }

    addNewCustomer() {
        const modalRef = this._modalService.open(QuoteAddnewcustomerComponent, {
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            size: 'xl',
            backdrop: 'static',
        });
        modalRef.componentInstance.type = 'form'
        modalRef.result.then((result) => {
            if (result) {
                let newlyAddedUser = result;
                result.forEach((column) => {
                    column.IsChecked = true;
                    this.QuoteContact.push(column);
                });
            }
        },
            (reason) => {
                /* Closing modal reference if cancelled or clicked outside of the popup*/
                modalRef.close();
            });

    }

    addExistingCustomer() {
        const modalRef = this._modalService.open(QuoteAddnewcustomerComponent, {
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            size: 'xl',
            backdrop: 'static',
        });
        modalRef.componentInstance.type = 'list'
        modalRef.componentInstance.quoteContact = this.QuoteContact;
        modalRef.componentInstance.addCustomerC3Id = this.selectedCustomerDetails.C3Id
        modalRef.componentInstance.quoteContact = this.QuoteContact;
        modalRef.result.then((result) => {
            if (result) {
                result.forEach((column) => {
                    this.QuoteContact.push(column);
                });
                this.QuoteContact = Array.from(
                    new Map(this.QuoteContact.map(item => [item.C3UserId, item])).values()
                  );
            }
        },
            (reason) => {
                /* Closing modal reference if cancelled or clicked outside of the popup*/
                modalRef.close();
            });

    }

    addNewAddress(existingAddress: any = null) {
    const modalRef = this._modalService.open(QuoteAddnewcustomerComponent, {
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        size: 'lg',
        backdrop: 'static',
    });
    modalRef.componentInstance.type = 'address';
    setTimeout(() => {
        if (existingAddress) {
            modalRef.componentInstance.existingAddress = existingAddress;
            modalRef.componentInstance.frmAddAddress.patchValue({
                Line1: existingAddress.Line1 ?? '',
                Line2: existingAddress.Line2 ?? '',
                City: existingAddress.City ?? '',
                Country: existingAddress.Country ?? '',
                State: existingAddress.State ?? '',
                Zip: existingAddress.Zip ?? '',
            });
            modalRef.componentInstance.frmAddAddress.get('Country')?.disable();
            if (existingAddress.Country) {
                modalRef.componentInstance.getStatesByCountryCode();
            }
        }
    }, 100);

    modalRef.result.then((result) => {
        if (result) {
            if (existingAddress) {
                const index = this.buyerAddressList.indexOf(existingAddress);
                if (index !== -1) {
                    this.buyerAddressList[index] = { 
                        ...result, 
                        IsChecked: existingAddress.IsChecked 
                    };
                }
            } else {
                result.IsChecked = this.buyerAddressList.length === 0;
                this.buyerAddressList.push(result);
            }
            
        }
    }).catch(() => {});
}

    addCustomer() {
        let value = this.frmWizardTwo.get('SelectAllColumn').value;
    }

    CheckAllContact() {
        this.SelectAllColumn = !this.SelectAllColumn;
        this.QuoteContact.forEach((contact) => {
            contact.IsChecked = this.SelectAllColumn;
        });
        this._cdRef.detectChanges();

    }

    getCustomerForQuotes() {
        this.currentC3CustomerId = null;
        const subscription1 = this._quotesService.getAllQuote(this._commonService.entityName, this._commonService.recordId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          this.allQuotes = response.Data;
        })
        this._subscriptionArray.push(subscription1)
        const subscription = this._quotesService.getCustomerForQuotes().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {

            this.allCustomers = response.Data;
            if (this.PageMode == 'Add') {
                this.customers = this.allCustomers.filter(x => x.IsQuoteCreated == 0 );
                //this.getAddressDettails();
            }
            else {
                this.customers = this.allCustomers;
            }
            if (this.PageMode == 'Edit' || this.PageMode == 'View') {
                this.getQuoteDetails();
            }
        })
        this._subscriptionArray.push(subscription)
    }

    BackToQuote() {
        // let callback=()=>{
        //   this._router.navigate(['partner/quotelist']);
        // }
        // this._unsavedChangesService.setUnsavedChanges(this.frmWizardOne.dirty || this.frmWizardTwo.dirty || this.frmWizardThree.dirty || this.frmWizardFour.dirty || this.frmWizardFive.dirty);
        // this._unsavedChangesService.setCallback = callback;
        // this._unsavedChangesService.confirmPopup();

        this.c3RouterService.backToHistory(this.keyForData,'partner/quotelist');
    }

    UpdateUserName(row) {

    }


    CustomLineItem(customLineItem: any = 'noParameter', index?: number) {
        const customLineItemReqBody = {
            CurrencyCode: this.CurrencyCode,
            CurrencySymbol: this.CurrencySymbol,
            CurrencyDecimalPlaces: this.CurrencyDecimalPlaces,
            CurrencyThousandSeperator: this.CurrencyThousandSeperator,
            CurrencyDecimalSeperator: this.CurrencyDecimalSeperator,
            CustomLineItemDetails: customLineItem
        };

        const modalRef = this._modalService.open(QuoteCustomLineItemComponent, {
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            backdrop: 'static',
            keyboard: false,
            size: 'lg'
        });
        modalRef.componentInstance.customLineItemDetails = customLineItemReqBody;

        modalRef.result.then((result) => {
            if (index !== undefined) {
                this.quoteLineItemsList.data[index] = result;
                this.quoteLineItemsData = this.quoteLineItemsList.data;
                this.CalculateQuoteLineItemTotal(this.quoteLineItemsList.data);
            } else {
                if (this.groupByBillingTerm) {
                    const billingTermKey = this.formatSubscriptionTerm(result);
                    const sameGroupItems = this.quoteLineItemsData.filter((item: any) => this.formatSubscriptionTerm(item) === billingTermKey);
                    const lastGroupIndex = sameGroupItems.reduce((max, item) => {
                        const seq = Number(item.GroupSequenceNumber) || 0;
                        return seq > max ? seq : max;
                    }, 0);
                    result.GroupSequenceNumber = lastGroupIndex + 1;
                } else {
                    result.SequencingNumber = (this.quoteLineItemsData?.length || 0) + 1;
                }
                this.quoteLineItemsData.push(result);
                this.productsAndLinkedProducts = this.quoteLineItemsData;
                this.sortAndRebuildView();
                this.quoteLineItemsList.data = this.quoteLineItemsData;
                this.CalculateQuoteLineItemTotal(this.quoteLineItemsList.data);
            }
        }).catch((error) => {
            console.log('Modal closed with error:', error);
        });
    }


    QuoteReview(): void {
        this.statusName = 'QUOTE_LIST_STATUS_PUBLISHED';
        this.isSavingQuotedisabled = true;

        this.isSavingQuotedisabled = false;

        const modalRef = this._modalService.open(QuoteReviewComponent, {
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            size: 'md',
        });
        modalRef.componentInstance.quoteId = this.saveQuoteId;
        modalRef.componentInstance.saveQuoteUrl = this.saveQuoteUrl;
        modalRef.result.then(
            (result) => {
                this.quoteURL = result;

            },
            (reason) => {
                this._router.navigate(['partner', 'quotelist']);
            }
        );
    }
    QuoteEmailDetails(): void {
        this.isFirstPopUp = false;
        const modalRef = this._modalService.open(QuoteReviewComponent, {
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            size: 'xl',
        });

        modalRef.result.then(
            (response) => {
                this._router.navigate(['partner', 'quotelist']);
            },
            (reason) => {
                this._router.navigate(['partner', 'quotelist']);
            }
        );
    }

    getQuoteDetails() {
        const subscription = this._quotesService.getQuoteDetails(this.QuoteVersionId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            const quoteDetails = response.Data;
        

      this.createByDetails.EmailAddress = quoteDetails.QuoteDetails.CreateBy;
      this.showPricesExcludeVAT = quoteDetails?.QuoteDetails?.IsTaxIncluded ? false : true;
      this.groupByBillingTerm = !!quoteDetails?.QuoteDetails?.IsTermWiseSectioning;

      //this.createByDetails.Type = 
      this.QuoteVersionId = quoteDetails?.QuoteDetails.QuoteVersionID;
      this.QuoteId = quoteDetails.QuoteDetails.QuoteId;
      this.currentC3CustomerId = quoteDetails.QuoteDetails.CustomerC3Id;
      this.branchId = quoteDetails.QuoteDetails.RecordIntId;
      this.EntityId = quoteDetails.QuoteDetails.EntityId;
      this.selectedAddressId = quoteDetails.QuoteDetails.PartnerCompanyAddressId;
      let existingAddressDetails = JSON.parse(quoteDetails.QuoteDetails.SellerCompany);
      this.IsCurrentAddress = {
                     AddressId:this.selectedAddressId,
                     BillFromAddressId: false,
                     City: existingAddressDetails?.City,
                     Country: existingAddressDetails?.Country,
                     IsDefault: false,
                     Line1: existingAddressDetails?.AddressLine1,
                     Line2: existingAddressDetails?.AddressLine2,
                     State: existingAddressDetails?.State,
                     Zip : existingAddressDetails?.ZipCode,
                     ShouldDisable: true
              }
      this.getAddressDettails(this.currentC3CustomerId);
      // if (this.users && quoteDetails.QuoteDetails.CreateBy != null && quoteDetails.QuoteDetails.CreateBy != "") {
      //     this.users[0].EmailAddress = quoteDetails.QuoteDetails.CreateBy;
      // }
      this.approverEmail = quoteDetails.QuoteDetails.ApprovedBy;
      this.frmWizardOne.get('customer_id')?.setValue(quoteDetails.QuoteDetails.CustomerC3Id);
      this.frmWizardOne.get('branch_id')?.setValue(quoteDetails.QuoteDetails.RecordIntId);

      const isNewCustomer = quoteDetails.QuoteDetails.IsNewCustomer;
      this.frmWizardOne.get('isNewCustomer')?.setValue(isNewCustomer, { emitEvent: false });
      this.isNewCustomerFlag = isNewCustomer;

      if (isNewCustomer) {
     this.frmWizardOne.get('newCustomerName')?.setValue(quoteDetails.QuoteDetails.NewCustomerName);
     this.frmWizardOne.get('newCustomerName')?.disable();
      this.frmWizardOne.get('currencyCode')?.setValue(quoteDetails.QuoteDetails.CurrencyCode ?? '');

       const savedCurrency = this.CurrencyCodes?.find(
    (c: any) => c.CurrencyCode === quoteDetails.QuoteDetails.CurrencyCode
  );
  if (savedCurrency) {
    this.CurrencyCode              = savedCurrency.CurrencyCode;
    this.CurrencySymbol            = savedCurrency.CurrencySymbol;
    this.CurrencyDecimalPlaces     = savedCurrency.CurrencyDecimalPlaces;
    this.CurrencyThousandSeperator = savedCurrency.CurrencyThousandSeperator;
    this.CurrencyDecimalSeperator  = savedCurrency.CurrencyDecimalSeperator;
  }


       if (this.PageMode === 'Edit' || this.PageMode === 'View') {
    this.frmWizardOne.get('currencyCode')?.disable();
  }

     const planIds = quoteDetails.QuoteDetails.PlanIds? JSON.parse(quoteDetails.QuoteDetails.PlanIds): [];
     
     this._previousPlanIds = planIds.map((id: any) => String(id));

      if (this.planList && this.planList.length > 0) {
        this.frmWizardOne.get('planIds')?.setValue(planIds);
      } else {
        const interval = setInterval(() => {
          if (this.planList && this.planList.length > 0) {
            clearInterval(interval);
            this.frmWizardOne.get('planIds')?.setValue(planIds);
          }
        }, 100);
      }
    //  this.frmWizardOne.get('planIds')?.setValue(planIds);
     this._previousPlanIds = planIds.map((id: any) => String(id));
     if (this.PageMode === 'View') {
     this.frmWizardOne.get('planIds')?.disable();
     } else {
    this.frmWizardOne.get('planIds')?.enable();
  }

  
  this.frmWizardOne.get('customer_id')?.clearValidators();
  this.frmWizardOne.get('customer_id')?.updateValueAndValidity();

  if (quoteDetails.QuoteDetails.BuyerCompany) {
    const buyerCompany = JSON.parse(quoteDetails.QuoteDetails.BuyerCompany);
    if (buyerCompany) {
      this.buyerAddressList = [{
        AddressId: buyerCompany.AddressId ?? null,
        Line1: buyerCompany.Line1 ?? '',
        Line2: buyerCompany.Line2 ?? '',
        City: buyerCompany.City ?? '',
        State: buyerCompany.State ?? '',
        Country: buyerCompany.Country ?? '',
        Zip: buyerCompany.Zip ?? '',
        IsChecked: buyerCompany.IsChecked ?? true
      }];
    }
  }
}
      this.frmWizardOne.get('frmAddQuote_Template')?.setValue(
  quoteDetails.QuoteDetails?.QuoteTemplate || ''
);

this.frmWizardOne.get('frmAddQuote_QuoteName')?.setValue(quoteDetails.QuoteDetails?.Name || '');
this.frmAddQuote_QuoteName = quoteDetails.QuoteDetails?.Name || '';

this.frmWizardOne.get('quote_puchasedescription')?.setValue(quoteDetails.QuoteDetails.PurchaseTerms);
this.frmWizardOne.get('quote_description')?.setValue(quoteDetails.QuoteDetails.CommentsToBuyer);
this.frmWizardOne.get('quote_customer_additional_details')?.setValue(quoteDetails.QuoteDetails.AdditionalCustomerDetails);
this.frmWizardOne.get('quote_paymentsterm')?.setValue(quoteDetails.QuoteDetails.PaymentTerms);
this.frmWizardThree.get('Account_Manager_Id')?.setValue(existingAddressDetails.AccountManagerC3Id);

      const targetBranchId = this.frmWizardOne.get('branch_id')?.value;
      const selectedBranch = this.branchList.find((branch: any) => branch.RecordIntId === targetBranchId);
      
      if (selectedBranch) {
          this.EntityId = selectedBranch.EntityId; 
      }
            
      if (quoteDetails.QuoteDetails.IsSign) {
        this.frmWizardFive.get('radios4')?.setValue('includeSignature');
        this.IsShowCounterSign = true;
      } else {
        this.frmWizardFive.get('radios4')?.setValue('noSignature');
        this.IsShowCounterSign = false;
      }
      this.frmWizardFive.get('Checkboxes1')?.setValue(quoteDetails.QuoteDetails.IsCounterSign);
      const ExpiryDate = new Date(quoteDetails.QuoteDetails.ExpirationDate);
    

      // if (quoteDetails.QuoteDetails.BuyerCompany) {
      //     this.addressDetails.push(JSON.parse(quoteDetails.QuoteDetails.BuyerCompany));
      // }

      if (quoteDetails.QuoteDetails.SellerCompany) {
          const SellerCompany = JSON.parse(quoteDetails.QuoteDetails.SellerCompany);
          this.quoteSellerCompanyDetails = JSON.parse(quoteDetails.QuoteDetails.SellerCompany);
          if(SellerCompany?.DefaultPurchaseTermsValue != undefined && SellerCompany?.DefaultPurchaseTermsValue != null && SellerCompany?.DefaultPurchaseTermsValue != ""){
            this.frmWizardOne.get('purchaseTermsOption')?.setValue(SellerCompany?.DefaultPurchaseTermsValue);
            if(SellerCompany?.DefaultPurchaseTermsValue == 'default'){
              this.purchaseTermDisableOption = true;
              this.savedDefaultPurchaseTerms = quoteDetails.QuoteDetails.PurchaseTerms;
            }
            else if(SellerCompany?.DefaultPurchaseTermsValue == 'custom'){
              this.savedCustomPurchaseTerms = quoteDetails.QuoteDetails.PurchaseTerms;
            }
          }
          else{
            this.frmWizardOne.get('purchaseTermsOption')?.setValue('custom');
          }
          if(SellerCompany?.DefaultPaymentTermsValue != undefined && SellerCompany?.DefaultPaymentTermsValue != null && SellerCompany?.DefaultPaymentTermsValue != ""){
            this.frmWizardOne.get('paymentTermsOption')?.setValue(SellerCompany?.DefaultPaymentTermsValue);
            if(SellerCompany?.DefaultPaymentTermsValue == 'default'){
              this.paymenTermDisableOption = true;
              this.savedDefaultPaymentTerms = quoteDetails.QuoteDetails.PaymentTerms;
            }
            else if(SellerCompany?.DefaultPaymentTermsValue == 'custom'){
              this.savedCustomPaymentTerms = quoteDetails.QuoteDetails.PaymentTerms;
            }
          }
          else{
            this.frmWizardOne.get('paymentTermsOption')?.setValue('custom');
          }
          if(SellerCompany?.EmailAddress != undefined && SellerCompany?.EmailAddress != null && SellerCompany?.EmailAddress != '' ){
            //this.users = [];
          //   const usersModel = {
          //     EmailAddress: SellerCompany.EmailAddress,
          //     Name: SellerCompany.Name,
          //     Type : SellerCompany?.Type != null && SellerCompany?.Type != undefined ? SellerCompany?.Type : 'loggedInUser'
          // }
          // this.users.push(usersModel); 
          // if(this.users[0].Type == 'default'){
          //   this.defaultEmail = this.users[0].EmailAddress;
          // }
          this.frmWizardThree.get('SelectedEmailType')?.setValue(SellerCompany?.SelectedEmailType);
          let selectedEmailType = this.frmWizardThree.get('SelectedEmailType')?.value;
          this.createByDetails.Type = SellerCompany?.SelectedEmailType;

          if(this.defaultEmail != SellerCompany?.EmailAddress && this.users[0].EmailAddress != SellerCompany?.EmailAddress && this.frmWizardThree.get('SelectedEmailType')?.value != 'selectedAccountManager'){
            let createdEmailDetails = {
                Name : '',
                EmailAddress : SellerCompany?.EmailAddress,
                Type : 'createdDefault'
              };  
              selectedEmailType = 'createdDefault';
               this.frmWizardThree.get('SelectedEmailType')?.setValue('createdDefault');
              this.createByDetails.Type = selectedEmailType;
              this.users.push(createdEmailDetails);
          }

          if (selectedEmailType == undefined || selectedEmailType == null || selectedEmailType == "") {
           // this.frmWizardThree.get('SelectedEmailType')?.setValue('loggedInUser');
            selectedEmailType = 'createdDefault';
            this.onEmailOptionClick(selectedEmailType);
          }
          else {
            this.onEmailOptionClick(selectedEmailType);
            }
          }

          // set the 
      }
      let expires=  this.getNgbDateStruct(quoteDetails.QuoteDetails.ExpirationDate);
      this.frmWizardOne.get('expireDate')?.setValue(expires);
      let adjustedExpires = {year: expires.year, month: expires.month - 1, day: expires.day};
      this.frmAddQuote_ExpiresOn = this.formatDateObject(adjustedExpires);
      // this.frmWizardOne.get('frmAddQuote_ExpiresOn')?.setValue(new Date(quoteDetails.QuoteDetails.ExpirationDate.getTime() - quoteDetails.QuoteDetails.ExpirationDate.getTimezoneOffset() * 60000));
      this.quoteURL = quoteDetails.QuoteDetails.QuoteURL;
      this.CommentsToBuyer = quoteDetails.QuoteDetails.CommentsToBuyer;
      this.AdditionalCustomerDetails = quoteDetails.QuoteDetails.AdditionalCustomerDetails;
      this.PurchaseTerms = quoteDetails.QuoteDetails.PurchaseTerms;
      this.PaymentTerms = quoteDetails.QuoteDetails.PaymentTerms
      this.CurrencyCode = quoteDetails.QuoteDetails.CurrencyCode;
      this.IsSign = quoteDetails.QuoteDetails.IsSign ? 'includeSignature' : 'noSignature';
      this.IsShowCounterSign = this.IsSign === 'includeSignature';
      this.IsCounterSign = quoteDetails.QuoteDetails.IsCounterSign;
      this.statusName = quoteDetails.QuoteDetails.StatusName;
      this.QuoteStatus = quoteDetails.QuoteDetails.StatusName;

            this.QuoteContact = quoteDetails.QuoteContacts.map(contact => ({
                QuoteContactId: contact.QuoteContactId,
                FirstName: contact.FirstName,
                LastName: contact.LastName,
                EmailId: contact.Email,
                PhoneNumber: contact.PhoneNumber,
                UserId: contact.UserId,
                IsChecked: true,
                Type: contact.Type,
                FullName: [contact.FirstName, contact.LastName].join(' ')
            }));
            // if (!isNewCustomer) {
            //        const selectedPlanIds = [...new Set(quoteDetails.QuoteLineItems.map(x => x.PlanId))];
            //         this.frmWizardOne.get('planIds')?.setValue(selectedPlanIds);
            // }
            this.productsAndLinkedProducts = quoteDetails.QuoteLineItems.map(product => ({
                QuoteLineItemId: product.QuoteLineItemId,
                PlanProductId: product.PlanProductId,
                 PlanId: product.PlanId,
                  PlanName: product.PlanName,
                Name: product.Name,
                Description: product.Description,
                Quantity: product.Quantity,
                ProviderName: product.ProviderName,
                CategoryName: product.CategoryName,
                Validity: product.Validity,
                ValidityType: product.ValidityType,
                ConsumptionType: product.ConsumptionType,
                ProviderPrice: product.CostPrice,
                DisplayFinalSalePrice: product.SalePrice,
                BillingCycleName: product.BillingCycleName,
                Discount: product.Discount,
                Tax: product.Tax,
                IsTaxable: product.IsTaxable,
                SaleTypeId: product.SaleType,
                BillingPeriodId: product.BillingPeriodId,
                StartDate: product.StartDate,
                EndDate: product.EndDate,
                InvoiceNumber: product.InvoiceNumber,
                InvoiceDate: product.InvoiceDate,
                DueDate: product.DueDate,
                CurrencyCode: product.CurrencyCode,
                CurrencySymbol: product.CurrencySymbol,
                CurrencyThousandSeperator: product.CurrencyThousandSeperator,
                CurrencyDecimalSeperator: product.CurrencyDecimalSeperator,
                CurrencyDecimalPlaces: product.CurrencyDecimalPlaces,
                FinalSalePrice: product.SalePrice,
                SaleType: product.SaleType,
                SalePrice: product.SalePrice,
                // ProviderPrice: product.ProviderPrice,
                DisplaySalePrice: product.DisplaySalePrice,
                OriginlaSalePrice: product.OriginlaSalePrice,
                DisplayOriginalFinalSalePrice: product.FinalSalePrice,
                //FinalSalePrice: product.FinalSalePrice,
                DisplayOriginlaSalePrice: product.DisplayOriginlaSalePrice,
                //DisplayFinalSalePrice: product.DisplayFinalSalePrice,
                LinkedProduct: product.LinkedProduct,
                LinkedSubscriptionName: product.LinkedSubscriptionName,
                IsAddon: product.IsAddon,
                SequencingNumber: product.SequencingNumber ?? null,
                GroupSequenceNumber: product.GroupSequenceNumber ?? null,
                IsDefaultCustomLineItem: product.IsDefaultCustomLineItem ?? false
              }));

            if (this.productsAndLinkedProducts) {
                this.productsAndLinkedProducts.forEach(product => {
                    if (product.LinkedProduct) {
                        product.LinkedProduct.SaleTypeId = product.SaleType;
                    }
                });
            }
            // Ensure we preserve incoming sequencing values and sort the view according to current toggle
            this.quoteLineItemsData = this.sortArrayAsOrderWise(this.productsAndLinkedProducts);
            // Rebuild view ordering based on current grouping toggle
            this.sortAndRebuildView();
            this.quoteLineItemsList.data = this.quoteLineItemsData;
            this._previousPlanIds = (this.frmWizardOne.getRawValue().planIds || []).map((id: any) => String(id));
            this.quoteLineItemsData.forEach(product => {
                product.FinalSalePrice *= product.Quantity;
                product.OriginlaSalePrice *= product.Quantity;
                if (product.LinkedProduct != null) {
                    product.LinkedProduct.Quantity = product.Quantity;
                    product.LinkedProduct.FinalSalePrice *= product.Quantity;
                    product.LinkedProduct.OriginlaSalePrice *= product.Quantity;
                }
            });
            
            if (!isNewCustomer) {
                if (this.branchId) {
                    const branchSub = this._quotesService.getBranchForQuote(this.currentC3CustomerId)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe((response: any) => {
                            this.branchList = response.Data;
                            this.frmWizardOne.get('branch_id')?.setValue(this.branchId);
                            this.customerContactList();
                        });
                    this._subscriptionArray.push(branchSub);
                } else {
                    this.customerContactList();
                }
}
       this.CalculateQuoteLineItemTotal(this.quoteLineItemsList.data);

          if (isNewCustomer && this.productsAndLinkedProducts?.length > 0) {
    this.CurrencyCode = this.productsAndLinkedProducts[0].CurrencyCode;
    this.CurrencySymbol = this.productsAndLinkedProducts[0].CurrencySymbol;
    this.CurrencyDecimalPlaces = this.productsAndLinkedProducts[0].CurrencyDecimalPlaces;
    this.CurrencyThousandSeperator = this.productsAndLinkedProducts[0].CurrencyThousandSeperator;
    this.CurrencyDecimalSeperator = this.productsAndLinkedProducts[0].CurrencyDecimalSeperator;
    this.cdRef.detectChanges();
}

        });
        this._subscriptionArray.push(subscription);
    }

    formatDateObject(dateString: any): any {
        return moment(dateString).format("MMMM DD, YYYY").toString();
    }

    // CalculateQuoteLineItemTotal(productItems: any[]) {
    //     this.quoteLineItemSubTotal = 0;
    //     this.totalQuoteValue = 0;
    //     this.totalDiscount = 0;
    //     this.productSubTotal = 0;
    //     this.DisplayTotalFinalSalePrice = 0;
    //     this.quoteLineItemsTotalPrice = 0;
    //     this.productsAndLinkedProducts = [];

    //     if (productItems.length > 0) {
    //         productItems.forEach((product) => {
    //             const quantity = Number(product.Quantity) || 0;
    //             const unitPrice = Number(product.DisplayFinalSalePrice) || 0;
    //             const discountPerUnit = Number(product.Discount) || 0;

    //             product.TotalPrice = unitPrice * quantity;
    //             product.DiscountAmount = discountPerUnit;
    //             product.UnitPrice = Number(product.DisplayOriginlaSalePrice) || 0;
    //             product.MonthlyUnitPrice = unitPrice;
    //             product.AnnualUnitPrice = unitPrice;
    //             product.SubscriptionTermText = this.formatSubscriptionTerm(product);

    //             this.quoteLineItemsTotalPrice += product.TotalPrice;
    //             this.productsAndLinkedProducts.push(product);
    //             if (product.LinkedProduct) {
    //                 this.productsAndLinkedProducts.push(product.LinkedProduct);
    //             }
    //         });

    //         this.productsAndLinkedProducts.forEach((product) => {
    //             this.quoteLineItemSubTotal += Number(product.FinalSalePrice) || 0;
    //             this.productSubTotal += Number(product.OriginlaSalePrice) || 0;

    //             const productDiscount = Number(product.DiscountAmount) || 0;
    //             this.totalDiscount += productDiscount;

    //             this.DisplayTotalFinalSalePrice += Number(product.DisplayFinalSalePrice) * (Number(product.Quantity) || 0);
    //         });

    //         // Calculate total price with or without VAT based on showPricesExcludeVAT
    //         this.quoteLineItemsTotalPrice = this.showPricesExcludeVAT ? 
    //             this.quoteLineItemsTotalPrice : 
    //             this.quoteLineItemsTotalPrice * (1 + (this.selectedCustomerDetails?.TaxPercentage || 0) / 100);

    //         this.buildQuoteLineItemGroups(productItems);
    //         this.calculateBillingCycleSubtotals(productItems);
    //     } else {
    //         this.groupedQuoteLineItems = [];
    //         this.billingCycleSubtotals = [];
    //     }

    //     // Calculate grand total as sum of all billing cycle subtotals (which already include VAT if applicable)
    //     this.totalQuoteValue = this.billingCycleSubtotals.reduce((sum, subtotal) => sum + subtotal.subTotal, 0);

    //     if (this.selectedCustomerDetails?.TaxName && this.selectedCustomerDetails?.TaxPercentage > 0) {
    //       this.calculateQuoteLineItemTax(this.productsAndLinkedProducts, this.selectedCustomerDetails);
    //     } else {
    //       this.totalTaxAmount = 0;
    //     }
    // }

    CalculateQuoteLineItemTotal(productItems: any[]) {
        this.quoteLineItemSubTotal = 0;
        this.totalQuoteValue = 0;
        this.totalDiscount = 0;
        this.productSubTotal = 0;
        this.DisplayTotalFinalSalePrice = 0;
        this.quoteLineItemsTotalPrice = 0;
        this.productsAndLinkedProducts = [];

        if (productItems.length > 0) {
            productItems.forEach((product) => {
                const quantity = Number(product.Quantity) || 0;
                const unitPrice = Number(product.DisplayFinalSalePrice) || 0;
                const discountValue = Number(product.Discount) || 0;

                product.TotalPrice = unitPrice * quantity;
                if (product.DiscountType === 'Percentage') {
                    const baseUnitPrice = Number(product.DisplayOriginlaSalePrice ?? product.OriginlaSalePrice ?? product.DisplayFinalSalePrice ?? 0);
                    product.DiscountAmount = (baseUnitPrice * discountValue / 100) * quantity;
                } else {
                    product.DiscountAmount = discountValue;
                }
                product.MonthlyUnitPrice = Number(product.DisplayOriginlaSalePrice) || 0;
                product.AnnualUnitPrice = Number(product.DisplayOriginlaSalePrice) || 0;
                product.SubscriptionTermText = this.formatSubscriptionTerm(product);

                this.quoteLineItemsTotalPrice += product.TotalPrice;
                this.productsAndLinkedProducts.push(product);
                if (product.LinkedProduct) {
                    this.productsAndLinkedProducts.push(product.LinkedProduct);
                }
            });

            this.productsAndLinkedProducts.forEach((product) => {
                this.quoteLineItemSubTotal += Number(product.FinalSalePrice) || 0;
                this.productSubTotal += Number(product.OriginlaSalePrice) || 0;

                const productDiscount = Number(product.DiscountAmount) || 0;
                this.totalDiscount += productDiscount;

                this.DisplayTotalFinalSalePrice += Number(product.DisplayFinalSalePrice) * (Number(product.Quantity) || 0);
            });

            // Calculate total price per-item: respect `IsTaxable` for custom items (PlanProductId===0)
            const taxPerc = Number(this.selectedCustomerDetails?.TaxPercentage || 0) / 100;
            let computedTotal = 0;
            this.productsAndLinkedProducts.forEach((product) => {
              const base = Number(product.TotalPrice) || 0;
              const isCustom = (product.PlanProductId === 0 || product.PlanProductId === '0');
              let includeVat = false;
              if (isCustom) {
                includeVat = !!product.IsTaxable;
              } else {
                includeVat = !this.showPricesExcludeVAT && !!product.IsTaxable;
              }
              computedTotal += includeVat ? base * (1 + taxPerc) : base;
            });
            this.quoteLineItemsTotalPrice = computedTotal;

            // Determine whether we should force-show VAT columns because of a custom taxable line item
            this.shouldShowVatColumnsDueToCustomTaxable = this.productsAndLinkedProducts.some((p: any) => (p.PlanProductId === 0 || p.PlanProductId === '0') && !!p.IsTaxable);

            this.buildQuoteLineItemGroups(productItems);
            this.calculateBillingCycleSubtotals(productItems);
        } else {
          this.shouldShowVatColumnsDueToCustomTaxable = false;
            this.groupedQuoteLineItems = [];
            this.billingCycleSubtotals = [];
        }

        // Calculate grand total as sum of all billing cycle subtotals (which already include VAT if applicable)
        this.totalQuoteValue = this.billingCycleSubtotals.reduce((sum, subtotal) => sum + subtotal.subTotal, 0);

        if (this.selectedCustomerDetails?.TaxName && this.selectedCustomerDetails?.TaxPercentage > 0) {
          this.calculateQuoteLineItemTax(this.productsAndLinkedProducts, this.selectedCustomerDetails);
        } else {
          this.totalTaxAmount = 0;
        }
    }

    buildQuoteLineItemGroups(productItems?: any[], preserveGroupOrder: boolean = false) {
      const items = (productItems || this.quoteLineItemsData || []).filter((item: any) => item != null);
        if (!items.length) {
            this.groupedQuoteLineItems = [];
            return;
        }

        if (this.groupByBillingTerm) {
            const groups: { [key: string]: any } = {};
            const taxPerc = Number(this.selectedCustomerDetails?.TaxPercentage || 0) / 100;
            items.forEach((item: any) => {
              const key = this.formatSubscriptionTerm(item) || 'Custom';
              if (!groups[key]) {
                groups[key] = {
                  billingCycleName: key,
                  items: [],
                  subTotal: 0,
                  isCollapsed: !!this.collapsedGroupNames[key]
                };
              }
              groups[key].items.push(item);
              const itemTotal = Number(item.TotalPrice) || 0;
              const isCustom = (item.PlanProductId === 0 || item.PlanProductId === '0');
              let includeVat = false;
              if (isCustom) {
                includeVat = !!item.IsTaxable;
              } else {
                includeVat = !this.showPricesExcludeVAT && !!item.IsTaxable;
              }
              const totalWithVAT = includeVat ? itemTotal * (1 + taxPerc) : itemTotal;
              groups[key].subTotal += totalWithVAT;
            });
            // For each group, either preserve the current array order (useful after drag/drop)
            // or sort by existing GroupSequenceNumber (useful on initial load)
            Object.values(groups).forEach((g: any) => {
              if (g.items && Array.isArray(g.items)) {
                    if (!preserveGroupOrder) {
                      g.items.sort((a: any, b: any) => ((a.GroupSequenceNumber ?? 0) - (b.GroupSequenceNumber ?? 0)));
                    }
                // Ensure GroupSequenceNumber is sequential and fill missing values
                g.items.forEach((it: any, idx: number) => {
                  it.GroupSequenceNumber = it.GroupSequenceNumber ?? (idx + 1);
                });
              }
            });
            this.groupedQuoteLineItems = Object.keys(groups)
                .sort((a: string, b: string) => this.getBillingTermSortOrder(a) - this.getBillingTermSortOrder(b))
                .map((key: string) => groups[key]);
        } else {
            // For non-grouped view compute subtotal by summing each item's display total (respecting IsTaxable precedence)
            const taxPerc = Number(this.selectedCustomerDetails?.TaxPercentage || 0) / 100;
            const totalWithVAT = (items || []).reduce((acc: number, it: any) => {
              const itemTotal = Number(it.TotalPrice) || 0;
              const isCustom = (it.PlanProductId === 0 || it.PlanProductId === '0');
              let includeVat = false;
              if (isCustom) {
                includeVat = !!it.IsTaxable;
              } else {
                includeVat = !this.showPricesExcludeVAT && !!it.IsTaxable;
              }
              return acc + (includeVat ? itemTotal * (1 + taxPerc) : itemTotal);
            }, 0);
            const key = this.getGroupKey('');
            this.groupedQuoteLineItems = [{
                billingCycleName: '',
                items,
                subTotal: totalWithVAT,
                isCollapsed: !!this.collapsedGroupNames[key]
            }];
        }
    }

    calculateBillingCycleSubtotals(productItems: any[]) {
        const groups: { [key: string]: number } = {};
        const taxPerc = Number(this.selectedCustomerDetails?.TaxPercentage || 0) / 100;
        (productItems || []).filter((item: any) => item != null).forEach((item: any) => {
          const key = this.formatSubscriptionTerm(item) || 'Custom';
          const itemTotal = Number(item.TotalPrice) || 0;
          const isCustom = (item.PlanProductId === 0 || item.PlanProductId === '0');
          let includeVat = false;
          if (isCustom) {
            includeVat = !!item.IsTaxable;
          } else {
            includeVat = !this.showPricesExcludeVAT && !!item.IsTaxable;
          }
          const totalWithVAT = includeVat ? itemTotal * (1 + taxPerc) : itemTotal;
          groups[key] = (groups[key] || 0) + totalWithVAT;
        });
        this.billingCycleSubtotals = Object.entries(groups).map(([billingCycleName, subTotal]) => ({ billingCycleName, subTotal }));
    }

    getGroupKey(billingCycleName: string): string {
        return billingCycleName || 'All';
    }

    toggleGroupCollapse(group: any) {
        const key = this.getGroupKey(group.billingCycleName);
        group.isCollapsed = !group.isCollapsed;
        this.collapsedGroupNames[key] = group.isCollapsed;
    }

    onDragStart(event: DragEvent, row: any) {
      if (!this.allowDrag) {
        event.preventDefault();
          return;
      }
        this.draggedQuoteLineItem = row;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', 'drag');
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    onDrop(event: DragEvent, targetRow: any) {
        event.preventDefault();
        if (!this.draggedQuoteLineItem || this.draggedQuoteLineItem === targetRow) {
            return;
        }

        const sourceGroup = this.formatSubscriptionTerm(this.draggedQuoteLineItem);
        const targetGroup = this.formatSubscriptionTerm(targetRow);
        if (this.groupByBillingTerm && sourceGroup !== targetGroup) {
            this.draggedQuoteLineItem = null;
            return;
        }

        const sourceIndex = this.quoteLineItemsData.findIndex(item => item === this.draggedQuoteLineItem);
        const targetIndex = this.quoteLineItemsData.findIndex(item => item === targetRow);
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
            this.draggedQuoteLineItem = null;
            return;
        }

        const [movedItem] = this.quoteLineItemsData.splice(sourceIndex, 1);
        this.quoteLineItemsData.splice(targetIndex, 0, movedItem);
        this.draggedQuoteLineItem = null;
        if (this.groupByBillingTerm) {
          // Recalculate GroupSequenceNumber for the affected billing term group based on current flat order
          const groupKey = this.formatSubscriptionTerm(targetRow);
          const groupItems = this.quoteLineItemsData.filter(item => this.formatSubscriptionTerm(item) === groupKey);
          this.updateGroupSequenceNumbers(groupItems);
          // preserve the array order resulting from the drop when rebuilding groups
          this.buildQuoteLineItemGroups(this.quoteLineItemsData, true);
        } else {
          this.updateSequenceNumbersFlat();
        }
        this.CalculateQuoteLineItemTotal(this.quoteLineItemsData);
        this.cdRef.detectChanges();
    }

    onDragEnd() {
        this.draggedQuoteLineItem = null;
    }

    /*
     * CDK Drop handlers and sequencing helpers
     * - onCdkDrop: for flat list reordering (groupByBillingTerm = false)
     * - onCdkDropGroup: for grouped reordering (groupByBillingTerm = true)
     * - updateSequenceNumbersFlat: updates SequenceNumber for flat list
     * - updateGroupSequenceNumbers: updates GroupSequenceNumber for a group
     * - buildSequencePayload: prepares optimized payload for persistence
     */

    onCdkDrop(event: CdkDragDrop<any[]>) {
      // Only handle flat list reorder when grouping is OFF
      if (this.groupByBillingTerm) {
        // When grouping is ON delegate to onCdkDropGroup
        this.onCdkDropGroup(event);
        return;
      }

      if (event.previousContainer === event.container) {
        moveItemInArray(this.quoteLineItemsData, event.previousIndex, event.currentIndex);
        this.updateSequenceNumbersFlat();
        this.CalculateQuoteLineItemTotal(this.quoteLineItemsData);
        this.cdRef.detectChanges();
      }
    }

    onCdkDropGroup(event: CdkDragDrop<any[]>) {
      // When grouping is ON we only allow reorder inside the same group
      if (!this.groupByBillingTerm) {
        return;
      }

      // Prevent cross-group drops
      if (event.previousContainer !== event.container) {
        // optionally you could transfer if you want to allow cross-group moves
        return;
      }

      const groupItems = event.container.data as any[];
      if (!Array.isArray(groupItems)) {
        return;
      }

      moveItemInArray(groupItems, event.previousIndex, event.currentIndex);
      // Reassign GroupSequenceNumber inside this group only (preserve order)
      this.updateGroupSequenceNumbers(groupItems);
      // Rebuild grouped view and totals while preserving the new order
      this.buildQuoteLineItemGroups(this.quoteLineItemsData, true);
      this.CalculateQuoteLineItemTotal(this.quoteLineItemsData);
      this.cdRef.detectChanges();
    }

    private updateSequenceNumbersFlat(): void {
      if (!this.quoteLineItemsData || !Array.isArray(this.quoteLineItemsData)) return;
      this.quoteLineItemsData.forEach((item: any, index: number) => {
        // SequencingNumber becomes index + 1 for flat ordering.
        item.SequencingNumber = index + 1;
        // keep GroupSequenceNumber untouched
      });
    }

    private updateGroupSequenceNumbers(groupItems: any[]): void {
      if (!groupItems || !Array.isArray(groupItems)) return;
      groupItems.forEach((item: any, index: number) => {
        item.GroupSequenceNumber = index + 1;
      });
    }

    /**
     * Prepare an optimized payload for persistence.
     * If no items passed, builds payload from current lists (flattened).
     */
    buildSequencePayload(items?: any[]): Array<{ Id: number; SequencingNumber: number; GroupSequenceNumber: number; }> {
      const source = items ? items : (this.groupByBillingTerm ? this.groupedQuoteLineItems.flatMap(g => g.items) : this.quoteLineItemsData);
      if (!source || !Array.isArray(source)) return [];
      return source.map((it: any) => {
        const sequencing = typeof it.SequencingNumber === 'number' ? it.SequencingNumber : 0;
        return {
          Id: it.Id,
          SequencingNumber: sequencing,
          GroupSequenceNumber: (typeof it.GroupSequenceNumber === 'number') ? it.GroupSequenceNumber : 0
        };
      });
    }

    /**
     * Convenience: sort data source according to toggle state.
     * - grouping OFF: sorts by SequenceNumber
     * - grouping ON: groups by BillingTerm and sorts inside group by GroupSequenceNumber
     */
    sortAndRebuildView(): void {
        // Always rebuild from the authoritative quote line items list.
        // `productsAndLinkedProducts` is recalculated for totals and may contain derived entries.
        const sourceItems = Array.isArray(this.quoteLineItemsData) && this.quoteLineItemsData.length
          ? this.quoteLineItemsData
          : this.productsAndLinkedProducts;
        this.quoteLineItemsData = this.sortArrayAsOrderWise(sourceItems);
      if (this.groupByBillingTerm) {
        this.buildQuoteLineItemGroups(this.quoteLineItemsData);
        // ensure each group's items are sorted by GroupSequenceNumber
        this.groupedQuoteLineItems.forEach(g => {
          if (g.items && Array.isArray(g.items)) {
            g.items.sort((a: any, b: any) => (a.GroupSequenceNumber || 0) - (b.GroupSequenceNumber || 0));
          }
        });
      } else {
        if (this.quoteLineItemsData && Array.isArray(this.quoteLineItemsData)) {
          this.quoteLineItemsData.sort((a: any, b: any) => (a.SequencingNumber || a.SequenceNumber || 0) - (b.SequencingNumber || b.SequenceNumber || 0));
        }
        // keep groupedQuoteLineItems in sync for UI that reads it
        this.buildQuoteLineItemGroups(this.quoteLineItemsData);
      }
      this.quoteLineItemsList.data = this.quoteLineItemsData;
      this.cdRef.detectChanges();
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

    getBillingTermSortOrder(term: string): number {
        if (!term) {
            return 999;
        }
        const normalized = term.trim().toLowerCase();
        switch (normalized) {
          case '1 month':
            return 1;
          case '1 year':
            return 2;
          case '3 years':
            return 3;
          case 'onetime':
          case 'one time':
            return 4;
          default:
            return 999;
        }
    }

    sortArrayAsOrderWise(arr:any): any[] {
      return [...(arr || [])]
        .sort((a, b) => {
          const getSortOrder = (product: any): number => {
            return this.getBillingTermSortOrder(this.formatSubscriptionTerm(product));
          };
          return getSortOrder(a) - getSortOrder(b);
        })
        .map((item, index) => ({
          ...item,
          SequencingNumber: item?.SequencingNumber ?? index + 1,
        }));
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

    calculateQuoteLineItemTax(productItems: any[], customerTaxDetails: any) {
        this.totalTaxAmount = 0;
        this.linkedProductTaxAmount = 0;
        this.productsAndLinkedProducts = productItems;

        // Calculate tax regardless of display mode; product.FinalSalePrice is pre-tax

        if (customerTaxDetails.TaxTypeName === 'TAX_TYPE_DROPDOWN_OPTION_CUMULATIVE_TAX') {
            const subTaxArray = customerTaxDetails.SubTaxes.split(',');

            if (this.productsAndLinkedProducts.length > 0) {
                this.productsAndLinkedProducts.forEach((product) => {
                    if (product.IsTaxable) {
                        let cummulativeTax = 0;
                        subTaxArray.forEach((index) => cummulativeTax += parseInt(index, 10));
                        product.Tax = cummulativeTax;

                        subTaxArray.forEach((TaxPercentage) => {
                            const subTax = product.FinalSalePrice * (parseFloat(TaxPercentage) / 100);
                            product.FinalSalePrice += subTax;
                            product.TaxFinalSalePriceAfterDiscount = product.FinalSalePrice;
                            this.totalTaxAmount += subTax;
                        });
                    }
                });
            }
        } else {
            this.productsAndLinkedProducts.forEach((product) => {
                if (product.IsTaxable) {
                    product.Tax = parseInt(customerTaxDetails.TaxPercentage, 10);
                    const productTaxAmount = product.FinalSalePrice * (customerTaxDetails.TaxPercentage / 100);
                    product.TaxFinalSalePriceAfterDiscount = productTaxAmount;
                    this.totalTaxAmount += productTaxAmount;
                }
            });
        }

        this.totalQuoteValue = this.productSubTotal + this.totalTaxAmount - this.totalDiscount;
    }
    getDate(date: any) {
        //let date = this.getFormControlValue(form, controlName);
        if (date) {
            return new Date(date.year, date.month - 1, date.day);
        }
        return null;
    }

    getNgbDateStruct(date: any) {
        if (date) {
            date = new Date(date);
            return {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            }
        }
        return null;
    }
    saveQuoteLineItemChanges(row: any, table: any, index: number): void {
        // Ensure Quantity is valid and within the allowed range
        if (row.Quantity === undefined || row.Quantity > 9999 || row.Quantity < 1 || row.Quantity % 1 !== 0) {

            this._toastService.error(this.translateService.instant('TRANSLATE.ERROR_QUOTE_DETAILS_ARE_HAVING_INVALID_OR_NEGATIVE_VALUES_MESSAGE'));

            return;
        }

        // Update FinalSalePrice and OriginalSalePrice based on Quantity
        row.OriginlaSalePrice = row.DisplayOriginlaSalePrice;
        row.FinalSalePrice = row.DisplayOriginalFinalSalePrice;
        row.FinalSalePrice *= row.Quantity;
        row.OriginlaSalePrice *= row.Quantity;

        // If there is a linked product, update its prices and quantity as well
        if (row.LinkedProduct != null) {
            row.LinkedProduct.OriginlaSalePrice = row.LinkedProduct.DisplayOriginlaSalePrice;
            row.LinkedProduct.FinalSalePrice = row.LinkedProduct.DisplayOriginalFinalSalePrice;
            row.LinkedProduct.Quantity = row.Quantity;
            row.LinkedProduct.FinalSalePrice *= row.Quantity;
            row.LinkedProduct.OriginlaSalePrice *= row.Quantity;
        }

        // Recalculate the quote line item totals
        this.CalculateQuoteLineItemTotal(table.data);

        // Exit editing mode for the row
        row.isEditing = false;
    }



   getProductsForQuoteLineItemPoup()  {
        const quoteId = this.QuoteId;
        const quoteLineItemsReqBody = {
            QuoteId: quoteId,
            CustomerC3Id: this.currentC3CustomerId,
            CurrencyCode: this.selectedCustomerDetails?.CurrencyCode ?? this.CurrencyCode ?? null,
            QuoteLineItemTable: this.quoteLineItemsData
        };

        const modalRef = this._modalService.open(QuoteLineItemPopUpComponent, {
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            size: 'xl',
            backdrop: 'static',

        });

        modalRef.componentInstance.quoteId = quoteId;
        modalRef.componentInstance.currencyCode = this.CurrencyCode; 
        modalRef.componentInstance.setCustomerC3Id(this.frmWizardOne.get('isNewCustomer')?.value ? null : this.currentC3CustomerId);

        if (this.frmWizardOne.get('isNewCustomer')?.value) {
         const checkedAddress = this.buyerAddressList?.find(a => a.IsChecked);
         const countryCode = checkedAddress?.Country ?? null;
         modalRef.componentInstance.newCustomerCountryCode = countryCode;
       }
        modalRef.componentInstance.quoteLineItemsTableData = this.quoteLineItemsData;
        modalRef.componentInstance.C3UserId =this.QuoteCustomerDetails?.[0]?.C3UserId || null;
        modalRef.componentInstance.CustomerRefId =this.QuoteCustomerDetails?.[0]?.TenantId || null;
        modalRef.componentInstance.isNewCustomer = this.frmWizardOne.get('isNewCustomer')?.value;
      //  modalRef.componentInstance.selectedPlanIds =this.frmWizardOne.get('planIds')?.value || [];
      
      modalRef.componentInstance.selectedPlanIds = this.frmWizardOne.getRawValue().planIds || [];
      modalRef.componentInstance.planListData = this.planList; 

        modalRef.result.then(
            (result: any) => {
                const productDetails = result.UniqueselectedQuoteLineItemList;
                const removedProducts = result.RemovedProducts;

                 productDetails.forEach((product: any) => {
            if (!product.PlanName && product.PlanProductId) {
                const matchedPlan = (this.planList || []).find((plan: any) =>
                    plan.ID === product.PlanId
                );
                if (matchedPlan) {
                    product.PlanName = matchedPlan.Name;
                }
            }
        });
                if (removedProducts) {
                    removedProducts.forEach((deletedProduct: any) => {
                        this.quoteLineItemsData.forEach((product: any) => {
                            if (product.PlanProductId === deletedProduct.PlanProductId) {
                                if (product.QuoteLineItemId) {
                                    this.deletedQuoteLineItemIds.push(product.QuoteLineItemId);
                                }
                            }
                        });
                    });
                }

                productDetails.forEach((product: any) => {
                    // The popup returns the FULL current selection (previously-added items included,
                    // not just the newly checked one). If a product is already in the quote, its
                    // existing entry carries the real QuoteLineItemId from the DB — pushing the
                    // popup's copy (QuoteLineItemId undefined) on top of it and de-duping afterwards
                    // discarded the real-ID entry, so the next save re-inserted it as a duplicate row.
                    // Skip already-present products so the tracked entry (and its id) is left untouched.
                    const alreadyInQuote = this.quoteLineItemsData.some((item: any) => item.PlanProductId === product.PlanProductId);
                    if (alreadyInQuote) {
                        return;
                    }
                    // Ensure newly added item goes last.
                    if (this.groupByBillingTerm) {
                        const billingTermKey = this.formatSubscriptionTerm(product);
                        const sameGroupItems = this.quoteLineItemsData.filter(item => this.formatSubscriptionTerm(item) === billingTermKey);
                        const lastGroupIndex = sameGroupItems.reduce((max, item) => {
                            const seq = Number(item.GroupSequenceNumber) || 0;
                            return seq > max ? seq : max;
                        }, 0);
                        product.GroupSequenceNumber = lastGroupIndex + 1;
                    } else {
                        product.SequencingNumber = (this.quoteLineItemsData?.length || 0) + 1;
                    }
                    this.quoteLineItemsData.push(product);
                });

                if (removedProducts && this.quoteLineItemsData) {
                    this.quoteLineItemsData = this.quoteLineItemsData.filter(productData =>
                        !removedProducts.some(product => product.PlanProductId === productData.PlanProductId)
                    );
                }

                // Keep only the last occurrence of duplicate products so newly added items remain last.
                const seenKeys = new Set<string>();
                this.quoteLineItemsData = this.quoteLineItemsData
                    .slice()
                    .reverse()
                    .filter((item: any) => {
                        const key = `${item.PlanProductId}::${item.Name}`;
                        if (seenKeys.has(key)) {
                            return false;
                        }
                        seenKeys.add(key);
                        return true;
                    })
                    .reverse();
                if (this.frmWizardOne.get('isNewCustomer')?.value && this.quoteLineItemsData?.length > 0) {
                    const firstItem = this.quoteLineItemsData[0];
                    this.CurrencyCode = firstItem.CurrencyCode;
                    this.CurrencySymbol = firstItem.CurrencySymbol;
                    this.CurrencyDecimalPlaces = firstItem.CurrencyDecimalPlaces;
                    this.CurrencyThousandSeperator = firstItem.CurrencyThousandSeperator;
                    this.CurrencyDecimalSeperator = firstItem.CurrencyDecimalSeperator;
                    this.cdRef.detectChanges();
                }
                // Ensure newly added items are ordered by billing term before rebuilding the view.
                this.productsAndLinkedProducts = this.quoteLineItemsData;
                this.sortAndRebuildView();
                this.quoteLineItemsList.data = this.quoteLineItemsData;
                this.CalculateQuoteLineItemTotal(this.quoteLineItemsData);


                this.actionHeaderLoader();
            },
            (error) => {
                this.actionHeaderLoader();
            }
        );
    }

  deleteQuoteLineItem(row: any, index: number): void {
    const btnok = this.translateService.instant('TRANSLATE.BUTTON_TEXT_OK')
    const confirmationMessage = this.translateService.instant('TRANSLATE.POPUP_DELETE_QUOTE_LINE_ITEM_CONFIRMATION_TEXT', { ProductName: row.Name });

    this._notifierService.confirm({ title: confirmationMessage, confirmButtonText: btnok, confirmButtonColor: '#f8285a' }).then((result) => {
      if (result.isConfirmed) {
        setTimeout(() => {
          // Mark the item as inactive
          row.IsActive = 0;

          // Remove the exact item from the table and master arrays
          const listIndex = this.quoteLineItemsList.data.findIndex((item: any) => item === row);
          if (listIndex >= 0) {
            this.quoteLineItemsList.data.splice(listIndex, 1);
          }

          if (Array.isArray(this.quoteLineItemsData)) {
            this.quoteLineItemsData = this.quoteLineItemsData.filter((item: any) => item !== row);
          }

          // Track the deleted item by adding its ID to deletedQuoteLineItemIds
          if (row.QuoteLineItemId !== undefined && row.QuoteLineItemId !== null) {
            this.deletedQuoteLineItemIds.push(row.QuoteLineItemId);
          }

          const localStorageKeyPrepend = 'QuoteLineItems_CustomerC3Id';
          const localStorageQuoteKeyName = `${localStorageKeyPrepend}_${this.currentC3CustomerId}`;
          const storedData = this._quotesService.dictOfQuoteLineItems[localStorageQuoteKeyName];

          if (storedData !== undefined && storedData !== null && storedData !== '') {
            this.localStorageQuoteKeyNameParsed = JSON.parse(storedData);
            this.localStorageQuoteKeyNameParsed = this.quoteLineItemsData;
            this._quotesService.dictOfQuoteLineItems[localStorageQuoteKeyName] = JSON.stringify(this.localStorageQuoteKeyNameParsed);
            //localStorage.setItem(localStorageQuoteKeyName, JSON.stringify(this.localStorageQuoteKeyNameParsed));
          } else {
            this._quotesService.dictOfQuoteLineItems[localStorageQuoteKeyName] = JSON.stringify(this.quoteLineItemsData);
            //localStorage.setItem(localStorageQuoteKeyName, JSON.stringify(this.quoteLineItemsData));
          }

          // Recalculate the totals after deletion
          this.CalculateQuoteLineItemTotal(this.quoteLineItemsData);
          this.cdRef.detectChanges();
        }, 0);
      }
    });
  }

  UpdateCustomerName(row: any){
    const confirmationMessage = this.translateService.instant('TRANSLATE.POPUP_UPDATE_CUSTOMER_NAME_CONFIRMATION_TEXT');
    this._notifierService.confirm({title:confirmationMessage}).then((result: { isConfirmed: any; isDenied: any; }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        if (row != null) {
          row.customerNameToUpdate = this.frmWizardTwo.get('customerNameToUpdate')?.value
          let n = this.frmWizardTwo.get('customerNameToUpdate')?.value.split(' ');
          if (n.length >= 2) {
            row.LastName = n[n.length - 1];
            row.FirstName = n.slice(0, n.length - 1).join(' ');
          } else {
            row.FirstName = n[0];
            row.LastName = '';
          }
          row.FullName = row.customerNameToUpdate;
          row.IsEdit = false;
          this._toastService.success(
            this.translateService.instant('TRANSLATE.CUSTOMER_NAME_UPDATE_SUCCESS'));
      }
      else {
        this._toastService.error(
          this.translateService.instant('TRANSLATE.CUSTOMER_NAME_UPDATE_FAILURE'));
      }
      }
    });
  }
  
  onExportPDF() {
    this._quotesService.exportPDF('sample-table-for-pdf-view', this.selectedCustomerDetails.CustomerName, this.frmAddQuote_QuoteName);
  }

  onPurchasTermsOptionClick(option : any){
    if(this.QuoteVersionId == 0){
      if(option == 'custom'){
        this.purchaseTermDisableOption = false;
        this.frmWizardOne.get('quote_puchasedescription').setValue('');
      }
      else if(option == 'default'){
        this.purchaseTermDisableOption = true;
        this.frmWizardOne.get('quote_puchasedescription').setValue(this.defaultPurchaseTerms);
      }
    }
    else{
      if(this.QuoteVersionId != 0){
        if(this.quoteSellerCompanyDetails?.DefaultPurchaseTermsValue == 'default' && option == 'default'){
          this.purchaseTermDisableOption = true;
          this.frmWizardOne.get('quote_puchasedescription').setValue(this.savedDefaultPurchaseTerms);
        }
        else if(this.quoteSellerCompanyDetails?.DefaultPurchaseTermsValue == 'custom' && option == 'custom'){
          this.purchaseTermDisableOption = false;
          this.frmWizardOne.get('quote_puchasedescription').setValue(this.savedCustomPurchaseTerms);
        }
        else if(this.quoteSellerCompanyDetails?.DefaultPurchaseTermsValue == 'default' && option == 'custom'){
          this.purchaseTermDisableOption = false;
          this.frmWizardOne.get('quote_puchasedescription').setValue('');
        }
        else if(this.quoteSellerCompanyDetails?.DefaultPurchaseTermsValue == 'custom' && option == 'default'){
          this.purchaseTermDisableOption = true;
          this.frmWizardOne.get('quote_puchasedescription').setValue(this.defaultPurchaseTerms);
        }
        else{
          this.frmWizardOne.get('quote_puchasedescription').setValue(this.PurchaseTerms);
        }
      }
    }
  }

  onPaymentTermsOptionClick(option : any){
    if(this.QuoteVersionId == 0){
      if(option == 'custom'){
        this.paymenTermDisableOption = false;
        this.frmWizardOne.get('quote_paymentsterm').setValue('');
      }
      else if(option == 'default'){
        this.paymenTermDisableOption = true;
        this.frmWizardOne.get('quote_paymentsterm').setValue(this.defaultPaymentTerms);
      }
    }
    else{
      if(this.QuoteVersionId != 0){
        if(this.quoteSellerCompanyDetails?.DefaultPaymentTermsValue == 'default' && option == 'default'){
          this.paymenTermDisableOption = true;
          this.frmWizardOne.get('quote_paymentsterm').setValue(this.savedDefaultPaymentTerms);
        }
        else if(this.quoteSellerCompanyDetails?.DefaultPaymentTermsValue == 'custom' && option == 'custom'){
          this.paymenTermDisableOption = false;
          this.frmWizardOne.get('quote_paymentsterm').setValue(this.savedCustomPaymentTerms);
        }
        else if(this.quoteSellerCompanyDetails?.DefaultPaymentTermsValue == 'default' && option == 'custom'){
          this.paymenTermDisableOption = false;
          this.frmWizardOne.get('quote_paymentsterm').setValue('');
        }
        else if(this.quoteSellerCompanyDetails?.DefaultPaymentTermsValue == 'custom' && option == 'default'){
          this.paymenTermDisableOption = true;
          this.frmWizardOne.get('quote_paymentsterm').setValue(this.defaultPaymentTerms);
        }
        else{
          this.frmWizardOne.get('quote_paymentsterm').setValue(this.PaymentTerms);
        }
      }
    }
  }

  onEmailOptionClick(option : any){
    this.createByDetails = {};
    if(option == 'createdDefault')
    {
      this.createByDetails.Name = '';
      this.createByDetails.EmailAddress = this.quoteSellerCompanyDetails?.EmailAddress;
      this.createByDetails.Type = 'createdDefault';
      this.frmWizardThree.get('SelectedEmailType')?.setValue('createdDefault');
           
    }
    else if(option == 'default'){
      this.createByDetails.Name = '';
      this.createByDetails.EmailAddress = this.defaultEmail;
      this.createByDetails.Type = 'default';
      this.frmWizardThree.get('SelectedEmailType')?.setValue('default');
    }
    else if(option === 'loggedInUser'){
      this.createByDetails.Name = this.users[0].Name;
      this.createByDetails.EmailAddress = this.users[0].EmailAddress;
      this.createByDetails.Type = 'loggedInUser';
      this.frmWizardThree.get('SelectedEmailType')?.setValue('loggedInUser');
    }
    else if(option == 'selectedAccountManager'){
      const c3Id=this.frmWizardThree.get('Account_Manager_Id').value;
       if(!this.frmWizardThree.get('Account_Manager_Id').value && this.accountManagersData.length >0){
		       this._toastService.error(
           this.translateService.instant('TRANSLATE.QUOTE_ERROR_TEXT_FOR_EMPTY_ACCOUNT_MANAGER'));
      }else{
            const selectedAccountManagerData = this.accountManagersData.find(x=> x.C3Id === c3Id);
            if (!selectedAccountManagerData) {
              this._toastService.error(
                this.translateService.instant('TRANSLATE.QUOTE_ERROR_TEXT_FOR_EMPTY_ACCOUNT_MANAGER')
              );
              return;
            }
            this.createByDetails.Name = selectedAccountManagerData.FirstName;
            this.createByDetails.EmailAddress = selectedAccountManagerData.Email;
            this.createByDetails.Type = 'selectedAccountManager';
            this.frmWizardThree.get('SelectedEmailType')?.setValue('selectedAccountManager');
           }
    }
  }

  trackById(index: number, item: any): any {
    return item.EmailAddress; // Track by unique identifier
  }
  
  
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  private trackFormChanges(form: FormGroup) {
    const subscription = form.valueChanges.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this._unsavedChangesService.setUnsavedChanges(form.dirty);
    });
    this._subscriptionArray.push(subscription);
  }
  copyToClipboard(): void {
    let env :any =localStorage.getItem('AvailableEnvironments');
   env=JSON.parse(env);
   let envid =env[0]?.Id;
   const shareableUrl = `${window.location.protocol}//${window.location.host}/quote/${envid}/${this.quoteURL}`;
  
   

   navigator.clipboard.writeText(shareableUrl).then(() => {
     this._notifierService.success({
       title: this.translateService.instant('TRANSLATE.QUOTE_COPY_CONFIRMATION_SUCCESS_MESSAGE')
     });
   }).catch(() => {
     this._notifierService.alert({
       title: this.translateService.instant('TRANSLATE.QUOTE_COPY_CONFIRMATION_ERROR_MESSAGE')
     });
   });
}

editPartnerAddress(){
    const modalRef = this._modalService.open(PartnerAddressDetailsPopupComponent, {
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        size: 'lg',
        backdrop: 'static',
    });
    modalRef.componentInstance.entityName = 'Customer' // Bind fetched data to the modal
    modalRef.componentInstance.recordId = this.selectedCustomerDetails?.C3Id ?? this.currentC3CustomerId ?? null;
    modalRef.componentInstance.isMarkAsDefault = true;
    modalRef.componentInstance.CustomerName = this.selectedCustomerDetails?.CustomerName;
    modalRef.componentInstance.IsSelectedAddressId = this.selectedAddressId;
    modalRef.componentInstance.IsCurrentAddress = this.IsCurrentAddress;
    modalRef.result.then((selectedAddressId: any) => {
        if (selectedAddressId) {
            // Save it locally
            this.selectedAddressId = selectedAddressId.BillFromAddressId;
            this.getAddressDettails(this.selectedCustomerDetails?.C3Id ?? this.currentC3CustomerId ?? null);
        }
    },
        (reason) => {
            modalRef.close();
        }
    );
    this.cdRef.detectChanges();
}

  fetchAccountManagersData(): void {
        const searchParams = {
            StartInd : 1,
            SortColumn: 'AccountManagerId',
            SortOrder: 'asc',
            PageSize: 1000,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId || null,
          }

        const subscription =  this._accountManagerService.getList(searchParams).pipe(takeUntil(this.destroy$)).subscribe(
            ({ Data }: any) => {
                this.accountManagersData = Data;
            }
        );
        this._subscriptionArray.push(subscription);
    }

    addAccountManagerDetails(){ 
      //this.onEmailOptionClick(this.frmWizardThree.get('account_Manager_id')?.value);
      this.createByDetails = {};
      let accountid = this.frmWizardThree.get('Account_Manager_Id')?.value;
      this.frmWizardThree.patchValue({
         SelectedEmailType: 'selectedAccountManager'
       });
      let selectedAcccountManagerData = this.accountManagersData.find(x=> x.C3Id === accountid);
      this.createByDetails.Name = selectedAcccountManagerData?.FirstName + ' ' + selectedAcccountManagerData?.LastName;
      this.createByDetails.EmailAddress = selectedAcccountManagerData?.Email;
      this.createByDetails.Type = 'selectedAccountManager';
      this.frmWizardThree.get('SelectedEmailType')?.setValue('selectedAccountManager');

    }

    selectAddress(selectedRow: any, listType: 'existing' | 'new'): void {
    const isSelected = selectedRow.IsChecked;
    const list = listType === 'new' ? this.buyerAddressList : this.addressDetails;
    list.forEach(a => {
        if (a !== selectedRow) {
            a.IsChecked = false;
        }
    });
    selectedRow.IsChecked = isSelected;
}
onplanChange(event: any) {
  const currentPlanIds = Array.isArray(event) ? event.map((p: any) => String(p.ID ?? p)): [];

  const removedPlanId = this._previousPlanIds.find((id: any) => !currentPlanIds.includes(String(id)));
  if (removedPlanId) {

    const removedPlan = (this.planList || []).find((p: any) => String(p.ID) === String(removedPlanId));
    const removedPlanName = removedPlan?.Name;

    const hasProduct = (this.quoteLineItemsData || []).some((x: any) => x.PlanName === removedPlanName);

    if (hasProduct) {
      this._toastService.error(this.translateService.instant('TRANSLATE.QUOTE_REMOVE_PRODUCTS_BEFORE_PLAN_DELETE'));
  const restoredIds = this._previousPlanIds.map((id: any) => Number(id));
  const restoredPlans = (this.planList || []).filter((p: any) => restoredIds.includes(Number(p.ID)));
  this.frmWizardOne.get('planIds') ?.setValue(restoredIds, { emitEvent: false });
                    setTimeout(() => {
                      this.frmWizardOne.get('planIds')
                        ?.setValue([...restoredIds], { emitEvent: false });
                    }, 0);
                  return;
    }
  }
  this._previousPlanIds = currentPlanIds;
}

}


