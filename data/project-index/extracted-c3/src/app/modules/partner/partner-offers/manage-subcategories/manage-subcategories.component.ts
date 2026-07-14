import { ChangeDetectorRef, Component, OnInit, EventEmitter, ViewChild, TemplateRef, OnDestroy, Input } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModalModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, NgFor, Location } from '@angular/common';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/services/toast.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3TableComponent } from "../../../standalones/c3-table/c3-table.component";
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';

@Component({
  selector: 'app-manage-subcategories',
  templateUrl: './manage-subcategories.component.html',
  styleUrl: './manage-subcategories.component.scss'
})

export class ManageSubcategoriesComponent extends C3BaseComponent implements OnInit, OnDestroy {
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  datatableConfig: ADTSettings;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @Input() isDistributorOffer: boolean = false;

  providers: any[] = [];
  categories: any[] = [];
  destroy$ = new Subject<void>();
  subCategoryDetails: any = null;
  subcategoryId: string | null = null;
  subcategorybyId: number;
  shouldShowFilter: boolean = false;
  considerDeleted: boolean = false;
  subCategoryListData: any =[];

  constructor(
    private _commonService: CommonService,
    private translateService: TranslateService,
    private pageInfo: PageInfoService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private _appService: AppSettingsService,
    private c3RouterService: C3RouterService,
    public _router: Router,
    private cdRef: ChangeDetectorRef,
    private toastService: ToastService,
    private _notifierService: NotifierService,
    private _unsavedChangesService: UnsavedChangesService,
    private _translateService: TranslateService,
    private location: Location,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.navigation = this._router.getCurrentNavigation();
    this.subCategoryDetails = this.navigation?.extras.state?.['subCategoryDetails'];
    if (this.subCategoryDetails == undefined || this.subCategoryDetails == null || this.subCategoryDetails == '') {
      // this._router.navigate([`partner/customoffer`]);
    }
  }

    displayFilter() {
    this.shouldShowFilter = !this.shouldShowFilter;
  }

  ngOnInit(): void {
    this.categories = ['Custom', 'LicenseSupported'];
    if (this.isDistributorOffer) {
      this.categories = ['DistributorOffers'];
    }
    const entity = this._commonService.entityName;
    if (window.location.pathname.indexOf("customoffer") != -1) {
      if (entity === 'Partner') {
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY']);
    } else if (entity === 'Reseller') {
      this.pageInfo.updateBreadcrumbs(['MENUS_SELL','MENU_BREADCRUMB_MANAGE_SUBCATEGORY'
      ]);
    }
    }
  if (window.location.pathname.indexOf("customoffer") == -1) {
      if (entity === 'Partner') {
      this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY']);
    } else if (entity === 'Reseller') {
      this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT','MENU_BREADCRUMB_MANAGE_SUBCATEGORY'
      ]);
    }
    }
      this.translateService.get('TRANSLATE.MENU_BREADCRUMB_MANAGE_SUBCATEGORY').subscribe((translated) => {
      this.pageInfo.updateTitle(translated, true);
    });
    const navigation = this._router.getCurrentNavigation();
    this.handleTableConfig();
  }
  
  onCaptureEvent(event: Event) { }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameter: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, length } =
            mapParamsWithApi(dataTablesParameter);
          const searchParams = {
            StartInd,
            Name: Name,
            SortColumn: SortColumn || null,
            SortOrder,
            PageSize: length,
            Categories: this.categories.join(","),
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            ConsiderDeleted: this.considerDeleted
          }
          const subscription = this._commonService.getSubCategoryList(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            this.subCategoryListData = Data || [];
            if (Data.length > 0) {
              [{ TotalRows: recordsTotal }] = Data;
            }
            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
          });
          this._subscriptionArray.push(subscription);
        },


        columns: [
          {
            searchable: true,
            title: this._translateService.instant('TRANSLATE.SUBCATEGORY_TABLE_HEADER_TEXT_NAME'),
            data: 'Name',
            className: "col-md-5",
            render: (data: any, type: any, row: any) => {
              let deletedInfo = '';
              if (!row.IsActive) {
                deletedInfo = `<small class="text-danger datatable-cell">${this.translateService.instant('TRANSLATE.CUSTOM_OFFERS_TEXT_INFO_DELETED')}</small>`;
              }
              return `<span class="fw-semibold">${data}</span> ${deletedInfo}`;
            },
            orderable: true,

          },
          {
            title: this._translateService.instant('TRANSLATE.SUBCATEGORY_TABLE_HEADER_TEXT_DESCRIPTION'),
            data: 'Description',
            className: "col-md-6",
            orderable: false,
          },
          {
            className: 'col-md-1 text-center',
            title: this.translateService.instant('TRANSLATE.SUBCATEGORY_TABLE_HEADER_TEXT_ACTIONS'),
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
      this.cdRef.detectChanges();
    });
  }

  editSubCategoryDetails(offer: any, offerType: string) {
    if (offerType == "add") {
      this.subcategorybyId = 0;
    }
    else {
      this.subcategorybyId = offer.Id;
    }
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = this.isDistributorOffer ? [`partner/distributoroffers/addsubcategories`] : [`partner/customoffer/addsubcategories`];
    c3Router.extras = { state: { subcategorybyId: this.subcategorybyId, offerType: offerType, isDistributorOffer: this.isDistributorOffer, CategoryName: offer?.CategoryName, ListData:this.subCategoryListData, IsActive:offer?.IsActive, IsRefresh: true} };
    c3Router.data = this.setData(offer);
    this._unsavedChangesService.c3RouterData = c3Router;
    this.c3RouterService.navigate(c3Router);
  }

  setData(offer: any) {
    return {
      Id: offer?.Id,
      provider: offer?.ProviderName,
      CategoryIds: offer?.CategoryName,
      SubCategoryName: offer?.Name,
      Description: offer?.Description
    };
  }

  deleteSubcategory(subcategory: any) {
    let confirmationText = this.translateService.instant(
      'TRANSLATE.POPUP_DELETE_SUBCATEGORY_CONFIRMATION_TEXT',
      { subCategoryName: subcategory.Name }
    );
    Swal.fire({
      title: confirmationText,
      showCancelButton: true,
      confirmButtonText: 'Ok',
      icon: 'warning',
      confirmButtonColor: 'red'
    }).then((result: { isConfirmed: any; isDenied: any }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        const subscription = this._commonService.deleteSubCategories(
          subcategory?.Id || ''
        ).pipe(takeUntil(this.destroy$)).subscribe((response) => {
          let success = this.translateService.instant(
            'TRANSLATE.POPUP_DELETE_SUBCATEGORY_SUCCESSFUL_TEXT',
            { subCategoryName: subcategory.Name }
          );
          this.toastService.success(success);
          this.reloadEvent.emit(true);
        });
        this._subscriptionArray.push(subscription);
      }
    });

  }

  searchCustomers() {
    this.reloadEvent.emit(true);
  }

  resetSearchCriteria() {
    this.considerDeleted = false;
    this.cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}




