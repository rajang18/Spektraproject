import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuditLogRoutingModule } from './audit-log-routing.module';
import { AuditLogComponent } from './components/audit-log/audit-log.component';
import { AuditLogService } from './services/audit-log.service';
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { TranslateModule } from '@ngx-translate/core';
import { NgbCollapseModule, NgbModule, NgbOffcanvasModule } from '@ng-bootstrap/ng-bootstrap';
import { AuditLogOffCanvasComponent } from './components/audit-log-off-canvas/audit-log-off-canvas.component';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3TranslatePipe } from 'src/app/shared/pipes/c3-translate.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@NgModule({
  declarations: [
    AuditLogComponent,
    AuditLogOffCanvasComponent
  ],
  imports: [
    CommonModule,
    AuditLogRoutingModule,
    C3TableComponent,
    TranslateModule,
    FormsModule,
    NgbModule,
    NgbCollapseModule,
    NgbOffcanvasModule,
    PermissionDirective,
    NgSelectModule,
    C3TranslatePipe,
    C3CommonModule,
    
],
  providers:[AuditLogService]
})
export class AuditLogModule { }
