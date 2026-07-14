import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdministrationRoutingModule } from './administration-routing.module';
import { CustomNotificationsComponent } from './custom-notifications/custom-notifications.component';
import { WebhookNotificationsComponent } from './webhook-notifications/webhook-notifications.component';
import { AdministrationComponent } from './administration/administration.component';
import { TranslateModule } from '@ngx-translate/core';
import { C3TableComponent } from '../standalones/c3-table/c3-table.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'; 
import { TranslationModule } from '../i18n/translation.module';
import { PartnerModule } from '../partner/partner.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { CustomNotificationAddComponent } from './custom-notifications/custom-notification-add/custom-notification-add.component';
import { TaggedEntitiesDetailsComponent } from './custom-notifications/custom-notification-add/tagged-entities-details/tagged-entities-details.component';
import { AddCustomRowComponent } from './custom-notifications/custom-notification-add/add-custom-row/add-custom-row.component';
import { NgxSummernoteModule } from 'src/app/shared/directives/summernote/ngx-summernote.module';
import { Select2Module } from 'ng-select2-component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { LimitLengthWithoutDotPipe } from 'src/app/shared/pipes/limitLentgthWithoutDot.pipe';
import { CommonNoRecordComponent } from '../standalones/common-no-record/common-no-record.component';


@NgModule({
  declarations: [
    AdministrationComponent,
    CustomNotificationsComponent,
    WebhookNotificationsComponent,
    CustomNotificationAddComponent,
    CustomNotificationAddComponent,
    TaggedEntitiesDetailsComponent,
    AddCustomRowComponent,
  ],
  imports: [
    CommonModule,
    AdministrationRoutingModule,
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
    LimitLengthWithoutDotPipe,
    CommonNoRecordComponent
],
providers: [
  DatePipe
]

})
export class AdministrationModule { }
