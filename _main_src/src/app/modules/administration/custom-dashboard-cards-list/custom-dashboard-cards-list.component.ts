import { ChangeDetectorRef, Component, EventEmitter, OnInit, Renderer2, TemplateRef, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
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
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { takeUntil } from 'rxjs';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';

@Component({
  selector: 'app-custom-dashboard-cards-list',
  templateUrl: './custom-dashboard-cards-list.component.html',
  styleUrl: './custom-dashboard-cards-list.component.scss'
})
export class CustomDashboardCardsListComponent extends C3BaseComponent implements OnInit {
  datatableConfig: ADTSettings | any;
  assignDatatableConfig: ADTSettings | any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  reloadAssignEvent: EventEmitter<boolean> = new EventEmitter();

  
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('cardTemplate') cardTemplate: TemplateRef<any>;
  @ViewChild('description') description: TemplateRef<any>;
  @ViewChild('sequenceData') sequenceData: TemplateRef<any>;
  @ViewChild('assignActions') assignActions: TemplateRef<any>;
  @ViewChild('assignAll') assignAll: TemplateRef<any>;
  
  entityName: string;
  customCardId = 0;
  title: any;
  color: any;
  link: any;
  linkText: any;
  sequence: any;
  ImageUrl: any
  customCardDetails: any  = {};
  cardForSelf: any;
  selectedCardDetails :any;
  PageMode = 'list';
  showFullDescription: any;
  hasUnAssignAccountManagerCustomer: any;
  IsAssigned: any = null;
  AssignToAllButton: any;
  isEditing: false;
  selectedValues: number[] = [];
  commaSeparatedValues: any = '';
  SortColumn:any;
  SortOrder:any;
  PageIndex:any;
  PageCount:any;
  @ViewChild('tooltipRef', { static: false }) tooltip!: NgbTooltip;

  constructor(
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private pageInfo: PageInfoService,
    private _common: CommonService,
    private _dashboardservice: CustomDashboardCardsService,
    public _commonservice: CommonService,
    private _appService: AppSettingsService, 
    private c3RouterService:C3RouterService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this._dashboardservice = _dashboardservice;
    this._notifierService = _notifierService;
    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
      this.selectedValues=this.searchParams?.selectedValues || []
    }
  }

  permissions =
    {
      HasGetCustomCardsList: "Denied",
      HasSaveCustomCards: "Denied",
      HasDeleteCustomCards: "Denied",
      HasCustomDashboardCards: "Denied",
    };

  HasPermissions() {
    this.permissions.HasGetCustomCardsList = this._permissionService.hasPermission('GET_CUSTOM_CARDS_LIST');
    this.permissions.HasSaveCustomCards = this._permissionService.hasPermission('SAVE_OR_UPDATE_CUSTOM_CARDS');
    this.permissions.HasDeleteCustomCards = this._permissionService.hasPermission('DELETE_CUSTOM_CARDS');
    this.permissions.HasCustomDashboardCards = this._permissionService.hasPermission('SIDEBAR_CUSTOM_CARDS');
  }

  ngOnInit(): void {
    this.handleTableConfig();
    this.entityName = this._common.entityName;
    this.HasPermissions();
    this.GetCustomers();
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.MENUS_CUSTOM_CARDS"),true);
    this.pageInfo.updateBreadcrumbs(['MENU_ADMINISTRATION','MENUS_CUSTOM_CARDS']);
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.close(); // Hides the tooltip
    }
  }

  toggleStatusSelection(cardType) {
    if (cardType === null) {
      if (this.selectedValues.length === 4) { 
        this.selectedValues = [];
      } else {
        this.selectedValues = [3, 2, 1, 0];
      }
    } else {
      const index = this.selectedValues.indexOf(cardType);
      if (index === -1) {
        this.selectedValues.push(cardType);
      } else {
        this.selectedValues.splice(index, 1);
      }
    }

    const allSelected = this.selectedValues.length === 4;
    if (allSelected) {
      this.selectedValues = [3, 2, 1, 0];
    }

    this.commaSeparatedValues = this.selectedValues.join(',');
    this.cdRef.detectChanges();
    this.reloadEvent.emit(true);
  }

  handleTableConfig() { 
    setTimeout(() => {
      const self = this;
      this.updatePageMode("list");
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        order:[2],
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, length} =
            mapParamsWithApi(dataTablesParameters);
          const searchParams = {
            SortColumn,
            SortOrder,
            EntityName: this._commonservice.entityName,
            RecordId: this._commonservice.recordId,
            PageCount: length - 1,
            PageIndex: (StartInd - 1) * length + 1,
            ParentEntity: this._commonservice.entityName,
            IsCustomCardAssignmentPage: false,
            CardType: this.selectedValues.join(',')
          }
          this.SortColumn=SortColumn;
          this.SortOrder=SortOrder;
          this.PageCount=length - 1;
          this.PageIndex=(StartInd - 1) * length + 1;
          const subscription = this._dashboardservice.getCustomCards(searchParams).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            Data.forEach(obj => {
              obj.isEditing = false;
            });
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalCount: recordsTotal }] = Data;
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
      this.cdRef.detectChanges();
    });
  }
  onCaptureEvent(event: Event) { }

  editCustomCard(data: any){
    const customCardData = data
    this._router.navigate([`partner/workspaceextensions/add`], {
      state: { customCardDetails: customCardData },
    });
  }

  backToCustomCard() {
    this.updatePageMode('list');
  }


  assignCard(row){
    this.updatePageMode('assign');
    this.selectedCardDetails = row;
    this.GetCustomers();
  }

  GetCustomers() { 
    setTimeout(() => {
      const self = this;
      this.assignDatatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, SortColumn, SortOrder, length,Name} =
            mapParamsWithApi(dataTablesParameters);
          const searchParams = {
            SortColumn,
            SortOrder,
            EntityName: this._commonservice.entityName,
            RecordId: this._commonservice.recordId,
            PageSize: length,
            StartInd : (StartInd - 1) * length + 1,
            EndInd: 5000,
            CardId : this.selectedCardDetails.id,
            Name:Name
          }
          const subscription = this._dashboardservice.getCustomersAssignedCards(searchParams).pipe(takeUntil(this.destroy$)).subscribe(( {Data} : any) => {
            this.AssignToAllButton = Data?.length > 0 ? Data[0].IsAssignedToAll : false;
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
            title: this._translateService.instant('TRANSLATE.PARTNER_ASSIGNED_CARD_CUSTOMERS_TABLE_HEADER_CUSTOMER_NAME'),
            data: 'Name',
            className: 'col-md-4',
            searchable:true,
            render: function (data: any, type: any, row: any) {
              return `<span class="fw-semibold">${data}</span>`;
            }
          },
          {
            title: this._translateService.instant('TRANSLATE.PARTNER_ASSIGNED_CARD_CUSTOMERS_TABLE_HEADER_ACTIONS'),
            className: 'col-md-3 text-end',
            defaultContent: '',
            orderable: false,
            ngTemplateRef: {
              ref: this.assignActions,
              context: {
                // needed for capturing events inside <ng-template>
              },
            },
          },
        ],
        
      };
      this.cdRef.detectChanges();
    });
  }

  resetCustomCardForm() {
    this.title = null;
    this.description = null;
    this.color = null;
    this.link = null;
    this.linkText = null;
    this.sequence = null;
    this.cardForSelf = null;
    this.customCardDetails['ImageUrl'] = null;
  }

  deleteCustomCardById(cardId){
    const customCardId = cardId;
    const confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_CUSTOM_CARD_CONFIRMATION_TEXT');
    this._notifierService
    .confirm({ title: confirmationText })
    .then((result: { isConfirmed: any; isDenied: any }) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        const subscription = this._dashboardservice.deleteCustomCardById(customCardId).pipe(takeUntil(this.destroy$)).subscribe((response) => {
          this.reloadEvent.emit(true);
          this._toastService.success(this._translateService.instant('TRANSLATE.POPUP_DELETE_CUSTOM_CARD_SUCCESSFUL_TEXT'));
        });
        this._subscriptionArray.push(subscription);
      }
    });
  }

  AssignToAll() {
    this.IsAssigned = 'AssignToAll';
    this._notifierService.confirmation({
      title: this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_WORKSPACE_ASSIGN_TO_ALL_CONFIRMATION'),
      confirmButtonColor: '#17C653'
    }).then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed) {
        this.AssignCustomCard(null, 'assignToAll');
      }
    });
  }

  UnAssignToAll() {
    this.IsAssigned = 'UnAssignToAll';
    this._notifierService.confirmation({
      title: this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_WORKSPACE_UNASSIGN_TO_ALL_CONFIRMATION'),
      confirmButtonColor: '#17C653'
    }).then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed) {
        this.AssignCustomCard(null, 'unassignToAll');
      }
    });
  }

  AssignCustomCard(row, action) {
    const customCardId = this.selectedCardDetails.id;
    const EntityName = (row == undefined || row == null) ? this._commonservice.entityName : row.EntityName;
    const RecordId = (row == undefined || row == null) ? this._commonservice.recordId : row.C3Id;
    const IsAssigned = this.IsAssigned;

    if (action === 'assign' || action === 'unassign') {
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
            this.GetCustomers();
            this.reloadAssignEvent.emit(true);
          });
          this._subscriptionArray.push(subscription);
        }
      });
    }
    else {
      const subscription = this._dashboardservice.assignCustomCard(customCardId, IsAssigned, EntityName, RecordId).pipe(takeUntil(this.destroy$)).subscribe(response => {
        if (action === 'assignToAll') {
          this._notifierService.success({ title: this._translateService.instant('TRANSLATE.POPUP_MESSAGE_ASSIGN_TO_ALL_CUSTOM_CARD_SUCCESSFUL_TEXT'), })
        } else if (action === 'unassignToAll') {
          this._notifierService.success({ title: this._translateService.instant('TRANSLATE.POPUP_MESSAGE_UNASSIGN_TO_ALL_CUSTOM_CARD_SUCCESSFUL_TEXT'), })
        }
        this.GetCustomers();
        this.reloadAssignEvent.emit(true);
      });
      this._subscriptionArray.push(subscription);
    }

    this.IsAssigned = null;
  }
  
  reActivateCard(row) {
    let titletext = this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_REACTIVATE_WORKSPACE_EXTENSION');
    this._notifierService.confirmation({ title: titletext, confirmButtonColor: '#17C653' }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        this.customCardId = row.id;
        this.description = row.Description;
        this.title = row.Title;
        this.color = row.Color;
        this.link = row.Link;
        this.linkText = row.LinkText;
        this.ImageUrl = row.ImageUrl;
        this.sequence = 0;
        this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_REACTIAVTE_WORKSPACE_EXTENSION_SUCCESS_MESSAGE'));
        this.saveCustomCardDetails();
      }
    });
  }

  updateSequence(row) {
    let titletext = this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_UPDATE_SEQUENCE_WORKSPACE_EXTENSION');
    this._notifierService.confirm({ title: titletext, confirmButtonColor: '#17C653' }).then((result: { isConfirmed: any, isDenied: any }) => {
      if (result.isConfirmed) {
        this.customCardId = row.id;
        this.description = row.Description;
        this.title = row.Title;
        this.color = row.Color;
        this.link = row.Link;
        this.linkText = row.LinkText;
        this.customCardDetails['ImageUrl'] = row.ImageUrl;
        this.sequence = row.Sequence; // Update the sequence in model
        this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOM_DASHBOARD_CARD_WORKSPACE_SEQUENCE_UPDATE_SUCCESS_MESSAGE'));
        this.saveCustomCardDetails(); // Save the changes
        row.isEditing = false;
      }
    });
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
    if(!row.IsActive) {
      return;
    }
    row.isEditing = true;
    row.originalSequence = row.Sequence;
    this.cdRef.detectChanges();
  }

  cancelEdit(row) {
    row.Sequence = row.originalSequence; // Restore original value
    row.isEditing = false; // Exit edit mode without saving
  }

  updatePageMode(pageMode) {
    this.PageMode = pageMode;
    // RemoveFile(null);
  }

  addCustomCard() {
    let c3Router = new C3Router();
      c3Router.keepHistory = true;
      c3Router.commands = [`partner/workspaceextensions/add`];
      c3Router.extras = {state: {}};
      c3Router.data = this.setData();
      this.c3RouterService.navigate(c3Router);
  }


  saveCustomCardDetails() {
    let cardMessageId = 0;
    if (this.customCardId != 0) {
      cardMessageId = this.customCardId
    }
    let customCardDetails = {

      Title: this.title,
      Description: this.description,
      Color: this.color,
      Link: this.link,
      LinkText: this.linkText,
      IsActive: 1,
      ImageUrl: this.ImageUrl,
      Sequence: this.sequence,
      CardForSelf: this.cardForSelf,
    }
    let customDashboardCardDetailJsonValue = JSON.stringify(customCardDetails);
    const reqBody = {
      CardMessageIdInt: cardMessageId,
      CustomDashboardCardDetailJSON: customDashboardCardDetailJsonValue,
      EntityName: this._commonservice.entityName,
      RecordId: this._commonservice.recordId,
      LoggedInUserName: this._commonservice.loggedInUserName
    };
    
    const subscription = this._dashboardservice.saveCustomCardDetails(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status == 'Success') {
        this.reloadEvent.emit(true);
        this.cdRef.detectChanges();
      }
    });
    this._subscriptionArray.push(subscription);
  }


  setData(){
    return{
            SortColumn:this.SortColumn,
            SortOrder:this.SortOrder,
            EntityName: this._commonservice.entityName,
            RecordId: this._commonservice.recordId,
            PageCount: this.PageCount,
            PageIndex: this.PageIndex,
            ParentEntity: this._commonservice.entityName,
            IsCustomCardAssignmentPage: false,
            CardType: this.selectedValues.join(','),
            selectedValues:this.selectedValues
    }
  }
}
