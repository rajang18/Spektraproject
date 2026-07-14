import { ChangeDetectorRef, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ExpiringGranularRelationshipsService } from 'src/app/services/expiring-granular-relationships.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import { catchError, debounceTime, forkJoin, of, Subject, switchMap, takeUntil } from 'rxjs';
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-expiring-granular-relationships',
  templateUrl: './expiring-granular-relationships.component.html',
  styleUrl: './expiring-granular-relationships.component.scss'
})
export class ExpiringGranularRelationshipsComponent extends C3BaseComponent implements OnInit {
  dataLoaded: boolean = false;
  providerName = 'Microsoft';
  filterType: string = null;
  tempFilterType: string = null;
  datatableConfig: ADTSettings;
  expiringGranularRelationshipsDataForTable: any[] = [];
  selectedGranularRelationships: any[] = [];
  granularRelationshipsActiveAndExpiredData: any[] = [];
  granularRelationshipsActiveData: any[] = [];
  granularRelationshipsExpiredData: any[] = [];
  granularRelationshipsExpiringWithIn30DaysData: any[] = [];
  granularRelationshipsExpiringWithIn7DaysData: any[] = [];
  granularRelationshipsExpiringWithIn1DayData: any[] = [];
  granularRelationshipsExpiringAfter30DaysData: any[] = [];
  granularRelationshipsAutoExtendEnabledData: any[] = [];
  granularRelationshipsAutoExtendDisabledData: any[] = [];
  filters: any[] = [];
  searchKeyword: string = "";
  filteredDataByName: any[] = [];
  selectedDataForAutoExtendEnableOrDisable: any[] = [];
  selectedDataForRemovalOfGlobalAdministratorRole: any[] = [];
  dataForTable: any[] = [];
  filteredDataForTable: any[] = [];
  isAPICalling: boolean = false;
  @ViewChild('autoExtendDuration') autoExtendDuration: TemplateRef<any>;
  @ViewChild('status') status: TemplateRef<any>;
  @ViewChild('buttonRef1') buttonRef1!: ElementRef;
  @ViewChild('buttonRef2') buttonRef2!: ElementRef;
  @ViewChild('buttonRef3') buttonRef3!: ElementRef;
  @ViewChild('buttonRef4') buttonRef4!: ElementRef;
  private keyPressSubject: Subject<string> = new Subject<string>();

  permissions = {
    HasEnableAutoExtendExpiringGranularRelationship: 'Denied',
    HasDisableAutoExtendExpiringGranularRelationship: 'Denied',
    HasRemoveGloabalAdministratorRoleExpiringGranularRelationship: 'Denied'
  }

  constructor(
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private pageInfo: PageInfoService,
    private _translateService: TranslateService,
    private _expiringGranularRelationshipsService: ExpiringGranularRelationshipsService,
    private _toastService: ToastService,
    private _cdRef: ChangeDetectorRef,
    private _fileService: FileService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.keyPressSubject.pipe(takeUntil(this.destroy$),
      debounceTime(300)).subscribe((value: string) => {
        this.filterDataByKeyword();
      });
  }
  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENUS_EXPIRING_GRANULAR_RELATIONSHIPS"), true);
    this.pageInfo.updateBreadcrumbs(['MENUS_CUSTOMER_MICROSOFT', 'MENUS_EXPIRING_GRANULAR_RELATIONSHIPS']);
    this.hasPermissons();
    this.filters = [
      { Name: this._translateService.instant('TRANSLATE.SELECTED_FILTER_ALL'), Value: null },
      { Name: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_FILTER_CARD_LABLE_EXPIRING_WITHIN_30_DAYS'), Value: 'expiringwithin30days' },
      { Name: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_FILTER_CARD_LABLE_EXPIRING_WITHIN_7_DAYS'), Value: 'expiringwithin7days' },
      { Name: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_FILTER_CARD_LABLE_EXPIRING_WITHIN_1_DAYS'), Value: 'expiringwithin1day' },
      { Name: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_FILTER_CARD_LABLE_EXPIRING_AFTER_30_DAYS'), Value: 'expiringafter30days' },
      { Name: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_FILTER_CARD_LABLE_EXPIRED'), Value: 'expired' },
      { Name: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_FILTER_CARD_LABLE_AUTO_EXTEND_ENABLED'), Value: 'autoextendenabled' },
      { Name: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_FILTER_CARD_LABLE_AUTO_EXTEND_DISABLED'), Value: 'autoextenddisabled' },
      { Name: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_FILTER_CARD_LABLE_HAVING_GLOBAL_ADMINISTRATOR'), Value: 'havingglobaladministrator' }
    ]
    this.isAPICalling = true;
    // Prepare API calls
    const tableRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, null);
    const activeRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, "active");
    const expiredRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, "expired");
    const expiringWithin30DaysRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, "expiringwithin30days");
    const expiringWithin7DaysRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, "expiringwithin7days");
    const expiringWithin1DayRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, "expiringwithin1day");
    const expiringAfter30DaysRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, "expiringafter30days");
    const autoExtendEnabledRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, "autoextendenabled");
    const autoExtendDisabledRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, "autoextenddisabled");
    
    //multiple service subscription to handle
    const sub= forkJoin({
      table: tableRequest,
      active: activeRequest,
      expired: expiredRequest,
      expiringWithIn30Days: expiringWithin30DaysRequest,
      expiringWithIn7Days: expiringWithin7DaysRequest,
      expiringWithIn1Day: expiringWithin1DayRequest,
      expiringAfter30Days: expiringAfter30DaysRequest,
      autoExtendEnabled: autoExtendEnabledRequest,
      autoExtendDisabled: autoExtendDisabledRequest,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (responses: any) => {
        this.granularRelationshipsActiveAndExpiredData = responses.table.Data;
        this.expiringGranularRelationshipsDataForTable = responses.table.Data;
        this.granularRelationshipsActiveData = responses.active.Data;
        this.granularRelationshipsExpiredData = responses.expired.Data;
        this.granularRelationshipsExpiringWithIn30DaysData = responses.expiringWithIn30Days.Data;
        this.granularRelationshipsExpiringWithIn7DaysData = responses.expiringWithIn7Days.Data;
        this.granularRelationshipsExpiringWithIn1DayData = responses.expiringWithIn1Day.Data;
        this.granularRelationshipsExpiringAfter30DaysData = responses.expiringAfter30Days.Data;
        this.granularRelationshipsAutoExtendEnabledData = responses.autoExtendEnabled.Data;
        this.granularRelationshipsAutoExtendDisabledData = responses.autoExtendDisabled.Data;
        this.dataLoaded = true;
        this.handleTableConfig();
      },
      error: (err) => {
        let errmsg: string = "";
        let jsonObject = JSON.parse(err.error.ErrorMessage);
        if (jsonObject && jsonObject.ErrorValue) {
          errmsg = this._translateService.instant('TRANSLATE.' + jsonObject.ErrorValue);
        }
        else {
          errmsg = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
        }
        this._toastService.error(errmsg, {
          timeOut: 5000
        });
        this.isAPICalling = false;
        return of(null);
      },
    });
    this._subscriptionArray.push(sub);
  }

  hasPermissons() {
    this.permissions.HasEnableAutoExtendExpiringGranularRelationship = (this._permissionService.hasPermission('ENABLE_AUTO_EXTEND_EXPIRING_GRANULAR_RELATIONSHIPS') == 'Allowed' && this._permissionService.hasPermission('UPDATE_AUTO_EXTEND_EXPIRING_GRANULAR_RELATIONSHIPS') == 'Allowed') ? 'Allowed' : 'Denied';
    this.permissions.HasDisableAutoExtendExpiringGranularRelationship = (this._permissionService.hasPermission('DISABLE_AUTO_EXTEND_EXPIRING_GRANULAR_RELATIONSHIPS') == 'Allowed' && this._permissionService.hasPermission('UPDATE_AUTO_EXTEND_EXPIRING_GRANULAR_RELATIONSHIPS') == 'Allowed') ? 'Allowed' : 'Denied';
    this.permissions.HasRemoveGloabalAdministratorRoleExpiringGranularRelationship = this._permissionService.hasPermission('REMOVE_GLOBAL_ADMINISTRATOR_ROLE_EXPIRING_GRANULAR_RELATIONSHIPS');
  }

  onSearch(): void {
    let searchKey = "";
    this.keyPressSubject.next(searchKey); // Emit the current value to the Subject
  }

  getExpiringGranularRelationshipsForTable() {
    this.isAPICalling = true;
    const subscription = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, this.filterType).pipe(
      catchError((err) => {
        let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
        this._toastService.error(errmsg, {
          timeOut: 5000
        });
        this.isAPICalling = false;
        return of(null);
      })
    ).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res.Status == 'Success') {
        this.expiringGranularRelationshipsDataForTable = res.Data;
        this.filterDataByKeyword();
      }
    })
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    this.enableCheckboxForRequiredData();
    this.selectedDataForRemovalOfGlobalAdministratorRole = [];
    this.selectedDataForAutoExtendEnableOrDisable = [];
    this.datatableConfig = null;
    this.isAPICalling = false;
    setTimeout(() => {
      this.getDataForTable();
      this.datatableConfig = {
        serverSide: false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        data: this.searchKeyword != "" || (this.filteredDataForTable && this.filteredDataForTable.length > 0) ? this.filteredDataForTable : this.dataForTable,
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_LABLE_CUSTOMER_NAME'),
            data: 'customerName',
            className: 'col-md-3 text-start ps-0',
            render: (data: string) => {
              return '<span class="fw-semibold">' + data + '</span>';
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_LABLE_ADMIN_RELATIONSHIP_NAME'),
            data: 'displayName',
            className: 'col-md-3 text-start'
          },
          {
            title: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_LABLE_DURATION_IN_DAYS'),
            data: 'durationInDays',
            className: 'col-md-1 text-end pe-2',
          },
          {
            title: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_LABLE_EXPIRING_IN'),
            data: 'expiringIn',
            className: 'col-md-1 text-end pe-2',
          },
          {
            title: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_LABLE_AUTO_EXTEND_DURATION'),
            data: 'autoExtendDurationValue',
            className: 'col-md-1 text-start text-nowrap',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.autoExtendDuration,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: this.onCaptureEvent.bind(self),
              },
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_LABLE_STATUS'),
            data: 'status',
            className: 'col-md-1 text-center',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.status,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: this.onCaptureEvent.bind(self),
              },
            }
          }
        ],
        order:[6,'asc']
      };
      this._cdRef.detectChanges();
    });
  }

  getDataForTable() {
    this.dataForTable = [];
    this.filteredDataForTable = [];
    if (this.expiringGranularRelationshipsDataForTable && this.expiringGranularRelationshipsDataForTable.length > 0) {
      this.expiringGranularRelationshipsDataForTable.forEach((item: any) => {
        let data: any = {
          ["@odata.etag"]: item["@odata.etag"],
          id: item.id,
          displayName: item.displayName,
          duration: item.duration,
          durationInDays: this.removeCharacters(item.duration),
          status: item.status,
          createdDateTime: item.createdDateTime,
          activatedDateTime: item.activatedDateTime,
          lastModifiedDateTime: item.lastModifiedDateTime,
          endDateTime: item.endDateTime,
          expiringIn: this.calculateDaysDifference(item.endDateTime),
          autoExtendDuration: item.autoExtendDuration,
          autoExtendDurationValue: this.getAutoExtendValue(item),
          customer: item.customer,
          customerName: item.customer?.displayName,
          accessDetails: item.accessDetails,
          isCheckBoxDisabled: item.isCheckBoxDisabled
        }
        this.dataForTable.push(data);
      });
    }
    if (this.filteredDataByName || this.filteredDataByName.length > 0) {
      this.filteredDataByName.forEach((item: any) => {
        let data: any = {
          ["@odata.etag"]: item["@odata.etag"],
          id: item.id,
          displayName: item.displayName,
          duration: item.duration,
          durationInDays: this.removeCharacters(item.duration),
          status: item.status,
          createdDateTime: item.createdDateTime,
          activatedDateTime: item.activatedDateTime,
          lastModifiedDateTime: item.lastModifiedDateTime,
          endDateTime: item.endDateTime,
          expiringIn: this.calculateDaysDifference(item.endDateTime),
          autoExtendDuration: item.autoExtendDuration,
          autoExtendDurationValue: this.getAutoExtendValue(item),
          customer: item.customer,
          customerName: item.customer?.displayName,
          accessDetails: item.accessDetails,
          isCheckBoxDisabled: item.isCheckBoxDisabled
        }
        this.filteredDataForTable.push(data);
      });
    }
  }

  getAutoExtendValue(data) {
    if (data.status == 'active' && this.checkAutoExtend(data.autoExtendDuration)) {
      return this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_LABLE_AUTO_EXTEND_DURATION_TRUE_VALUE');
    }
    if (data.status == 'active' && !this.checkAutoExtend(data.autoExtendDuration)) {
      return this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_LABLE_AUTO_EXTEND_DURATION_FALSE_VALUE');
    }
    if (data.status == 'expired' || (!this.checkAutoExtend(data.autoExtendDuration) && this.hasGlobalAdministratorRoleDefinitionId(data))) {
      return this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_LABLE_AUTO_EXTEND_DURATION_NA_VALUE');
    }
  }

  enableCheckboxForRequiredData() {
    if (this.expiringGranularRelationshipsDataForTable && this.expiringGranularRelationshipsDataForTable.length > 0) {
      this.expiringGranularRelationshipsDataForTable.forEach((item: any) => {
        if (item.status == 'expired' || this.hasGlobalAdministratorRoleDefinitionIdOnly(item)) {
          item.isCheckBoxDisabled = true;
        }
        else {
          item.isCheckBoxDisabled = false;
        }
      });
    }
    if (this.filteredDataByName || this.filteredDataByName.length > 0) {
      this.filteredDataByName.forEach((item: any) => {
        if (item.status == 'expired' || this.hasGlobalAdministratorRoleDefinitionIdOnly(item)) {
          item.isCheckBoxDisabled = true;
        }
        else {
          item.isCheckBoxDisabled = false;
        }
      });
    }
  }

  handleSelection(event: any) {
    this.selectedGranularRelationships = event.filter((item: any) => { return item.isCheckBoxDisabled == false });
    this.basedOnConditionAddSelectedDataIntoRequiredVariable();
  }

  basedOnConditionAddSelectedDataIntoRequiredVariable() {
    if (this.selectedGranularRelationships && this.selectedGranularRelationships.length > 0) {
      this.selectedDataForRemovalOfGlobalAdministratorRole = this.selectedGranularRelationships.filter((item: any) => { return this.hasGlobalAdministratorRoleDefinitionId(item) });
      this.selectedDataForAutoExtendEnableOrDisable = this.selectedGranularRelationships.filter((item: any) => { return !this.hasGlobalAdministratorRoleDefinitionId(item) });
    }
    else {
      this.selectedDataForRemovalOfGlobalAdministratorRole = [];
      this.selectedDataForAutoExtendEnableOrDisable = [];
    }
  }

  removeCharacters(label: string): string {
    return label.replace(/\D/g, '');
  }

  calculateDaysDifference(dateString: string): number {
    const inputDate = new Date(dateString);

    const today = new Date();

    const timeDifference = inputDate.getTime() - today.getTime();

    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    if (daysDifference >= 0) {
      return daysDifference;
    }
    else {
      return 0;
    }
  }

  checkAutoExtend(autoExtend: string) {
    if (autoExtend == 'P180D') {
      return true;
    }
    else {
      return false;
    }
  }

  hasGlobalAdministratorRoleDefinitionId(data: any): boolean {
    return data.accessDetails.unifiedRoles.some(role => role.roleDefinitionId === '62e90394-69f5-4237-9190-012177145e10');
  }

  hasGlobalAdministratorRoleDefinitionIdOnly(data: any): boolean {
    return data.accessDetails.unifiedRoles.some(role => role.roleDefinitionId === '62e90394-69f5-4237-9190-012177145e10') && data.accessDetails.unifiedRoles.length == 1;
  }

  calculateInPercentage(item1: any, item2: any) {
    if (item2 === 0) {
      return 0;
    }
    const result = (item1 * 100) / item2;
    return Math.ceil(result);
  }

  applyFilter() {
    this.filterType = this.tempFilterType;
    this.getExpiringGranularRelationshipsForTable();
  }

  openDropdown() {
    this.tempFilterType = this.filterType;
  }

  downloadReport() {
    this._fileService.post('expiringGranularRelationships/download', true, JSON.stringify(this.searchKeyword != "" || (this.filteredDataByName && this.filteredDataByName.length > 0) ? this.filteredDataByName : this.expiringGranularRelationshipsDataForTable));
    setTimeout(() => this.buttonRef1.nativeElement.blur(), 100);
  }

  filterDataByKeyword() {
    if (this.searchKeyword != "") {
      const lowerCaseSearchTerm = this.searchKeyword.toLowerCase();

      this.filteredDataByName = this.expiringGranularRelationshipsDataForTable.filter(item => {
        const customerDisplayName = item.customer?.displayName?.toLowerCase() || '';
        const displayName = item.displayName?.toLowerCase() || '';

        return (
          customerDisplayName.includes(lowerCaseSearchTerm) ||
          displayName.includes(lowerCaseSearchTerm)
        );
      });
    }
    else {
      this.filteredDataByName = [];
    }
    this.handleTableConfig();
  }
  
  enableOrDisableAutoExtendDuration(isAutoExtendEnabled: boolean) {
    this.isAPICalling = true;

    const requests = this.selectedDataForAutoExtendEnableOrDisable.map(item => {
      const reqBody = {
        autoExtendDuration: isAutoExtendEnabled ? 'P180D' : 'P0D',
        granularRelationshipId: item.id,
        etag: item["@odata.etag"],
      };
      return this._expiringGranularRelationshipsService.updateGranularRelationshipAutoExtend(reqBody);
    });

    // Flattening the nested subscriptions with switchMap
    forkJoin(requests).pipe(
      takeUntil(this.destroy$),
      switchMap((responses: any) => {
        if (isAutoExtendEnabled) {
          this._toastService.success(this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_AUTO_EXTEND_ENABLE_SUCCESS_INFO'));
        } else {
          this._toastService.success(this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_AUTO_EXTEND_DISABLE_SUCCESS_INFO'));
        }
        
        this.datatableConfig = null;
        setTimeout(() => this.buttonRef2.nativeElement.blur(), 100);
        setTimeout(() => this.buttonRef3.nativeElement.blur(), 100);

        // Initiating parallel requests for table data
        const tableRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, this.filterType);
        const autoExtendEnabledRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, "autoextendenabled");
        const autoExtendDisabledRequest = this._expiringGranularRelationshipsService.getExpiringGranularRelationshipById(this.providerName, "autoextenddisabled");

        return forkJoin({
          table: tableRequest,
          autoExtendEnabled: autoExtendEnabledRequest,
          autoExtendDisabled: autoExtendDisabledRequest
        });
      })
    ).subscribe({
      next: (responses: any) => {
        this.expiringGranularRelationshipsDataForTable = responses.table.Data;
        this.granularRelationshipsAutoExtendEnabledData = responses.autoExtendEnabled.Data;
        this.granularRelationshipsAutoExtendDisabledData = responses.autoExtendDisabled.Data;

        this.filterDataByKeyword();
        this.isAPICalling = false;  // Reset the API calling flag after successful completion
      },
      error: (err) => {
        const errmsg = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
        this._toastService.error(errmsg, { timeOut: 5000 });
        this.isAPICalling = false;
      }
    });

  }

  removeGlobalAdministrationRole() {
    const requests = this.selectedDataForRemovalOfGlobalAdministratorRole.map(item => {
      const reqBody = {
        accessDetails: { 
          unifiedRoles: item.accessDetails.unifiedRoles.filter((role: any) => 
            role.roleDefinitionId !== '62e90394-69f5-4237-9190-012177145e10')
        },
        granularRelationshipId: item.id,
        etag: item["@odata.etag"],
      }; 
      return this._expiringGranularRelationshipsService.removeGranularRelationshipGlobalAdministratorRole(reqBody);
    });
    
    // Flattening the observables with switchMap
    forkJoin(requests).pipe(
      takeUntil(this.destroy$),
      switchMap((responses: any) => {
        this._toastService.success(
          this._translateService.instant('TRANSLATE.EXPIRING_GRANULAR_RELATIONSHIPS_GLOBAL_ADMINISTRATOR_ROLE_REMOVED_SUCCESS_INFO')
        ); 
        this.datatableConfig = null; 
        // Introducing setTimeout() within the observable chain
        return new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>{ 
          this.buttonRef4.nativeElement.blur();
          this.getExpiringGranularRelationshipsForTable()
        });
      })
    ).subscribe({
      next: (response: any) => {
        // If you need to handle the response from getExpiringGranularRelationshipsForTable(), do it here.
        //console.log("Expiring Granular Relationships Table Updated");
        this.isAPICalling = false; // Ensure this flag is properly handled.
      },
      error: (err) => {
        const errmsg = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
        this._toastService.error(errmsg, { timeOut: 5000 });
        this.isAPICalling = false; // Reset the flag on error
      }
    });
    
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
  onCaptureEvent(event: Event) { }

}