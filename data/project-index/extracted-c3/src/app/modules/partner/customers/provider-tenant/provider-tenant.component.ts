import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, interval, Subject, Subscription, switchMap, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-provider-tenant',
  templateUrl: './provider-tenant.component.html',
  styleUrl: './provider-tenant.component.scss'
})
export class ProviderTenantComponent extends C3BaseComponent implements OnInit, AfterViewInit,OnDestroy {
  tenantArray: any;
  loadingProvidersData: boolean = true;
  customerC3Id: string | null;
  customerName: string | null;
  pageMode: string = 'list';
  isShowStatus: boolean;
  addTenantStatus: any;
  readyToComplete: boolean;
  currentBatchId: any;
  timerHandle: Subscription;
  considerNewMicrosoftCustomerAgreement: any;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-800px',
  };

  @ViewChild('addTenantModal') addTenantModal: TemplateRef<any>;
  @ViewChild('tenantName') tenantNameRef: TemplateRef<any>;
  @ViewChild('tableAction') tableActionRef: TemplateRef<any>;

  formGroup: FormGroup;
  ownerSiteId: any;
  ownerDepartmentId: any;
  loadingEntitlements: boolean;
  sites: any = [];
  lastTenantData: any;
  siteDepartments: any = [];
  planProducts: any = [];
  domainName: any;
  tenantName: any;
  isCreateSubscription: boolean;
  isCreateAdminOwner: boolean;
  tenantSequence: any;
  tenantCount: any;
  mappedC3PlanProduct: any;
  prefixName = null; 
  modalRef: NgbModalRef;
  c3Id: string | null; 
  permissions = {
    HasCustomersBulkOnboard: "Denied",
    HasCustomersBulkAddTenants: "Denied",

  };
  entityName: string;
  hasSupportForResellersWithMPNID: string;

  constructor(
    private _customerService: CustomersListingService,
    private _notifierService: NotifierService,
    private _translateService: TranslateService,
    private _toastService: ToastService,
    private _cdRef: ChangeDetectorRef,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    private _modalService: NgbModal,
    private _commonService: CommonService,
    private _fb: FormBuilder,
    private _pageInfo: PageInfoService,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService,
    private route: ActivatedRoute,
    private _fileService: FileService,
  )
   {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    if (localStorage.getItem("customerC3IdForLinkCustomer") != undefined && localStorage.getItem("customerC3IdForLinkCustomer") != null && localStorage.getItem("customerC3IdForLinkCustomer") != '') {
      this.customerC3Id = localStorage.getItem("customerC3IdForLinkCustomer");
    }
    if (localStorage.getItem("customerNameForLinkCustomer") != undefined && localStorage.getItem("customerNameForLinkCustomer") != null && localStorage.getItem("customerNameForLinkCustomer") != '') {
      this.customerName = localStorage.getItem("customerNameForLinkCustomer");
    }

    this.navigation = this._router.getCurrentNavigation();
    this.c3Id = localStorage.getItem("customerC3IdForLinkCustomer");
    if(this.c3Id == undefined || this.c3Id == null || this.c3Id == ''){
      this._router.navigate([`partner/customers`]);
    }
     this.entityName = this._commonService.entityName;
  }
  

  ngOnInit(): void {
    this.getProviderTenants();
    this.hasPermission();
    this.GetApplicationData();

  }
  hasPermission() {
    this.permissions.HasCustomersBulkOnboard = this._permissionService.hasPermission(this.cloudHubConstants.BULK_ONBOARD_CUSTOMERS);
    this.permissions.HasCustomersBulkAddTenants = this._permissionService.hasPermission(this.cloudHubConstants.BULK_ADD_TENANTS);
  }
  GetApplicationData() {
    const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.hasSupportForResellersWithMPNID = response.Data.HasSupportForResellersWithMPNID;
      this.considerNewMicrosoftCustomerAgreement = response.Data.ConsiderNewMicrosoftCustomerAgreement;
    });
    this._subscriptionArray.push(subscription);
  }
  
  getProviderTenants() {
    //startBlockUI();
    this.tenantArray = [];
    this.loadingProvidersData = true;
    const subscription = this._customerService.getServiceProviderCustomerByC3Id(this.customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      let tenants = res.Data;
      let distinctProvider = [...new Set(tenants.map((e: any) => e.ProviderName))];
      let index = 1;
      distinctProvider.forEach(provider => {
        let providerData: any = tenants.filter((t: any) => {
          return t.ProviderName === provider;
        });
        providerData.id = index++;
        this.tenantArray.push(providerData);

      });
      this.loadingProvidersData = false;
      //this.handleTableConfig();
      this._cdRef.detectChanges();
      /* Need to add function handle tooltip */
      //     $timeout(function () {
      //         $(".tooltips").tooltip();
      //     }, 800);
    });
    this._subscriptionArray.push(subscription);
  }

  copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
    .then(() => {
      this._toastService.success(this._translateService.instant('TRANSLATE.ATTESTATION_LINK_COPIED_SUCCESS_MESSAGE'));
    })
    .catch(() => {
      this._toastService.error(this._translateService.instant('TRANSLATE.ATTESTATION_LINK_COPIED_FAILED_MESSAGE'));
    });
}
DownloadBulkonboardingbatch() {
      let searchModel: any = { CustomerC3Id: this.customerC3Id };
    this._fileService.post('/bulkaddtenants/downloadTenantsWithAttestationPending', true, searchModel);
  }
  
  Resumeserviceprovidercall() {
const param = { 
      BatchID: this.currentBatchId
  };
  const subscription = this._customerService.bulkaddtenants(param).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {

      if (response.Status === 'Success') {
        this._toastService.success(
          this._translateService.instant('TRANSLATE.TENANT_MANAGEMENT_NOTIFICATION_RESUME_REQUEST')
        );
        this.loadStatusView();
      } else {
        this._toastService.error(
          this._translateService.instant('TRANSLATE.TENANT_MANAGEMENT_NOTIFICATION_RESUME_REQUEST_FAILED')
        );
      }

    });

  this._subscriptionArray.push(subscription);
}



  updateDefaultValue(row: any) {
    let notifierText = this._translateService.instant('TRANSLATE.SERVICE_PROVIDER_TENANT_UPDATE_DEFAULT_VALUE_CONFIRM', { customerName: row.ServiceProviderCustomerName })
    this._notifierService.confirm({ title: notifierText, icon: 'info', confirmButtonColor: '#17C653' }).then((result: { isConfirmed: any; isDenied: any; }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        row.IsDefault = true;
        notifierText = this._translateService.instant('TRANSLATE.SERVICE_PROVIDER_TENANT_UPDATE_DEFAULT_VALUE_SUCCESS', { customerName: row.ServiceProviderCustomerName });
        const subscription = this._customerService.updateDefaultProviderTenant(row).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
          this._notifierService.alert({ title: notifierText })
          this.getProviderTenants();

        })
        this._subscriptionArray.push(subscription);
      }
    });
  }

  linkCustomer() {
    localStorage.setItem("customerC3IdForLinkCustomer", this.customerC3Id || '');
    localStorage.setItem("customerNameForLinkCustomer", this.customerName || '');
    this._router.navigate(['partner/customers/linkcustomer'],{state: {keyForData:this.keyForData}});
    //$state.go('partner.linkcustomer');
  }

  linkToMultipleProviders() {
    localStorage.setItem("customerC3IdForLinkCustomer", this.customerC3Id || '');
    localStorage.setItem("customerNameForLinkCustomer", this.customerName || '');
    this._router.navigate(['partner/customers/bulkonboardcustomers'],{state: {keyForData:this.keyForData}});
  }

  /* Need to add back to customer */
  //    backToCustomers() {
  //     if (vm.frmBasicDetails !== undefined && vm.frmBasicDetails && !vm.frmBasicDetails.$pristine && vm.providerId != null) {
  //         $rootScope.swalConfirmation("", $filter('translate')('POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT'), "info", true, 'btn-danger', $filter('translate')('BUTTON_TEXT_OK'), $filter('translate')('BUTTON_TEXT_CANCEL'), true,
  //             function () {
  //                 formService.cleanseForm(vm.frmBasicDetails);
  //                 formService.clearUnsavedChanges();
  //                 $state.go("partner.customers", { UseCachedFilters: true });
  //             });
  //     } else {
  //         $state.go("partner.customers", { UseCachedFilters: true });
  //     }
  // }
  backToTenants() {
    this.getProviderTenants();
    this.isShowStatus = false;
    this.pageMode = "list"
  }

  backToCustomer(){
    this.c3RouterService.backToHistory(this.keyForData,'partner/customers');
  }
  InProgresforResume: number = 0;
  loadStatusView() {
    // $timeout(function () {
    //     $(".tooltips").tooltip();
    // }, 800);
    let searchModel: any = {
      CustomerC3Id: this.customerC3Id
    };
    const subscription =  this._customerService.bulkAddTenant(searchModel).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res.Status === 'Success') {
        this.addTenantStatus = res.Data;
        let progresscount = 0;
        this.InProgresforResume =0;
        this.readyToComplete = false;
        this.addTenantStatus.forEach((tenant: any) => {
          if ((tenant.Status === "InProgress" || tenant.Status === "Submitted" ||tenant.Status === "AttestationPending")) {
            progresscount++;
          }
          if (tenant.Status === "InProgress" || tenant.Status === "Submitted" ) {
             this.InProgresforResume++;
          }
        });

        if (progresscount <= 0) {
          this.readyToComplete = true;
           this.InProgresforResume++;
        }
        if (this.addTenantStatus.length > 0) {
          this.currentBatchId = this.addTenantStatus[0].BatchId;
          this.pageMode = "status";
          if (!this.readyToComplete) {
            this.pollForStatus();
          }
          this.isShowStatus = true;
        }
        else {
          this.addToMultipleTenants();
        }
        this._cdRef.detectChanges();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  complete() {
    const subscription = this._customerService.completeBulkTenantAdd(this.currentBatchId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this._toastService.success(this._translateService.instant('TRANSLATE.TENANT_MANAGEMENT_NOTIFICATION_COMPLETED'));
        this.stopPolling();
        this.getProviderTenants();
        this.isShowStatus = false;
        this.pageMode = 'list';
      }
    });
    this._subscriptionArray.push(subscription);
  }


  addToMultipleTenants() {
    this.loadingEntitlements = true;
    this.formGroup = this._fb.group({
      tenantName: ['', Validators.required],
      prefixName: [null],
      tenantSequence: ['', Validators.required],
      tenantCount: ['', Validators.required],
      domainName: ['', Validators.required],
      isCreateSubscription: [false],
      mappedC3PlanProduct: [],
      ownerSiteId: [''],
      ownerDepartmentId: [''],
      isCreateAdminOwner: [false],
    });

    this.modalRef = this._modalService.open(this.addTenantModal, this.modalConfig);
    combineLatest([
      this._commonService.getSitesByCustomerC3Id(this.customerC3Id),
      this._commonService.getLastTenantInfo(this.customerC3Id),
    ]).pipe(takeUntil(this.destroy$)).subscribe(([site, lastTenant]: [any, any]) => {
      this.sites = site.Data;
      this.lastTenantData = lastTenant.Data[0];
    });
    this.modalRef.result.then((result) => {
      this.formGroup.reset();
      this.resetForm();
      result.CustomerC3Id = this.customerC3Id;
      const subscription = this._customerService.bulkaddtenants(result).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === 'Success') {
          this._toastService.success(this._translateService.instant('TRANSLATE.TENANT_MANAGEMENT_NOTIFICATION_ENQUEUED_REQUEST'));
          this.loadStatusView();
        } else {
          this._toastService.error(this._translateService.instant('TRANSLATE.TENANT_MANAGEMENT_NOTIFICATION_ENQUEUED_REQUEST_FAILED'));
        }
      });
      this._subscriptionArray.push(subscription);
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        this.formGroup.reset();
        this.resetForm();
        this.modalRef.close();
      });
  }

  pollForStatus() {
    this.stopPolling();

    if (this.readyToComplete === false && !this.timerHandle && this.pageMode === "status") {
      this.timerHandle = interval(30000).pipe(takeUntil(this.destroy$),
        switchMap(() => {
          this.loadStatusView();
          return [];
        })
      ).subscribe();
    }
  }

  stopPolling() {
    if (this.timerHandle) {
      this.timerHandle.unsubscribe();
      this.timerHandle = null;
    }
  }

  closeModalPopup() {
    this.formGroup.reset();
    this.resetForm();
    this._modalService.dismissAll();
  }


  // getSites() {
  //   this.ownerSiteId = null;
  //   this._commonService.getSitesByCustomerC3Id(this.customerC3Id).subscribe((response: any) => {
  //     this.sites = response.Data;
  //   });
  // }

  getSiteDepartments() {
    this.ownerSiteId = this.getFormControlValue('ownerSiteId');
    this.ownerDepartmentId = null;
    const subscription = this._commonService.getSiteDepartments(this.ownerSiteId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.siteDepartments = response.Data;
    });
    this._subscriptionArray.push(subscription);
  }

  getAzurePlanOffers() {
    const subscription = this._commonService.getAzurePlanOffers(this.customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.planProducts = response.Data;
    })
    this._subscriptionArray.push(subscription);
  }

  setDefaultTenantName() {

    let domainValue = this.getFormControlValue('tenantName')?.replace(/ /g, '');
    this.setFormControlValue('domainName', domainValue?.replace(/[`~!@#$%^&*()_|+\-=?;.,:'"<>\{\}\[\]\\\/]/gi, ""));
    this.domainName = this.getFormControlValue('domainName');
    this.tenantName = this.getFormControlValue('tenantName');


  }

  setDefaultTenantSequence(){
    this.tenantSequence = this.getFormControlValue('tenantSequence');
  }

  setDefaultTenantPrefix(){
    this.prefixName = this.getFormControlValue('prefixName');
  }      
  setIsCreateSubscription() {
    this.getAzurePlanOffers();
    this.isCreateSubscription = this.getFormControlValue('isCreateSubscription');
    if (this.getFormControlValue('isCreateSubscription') === false) {
      this.setFormControlValue('ownerSiteId', null);
      this.setFormControlValue('ownerDepartmentId', null);
      this.setFormControlValue('IsCreateAdminOwner', false);
      this.getFormControl('mappedC3PlanProduct')?.clearValidators();
    }
    if (this.isCreateSubscription) {
      this.getFormControl('mappedC3PlanProduct')?.setValidators(Validators.required);
    }
    this.getFormControl('mappedC3PlanProduct')?.updateValueAndValidity();
  }

  selectPlanProductId(item: any) {
  }

  onModalSubmit() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      this.tenantName = this.getFormControlValue('tenantName');
      this.tenantSequence = this.getFormControlValue('tenantSequence');
      this.tenantCount = this.getFormControlValue('tenantCount');
      this.mappedC3PlanProduct = this.getFormControlValue('mappedC3PlanProduct');
      this.prefixName = this.getFormControlValue('prefixName');
      this.isCreateAdminOwner = this.getFormControlValue('isCreateAdminOwner');
      if (!(this.tenantSequence % 1 >= 0)) {
        this._toastService.error(this._translateService.instant('TRANSLATE.TENANT_MANAGEMENT_NOTIFICATION_SEQUENCE_ERROR'));
      } else {
        if (this.tenantCount > this.lastTenantData?.CurrentAlowedCount) {
          this._toastService.error(this._translateService.instant('TRANSLATE.TENANT_EXCEEDED_COUNT_ERROR', { Count: this.lastTenantData?.CurrentAlowedCount }));
        } else {
          let ppId = null;
          if (this.mappedC3PlanProduct !== undefined && this.mappedC3PlanProduct !== null && this.mappedC3PlanProduct !== '') {
            ppId = this.mappedC3PlanProduct.PlanProductId;
          }
          let tempTenantName = this.tenantName;
          if (this.prefixName != undefined && this.prefixName != null && this.prefixName.length > 0) {
            this.tenantName = this.prefixName.trim().length > 0 ? (this.prefixName + ' ' + this.tenantName) : this.tenantName;
          }
          var model = {
            TenantName: this.tenantName,
            TenantSequence: this.tenantSequence,
            TenantCount: this.tenantCount,
            DomainName: this.domainName,
            IsCreateSubscription: this.isCreateSubscription || false,
            AzurePlanId: ppId,
            OwnerSiteId: this.ownerSiteId || null,
            OwnerDepartmentId: this.ownerDepartmentId || null,
            IsCreateAdminOwner: this.isCreateAdminOwner,
            Prefix: this.prefixName
          };
          this.modalRef.close(model);
        }
      }
    }
  }

  resetForm() {
    this.ownerSiteId = '';
    this.ownerDepartmentId = '';
    this.loadingEntitlements = false;
    this.sites = [];
    this.lastTenantData = [];
    this.siteDepartments = [];
    this.planProducts = [];
    this.domainName = '';
    this.tenantName = '';
    this.isCreateSubscription = false;
    this.isCreateAdminOwner = false;
    this.tenantSequence = '';
    this.tenantCount = '';
    this.mappedC3PlanProduct = '';
    this.prefixName = '';
  }

  getFormControl(controlName: string) {
    return this.formGroup.get(controlName);
  }

  getFormControlValue(controlName: string) {
    return this.getFormControl(controlName)?.value;
  }

  setFormControlValue(controlName: string, data: any) {
    let control = this.getFormControl(controlName);
    control?.setValue(data);
  }

  navigateBackToCustomers(): void {
    localStorage.removeItem("customerNameForLinkCustomer")
    localStorage.removeItem("customerC3IdForLinkCustomer")
    this._router.navigate(['/partner/customers']);
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let title = this._translateService.instant('TRANSLATE.SERVICE_PROVIDER_TENANT_HEADER');
    title = title + ` <span class="text-primary">${this.customerName}</span>`
    this._pageInfo.updateTitle(title, true);
    
    if (this._commonService.entityName === 'Reseller') {
         this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS', 'SERVICE_PROVIDER_TENANT']);
      }
      else if (this._commonService.entityName === 'Partner') {
         this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS', 'SERVICE_PROVIDER_TENANT']);
      }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopPolling();
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}

