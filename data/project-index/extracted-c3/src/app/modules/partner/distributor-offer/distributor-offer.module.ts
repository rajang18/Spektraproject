import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DistributorOfferRoutingModule } from './distributor-offer-routing.module';
import { DistributorOfferListingComponent } from './distributor-offer-listing/distributor-offer-listing.component';
import { DistributorOfferAddComponent } from './distributor-offer-add/distributor-offer-add.component';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { EditColumnComponent } from "../../standalones/c3-table/edit-column/edit-column.component";
import { PartnerModule } from '../partner.module';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbTooltip, NgbModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { Select2Module } from 'ng-select2-component';
import { TranslationModule } from '../../i18n';
import { FileUploadComponent } from '../../standalones/file-upload/file-upload.component';
import { PartnerOffersRoutingModule } from '../partner-offers/partner-offers-routing.module';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { PartnerOffersModule } from '../partner-offers/partner-offers.module';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { QuotesModule } from '../quotes/quotes.module';
import { PowerBIEmbedModule } from 'powerbi-client-angular';
import { OrderByPipe } from 'src/app/shared/pipes/order-by.pipe';


@NgModule({
  declarations: [
    DistributorOfferListingComponent,
    DistributorOfferAddComponent
  ],
  imports: [
    CommonModule,
    DistributorOfferRoutingModule,
    C3TableComponent,
    EditColumnComponent,
    PartnerModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbTooltip,
    PartnerModule,
    NgSelectModule,
    NgbModule,
    CurrencyPipe,
    QuotesModule,
    PowerBIEmbedModule,
    OrderByPipe,
    PartnerOffersRoutingModule,
    TranslationModule,
    NgbDropdownModule,
    //NgSelect2Module,
    Select2Module,
    SweetAlert2Module,
    FileUploadComponent,
    C3CommonModule,
    PartnerOffersModule
],
})
export class DistributorOfferModule { }
