import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { StatCardComponent } from '../standalones/cards/stat-card/stat-card.component';
import { TranslateModule } from '@ngx-translate/core';
import { StatWithGraphCardComponent } from '../standalones/cards/stat-with-graph-card/stat-with-graph-card.component';
import { ProfabilityCardComponent } from '../standalones/cards/profability-card/profability-card.component';
import { PurchaseOfSeatsCardComponent } from '../standalones/cards/purchase-of-seats-card/purchase-of-seats-card.component';
import { NgbDatepickerModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TermsAndConditionsComponent } from './terms-and-conditions/terms-and-conditions.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    TermsAndConditionsComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    StatCardComponent,
    TranslateModule,
    StatWithGraphCardComponent,
    ProfabilityCardComponent,
    PurchaseOfSeatsCardComponent,
    NgbDatepickerModule,
    NgbModule,
    FormsModule
  ]
})
export class HomeModule { }
