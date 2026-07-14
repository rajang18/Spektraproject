import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrl: './documentation.component.scss'
})
export class DocumentationComponent  extends  C3BaseComponent implements OnInit, OnDestroy{

  constructor(
    private _translateService: TranslateService,
    public pageInfo: PageInfoService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,){
      super(_permissionService, _dynamicTemplateService, _router, _appService);


  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs([''])
    this.pageInfo.updateTitle(this._translateService.instant("MENU_PARTNER_DOCUMENTATION"), true);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
