import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PartnerOffersRoutingModule } from './partner-offers-routing.module';
import { PartnerOffersListingComponent } from './partner-offers-listing/partner-offers-listing.component';
import { TranslationModule } from '../../i18n/translation.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDropdownModule, NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { PartnerOfferDetailsComponent } from './partner-offer-details/partner-offer-details.component';

import { PartnerOffersComponent } from './partner-offers/partner-offers.component';
import { ProvisioningStatusComponent } from './provisioning-status/provisioning-status.component';
import { Select2Module } from 'ng-select2-component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { FileUploadComponent } from "../../standalones/file-upload/file-upload.component";
import { ContactOffersComponent } from './contact-offers/contact-offers.component';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { IgnoreFromListPipe } from 'src/app/shared/pipes/ignore-from-list.pipe';
import { UniqueListPipe } from 'src/app/shared/pipes/unique-list.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { NgxSummernoteModule } from 'src/app/shared/directives/summernote/ngx-summernote.module';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { IgnoreFromDropdownPipe } from 'src/app/shared/pipes/ignore-from-dropdown.pipe';
import { BulkUploadPartnerOffersComponent } from './bulk-upload-of-partner-offer/bulk-upload-partner-offers/bulk-upload-partner-offers.component';
import { ViewHistoryComponentOfBulkUploadOfPartnerOffers } from './bulk-upload-of-partner-offer/bulk-upload-view-history/bulk-upload-view-history.component';
import { FormatforInitialsPipe } from "../../../shared/pipes/format-initial.pipe";
import { ManageSubcategoriesComponent } from './manage-subcategories/manage-subcategories.component';
import { AddSubcategoriesComponent } from './add-subcategories/add-subcategories.component';

@NgModule({
    declarations: [
        PartnerOffersListingComponent,
        PartnerOffersComponent,
        ProvisioningStatusComponent,
        PartnerOfferDetailsComponent,
        ContactOffersComponent,
        BulkUploadPartnerOffersComponent,
        ViewHistoryComponentOfBulkUploadOfPartnerOffers,
        ContactOffersComponent,
        ManageSubcategoriesComponent,
        AddSubcategoriesComponent
    ],
    imports: [
        CommonModule,
        PermissionDirective,
        PartnerOffersRoutingModule,
        TranslationModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        C3TableComponent,
        NgSelectModule,
        NgbDropdownModule,
        //NgSelect2Module,
        Select2Module,
        SweetAlert2Module,
        EditColumnComponent,
        FileUploadComponent,
        NgbModule,
        IgnoreFromListPipe,
        UniqueListPipe,
        LimitLengthPipe,
        NgbTooltip,
        C3CommonModule,
        NgxSummernoteModule,
        CurrencyPipe,
        IgnoreFromDropdownPipe,
        FormatforInitialsPipe
    ],
    exports: [ManageSubcategoriesComponent]
})
export class PartnerOffersModule { }

export class trailDays {
    Days: number;
    TrialPeriodKey: string;
}
