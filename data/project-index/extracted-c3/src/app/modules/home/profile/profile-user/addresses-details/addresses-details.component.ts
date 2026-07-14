import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ProfileService } from '../../services/profile.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { NotifierService } from 'src/app/services/notifier.service';
import { AddressRowComponent } from './adress-row/adress-row.component';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { filterData } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-addresses-details1',
  templateUrl: './addresses-details.component.html',
  styleUrls: ['./addresses-details.component.scss'] // Corrected styleUrl to styleUrls
})
export class AddressesDetailsComponent1 implements OnInit, OnDestroy {
  datatableConfig: ADTSettings | any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild(C3TableComponent) c3TableComponent?: C3TableComponent;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('contactType') contactType: TemplateRef<any>;
  editor: any;
  dataTableInstance: any;
  columns: any;
  countries: any;
  addressTypes: any;
  isEditable: boolean = true;
  isEdit: boolean = true;
  entityName:any='';
  recordId:any=''
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  private destroy$ = new Subject<void>(); // Subject for managing component destruction
  _subscription: Subscription;

  constructor(
    private profileService: ProfileService,
    private cdRef: ChangeDetectorRef,
    private notifierService: NotifierService,
    private translateService: TranslateService,
    private toasterService: ToastService,
    private commonService : CommonService,
    private _appService: AppSettingsService,
  ) {
    this.entityName=commonService.entityName;
    this.recordId=commonService.recordId;
   }

  /**
   * Initializes the component and subscribes to necessary observables.
   */
  ngOnInit(): void {
    this.handleTableConfig();
    this.profileService.removeAddressRow$
      .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
      .subscribe((res) => {
        if(res){
          this.removeRow()
        }
        else{
          this.isEditable = true;
          this.isEdit = true;
          this.reloadEvent.emit();
        }
      });
  }

  /**
   * Configures the DataTable with server-side processing and columns definitions.
   */
  handleTableConfig() {
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        order: [[0, 'asc' ], [1, 'asc']],
        ajax: (dataTablesParameters: any, callback: any) => {
          this._subscription && this._subscription?.unsubscribe();
          this._subscription = this.profileService.getAddresses()
            .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
            .subscribe(({ Data }: any) => {
                let filteredData = filterData(dataTablesParameters, Data);
                    this.isEditable = true;
                    this.isEdit = true;
              callback({
                data: filteredData,
                recordsTotal: filteredData?.length,
                recordsFiltered: filteredData?.length,
              });
            });
        },
        columns: [
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_ADDRESS_TYPE'),
            data: 'ContactType',
            className: 'col-md-2',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.contactType,
              context: { captureEvents: this.onCaptureEvent.bind(this) },
            },
            searchable: true,
            orderable: true
          },
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_ADDRESS_LINE_1'),
            className: 'col-md-2',
            data: 'Line1',
            searchable: true,
            orderable: true
          },
          {
            type: 'string',
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_ADDRESS_LINE_2'),
            className: 'col-md-2 text-nowrap',
            data: 'Line2',
            text:'string',
            orderable: false
          },
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_CITY'),
            className: 'col-md-1',
            data: 'City',
            searchable: true,
            orderable: false
          },
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_COUNTRY'),
            className: 'col-md-1',
            data: 'Country',
            searchable: true,
            orderable: false
          },
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_STATE'),
            className: 'col-md-1',
            data: 'State',
            orderable: false
          },
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_ZIP'),
            className: 'col-md-1 text-end pe-2',
            data: 'Zip',
            orderable: false
          },
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_ACTIONS'),
            defaultContent: '',
            className: 'col-md-2 text-end',
            ngTemplateRef: {
              ref: this.actions,
              context: { captureEvents: this.onCaptureEvent.bind(this) },
            },
            orderable: false
          },
        ],
      };

      if (this.datatableConfig) {
        this.columns = this.datatableConfig.columns;
      }

      this.cdRef.detectChanges();
    });
  }

  /**
   * Placeholder for handling events captured from the actions template.
   * @param event The event object
   */
  onCaptureEvent(event: Event) { }

  /**
   * Adds a new address row to the table.
   */
  addAddresses() {
    this.isEditable = false;
    this.c3TableComponent?.addRow(AddressRowComponent);
  }

  /**
   * Removes the first row from the table and emits a reload event.
   */
  removeRow() {
    this.c3TableComponent?.removeRow(0);
    this.isEditable = true;
    this.isEdit = true;
    this.reloadEvent.emit();
  }

  /**
   * Edits an existing row in the table.
   * @param data The data for the row to be edited
   */
  editTableRow(data: any) {
    this.c3TableComponent?.editRow(AddressRowComponent, data);
    this.isEdit = false;
    this.isEditable = false;
  }

  /**
   * Deletes a row from the table after confirmation.
   * @param data The data for the row to be deleted
   */
  deleteTableRow(data: any) {
    const postData = {
      AddressId: data.AddressId,
      AddressTypeId: data.AddressTypeId,
      Line1: data.Line1,
      Line2: data.Line2,
      City: data.City,
      State: data.State,
      Zip: data.Zip,
      Country: data.Country,
      IsActive: false,
      IsDefault: data.IsDefault,
      ProviderId: null
    };
    const reqBody = { AddressJson: JSON.stringify(postData) };
    const confirmationMessage = this.translateService.instant('TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT');

    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        this._subscription = this.profileService.saveAdresses(reqBody)
          .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
          .subscribe(
            () => this.reloadEvent.emit(),
            () => this.toasterService.error('Unknown API error')
          );
          this.toasterService.success(this.translateService.instant('TRANSLATE.PROFILE_DELETE_TOASTER_MESSAGE_SUCCESSFUL'));
      }
    });
  }

  /**
   * Marks an address as default after confirmation.
   * @param data The data for the address to be marked as default
   */
  makeAsAddressDefault(data: any) {
    const postData = {
      AddressId: data?.AddressId,
      AddressTypeId: data.AddressTypeId,
      Line1: data.Line1,
      Line2: data.Line2,
      City: data.City,
      State: data.State,
      Zip: data.Zip,
      Country: data.Country,
      IsActive: true,
      IsDefault: data.IsDefault,
      MarkAsDefault: true
    };
    const reqBody = { AddressJson: JSON.stringify(postData) };
    const confirmationMessage = this.translateService.instant('TRANSLATE.MARK_AS_DEFAULT_ADDRESS_CONFIRMATION_PROMPT');
    //Using approve function in notifier service so that the ok button's color is green
    this.notifierService.aprrove({ title: confirmationMessage,confirmButtonText:this.translateService.instant('TRANSLATE.BUTTON_TEXT_OK') }).then((result) => {
      if (result.isConfirmed) {
        this._subscription = this.profileService.saveAdresses(reqBody)
          .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
          .subscribe(
            () => this.reloadEvent.emit(),
            () => this.toasterService.error('Unknown API error')
          );
      }
    });
  }

  /**
   * Cleanup logic when the component is destroyed.
   */
  ngOnDestroy() {
    this._subscription?.unsubscribe()
    this.destroy$.next();
    this.destroy$.complete();
  }
}
