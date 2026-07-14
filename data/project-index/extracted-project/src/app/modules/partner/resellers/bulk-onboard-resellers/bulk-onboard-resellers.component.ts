import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ResellersListingService } from '../services/resellers-listing.service';
import { TranslateService } from '@ngx-translate/core';
import { PageMode } from 'src/app/shared/models/enums/enums';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, Subscription, interval, switchMap, takeUntil} from 'rxjs';
import { NotifierService } from 'src/app/services/notifier.service';
import { forEach } from 'lodash';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
@Component({
  selector: 'app-bulk-onboard-resellers',
  templateUrl: './bulk-onboard-resellers.component.html',
  styleUrl: './bulk-onboard-resellers.component.scss'
})
export class BulkOnboardResellersComponent extends C3BaseComponent implements OnInit, OnDestroy {
  providers: any = null;
  providerId: any = null;
  providerName: any;
  PageModeEnum: typeof PageMode = PageMode;
  frmProviderDetails: FormGroup
  pageMode: any;
  readyToComplete: boolean;
  timerHandle: Subscription | null = null;
  latestBatchId: any;
  resellersOnboardStatus: any;
  totalResellersSelected: any;
  resellersFailed: any;
  resellersSucceeded: any;
  routeSubscription : Subscription; 

  constructor(
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    private _cdRef: ChangeDetectorRef,
    private _resellerService: ResellersListingService,
    private _translateService: TranslateService,
    private _formBuilder: FormBuilder,
    private _notifierService: NotifierService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService, 

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.createForm();
    this.frmProviderDetails.get('providerId').setValue("");
    const subscription = this.routeSubscription = this._router.events
    .pipe(takeUntil(this.destroy$))
    .subscribe(event => {
      if (event instanceof NavigationEnd) {    
          // update this.homepageData
          this.getBulkOnboardResellerStatus();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'RESELLER_BREADCRUMB_BUTTON_TEXT_RESELLER','BULK_ONBOARDING_RESELLERS_CAPTION_TEXT']);
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.BULK_ONBOARDING_RESELLERS_CAPTION_TEXT"), true);
    this.getProviders();
    this.getBulkOnboardResellerStatus();
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.BULK_ONBOARDING_RESELLERS_CAPTION_TEXT"), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_SELL_INDIRECT', 'ONBOARDING_ANALYTICS_SEARCH_LABEL_RESELLERS']);
  }

  createForm() {
    this.frmProviderDetails = this._formBuilder.group({
      providerId: ['']
    });
  }

  backToResellers() {
    if (this.frmProviderDetails !== undefined && !this.frmProviderDetails.pristine && this.providerId != null) {
      let swalMsg = this._translateService.instant('TRANSLATE.POPUP_UNSAVED_CHANGES_CONFIRMATION_TEXT');
      let swalConfirmBtn = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
      this._notifierService.confirm({ title: swalMsg, confirmButtonText: swalConfirmBtn }).then((result: { isConfirmed: any, isDenied: any }) => {
        if (result.isConfirmed) {
          this.frmProviderDetails.clearValidators();
          this.frmProviderDetails.reset();
          this._router.navigate(['partner/resellers']);
        }
      });
    }
    else {
      this._router.navigate(['partner/resellers']);
    }
  }

  getProviders() {
    let includeNonCSP: boolean = false;
    const subscription = this._resellerService.getProvidersForBulkResellerOnboarding(includeNonCSP).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === "Success") {
        this.providers = response.Data;
        this._cdRef.detectChanges();
      }
    })
    this._subscriptionArray.push(subscription);
  }

  onProviderChange() {
    this.providerId = this.frmProviderDetails.get('providerId').value;
    if (this.providerId !== null && this.providerId !== undefined && this.providerId !== '') {
      let selectedProvider = this.providers.filter((provider: any) => {
        return provider.ID === parseInt(this.providerId);
      });
      if (selectedProvider !== undefined && selectedProvider !== null && selectedProvider !== '' && selectedProvider.length > 0) {
        this.providerName = selectedProvider[0].Name;
        this.providerId = selectedProvider[0].ID.toString();
        localStorage.setItem("providerIdForResellerOnboard", this.providerId);
        localStorage.setItem("providerNameForResellerOnboard", this.providerName);
        if (this.providerName === 'Microsoft') {
          this._router.navigate(['partner/resellers/bulkonboardreseller/microsoft']);
        }
      }
      else {
        localStorage.setItem("providerIdForResellerOnboard", '');
        localStorage.setItem("providerNameForResellerOnboard", '');
        this._router.navigate(['partner/resellers/bulkonboardreseller/microsoft']);
        this.providerId = null;
        this.pageMode = null;
        this.providerName = null;
      }
    }
    else {
      localStorage.setItem("providerIdForResellerOnboard", '');
      localStorage.setItem("providerNameForResellerOnboard", '');
      this._router.navigate(['partner/resellers/bulkonboardreseller']);
      this.providerId = null;
      //this.pageMode = null;
      this.providerName = null;
      this._cdRef.detectChanges();
    }
    this._cdRef.detectChanges();
  }

  getBulkOnboardResellerStatus() {
    const self = this;
    const subscription = this._resellerService.getBulkOnboardResellersStatus().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.resellersOnboardStatus = response.Data;
      this.readyToComplete = true;
      if (this.resellersOnboardStatus.length > 0) {
        this.totalResellersSelected = this.resellersOnboardStatus[0].TotalCount;
        this.resellersFailed = this.resellersOnboardStatus[0].ErrorCount;
        this.resellersSucceeded = this.resellersOnboardStatus[0].SuccessCount;
        forEach(this.resellersOnboardStatus,reseller =>{
          self.latestBatchId = reseller.BatchId;
          if ((reseller.OnboardingStatus === "InProgress" || reseller.OnboardingStatus === "Queued")) {
            self.readyToComplete = false;
          }
          else if (reseller.OnboardingStatus === "Failed") {
            // do nothing
          }
        })
        this.pageMode = "status";
        if (!this.readyToComplete) {
          this.pollForStatusOfBulkOnboardResellers();
        }
        else {
          this.stopPollingForOnboardingStatus();
        }
      }
      else {
        this.pageMode = "add";
        this.stopPollingForOnboardingStatus();
      }
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  pollForStatusOfBulkOnboardResellers() {
    if (!this.readyToComplete && !this.timerHandle && this.pageMode === 'status') {
      const subscription = this.timerHandle = interval(30000).pipe(
        switchMap(() => {
          this.getBulkOnboardResellerStatus();
          return []
        })
      ).pipe(takeUntil(this.destroy$)).subscribe();
      this._subscriptionArray.push(subscription);
    }
  }

  stopPollingForOnboardingStatus() {
    if (this.timerHandle) {
      this.timerHandle.unsubscribe();
      this.timerHandle = null;
    }
  }

  updateTheStatusAsComplete() {
    const subscription = this._resellerService.updateTheStatusAsComplete(this.latestBatchId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status == "Success") {
        let message = this._translateService.instant('TRANSLATE.BULK_ONBOARD_RESELLERS_BATCH_STATUS_SET_TO_COMPLETE_CONFIRMATION_MESSAGE');
        let btnOkText = this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK');
        this._notifierService.success({ title: message, icon: 'success', confirmButtonText: btnOkText }).then((result: { isConfirmed: any, isDenied: any }) => {
          if (result.isConfirmed) {
            this.frmProviderDetails.clearValidators();
            this.frmProviderDetails.reset();
            this._router.navigate(['partner/resellers']);
          }
        })
      }
    })
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.frmProviderDetails.reset();
    this.routeSubscription?.unsubscribe();
    localStorage.removeItem("providerIdForOnboard");
    localStorage.removeItem("providerIdForResellerOnboard");
    localStorage.removeItem("providerNameForResellerOnboard");
    this._unsavedChangesService.setUnsavedChanges(false);
  }

}
