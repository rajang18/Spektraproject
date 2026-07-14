import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { CaptureConsentService } from 'src/app/services/capture-consent.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-quick-books-consent-accepted',
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
  ],
  templateUrl: './quick-books-consent-accepted.component.html',
  styleUrl: './quick-books-consent-accepted.component.scss'
})
export class QuickBooksConsentAcceptedComponent implements OnInit, OnDestroy{
  _subscription: Subscription;
  environmentDetails: any;
  environmentId: any;
  authCode: any;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();

  recordId: any;
  intArray: any = [];
  realmId: any;
  constructor(
    private _router: Router,
    private _consentService: CaptureConsentService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _route: ActivatedRoute
  ) {
    //this.environmentDetails = this._router.getCurrentNavigation()?.extras?.state?.environmentId;
    const subscription = this._route.params.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
      this.environmentDetails = params['environmentId'];
      this.realmId = params['realmId'];
    });
    this._subscriptionArray.push(subscription);
    this.intArray = this.environmentDetails.split("_");
    for (let i = 0; i < this.intArray.length; i++) {
      this.intArray[i] = parseInt(this.intArray[i], 10);
    }
    this.environmentId = this.intArray[0];
  }

  ngOnInit(): void {
    this.savePartnerAuthCode();
  }

  savePartnerAuthCode() {
    if (this.environmentId !== undefined && this.environmentId !== null && this.environmentId !== '') {
      localStorage.setItem("currentSiteId", this.environmentId);
    }
    this.authCode = this._consentService.getRefreshTokenCode;
    this.recordId = this.intArray[1];
    let payload = {
      AuthCode: this.authCode,
      RecordId: this.recordId,
      OrganisationId: this.realmId
    }
    const subscription = this._consentService.savePartnerQuickBooksAuthCode(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this._consentService.setRefreshTokenCode = null;
        this._router.navigate(['welcome/quickbooksconsentcaptured'])
      },
      error: (response: any) => {
        this._toastService.error(response !== null ? (response.ExceptionMessage !== null ? response.ExceptionMessage : response.Message) : this._translateService.instant("TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST"))

      }
    });
    this._subscriptionArray.push(subscription);
  }
 
  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
