import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbDatepicker, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CardDetailsUtilities } from 'src/app/shared/utilities/card-details-utilities';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service'; 
import { PaymentProfileService } from 'src/app/modules/home/profile/services/paymentprofile.service';
import { PaymentBaseComponent } from '../model/payment-base-component';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { catchError, distinctUntilChanged, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-authorize-net',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepicker,
    NgbModule,
    C3CommonModule
  ],
  templateUrl: './authorize-net.component.html',
  styleUrl: './authorize-net.component.scss'
})
export class AuthorizeNetComponent extends PaymentBaseComponent implements  OnInit,OnDestroy {
  private destroy$ = new Subject<void>();

  pageMode = "";
 
  @ViewChild('authorize', { static: false }) iframeElement!: ElementRef<HTMLIFrameElement>;


  paymentFormACH: FormGroup;
  bankAccountTypes: any = ["Checking", "Savings"];
  newPaymentAccount: any = { AccountType: "CreditCard" };
  cardType: string | null = null;
  hostedPageToken: any;
  billingProviderJSEndPointUrl: SafeResourceUrl | undefined;

  @ViewChild('demoCheckoutForm') demoCheckoutForm!: ElementRef<HTMLFormElement>;
  private cardDetailsUtilities: CardDetailsUtilities;

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private renderer: Renderer2,
    private cdRef: ChangeDetectorRef,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    public paymentProfileService: PaymentProfileService,
    private sanitizer: DomSanitizer,
    private toasterService: ToastService,
    private translateService: TranslateService,
    private _unsavedChangesService: UnsavedChangesService,
    public _translateService: TranslateService,
    public notifierService: NotifierService,
  ) {
    super(_translateService,notifierService);
    this.cardDetailsUtilities = new CardDetailsUtilities();

    // Initialize payment form with validators
    this.paymentFormACH = this.fb.group({
      PaymentProfileAlias: ['', Validators.required],
      AccountNumber: ['', Validators.required],
      NameOnCard: ['', Validators.required],
      RoutingNumber: ['', Validators.required],
      AccountType: ['', Validators.required],
    });

  }

  // Angular lifecycle hook that is called after data-bound properties are initialized
  ngOnInit(): void {
    this.hasPermission();
    this.newPaymentAccount.PaymentType = "CreditCard";
    this.getHostedToken();
    window['CommunicationHandler'] = {}; 
    window['CommunicationHandler'].onReceiveCommunication = (argument: any) => {
      this.onReceiveCommunication(argument);
    };
    
  } 

  permissions = {
    HasSaveCustomerPaymentProfile: "Denied"
  };

  // Check if the user has permission to save customer payment profile
  hasPermission() {
    this.permissions.HasSaveCustomerPaymentProfile = this.permissionService.hasPermission(CloudHubConstants.BTN_SAVE_CUTOMER_PAYMENT_PROFILE);
  }

  // Validator function for card number
  cardNumberValidator(control: any): { [key: string]: boolean } | null {
    this.cardType = this.cardDetailsUtilities.getCardType(control.value);
    if (!this.cardType) {
      return { invalidCardType: true };
    }
    return null;
  }

  // Retrieve hosted token for payment processing
  getHostedToken() {
    if (this.customerDetails && this.customerDetails.BillingProviderReferenceID) {
      this.paymentProfileService.geHostedToken(this.customerDetails.BillingProviderReferenceID).pipe(
        takeUntil(this.destroy$),
        tap((result: any) => {
          this.billingProviderJSEndPointUrl = this.sanitizer.bypassSecurityTrustResourceUrl(result?.Data?.JsEndPointUrl);
          this.hostedPageToken = result?.Data?.HostedToken;
          setTimeout(() => {
            const form = this.demoCheckoutForm?.nativeElement;
            if (form) {
              form.submit();
            }
          }, 100);
        }),
        catchError((error: any) => {
          const errorMessage = error?.error?.ErrorMessage;
          const translatedErrorMessage = this.translateService.instant(`TRANSLATE.${errorMessage}`);
          this.toasterService.error(translatedErrorMessage);

          return of(); // Or handle the error as required
        })
      ).subscribe();
    } 
    else {
      this.paymentProfileService.createCustomer(this.customerDetails).pipe(
        takeUntil(this.destroy$),
        tap((result: any) => {
          this.customerDetails.BillingProviderReferenceID = result.BillingProviderReferenceID;
        }),
        switchMap((result: any) =>
          this.paymentProfileService.geHostedToken(this.customerDetails.BillingProviderReferenceID)
        ),
        tap((result: any) => {
          this.billingProviderJSEndPointUrl = this.sanitizer.bypassSecurityTrustResourceUrl(result?.Data?.JsEndPointUrl);
          this.hostedPageToken = result?.Data?.HostedToken;
          setTimeout(() => {
            const form = this.demoCheckoutForm?.nativeElement;
            if (form) {
              form.submit();
            }
          }, 100);
        }),
        catchError((error: any) => {
          const errorMessage = error?.error?.ErrorMessage;
          const translatedErrorMessage = this.translateService.instant(`TRANSLATE.${errorMessage}`);
          this.toasterService.error(translatedErrorMessage);
          return of(); // Or handle the error as required
        })
      ).subscribe();
    }
  }

  // Submit the payment form
  submit(form: FormGroup) {
    this.paymentFormACH.markAllAsTouched();
    if (form == this.paymentFormACH && this.data == 'ACH' && this.paymentFormACH.valid) {
      this.SaveBillingCustomerProfile();
    }
  }

  // Save billing customer profile
  SaveBillingCustomerProfile() {
    
    if (!this.customerDetails?.BillingProviderReferenceID) {
      this.paymentProfileService.createCustomer(this.customerDetails).pipe(
        //takeUntil(this.destroy$)
      ).subscribe(
        {
          next: (result: any) => { 
          this.customerDetails.BillingProviderReferenceID = result.BillingProviderReferenceID;
          this.customerDetails.BillingProviderAddressID = result.BillingProviderAddressID;
          this.customerDetails.PaymentProfileAlias = this.paymentFormACH.get('PaymentProfileAlias').value;
          this.handleCreatePaymentAccount();
        },
        error: (error: { error?: { ErrorMessage?: string } }) => {
          const errorMessage = error?.error?.ErrorMessage;
          const translatedErrorMessage = this.translateService.instant(`TRANSLATE.${errorMessage}`);
          this.toasterService.error(translatedErrorMessage);

        }
      })
    } else {
      this.handleCreatePaymentAccount();
    }
  }

  // Handle creation of payment account
  handleCreatePaymentAccount = () => {
    const {
      AccountNumber,
      AccountType,
      PaymentProfileAlias,
      NameOnCard,
      RoutingNumber,
    } = this.paymentFormACH.value;

    const payload = {
      AccountNumber,
      AccountType,
      NameOnCard,
      PaymentProfileAlias,
      RoutingNumber,
      PaymentType: this.data,
    } 
    this.paymentProfileService.createPaymentAccount(this.customerDetails, payload).subscribe({
      next: (result: { Data: any }) => {
        // Extract relevant data from the result
        const billingProviderReferenceID = this.customerDetails.BillingProviderReferenceID;
        const customerBillingProfile = result?.Data;
        customerBillingProfile.PaymentProfileAlias = this.paymentFormACH.get('PaymentProfileAlias').value;
        // Call the onSubmit function with extracted data
        this.onSubmit({
            BillingProviderReferenceID: billingProviderReferenceID,
            CustomerBillingProfile: customerBillingProfile,
          });
        },
      error: (error: { error?: { ErrorMessage?: string } }) => {
        // Extract error message if available
        const errorMessage = error?.error?.ErrorMessage;
        
        // Translate error message and show toast notification
        const translatedErrorMessage = this.translateService.instant(`TRANSLATE.${errorMessage}`);
        this.toasterService.error(translatedErrorMessage); 
      }
    });


  };
  
 
  onReceiveCommunication(argument) {
    let params = this.parseQueryString(argument.qstr);
    let parentFrame = argument.parent.split('/')[4];
    //console.log(params);
    //console.log(parentFrame);
    //alert(params['height']);
    let $frame = null;
    switch (parentFrame) {
        case "addPayment": $frame = $("#add_payment"); break;
    }

    switch (params['action']) {
        case "resizeWindow":
            break;
        case "successfulSave":
            this.onCancel();
          break;
        case "cancel":
            this.onCancel();
            break;
    }
};

parseQueryString(str) {
  var vars = [];
  var arr = str.split('&');
  var pair;
  for (var i = 0; i < arr.length; i++) {
      pair = arr[i].split('=');
      vars[pair[0]] = unescape(pair[1]);
  }
  return vars;
}


  onDiscard(form){
    this.onCancel();
    form.reset();
    this.newPaymentAccount ={};

}

  // Clean up subscriptions
  ngOnDestroy() {
    this._unsavedChangesService.setUnsavedChanges(false);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
