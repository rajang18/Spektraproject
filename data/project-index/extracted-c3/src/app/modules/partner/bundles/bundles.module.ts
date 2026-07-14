import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BundlesRoutingModule } from './bundles-routing.module';
import { BundlesListingComponent } from './bundles-listing/bundles-listing.component';
import { TranslationModule } from '../../i18n/translation.module';
import { TranslateModule} from '@ngx-translate/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { AddBundleComponent } from './add-bundle/add-bundle.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { UniqueListPipe } from 'src/app/shared/pipes/unique-list.pipe';
import { IgnoreFromListPipe } from 'src/app/shared/pipes/ignore-from-list.pipe';
import {  Select2Module } from 'ng-select2-component';
import { ReviewOffersComponent } from './review-offers/review-offers.component';
import { ProductItemComponent } from '../../standalones/products/product-item/product-item.component';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';






@NgModule({
  declarations: [
    BundlesListingComponent,
    AddBundleComponent
  ],
  imports: [
    CommonModule,
    BundlesRoutingModule,
    TranslateModule,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    C3TableComponent,
    NgbDropdownModule,
    EditColumnComponent,
    SweetAlert2Module,
    NgbModule,
    NgSelectModule,
    UniqueListPipe,
    IgnoreFromListPipe,
    CurrencyPipe,
    Select2Module,
    TranslateModule,
    ReviewOffersComponent,
    ProductItemComponent,
    PermissionDirective,
    InfiniteScrollDirective,
    C3CommonModule,
    CommonNoRecordComponent
  ]
})
export class BundlesModule { }
