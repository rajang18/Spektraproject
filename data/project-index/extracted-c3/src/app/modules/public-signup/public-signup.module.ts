import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationModule } from '../i18n/translation.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { C3TableComponent } from '../standalones/c3-table/c3-table.component';
import { NgbAlertModule, NgbDropdownModule, NgbModal, NgbModule, NgbProgressbarModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { EditColumnComponent } from '../standalones/c3-table/edit-column/edit-column.component';
import { CustomerImpersonationComponent } from '../standalones/customer-impersonation/customer-impersonation.component';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { NgSelectModule } from '@ng-select/ng-select';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { MegaNumberPipe } from 'src/app/shared/pipes/meganumber.pipe';
import { PublicSignupRoutingModule } from './public-signup-routing.module';
import { PublicSignupCreatecustomerComponent } from './public-signup-createcustomer/public-signup-createcustomer.component';
import { PublicSignupCartComponent } from './public-signup-cart/public-signup-cart.component';
import { PublicSignupWizardComponent } from './public-signup-wizard/public-signup-wizard.component';
import { PublicSignupShopComponent } from './public-signup-shop/public-signup-shop.component';
import { ProductItemComponent } from '../standalones/products/product-item/product-item.component';
import { FormatforInitialsPipe } from 'src/app/shared/pipes/format-initial.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { PublicSignupCustomersignuplogsComponent } from './public-signup-customersignuplogs/public-signup-customersignuplogs.component';
import { StripHtmlPipe } from 'src/app/shared/pipes/strip-html.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { CommonNoRecordComponent } from '../standalones/common-no-record/common-no-record.component';
import { InlineSVGModule } from 'ng-inline-svg-2';

@NgModule({
  declarations: [
    PublicSignupCreatecustomerComponent,
    PublicSignupCartComponent,
    PublicSignupWizardComponent,
    PublicSignupShopComponent,
    PublicSignupCustomersignuplogsComponent,
    StripHtmlPipe
  ],
  imports: [
    FormatforInitialsPipe,
    LimitLengthPipe,
    CommonModule,
    TranslationModule,
    PublicSignupRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    C3TableComponent,
    NgbDropdownModule,
    EditColumnComponent,
    CustomerImpersonationComponent,
    PermissionDirective,
    CurrencyPipe,
    NgbModule,
    ProductItemComponent,
    InfiniteScrollModule,
    MegaNumberPipe,
    NgbAlertModule,
    NgSelectModule,
    C3CommonModule,
    CommonNoRecordComponent,
    InlineSVGModule,
    NgbProgressbarModule,
    NgbTooltipModule
  ],
  exports:[
    PermissionDirective
  ]
})
export class PublicSignupModule { }
