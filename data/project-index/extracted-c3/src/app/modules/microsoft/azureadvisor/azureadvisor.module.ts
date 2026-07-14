import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { AzureadvisorComponent } from './azureadvisor.component';
import { AzureAdvisorRoutingModule } from './azureadvisor-routing.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    declarations: [
      AzureadvisorComponent,
    ],
    imports: [
      CommonModule,
      FormsModule,
      TranslateModule,
      C3TableComponent,
      EditColumnComponent,
      NgSelectModule,
      AzureAdvisorRoutingModule,
      NgApexchartsModule,
      NgbDropdownModule,
      NgbModule
    ]
  })
  export class AzureAdvisorModule { }