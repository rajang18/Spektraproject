import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { PriceListRoutingModule } from './price-list-routing.module';
import { PriceListsComponent } from './price-lists/price-lists.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { Select2Module } from 'ng-select2-component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { NgxSummernoteModule } from 'src/app/shared/directives/summernote/ngx-summernote.module';
import { IgnoreFromDropdownPipe } from 'src/app/shared/pipes/ignore-from-dropdown.pipe';
import { IgnoreFromListPipe } from 'src/app/shared/pipes/ignore-from-list.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { UniqueListPipe } from 'src/app/shared/pipes/unique-list.pipe';
import { TranslationModule } from '../../i18n';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { FileUploadComponent } from '../../standalones/file-upload/file-upload.component';


@NgModule({
  declarations: [
    PriceListsComponent
  ],
  imports: [
    CommonModule,
    PriceListRoutingModule,
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
    IgnoreFromDropdownPipe
  ]
})
export class PriceListModule { }
