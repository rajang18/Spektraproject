import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { EmailRowComponent } from './email-row/email-row.component';
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
  ],
  selector: 'app-email-addresses-details',
  templateUrl: './email-addresses-details.component.html',
  styleUrls: ['./email-addresses-details.component.scss']
})
export class EmailAddressesDetailsComponent implements  OnDestroy {
  _subscription: Subscription;
  @Input() contactEntityName : any;
  @Input() contactRecordId: any;
  datatableConfig: ADTSettings | any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild(C3TableComponent) c3TableComponent?: C3TableComponent;
  editor: any;
  dataTableInstance: any;
  isEditable: boolean = true;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('contactType') contactType: TemplateRef<any>;
  isEdit: boolean = true;
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
    this.handleTableConfig();
    this.profileService.removeEmailAddressRow$
      .pipe(takeUntil(this.destroy$)) 
      .subscribe(() => this.removeRow());
  }

  /**
   * Configures the DataTable with server-side processing and column definitions.
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
          this._subscription = this.profileService.getEmails()
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
            title: this.translateService.instant('TRANSLATE.EMAIL_TABLE_HEADER_EMAIL_TYPE'),
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
            title: this.translateService.instant('TRANSLATE.EMAIL_TABLE_HEADER_EMAIL'),
             data: 'EmailValue', 
             searchable: true,

            },
          {
            title: this.translateService.instant('TRANSLATE.EMAIL_TABLE_HEADER_ACTIONS'),
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
   * Placeholder for handling events captured from the actions template.
   * @param event The event object
   */
  onCaptureEvent(event: Event) { }

  /**
   * Adds a new email row to the table.
   */
  addEmails() {
    this.isEditable = false;
    if (this.c3TableComponent) {
      this.c3TableComponent.addRow(EmailRowComponent);
    }
  }

  /**
   * Edits an existing row in the table.
   * @param data The data for the row to be edited
   */
  editTableRow(data: any) {
    if (this.c3TableComponent) {
      this.c3TableComponent.editRow(EmailRowComponent, data);
      this.isEdit = false;
      this.isEditable = false;
    }
  }

  /**
   * Deletes a row from the table after confirmation.
   * @param data The data for the row to be deleted
   */
  deleteTableRow(data: any) {
    const postData = {
      EmailId: !!data?.EmailId ? data?.EmailId : null,
      EmailTypeId: data.EmailTypeId,
      EmailValue: data.EmailValue,
      IsActive: false,
      IsDefault: data.IsDefault,
      ProviderId: null
    };
    const reqBody = {
      EmailJson: JSON.stringify(postData)
    };
    const confirmationMessage = this.translateService.instant('TRANSLATE.DELETE_RECORD_CONFIRMATION_PROMPT');
    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        this._subscription = this.profileService.saveEmails(reqBody)
          .pipe(takeUntil(this.destroy$)) 
          .subscribe(() => {
            // Handle post-deletion logic here if needed
            this.reloadEvent.emit();
          },
            (err) => {
              const message = 'Unknown API error';
              this.toasterService.error(message);
            }
          );
      }
    });
  }

  /**
   * Removes the first row from the table and resets the editable state.
   */
  removeRow() {
    this.c3TableComponent?.removeRow(0);
    this.isEditable = true;
    this.isEdit = true;
    this.reloadEvent.emit();
  }

  /**
   * Marks an email as default after confirmation.
   * @param data The data for the email to be marked as default
   */
  makeAsEmailDefault(data: any) {
    const postData = {
      EmailId: !!data?.EmailId ? data?.EmailId : null,
      EmailTypeId: data.EmailTypeId,
      EmailValue: data.EmailValue,
      IsActive: true,
      IsDefault: data.IsDefault,
      MarkAsDefault: true
    };
    const reqBody = {
      EmailJson: JSON.stringify(postData)
    };
    const confirmationMessage = this.translateService.instant('TRANSLATE.MARK_AS_DEFAULT_EMAIL_CONFIRMATION_PROMPT');
    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        this._subscription = this.profileService.saveEmails(reqBody)
          .pipe(takeUntil(this.destroy$)) 
          .subscribe(() => {
            // Handle post-marking-as-default logic here if needed
            this.reloadEvent.emit();
          },
            (err) => {
              const message = 'Unknown API error';
              this.toasterService.error(message);
            }
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
