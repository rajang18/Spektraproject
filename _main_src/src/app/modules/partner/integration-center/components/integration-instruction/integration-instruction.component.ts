import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { switchMap, takeUntil, timer, take } from 'rxjs'; // Added 'take'
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { IntegrationCenterService } from '../../integration-center.service';
import { SyncStateService } from '../../sync-state.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';

@Component({
  selector: 'app-integration-instruction',
  templateUrl: './integration-instruction.component.html',
  styleUrl: './integration-instruction.component.scss'
})
export class IntegrationInstructionComponent extends C3BaseComponent implements OnInit {
  isSyncing: boolean = false;
  isDataLoaded: boolean = false;
  lastRefreshedOn: number;

  constructor(
    public router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private commonService: CommonService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private appsettings: AppSettingsService,
    private integrationCenterService: IntegrationCenterService,
    private syncService: SyncStateService,
    private pageInfo: PageInfoService,
  ) {
    super(permissionService, dynamicTemplateService, router, appsettings);
    this.hasPermission();
  }

  permissions = {
    HasSyncBusinessCentralData: "Denied"
  };

  hasPermission() {
    this.permissions.HasSyncBusinessCentralData = this._permissionService.hasPermission(this.cloudHubConstants.SYNC_BUSINESS_CENTRAL_DATA);
  }

  ngOnInit(): void {
    this.pageInfo.updateTitle(this.translateService.instant("BUSINESS_CENTRAL_INTEGRATION_CENTER"), true);
    this.pageInfo.updateBreadcrumbs(['BUSINESS_CENTRAL_INTEGRATION']);
    this.loadLastRefreshDetails();
  }

  loadLastRefreshDetails() {
    if (this.commonService.entityName ) {
      const reqBody = {
        entityName: this.commonService.entityName,
        recordId: this.commonService.recordId
      };
      
      this.integrationCenterService.getLastBusinessCentralDataRefresh(reqBody)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.Status === 'Success') {
              this.lastRefreshedOn = response.Data?.MinutesSinceLastRefresh;
            }
            this.isDataLoaded = true; 
          },
          error: (error: any) => {
            console.error("Error fetching refresh details", error);
            this.isDataLoaded = true;
          }
        });
    } else {
      this.isDataLoaded = true;
    }
  }

  onSyncBusinessCentralData() {
    if (this.commonService.entityName ) {
      this.isSyncing = true;
      this.syncService.setSyncing(true);
      
      const reqBody = {
        entityName: this.commonService.entityName,
        recordId: this.commonService.recordId
      };

      const subscription = this.integrationCenterService.syncBusinessCentralData(reqBody)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.Status === 'Success') {
              // Start polling only after the sync request succeeds
              this.pollForRefreshStatus(reqBody);
            } else {
              this.stopSyncing(false);
            }
          },
          error: (error: any) => {
            this.stopSyncing(false);
          }
        });

      this._subscriptionArray.push(subscription);
    } else {
      let syncAlert = this.translateService.instant('TRANSLATE.ERROR_BUSINESS_CENTRAL_SYNC_MISSING_DETAILS');
      this.toastService.error(syncAlert);
    }
  }

  pollForRefreshStatus(reqBody: any) {
    const pollSubscription = timer(0, 5000)
      .pipe(
        take(2),
        switchMap(() => this.integrationCenterService.getLastBusinessCentralDataRefresh(reqBody)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response && response.Status === 'Success') {
            this.lastRefreshedOn = response.Data?.MinutesSinceLastRefresh;
          }
        },
        error: (error: any) => {
          console.error("Error during polling", error);
        },
        complete: () => {
          // This block automatically runs after 10 seconds (2 polls)
          this.stopSyncing(true);
        }
      });

    this._subscriptionArray.push(pollSubscription);
  }

  stopSyncing(isSuccess: boolean) {
    this.isSyncing = false;
    this.syncService.setSyncing(false);
    
    if (isSuccess) {
      this.toastService.success(this.translateService.instant('TRANSLATE.BUSINESS_CENTRAL_SYNC_SUCCESS_MESSAGE'));
    } 
  }
      ngOnDestroy(): void {
        this.syncService.setSyncing(false); 
        super.ngOnDestroy();
    }
}