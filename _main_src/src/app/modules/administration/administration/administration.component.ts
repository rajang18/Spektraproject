import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrl: './administration.component.scss'
})
export class AdministrationComponent implements OnInit {
  activeTab: string = 'customNotifications'; 

  HasCustomNotification:any;
  HasWebhookNotification:any;
  constructor(
    public router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
  ) {
   // super(permissionService, dynamicTemplateService, router, _appService)

  }
  ngOnInit(): void {
    this.HasCustomNotification = this.permissionService.hasPermission(CloudHubConstants.VIEW_UI_NOTIFICATION);
    this.HasWebhookNotification = this.permissionService.hasPermission(CloudHubConstants.MENUADMINISTRATIONWEBHOOKNOTIFICATIONS);
    if (this.HasCustomNotification === 'Denied') {
      this.setActiveTab('webhookNotifications');
    }

  }
 
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
