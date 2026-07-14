import { Component } from '@angular/core';
import { PublicSignUpCartBaseComponent } from '../../../models/public-sign-up-cart-base.component';
import { CommonModule } from '@angular/common';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { NotifierService } from 'src/app/services/notifier.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@Component({
  selector: 'app-contract',
  standalone: true,
  imports: [
    CommonModule,
    NgbTooltipModule,
    NgbModule,
    TranslateModule,
    C3CommonModule,
    FormsModule,
    FormatforInitialsPipe,
  ],
  templateUrl: './contract.component.html',
  styleUrl: './contract.component.scss'
})
export class PublicSignUpCartContractComponent extends PublicSignUpCartBaseComponent{
  constructor(
    public _notifierService: NotifierService,
    public _appService: AppSettingsService,
    public _translateService: TranslateService
  ) {
    super(_notifierService, _appService, _translateService);
  }
}
