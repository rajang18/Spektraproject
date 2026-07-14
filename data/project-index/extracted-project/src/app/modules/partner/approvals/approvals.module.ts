import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApprovalsRoutingModule } from './approvals-routing.module';
import { ApprovalsListingComponent } from './approvals-listing/approvals-listing.component';


import { TranslationModule } from '../../i18n/translation.module';
import { TranslateModule } from '@ngx-translate/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ProductItemInPurchaseRequestComponent } from '../../standalones/products/purchaserequests/product-item-in-purchase-request/product-item-in-purchase-request.component';
import { RouterModule } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';

@NgModule({
  declarations: [
    ApprovalsListingComponent
  ],
  imports: [
    CommonModule,
    ApprovalsRoutingModule,
    ProductItemInPurchaseRequestComponent,
    TranslateModule,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    C3TableComponent,
    NgbDropdownModule,
    EditColumnComponent,
    InfiniteScrollModule,
    NgbTooltipModule,   
    RouterModule,
    CommonNoRecordComponent,
    C3CommonModule
  ]
})
export class ApprovalsModule { }
