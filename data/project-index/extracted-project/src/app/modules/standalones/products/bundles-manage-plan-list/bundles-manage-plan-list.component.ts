import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { BundleManageBaseComponent } from '../models/manage-bundle-base-component';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonService } from 'src/app/services/common.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bundles-manage-plan-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    CurrencyPipe,
    NgbTooltipModule,
    PermissionDirective,
    FormsModule
  ],
  templateUrl: './bundles-manage-plan-list.component.html',
  styleUrl: './bundles-manage-plan-list.component.scss',
})
export class BundlesManagePlanListComponent
  extends BundleManageBaseComponent
  implements OnInit
{

  searchKeyword: any = '';
  filter: any;
  savePlan: string = '';
  entityName: any;
  recordId: any;
  productAndTrailOfferDependency: any;
  constructor(public cdRef:  ChangeDetectorRef,
    private permissionService: PermissionService,
    private commonService: CommonService
  ) {
    super();
  }

  ngOnInit(): void {
    this.entityName = this.commonService.entityName;
    this.recordId = this.commonService.recordId;
    this.savePlan = this.permissionService.hasPermission('SAVE_PLAN');

  }
}
