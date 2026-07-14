import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { LazyLoadDirective } from '../directives/lazy-load.directive';
import { BusyLoaderDirective } from '../directives/busy-loader.directive';
import { LoaderComponent } from 'src/app/_c3-lib/layout/components/loader/loader.component';
import { FormsModule } from '@angular/forms'; 
import { C3TranslatePipe } from '../pipes/c3-translate.pipe';
import { C3DatePipe } from '../pipes/dateTimeFilter.pipe';
import { PermissionDirective } from '../directives/permission.directive';



@NgModule({
  declarations: [
    LazyLoadDirective,
    BusyLoaderDirective,
    LoaderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    C3TranslatePipe,
    C3DatePipe,
    PermissionDirective 
  ],
  providers:[DatePipe],
  exports:[
    LazyLoadDirective,
    BusyLoaderDirective,
    LoaderComponent,
    C3TranslatePipe,
    C3DatePipe,
    DatePipe,
    PermissionDirective
  ]
})
export class C3CommonModule { }
