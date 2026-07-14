import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Renderer2, SecurityContext, TemplateRef, ViewChild } from '@angular/core';
import { AuditLogService } from '../../services/audit-log.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { NgbDateStruct, NgbOffcanvas, NgbOffcanvasOptions } from '@ng-bootstrap/ng-bootstrap';
import { AuditLogOffCanvasComponent } from '../audit-log-off-canvas/audit-log-off-canvas.component';
import { DomSanitizer } from '@angular/platform-browser';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { Router } from '@angular/router';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CommonService } from 'src/app/services/common.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import moment from 'moment';
import { FileService } from 'src/app/services/file.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss'
})
export class AuditLogComponent extends C3BaseComponent implements OnInit, OnDestroy {
  startDate: any = null;
  customer: any = {};
  endDate: any;
  customerRef: any;
  eventID: any = '';
  entityName: string | null = null;
  recordId: string | null = null;
  showHiddenAuditLog: boolean = false;
  modelKeyValues: any;
  isCollapsed = true;

  auditlog: any = []
  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('actionCol') actionCol: TemplateRef<any>;
  @ViewChild('viewCol') viewCol: TemplateRef<any>;
  @ViewChild('statusCol') statusCol: TemplateRef<any>;
  @ViewChild('createCol') createCol: TemplateRef<any>;
  childTable: ElementRef;
  // @ViewChild('name') name: ElementRef;
  // @ViewChild('content') content: TemplateRef<any>;
  isMultipleRecords: boolean;
  value: any;
  name: any;

  anyEvent: any = {}
  searchByAllCustomers: any = {}
  searchByAllDomains: any = {}

  auditLogEffectiveFrom: any;
  auditLogEffectiveTo: any;
  auditLogCustomer: any = null;
  customerDetails: any = [];
  auditLogEvent: any = null;
  auditLogCustomerRef: any = null;
  eventDetails: any = [];
  serviceProviderustomerDetails: any = [];
  customers: null;
  logDetails: any = [];
  today: Date = new Date();
  todayDate: NgbDateStruct = {
    year: this.today.getUTCFullYear(),
    month: this.today.getUTCMonth() + 1,
    day: this.today.getUTCDate()
  }
  permissions: any = {
    HasExportEventAuditLogs: "Denied",
    HasGetAuditLogs: "Denied",
    HasHiddenAuditLogChangeOption: "Denied"
  };
  dateTimeFormat:any;

  constructor(
    private _auditLogService: AuditLogService,
    private _cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    private offCanvas: NgbOffcanvas,
    private sanitizer: DomSanitizer,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    private _commonService: CommonService,
    private _fileService: FileService,
    private _appService: AppSettingsService,
    private _pageInfoService: PageInfoService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this._pageInfoService.updateBreadcrumbs([])
    this._pageInfoService.updateTitle(this._translateService.instant('TRANSLATE.MENU_PARTNER_AUDIT_LOG'), true)
    this.dateTimeFormat = this._appService.$rootScope.dateTimeFormat;
  }

  ngOnInit(): void {
    this.anyEvent = { Description: "AUDIT_LOG_SELECT_ALL_ACTION_DROPDOWN_PLACEHOLDER_TEXT", ID: '' };
    this.searchByAllCustomers = { Name: this._translateService.instant("TRANSLATE.AUDIT_LOG_SELECT_ALL_CUSTOMER_DROPDOWN_PLACEHOLDER_TEXT"), C3Id: '' };
    this.searchByAllDomains = { DomainName: this._translateService.instant("TRANSLATE.AUDIT_LOG_SELECT_ALL_DOMAINS_DROPDOWN_PLACEHOLDER_TEXT"), CustomerRefId: '' };
    this.auditLogCustomer = this.searchByAllCustomers;
    this.auditLogCustomerRef = this.searchByAllDomains;
    this.auditLogEvent = this.anyEvent;

    if (this._commonService.userContext) {
      if (this._commonService.entityName.toLowerCase() === CloudHubConstants.ENTITY_PARTNER || this._commonService.entityName.toLowerCase() === CloudHubConstants.ENTITY_RESELLER) {
        this.getEventsDetails();
        this.getCustomers();
      } else {
        this.getCustomerEventsDetails();
        this.getCustomer();
      }
    }
    this.getPermissions();
    this.handleTableConfig();
  }

  getPermissions() {
    this.permissions.HasExportEventAuditLogs = this._permissionService.hasPermission(CloudHubConstants.EXPORT_EVENT_AUDIT_LOGS)
    this.permissions.HasGetAuditLogs = this._permissionService.hasPermission(CloudHubConstants.GET_AUDIT_LOGS)
    this.permissions.HasHiddenAuditLogChangeOption = this._permissionService.hasPermission(CloudHubConstants.VIEW_HIDDEN_AUDIT_LOGS)
    this._cdRef.detectChanges();
  }

  formatDateWithMoment(dateString: any): string {
    // Parse the date string with Moment.js
    const date = moment(dateString);
  
    // Format the date as "YYYY, MM, DD"
    return date.format('YYYY, MM, DD');
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        order:[0,'desc'],
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, length } =
            mapParamsWithApi(dataTablesParameters);

          if (this.auditLogCustomer?.C3Id === undefined || this.auditLogCustomer?.C3Id === null || this.auditLogCustomer?.C3Id.trim() === '') {
            this.entityName = null;
            this.recordId = null;
          }
          else {
            this.entityName = 'Customer';
            this.recordId = this.auditLogCustomer.C3Id;
          }

          if(this._commonService.entityName !== 'Partner' && this.entityName === null && this.recordId === null){
            this.entityName = this._commonService.entityName;
            this.recordId = this._commonService.recordId;
          }

          let reqBody = {
            StartInd: StartInd,
            PageSize: length,
            SortColumn: SortColumn,
            SortOrder: SortOrder,
            StartDate: this.auditLogEffectiveFrom ? this.formatDateObject(this.auditLogEffectiveFrom) : this.formatDateWithMoment(this.today),
            EndDate: this.auditLogEffectiveTo ? this.formatDateObject(this.auditLogEffectiveTo) : this.formatDateWithMoment(this.today),
            C3CustomerId: this.auditLogCustomer && this.auditLogCustomer?.C3Id === '' ? null : this.auditLogCustomer?.C3Id,
            CustomerRef: this.auditLogCustomerRef && this.auditLogCustomerRef?.CustomerRefId === '' ? null : this.auditLogCustomerRef.CustomerRefId,
            EventId: this.auditLogEvent?.ID,
            EntityName: this.entityName,
            RecordId: this.recordId,
            IsShowOnScreen: !this.showHiddenAuditLog
          };
          
          const subscription = this._auditLogService.getAuditLog(reqBody).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            _.each(Data, (logData) => {
              logData.isCollapsed = true;
              this.eventLogDetails(logData.Data);
              logData.Data = this.modelKeyValues;
              this.logDetails.push(logData);
            });
            this.auditlog = Data;
            let recordsTotal = 0;
            if (Data.length > 0) {
              [{ TotalRecords: recordsTotal }] = Data;
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
            type: 'string',
            data: 'CreatedDate',
            className: "col-md-2",
            title: this._translateService.instant('TRANSLATE.AUDITLOG_TEXT_TABLE_HEADER_DATE'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.createCol
            }
          },
          {
            type: 'string',
            className: "col-md-3",
            title: this._translateService.instant('TRANSLATE.AUDITLOG_TEXT_TABLE_HEADER_AFFECTED_CUSTOMER'),
            data: 'CustomerName',
          },
          {

            type: 'string',
            data: 'Action',
            className: "col-md-3",
            title: this._translateService.instant('TRANSLATE.AUDITLOG_TEXT_TABLE_HEADER_ACTIONS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actionCol
            }
          },
          {
            orderable: false,
            className: "col-md-2 text-break",
            title: this._translateService.instant('TRANSLATE.AUDITLOG_TEXT_TABLE_HEADER_INITIATOR'),
            data: 'Initiator',
          },

          {
            type: 'string',
            orderable: false,
            className: "col-md-1 text-center pe-2",
            title: this._translateService.instant('TRANSLATE.ACTIVITY_LOGS_HEADER_TITLE_STATUS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.statusCol
            }
          },
          {
            type: 'string',
            orderable: false,
            className: "col-md-1 text-end text-nowrap",
            title: this._translateService.instant('TRANSLATE.AUDITLOG_TEXT_TABLE_HEADER_VIEW_DETAILS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.viewCol
            }
          },

        ],
      };
      this._cdRef.detectChanges();
    });
  }

  eventLogDetails(logData) {
    this.modelKeyValues = [];
    let jsonData = JSON.parse(logData);
    this.isMultipleRecords = (jsonData !== null || (Array.isArray(jsonData) && jsonData.length > 0)) ? true : false;
    this.getKeyValues(jsonData);
  }

  getKeyValues(model) {
    for (let name in model) {
      if (model[name] !== null && typeof model[name] === 'string') {
        model[name] = model[name].replace(/\n/g, "<br />");
      }
      if (typeof model[name] === 'object') {
        this.getKeyValues(model[name]);
      }
      else if (typeof model[name] === 'boolean') {
        this.modelKeyValues.push({ Name: name, Value: model[name] });
      }
      else if (typeof model[name] === 'number') {
        this.modelKeyValues.push(this.propertyDetails(name, model[name]));
      } 
      else {
        if (model[name] !== null && model[name] !== undefined && model[name].length > 0 && !model[name].startsWith('[') && !model[name].startsWith('{')) {
          this.modelKeyValues.push(this.propertyDetails(name, model[name]));
        }
        else if (model[name] !== null && model[name] !== undefined && model[name].length > 0 && model[name].startsWith('[') && model[name].endsWith(']')) {
          let jsonData = JSON.parse(model[name]);
          this.getKeyValues(jsonData);
        }
      }
    }

    if (this.isMultipleRecords && model !== null) {
      let objType = jQuery.type(model).toString();
      if (objType.toLowerCase() === 'object') {
        this.modelKeyValues.push(this.propertyDetails("NEW_LINE", ""));
      }
    }
  }

  propertyDetails(name, value) {
    if (typeof value !== 'number') {
      value = this.sanitizer.sanitize(SecurityContext.HTML, value);
    }

    this.name = name;
    this.value = value;
    return { Name: this.name, Value: this.value }
  }


  viewDetails(data: any) {
    const option: NgbOffcanvasOptions = {
      position: 'end',
      animation: true,
      scroll: true,
      panelClass: 'w-1000px'
    }
    const canvasRef = this.offCanvas.open(AuditLogOffCanvasComponent, option);
    canvasRef.componentInstance.auditDetails = data;
  }


  setHeaderStyle(action) {
    let status = true;
    if (action !== null && action.toLowerCase().includes("fail")) {
      status = false;
    }
    return status;
  }

  exportAuditLogData() {
    let reqBody = {
      StartInd: 1,
      PageSize: null,
      StartDate: this.auditLogEffectiveFrom ? this.formatDateObject(this.auditLogEffectiveFrom) : this.today,
      EndDate: this.auditLogEffectiveTo ? this.formatDateObject(this.auditLogEffectiveTo) : this.today,
      C3CustomerId: this.auditLogCustomer && this.auditLogCustomer?.C3Id === '' ? null : this.auditLogCustomer?.C3Id,
      CustomerRef: this.auditLogCustomerRef && this.auditLogCustomerRef?.CustomerRefId === '' ? null : this.auditLogCustomerRef.CustomerRefId,
      EventId: this.auditLogEvent?.ID,
      EntityName: this.entityName,
      RecordId: this.recordId,
      IsShowOnScreen: !this.showHiddenAuditLog
    };
    this._fileService.post('Auditlog/ExportEventAuditLogs', true, reqBody);

  }


  getEventsDetails() {
    const subscription = this._auditLogService.getEvents().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.eventDetails = [this.anyEvent];
      this.eventDetails = this.eventDetails.concat(response.Data);
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  getCustomerEventsDetails() {
    const subscription = this._auditLogService.getCustomerEvent().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.eventDetails = response.Data;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  onCustomerChange() {
    this.auditLogCustomerRef = this.searchByAllDomains;
    if (this.auditLogCustomer?.C3Id !== null && this.auditLogCustomer?.C3Id.trim() !== '') {
      const subscription = this._commonService.getServiceProviderCustomerByC3Id(this.auditLogCustomer?.C3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.serviceProviderustomerDetails = [this.searchByAllDomains];
        this.serviceProviderustomerDetails = this.serviceProviderustomerDetails.concat(response.Data);
        this._cdRef.detectChanges();
      });
      this._subscriptionArray.push(subscription);
    }
  }

  getCustomer() {
    this.customers = null;
    const subscription = this._commonService.getCustomerById().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customerDetails.push(response.Data);
      this.auditLogCustomer.C3Id = response.Data.C3Id;
      this.onCustomerChange();
      this._cdRef.detectChanges();
      this.reloadEvent.emit(true);
    });
    this._subscriptionArray.push(subscription);
  }

  getCustomers() {
    this.customers = null;
    const subscription = this._commonService.getCustomers().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customerDetails = [this.searchByAllCustomers];
      this.customerDetails = this.customerDetails.concat(response.Data);
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }

  formatDateObject(dateObj: any) {
    let {
      year,
      month,
      day
    } = dateObj;
    const mon = {
      year: year,
      month: (month as number) - 1,
      day: day,
    };
    return moment(mon).format("YYYY, MM, DD")
  }

  getLogDetails() {
    this.reloadEvent.emit(true)
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
