import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRelationshipsRoutingModule } from './admin-relationships-routing.module';
import { AdminRelationshipsListingComponent } from './component/admin-relationships-listing/admin-relationships-listing.component';
import { AddAdminRelatioshipsComponent } from './component/add-admin-relatioships/add-admin-relatioships.component';
import { PartnerModule } from '../../partner/partner.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { AdminRelationshipsDetailsComponent } from './component/admin-relationships-details/admin-relationships-details.component';
import { LimitLengthPipe } from "../../../shared/pipes/limitLength.pipe";
import { ClipboardModule } from '@angular/cdk/clipboard';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@NgModule({
  declarations: [
    AdminRelationshipsListingComponent,
    AddAdminRelatioshipsComponent,
    AdminRelationshipsDetailsComponent
  ],
  imports: [
    CommonModule,
    AdminRelationshipsRoutingModule,
    PartnerModule,
    TranslateModule,
    NgSelectModule,
    FormsModule,
    NgbTooltipModule,
    C3TableComponent,
    ReactiveFormsModule,
    C3CommonModule,
    LimitLengthPipe,
    ClipboardModule,
    InfiniteScrollModule,
    
  ],
  schemas: [NO_ERRORS_SCHEMA, 
            CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class AdminRelationshipsModule { }
