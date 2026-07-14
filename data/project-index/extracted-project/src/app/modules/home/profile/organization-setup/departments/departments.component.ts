import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { OrganisationSetupService } from '../../services/organisation-setup.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProfileService } from '../../services/profile.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss'] // Fixed the typo from styleUrl to styleUrls
})
export class DepartmentsComponent implements OnDestroy {
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  sitesData: any[] = [];
  iseditable: boolean = false;
  isLoading: boolean = false;
  datatableConfig: ADTSettings | any;
  departmentsForm: FormGroup;
  isEditDepartment: boolean = false;
  c3DepartmentId: string;
  departmentId: number;
  contactEntityName = 'SiteDepartment';
  contactRecordId = '';
  pageMode='add';
  _subscription: Subscription;
  dataLength : number =0;
  previousSiteIds:any; // Store previous IDs

  private unsubscribe$ = new Subject<void>(); // Subject for managing unsubscription
  siteBackupData: any[] = [];
  initiallySelectedItems: any[] = [];

  constructor(
    private organizationSetupService: OrganisationSetupService,
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private toasterService: ToastService,
    private translateService: TranslateService,
    private notifierService: NotifierService,
    private profileService : ProfileService,
    private _unsavedChangesService: UnsavedChangesService,
    private pageInfo: PageInfoService,
    private _appService:AppSettingsService,    
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    // Initialize the form group with validators
    this.departmentsForm = this.fb.group({
      name: ['', [Validators.required]],
      site: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
  }

  removeOldSiteCrossIcon(secondSpan:any){
    // Find the second span by its ID
    // const secondSpan = this.el.nativeElement.querySelector('#second-span');
    
    // If second span exists, find the first sibling (the first span)
    if (secondSpan) {
      const firstSpan = secondSpan.previousElementSibling; // This targets the first span
      if (firstSpan) {
        // Apply styles to the first span
        this.renderer.setStyle(firstSpan, 'display', 'none'); // Example styling
      }
    }
  }

  ngOnInit(): void {
     // Fetch sites data on initialization
    this.handleTableConfig(); // Configure the DataTable

    this.pageInfo.updateTitle(this.translateService.instant("SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE"),true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE']);
  }

  getSiteName(){
    let arr:any = this.departmentsForm.get('site')?.value || [];
    let nameArr = arr?.map((val:any) => this.siteBackupData.find(site => site.value === val))
    .filter((site:any) => site !== undefined) // Filter out undefined values
    .map((site:any) => site.data.name);
    return nameArr || '';
  }
  /**
   * Fetches customer sites data from the API and populates the sitesData array.
   */
  getCustomerSitesData(): void {
    const searchParams = {
      StartInd: 1,
      SortColumn: 'Name',
      SortOrder: 'asc',
      PageSize: 100000,
      TagValues: '',
      EndInd: 100000
    };
    this._subscription = this.organizationSetupService.getSitesData(searchParams)
      .pipe(takeUntil(this.unsubscribe$)) // Automatically unsubscribe on component destroy
      .subscribe((data: any) => {
        if (data?.Data) {
          this.sitesData = data.Data.map((site: any) => ({
            value: site.C3SiteID,
            label: site.Description,
            data: { name: site.Name }
          }));
          this.siteBackupData = [...this.sitesData]
        }
        this.cdRef.detectChanges(); // Trigger change detection
      });
  }

  /**
   * Configures the DataTable with server-side processing and column definitions.
   */
  handleTableConfig(): void {
    let self = this;
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          self.isLoading = true;
          const { StartInd, Name, SortColumn, SortOrder, PageSize } =
            mapParamsWithApi(dataTablesParameters);

          const searchParams = {
            StartInd,
            SortColumn,
            SortOrder,
            PageSize,
            TagValues: '',
            EndInd: 100000
          };

          this._subscription && this._subscription?.unsubscribe();
          this._subscription = this.organizationSetupService.getDepartments(searchParams)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(({ Data }: any) => {
              this.dataLength = Data.length;
              const recordsTotal = Data.length > 0 ? Data[0].TotalRows : 0;
              self.isLoading = false;
              
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
              this.getCustomerSitesData();
            });
        },
        columns: [
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_DEPARTMENT_TABLE_HEADER_TEXT_NAME'),
            data: 'Name',
            className:'col-md-3 fw-semibold'
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_DEPARTMENT_TABLE_HEADER_TEXT_DESCRIPTION'),
            data: 'Description',
            className:'col-md-3',
            orderable: false,
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_DEPARTMENT_TABLE_HEADER_TEXT_ASSIGNED_SITES'),
            data: 'C3SiteNames',
            className:'col-md-3',
            orderable: false,
          },
          {
            title: this.translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTIONS_TABLE_HEADER_TEXT_ACTIONS'),
            className:'col-md-3 text-end pe-10',
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.actions,
              context: {
                captureEvents: this.onCaptureEvent.bind(this),
              },
            },
          },
        ],
      };
      this.cdRef.detectChanges(); // Trigger change detection
    });
  }

  /**
   * Handles capture events inside the template.
   * @param event - The event object.
   */
  onCaptureEvent(event: Event): void {
    // Implement event handling logic
  }

  /**
   * Toggles the editable state of the form.
   */
  editTable(): void {
    this.pageMode ='add';
    this.iseditable = !this.iseditable;
    this.isEditDepartment = false;
    
    // this.departmentsForm.get('site')?.enable();
  }

  /**
   * Saves the department details if the form is valid.
   */
  saveDepartmentsDetails(): void {
    this.departmentsForm.markAllAsTouched();
    if (this.departmentsForm.valid) {
      const { name, site, description } = this.departmentsForm.value;
      const payload = {
        Name: name,
        Description: description,
        C3SiteID: site.join(',')
      };
      this.save(payload);
    }
  }

  /**
   * Cancels the editing of department details.
   */
  onDiscard(): void {
    this.iseditable = !this.iseditable;
    this.departmentsForm.reset();

  }

  /**
   * Pre-fills the form with department details for editing.
   * @param data - The department data to edit.
   */
  editDepartment(data: any): void {
    let self = this;
    this.pageMode = 'edit'
    const siteIds = [...new Set(data.C3SiteIDs ? data.C3SiteIDs.split(',').map((id: string) => id.trim()) : [])];
    this.previousSiteIds = [...siteIds]; // Store previous IDsS
    this.departmentsForm.patchValue({
      name: data.Name,
      description: data.Description,
      site: siteIds,
    });
    this.initiallySelectedItems = [...siteIds];
    this.c3DepartmentId = data.C3DepartmentID;
    this.departmentId = data.ID;
    this.isEditDepartment = true;
    // this.departmentsForm.get('site')?.disable();
    this.iseditable = true;
    this.contactRecordId = data.C3DepartmentSiteID;
    this.profileService.contactEntityName = this.contactEntityName;
    this.profileService.contactRecordId = this.contactRecordId;
    setTimeout(()=>{
      self.initialSitesDataRemove();
    },2000)
  }

  initialSitesDataRemove(){
    this.sitesData?.map((item:any)=>{
      if(this.initiallySelectedItems.includes(item?.value)){
        let id:string = '#temp'+this.getName(item?.data?.name);
        const secondSpan = this.el.nativeElement.querySelector(id);
        this.removeOldSiteCrossIcon(secondSpan);
      }
    });
  }

  getName(str:string){
    return str.split(' ').join('_')
  }

  /**
   * Deletes a department after confirmation.
   * @param data - The department data to delete.
   */
  deleteDepartments(data: any): void {
    const confirmationMessage = this.translateService.instant('TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT');
    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        this._subscription = this.organizationSetupService.deleteDepartment(data?.C3DepartmentID)
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe(() => {
            const successMessage = this.translateService.instant('TRANSLATE.CUSTOMER_DEPARTMENT_DELETE_SUCCESS_NOTIFICATION');
            this.toasterService.success(successMessage);
            this.isEditDepartment = false;
            // this.departmentsForm.get('site')?.enable();
            this.reloadEvent.emit();
            this.cdRef.detectChanges();
          },
          (err)=>{
           const errorMessage = this.translateService.instant(`TRANSLATE.${err.error.ErrorMessage}`)
           this.toasterService.error(errorMessage);
      
          });
      }
    }
   
  );
  }

  /**
   * Saves department data to the API.
   * @param data - The department data to save.
   */
  save(data: any): void {
    this._subscription = this.organizationSetupService.saveDepartments(data)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        const successMessage = this.translateService.instant('TRANSLATE.CUSTOMER_DEPARTMENT_SAVE_SUCCESS_NOTIFICATION');
        this.toasterService.success(successMessage);
        this.onDiscard();
        this.isLoading = true;
        this.reloadEvent.emit();
      });
  }

  /**
   * Updates department details.
   */
  editDepartmentsDetails(): void {
        const { name, description, site } = this.departmentsForm.value;
        const newSiteIds = site.filter((id: string) => !this.previousSiteIds.includes(id));
      const reqBody = {
      ID: this.departmentId,
      Name: name,
      Description: description,
      C3DepartmentID: this.c3DepartmentId,
      C3SiteID: newSiteIds.join(',')
    };
    this.save(reqBody);
  }

  /**
   * Unsubscribes from all subscriptions to avoid memory leaks.
   */
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this._subscription?.unsubscribe()
    this._unsavedChangesService.setUnsavedChanges(false);
  }
}
