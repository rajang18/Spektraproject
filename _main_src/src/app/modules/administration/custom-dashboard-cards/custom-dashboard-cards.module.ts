import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomDashboardCardsRoutingModule } from './custom-dashboard-cards-routing.module';
import { CustomDashboardCardsComponent } from './custom-dashboard-cards.component';
import { CustomDashboardCardsAssignmentComponent } from '../custom-dashboard-cards-assignment/custom-dashboard-cards-assignment.component';
import { CustomDashboardCardsListComponent } from '../custom-dashboard-cards-list/custom-dashboard-cards-list.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { Select2Module } from 'ng-select2-component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { NgxSummernoteModule } from 'src/app/shared/directives/summernote/ngx-summernote.module';
import { TranslationModule } from '../../i18n';
import { PartnerModule } from '../../partner/partner.module';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { CustomDashboardCardsAddComponent } from '../custom-dashboard-cards-list/custom-dashboard-cards-add/custom-dashboard-cards-add.component';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { CommonNoRecordComponent } from "../../standalones/common-no-record/common-no-record.component";


@NgModule({
  declarations: [
    CustomDashboardCardsComponent,
    CustomDashboardCardsListComponent,
    CustomDashboardCardsAssignmentComponent,
    CustomDashboardCardsAddComponent
  ],
  imports: [
    CommonModule,
    CustomDashboardCardsRoutingModule,
    TranslateModule,
    C3TableComponent,
    FormsModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    TranslationModule,
    PartnerModule,
    NgSelectModule,
    NgbModule,
    NgxSummernoteModule,
    Select2Module,
    C3CommonModule,
    LimitLengthPipe,
    EditColumnComponent,
    CommonNoRecordComponent
]
})
export class CustomDashboardCardsModule { }
