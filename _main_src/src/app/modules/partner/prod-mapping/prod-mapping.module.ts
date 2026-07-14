import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProdMappingRoutingModule } from './prod-mapping-routing.module';
import { RefreshpurchaseproductmappingComponent } from './refreshpurchaseproductmapping/refreshpurchaseproductmapping.component';
import { TranslationModule } from '../../i18n';
import { PartnerModule } from '../partner.module';
import { ProdMappingComponent } from './prod-mapping/prod-mapping.component'; 
import { TranslateModule } from '@ngx-translate/core';
import { PurchasedproductmappingComponent } from './purchasedproductmapping/purchasedproductmapping.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EntitymappingComponent } from './entitymapping/entitymapping.component';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { ProductmappingComponent } from './productmapping/productmapping.component';
import { ThirdpartysubscriptionmappingComponent } from './thirdpartysubscriptionmapping/thirdpartysubscriptionmapping.component';
import { BulkpurchasedproductmappingComponent } from './bulkpurchasedproductmapping/bulkpurchasedproductmapping.component';
import { BulkProductMappingComponent } from './bulk-product-mapping/bulk-product-mapping.component'; 
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { MinutesToTimepassedPipe } from 'src/app/shared/pipes/minutes-to-timepassed.pipe';


@NgModule({
  declarations: [
    ProdMappingComponent,
    RefreshpurchaseproductmappingComponent,
    PurchasedproductmappingComponent,
    EntitymappingComponent,
    ProductmappingComponent,
    ThirdpartysubscriptionmappingComponent,
    BulkpurchasedproductmappingComponent,
    BulkProductMappingComponent
  ],
  imports: [
    CommonModule,
    PartnerModule,
    TranslationModule,
    TranslateModule,
    NgbModule,
    ProdMappingRoutingModule,
    ReactiveFormsModule,
    C3TableComponent,
    FormsModule,
    NgSelectModule,
    C3CommonModule,
    MinutesToTimepassedPipe
  ],
  providers:[]
})
export class ProdMappingModule { }
