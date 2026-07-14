import { ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { CustomDashboardCardsService } from '../services/custom-dashboard-cards.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-custom-dashboard-cards-assignment',
  templateUrl: './custom-dashboard-cards-assignment.component.html',
  styleUrl: './custom-dashboard-cards-assignment.component.scss'
})
export class CustomDashboardCardsAssignmentComponent extends C3BaseComponent implements OnInit {
  datatableConfig: ADTSettings | any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('cardTemplate') cardTemplate: TemplateRef<any>;
  @ViewChild('description') description: TemplateRef<any>;
  @ViewChild('sequenceData') sequenceData: TemplateRef<any>;
  entityName: string;
  selectedCustomer: any;
  showFullDescription: any;
  hasUnAssignAccountManagerCustomer: any;
  customers: any[];
  customCardDetails: any;
  sequence: any;
  customCardId: any;
  title: any;
  color: any;
  link: any;
  linkText: any;
  AssignedSequenceData: any = [];
  havingCustomer: boolean = false;

  
  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private pageInfo: PageInfoService,
    private _dashboardservice: CustomDashboardCardsService,
    public _commonservice: CommonService,
    private _appService: AppSettingsService, 

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this._dashboardservice = _dashboardservice;
    this._notifierService = _notifierService;
  }

  ngOnInit(): void {
    this.HasPermissions();
    this.getCustomers();
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENUS_CUSTOM_CARDS"),true);
    this.pageInfo.updateBreadcrumbs(['MENU_ADMINISTRATION','MENUS_CUSTOM_CARDS']);
  }

  permissions =
    {
      HasDeleteCustomCards: "Denied",
      HasSaveCustomCards: "Denied",
    };

  HasPermissions() {
    this.permissions.HasDeleteCustomCards = this._permissionService.hasPermission(('DELETE_CUSTOM_CARDS'));
    this.permissions.HasSaveCustomCards = this._permissionService.hasPermission('SAVE_OR_UPDATE_CUSTOM_CARDS');
  }

  getCustomers() {
    this.customers = [];
    const subscription = this._dashboardservice.getCustomers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      const data = response.Data;
      this.customers = _.union(this.customers, data);
      this.selectedCustomer = this.customers.length > 0 ? this.customers[0] : null;
      // Handle if no customer is selected
      this.havingCustomer = !!this.selectedCustomer;
      this.handleTableConfig();
    });
    this._subscriptionArray.push(subscription);
  }

  AssignCustomCard(index, action) {
    const customCardId = index.id;
    const EntityName = this.selectedCustomer.EntityName;
    const RecordId = this.selectedCustomer.C3Id;
    const IsAssigned = null;

    let titletext: string;
    if (action === 'assign') {
      titletext = this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_WORKSPACE_ASSIGN_CONFIRMATION');
    } else if (action === 'unassign') {
      titletext = this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_WORKSPACE_UNASSIGN_CONFIRMATION');
    }
    this._notifierService.confirmation({
      title: titletext,
      confirmButtonColor: '#17C653'
    }).then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed) {
        const subscription = this._dashboardservice.assignCustomCard(customCardId, IsAssigned, EntityName, RecordId).pipe(takeUntil(this.destroy$)).subscribe(response => {
          if (action === 'assign') {
            this._toastService.success(this._translateService.instant('TRANSLATE.TOASTER_MESSAGE_ASSIGN_CUSTOM_CARD_SUCCESSFUL_TEXT'));
          } else if (action === 'unassign') {
            this._toastService.success(this._translateService.instant('TRANSLATE.TOASTER_MESSAGE_UNASSIGN_CUSTOM_CARD_SUCCESSFUL_TEXT'));
          }
          this.reloadEvent.emit(true);
        });
        this._subscriptionArray.push(subscription);
      }
    });
  }
  
  handleTableConfig() { 
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        order:[2,'asc'],
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, length} =
            mapParamsWithApi(dataTablesParameters);
          const searchParams = {

            EntityName: (this.selectedCustomer?.EntityName != null) ? this.selectedCustomer.EntityName :this._commonservice.entityName,
            RecordId: (this.selectedCustomer?.EntityName != null) ? this.selectedCustomer.C3Id :this._commonservice.recordId,
            PageSize: length,
            StartInd: (StartInd - 1) * length + 1,
            EndInd: 5000,
            SortColumn,
            SortOrder,
            ParentEntity: this._commonservice.entityName
          }
          const subscription = this._dashboardservice.getAssignCards(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            Data.forEach(obj => {
              obj.isEditing = false;
            });
            this.AssignedSequenceData = Data;
            this.customCardDetails = Data;
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
            title: this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_HEADER_CARD'),
            data: 'Title', 
            className: 'col-md-3',
            orderable: false,
            ngTemplateRef: {
              ref: this.cardTemplate,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_HEADER_DESCRIPTION'),
            data: 'Description',
            className: 'col-md-4 body-alignment-normal',
            orderable: false,
            defaultContent: '',
            ngTemplateRef: {
              ref: this.description,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_HEADER_SEQUENCE'),
            data: 'Sequence',
            className: 'col-md-2 text-end pe-6',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.sequenceData,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_HEADER_ACTIONS'),
            className: 'col-md-3 text-end padding-end-10',
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
      this.reloadEvent.emit(true);
      this.cdRef.detectChanges();
    });
  }
  onCaptureEvent(event: Event) { }

  reloadTable(){
    this.reloadEvent.emit(true);
  }

  validatePositiveNumber(event: any, row: any) {
    // Ensure the input is not negative
    if (event.target.value < 0) {
      event.target.value = 0; // Reset to 0 if a negative number is entered
      row.Sequence = 0; // Ensure that the model is also updated
    }
    // Remove non-numeric characters except numbers
    event.target.value = event.target.value.replace(/[^0-9]/g, '');
    if (event.target.value.length > 2) {
      event.target.value = event.target.value.slice(0, 2); // Trim extra digits
    }
    row.Sequence = event.target.value;
  }

  editSequence(row) {
    row.isEditing = true;
    row.originalSequence = row.Sequence;
    this.cdRef.detectChanges();
  }

 
  saveCardAssignmentDetails(index) {
    const data = {
      CardId: this.customCardDetails[index].id,
      EntityName: (this.selectedCustomer?.EntityName != null) ? this.selectedCustomer.EntityName : this._commonservice.entityName,
      RecordId: (this.selectedCustomer?.EntityName != null) ? this.selectedCustomer.C3Id : this._commonservice.recordId,
      NewSequence: this.sequence
    };

    const subscription = this._dashboardservice.saveCardAssignmentDetails(data).pipe(takeUntil(this.destroy$)).subscribe(response => {
      this._toastService.success(
      this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_WORKSPACE_SEQUENCE_UPDATE_SUCCESS_MESSAGE'));
      this.reloadEvent.emit(true);
    });
    this._subscriptionArray.push(subscription);
  }

  updateSequence(row, index?: any) {
    let titletext = this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_UPDATE_SEQUENCE_WORKSPACE_EXTENSION');
    this._notifierService.confirm({ title: titletext, confirmButtonColor: '#17C653' }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        this.sequence = row.Sequence; // Update the sequence in model
        let idx = this.AssignedSequenceData.findIndex((item: any) => item.id == row.id);
        this.saveCardAssignmentDetails(index || idx); // Save the changes
        row.isEditing = false;
      }
    });
  }

  cancelEdit(row) {
    row.Sequence = row.originalSequence; // Restore original value
    row.isEditing = false; // Exit edit mode without saving
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
