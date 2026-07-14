import { Component, Input, OnDestroy } from '@angular/core';
import { TranslationModule } from 'src/app/modules/i18n';
import { ProvidersSettingService } from 'src/app/modules/partner/settings/services/providers-setting.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { ClipboardService } from 'ngx-clipboard';
import { Subject, Subscription, takeUntil } from 'rxjs';


@Component({
  selector: 'app-cpvpartnerconsent',
  standalone: true,
  imports: [TranslationModule],
  templateUrl: './cpvpartnerconsent.component.html',
  styleUrls: ['./cpvpartnerconsent.component.scss']
})
export class CpvpartnerconsentComponent implements OnDestroy{
  _subscription: Subscription;
  @Input() datasource: any;
  @Input() isTenantConfiguration: boolean = false;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();

  isBusy: boolean = false;
  hasNewTestSecureModelSuccess: boolean ;
  data:any
  IsTenantConfiguration:boolean;

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
 

  testPartnerAccess(): void {
    this.isBusy = true;
    const subscription = this.providerSettingsService.testPartnerAccess().pipe(takeUntil(this.destroy$)).subscribe(
      (response: any) => {
        this.isBusy = false;
        if (response.Data) {
          this.hasNewTestSecureModelSuccess = true;
          this.notifier.alert({ title: this.translate.instant('TRANSLATE.CPV_PC_TEST_CONFIRMATION_MESSAGE'), icon: 'success' });
         
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
