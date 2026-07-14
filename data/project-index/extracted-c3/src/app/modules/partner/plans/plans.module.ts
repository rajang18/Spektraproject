import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

import { PlansRoutingModule } from './plans-routing.module';
import { PlansListingComponent } from './components/plans-listing/plans-listing.component';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { EditColumnComponent } from "../../standalones/c3-table/edit-column/edit-column.component";
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {PlanProductsSeatLimit} from '../plans/planproductseatlimits/planproductseatlimits.component'
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from '../../i18n/translation.module';
import { PlanDetailsComponent } from './components/plan-details/PlanDetailsComponent';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { PlanProductCurrencyConversionComponent } from './components/plan-product-currency-conversion/plan-product-currency-conversion.component'; 
import { NgSelectModule } from '@ng-select/ng-select';
import { Select2Module } from 'ng-select2-component'; 
import { PlanUpdateProgressComponent } from './components/plan-update-progress/plan-update-progress.component';
import { PartnerModule } from '../partner.module';
import { ProductCatalogueComponent } from './components/product-catalogue/product-catalogue.component';  
import { CurrencyConversionComponent } from './components/currency-conversion/currency-conversion.component';
import { CurrencyConversionListComponent } from './components/currency-conversion/currency-conversion-list/currency-conversion-list.component';
import { TranslateModule } from '@ngx-translate/core';
import { ViewOffersComponent } from './components/view-offers/view-offers.component';
import { AddProductsComponent } from './components/add-products/add-products.component';
import { ProductItemComponent } from '../../standalones/products/product-item/product-item.component';
import { ContractComponent } from './components/view-offers/contract/contract.component';
import { UsageComponent } from './components/view-offers/usage/usage.component';
import { QuantityComponent } from './components/view-offers/quantity/quantity.component';
import { AddPlanPriceChangeComponent } from '../../standalones/add-plan-price-change/add-plan-price-change.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { InfiniteScrollModule } from "ngx-infinite-scroll";
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';

 

@NgModule({
    declarations: [
        PlansListingComponent,
        PlanDetailsComponent,
        PlanProductCurrencyConversionComponent, 
        PlanUpdateProgressComponent,
        ProductCatalogueComponent,
        CurrencyConversionComponent,
        CurrencyConversionListComponent,
        PlanProductsSeatLimit,
        ViewOffersComponent,
        AddProductsComponent,
        ContractComponent,
        UsageComponent,
        QuantityComponent
    ],
    imports: [
        CommonModule,
        PlansRoutingModule,
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
        PartnerModule,
        DecimalPipe,
        TranslateModule,
        ProductItemComponent,
        NgbModule,
        AddPlanPriceChangeComponent,
        C3CommonModule,
        InfiniteScrollModule,
        CommonNoRecordComponent
    ]
})
export class PlansModule { }
