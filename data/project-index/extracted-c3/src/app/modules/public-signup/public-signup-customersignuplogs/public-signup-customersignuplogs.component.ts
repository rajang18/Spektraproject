import { Component, OnInit } from '@angular/core'; 
import { Router } from '@angular/router'; 
import { BehaviorSubject, interval, Subscription, switchMap, takeUntil } from 'rxjs'; 
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service'; 
import { PermissionService } from 'src/app/services/permission.service'; 
import { PublicSignupService } from '../services/public-signup.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import _ from 'lodash';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-public-signup-customersignuplogs',
  templateUrl: './public-signup-customersignuplogs.component.html',
  styleUrl: './public-signup-customersignuplogs.component.scss'
})
export class PublicSignupCustomersignuplogsComponent extends C3BaseComponent implements OnInit {
  environmentId = null;
  signUpBatchId = null;
  internalPlanId = null;
  signupBatchId: any;
  customerSignUpLogs: any;
  readyToComplete: boolean;
  allSuccess: boolean;
  onWarn: boolean;
  onAttestationPending: boolean;
  attestationConsentUrl: string = '';
  oneFailed: boolean = false;
  firtLoad: boolean;
  tempStepOneSuccess: any;
  stepOneSuccess: boolean = false;
  stepOneCount: any;
  stepTwoCount: any;
  stepThreeCount: any;
  stepOneFailed: boolean;
  stepTwoSuccess: boolean = false;
  stepTwoFailed: boolean;
  stepThreeSuccess: boolean = false;
  stepThreeFailed: boolean;
  tempStepOneFailed: any;
  tempStepTwoSuccess: any;
  tempStepTwoFailed: any;
  tempStepThreeSuccess: any;
  tempStepThreeFailed: any;
  customerSignUpStatus: any;
  timerHandleForSignupStatus: Subscription;
  publicSignupSupport:any;
  customerPublicSignUpModel: CustomerPublicSignupModel = new CustomerPublicSignupModel();
  isSignupState:boolean;

  constructor( 
    _appService: AppSettingsService,
    public _permission: PermissionService, 
    public _publicSignUpService: PublicSignupService,
    public _router: Router, 
    public _dynamicTemplateService: DynamicTemplateService, 
    private toasterService: ToastService,
    private translateService: TranslateService,
   
  ) {
    super(_permission, _dynamicTemplateService, _router, _appService); this._publicSignUpService.isPlandetails = false;
    this._publicSignUpService.cartTotal = this._publicSignUpService.cartTotal ? this._publicSignUpService.cartTotal : 0;
    this._publicSignUpService.cartCount = this._publicSignUpService.cartCount ? this._publicSignUpService.cartCount : 0;
    this.signupBatchId = this._publicSignUpService.publicSignupSharedScope.BatchId;
    this.isSignupState = this._router.url.includes('shop');
    this._publicSignUpService.isNotLogScreen = false;
  }

  ngOnInit() { 
    
    if (this._publicSignUpService.publicSignupSharedScope.EnvironmentId !== null && this._publicSignUpService.publicSignupSharedScope.EnvironmentId !== undefined && this._publicSignUpService.publicSignupSharedScope.EnvironmentId !== '') {
      this.environmentId = this._publicSignUpService.publicSignupSharedScope.EnvironmentId;
    }
    else {
      this._router.navigate(['welcome']);
      //$state.go('welcome.signup');
    }
    if (this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== null && this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== undefined && this._publicSignUpService.publicSignupSharedScope.InternalPlanId !== '') {
      this.internalPlanId = this._publicSignUpService.publicSignupSharedScope.InternalPlanId;
    }
    else {
      this._router.navigate(['welcome']);
      //$state.go('welcome.signup');
    }
    if (this._publicSignUpService.publicSignupSharedScope.BatchId !== null && this._publicSignUpService.publicSignupSharedScope.BatchId !== undefined && this._publicSignUpService.publicSignupSharedScope.BatchId !== '') {
      this.signUpBatchId = this._publicSignUpService.publicSignupSharedScope.BatchId;
    }
    else {
      this._router.navigate(['welcome']);
      //$state.go('welcome.signup');
    }
    this.publicSignupSupport = this._publicSignUpService.publicSignupSharedScope.PUBLIC_SIGNUP_SUPPORT;
    this.getCustomerPublicSignUpLogs();
    this.submitRequestForSignup();
    this.stopPollingForCustomerSignUpLogs();
  }

  currentStep$: BehaviorSubject<number> = new BehaviorSubject(1);

  nextStep() {
    const nextStep = this.currentStep$.value + 1;
    this.currentStep$.next(nextStep);
  }


  goToWelocmePage(){
    this._publicSignUpService.cartCount = 0;
    this._publicSignUpService.cartTotal = 0;
    this._publicSignUpService.publicSignupSharedScope.cartProducts = [];
    this._publicSignUpService.searchKeyword = null;
    this._publicSignUpService.CustomerPublicSignUpModel = new CustomerPublicSignupModel();

    this._router.navigate([`signup/${this._publicSignUpService.publicSignupSharedScope.EnvironmentId}/${this._publicSignUpService.publicSignupSharedScope.InternalPlanId}/shop`]);
  }

  getCustomerPublicSignUpLogs() {
    const subscription = this._publicSignUpService.getCustomerPublicSignUpLogs(this.signupBatchId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customerSignUpLogs = response.Data;
      this.readyToComplete = true;
      if (this.customerSignUpLogs.length > 0) {

        this.allSuccess = false;
        this.oneFailed = false;

        this.tempStepOneSuccess = 0;
        this.tempStepOneFailed = 0;
        this.tempStepTwoSuccess = 0;
        this.tempStepTwoFailed = 0;
        this.tempStepThreeSuccess = 0;
        this.tempStepThreeFailed = 0;


        if (this.customerSignUpLogs?.filter(e => e.LogMessage === 'Placing request for Signup')) {
          if(this.customerSignUpLogs?.filter(e => e.Status === 'Processing')){
            this.currentStep$.next(1);

          }
          if(this.customerSignUpLogs?.find(e => e.Status === 'Failed')){
            this.currentStep$.next(1);
            this.stepOneFailed = true;
            this.ClearSetInterval();
          }
          // if (this.firtLoad === false) {

          //   this.stepOneCount += this.customerSignUpLogs?.filter(e => e.Status === 'Processing' && e.LogMessage === 'Placing request for Signup')?.length;
          // }
          // this.tempStepOneSuccess += this.customerSignUpLogs?.filter(e => e.Status === 'Success' && e.LogMessage === 'Placing request for Signup')?.length;
          //this.tempStepOneFailed = this.customerSignUpLogs?.filter(e => e.Status === 'Failed' && e.LogMessage === 'Placing request for Signup')?.length;

        }

        if (this.customerSignUpLogs?.find(e => e.LogMessage === 'Request is taken from queue ' && e.Status === 'Processing')) {
          this.currentStep$.next(1);
          // if (this.firtLoad === false) {
          //   this.stepOneCount += this.customerSignUpLogs?.filter(e => e.Status === 'Processing' && e.LogMessage === 'Request is taken from queue')?.length;
          // }
          // this.tempStepOneSuccess += this.customerSignUpLogs?.filter(e => e.Status === 'Success' && e.LogMessage === 'Request is taken from queue')?.length;
          // this.tempStepOneFailed += this.customerSignUpLogs?.filter(e => e.Status === 'Failed' && e.LogMessage === 'Request is taken from queue')?.length;

        }
        if (this.customerSignUpLogs?.find(e => e.LogMessage === 'Request is taken from queue ' && e.Status === 'Failed')) {
          this.currentStep$.next(1);
          this.stepOneFailed = true;
          this.ClearSetInterval();
        }
        if (this.customerSignUpLogs?.find(e => e.Status === 'Success' && e.LogMessage === 'Request is taken from queue')) {
          this.stepOneSuccess = true;
          if (this.customerSignUpLogs?.find(e => e.LogMessage === 'Creating C3 Customer' && e.Status === 'Processing')) {
            this.nextStep();
          }
          if (this.customerSignUpLogs?.find(e => e.LogMessage === 'Creating C3 Customer' && e.Status === 'Failed')) {
            this.currentStep$.next(2);
            this.stepTwoFailed = true;
            this.ClearSetInterval();
          }
          // if (this.firtLoad === false) {
          //   this.stepOneCount += this.customerSignUpLogs?.filter(e => e.Status === 'Processing' && e.LogMessage === 'Request is taken from queue')?.length;
          // }
          // this.tempStepOneSuccess += this.customerSignUpLogs?.filter(e => e.Status === 'Success' && e.LogMessage === 'Request is taken from queue')?.length;
          // this.tempStepOneFailed += this.customerSignUpLogs?.filter(e => e.Status === 'Failed' && e.LogMessage === 'Request is taken from queue')?.length;

        }
        
        if (this.customerSignUpLogs?.find(e => e.Status === 'Success' && e.LogMessage === 'Creating C3 Customer '  )) {
          if (this.customerSignUpLogs?.find(e => e.LogMessage === 'Creating PC Customer')) {
            this.currentStep$.next(2);
            // if (this.firtLoad === false) {
            //   this.stepTwoCount += this.customerSignUpLogs?.filter(e => e.Status === 'Processing' && e.LogMessage === 'Creating PC Customer')?.length;
            // }
            // this.tempStepTwoSuccess += this.customerSignUpLogs?.filter(e => e.Status === 'Success' && e.LogMessage === 'Creating PC Customer')?.length;
            // this.tempStepTwoFailed += this.customerSignUpLogs?.filter(e => e.Status === 'Failed' && e.LogMessage === 'Creating PC Customer')?.length;
  
          }
          if (this.customerSignUpLogs?.find(e => e.LogMessage === 'Creating PC Customer' && e.Status === 'Failed')) {
            this.currentStep$.next(2);
            this.stepTwoFailed = true;
            this.ClearSetInterval();
          }
        }
        
        if (this.customerSignUpLogs?.find(e => e.Status === 'Success' && e.LogMessage === 'Creating PC Customer')) {
          this.stepTwoSuccess = true;
          if (this.customerSignUpLogs?.find(e => e.LogMessage === 'Processing order for products' && e.Status === 'Processing')) {
            this.nextStep();
            // if (this.firtLoad === false) {
            //   this.stepTwoCount += this.customerSignUpLogs?.filter(e => e.Status === 'Processing' && e.LogMessage === 'Creating PC Customer')?.length;
            // }
            // this.tempStepTwoSuccess += this.customerSignUpLogs?.filter(e => e.Status === 'Success' && e.LogMessage === 'Creating PC Customer')?.length;
            // this.tempStepTwoFailed += this.customerSignUpLogs?.filter(e => e.Status === 'Failed' && e.LogMessage === 'Creating PC Customer')?.length;
  
          }
          if (this.customerSignUpLogs?.find(e => e.LogMessage === 'Processing order for products' && e.Status === 'Failed')) {
            this.currentStep$.next(3);
            this.stepTwoFailed = true;
            this.ClearSetInterval();
          }
        }

        
        if (this.customerSignUpLogs?.find(e => e.Status === 'Success' && e.LogMessage === 'Processing order for products')) {
          this.stepThreeSuccess = true;
          if (this.customerSignUpLogs?.find(e => e.Status === 'Processing' && e.LogMessage === 'Generating Invoice')) {
            this.currentStep$.next(3);
            // if (this.firtLoad === false) {
            //   this.stepThreeCount += this.customerSignUpLogs?.filter(e => e.Status === 'Processing' && e.LogMessage === 'Generating Invoice')?.length;
            // }
            // this.tempStepThreeSuccess += this.customerSignUpLogs?.filter(e => e.Status === 'Success' && e.LogMessage === 'Generating Invoice')?.length;
            // this.tempStepThreeFailed += this.customerSignUpLogs?.filter(e => e.Status === 'Failed' && e.LogMessage === 'Generating Invoice')?.length;
  
          }
          if (this.customerSignUpLogs?.find(e => e.LogMessage === 'Generating Invoice' && e.Status === 'Failed')) {
            this.currentStep$.next(3);
            this.stepThreeFailed = true;
            this.ClearSetInterval();
          }
        }
        
        this.firtLoad = true;
        //if (this.stepOneFailed > 0 || this.stepTwoFailed > 0 || this.stepThreeFailed > 0) {
        //    this.OneFailed = true;
        //}

        //if (this.stepOneSuccess === 2 && this.stepTwoSuccess === 3 && this.stepThreeSuccess === 3) {
        //    this.AllSuccess = true;
        //}

        _.each(this.customerSignUpLogs, (log: any) => {
          if (log.Status !== "Completed") {
            this.readyToComplete = false;
          }
          else {
            this.readyToComplete = true;
          }

          if (log.Status === "Failed") {
            this.oneFailed = true;
          }

          if (log.LogMessage === "Attestation created, customer consent is pending" && log.Status === "ConsentPending") {
            this.onAttestationPending = true;
            this.attestationConsentUrl = log.AttestationConsentUrl;
            this.allSuccess = true;
          }

          if (log.LogMessage === "Signup request has been processed successfully." && log.Status === "Completed") {
            this.allSuccess = true;
          }

          if (log.LogMessage === "Assigning security groups access to customer GDAP" && log.Status === "Completed") {
            this.onWarn = true;
          }
        });
        
        if (!this.readyToComplete) {
          this.pollForCustomerSignUpLogs();
        }
        else {
          this.stopPollingForCustomerSignUpLogs();
        }

      }
      else {
        this.stopPollingForCustomerSignUpLogs();
      }
    })
    this._subscriptionArray.push(subscription);
  }

  getCustomerSignUpStatus() {
    
    const subscription = this._publicSignUpService.getCustomerSignUpStatus(this.signupBatchId, this.environmentId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customerSignUpStatus = response.Data;
    })
    this._subscriptionArray.push(subscription);
  }
//ajmal:todo:need to check
  pollForCustomerSignUpLogs() {
    this.stopPollingForCustomerSignUpLogs();
    if (this.readyToComplete === false) {
      this.timerHandleForSignupStatus = interval(10000).pipe(
        switchMap(() => {
          this.getCustomerPublicSignUpLogs();
          return [];
        })
      ).subscribe();
    }
  }

  stopPollingForCustomerSignUpLogs() {
    if (!!this.timerHandleForSignupStatus) {
      this.ClearSetInterval();
  }
    this.getCustomerSignUpStatus();
  }


  ClearSetInterval() {
    this.timerHandleForSignupStatus?.unsubscribe();
    this.timerHandleForSignupStatus = null;
  }

  ResumePublicSignup() {
    const subscription = this._publicSignUpService.ResumePublicSignup(this.signUpBatchId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toasterService.success(this.translateService.instant('TRANSLATE.PUBLIC_SIGNUP_ATTESTATION_STATUS_SUCCESS_MESSAGE'));
        this.goToWelocmePage();
      },
      error: (err: any) => {
        if (err?.error?.Message) {
          this.toasterService.error(err.error.Message);
        }
      }
    })
    this._subscriptionArray.push(subscription);
  } 

  submitRequestForSignup(){
    
    const subscription = this._publicSignUpService.submitRequestForSignup(this._publicSignUpService.CustomerPublicSignUpModel).pipe(takeUntil(this.destroy$)).subscribe((response: any) =>{
      
      this._publicSignUpService.publicSignupSharedScope.formCart = undefined;
      this._publicSignUpService.publicSignupSharedScope.isExistingMsTenant = undefined;
      this._publicSignUpService.publicSignupSharedScope.frmExistingMsTenant = undefined;
      this._publicSignUpService.publicSignupSharedScope.frmCustomerPublicSignUp = undefined;
      this._publicSignUpService.publicSignupSharedScope.couponCode = undefined;
      
    })
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    this.stopPollingForCustomerSignUpLogs();
    super.ngOnDestroy();
  }

}
class CustomerPublicSignupModel {
  /// <summary>
  /// Model to hold the Customer Details
  /// </summary>
  ProviderName: any | null;
  CompanyName: any | null;
  Email: any | null;
  CustomerCurrencyCode: any | null;
  BatchId: any | null;
  IsCustomerConsentProvided: any | null;
  EnvironmentId: any | null;
  TenantId: any | null;
  DomainName: any | null;
  IsPaymentSkipped: any | null;
  CartItems: any | null;
}
