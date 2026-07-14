import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

import { ScheduledReportRecipientRoutingModule } from './scheduled-report-recipient-routing.module';
import { ScheduedReportRecipientListComponent } from './components/schedued-report-recipient-list/schedued-report-recipient-list.component';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { NgbDatepickerModule, NgbDropdownModule, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Select2Module } from 'ng-select2-component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomInputComponent } from '../../standalones/c3-inputs/custom-input/custom-input.component';
import { PartnerModule } from '../partner.module';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ConvertCommaSeparatedStringToListPipe } from 'src/app/shared/pipes/convert-comma-separated-string-to-list.pipe';
import { TranslationModule } from '../../i18n';
import { CustomCheckboxComponent } from '../../standalones/c3-inputs/custom-checkbox/custom-checkbox.component';
import { CustomSelectComponent } from '../../standalones/c3-inputs/custom-select/custom-select.component';
import { CpvpartnerconsentComponent } from '../../standalones/templates/cpvpartnerconsent/cpvpartnerconsent.component';
import { PricingapipartnerconsentComponent } from '../../standalones/templates/pricingapipartnerconsent/pricingapipartnerconsent.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { ScheduledReportHistoryComponent } from './components/schedued-report-recipient-list/scheduled-report-history/scheduled-report-history.component';
import { AddScheduledReportRecipientComponent } from './components/schedued-report-recipient-list/add-scheduled-report-recipient/add-scheduled-report-recipient.component';
import { OrderByPipe } from "../../../shared/pipes/order-by.pipe";
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@NgModule({
  declarations: [
    ScheduedReportRecipientListComponent,
    ScheduledReportHistoryComponent,
    AddScheduledReportRecipientComponent,
  ],
  imports: [
    CommonModule,
    ScheduledReportRecipientRoutingModule,
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    CustomInputComponent,
    CustomCheckboxComponent,
    CustomSelectComponent,
    TranslationModule,
    EditorModule,
    CpvpartnerconsentComponent,
    PricingapipartnerconsentComponent,
    PartnerModule,
    NgSelectModule,
    HttpClientModule,
    NgbModule,
    NgbDropdownModule,
    C3TableComponent,
    NgbTooltipModule,
    NgbDatepickerModule,
    ConvertCommaSeparatedStringToListPipe,
    Select2Module,
    CommonModule,
    EditColumnComponent,
    SweetAlert2Module,
    DecimalPipe,
    TranslateModule,
    RouterModule,
    OrderByPipe,
    C3CommonModule,
   
]
})
export class ScheduledReportRecipientModule { }
