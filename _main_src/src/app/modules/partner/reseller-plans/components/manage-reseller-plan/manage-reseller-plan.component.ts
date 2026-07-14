import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-manage-reseller-plan',
  templateUrl: './manage-reseller-plan.component.html',
  styleUrl: './manage-reseller-plan.component.scss'
})
export class ManageResellerPlanComponent extends C3BaseComponent implements OnInit, OnDestroy {
  constructor(private _commonService:CommonService, 
    public _permissionService:PermissionService,
    public _dynamicTemplateService:DynamicTemplateService,
    public _router: Router,
    private _appService: AppSettingsService, 
  ){
    super(_permissionService,_dynamicTemplateService,_router, _appService); 
  }

  ngOnInit(): void {
    
  } 

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
