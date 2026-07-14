import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import {  NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AccountManagerService } from 'src/app/services/account-manager.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-accountmanager-customerlist',
  templateUrl: './accountmanager-customerlist.component.html',
  styleUrl: './accountmanager-customerlist.component.scss'
})
export class AccountmanagerCustomerlistComponent extends C3BaseComponent implements OnInit, OnDestroy {
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  datatableConfig: ADTSettings;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  accountManagerDetails: any = null;

  constructor(
    private AccountManagerService: AccountManagerService,
    private _toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    public _router: Router,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private pageInfo:PageInfoService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService
  ){
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.navigation = this._router.getCurrentNavigation();
    this.accountManagerDetails = this.navigation?.extras.state?.['accountManagerDetails'];
    if(this.accountManagerDetails == undefined || this.accountManagerDetails == null || this.accountManagerDetails == ''){
      this._router.navigate([`partner/accountmanagers`]);
    }
  }
  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.PARTNER_ACCOUNT_MANAGER_CUSTOMERS_PAGE_TITLE_WITH_NAME",{ FirstName: this.accountManagerDetails.FirstName + ' ' +  this.accountManagerDetails.LastName  } ),true);
    this.pageInfo.updateBreadcrumbs(['PARTNER_ACCOUNT_MANAGER_CUSTOMERS_PAGE_TITLE'])
    this.handleTableConfig();
  }
  
  handleTableConfig() {
    setTimeout(() =>{
      const self = this;
      this.datatableConfig = {
        serverSide:true,
        pageLength:(this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameter:any, callback: any) => {
          const {StartInd, Name, SortColumn, SortOrder, PageSize, C3Id } =
          mapParamsWithApi(dataTablesParameter);
          const searchParams = {
              StartInd,
              Name: Name,
              SortColumn: SortColumn || null,
              SortOrder,
              PageSize,
              EntityName: this._commonService.entityName,
              RecordId: this._commonService.recordId,
              C3Id:C3Id,
              AccountManagerC3Id: this.accountManagerDetails.C3Id
          }
          const subscription =  this.AccountManagerService.getAcccountManagerCustomers(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
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
            searchable: true,
            title: this._translateService.instant('TRANSLATE.PARTNER_ACCOUNT_MANAGER_CUSTOMERS_TABLE_HEADER_CUSTOMER_NAME'),
            data: 'Name',
            className : "col-md-5",
            render : function(data:any){
              return `<span class="fw-semibold">${data}</span>`
            },
            orderable:true,

          },
          {
            searchable: true,
            title: this._translateService.instant('TRANSLATE.PARTNER_ACCOUNT_MANAGER_CUSTOMERS_TABLE_HEADER_INTERNAL_ID'),
            data: 'C3Id',
            className : "col-md-6",
            orderable:false,
          },
          {
            type: 'string',
            title: this._translateService.instant('TRANSLATE.PARTNER_ACCOUNT_MANAGER_CUSTOMERS_TABLE_HEADER_ACTIONS'),
            data:'IsAssignedToManager',
            className : "col-md-1",
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable:false,
          },
        ],
      };
      this.cdRef.detectChanges();
    })
  }
  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}

  assign(details:any){
    const assignCustomerDetails = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      AccountManagerC3Id: this.accountManagerDetails.C3Id,
      EntityNameOfUserToBeAssigned: details.EntityName,
      RecordIdOfUserToBeAssigned: details.C3Id,
    }
    let confirmationText = this._translateService.instant('TRANSLATE.ASSIGN_CUSTOMER_TO_ACCOUNT_MANAGER_CONFIRMATION',{customer:details.Name, accountManager:(this.accountManagerDetails.FirstName + ' ' + this.accountManagerDetails.LastName)});

    if(details !== null && details != undefined){
      this._notifierService.confirm({ title: confirmationText, confirmButtonColor:'#50C878'}).then((result: {isConfirmed: any;}) =>{
        if(result.isConfirmed){
          const subscription = this.AccountManagerService.assignCustomerToAnAccountManager(assignCustomerDetails).pipe(takeUntil(this.destroy$)).subscribe(
           (response:any) => {
            this.reloadEvent.emit(true);
                if(response.Status == 'Success'){
                  if(details.EntityName == 'Customer'){
                    this._toastService.success(this._translateService.instant('TRANSLATE.ASSIGN_CUSTOMER_TO_ACCOUNT_MANAGER_SUCCESS_MESSAGE'));
                  }
                  else if (details.EntityName == 'Reseller'){
                    this._toastService.success(this._translateService.instant('TRANSLATE.ASSIGN_RESELLER_TO_ACCOUNT_MANAGER_SUCCESS_MESSAGE'));
                  }
                  this.c3RouterService.setC3Input();
                  this.c3RouterService.setC3Input('',1);
                }
           }
         )
         this._subscriptionArray.push(subscription);
        }
      });
    }
  }

  unAssign(details:any){
    const unAssignCustomerDetails = {
      EntityName: this._commonService.entityName,
      RecordId: this._commonService.recordId,
      AccountManagerC3Id: this.accountManagerDetails.C3Id,
      EntityNameOfUserToBeUnAssigned: details.EntityName,
      RecordIdOfUserToBeUnAssigned: details.C3Id,
    }
    let confirmationText = this._translateService.instant('TRANSLATE.UNASSIGN_CUSTOMER_TO_ACCOUNT_MANAGER_CONFIRMATION',{customer:details.Name});

    if(details !== null && details != undefined){
      this._notifierService.confirm({ title: confirmationText}).then((result: {isConfirmed: any;}) =>{
        if(result.isConfirmed){
          const subscription = this.AccountManagerService.unAssignCustomerOfAnAccountManager(unAssignCustomerDetails).pipe(takeUntil(this.destroy$)).subscribe(
           (response:any) => {
            this.reloadEvent.emit(true);
              if(response.Status == 'Success'){
                if(details.EntityName == 'Customer'){
                  this._toastService.success(this._translateService.instant('TRANSLATE.UNASSIGN_CUSTOMER_OF_AN_ACCOUNT_MANAGER_SUCCESS_MESSAGE'));
                }
                else if (details.EntityName == 'Reseller'){
                  this._toastService.success(this._translateService.instant('TRANSLATE.UNASSIGN_RESELLER_OF_AN_ACCOUNT_MANAGER_SUCCESS_MESSAGE'));
                }
                this.c3RouterService.setC3Input();
                this.c3RouterService.setC3Input('',1);
              }
          }
         )
         this._subscriptionArray.push(subscription);
        }
      });
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
 

  backToList(){
    this.c3RouterService.backToHistory(this.keyForData,`partner/accountmanagers`);
  }

}
