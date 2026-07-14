import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductSequenceListComponent } from './product-sequence-list/product-sequence-list.component';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    ProductSequenceListComponent
  ],
  imports: [
    CommonModule,
    PermissionDirective,
    C3CommonModule,
    C3TableComponent,
    TranslateModule,
    NgbModule,
    FormsModule
  ],
  exports: [
    ProductSequenceListComponent
  ]
})
export class ProductSequenceModule { }
