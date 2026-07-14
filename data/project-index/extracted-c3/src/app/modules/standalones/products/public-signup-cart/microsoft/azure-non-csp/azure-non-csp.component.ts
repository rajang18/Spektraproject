import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PublicSignUpCartBaseComponent } from '../../../models/public-sign-up-cart-base.component';
import { CommonModule } from '@angular/common';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FormsModule } from '@angular/forms';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { NotifierService } from 'src/app/services/notifier.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CartLinkedSubscriptionComponent } from "../../templates/cart-linked-subscription/cart-linked-subscription.component";
import { PartnerModule } from 'src/app/modules/partner/partner.module';


@Component({
  selector: 'app-azure-non-csp',
  standalone: true,
  imports: [CommonModule,
    NgbTooltipModule,
    NgbModule,
    TranslateModule,
    CurrencyPipe,
    PartnerModule,
    FormsModule,
    FormatforInitialsPipe,
    CartLinkedSubscriptionComponent],
  templateUrl: './azure-non-csp.component.html',
  styleUrl: './azure-non-csp.component.scss'
})
export class PublicSignUpCartAzureNonCspComponent  extends PublicSignUpCartBaseComponent{
  constructor(private cdRef: ChangeDetectorRef,
    public _notifierService: NotifierService,
    public _appService: AppSettingsService,
    public _translateService: TranslateService
  ) {
    super(_notifierService, _appService, _translateService);
  }
}
