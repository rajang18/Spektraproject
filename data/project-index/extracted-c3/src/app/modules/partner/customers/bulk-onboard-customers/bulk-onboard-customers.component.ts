import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NavigationEnd, Router, Scroll } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { filter, interval, startWith, Subject, Subscription, switchMap, takeUntil} from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PageMode } from 'src/app/shared/models/enums/enums';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-bulk-onboard-customers',
  templateUrl: './bulk-onboard-customers.component.html',
  styleUrl: './bulk-onboard-customers.component.scss'
})
export class BulkOnboardCustomersComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {

  PageModeEnum: typeof PageMode = PageMode;
  frmProviderDetails: FormGroup
  providers: any = null;
  providerId: any = null;
  providerName: any;
  pageMode: any;
  isLatestBatchHavingCustomersWithUnmappedSubscriptions: boolean;
  customerOnboardStatus: any;
  readyToComplete: boolean;
  latestBatchId: any;
  enableButtonForDownloadingMappingDetailsOfBatch: boolean = false;
  updateCustomerStatusToCompleteViewModel: any = {};
  timerHandle: Subscription | null = null;
  downloadSubscriptionMappingDetailsInputModel: any ={};
  routeSubscription : Subscription;

  //observable to stop polling
  destroyPolling = new Subject<void>();

  constructor(
    private _customerService: CustomersListingService,
    private _notifierService: NotifierService,
    public _translateService: TranslateService,
    private _cdRef: ChangeDetectorRef,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    _modalService: NgbModal,
    private _commonService: CommonService,
    private _fb: FormBuilder,
    private _fileService: FileService,
    private _pageInfo: PageInfoService,
    private _unsavedChangesService: UnsavedChangesService,
    _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.createForm();
    this.frmProviderDetails.get('providerId').setValue("");
    let providerIdForOnboard = localStorage.getItem("providerIdForOnboard");
    if (providerIdForOnboard !== undefined && providerIdForOnboard !== null && providerIdForOnboard !== '') {
      this.providerId = localStorage.getItem("providerIdForOnboard");
      this.getProvider();
    }
    else {
      this.getProvider();
    }
    const subscription = this._router.events
    .pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),  //handles on HardReload related edge Cases
      takeUntil(this.destroy$)
  ).subscribe(event => {
          // update this.homepageData
          this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_ONBOARDING_CAPTION_TEXT_BULK_CUSTOMER_ONBOARDING"),true);
          if(this._commonService.entityName === 'Partner'){
            this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','CUSTOMERS_BREADCRUMB_BUTTON_TEXT_CUSTOMERS'])
          }else{
            this._pageInfo.updateBreadcrumbs(['MENUS_SELL','CUSTOMERS_BREADCRUMB_BUTTON_TEXT_CUSTOMERS'])
          }
          this.getBulkOnboardStatus();
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {
    this.getBulkOnboardStatus();
    this._customerService.fetchBulkOnboardStatus$.subscribe((res:boolean)=>{
      if(res){
        this.getBulkOnboardStatus();
        this._customerService.setBulkOnboardStatus(false);
      }
    })
    //this.stopPollingForOnboardingStatus();
    // this.getProvider();
  }

  backToCustomers() {
    if (this.frmProviderDetails !== undefined && this.frmProviderDetails && !this.frmProviderDetails.pristine) {
      let message = this._translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT');
      let btnOkText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
      this._notifierService.confirm({ title: message, icon: 'info', confirmButtonText: btnOkText }).then((result: { isConfirmed: any, isDenied: any }) => {
        if(result.isConfirmed){
          this.frmProviderDetails.clearValidators();
          this.frmProviderDetails.reset();
          this._router.navigate(['partner/customers'])
        }
      });
    } else {
      this._router.navigate(['partner/customers'])
    }
  }

  getProvider() {
    const subscription = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        let data = response;
        ///*To filter Partner*/
        data = data.filter((provider: any) => {
          return !provider.IsManagedByPartner;
        });
        this.providers = data;
        this._cdRef.detectChanges();
        if (this.providerId !== null && this.providerId !== undefined && this.providerId !=='') {
          this.frmProviderDetails.get('providerId').setValue(this.providerId);
          this.onProviderChange();
        }
    });
    this._subscriptionArray.push(subscription);
  }


  onProviderChange() {
    this.providerId = this.frmProviderDetails.get('providerId').value;
    if(this.providerId !== null && this.providerId !== undefined && this.providerId !==''){
      let selectedProvider = this.providers.filter((provider: any) => {
        return provider.ID === parseInt(this.providerId);
      });
  
      if (selectedProvider !== undefined && selectedProvider !== null && selectedProvider !== '' && selectedProvider.length > 0) {
        this.providerName = selectedProvider[0].Name;
        this.providerId = selectedProvider[0].ID.toString();
  
        localStorage.setItem("providerIdForOnboard", this.providerId);
        localStorage.setItem("providerNameForOnboard", this.providerName);
  
        if (this.providerName === 'Microsoft') {
          this._router.navigate(['partner/customers/bulkonboardcustomers/microsoft'])
          //$state.transitionTo('partner.bulkonboardcustomers.microsoft');                   
        }
        if (this.providerName === 'MicrosoftNonCSP') {
          this._router.navigate(['partner/customers/bulkonboardcustomers/microsoftnoncsp'])
          //$state.transitionTo('partner.bulkonboardcustomers.microsoftnoncsp');
        }
      } else {
        this._router.navigate(['partner/customers/bulkonboardcustomers'])
  
        //$state.transitionTo('partner.bulkonboardcustomers');
        localStorage.setItem("providerIdForOnboard", '');
        this.providerId = null;
        this.pageMode = null;
        this.providerName = null;
      }
    }else{
      this.providerId = '';
      this._router.navigate(['partner/customers/bulkonboardcustomers'])
    }
   
    this._cdRef.detectChanges();
  }

  getBulkOnboardStatus() {
    this.isLatestBatchHavingCustomersWithUnmappedSubscriptions = false;
    this._customerService.pendingBulkOnBoardCustomerRecords().pipe(takeUntil(this.destroyPolling)).subscribe((response: any) => {
      this.customerOnboardStatus = response.Data;
      this.readyToComplete = true;
      if (this.customerOnboardStatus.length > 0) {
        this.customerOnboardStatus.forEach((customer: any) => {
          this.latestBatchId = customer.BatchID;
          // if atleast one of the customer is having some unmapped subscriptions set the isLatestBatchHavingCustomersWithUnmappedSubscriptions to true
          if ((customer.OnboardingStatus === 'Success' && customer.TotalSubscriptionsAtProvider !== customer.TotalSubscriptionsOnboarded)) {
            this.isLatestBatchHavingCustomersWithUnmappedSubscriptions = true;
          }
          if ((customer.OnboardingStatus === "InProgress" || customer.OnboardingStatus === "Submitted")) {
            this.readyToComplete = false;
          }
          else if (customer.OnboardingStatus === "Error") {
          }
        });

        this.pageMode = "status";
        this.frmProviderDetails.reset();
        if (!this.readyToComplete) {
          this.pollForStatusOfBulkOnboardCustomer();
        }
        else {
          this.stopPollingForOnboardingStatus();
          this.enableButtonForDownloadingMappingDetailsOfBatch = true;
        }

      }
      else {
        this.pageMode = "add";
        this.stopPollingForOnboardingStatus();
      }
      this._cdRef.detectChanges();
    });
  }

  updateTheStatusAsComplete() {
    this.updateCustomerStatusToCompleteViewModel.EntityName = this._commonService.entityName;
    this.updateCustomerStatusToCompleteViewModel.RecordId = this._commonService.recordId;
    this.updateCustomerStatusToCompleteViewModel.BatchID = this.latestBatchId;
    const subscription =  this._customerService.updateBulkOnboardCustomersStatusToComplete(this.updateCustomerStatusToCompleteViewModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this._router.navigate(['partner/customers'])
    });
    this._subscriptionArray.push(subscription);
  }

  // function to poll for status in periodic interval
  pollForStatusOfBulkOnboardCustomer() {
    this.stopPollingForOnboardingStatus();
    if (!this.readyToComplete && !this.timerHandle && this.pageMode === 'status') {
      this.timerHandle = interval(15000).pipe(takeUntil(this.destroy$),
        switchMap(() => {
          this.getBulkOnboardStatus();
          return []
        })
      ).subscribe();
    }
  }

  stopPollingForOnboardingStatus() {
    if (this.timerHandle) {
      this.timerHandle.unsubscribe();
      this.timerHandle = null;
    }
    this.destroyPolling.next();
    this.destroyPolling.complete();
  }

  subscriptionMappingDetailsOfLatestBulkOnboardingBatch(serviceProviderCustomerId: any) {
    this.downloadSubscriptionMappingDetailsInputModel.EntityName = this._commonService.entityName;
    this.downloadSubscriptionMappingDetailsInputModel.RecordId = this._commonService.recordId;
    this.downloadSubscriptionMappingDetailsInputModel.ServiceProviderCustomerId = serviceProviderCustomerId;
    this.downloadSubscriptionMappingDetailsInputModel.BatchID = this.latestBatchId;


    this._fileService.post('bulkOnboardCustomers/DownloadSubscriptionMappingDetails', true, this.downloadSubscriptionMappingDetailsInputModel);
  }
  
  createForm(){
    this.frmProviderDetails = this._fb.group({
      providerId:['']
    });
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService?.setUnsavedChanges(false);
    this.frmProviderDetails.reset();
    this.routeSubscription?.unsubscribe();
    localStorage.removeItem("providerIdForOnboard");
    localStorage.removeItem("providerNameForOnboard");
    localStorage.removeItem("customerType");
    localStorage.removeItem("customerC3IdForLinkCustomer");
    localStorage.removeItem("customerNameForLinkCustomer");
  }
}
