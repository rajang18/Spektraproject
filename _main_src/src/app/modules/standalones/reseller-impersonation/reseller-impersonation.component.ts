import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { C3TableComponent } from '../c3-table/c3-table.component';
import { TranslationModule } from '../../i18n/translation.module';
import { ADTSettings } from 'angular-datatables/src/models/settings'; 
import { AdminUsers } from 'src/app/shared/models/common';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { CustomersListingService } from 'src/app/services/customers-listing.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonEventTrigerredService } from 'src/app/services/common-event-trigerred.service';

@Component({
  selector: 'app-reseller-impersonation',
  standalone: true,
  imports: [TranslationModule,C3TableComponent],
  templateUrl: './reseller-impersonation.component.html',
  styleUrl: './reseller-impersonation.component.scss'
})
export class ResellerImpersonationComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings; 
  c3Id:string;
  adminUserList:Array<AdminUsers>;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @Output() popupEvent = new EventEmitter<string>();
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('role') roleTemplate: TemplateRef<any>;
  @ViewChild('name') nameTemplate: TemplateRef<any>;
  
  constructor(
    private customerListingService: CustomersListingService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private _commonService:CommonService,
    private _translateService:TranslateService,
    private _appService: AppSettingsService, 
    private CommonEventTrigerred : CommonEventTrigerredService,
    private _cdRef: ChangeDetectorRef
  ) { }
  ngOnInit(): void {
    const self=this;
    const subscription=this.customerListingService.getResellerImpersonation(this.c3Id).pipe(takeUntil(this.destroy$)).subscribe(({Data} : any)=>{
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
          if (indexOfDefault > -1) {
            const [element] = this.adminUserList.splice(indexOfDefault, 1);
            if (element != null) {
              this.adminUserList.unshift(element);
            }
          }
        setTimeout(()=>{
          this.datatableConfig={
            serverSide : false,
            pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
            data : this.adminUserList,
            ordering : false,
            columns : [
              { 
                title: this._translateService.instant('TRANSLATE.QUICK_IMPERSONATION_TABLE_LABELS_USERS'),
                data: 'EmailId',
                className: 'col-md-7',
                orderable: false,
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
              data: 'UserRole',
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
               title: this._translateService.instant('TRANSLATE.QUICK_IMPERSONATION_TABLE_LABELS_ACTION'),
                defaultContent: '',
                orderable: false,
                className: 'col-md-2 text-end',
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
    let result = { userEmailId: record.EmailId, recordId: record.RecordId, c3UserId: record.C3UserId, value: record.InheritRole, roleName: record.RoleName };
    this.activeModal.close(result)
  }

  closeModalPopup() {
    this.CommonEventTrigerred.setPopupClosed();
    this.modalService.dismissAll()
  }
  ngOnDestroy(): void {
    this.CommonEventTrigerred.setPopupClosed();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
 


}

