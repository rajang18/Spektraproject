import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModalOptions, NgbModalRef, NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { EngageService } from '../../../service/engage.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { C3tableService } from 'src/app/modules/standalones/c3-table/c3table.service';

@Component({
  selector: 'app-engage-entities',
  templateUrl: './engage-entities.component.html',
  styleUrl: './engage-entities.component.scss'
})
export class EngageEntitiesComponent implements OnInit {
  datatableConfig: ADTSettings;
  updatedcustomerDetails: any[] = [];
  jsonData: any = null;
  customerDetails: any;
  entityName: string;
  recordId: string;
  modalRef: NgbModalRef;
  isChecked: boolean = false;
  customers: any[] = [];
  _subscription: Subscription;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];
  selectedCustomer: any[] = [];

  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('name') name: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };

  constructor(
    private _engageService: EngageService,
    private _modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    public _router: Router,
    private activemodal: NgbActiveModal,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private c3tableService: C3tableService
  ) {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
  }

  ngOnInit(): void {
    this.handleTableConfig();
  }

  handleTableConfig() {
    const self = this;
    const subscription = this._engageService.getAllActiveCustomers(
      {
        StartInd: 1,
        EndInd: 100000,
        PageSize: 100000
      }
    ).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.customerDetails = Data;
      let oldSelectedCustomer: any[] = [];
      if (this.selectedCustomer && this.selectedCustomer.length > 0) {
        this.selectedCustomer.forEach((item: any) => {
          if (this.customerDetails && this.customerDetails.length > 0) {
            oldSelectedCustomer.push(this.customerDetails.find((v: any) => v.ID == item.ID));
          }
        });
      }
      this.c3tableService.totalRecord = this.customerDetails.length;
      this.c3tableService.setPreviousSelectedData(oldSelectedCustomer);
      this.customers = oldSelectedCustomer;
      setTimeout(() => {
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
          paging: false,
          data: Data,
          ordering: false,
          scrollY: '300px',
          search: true,
          columns: [
            {
              className: 'col-12',
              type: 'string',
              data: 'Name',
              orderable: false,
              // defaultContent: '',
              // ngTemplateRef: {
              // ref: this.name,
              // context: {
              //   // needed for capturing events inside <ng-template>
              //   captureEvents: self.onCaptureEvent.bind(self),
              // },
              //},
            },
          ],
        };
        this.cdRef.detectChanges();
      });
    });
    this._subscriptionArray.push(subscription);
  }

  onCaptureEvent(event: Event) { }

  enableEditField(data: any) { }

  handleSelection(event: any) {
    this.customers = event;
  }

  onsubmit() {
    this.activemodal.close(this.customers);
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe()
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

  closeModal() {
    this._modalService.dismissAll();
  }
}