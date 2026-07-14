import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { pageTypes } from 'src/app/shared/models/customers.model'; 
import { TranslateService } from '@ngx-translate/core';
import { TranslationModule } from '../../i18n/translation.module';
import { AdminUsers } from 'src/app/shared/models/common';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-impersonation',
  standalone: true,
  imports: [TranslationModule,C3TableComponent,CommonModule],
  templateUrl: './customer-impersonation.component.html',
  styleUrl: './customer-impersonation.component.scss'
})
export class CustomerImpersonationComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  pageType = pageTypes.customerImpersonation;
  c3Id:string;
  adminUserList:Array<AdminUsers>;
  subscription: Subscription;
   _subscriptionArray: Subscription[] = [];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @Output() popupEvent = new EventEmitter<string>();
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('role') roleTemplate: TemplateRef<any>;
  @ViewChild('name') nameTemplate: TemplateRef<any>;
  destroy$ = new Subject<void>();
  constructor(
    private customerListingService: CustomersListingService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private _commonService:CommonService,
    private _translateService:TranslateService,
    private _appSettingsService:AppSettingsService,
    private CommonEventTrigerred:CommonEventTrigerredService,
    private _cdRef: ChangeDetectorRef
  ) { }
  ngOnInit(): void {
    const self=this;
    const subscription=this.customerListingService.getCustomerAdminUser(this.c3Id).pipe(takeUntil(this.destroy$)).subscribe(({Data} : any)=>{
      this.adminUserList = <Array<AdminUsers>>Data
            let indexOfDefault = 0;
            this.adminUserList.forEach((userData,index)=>{
              if (userData.EmailId.substring(0, 7) === "DEFAULT") {
                userData.DisplayName = this._commonService.user?.profile.name + " (" + userData.EmailId + ")";
                userData.UserRole = "";
                userData.InheritRole = 1;
                indexOfDefault = index;
              }
            })  
            let oddElement = this.adminUserList.splice(indexOfDefault, 1);
            // if array oddElement[0] , if object oddElement
            this.adminUserList.unshift(oddElement[0]);
        setTimeout(()=>{
          if (this.destroy$.closed) {
            return;
          }
          this.datatableConfig ={
            serverSide : false,
            pageLength : (this._appSettingsService.$rootScope.DefaultPageCount || 10),
            data : this.adminUserList,
            ordering : false,
            columns:[
            { 
              title: this._translateService.instant('TRANSLATE.QUICK_IMPERSONATION_TABLE_LABELS_USERS'),
              data: 'EmailId',
              className:'col-md-7',
              orderable:false,
              ngTemplateRef: {
                ref: this.nameTemplate,
                context: {
                // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self)
                  }
                }
            },
            { 
              title: this._translateService.instant('TRANSLATE.QUICK_IMPERSONATION_TABLE_LABELS_USER_ROLES'),
              data: 'UserRole' ,
              className: 'col-md-3',
              orderable: false,
              ngTemplateRef: {
              ref: this.roleTemplate,
              context: {
              // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self)
                }
              }
            },
            // {
            //   title: 'Action',
            //   render: function (data: any, type: any, full: any) {
            //     return '<button class="btn btn-primary btn-active-primary">Impersonate</button>'; // You can customize the action button here
            //   }
            // }
            {
              title: this._translateService.instant('TRANSLATE.CUSTOMER_USERS_TABLE_HEADER_TEXT_ACTIONS'),
              defaultContent: '',
              className: 'col-md-2 text-end',
              orderable: false,
              ngTemplateRef: {
                ref: this.actions,
                context: {
                // needed for capturing events inside <ng-template>
                 captureEvents: self.onCaptureEvent.bind(self)
                }
              }
            }
            ],
          };
          this._cdRef.detectChanges();
        })
    })
    this._subscriptionArray.push(subscription); 
  }

  onCaptureEvent(event: Event) {
  }

  impersonate(record:any){
    this.CommonEventTrigerred.setPopupClosed();
    let result = { userEmailId: record.EmailId, recordId: record.RecordId, c3UserId: record.C3UserId, value: record.InheritRole, roleName: record.RoleName, userRole: record.UserRole };
    this.activeModal.close(result)
  }

  closeModalPopup() {
    this.CommonEventTrigerred.setPopupClosed();
    this.modalService.dismissAll()
  }
  ngOnDestroy(): void {
    this.CommonEventTrigerred.setPopupClosed();
    this.subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }
 


}
