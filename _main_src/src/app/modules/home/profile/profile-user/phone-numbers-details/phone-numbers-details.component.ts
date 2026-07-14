import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { ProfileService } from '../../services/profile.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/services/toast.service';
import { PhoneNumberRowComponent } from './phone-number-row/phone-number-row.component';
import { filterData } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-phone-numbers-details1',
  templateUrl: './phone-numbers-details.component.html',
  styleUrls: ['./phone-numbers-details.component.scss']
})
export class PhoneNumbersDetailsComponent1 implements OnInit, OnDestroy{
  datatableConfig: ADTSettings | any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild(C3TableComponent) c3TableComponent?: C3TableComponent;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('contactType') contactType: TemplateRef<any>;

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

  ngOnInit(): void {
    this.initializeTableConfig();
    this.setupRemoveRowListener();
   this.profileService.removeAdditionalRow$
      .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
      .subscribe((res) => {
        if(res){
          this.removeRow()
        }else{
          this.isEditable = true;
          this.isEdit = true;
          this.reloadEvent.emit();
        }
       
    });
  }

  /**
   * Initializes the DataTable configuration with server-side processing and column definitions.
   */
  private initializeTableConfig(): void {
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          this._subscription && this._subscription?.unsubscribe();
          this._subscription = this.profileService.getphones()
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
            title: this.translateService.instant('TRANSLATE.PHONE_TABLE_HEADER_PHONE_TYPE'),
            className: "col-md-4",
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
            type: 'string',
            title: this.translateService.instant('TRANSLATE.PHONE_TABLE_HEADER_PHONE_NUMBER'),
            data: 'PhoneNumber',
            className: "col-md-4",
            searchable: true,
          },
          {
            title: this.translateService.instant('TRANSLATE.PHONE_TABLE_HEADER_ACTIONS'),
            defaultContent: '',
            className: "col-md-4 text-end",
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
   * Sets up a listener for the removeAdditionalRow$ observable from the ProfileService.
   */
  private setupRemoveRowListener(): void {
    this.profileService.removeAdditionalRow$
      .pipe(takeUntil(this.destroy$)) // Ensure we unsubscribe when the component is destroyed
      .subscribe((res) => {
        if(res){
          this.removeRow()
        }else{
          this.isEditable = true;
          this.isEdit = true;
          this.reloadEvent.emit();
        }
       
    });
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
          this.toasterService.success(this.translateService.instant('TRANSLATE.PROFILE_DELETE_TOASTER_MESSAGE_SUCCESSFUL'));
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

    this.notifierService.aprrove({ title: confirmationMessage,confirmButtonText:this.translateService.instant('TRANSLATE.BUTTON_TEXT_OK') }).then(result => {
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
    this.reloadEvent.emit();  }

  /**
   * Cleanup logic when the component is destroyed.
   */
  ngOnDestroy() {
    this._subscription?.unsubscribe()
    this.destroy$.next();
    this.destroy$.complete();
  }
}
