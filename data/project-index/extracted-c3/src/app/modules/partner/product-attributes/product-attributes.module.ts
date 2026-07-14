import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductAttributesRoutingModule } from './product-attributes-routing.module';
import { ProductAttributeListComponent } from './components/product-attribute-list/product-attribute-list.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { Select2Module } from 'ng-select2-component';
import { TranslationModule } from '../../i18n';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';
import { PartnerModule } from '../partner.module';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@NgModule({
  declarations: [
    ProductAttributeListComponent
  ],
  imports: [
    CommonModule,
    ProductAttributesRoutingModule,
    C3TableComponent,
    EditColumnComponent,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbDropdownModule,
    SweetAlert2Module,
    NgSelectModule,
    NgbModule,
    Select2Module,
    C3CommonModule
  ]
})
export class ProductAttributesModule { }
