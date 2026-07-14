import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { NotifierService } from 'src/app/services/notifier.service';
import { AddressRowComponent } from './adress-row/adress-row.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { filterData } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { Select2Module } from 'ng-select2-component';

import { TenantLoadDirective } from 'src/app/shared/directives/tenant-loader.directive';
import { ProfileService } from '../../services/profile.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  standalone:true,
  imports:[ 
    CommonModule,
    C3CommonModule,
    TranslateModule,
    NgbModule,
    NgbAccordionModule,
    ReactiveFormsModule,
    C3TableComponent,
    Select2Module,
    FormsModule,
    TenantLoadDirective,],
  selector: 'app-addresses-details',
  templateUrl: './addresses-details.component.html',
  styleUrls: ['./addresses-details.component.scss'] // Corrected styleUrl to styleUrls
})
export class AddressesDetailsComponent implements OnInit, OnDestroy {
  @Input() contactEntityName : any;
  @Input() contactRecordId: any;
  datatableConfig: ADTSettings | any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild(C3TableComponent) c3TableComponent?: C3TableComponent;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('contactType') contactType: TemplateRef<any>;
  editor: any;
  dataTableInstance: any;
  _subscription: Subscription;
  columns: any;
  countries: any;
  addressTypes: any;
  isEditable: boolean = true;
  isEdit: boolean = true;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  private destroy$ = new Subject<void>(); // Subject for managing component destruction
  tableData:any;
  isLoading: boolean = false;
  constructor(
    private profileService: ProfileService,
    private cdRef: ChangeDetectorRef,
    private notifierService: NotifierService,
    private translateService: TranslateService,
    private toasterService: ToastService,
    private _appService: AppSettingsService, 
  ) { }

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
        language: {
            infoEmpty: '',
        },
        ajax: (dataTablesParameters: any, callback: any) => {
          this.isLoading = true;
          this._subscription = this.profileService.getAddresses()
            .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
            .subscribe(({ Data }: any) => {
                this.isLoading = false;
                let filteredData = filterData(dataTablesParameters, Data);
                 this.tableData = filteredData?.map((item:any)=>{
                  item['Line2'] = item['Line2'] || ''
                  return item;
                 });
              callback({
                data: filteredData,
                recordsTotal: filteredData?.length,
                recordsFiltered: filteredData?.length,
              });
            },(error:any)=>{
              this.isLoading = false;
            });
        },
        columns: [
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_ADDRESS_TYPE'),
            data: 'ContactType',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.contactType,
              context: { captureEvents: this.onCaptureEvent.bind(this) },
            },
            searchable: true,
          },
          {
            className:'text-start',
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_ADDRESS_LINE_1'),
            data: 'Line1',
            searchable: true,
          },
          {
            className:'text-start',
            text:'string',
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_ADDRESS_LINE_2'),
            data: 'Line2',
          },
          {
            className:'text-start',
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_CITY'),
            data: 'City',
            searchable: true,

          },
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_COUNTRY'),
            data: 'Country',
            searchable: true,
          },
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_STATE'),
            data: 'State'
          },
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_ZIP'),
            data: 'Zip'
          },
          {
            title: this.translateService.instant('TRANSLATE.ADDRESS_TABLE_HEADER_ACTIONS'),
            defaultContent: '',
            text:'string',
            className: 'text-end pe-8',
            ngTemplateRef: {
              ref: this.actions,
              context: { captureEvents: this.onCaptureEvent.bind(this) },
            },
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

    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
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
    this.destroy$.next();
    this.destroy$.complete();
    this._subscription?.unsubscribe()
  }
}
