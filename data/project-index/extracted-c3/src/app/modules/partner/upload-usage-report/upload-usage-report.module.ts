import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { EditColumnComponent } from "../../standalones/c3-table/edit-column/edit-column.component";
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from '../../i18n/translation.module';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { Select2Module } from 'ng-select2-component';
import { PartnerModule } from '../partner.module';
import { UploadUsageReportRoutingModule } from './upload-usage-report-routing.module';
import { UploadUsageReportListingComponent } from './components/upload-usage-report-listing/upload-usage-report-listing.component';
import { UploadUsageReportHistoryListingComponent } from './components/upload-usage-report-listing/upload-usage-report-history-listing/upload-usage-report-history-listing.component';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { ShowSelectedFirstPeriodPipe } from "../../../shared/pipes/showSelectedPerid.pipe";
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { ClickOutSideDirective } from 'src/app/shared/directives/click-out-side.directive';
@NgModule({
    declarations: [
        UploadUsageReportListingComponent,
        UploadUsageReportHistoryListingComponent
    ],
    imports: [
    CommonModule,
    UploadUsageReportRoutingModule,
    C3TableComponent,
    EditColumnComponent,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbDropdownModule,
    SweetAlert2Module,
    NgSelectModule,
    NgbModule,
    Select2Module,
    PartnerModule,
    CurrencyPipe,
    ShowSelectedFirstPeriodPipe,
    C3CommonModule,
    ClickOutSideDirective
]
})
export class UploadUsageReportModule { }
