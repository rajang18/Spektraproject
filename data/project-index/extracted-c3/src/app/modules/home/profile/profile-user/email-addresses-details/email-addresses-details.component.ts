import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { ProfileService } from '../../services/profile.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { EmailRowComponent } from './email-row/email-row.component';
import { filterData } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-email-addresses-details1',
  templateUrl: './email-addresses-details.component.html',
  styleUrls: ['./email-addresses-details.component.scss']
})
export class EmailAddressesDetailsComponent1 implements OnInit, OnDestroy {
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
  entityName: any = '';
  recordId: any = ''
  private destroy$ = new Subject<void>(); // Subject for managing component destruction
  _subscription: Subscription;

  constructor(
    private profileService: ProfileService,
    private cdRef: ChangeDetectorRef,
    private notifierService: NotifierService,
    private translateService: TranslateService,
    private toasterService: ToastService,
    private commonService: CommonService,
    private _appService: AppSettingsService,
  ) {
    this.entityName = commonService.entityName;
    this.recordId = commonService.recordId;
  }

  ngOnInit(): void {
    this.handleTableConfig();
    this.profileService.removeEmailAddressRow$
      .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
      .subscribe((res) => {
        if (res) {
          this.removeRow()
        } else {
          this.isEditable = true;
          this.isEdit = true;
          this.reloadEvent.emit();
        }

      });
  }

  /**
   * Configures the DataTable with server-side processing and column definitions.
   */
  handleTableConfig() {
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          this._subscription && this._subscription?.unsubscribe();
          this._subscription = this.profileService.getEmails()
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
            title: this.translateService.instant('TRANSLATE.EMAIL_TABLE_HEADER_EMAIL_TYPE'),
            defaultContent: '',
            data: 'ContactType',
            className: "col-md-4",
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
            className: "col-md-4",
            data: 'EmailValue',
            searchable: true,

          },
          {
            title: this.translateService.instant('TRANSLATE.EMAIL_TABLE_HEADER_ACTIONS'),
            className: "col-md-4 text-end",
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                captureEvents: this.onCaptureEvent.bind(this),
              },
            },
            orderable: false
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
        this.profileService.saveEmails(reqBody)
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
          this.toasterService.success(this.translateService.instant('TRANSLATE.PROFILE_DELETE_TOASTER_MESSAGE_SUCCESSFUL'));
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
    this.notifierService.aprrove({ title: confirmationMessage, confirmButtonText: this.translateService.instant('TRANSLATE.BUTTON_TEXT_OK') }).then((result) => {
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
