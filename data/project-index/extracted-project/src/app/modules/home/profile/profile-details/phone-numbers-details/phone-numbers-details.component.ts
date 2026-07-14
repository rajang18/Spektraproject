import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { PhoneNumberRowComponent } from './phone-number-row/phone-number-row.component';
import { filterData } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { Select2Module } from 'ng-select2-component';

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
  ],
  selector: 'app-phone-numbers-details',
  templateUrl: './phone-numbers-details.component.html',
  styleUrls: ['./phone-numbers-details.component.scss']
})
export class PhoneNumbersDetailsComponent implements OnInit, OnDestroy {
  @Input() contactEntityName : any;
  @Input() contactRecordId: any;
  datatableConfig: ADTSettings | any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild(C3TableComponent) c3TableComponent?: C3TableComponent;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('contactType') contactType: TemplateRef<any>;
  _subscription: Subscription;
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

  ngOnInit(): void {
    this.initializeTableConfig();
    this.setupRemoveRowListener();
  }

  /**
   * Initializes the DataTable configuration with server-side processing and column definitions.
   */
  private initializeTableConfig(): void {
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        language: {
          infoEmpty: '',
      },
        ajax: (dataTablesParameters: any, callback: any) => {
          this.isLoading = true;
          this._subscription = this.profileService.getphones()
            .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
            .subscribe(({ Data }: any) => {
            this.isLoading = false;
            let filteredData = filterData(dataTablesParameters, Data);
            this.tableData = filterData;
              callback({
                data: filteredData,
                recordsTotal: filteredData?.length,
                recordsFiltered: filteredData?.length,
              });
            }, (error:any)=>{
            this.isLoading = false;
            });
        },
        columns: [
          {
            title: this.translateService.instant('TRANSLATE.PHONE_TABLE_HEADER_PHONE_TYPE'),
            defaultContent: '',
            data: 'ContactType',
            ngTemplateRef: {
              ref: this.contactType,
              context: {
                captureEvents: this.onCaptureEvent.bind(this),
              },
            },
            searchable: true,
          },
          {
            title: this.translateService.instant('TRANSLATE.PHONE_TABLE_HEADER_PHONE_NUMBER'),
            data: 'PhoneNumber',
            searchable: true,
            type: "string"
          },
          {
            title: this.translateService.instant('TRANSLATE.PHONE_TABLE_HEADER_ACTIONS'),
            defaultContent: '',
            text: 'string',
             className: 'text-end',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                captureEvents: this.onCaptureEvent.bind(this),
              },
            },
          },
        ],
      };

      this.cdRef.detectChanges();
    });
  }

  /**
   * Sets up a listener for the removeAdditionalRow$ observable from the ProfileService.
   */
  private setupRemoveRowListener(): void {
    this.profileService.removeAdditionalRow$
      .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
      .subscribe(() => this.removeRow());
  }

  /**
   * Handles events captured from the actions template.
   * @param event The event object
   */
  onCaptureEvent(event: Event): void {
    // Implement event handling logic here if needed
  }

  /**
   * Adds a new phone row to the table.
   */
  addPhones(): void {
    this.isEditable = false;
    if (this.c3TableComponent) {
      this.c3TableComponent.addRow(PhoneNumberRowComponent);
    }
  }

  /**
   * Edits an existing phone row in the table.
   * @param data The data for the row to be edited
   */
  editTableRow(data: any): void {
    if (this.c3TableComponent) {
      this.c3TableComponent.editRow(PhoneNumberRowComponent, data);
      this.isEdit = false;
      this.isEditable = false;
    }
  }

  /**
   * Deletes a phone row from the table after confirmation.
   * @param data The data for the row to be deleted
   */
  deleteTableRow(data: any): void {
    const postData = {
      PhoneId: data.PhoneId,
      ContactTypeId: data.PhoneTypeId,
      PhoneNumber: data.PhoneNumber,
      IsActive: false,
      IsDefault: data.IsDefault,
      ProviderId: null
    };
    const reqBody = { PhoneJson: JSON.stringify(postData) };
    const confirmationMessage = this.translateService.instant('TRANSLATE.DELETE_RECORD_CONFIRMATION_PROMPT');

    this.notifierService.confirm({ title: confirmationMessage }).then(result => {
      if (result.isConfirmed) {
        this._subscription = this.profileService.savePhones(reqBody)
          .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
          .subscribe({
            next: () => this.reloadEvent.emit(),
            error: () => this.toasterService.error('Unknown API error')
          });
      }
    });
  }

  /**
   * Marks a phone number as default after confirmation.
   * @param data The data for the phone number to be marked as default
   */
  makeAsContactDefault(data: any): void {
    const postData = {
      PhoneId: data?.PhoneId,
      ContactTypeId: data?.PhoneTypeId,
      PhoneNumber: data?.PhoneNumber,
      IsActive: true,
      IsDefault: data.IsDefault,
      MarkAsDefault: true
    };
    const reqBody = { PhoneJson: JSON.stringify(postData) };
    const confirmationMessage = this.translateService.instant('TRANSLATE.MARK_AS_DEFAULT_PHONE_NUMBER_CONFIRMATION_PROMPT');

    this.notifierService.confirm({ title: confirmationMessage }).then(result => {
      if (result.isConfirmed) {
        this._subscription = this.profileService.savePhones(reqBody)
          .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
          .subscribe({
            next: () => this.reloadEvent.emit(),
            error: () => this.toasterService.error('Unknown API error')
          });
      }
    });
  }

  /**
   * Removes the first row from the table and resets the editable state.
   */
  private removeRow(): void {
    this.c3TableComponent?.removeRow(0);
    this.isEditable = true;
    this.isEdit = true;
    this.reloadEvent.emit();  
  }

  /**
   * Cleanup logic when the component is destroyed.
   */
  ngOnDestroy(){
    this._subscription?.unsubscribe()
    this.destroy$.next();
    this.destroy$.complete();
  }
}
