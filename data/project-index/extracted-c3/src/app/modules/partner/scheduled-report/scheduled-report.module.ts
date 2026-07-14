import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScheduledReportRoutingModule } from './scheduled-report-routing.module';
import { ScheduedReportListComponent } from './schedued-report-list/schedued-report-list.component';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { PartnerModule } from '../partner.module';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslationModule } from '../../i18n';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { CustomerImpersonationComponent } from '../../standalones/customer-impersonation/customer-impersonation.component';
import { PartnerRoutingModule } from '../partner-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { DateTimeFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';


@NgModule({
  declarations: [
    ScheduedReportListComponent,
  ],
  imports: [
    CommonModule,
    ScheduledReportRoutingModule,
    C3TableComponent,
    PartnerModule,
    PartnerRoutingModule,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    C3TableComponent,
    NgbDropdownModule,
    EditColumnComponent,
    CustomerImpersonationComponent,
    TranslateModule,
    NgbTooltip,
    DateTimeFilterPipe
]
})
export class ScheduledReportModule { }
