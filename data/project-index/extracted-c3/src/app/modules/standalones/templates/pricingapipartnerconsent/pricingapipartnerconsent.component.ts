import { Component, Input, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TranslationModule } from 'src/app/modules/i18n';
import { ProvidersSettingService } from 'src/app/modules/partner/settings/services/providers-setting.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { ClipboardService } from 'ngx-clipboard';
import { Subject, Subscription, takeUntil } from 'rxjs';


@Component({
  selector: 'app-pricingapipartnerconsent',
  standalone: true,
  imports: [TranslationModule],
  templateUrl: './pricingapipartnerconsent.component.html',
  styleUrl: './pricingapipartnerconsent.component.scss'
})
export class PricingapipartnerconsentComponent implements OnDestroy{
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();

  @Input() datasource: any;
  @Input() isTenantConfiguration: boolean = false;

  isBusy: boolean = false;
  hasNewTestSecureModelSuccess: boolean = false;
  value: any;
  data: any;
  IsTenantConfiguration: boolean;

  constructor(
    private providerSettingsService: ProvidersSettingService,
    private notifier: NotifierService,
    private translate: TranslateService,
    private clipboardService: ClipboardService 
  ) {}
  ngOnInit(): void {
    this.data = this.datasource; 
    this.IsTenantConfiguration = this.isTenantConfiguration;
   
  }

  confirmCopy(): void {
    this.clipboardService.copyFromContent(this.data.Value);
    this.notifier.alert({ title: this.translate.instant('TRANSLATE.CPV_CLIPBOARD_SUCCESS_MESSAGE'), icon: 'success' });
  }
  

  testMicrosoftPricingAPIAccess(): void {
    this.isBusy = true;
    const subscription = this.providerSettingsService.testMicrosoftPricingAPIAccess().pipe(takeUntil(this.destroy$)).subscribe(
      (response: any) => {
        this.isBusy = false;
        if (response.Data) {
          this.notifier.alert({ title: this.translate.instant('TRANSLATE.MICROSOFT_PRICING_API_CONSENT_TEST_CONFIRMATION_MESSAGE'), icon: 'success' });
        }
      },
      (error: any) => {
        this.isBusy = false;
        this.notifier.alert({ title: error.data?.ExceptionMessage || this.translate.instant('TRANSLATE.ERROR_MESSAGE_UNABLE_PROCCESS_YOUR_REQUEST'), icon: 'error' });
      }
    );
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

  
}

