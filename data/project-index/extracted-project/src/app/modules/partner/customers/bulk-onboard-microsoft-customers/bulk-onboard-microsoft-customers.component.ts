import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { orderBy, uniq } from 'lodash';
import { Subject, Subscription, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Entity } from 'src/app/shared/models/enums/enums';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-bulk-onboard-microsoft-customers',
  templateUrl: './bulk-onboard-microsoft-customers.component.html',
  styleUrl: './bulk-onboard-microsoft-customers.component.scss'
})
export class BulkOnboardMicrosoftCustomersComponent extends C3BaseComponent implements OnInit,OnDestroy {

  entityEnum: typeof Entity = Entity;
  customerC3Id: string | null = null;
  customerName: string | null = null;
  providerId: string | null = null;
  providerName: string | null = null;
  partnerSupportedCurrencies: any;
  selectedCurrencyCode: any = null;
  currency: any =null;
  plansWithStatusAsSuccess: any[];
  plans: any;
  selectedPlan: any = null;
  InternalPlanReferenceID: any= null;
  //frmBulkOnboardCustomers: FormGroup;
  loadingCSPCustomers: boolean;
  nonOnboardedCustomers: any;
  selectedCustomersFromGrid: any = [];
  selectedCustomersList: any = [];
  selectAllCheckbox: any;
  selectedCustomersDataArray: any[];
  selectedCustomersJSONString: string;
  bulkOnboardCustomersModel: any = {};
  canProceedForBulkOnboardingResellerCustomers: any;
  datatableConfig: ADTSettings | any;
  entityName: string | null;
  recordId: string | null;
  hasSupportForResellersWithMPNID: string = 'No'
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  public destroy$ = new Subject<void>;
  _subscriptionArray: Subscription[] = [];

  billingEmailList:any = {}

  frmCustomerCurrencyandPlans:FormGroup;
  shouldShow: boolean =false;

  @ViewChild('firstColCheckboxes') firstColCheckboxes: TemplateRef<any>;
  @ViewChild('fourthColBillingEmail') fourthColBillingEmail: TemplateRef<any>;
  isloading: boolean =false;

  constructor(
    private _customerService: CustomersListingService,
    private _notifierService: NotifierService,
    public _translateService: TranslateService,
    private _toastService: ToastService,
    private _cdRef: ChangeDetectorRef,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    private _commonService: CommonService,
    private _fb: FormBuilder,
    private _appService: AppSettingsService,
    private _unsavedChangesService: UnsavedChangesService,
    public _pageInfo:PageInfoService,
    private _loaderService: LoaderService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.entityName = _commonService.entityName;
    this.recordId = _commonService.recordId;

    let providerIdForOnboard = localStorage.getItem("providerIdForOnboard");
    if (providerIdForOnboard === undefined || providerIdForOnboard === null || providerIdForOnboard === '') {
      _router.navigate(['partner/customers/bulkonboardcustomers']);
    }

    let customerC3IdForLinkCustomer = localStorage.getItem("customerC3IdForLinkCustomer")
    if ( customerC3IdForLinkCustomer !== undefined && customerC3IdForLinkCustomer !== null && customerC3IdForLinkCustomer !== '') {
      this.customerC3Id = customerC3IdForLinkCustomer;
    }

    let customerNameForLinkCustomer = localStorage.getItem("customerNameForLinkCustomer")
    if (customerNameForLinkCustomer !== undefined && customerNameForLinkCustomer !== null && customerNameForLinkCustomer !== '') {
      this.customerName = customerNameForLinkCustomer;
    }    

    if (providerIdForOnboard!== undefined && providerIdForOnboard !== null && providerIdForOnboard !== '') {
      this.providerId = providerIdForOnboard;
    }

    let providerNameForOnboard = localStorage.getItem("providerNameForOnboard")
    if (providerNameForOnboard !== undefined && providerNameForOnboard!== null && providerNameForOnboard !== '') {
      this.providerName = providerNameForOnboard;
    }
     
    this.frmCustomerCurrencyandPlans = _fb.group({
      selectedCurrencyCode:[null, Validators.required],
      selectedPlan:[null,Validators.required]
    })

    if (_commonService.entityName === 'Partner' && (this.customerC3Id !== undefined && this.customerC3Id !== null && this.customerC3Id !== '')) {
      this.getNonOnboardedCustomers();
    }
  }

  getApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
      this.hasSupportForResellersWithMPNID = response.Data.HasSupportForResellersWithMPNID;
    });
    this._subscriptionArray.push(subscription);
  }

  getAllCustomers(event:any){
    let selectedCustomersIdList: any[] = [];
      if(event){
        selectedCustomersIdList = this.nonOnboardedCustomers?.map((item:any)=>{
          return item.Id
        })
        this.selectedCustomersList = this.nonOnboardedCustomers;
      }else{
        selectedCustomersIdList = [];
        this.selectedCustomersList = [];
      }
  }

  handleSelection(event: any) {
    let selectedCustomersIdList: any[] = [];
    //making the selected customers list empty
    this.selectedCustomersList = [];
    //taking the selected customers from grid into a temporary array
    this.selectedCustomersFromGrid = event;

    if(this.selectedCustomersFromGrid.length > 0){
      this.selectedCustomersFromGrid.forEach(selectedItem => {
        selectedItem.IsSelectedForOnboarding = true;
        selectedCustomersIdList.push(selectedItem.Id);
        this.selectedCustomersList.push(selectedItem);
      })
    }
  }

  ngOnInit(): void {
    this.getApplicationData();
    this.checkIfResellerIsLinkedWithProvider();
    this.getPlans();
    this.getPartnerSupportedCurrencies();
    this._pageInfo.updateTitle(this._translateService.instant("CUSTOMER_ONBOARDING_BREADCRUMB_BUTTON_TEXT_BULK_CUSTOMER_ONBOARDING"),true);
    this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE']);
  }


  getPartnerSupportedCurrencies() {
    const subscription = this._commonService.getSupportedCurrencies().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.partnerSupportedCurrencies = response.Data;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  onCurrencyChange() {
    //startBlockUI();
    this.selectedCurrencyCode = this.frmCustomerCurrencyandPlans.get('selectedCurrencyCode').value;
    if(this.frmCustomerCurrencyandPlans.valid){
      this.shouldShow= false;
      this._cdRef.detectChanges();
      this.handleTableConfig();
    }
    
    //stopBlockUI();
  }
  getCurrency() {
    if (this.selectedCurrencyCode !== null && this.selectedCurrencyCode !== undefined) {
      this.currency = this.selectedCurrencyCode.CurrencyCode;
    }
  }
  getPlans() {
    //startBlockUI();
    this.plansWithStatusAsSuccess = [];
    const subscription = this._commonService.getPlans(1, 50000).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.plans = response.Data;
      this.plans.filter((plan: any) => {
        if (plan.PlanStatus === 'Success') {
          this.plansWithStatusAsSuccess.push(plan);
        }
      });
      this.plans = this.plansWithStatusAsSuccess;
    });
    //stopBlockUI();
    this._subscriptionArray.push(subscription);
  }

  onPlanChange() {
    //startBlockUI();
    this.InternalPlanReferenceID = this.frmCustomerCurrencyandPlans.get('selectedPlan').value;
    this.selectedPlan = this.plans.filter((plan: any) => {
      return plan.InternalPlanId === this.InternalPlanReferenceID;
    });
    if(this.frmCustomerCurrencyandPlans.valid){
      this.shouldShow= false;
      this._cdRef.detectChanges();
      if((this._commonService.entityName === 'Partner') || (this._commonService.entityName === 'Reseller' && this.canProceedForBulkOnboardingResellerCustomers === true)){
        this.getNonOnboardedCustomers();
      }
    }
  }

  clearBulkOnboardCustomersFormValues() {
    //this.frmBulkOnboardCustomers.reset();
    this.plans = [];
    this.selectedPlan = [];
    this.InternalPlanReferenceID = null;
  }

  getNonOnboardedCustomers() {
    //startBlockUI();
    this.loadingCSPCustomers = true;
    this.shouldShow = false;
    //this._cdRef.detectChanges();
    this._loaderService.commonStartLoading();
    const subscription = this._customerService.getNonOnboardedCustomersFromProvider().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.nonOnboardedCustomers = orderBy(response.Data, ['CompanyName'], ['asc']);
      this.shouldShow= false;
      this._cdRef.detectChanges();
      this.isloading= true;
      this.handleTableConfig();
      this.loadingCSPCustomers = false;
      this._loaderService.commonStopLoading();
    });
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    setTimeout(() => {
      this.applyEscapeHTML(this.nonOnboardedCustomers);
      this.shouldShow= true;
      const self = this;
      this.datatableConfig = {
        serverSide: false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        data: this.nonOnboardedCustomers,
        ordering:false,
        ADTSettings: {
          enableEscapeHTML: true
        },
        columns: [
          // {
          //   title: 'CheckBox',
          //   className:'col-md-1',
          //   defaultContent: '',
          //   ngTemplateRef: {
          //     ref: this.firstColCheckboxes,
          //   },
          //   orderable:false
          // },

          { 
            title: this._translateService.instant('TRANSLATE.CUSTOMER_ONBOARDING_TABLE_HEADER_TEXT_COMPANY_NAME'), 
            data: 'CompanyName',
            className:'col-md-3',
            render: (data: string, type: any, row: any, meta: any) => {
              return `<span class="fw-semibold">${data}</span>`
            },
            searchable:true,
            orderable:false,
          },

          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_ONBOARDING_TABLE_HEADER_TEXT_CSP_ID'),
            data: 'Id',
            className: 'col-md-3',
            searchable:true,
            orderable:false
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_ONBOARDING_TABLE_HEADER_TEXT_DOMAIN'),
            data: 'Domain',
            className : 'col-3',
            searchable:true,
            orderable:false
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOMER_ONBOARDING_TABLE_HEADER_TEXT_BILLING_EMAIL'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.fourthColBillingEmail,
            },
            className:'col-md-2 text-start',
            orderable:false
          },
        ],
      };
      this._cdRef.detectChanges();
    });
  }

  checkIsAllEmailValid() {
    let isAllEmailValid = true;
    for (let i of Object.keys(this.billingEmailList)) {
      if (this.billingEmailList[i].value) {
        this.selectedCustomersList.forEach((obj: any) => {
          if (obj.Id === i) {
            obj.Email = this.billingEmailList[i].Email;
          }
        });
        document.getElementById(this.billingEmailList[i].Id).style.display = 'none'
      } else {
        isAllEmailValid = false;
        document.getElementById(this.billingEmailList[i].Id).style.display = 'block'
      }
    }
    return isAllEmailValid;
  }

  onEmailUpdate(item:any){
    let regex = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
   // if(this.billingEmailList.hasOwnProperty(item.Id)){
      if(item.Email!==null && item.Email !== undefined && item.Email !== ''){
        if(regex.test(item.Email)){
          this.billingEmailList[item.Id] = {
            value:true,
            Id: 'bulkOnboardCustomers_Billing_Email_'+item.UniqueKey,
            Email: item.Email
          }
        }else{
          this.billingEmailList[item.Id] = {
            value:false,
            Id: 'bulkOnboardCustomers_Billing_Email_'+item.UniqueKey,
            Email: item.Email
          }
        }
      } else{
        this.billingEmailList[item.Id] = {
          value:true,
          Id: 'bulkOnboardCustomers_Billing_Email_'+item.UniqueKey,
          Email: item.Email
        }
      }

      this.nonOnboardedCustomers.forEach((obj:any)=>{
        if(item.Id === obj.Id){
          obj.Email = item.Email;
        }
      });
    //}
  }

  // function to update the list that holds the ID's of the Customers selected for onboarding
  updateSelectedList(item: any) {
    let existingCustomer = null;
    existingCustomer = this.selectedCustomersList.find((a: any) => {
      return a.Id === item.Id;
    });

    if (existingCustomer === null || existingCustomer === undefined) {
      this.selectedCustomersList.push(item);
    }
    else {
      this.removeFromList(item);
    }
    this._cdRef.detectChanges();
  }

  // function to remove the items from the list that holds the ID's of the Customers selected for onboarding
  removeFromList(item: any) {
    let message = this._translateService.instant('TRANSLATE.BULK_UPLOAD_CUSTOMER_REMOVE_CONFORMATION');
    let btnOkText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');

    this._notifierService.confirm({ title: message, confirmButtonText: btnOkText, icon: 'info' }).then((result: { isConfirmed: any, isDismissed: any }) => {

      if (result.isConfirmed) {
        let index = this.selectedCustomersList.indexOf(item);
        this.selectedCustomersList.splice(index, 1);
        delete this.billingEmailList[item.Id];
        this.updateSelectedStatus(false, item.Id);
        /*
         Here we are un-check/un-selecting the select all customers checkbox if selected customers count not equal to total non-onboarded customers count
        */
        if ((this.selectedCustomersList.length !== this.nonOnboardedCustomers.length) && this.selectAllCheckbox?.checked) {
          /* Need to uncomment below line once the header checkbox feature implemented  */
          //this.selectAllCheckbox.checked = false;
        }
      } else if (result.isDismissed) {
        this.updateSelectedStatus(true, item.Id);
      }
      this._cdRef.detectChanges();

    }).catch((err) => {

    });
    this.loadingCSPCustomers = false;
  }

  // function to update the selected status of the deselected item
  updateSelectedStatus(status: boolean | null, Id: any) {
    this.nonOnboardedCustomers.forEach((a: any) => {
      if (a.Id === Id) {
        setTimeout(() => {
          a.IsSelectedForOnboarding = status;
          this._cdRef.detectChanges();
        },);
      }
    });
  }


  onSelectedItemClicked(item: any) {
    //Need to implement once the c3 table search part is done
    //filter datasource
    //this.filterCustomerDataSource.filter({ CompanyName: item.CompanyName });
  }

  // Function that Generates the JSON Object
  createSelectedCustomersJSONObject(selectedList: any) {
    this.selectedCustomersDataArray = [];
    selectedList.forEach((selectedCustomer: any) => {
      // if (selectedCustomer.IsSelectedForOnboarding) {
        let selectedProviderCustomer = {
          ServiceProviderCustomerId: selectedCustomer.TenantId,
          ServiceProviderCustomerName: selectedCustomer.CompanyName,
          BillingEmail: selectedCustomer.Email,
          Domain: selectedCustomer.Domain
        };
        this.selectedCustomersDataArray.push(selectedProviderCustomer);
      // }
    });
    let generatedJSONString = JSON.stringify(this.selectedCustomersDataArray);
    return generatedJSONString;
  }

  bulkOnBoardCustomers() {

    if(!this.checkIsAllEmailValid()){
      this._toastService.error('Please provide valid email');
      return;
    }
    let obj: any = {
      EventName: "OnBoardCustomer",
      ProductVariantId: 0,
      planProductId: 0,
      cartId: 0,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      ProductSkuDetails: null
    }
    // this._notifierService.confirm({ title: "TODO:getCustomNotificationResponsePopup, Custom Notification popup is pending" }).then((result: { isConfirmed: any, isDenied: any }) => {
    //   if (result.isConfirmed) {
    //     this.submit();
    //   }
    // })
    this.submit();
  }

  submit() {
    if (this.selectedCustomersList.length >= 1) {
      this.getCurrency();
      const keyToRemove = "isCheckBoxChecked";
        this.selectedCustomersList.forEach((customer) => {
          if (customer.hasOwnProperty(keyToRemove)) {
            delete customer[keyToRemove];
          }
        });
      this.selectedCustomersJSONString = this.createSelectedCustomersJSONObject(this.selectedCustomersList);
      this.bulkOnboardCustomersModel.EntityName = this._commonService.entityName;
      this.bulkOnboardCustomersModel.RecordId = this._commonService.recordId;
      this.bulkOnboardCustomersModel.CurrencyCode = this.currency;
      this.bulkOnboardCustomersModel.InternalPlanId = this.InternalPlanReferenceID;
      this.bulkOnboardCustomersModel.CustomerC3Id = this.customerC3Id;
      this.bulkOnboardCustomersModel.ProviderId = this.providerId;
      this.bulkOnboardCustomersModel.SelectedCustomers = this.selectedCustomersJSONString;
      this.bulkOnboardCustomersModel.BatchID = null;
      this._customerService.saveBulkOnboardMicrosoftCustomer(this.bulkOnboardCustomersModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status == "Success") {
          this.frmCustomerCurrencyandPlans.reset();
          this._customerService.setBulkOnboardStatus(true);
          this._router.navigate(['partner/customers/bulkonboardcustomers/bulkonboard']);
        }
      });
      
    }
    else {
      let message = this._translateService.instant('TRANSLATE.BULK_UPLOAD_CUSTOMER_NOT_SELECTED')
      this._toastService.error(message);
    }
  }

  onSelectAllCheckboxChange() {
    let message = this.selectAllCheckbox.checked ? this._translateService.instant('TRANSLATE.BULK_ONBOARD_CUSTOMERS_PROMPT_SELECT_ALL_MESSAGE') : this._translateService.instant('TRANSLATE.BULK_ONBOARD_CUSTOMERS_PROMPT_REMOVE_MESSAGE');
    let btnOkText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
    this._notifierService.confirm({ title: message, icon: 'info', confirmButtonText: btnOkText }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        this.nonOnboardedCustomers.forEach((item: any) => {
          if (this.selectAllCheckbox.checked) {
            let existingCustomer = null;
            existingCustomer = this.selectedCustomersList.find((a: any) => {
              return a.Id === item.Id;
            });

            if (existingCustomer === null || existingCustomer === undefined) {
              this.selectedCustomersList.push(item);
            }
            setTimeout(() => {
              item.IsSelectedForOnboarding = true;
            }, 100);
          }
          else {
            let index = this.selectedCustomersList.indexOf(item);
            this.selectedCustomersList.splice(index, 1);
            setTimeout(() => {
              item.IsSelectedForOnboarding = false;
            }, 100);
          }
        });
      }
      else if (result.isDenied) {
        setTimeout(() => {
          this.selectAllCheckbox.checked = !this.selectAllCheckbox.checked;
        }, 100);
      }
    });
  }

  checkIfResellerIsLinkedWithProvider() {
    if (this._commonService.entityName === 'Reseller' && (this._commonService.recordId !== undefined && this._commonService.recordId !== null && this._commonService.recordId !== '')) {
      const subscription = this._customerService.checkIfResellerHasLinkWithProvider().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === "Success") {
          this.canProceedForBulkOnboardingResellerCustomers = response.Data;
           
          if (this.canProceedForBulkOnboardingResellerCustomers === true && (this.customerC3Id !== undefined && this.customerC3Id !== null && this.customerC3Id !== '')) {
            this.getNonOnboardedCustomers();
          }

        }
      });
      this._subscriptionArray.push(subscription);
    }
    else {
      this.canProceedForBulkOnboardingResellerCustomers = false;
    }
  }

  // handleSelection(event: any) {
  //   console.log(event);
  //   console.log('btn clicked');
  //   event.forEach(data=>{
  //     data.IsSelectedForOnboarding =!data.IsSelectedForOnboarding;
  //     this.updateSelectedList(data);
  //   })
  // }
  backToCustomers() {
    if (this.frmCustomerCurrencyandPlans !== undefined && this.frmCustomerCurrencyandPlans && !this.frmCustomerCurrencyandPlans.pristine) {
      let message = this._translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT');
      let btnOkText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
      this._notifierService.confirm({ title: message, icon: 'info', confirmButtonText: btnOkText }).then((result: { isConfirmed: any, isDenied: any }) => {
        if(result.isConfirmed){
          this.frmCustomerCurrencyandPlans.clearValidators();
          this.frmCustomerCurrencyandPlans.reset();
          localStorage.removeItem("customerNameForLinkCustomer")
          localStorage.removeItem("customerC3IdForLinkCustomer")
          this._router.navigate(['partner/customers'])
        }
      });
    } else {
      localStorage.removeItem("customerNameForLinkCustomer")
      localStorage.removeItem("customerC3IdForLinkCustomer")
      this._router.navigate(['partner/customers'])
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
  


}
