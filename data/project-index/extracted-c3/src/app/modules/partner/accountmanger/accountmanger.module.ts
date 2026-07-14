import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountmangerRoutingModule } from './accountmanger-routing.module';
import { AccountmanagersComponent } from './accountmanagers/accountmanagers.component';
import { EditColumnComponent } from "../../standalones/c3-table/edit-column/edit-column.component";
import { C3TableComponent } from "../../standalones/c3-table/c3-table.component";
import { AddAccountmanagerComponent } from './add-accountmanager/add-accountmanager.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AccountmanagerCustomerlistComponent } from './accountmanager-customerlist/accountmanager-customerlist.component';
import { NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { PartnerModule } from '../partner.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@NgModule({
    declarations: [
        AccountmanagersComponent,
        AddAccountmanagerComponent,
        AccountmanagerCustomerlistComponent
    ],
    imports: [
        CommonModule,
        AccountmangerRoutingModule,
        EditColumnComponent,
        C3TableComponent,
        TranslateModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        NgbTooltip,
        C3CommonModule,
        NgSelectModule,
        NgbModule
    ]
})
export class AccountmangerModule { }
