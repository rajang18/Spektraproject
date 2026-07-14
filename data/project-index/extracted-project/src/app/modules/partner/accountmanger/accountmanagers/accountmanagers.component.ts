import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';
import { AccountManagerService } from 'src/app/services/account-manager.service';
import { Router } from '@angular/router';
import { NotifierService } from 'src/app/services/notifier.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { __extends } from 'tslib';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FileService } from 'src/app/services/file.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { from, of, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-accountmanagers',
  templateUrl: './accountmanagers.component.html',
  styleUrl: './accountmanagers.component.scss'
})
export class AccountmanagersComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;

  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isEditing: boolean[] = [];
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };

  shouldShowAccountFilter: boolean = false;

  accountManagerId: any = null;
  firstName: string = '';
  lastName: string = '';
  emailAddress: string = '';
  phoneNumber: string = '';
  entityName: string | null;
  recordId: string | null;
  Name:string
  StartInd:number;
  SortColumn:any;
  SortOrder:any;
  PageSize:number;

  constructor(
    private AccountManagerService: AccountManagerService,
    private _toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    public _router: Router,
    private _appService: AppSettingsService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _fileService: FileService,
    private pageInfo: PageInfoService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private c3RouterService:C3RouterService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['MENU_BREADCRUMB_BUTTON_TEXT_ACCOUNT_MANAGERS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENU_BREADCRUMB_BUTTON_TEXT_ACCOUNT_MANAGERS"),true);
    this.handleTableConfig();
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, FirstName, LastName, Email, PhoneNumber } =
            mapParamsWithApi(dataTablesParameters);
          this.Name = this.keyForData && (Name === null || Name === undefined || Name === '')? this.Name : Name == '' && this.Name? this.Name : Name;
          this.StartInd = this.keyForData && StartInd == 1? this.StartInd : StartInd;
          this.SortColumn = this.keyForData? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData? this.SortOrder : SortOrder;
          this.keyForData = null;
          const searchParams = {
            StartInd,
            Name: this.Name,
            SortColumn:this.SortColumn,
            SortOrder: this.SortOrder,
            PageSize,
            FirstName: this.firstName || FirstName,
            LastName: this.lastName || LastName,
            EmailAddress: this.emailAddress || Email,
            PhoneNumber: this.phoneNumber || PhoneNumber,
            EntityName: this.entityName,
            RecordId: this.recordId,
            AccountManagerId: this.accountManagerId
          }

          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.AccountManagerService.
            getList(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
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
            type:'string',
            title: this._translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_ACCOUNT_MANAGER_ID'),
            data: 'AccountManagerId',
            className: 'col-md-1 pe-2',
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
          },
          {
            searchable: true,
            title: this._translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_FIRST_NAME'),
            className: "col-md-2 pe-2",
            data: 'FirstName'
          },
          {
            searchable: true,
            title: this._translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_LAST_NAME'),
            data: 'LastName',
            className: 'col-md-2 pe-2',
          },
          {
            searchable: true,
            title: this._translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_EMAIL_ADDRESS'),
            data: 'Email',
            className: 'col-md-1 pe-2',
          },
          {
            type: 'string',
            searchable: true,
            title: this._translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_PHONE_NUMBER'),
            data: 'PhoneNumber',
            defaultContent:'',
            className: 'col-md-2 pe-2',
            render: function (data, type, row) {
              if (data === null || data === undefined || data === '') {
                return '';
              }
              return `<div class="text-start">${data}</div>`;
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_CREATED_DATE'),
            data: 'CreatedDate',
            className: 'col-md-3 pe-2',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this._appService);
              return datePipe.transform(data);
            }
          },
          {
            type: 'string',
            title: this._translateService.instant('TRANSLATE.ACCOUNT_MANAGERS_TABLE_HEADER_ACTIONS'),
            defaultContent: '',
            className: 'col-md-1 text-center',
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
  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }


  deleteAccountManager(accountMangerDetails: any) {
    const accountManagerId = accountMangerDetails.AccountManagerId;
    let confirmationText = this._translateService.instant('TRANSLATE.ACCOUNT_MANAGER_DELETION_DEFAULT_MESSAGE');
    const searchParams = {
      StartInd: 1,
      Name: '',
      SortColumn: 'AccountManagerId',
      SortOrder: 'ASC',
      PageSize: this.datatableConfig.pageLength,
      EndInd: 5000,
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      AccountManagerC3Id: accountMangerDetails.C3Id,
    }
    const subscription = this.AccountManagerService.getAssignedList(searchParams)
    .pipe(
      takeUntil(this.destroy$),
      switchMap((response: any) => {
        const data = response.Data;
        const assignList = data.filter((e: any) => e.IsAssignedToManager === true);

        if (assignList.length > 0) {
          confirmationText = this._translateService.instant('TRANSLATE.ACCOUNT_MANAGER_DELETION_MESSAGE_TO_NOTIFY_THE_ASSIGHNMENT');
        }

        return from(this._notifierService.confirm({ title: confirmationText })).pipe(
          switchMap((result: { isConfirmed: boolean }) => {
            if (result.isConfirmed) {
              return this.AccountManagerService.deleteAccountManager(accountManagerId);
            } else {
              return of(null); // If not confirmed, return a null observable
            }
          })
        );
      })
    ).subscribe({
      next: (response: any) => {
        if (response) {
          this.reloadEvent.emit(true);
          this._toastService.success(this._translateService.instant('TRANSLATE.ACCOUNT_MANAGER_DELETED_SUCCESS_MESSAGE'));
        }
      },
      error: (error: any) => {
        this._toastService.error(this._translateService.instant('TRANSLATE.ACCOUNT_MANAGER_DELETED_ERROR_MESSAGE'));
        console.error('Error deleting Account Manager:', error);
      }
    });

    this._subscriptionArray.push(subscription);
  }

  setData(){
    return{
      StartInd: this.StartInd,
      Name: this.Name,
      SortColumn: this.SortColumn,
      SortOrder: this.SortOrder,
      PageSize: this.PageSize,
      firstName: this.firstName,
      lastName: this.lastName,
      emailAddress: this.emailAddress,
      phoneNumber: this.phoneNumber,
      entityName: this.entityName,
      RecordId: this.recordId,
      AccountManagerId: this.accountManagerId
    }
  }

  // TO download the AcoountManger details
  downloadAccountManagerDetails() {
    const reqbody = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      FirstName: this.firstName,
      LastName: this.lastName,
      EmailAddress: this.emailAddress,
      PhoneNumber: this.phoneNumber,
      AccountManagerId: this.accountManagerId,
      StartInd: 1,
      EndInd: 5000,
      PageSize: 5000,
      SortColumn: '',
      SortOrder: '',
      WhereClauseXML: null,
      AccountManagerC3Id: null
    }
    this._fileService.getFile('reports/getAccountManagersForReports', true, reqbody);
  }


  displayFilter() {
    this.shouldShowAccountFilter = !this.shouldShowAccountFilter;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }


  searchAccountManager() {
    this.reloadEvent.emit(true);
  }

  resetAccountMangerFilter() {
    this.accountManagerId = null;
    this.firstName = '';
    this.lastName = '';
    this.emailAddress = '';
    this.phoneNumber = '';
    this.reloadEvent.emit(true);
  }

  editAccountManagerDetails(accountManager: any) {
    const accountManagerC3Id = accountManager.C3Id;
    const isEditing = true;
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/accountmanagers/addaccountmanager`];
    c3Router.extras = {state: { accountManagerC3Id: accountManagerC3Id, isEditing: isEditing }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);

    // this._router.navigate([`partner/accountmanagers/addaccountmanager`]
    //   , { state: { accountManagerC3Id: accountManagerC3Id, isEditing: isEditing } });
  }

  addAccountManager() {
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/accountmanagers/addaccountmanager`];
    c3Router.extras = {state: { }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
  }

  accountmanagercustomers(accountManager: any) {
    const accountManagerDetails = accountManager;
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/accountmanagers/accountmanagercustomers`];
    c3Router.extras = {state: { accountManagerDetails: accountManagerDetails } };
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
    //this._router.navigate([`partner/accountmanagers/accountmanagercustomers`] , { state: { accountManagerDetails: accountManagerDetails } });
  }
  
}
