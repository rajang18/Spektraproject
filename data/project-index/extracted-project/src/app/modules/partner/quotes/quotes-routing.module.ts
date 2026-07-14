import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuoteListComponent } from './quote-list/quote-list.component';
import { QuoteDetailsComponent } from './quote-details/quote-details.component';

const routes: Routes = [
  { path: '', component: QuoteListComponent },
  { path: 'createquotes', component: QuoteDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QuotesRoutingModule { }
