import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BannerNotificationRoutingModule } from './banner-notification-routing.module';
import { BannerNotificationListComponent } from './components/banner-notification-list/banner-notification-list.component';
import { BannerNotificationAddComponent } from './components/banner-notification-add/banner-notification-add.component';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { EntityListComponent } from './components/banner-notification-list/entity-list/entity-list.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EntitiesPopupComponent } from './components/banner-notification-add/entities-popup/entities-popup.component';
import { PartnerModule } from '../partner.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSummernoteModule } from 'src/app/shared/directives/summernote/ngx-summernote.module';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@NgModule({
  declarations: [
    BannerNotificationListComponent,
    BannerNotificationAddComponent,
    EntityListComponent,
    EntitiesPopupComponent
  ],
  imports: [
    CommonModule,
    BannerNotificationRoutingModule,
    C3TableComponent,
    NgbModule,
    NgbTooltip,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    PartnerModule,
    NgSelectModule,
    NgxSummernoteModule,
    C3CommonModule
]
})
export class BannerNotificationModule { }
