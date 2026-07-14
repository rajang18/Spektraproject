import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AzureSubscriptionService } from 'src/app/services/azure-subscription.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PageMode } from 'src/app/shared/models/enums/enums';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-microsoft-azure-subscription',
  templateUrl: './microsoft-azure-subscription.component.html',
  styleUrl: './microsoft-azure-subscription.component.scss'
})
export class MicrosoftAzureSubscriptionComponent extends C3BaseComponent implements OnInit,OnDestroy {

  azureSubscriptionForm: FormGroup;
  datatableConfig: ADTSettings | any;
  entityName: string | null;
  recordId: string | null;
  provider: string = 'Microsoft';
  pageMode: string = 'list';
  selectedAzurePlan: string = '';
  selectedEntitlements: string = '';
  resellers: any[] = [];
  subscriptionData: any[] = [];
  selectedSellerId: any = null;
  currentCurrencyCode: any = null;
  oldSubscriptionName: any = null;
  currentProductId: any = null;
  currentC3CustomerId: any;
  Tenants: any[];
  AllTenants: any;
  providerTenantsCount: number;
  selectedServiceProviderCustomer: any;
  currentCurrencyArray: any;
  currencies: any = [];
  currentCurrency: any;
  allCustomers: any[];
  providerCustomerCount: number | null = 0;
  currentCustomer: any;
  customerCreationDate: Date;
  currentCustomerId: any;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('estimatedCost') estimatedCost: TemplateRef<any>;
  @ViewChild('costOnPartner') costOnPartner: TemplateRef<any>;
  @ViewChild('profit') profit: TemplateRef<any>;
  @ViewChild('thresholds') thresholds: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  IsLoadingTable: boolean = true;
  currentUsageSubscription: any = []; 
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  constructor(private _commonService: CommonService,
    private _azureSubscriptionService: AzureSubscriptionService,
    private _translateService: TranslateService,
    private _formBuilder: FormBuilder,
    private _cdRef: ChangeDetectorRef,
    private _toastService: ToastService,
    private _pageInfo: PageInfoService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);

    // Initialize the azure usage subscription form with validation

    this.azureSubscriptionForm = this._formBuilder.group({
      subscriptionName: ['', Validators.required],
      monthlyBudget: ['', [Validators.required, Validators.min(0)]],
      infoThreshold: ['', [Validators.required, Validators.min(0)]],
      warnThreshold: ['', [Validators.required, Validators.min(0)]],
      errorThreshold: ['', [Validators.required, Validators.min(0)]],
      dangerThreshold: ['', [Validators.required, Validators.min(0)]],
      notificationRecipients: ['']
    });
  }
  Permissions = {
    HasGetResellersWithCustomerHavingUsageProduct: "Denied"
  };

  HasPermission() {
    this.Permissions.HasGetResellersWithCustomerHavingUsageProduct = this._permissionService.hasPermission('GET_RESELLER_HAVING_CUSTOMER_WITH_USAGE_PRODUCT');
  }

  ngOnInit(): void {
    this.HasPermission();
    this._pageInfo.updateTitle(this._translateService.instant("AZURE_SUBSCRIPTION"),true);
    this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_CUSTOMER_MICROSOFT','BREADCRUM_BUTTON_TEXT_AZURE_SUBSCRIPTION']);
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;

    if (this.Permissions.HasGetResellersWithCustomerHavingUsageProduct === 'Allowed') {
      this.getResellers();
    } else {
      this.getCustomers();
    }
  }

  handleTableConfig() {

    if (this.currentC3CustomerId && this.selectedServiceProviderCustomer) {
      const subscription = this._azureSubscriptionService.getSubscriptionDetails(this.currentC3CustomerId, this.selectedServiceProviderCustomer.CustomerRefId).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
        this.IsLoadingTable = false;
        setTimeout(() => { 
          const self = this;
          this.datatableConfig = {
            serverSide: false,
            pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
            paging: true,
            data: Data,
            ADTSettings: {
              enableEscapeHTML: true
            },
            columns: [
              {
                title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_TABLE_HEADER_TEXT_SUBSCRIPTION_NAME'),
                className: 'col-md-3 text-start',
                defaultContent: '',
                ngTemplateRef: {
                  ref: this.nameTemplate,
                },
                orderable: false
              },
              {
                title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_TABLE_HEADER_TEXT_ACTIVE_IN_CSP'),
                className: 'col-md-2 text-start',
                data: 'IsActiveinCsp',
                render: (data: string, type: any, row: any, meta: any) => {
                  if (data) {
                    return `<i class="fa fa-check text-success"></i>`;
                  } else {
                    return `<i class="fa fa-close text-danger"></i>`;
                  }
                },
                orderable: false
              },
              {
                title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_TABLE_HEADER_TEXT_ESTIMATED_COST'),
                className: 'col-md-1 text-end',
                defaultContent: '',
                ngTemplateRef: {
                  ref: this.estimatedCost,
                },
                orderable: false
              },
              {
                title: this._translateService.instant('TRANSLATE.REVENUE_AND_COST_SUMMARY_COST_ON_PARTNER'),
                className: 'col-md-1 text-end',
                defaultContent: '',
                ngTemplateRef: {
                  ref: this.costOnPartner,
                },
                orderable: false
              },
              {
                title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_TABLE_HEADER_TEXT_PROFIT'),
                className: 'col-md-1 text-end',
                defaultContent: '',
                ngTemplateRef: {
                  ref: this.profit,
                },
                orderable: false
              },
              {
                title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_TABLE_HEADER_TEXT_THRESHOLDS'),
                className: 'col-md-2 text-start',
                defaultContent: '',
                ngTemplateRef: {
                  ref: this.thresholds,
                },
                orderable: false
              },
              {
                title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_TABLE_HEADER_TEXT_ACTIONS'),
                className: 'col-md-2 text-end',
                defaultContent: '',
                ngTemplateRef: {
                  ref: this.actions,
                  context: {
                    // needed for capturing events inside <ng-template>
                    captureEvents: self.onCaptureEvent.bind(self)
                  },
                },
                orderable: false
              },
            ],
          };
        });
      });
      this._subscriptionArray.push(subscription);
    }
  }
  onCaptureEvent(event: Event) { }

  getTenants() {

    if (this.currentC3CustomerId) {
      const subscription = this._azureSubscriptionService.getTenants(this.currentC3CustomerId, this.provider).pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.AllTenants = data;
          this.Tenants = [...this.AllTenants];
          if (this.Tenants !== undefined && this.Tenants !== null) {
            this.providerTenantsCount = this.Tenants.length;
          }
          this.selectedServiceProviderCustomer = this.Tenants[0];
          this.getSubscriptionDetails();
        });
        this._subscriptionArray.push(subscription);
    }
    else {
      this.providerTenantsCount = 0
      this.Tenants = [];
      this.selectedServiceProviderCustomer = null;
    }
  }

  getCurrentCurrencyDetails() {
    this.currentCurrencyArray = this.currencies.filter((currncy: any) => currncy.CurrencyCode === this.currentCurrencyCode);
    this.currentCurrency = this.currentCurrencyArray[0];
  }

  getResellers() {
    const subscription = this._azureSubscriptionService.getResellers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Data.length > 0) {
        this.resellers.push({ Id: 0, Name: this._translateService.instant("TRANSLATE.ENTITY_DESC_PARTNER"), C3Id: '0' });
        this.selectedSellerId = '0';
        this.resellers.push(...response.Data);
      }
      this.getCustomers();
    });
    this._subscriptionArray.push(subscription);
  }

  onSellerChange() {
    this.IsLoadingTable = true;
    this._cdRef.detectChanges();
    this.currentC3CustomerId = null;
    this.selectedServiceProviderCustomer = null;
    let selectedSeller = this.resellers.find(e => e.C3Id === this.selectedSellerId);
    if (selectedSeller.C3Id != '0')
      this.getCustomers("Reseller", selectedSeller.C3Id);
    else
      this.getCustomers();
  }

  getCustomers(entityName: string | null = null, recordId: string | null = null) {
    //hsCheck
    this.allCustomers = [];
    const subscription = this._azureSubscriptionService.getCustomers(entityName, recordId, this.provider).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      let data = res;
      data.filter((item: any) => {
        let i = this.allCustomers.findIndex(x => (x.Name == item.Name));
        if (i <= -1) {
          this.allCustomers.push(item);
        }
      });
      if (this.allCustomers !== undefined && this.allCustomers !== null && this.allCustomers.length > 0) {
        this.providerCustomerCount = this.allCustomers.length;
        this.currentC3CustomerId = this.allCustomers.length > 0 ? this.allCustomers[0].C3Id : null;
      }
      this.onCustomerChange();
    });
    this._subscriptionArray.push(subscription);
  }

  onCustomerChange() {

    let customerC3Id = this.currentC3CustomerId !== undefined && this.currentC3CustomerId !== null && this.currentC3CustomerId !== 0 ? this.currentC3CustomerId : null;
    const subscription = this._azureSubscriptionService.onCustomerChange(customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      let data = res;
      data.filter((item: any) => {
        let i = this.currencies.findIndex((x: any) => (x.CurrencyCode == item.CurrencyCode));
        if (i <= -1) {
          this.currencies.push(item);
        }
      });
      if (this.currencies !== undefined && this.currencies !== null && this.currencies.length > 0) {
        this.currentCurrencyCode = this.currencies[0].CurrencyCode;
        this.getCurrentCurrencyDetails();
      }
      else {
        this.currentCurrencyCode = null;
      }
      this.onCurrencyChange();
    });
    this._subscriptionArray.push(subscription);
  }

  onCurrencyChange() {
    let selectedCustomer = this.allCustomers.filter(customer => customer.C3Id === this.currentC3CustomerId);
    this.currentCustomer = selectedCustomer.length > 0 ? selectedCustomer[0] : null;
    this.currentCustomerId = this.currentCustomer ? this.currentCustomer.ID : null;
    this.currentC3CustomerId = this.currentCustomer ? this.currentCustomer.C3Id : null;
    this.customerCreationDate = this.currentCustomer ? new Date(this.currentCustomer.ProviderCustomerCreateDate) : null;
    this.getTenants();
  }

  getSubscriptionDetails() {
    this.handleTableConfig();
  }

  saveUsageSubscriptionDetail() {
    this.azureSubscriptionForm.markAllAsTouched();
    if (this.azureSubscriptionForm.valid) {
      this.currentUsageSubscription.SubscriptionName = this.getFormControlValue('subscriptionName');
      this.currentUsageSubscription.MonthlyBudget = this.getFormControlValue('monthlyBudget');
      this.currentUsageSubscription.InfoThreshold = this.getFormControlValue('infoThreshold');
      this.currentUsageSubscription.WarnThreshold = this.getFormControlValue('warnThreshold');
      this.currentUsageSubscription.ErrorThreshold = this.getFormControlValue('errorThreshold');
      this.currentUsageSubscription.DangerThreshold = this.getFormControlValue('dangerThreshold');

      if (this.currentUsageSubscription.SubscriptionName !== undefined &&
        this.currentUsageSubscription.SubscriptionName !== null &&
        this.currentUsageSubscription.SubscriptionName !== this.oldSubscriptionName) {
        this.currentUsageSubscription['OldSubscriptionName'] = this.oldSubscriptionName;
        this.currentUsageSubscription['IsNameChanged'] = true;
      }
    }

    this.currentUsageSubscription.ProductId = this.currentProductId;
    const reqBody = {
      ProductItem: JSON.stringify(this.currentUsageSubscription)
    };

    const subscription = this._azureSubscriptionService.saveUsageSubscriptionDetail(this.currentUsageSubscription.InternalCustomerProductId, reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === "Success") {
        this._toastService.success(this._translateService.instant('TRANSLATE.AZURE_SUBSCRIPTION_SAVED_SUCCESS_NOTIFICATION'));
        this.IsLoadingTable = true;
        this.pageMode = PageMode.List;
        this.handleTableConfig();
      }
      else {
        this._toastService.error(this._translateService.instant('TRANSLATE.AZURE_SUBSCRIPTION_SAVED_FAILED_NOTIFICATION'));
      }
    })
    this._subscriptionArray.push(subscription);
  }

  cancel() {
    this.pageMode = PageMode.List
    this._cdRef.detectChanges();
  }

  editDetails(subscription: any) {
    this.currentUsageSubscription = [];
    this.pageMode = PageMode.Edit
    this.currentProductId = subscription.ProductId;

    const subscriptions = this._azureSubscriptionService.editDetails(parseInt(subscription.ProductId)).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.currentUsageSubscription = response.Data;
      this.azureSubscriptionForm.setValue({
        subscriptionName: this.currentUsageSubscription.SubscriptionName,
        monthlyBudget: this.currentUsageSubscription.MonthlyBudget,
        infoThreshold: this.currentUsageSubscription.InfoThreshold,
        warnThreshold: this.currentUsageSubscription.WarnThreshold,
        errorThreshold: this.currentUsageSubscription.ErrorThreshold,
        dangerThreshold: this.currentUsageSubscription.DangerThreshold,
        notificationRecipients: this.currentUsageSubscription.NotificationRecipients
      })

      if (response.Data.SubscriptionName !== undefined && response.Data.SubscriptionName !== null) {
        this.oldSubscriptionName = response.Data.SubscriptionName;
      }
    });
    this._subscriptionArray.push(subscriptions);
  }

  getFormControl(controlName: string) {
    return this.azureSubscriptionForm.get(controlName);
  }

  getFormControlValue(controlName: string) {
    return this.getFormControl(controlName)?.value;
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
