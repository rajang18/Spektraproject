import { ChangeDetectorRef, Component, EventEmitter, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { OrganisationSetupService } from '../../services/organisation-setup.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-sites',
  templateUrl: './sites.component.html',
  styleUrls: ['./sites.component.scss']
})
export class SitesComponent implements OnInit, OnDestroy {
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  sitesData: any[];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  iseditable: boolean = false;
  isLoading: boolean = false;
  datatableConfig: ADTSettings | any;
  sitesForm: FormGroup;
  c3SiteId: string;
  isEditSite: boolean = false;
  recordId: string;
  siteId: number;
  contactEntityName = 'Site';
  contactRecordId = '';
  pageMode = 'add';
  dataLength: number = 0;
  private destroy$ = new Subject<void>(); // Used for unsubscribing
  _subscription: Subscription;

  constructor(
    private organizationSetupService: OrganisationSetupService,
    private _cdref: ChangeDetectorRef,
    private fb: FormBuilder,
    private toasterService: ToastService,
    private translateService: TranslateService,
    private commonService: CommonService,
    private notifierService: NotifierService,
    private profileService : ProfileService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,
  ) {
    // Initialize the sites form with validators
    this.sitesForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
  }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   */
  ngOnInit(): void {
    this.handleTableConfig();
    this.recordId = this.commonService.recordId;
    this.pageInfo.updateTitle(this.translateService.instant("SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE"),true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE']);
    
  }

  /**
   * Configures the datatable settings.
   */
  handleTableConfig() {
    let self = this;
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          self.isLoading = true;
          const { StartInd, Name, SortColumn, SortOrder, PageSize } = mapParamsWithApi(dataTablesParameters);

          const searchParams = {
            StartInd,
            SortColumn,
            SortOrder,
            PageSize,
            TagValues: '',
            EndInd: 100000
          };

          this._subscription && this._subscription?.unsubscribe();
          // Fetch sites data from the server
          this._subscription = this.organizationSetupService.getSitesData(searchParams)
            .pipe(takeUntil(this.destroy$)) // Unsubscribe on destroy
            .subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              this.dataLength = Data.length;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
              }
              self.isLoading = false;
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
        },
        columns: [
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_SITE_TABLE_HEADER_TEXT_NAME'),
            data: 'Name',
            className:'col-md-4 fw-semibold',
            orderable: false,
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_SITE_TABLE_HEADER_TEXT_DESCRIPTION'),
            data: 'Description',
            className:'col-md-4',
            orderable: false,
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_TABLE_HEADER_TEXT_ACTIONS'),
            className:'col-md-4 text-end pe-10',
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
      };
      this._cdref.detectChanges();
    });
  }
  /**
   * Toggles the edit mode for the table.
   */
  editTable() {
    this.pageMode = 'add';
    this.iseditable = !this.iseditable;
  }

  /**
   * Handler for capturing events.
   */
  onCaptureEvent(event: Event) { }

  /**
   * Saves site details if the form is valid.
   */
  saveSitedetails() {
    this.sitesForm.markAllAsTouched();
    if (this.sitesForm.valid) {
      const { name, description } = this.sitesForm.value;
      const payload = {
        Name: name,
        Description: description,
        CustomerC3ID: this.recordId,
      };
      this.save(payload);
    }
  }

  /**
   * Edits the selected site.
   */
  editSite(data: any) {
   this.pageMode = 'edit'
    this.sitesForm.patchValue({
      name: data.Name,
      description: data.Description,
    });
    this.isEditSite = true;
    this.iseditable = true;
    this.siteId = data.ID;
    this.c3SiteId = data.C3SiteID;
    this.contactRecordId = data.C3SiteID;
    this.profileService.contactEntityName = this.contactEntityName;
    this.profileService.contactRecordId = this.contactRecordId;
  }

  /**
   * Saves edited site details if the form is valid.
   */
  saveEditSitedetails() {
    if (this.sitesForm.valid) {
      const { name, description } = this.sitesForm.value;
      const payload = {
        Name: name,
        Description: description,
        CustomerC3ID: this.recordId,
        C3SiteID: this.c3SiteId,
        ID: this.siteId
      };
      this.save(payload);
    }
    this.isEditSite = !this.isEditSite;
  }

  /**
   * Saves site data.
   */
  save(data) {
    this._subscription = this.organizationSetupService.saveSitesData(data)
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on destroy
      .subscribe(data => {
        const successMessage = this.translateService.instant('TRANSLATE.CUSTOMER_SITE_SAVE_SUCCESS_NOTIFICATION');
        this.toasterService.success(successMessage);
        this.onDiscard();
        this.isLoading = true;
        this.reloadEvent.emit()
      });
  }

  /**
   * Deletes the selected site.
   */
  deleteCustomerSite(data: any) {
    const confirmationMessage = this.translateService.instant('TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT');
    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        this._subscription = this.organizationSetupService.deleteSiteData(data.C3SiteID)
          .pipe(takeUntil(this.destroy$)) // Unsubscribe on destroy
          .subscribe(data => {
            const deleteconfirmationMessage = this.translateService.instant('TRANSLATE.CUSTOMER_SITE_DELETE_SUCCESS_NOTIFICATION');
            this.toasterService.success(deleteconfirmationMessage);
            this.isEditSite = !this.isEditSite;
            this.onDiscard
            this.reloadEvent.emit();
            this._cdref.detectChanges();


          },
          (err)=>{
            
           const errorMessage = this.translateService.instant(`TRANSLATE.${err.error.ErrorMessage}`)
           this.toasterService.error(errorMessage);

          }
        );
      }
    });
  }

  /**
   * Discards any changes made in edit mode.
   */
  onDiscard() {
    this.iseditable = !this.iseditable;
    this.sitesForm.reset();
  }

  /**
   * Lifecycle hook that is called when the directive is destroyed.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe()
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
