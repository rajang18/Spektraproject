import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ActivityDrawerComponent } from './activity-drawer/activity-drawer.component';
import { SharedModule } from "../../../shared/shared.module";

@NgModule({
  declarations: [
    ActivityDrawerComponent,
  ],
  imports: [CommonModule, InlineSVGModule, RouterModule,  SharedModule],
  exports: [
    ActivityDrawerComponent
  ],
})
export class DrawersModule {}
