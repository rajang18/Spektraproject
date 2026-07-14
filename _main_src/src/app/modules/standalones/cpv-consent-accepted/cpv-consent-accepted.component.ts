import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute, Params } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { CaptureConsentService } from 'src/app/services/capture-consent.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-cpv-consent-accepted',
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
  ],
  templateUrl: './cpv-consent-accepted.component.html',
  styleUrl: './cpv-consent-accepted.component.scss'
})
export class CpvConsentAcceptedComponent implements OnInit{
  _subscription: Subscription;
  environmentDetails: any;
  environmentId: any;
  authCode: any;
  recordId: any;
  intArray: any = [];
  destroy$ = new Subject<void>();

  constructor(
    private _router: Router,
    private _consentService: CaptureConsentService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _route: ActivatedRoute
  ) {
    //this.environmentDetails = this._router.getCurrentNavigation()?.extras?.state?.environmentId;
    this._subscription = this._route.params.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => this.environmentId = params['environmentId']);
  }

  ngOnInit(): void {
    if (this.environmentId !== undefined && this.environmentId !== null && this.environmentId !== '') {
      localStorage.setItem("currentSiteId", this.environmentId);
    }
    let reqBody = {
      AuthCode: this._consentService.getRefreshTokenCode
    };
    this._subscription = this._consentService.saveCpvConsentAccepted(reqBody).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this._consentService.setRefreshTokenCode = null;
        this._router.navigate(['welcome/cpvconsentcaptured'])
      },
      error: (response: any) => {
        this._toastService.error(response !== null ? (response.ExceptionMessage !== null ? response.ExceptionMessage : response.Message) : this._translateService.instant("TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST"))

      }
    });
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
