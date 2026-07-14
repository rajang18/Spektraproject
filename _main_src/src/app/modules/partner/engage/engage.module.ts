import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { EngageRoutingModule } from './engage-routing.module';
import { EngageListComponent } from './components/engage-list/engage-list.component';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { TranslateModule } from '@ngx-translate/core';
import { NgbModalModule, NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { EngageAddComponent } from './components/engage-add/engage-add.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EngageEntitiesComponent } from './components/engage-add/engage-entities/engage-entities.component';
import { PartnerModule } from '../partner.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSummernoteModule } from 'src/app/shared/directives/summernote/ngx-summernote.module';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { DateTimeFilterPipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';



@NgModule({
  declarations: [
    EngageListComponent,
    EngageAddComponent,
    EngageEntitiesComponent,
  ],
  imports: [
    CommonModule,
    EngageRoutingModule,
    C3TableComponent,
    TranslateModule,
    NgbTooltip,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    PartnerModule,
    NgbModalModule,
    NgSelectModule,
    NgxSummernoteModule,
    C3CommonModule,
    DateTimeFilterPipe
],providers:[DateTimeFilterPipe,DatePipe]
})
export class EngageModule { }
