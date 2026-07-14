import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AzureMarginRoutingModule } from './azure-margin-routing.module';
import { AzureMarginComponent } from './components/azure-margin/azure-margin.component'; 
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationModule } from '../../i18n';
import { NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { PartnerModule } from '../partner.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@NgModule({
  declarations: [
    AzureMarginComponent
  ],
  imports: [
    CommonModule,
    AzureMarginRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    TranslationModule,
    NgbTooltip, 
    NgbModule,
    NgSelectModule,
    C3CommonModule,
    
  ]
})
export class AzureMarginModule { }
