import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute, Params } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { CaptureConsentService } from 'src/app/services/capture-consent.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-microsoft-pricing-api-consent-accepted',
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
  ],
  templateUrl: './microsoft-pricing-api-consent-accepted.component.html',
  styleUrl: './microsoft-pricing-api-consent-accepted.component.scss'
})
export class MicrosoftPricingApiConsentAcceptedComponent implements OnInit {
  _subscription: Subscription;
  environmentDetails: any;
  environmentId: any;
  authCode: any;
  recordId: any;
  intArray: any = [];
  destroy$ = new Subject<void>();
  public _subscriptionArray: Subscription[] = []; 


  constructor(
    private _router: Router,
    private _consentService: CaptureConsentService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _route: ActivatedRoute
  ) {
    const subscription = this._route.params.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => this.environmentDetails = params['environmentId']);
    this.intArray = this.environmentDetails.split("_");
    this.environmentId = this.intArray[0];
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {
    if (this.environmentId !== undefined && this.environmentId !== null && this.environmentId !== '') {
      localStorage.setItem("currentSiteId", this.environmentId);
    }
    let reqBody = {
      AuthCode: this._consentService.getRefreshTokenCode
    };
     const subscription = this._consentService.saveMicrosoftPricingAPIRefreshToken(reqBody).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this._consentService.setRefreshTokenCode = null;
        this._router.navigate(['welcome/microsoftpricingapiconsentcaptured'])
      },
      error: (response: any) => {
        this._toastService.error(response !== null ? (response.ExceptionMessage !== null ? response.ExceptionMessage : response.Message) : this._translateService.instant("TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST"))

      }
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(){
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
