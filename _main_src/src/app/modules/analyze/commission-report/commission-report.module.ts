import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommissionReportComponent } from './components/commission-report/commission-report.component';
import { SimpleCommissionReportComponent } from './components/simple-commission-report/simple-commission-report.component';
import { EarningReportComponent } from './components/earning-report/earning-report.component';
import { CommissionReportRoutingModule } from './commission-report-routing.module';
import { TranslationModule } from '../../i18n';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component'; 
import { PartnerModule } from '../../partner/partner.module';
import { FormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { ShowSelectedFirstPeriodPipe } from "../../../shared/pipes/showSelectedPerid.pipe";
import { ClickOutSideDirective } from 'src/app/shared/directives/click-out-side.directive';
@NgModule({
  declarations: [
    CommissionReportComponent,
    SimpleCommissionReportComponent,
    EarningReportComponent
  ],
  imports: [
    CommonModule,
    CommissionReportRoutingModule,
    TranslationModule,
    C3TableComponent,
    PartnerModule,
    FormsModule,
    NgbTooltip,
    NgSelectModule,
    C3CommonModule,
    CurrencyPipe,
    ClickOutSideDirective,
    ShowSelectedFirstPeriodPipe
]
})
export class CommissionReportModule { }
