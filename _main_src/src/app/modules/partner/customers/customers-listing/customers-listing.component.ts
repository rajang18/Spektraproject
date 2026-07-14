import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    HostListener,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { Subscription, interval, switchMap, takeUntil } from 'rxjs';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { mapParamsWithApi } from '../../../standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import {
    AutoPay,
    customerDetails,
    customerNameUpdateResponse,
    cutomerNameUpdateResponse,
    paymentMethod,
} from 'src/app/shared/models/customers.model';
import {
    NgbModal,
    NgbModalOptions
} from '@ng-bootstrap/ng-bootstrap';
import { CustomerImpersonationComponent } from '../../../standalones/customer-impersonation/customer-impersonation.component';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CommonService } from 'src/app/services/common.service';
import { FileService } from 'src/app/services/file.service';
import { ReportPopupComponent } from 'src/app/modules/standalones/report-popup/report-popup.component';
import { MODAL_DIALOG_CLASS, ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { UserContextService } from 'src/app/services/user-context.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { NgSelectComponent } from '@ng-select/ng-select';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { AccountManagerService } from 'src/app/services/account-manager.service';
import { PartnerAddressDetailsPopupComponent } from 'src/app/modules/standalones/partner-address-details-popup/partner-address-details-popup.component';
@Component({
    selector: 'app-customers-listing',
    templateUrl: './customers-listing.component.html',
    styleUrl: './customers-listing.component.scss',
})
export class CustomersListingComponent extends C3BaseComponent implements OnInit, OnDestroy {
    datatableConfig: ADTSettings | any;
    customerImpersonateConfig: ADTSettings;
    isEditing: boolean[] = [];
    reconloading: boolean;
    timerHandleForReloadReconStatus: Subscription | null = null;
    activeLoadReconWebJobs: any[] = [];
    reconStatus: string | null;
    userC3Id: any;
    // _subscription: Subscription;
    toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
    @ViewChild('actions') actions: TemplateRef<any>;
    @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
    @ViewChild('accountmanager') accountmanager: TemplateRef<any>;
    successMessage = 'Customer Name update success';
    modalConfig: NgbModalOptions = {
        modalDialogClass: 'modal-dialog modal-dialog-top mw-800px',
    };

    shouldShowFilter: boolean = false;
    plans: any[] = [];
    providers: any[];
    customerTagKeys: any[];
    customerTagValues: any[] = [];
    tagValues: any | null = [];
    tagKey: string = "";
    countryCodeList: any[];
    uniqueidentifier!: any[];

    selectedPlan: any = null;
    providerId: any = "";
    name: string = "";
    paymentMethod: string = "";
    providerCustomerId: string | null = "";
    selectedCountryList: string[] = [];
    considerDeleted: boolean = false;
    configName: string = "";
    isDisabled: boolean = true;
    configValue: string = '';
    planId: any = '';
    billingProvider: any;
    entityName: string | null;
    hasSupportForResellersWithMPNID: string = 'No';
    accountManagersData: any[] = [];
    AccountManagerId: any = null;

    accountManagerDetails: any;
    accountManagerName: any;
    accountManagerModalContent: any;
    @ViewChild('selectElement') selectElement!: NgSelectComponent;
    @ViewChild('selectElement1') selectElement1!: NgSelectComponent;
    @ViewChild('selectElement2') selectElement2!: NgSelectComponent;
    @ViewChild('selectElement3') selectElement3!: NgSelectComponent;
    @ViewChild('signupDate') signupDate: TemplateRef<any>;


    @HostListener('window:scroll', ['$event'])
    onWindowScroll() {
        if (this.selectElement?.isOpen) {
            this.selectElement.close();
        }
        if (this.selectElement1?.isOpen) {
            this.selectElement1.close();
        }
        if (this.selectElement2?.isOpen) {
            this.selectElement2.close();
        }
        if (this.selectElement3?.isOpen) {
            this.selectElement3.close();
        }
    }

    // Reload emitter inside datatable
    reloadEvent: EventEmitter<boolean> = new EventEmitter();

    jobStatusForLoadReconReportObj: any;
    jobStatusForLoadReconReportList: any;
    jobStatusForLoadReconReport: null;
    userContextList: any;
    hasCustomerOnboard: string;
    hasAddCustomer: string;
    HasChangeNameAccess: string;
    Name: string
    StartInd: number;
    SortColumn: any;
    SortOrder: any;
    length: any;

    constructor(
        private _customerListingSAervice: CustomersListingService,
        private _toastService: ToastService,
        private _modalService: NgbModal,
        private _cdRef: ChangeDetectorRef,
        private _translateService: TranslateService,
        public _router: Router,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService,
        private _commonService: CommonService,
        private _fileService: FileService,
        private userContext: UserContextService,
        private _notifierService: NotifierService,
        private _appService: AppSettingsService,
        public pageInfo: PageInfoService,
        private AccountManagerService: AccountManagerService,
        public c3RouterService: C3RouterService
    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        this.entityName = _commonService.entityName;
        this.navigation = this._router.getCurrentNavigation();
        this.keyForData = this.navigation?.extras.state?.['keyForData'];
        if (this.keyForData) {
            this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
            this.persistPropertySet();
        }
    }

    ngOnInit(): void {
        this.hasCustomerOnboard = this._permissionService.hasPermission(this.cloudHubConstants.CUSTOMER_ONBOARDING);
        this.hasAddCustomer = this._permissionService.hasPermission(this.cloudHubConstants.ADD_CUSTOMER);
        this.HasChangeNameAccess = this._permissionService.hasPermission(this.cloudHubConstants.BTN_CUSTOMER_NAME_CHANGE);
        this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS"), true);
        if (this._commonService.entityName === 'Reseller') {
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS']);
        }
        else if (this._commonService.entityName === 'Partner') {
            this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS']);
        }    
        localStorage.removeItem("customerNameForLinkCustomer");
        localStorage.removeItem("customerC3IdForLinkCustomer")
        this.getApplicationData()
        this.getPlans();
        this.getProviders();
        this.getTagKeysForPartner();
        this.getCountryCodeFromCustomers();
        this.getUniqueIdentifier();
        this.fetchAccountManagersData();
        this.getActiveBillingProvider();


        // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
        this.handleTableConfig();
        this.getActiveLoadReconWebJob();
        this.hasPermission();
        this._cdRef.detectChanges();
    }

    getActiveBillingProvider() {
        const subscription = this._appService.getActiveBillingProvider().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
            let billingProviderDetail = res.Data;
            if (billingProviderDetail !== undefined && billingProviderDetail !== null) {
                this.billingProvider = billingProviderDetail.Name.toLowerCase();
            }
        })
        this._subscriptionArray.push(subscription);
    }

    getApplicationData() {
        const subscription =  this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.hasSupportForResellersWithMPNID = response.Data.HasSupportForResellersWithMPNID;
        });
        this._subscriptionArray.push(subscription);
    }

    permissions = {
        HasSyncMicrosoftCustomerConsent: "Denied",
        HasSyncProviderCustomerProfile: "Denied",
    };

    hasPermission() {
        this.permissions.HasSyncMicrosoftCustomerConsent = this._permissionService.hasPermission(this.cloudHubConstants.SYNC_MICROSOFT_CUSTOMER_CONSENT);
        this.permissions.HasSyncProviderCustomerProfile = this._permissionService.hasPermission(this.cloudHubConstants.SYNC_PROVIDER_CUSTOMER_PROFILE);
    }  
    handleTableConfig() {
        setTimeout(() => {
            const self = this;
            this.datatableConfig = {
                serverSide: true,
                tabIndex: this.StartInd,
                pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
                search: { search: this.Name },
                ADTSettings: {
                    enableEscapeHTML: true
                },
                ajax: (dataTablesParameters: any, callback: any) => {
                    const { StartInd, Name, SortColumn, SortOrder, length } =
                        mapParamsWithApi(dataTablesParameters);
                    let C3Input = this.c3RouterService.getC3Input();
                    if (!C3Input && this.keyForData && this.Name) {
                        this.c3RouterService.setC3Input(this.Name)
                    } else {
                        this.Name = C3Input || ''
                    }
                    //this.Name = this.keyForData && (Name === null || Name === undefined || Name === '')? this.Name : Name == '' && this.Name? this.Name : (this.Name && Name ? Name : (this.Name || Name));
                    this.StartInd = this.keyForData && StartInd == 1 ? this.StartInd : StartInd;
                    
                    this.SortColumn = this.keyForData ? this.SortColumn : SortColumn;
                    this.SortOrder = this.keyForData ? this.SortOrder : SortOrder;
                    this.length = this.keyForData ? this.length : length;
                    this.keyForData = null;

                    let searchParams = {
                        StartInd: this.StartInd,
                        Name: this.Name,
                        SortColumn: this.SortColumn,
                        SortOrder: this.SortOrder,
                        PageSize: this.length,
                        PlanId: this.planId,
                        PaymentMethod: this.paymentMethod,
                        ProviderId: this.providerId,
                        AccountManagerId: this.AccountManagerId,
                        ProviderCustomerId: this.providerCustomerId,
                        TagKey: this.tagKey,
                        TagValues: this.tagValues,
                        ConsiderDeleted: this.considerDeleted,
                        MarketCodes: this.selectedCountryList.join(","),
                        ConfigName: this.configName,
                        ConfigValue: this.configValue
                    }
                    const subscription =  this._customerListingSAervice
                        .getList(searchParams)
                        .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
                            let recordsTotal = 0;
                            if (Data.length > 0) {
                                this.applyEscapeHTML(Data);
                                [{ TotalRows: recordsTotal }] = Data;
                            }
                            callback({
                                data: Data,
                                recordsTotal: recordsTotal || 0,
                                recordsFiltered: recordsTotal || 0,
                            });
                        });
                        this._subscriptionArray.push(subscription);
                },

                columns: [
                    {
                        searchable: false,
                        title: this._translateService.instant('TRANSLATE.CUSTOMER_DEPARTMENT_TABLE_HEADER_TEXT_NAME'),
                        data: 'Name',
                        className: 'col-md-3',
                        defaultContent: '',
                        ngTemplateRef: {
                            ref: this.nameTemplate,
                            context: {
                                userData: {
                                    field: 'Name',
                                },
                                // needed for capturing events inside <ng-template>
                                captureEvents: self.enableEditField.bind(self),
                            },
                        },
                    },
                    {
                        title: this._translateService.instant('TRANSLATE.CUSTOMER_SEARCH_CUSTOMER_PLAN'),
                        data: 'PlanName',
                        className: 'col-md-3',
                        type: "string"
                    },
                    {
                        title: this._translateService.instant('TRANSLATE.SIGN_UP_DATE'),
                        data: 'SignupDate',
                        className: 'col-md-1',
                        ngTemplateRef: {
                            ref: this.signupDate,
                            context: {
                            },
                        },
                    },
                    {
                        title: this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_LABEL_BILLING'),
                        className: 'col-md-1',
                        data: 'PaymentMethod',
                        render: (data: string, type: any, row: any, meta: any) => {
                            // Check the value of PaymentMethod and return the formatted HTML
                            let paymentMethodHTML = '';
                            // paymentMethodHTML = '<div class="p-2 mb-2 badge badge-info">' + data + '</div>';
                            if (data === paymentMethod.manual) {
                                paymentMethodHTML = '<div class="p-2 mb-2 badge badge-secondary">' + data + '</div>';
                            } else
                                if (data === paymentMethod.creditCard) {
                                    paymentMethodHTML = '<div class="p-2 mb-2 badge badge-light-success">' + data + '</div>';
                                }
                                else if (data === paymentMethod.bankAccount) {
                                    paymentMethodHTML = '<div class="p-2 mb-2 badge badge-light-success" >' + this._translateService.instant('TRANSLATE.TEXT_ACH') + '</div>';
                                }
                                else {
                                    paymentMethodHTML = '<div class="p-2 mb-2 badge badge-light-success">' + data + '</div>';
                                }
                            let autoPayHTML = '';
                            if (row.AutoPay === AutoPay.no) {
                                autoPayHTML = '<div class="p-2 badge badge-light-danger">' + this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_LABEL_AUTO_PAY_OFF') + '</div>';
                            } else if (row.AutoPay === AutoPay.yes) {
                                autoPayHTML = autoPayHTML = '<div class="p-2 badge badge-light-success">' + this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_LABEL_AUTO_PAY_ON') + '</div>';
                            }

                            return paymentMethodHTML + autoPayHTML;
                        },
                    },

                    {
                        title: this._translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_ACTIONS'),
                        className: 'col-md-1 text-end column-title-pe-5',
                        defaultContent: '',
                        orderable: false,
                        type: 'string',
                        ngTemplateRef: {
                            ref: this.actions,
                            context: {
                                // needed for capturing events inside <ng-template>
                                captureEvents: self.onCaptureEvent.bind(self),
                            },
                        },
                    },
                ],

            };
            this._cdRef.detectChanges();
        });

    }

    onCaptureEvent(event: Event) { }

    enableEditField(data: customerDetails) {
        const c3Id = data.C3Id;
        const subscription = this._customerListingSAervice
            .upDateName(data, c3Id)
            .pipe(takeUntil(this.destroy$)).subscribe((response: Partial<cutomerNameUpdateResponse>) => {
                if (response.Status == customerNameUpdateResponse.success) {
                    this._toastService.success(this.successMessage);
                    this.c3RouterService.setC3Input('') // Clear all column search inputs
                    this.reloadEvent.emit(true);
                }
            });
            this._subscriptionArray.push(subscription);
    }

    openImpersonationModal(data: any) {
        const modalRef = this._modalService.open(CustomerImpersonationComponent, { size: 'lg' });
        modalRef.componentInstance.c3Id = data.C3Id;
        modalRef.result.then((response) => {
            this.proccedToImpersonate(response.recordId, response.userEmailId, response.c3UserId, response.value, response.roleName, response.userRole);
        }).catch((reason) => {
            //console.log('Dismissed: ', reason);
        });
    }

  proccedToImpersonate(recordId: string, username: string, c3UserId: string, inheritRole: number, roleName: string, userRole: string) {
    localStorage.setItem("EntityName", "Customer");
    localStorage.setItem("RecordId", recordId);
    //localStorage.setItem("impersonationContext",
    let context = JSON.stringify({ RecordId: recordId, Username: username, InheritRole: (inheritRole === null || inheritRole === 0) ? false : true, EntityName: "Customer", C3UserId: c3UserId, ImpersonatedFrom: "partner.customers", RoleName: roleName, UserRole: userRole });
    this._commonService.setValueInLocalStorage("impersonationContext",context).then(()=>{
      this.userContext.setUserContext(null,true);
    })
   
  }


    managePlans(data: any) {
        const c3Id = data.C3Id;
        const customerName = data.Name;

        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/customers/${c3Id}/manageplans`];
        c3Router.extras = { state: { Name: customerName, c3Id: c3Id } };
        c3Router.data = this.setData()
        this.c3RouterService.navigate(c3Router);
        // this._router.navigate([`partner/customers/${c3Id}/manageplans`],{state:{Name:customerName,c3Id: c3Id}});
    }


    setData() {
        return {
            planId: this.planId,
            paymentMethod: this.paymentMethod,
            providerId: this.providerId,
            providerCustomerId: this.providerCustomerId,
            tagKey: this.tagKey,
            tagValues: this.tagValues,
            considerDeleted: this.considerDeleted,
            selectedCountryList: this.selectedCountryList,
            configName: this.configName,
            configValue: this.configValue,
            StartInd: this.StartInd,
            Name: this.Name,
            SortColumn: this.SortColumn,
            SortOrder: this.SortOrder,
            length: this.length,
        }
    }

    CustomerTags(data: any) {
        const c3Id = data.C3Id;
        const customerName = data.Name;
        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/customers/${c3Id}/tags`];
        c3Router.extras = { state: { c3Id: c3Id, Name: customerName, } };
        c3Router.data = this.setData()
        this.c3RouterService.navigate(c3Router);
        // this._router.navigate([`partner/customers/${c3Id}/tags`], { state: { c3Id: c3Id, Name:customerName, } });
    }

    CustomerPayments(data: any) {
        const c3Id = data.C3Id;
        const customerName = data.Name;
        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/customers/${c3Id}/testpayment`];
        c3Router.extras = { state: { c3Id: c3Id, Name: customerName, EntityName: 'Customer' } };
        c3Router.data = this.setData()
        this.c3RouterService.navigate(c3Router);
        // this._router.navigate([`partner/customers/${c3Id}/testpayment`], {state: { c3Id: c3Id, Name: customerName, EntityName: 'Customer' }});
    }

    LinkCustomerBillingProfile(data: any) {
        const c3Id = data.C3Id;
        const customerName = data.Name;
        this._router.navigate([`partner/customers/${c3Id}/linkCustomerBillingProfile`], { state: { Name: customerName, c3Id: c3Id } });
    }

    ReLoadMicrosoftCustomerProfiles(data: any) {
        this._router.navigate([this._router.url + '/' + 'reLoadingCustomersProfileData'], { state: { customerId: data?.C3Id } });
    }

    ReLoadCustomerConsent(data: any) {
        this._router.navigate([this._router.url + '/' + 'reLoadingcustomerconsent'], { state: { customerId: data?.C3Id } });
    }

    deLinkCustomerBillingProfile(data: any) {
        let removeBillingConfirmation = this._translateService.instant('TRANSLATE.POPUP_DELETE_BILLING_CUSTOMER_CONFIRMATION_TEXT', { CustomerName: data.Name });
        this._notifierService.confirm({ title: removeBillingConfirmation }).then((result: { isConfirmed: any, IsDenied: any }) => {
            if (result.isConfirmed) {
                const subscription = this._customerListingSAervice.deLinkCustomerBillingProfile(data.C3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {

                    if (response.Status === "Success") {
                        this._toastService.success(this._translateService.instant('TRANSLATE.BILLING_CUSTOMER_LINK_REMOVAL_SUCCESS'));
                    }
                    else {
                        this._toastService.error(this._translateService.instant('TRANSLATE.BILLING_CUSTOMER_LINK_REMOVAL_FAIL'));
                    }
                    this.reloadEvent.emit(true);
                });
                this._subscriptionArray.push(subscription);
            }
        });
    }

    displayFilter() {
        this.shouldShowFilter = !this.shouldShowFilter;
    }

    getPlans() {
        //if (vm.Permissions.HasPlanAccess === 'Allowed') {
            const subscription =  this._customerListingSAervice.getPlanListForFilter().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.plans = [];

            if (response.Data !== undefined && response.Data !== null && response.Data.length > 0) {
                this.plans = response.Data;
                let noPlans = { ID: 0, Name: "NoPlanAssigned", InternalPlanId: "0" };
                this.plans.push(noPlans);
                this.plans.sort((a, b) => {
                    let typeA = a.Name,
                        typeB = b.Name;
                    if (typeA < typeB)
                        //sort string ascending
                        return -1;
                    if (typeA > typeB) return 1;
                    return 0;
                });
                if(this.searchParams && this.searchParams['planId']) {
                    let data:any = this.plans.find((item:any)=> item.InternalPlanId==this.searchParams['planId'])
                    this.setFilterData(data,'selectedPlan');
                }

            }
        });
        this._subscriptionArray.push(subscription);
    }

    setFilterData(data:any,selectedPlan:string){
        this[selectedPlan] = data;
    }


    getProviders() {
        const subscription =  this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            let providers = response;
            this.providers = providers.filter((e: any) => {
                return e.Name !== 'Partner'
            });
        });
        this._subscriptionArray.push(subscription);
    }

    getTagKeysForPartner() {
        const subscription =  this._commonService.getCustomerTagKeys().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.customerTagKeys = [];
            let data = response.Data;
            data.forEach((item: any) => {
                if (this.customerTagKeys.indexOf(item.TagKey) === -1) {
                    this.customerTagKeys.push(item.TagKey);
                }
            });
        });
        this._subscriptionArray.push(subscription);
    }

    getTagValuesForPartner(tagkey: any) {
        let searchParams = { tagkey: tagkey };
        const subscription =  this._commonService.getTagValues(searchParams).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.customerTagValues = [];
            let data = response.Data;
            data.forEach((item: any) => {
                if (this.customerTagValues.indexOf(item.TagValue) === -1) {
                    this.customerTagValues.push(item.TagValue);
                }
            });
            this.isDisabled = false;
            this._cdRef.detectChanges();
        })
        this._subscriptionArray.push(subscription);
    }

    getTagValuesBykey() {
        this.tagValues = "";
        this.isDisabled = true;
        this.customerTagValues = [];
        this._cdRef.detectChanges();
        //let tagKey = this.tagKey;
        this.getTagValuesForPartner(this.tagKey);
    }

    getCountryCodeFromCustomers() {

        const subscription =  this._customerListingSAervice.getCustomersCountryCode().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.countryCodeList = response.Data;
        })
        this._subscriptionArray.push(subscription);
    }

    getUniqueIdentifier() {

        const subscription =  this._customerListingSAervice.getCustomersUniqueIdentifiers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.uniqueidentifier = response.Data;
        })
        this._subscriptionArray.push(subscription);
    }

    getReports(data: any) {
        const c3Id = data.C3Id;
        const customerId = data.ID;
        const customerName = data.Name;
        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/customers/reports`];
        c3Router.extras = { state: { CustomerId: customerId, CustomerC3Id: c3Id, CustomerName: customerName } };
        c3Router.data = this.setData()
        this.c3RouterService.navigate(c3Router);
    }

    onSelectedPlanChange() {
        this.planId = this.selectedPlan.InternalPlanId;
    }

    searchCustomers() {
        this.reloadEvent.emit(true);
    }

    resetSearchCriteria() {
        this.selectedPlan = null;
        this.providerId = "";
        this.AccountManagerId = null;
        this.name = "";
        this.Name = "";
        this.c3RouterService.setC3Input(this.Name);
        this.paymentMethod = "";
        this.providerCustomerId = "";
        this.selectedCountryList = [];
        this.considerDeleted = false;
        this.configName = "";
        this.isDisabled = true;
        this.configValue = '';
        this.planId = '';
        this.tagValues = [];
        this.tagKey = "";
        this._cdRef.detectChanges();
        this.c3RouterService.removeData(this.keyForData);
        this.keyForData = null;

        this.reloadEvent.emit(true);
    }

    /* Reports functions */
    exportTearmsAndConditionsReport() {
        this._fileService.getFile('reports/TermsAndConditionsReport', true)
    }

    exportConsetReport() {
        this._fileService.getFile('reports/CustomerConsentsReport', true)
    }

    exportTransactionAmountLimitReport() {
        this._fileService.getFile('reports/TransactionAmountLimitReport', true)
    }

    reloadReconReport() {
        this._router.navigate([this._router.routerState.snapshot.url + '/' + 'reloadingReconciliationdata'])
    }

    exportReconciliationReport() {
        this._fileService.getFile('reports/ExportReconciliationReport', true)
    }

    downloadGridReport() {
        const moduleName = "partner.customer";
        const subscription = this._commonService.getDownloadableReportColumns({ moduleName: moduleName }).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            /* Creating config model */
            let reportConfig = new ReportPopupConfig();
            reportConfig.Columns = response.Data;
            reportConfig.title = 'DOWNLOAD_GRID_POPUP_CUSTOMER_DOWNLOD_HEADER';
            reportConfig.isSubmitButton = false;
            reportConfig.IsColumnsAvailable = true;
            reportConfig.IsSubHeaderAvailable = false;
            reportConfig.EmailInstructionText = '';
            reportConfig.actionTooltipText = '';
            /* selecting Size of popup based on condition */
            const config: NgbModalOptions = {
                modalDialogClass: reportConfig.IsSubHeaderAvailable ? MODAL_DIALOG_CLASS : '',
            };
            const modalRef = this._modalService.open(ReportPopupComponent, config);
            modalRef.componentInstance.reportConfig = reportConfig;
            modalRef.result.then((result) => {
                if (result) {
                    let selectedColumn: any = [];
                    result.Columns.map((e: any) => {
                        if (e.IsChecked === true) {
                            selectedColumn.push(e.ColumnName);
                        }
                    });
                    let columns = selectedColumn.join(',');
                    let reqbody = {
                        ColumnNames: columns,
                        EntityName: this._commonService.entityName,
                        RecordId: this._commonService.recordId
                    }
                    if (columns != "" && columns.length > 0) {
                        this._fileService.post('customers/downloadcustomer', true, reqbody)
                    }
                    else {
                        this._toastService.error(this._translateService.instant('TRANSLATE.DOWNLOAD_CUSTOMER_ATLEAST_SELECT_ONE_COLUMN_ERROR'));
                    }
                }
            },
                (reason) => {
                    /* Closing modal reference if cancelled or clicked outside of the popup*/
                    modalRef.close();
                });
        });
        this._subscriptionArray.push(subscription);
    }

    getAccountManagerDetailsOfCustomer(row: any) {
        const subscription =  this._customerListingSAervice
            .getAccountManagerDetailsOfCustomer(row)
            .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                this.accountManagerDetails = response.Data;
                if (
                    this.accountManagerDetails !== null &&
                    this.accountManagerDetails !== undefined &&
                    this.accountManagerDetails !== ''
                ) {
                    if (
                        this.accountManagerDetails.FirstName !== null &&
                        this.accountManagerDetails.FirstName !== undefined &&
                        this.accountManagerDetails.FirstName !== ''
                    ) {
                        this.accountManagerName = this.accountManagerDetails.FirstName;
                    }
                    if (
                        this.accountManagerDetails.LastName !== null &&
                        this.accountManagerDetails.LastName !== undefined &&
                        this.accountManagerDetails.LastName !== ''
                    ) {
                        this.accountManagerName =
                            this.accountManagerName +
                            ' ' +
                            this.accountManagerDetails.LastName;
                    }
                    this.proceedToShowAccountManagerDetails(row.Name);
                } else {
                    const confirmationText = this._translateService.instant(
                        'TRANSLATE.PARTNER_CUSTOMER_IS_NOT_ASSIGNED_TO_ANY_ACCOUNT_MANAGER',
                        { customer: row.Name }
                    );
                    this._notifierService.alert({
                        title: confirmationText,
                        icon: 'info',
                        confirmButtonColor: '#50C878',
                    });
                }
            });
            this._subscriptionArray.push(subscription);
    }

    proceedToShowAccountManagerDetails(name: string) {
        this.accountManagerModalContent = {
            Name: this.accountManagerName,
            Email: this.accountManagerDetails.Email,
            PhoneNumber: this.accountManagerDetails.PhoneNumber,
            CustomerName: name,
        };
        const modalRef = this._modalService.open(this.accountmanager);
    }

    closeModalPopup() {
        this._modalService.dismissAll();
    }


    getActiveLoadReconWebJob() {

        const subscription = this._customerListingSAervice.getActiveLoadReconWebJob().pipe(takeUntil(this.destroy$)).subscribe(response => {
            this.activeLoadReconWebJobs = response.Data?.C3Customers;
            if (this.activeLoadReconWebJobs && this.activeLoadReconWebJobs.length > 0) {
                this.reconloading = true;
                this.reconStatus = 'Initiated';
                this.pollForStatusOfReloadRecon();
            }
        });
        this._subscriptionArray.push(subscription);
  }

  reloadCustomerReconReport(C3Id: string) {
    this.reconloading = true;
    let customerList: any = [];
    customerList.push({ C3CustomerId: C3Id, ServiceProviderCustomerId: null });
    let inputModel = { CustomerC3Id: C3Id, Customers: customerList };
    const subscription = this._customerListingSAervice.reloadCustomerReconReport(C3Id).pipe(takeUntil(this.destroy$)).subscribe(response => {
      if (response.Status === "Success") {

        this._toastService.success(
          this._translateService.instant('TRANSLATE.RECON_CUSTOMER_REPORT_RELOAD_INITIAT_SUCCESS'));      
      }
      else {
        this._toastService.error(
          this._translateService.instant('TRANSLATE.RECON_CUSTOMER_REPORT_RELOAD_INITIAT_FAIL'));
        // notifier.notifyError($filter('translate')('RECON_CUSTOMER_REPORT_RELOAD_INITIAT_FAIL'));
        this.reconloading = false;
      }
    });
    this._subscriptionArray.push(subscription);
  }


    reloadCustomerReconReportWebJob(C3Id: string) {
        this.reconloading = true;
        let customerList: any = [];
        customerList.push({ C3CustomerId: C3Id, ServiceProviderCustomerId: null });
        let inputModel = { CustomerC3Id: C3Id, Customers: customerList };
        const subscription = this._customerListingSAervice.reloadCustomerReconReportWebJob(C3Id, inputModel).pipe(takeUntil(this.destroy$)).subscribe(response => {
            if (response.Status === "Success") {

                this.jobStatusForLoadReconReportObj = response.Data;
                if (this.jobStatusForLoadReconReportObj.ErrorDetails == null || this.jobStatusForLoadReconReportObj.ErrorDetails == '') {
                    this.jobStatusForLoadReconReportList = this.jobStatusForLoadReconReportObj.C3Customers;
                    this.jobStatusForLoadReconReport = null;
                    if (this.jobStatusForLoadReconReportList != null && this.jobStatusForLoadReconReportList.length > 0) {
                        this.jobStatusForLoadReconReport = this.jobStatusForLoadReconReportList[0];
                    }
                    this.activeLoadReconWebJobs = this.activeLoadReconWebJobs.concat(this.jobStatusForLoadReconReportList)
                    //  $.merge(vm.ActiveLoadReconWebJobs, vm.JobStatusForLoadReconReportList);

                    this.reconStatus = 'Initiated';
                    this.pollForStatusOfReloadRecon();
                    this._toastService.success(
                        this._translateService.instant('TRANSLATE.RECON_CUSTOMER_REPORT_RELOADING'));
                    // notifier.notifySuccess($filter('translate')('RECON_CUSTOMER_REPORT_RELOADING'));
                }
                else {
                    this._toastService.error(
                        this._translateService.instant(this.jobStatusForLoadReconReportObj.ErrorDetails));
                    // notifier.notifyError($filter('translate')(this.JobStatusForLoadReconReportObj.ErrorDetails));
                    this.reconloading = false;
                }
            }
            else {
                this._toastService.error(
                    this._translateService.instant('TRANSLATE.RECON_CUSTOMER_REPORT_RELOAD_INITIAT_FAIL'));
                // notifier.notifyError($filter('translate')('RECON_CUSTOMER_REPORT_RELOAD_INITIAT_FAIL'));
                this.reconloading = false;
            }
        });
        this._subscriptionArray.push(subscription);
    }

    GetLoadReconWebJobStatus() {
        this.reconloading = true;
        let customers: any[] = [];
        let entityName = this._commonService.entityName;
        let userC3Id: any;
        let userContext: any;
        let isShowMsg = false;
        if (entityName == 'Reseller') {
            userContext = JSON.parse(this._commonService.userContext);
            let resellerDetails = userContext.filter(user => user.EntityName == "Reseller");
            userC3Id = resellerDetails[0].C3UserId;
        }
        else {
            userContext = this._commonService.userInfo;
            userC3Id = userContext[userContext.length - 1].C3UserId

        }
        this.activeLoadReconWebJobs.forEach(obj => {
            customers.push({ C3CustomerId: obj.C3CustomerId, JobLogC3Id: obj.JobLogC3Id });
        });
        let jobStatusForLoadReconReportModel = { Customers: customers };
        const subscription = this._customerListingSAervice.getLoadReconWebJobStatus(jobStatusForLoadReconReportModel).pipe(takeUntil(this.destroy$)).subscribe(response => {
            let isError = false;
            if (response.Status === "Success") {
                let webojobstatusresponse = response.Data;
                let CustomersData = webojobstatusresponse.C3Customers;

                this.activeLoadReconWebJobs = CustomersData.filter((obj: any) => {
                    if (userC3Id == obj.C3UserId) {
                        isShowMsg = true;
                    }
                    return obj.Status == 'Queued' || obj.Status == 'InProgress';
                });

                this.reconloading = this.activeLoadReconWebJobs.length > 0;

                if (this.reconloading) {
                    this.pollForStatusOfReloadRecon();
                    if (isShowMsg) {
                        this._toastService.success(
                            this._translateService.instant('TRANSLATE.RECON_CUSTOMER_REPORT_RELOADING'));
                        // notifier.notifySuccess($filter('translate')('RECON_CUSTOMER_REPORT_RELOADING'));
                    }
                }
                else {
                    this.stopPollingForReloadRecon();
                    // $timeout(function () { notifier.clearToaster(); }, 1000);
                    CustomersData.forEach((customerobj: any) => {
                        if (customerobj.ErrorDetails != '' && customerobj.ErrorDetails != null) {
                            isError = true;
                        }
                    });
                    if (isError) {
                        if (isShowMsg) {
                            setTimeout(() => {
                                this._toastService.error(
                                    this._translateService.instant('TRANSLATE.RECON_CUSTOMER_REPORT_RELOAD_INITIAT_FAIL'));
                            }, 1000);
                            // $timeout(function () { notifier.notifyError($filter('translate')('RECON_CUSTOMER_REPORT_RELOAD_INITIAT_FAIL')); }, 1000);
                        }
                    }
                    else {
                        if (isShowMsg) {
                            const message = this._translateService.instant('TRANSLATE.RECON_CUSTOMER_REPORT_RELOAD_INITIAT_SUCCESS')
                            this._notifierService.alert({ title: message, icon: 'info' });
                            // notifier.notify($filter('translate')('RECON_CUSTOMER_REPORT_RELOAD_INITIAT_SUCCESS'));
                        }
                    }
                }
            }
            else {
                // $timeout(function () { notifier.clearToaster(); }, 500);
                if (isShowMsg) {
                    setTimeout(() => {
                        this._toastService.error(
                            this._translateService.instant('TRANSLATE.RECON_CUSTOMER_REPORT_RELOAD_INITIAT_FAIL'));
                    }, 1000);
                    // $timeout(function () { notifier.notifyError($filter('translate')('RECON_CUSTOMER_REPORT_RELOAD_INITIAT_FAIL')); }, 1000);
                }
                this.reconloading = false;
                this.stopPollingForReloadRecon();
            }
        });
        this._subscriptionArray.push(subscription);
    }

    pollForStatusOfReloadRecon() {
        this.stopPollingForReloadRecon();
        if (this.reconloading && !this.timerHandleForReloadReconStatus && this.activeLoadReconWebJobs != null && this.activeLoadReconWebJobs.length > 0) {
            this.timerHandleForReloadReconStatus = interval(30000).pipe(
                switchMap(() => {
                    this.GetLoadReconWebJobStatus();
                    return [];
                })
            ).pipe(takeUntil(this.destroy$)).subscribe();
        } else {
            this.reconloading = false;
        }
    }

    stopPollingForReloadRecon() {
        if (this.timerHandleForReloadReconStatus) {
            this.timerHandleForReloadReconStatus.unsubscribe();
            this.timerHandleForReloadReconStatus = null;
        }
    }

    deleteCustomer(data: any) {
        let deleteCustomerConfirmation = this._translateService.instant('TRANSLATE.POPUP_DELETE_CUSTOMER_CONFIRMATION_TEXT', { CustomerName: data.Name });
        this._notifierService.confirmDeletion({ title: deleteCustomerConfirmation }).then((result: { isConfirmed: any, isDenied: any }) => {
            if (result.isConfirmed) {
                const subscription = this._customerListingSAervice.deleteCustomer(data.C3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                    if (response.Status === "Success") {
                        this._toastService.success(this._translateService.instant('TRANSLATE.DELETE_CUSTOMER_SUCCESS'));
                        this.resetSearchCriteria();
                    }
                    else {
                        this._toastService.error(this._translateService.instant('TRANSLATE.DELETE_CUSTOMER_FAILURE'));
                        this.resetSearchCriteria();
                    }
                    this.reloadEvent.emit(true);
                });
                this._subscriptionArray.push(subscription);
            }
        });
    }


    onboardCustomer() {
        this._router.navigate(['partner/customers/onboardcustomer']);
        //$state.go('partner.onboardcustomer');
    }

    bulkOnboardCustomers() {
        this._router.navigate(['partner/customers/bulkonboardcustomers'])
        //$state.go('partner.bulkonboardcustomers');
    }

    getPartnerTenant(customerC3Id: string, customerName: string) {

        localStorage.setItem("customerC3IdForLinkCustomer", customerC3Id);
        localStorage.setItem("customerNameForLinkCustomer", customerName);
        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/customers/partnertenants`];
        c3Router.extras = { state: {} };
        c3Router.data = this.setData()
        this.c3RouterService.navigate(c3Router);

        // this._router.navigate(['partner/customers/partnertenants'])
    }

    handleSelection(data: any) {
        //console.log(data);
    }

    CustomerSettings = (data: any) => {

        //ng-click="vm.GetTenantConfiguration(row.C3Id, row.Name)" ng-show="row.OnboardStatus == 'Onboarded'"
        const c3Id = data.C3Id;
        const customerName = data.Name;


        //this._router.navigate([`partner/customers/customerconfiguration`],  {state:{ c3id: c3Id, name: customerName}})
        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/customers/customerconfiguration`];
        c3Router.extras = { state: { c3id: c3Id, name: customerName } };
        c3Router.data = this.setData()
        this.c3RouterService.navigate(c3Router);

    }

    fetchAccountManagersData(): void {
        const entityName = this._commonService.entityName;
        const recordId = this._commonService.recordId;

        const subscription =  this.AccountManagerService.getAccountManagersData(entityName, recordId).pipe(takeUntil(this.destroy$)).subscribe(
            ({ Data }: any) => {
                this.accountManagersData = Data;
            }
        );
        this._subscriptionArray.push(subscription);
    }

    PartnerAddressPopUp(data){
            const modalRef = this._modalService.open(PartnerAddressDetailsPopupComponent, {
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                size: 'lg',
                backdrop: 'static',
            });
            modalRef.componentInstance.entityName = 'Customer'; // Bind fetched data to the modal
            modalRef.componentInstance.recordId = data.C3Id;
            modalRef.componentInstance.isMarkAsDefault = false;
            modalRef.componentInstance.CustomerName = data.Name;
            modalRef.componentInstance.IsSelectedAddressId = data.BillFromAddressId;
            modalRef.result.then((result) => {
                
            },
                (reason) => {
                    /* Closing modal reference if cancelled or clicked outside of the popup*/
                    modalRef.close();
                });
        }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.stopPollingForReloadRecon();
    }

}
