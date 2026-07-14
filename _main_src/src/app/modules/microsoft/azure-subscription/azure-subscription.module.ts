import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AzureSubscriptionRoutingModule } from './azure-subscription-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MicrosoftAzureSubscriptionComponent } from './microsoft-azure-subscription/microsoft-azure-subscription.component';
import { NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';


@NgModule({
  declarations: [
    MicrosoftAzureSubscriptionComponent
  ],
  imports: [
    CommonModule,
    AzureSubscriptionRoutingModule,
    FormsModule,
    TranslateModule,
    NgbTooltip,
    C3TableComponent,
    ReactiveFormsModule,
    NgbModule,
    NgSelectModule,
    CurrencyPipe
  ]
})
export class AzureSubscriptionModule { }
