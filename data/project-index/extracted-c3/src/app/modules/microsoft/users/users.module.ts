import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//import { MicrosoftRoutingModule } from './microsoft-routing.module';
import { UsersRoutingModule } from './users-routing.module';
import { UsersListingComponent } from './users-listing/users-listing/users-listing.component';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { EditColumnComponent } from '../../standalones/c3-table/edit-column/edit-column.component';


@NgModule({
  declarations: [
    UsersListingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    UsersRoutingModule,
    TranslateModule,
    C3TableComponent,
    EditColumnComponent,
    NgSelectModule
  ]
})
export class UsersModule { }
