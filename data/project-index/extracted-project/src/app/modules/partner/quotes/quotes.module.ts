import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { EditColumnComponent } from "../../standalones/c3-table/edit-column/edit-column.component";
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbCollapseModule, NgbDatepickerModule, NgbDropdownModule, NgbModule, NgbOffcanvasModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslationModule } from '../../i18n/translation.module';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { Select2Module } from 'ng-select2-component';
import { QuoteDetailsComponent } from './quote-details/quote-details.component';
import { QuoteListComponent } from './quote-list/quote-list.component';
import { RouterModule } from '@angular/router';
import { QuotesRoutingModule } from './quotes-routing.module';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';

@NgModule({
  declarations: [
    
    QuoteListComponent,
    QuoteDetailsComponent,
    QuoteCustomLineItemComponent,
    QuoteLineItemPopUpComponent,
    QuoteAddnewcustomerComponent,
    QuotePDFViewComponent,
    QuoteReviewComponent,
    EmailTemplateComponent,
   
  ],
  imports: [
    CommonModule,
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
    QuotesRoutingModule,
    RouterModule,
    LimitLengthPipe,
    CurrencyPipe,
    NgbCollapseModule,
    NgbOffcanvasModule,
    PermissionDirective,
    NgSelectModule,
    NgbDatepickerModule,
    NgxSummernoteModule,
    InfiniteScrollModule,   
    C3CommonModule,
    CommonNoRecordComponent
  ],
  providers:[QuoteService]
})
export class QuotesModule { }
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { NgxSummernoteModule } from 'src/app/shared/directives/summernote/ngx-summernote.module';
import { QuoteAddnewcustomerComponent } from './quote-addnewcustomer/quote-addnewcustomer.component';
import { QuoteCustomLineItemComponent } from './quote-custom-line-item/quote-custom-line-item.component';
import { QuoteLineItemPopUpComponent } from './quote-line-item-pop-up/quote-line-item-pop-up.component';
import { QuotePDFViewComponent } from './quote-pdf-view/quote-pdf-view.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { QuoteReviewComponent } from './quote-review/quote-review.component';
import { EmailTemplateComponent } from './email-template/email-template.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { QuoteService } from './quotes.service';
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';

