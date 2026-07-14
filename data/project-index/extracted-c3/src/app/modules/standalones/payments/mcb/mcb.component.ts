import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { PaymentBaseComponent } from '../model/payment-base-component';
import { NgbDatepicker, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { MCBService } from 'src/app/services/mcb.service'; 
import { DomSanitizer } from '@angular/platform-browser'; 
import { NotifierService } from 'src/app/services/notifier.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { Subscription } from 'rxjs';
import { PaymentProfileService } from 'src/app/modules/home/profile/services/paymentprofile.service';

declare var PaymentSession: any;
@Component({
  selector: 'app-mcb',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule, 
    C3CommonModule
  ],
  templateUrl: './mcb.component.html',
  styleUrl: './mcb.component.scss'
})
export class MCBComponent extends PaymentBaseComponent implements OnDestroy{
  _subscription: Subscription;

  htmlContent:any;
  currentPage:string='MCB';
  isIntervlSet:boolean = false;
  // Define necessary properties
  pendingPayment: any; // You should replace 'any' with the actual type
  CancelMCBPaymentPageTableReload: any;
  merchantId: any;


  constructor(
    private mcbService:MCBService,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    public _translateService: TranslateService,
    public notifierService: NotifierService,
    public _paymentProfileService: PaymentProfileService,
    
  ){
    super(_translateService,notifierService);
  }

  ngOnInit(): void { 
    this.getMCBBillingConfig();
    this.configurePaymentSession();
  }  

getMCBBillingConfig() {
  this._subscription = this._paymentProfileService.getMCBBillingConfig().subscribe((response: any) => {
    const billingConfig = response.Data;
    this.merchantId = billingConfig.MerchantId;
 
    const url = `https://mcb.gateway.mastercard.com/form/version/58/merchant/${this.merchantId}/session.js`;
 
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => {
      if (typeof PaymentSession !== 'undefined') {
        this.configurePaymentSession();
      } else {
        console.error('PaymentSession is not defined even after script load.');
        this.errorDetails('Payment form could not be initialized.');
      }
    };
    script.onerror = () => {
      console.error('Failed to load MCB session.js script');
      this.errorDetails('Error loading MCB payment script.');
    };
 
    document.body.appendChild(script);
  });
}
 
  saveCardDetails(): void {
    PaymentSession.updateSessionFromForm('card')((response: any) => {
      this.handleFormSessionUpdate(response);
    }, 'card');
  }
  
  configurePaymentSession(): void {
    if (self === top) {
      const antiClickjack = document.getElementById('antiClickjack');
      if (antiClickjack) {
        antiClickjack.parentNode.removeChild(antiClickjack);
      }
    } else {
      top.location = self.location;
    }

    PaymentSession.configure({
      fields: {
        card: {
          number: '#card-number',
          securityCode: '#security-code',
          expiryMonth: '#expiry-month',
          expiryYear: '#expiry-year',
          nameOnCard: '#cardholder-name'
        }
      },
      frameEmbeddingMitigation: ['javascript'],
      callbacks: {
        initialized: (response: any) => {
          // HANDLE INITIALIZATION RESPONSE
        },
        formSessionUpdate: (response: any) => {
          // HANDLE RESPONSE FOR UPDATE SESSION
          this.handleFormSessionUpdate(response);
        }
      },
      interaction: {
        displayControl: {
          formatCard: 'EMBOSSED',
          invalidFieldCharacters: 'REJECT'
        }
      }
    });
  }

  handleFormSessionUpdate(response: any): void {
    const scope = this;
    if (response.status) {
      if (response.status === 'ok') {
        //console.log('Session updated with data: ' + response.session.id);
        // Call Angular function
        this.validate3DSToken(response);
        if (response.sourceOfFunds.provided.card.securityCode) {
          //console.log('Security code was provided.');
        }
        if (response.sourceOfFunds.provided.card.scheme === 'MASTERCARD') {
          //console.log('The user entered a Mastercard credit card.');
        }
      } else if (response.status === 'fields_in_error') {
        let errorMessage = '';
        if (response.errors.cardNumber) {
          errorMessage = 'Card number invalid or missing.';
        }
        if (response.errors.expiryYear) {
          errorMessage = 'Expiry year invalid or missing.';
        }
        if (response.errors.expiryMonth) {
          errorMessage = 'Expiry month invalid or missing.';
        }
        if (response.errors.securityCode) {
          errorMessage = 'Security code invalid.';
        }
        scope.errorDetails(errorMessage);
      } else if (response.status === 'request_timeout') { 
        scope.errorDetails('Session update failed with request timeout: ' + response.errors.message);
      } else if (response.status === 'system_error') { 
        scope.errorDetails('Session update failed with system error: ' + response.errors.message);
      }
    } else { 
      scope.errorDetails('Session update failed: ' + response);
      this.handleError('ERROR_SAVING_PAYMENT_ACCOUNT',null);
    }
  }

  validate3DSToken(response: any): void {
    this._subscription = this.mcbService.validate3DSToken(response)
    .subscribe(res=>{
      this.htmlContent = this.trustedMCB(res);

      this.cdRef.detectChanges();
      this.currentPage = "VALIDATE";
      if (this.isIntervlSet === false) {
        this.intervalFunction();
      }
    })
  }

  errorDetails(errorMessage: string): void {
    // Implement the Angular function to handle the error message
  }

  Cancel(): void {
    this.onCancel();
  }

  trustedMCB(value){
   return this.sanitizer.bypassSecurityTrustHtml(value)
  }
 
  // Destroy Interval function
  destroyInterval(): void {
    if (this.CancelMCBPaymentPageTableReload) {
        this.CancelMCBPaymentPageTableReload = null;
    }
  }

  // Define the Interval Function
  intervalFunction(): void {
    this.CancelMCBPaymentPageTableReload = setInterval(() => {
        if (this.pendingPayment !== undefined && this.pendingPayment !== null) {
            this.destroyInterval(); 
        } else {
            this.isIntervlSet = true;
            this.getPendingPaymentProfiles();
        }
    }, 9000);
  }

  getPendingPaymentProfiles() {
    this.mcbService.getPendingPaymentProfiles().subscribe({
      next: (result: any)  => {
        this.pendingPayment = result;
        if (this.pendingPayment !== undefined && this.pendingPayment !== null) {
          this.destroyInterval(); 
        }
      },error: (error: unknown) => {
          this.handleError('ERROR_SAVING_PAYMENT_ACCOUNT',error);
      }
    });
  } 

  ngOnDestroy(){
    this._subscription?.unsubscribe()
    this.destroyInterval();
  }

}


