import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, interval, switchMap, takeUntil } from 'rxjs';
import { BusinessCommentsService } from '../../partner/customers/services/comments.service'; 
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Select2Module } from 'ng-select2-component';
import { TranslationModule } from '../../i18n';
import {NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NameSymbolPipe } from 'src/app/shared/pipes/name-symbol.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import * as moment from 'moment';
import { ToastService } from 'src/app/services/toast.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeFilterPipe } from "../../../shared/pipes/dateTimeFilter.pipe";
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';
@Component({
  selector: 'app-customer-comments',
  standalone: true,
  imports: [
    Select2Module,
    CommonModule,
    TranslationModule,
    NgClass,
    NgbDropdownModule,
    NgbDatepickerModule,
    NgSelectModule,
    NameSymbolPipe,
    LimitLengthPipe,
    NgbTooltipModule,
    CommonNoRecordComponent,
    DateTimeFilterPipe
],
providers: [DatePipe],
   templateUrl: './customer-comments.component.html',
  styleUrl: './customer-comments.component.scss'
})
export class CustomerCommentsComponent implements OnInit, OnDestroy {
  commentsTable: any;
  entityName: string;
  recentCommentsTable: any;
  StartDate = moment(new Date().setMonth(new Date().getMonth() - 1)).format('LL');
EndDate = moment(new Date()).format('LL');
  EffectiveTo: Date;
   EffectiveFrom: Date
  selectedCustomerC3Id: string | null;
  hideRightSideComments: boolean = false;
  newCommentsCame: boolean = false;
  polling: any;
  recordId: string;
  FilterBy: string = "Invoice";
  quickEditModel: any;
  replyToComment: any;
  customers: any;
  selectedCustomer :any =null;
  currentStartDate : string;
  chatData: any =[];
  userData: any=[];
  currentDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1, 
    day: new Date().getDate()
};
  maxDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1, 
    day: new Date().getDate()
  }; 
  NgbStartDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(), 
    day: new Date().getDate()
  };
  NgbEndDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth()+1 , 
    day: new Date().getDate()
  };
  currentContextRecordId: any;
  currentContextEntityName: any;
  saveModel: any={};
  sites: any;
  departments: any;
  selectedSiteC3ID: any='';
  SelectedSiteDepartmentC3ID:any= '';
  timerHandle: Subscription;
  globalDateFormat: any;
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();

  isRecentCommentsLoading:boolean = false;
  isUserDataLoading:boolean = false;
  shouldShowRightSide:boolean = false;

  constructor(
    private businessCommentsService: BusinessCommentsService,
    private translate: TranslateService,
    private _commonService:CommonService,
    private cdRef: ChangeDetectorRef,
    public _toastService: ToastService,
    private _appService: AppSettingsService,
    public _pageInfo:PageInfoService,
  ) {
   
   this.selectedCustomerC3Id = null;
  
  }

  ngOnInit() {
    this._pageInfo.updateTitle(this.translate.instant("TRANSLATE.ALL_COMMENTS"),true);
    this._pageInfo.updateBreadcrumbs(['ALL_COMMENTS']);
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.globalDateFormat = this._appService.$rootScope.oldDateTimeFormat;
    if (this.NgbStartDate.month <= 0) {
      this.NgbStartDate.month = 12;  // December
      this.NgbStartDate.year -= 1;   // Previous year
    }
    this.getRecentComments();
    this.getActiveCustomers();
    this.getSite();
    this.pollComments();
  }
  getSite() {
    const subscription = this._commonService.getSites().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.sites = response.Data;
      this.cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  updateStartDate(event: any) {
    this.NgbStartDate= event;
    this.StartDate = moment(event).subtract(1, 'months').format('LL');
    this.getRecentComments();
    this.ReloadComments();
}


  updateEndDate(event: any) {
    this.NgbEndDate= event;
    this.EndDate = moment(event).subtract(1, 'months').format('LL');
    this.maxDate = this.NgbEndDate;
    this.getRecentComments();
    this.ReloadComments();
  }

previousDate:any;
onDateSelect(event: any) {  
if(this.StartDate && this.areDatesEqual(event, this.StartDate)) {    
  return;
}  
  this.previousDate = event;   
  this.StartDate =`${(event.month)}/${(event.day)}/${event.year}`; 
}
onEndDateSelect(event: any) {   
  if (this.EndDate && this.areDatesEqual(event, this.EndDate)) {    
    return; 
  }  
  this.previousDate = event;   
  this.EndDate = `${event.month}/${event.day}/${event.year}`;
}
areDatesEqual(date1:any,date2:any):boolean
{   
  return date1.year === date2.year && date1.month === date2.month && date1.day === date2.day; 
}
  clearStartDate(datePicker: any) {
    this.NgbStartDate = null;
    this.StartDate = null; 
    this.getRecentComments();
    this.ReloadComments();
    datePicker.close(); 
  }
  clearEndDate
  (datePicker: any) {
    this.NgbEndDate = null;
    this.EndDate = null; 
    this.getRecentComments();
    this.ReloadComments();
    datePicker.close(); 
  }

pollComments(){
  const subscription = interval(15000).pipe(
    takeUntil(this.destroy$),
    switchMap(() => {
      this.getRecentComments();
      if (this.newCommentsCame) {
        //this.notifier.notifySuccess(this.translate.instant('NEW_COMMENTS_RECIEVED'));
        this._toastService.success(this.translate.instant('TRANSLATE.NEW_COMMENTS_RECIEVED')); // Example message

      }
      return [];
    })
  ).subscribe();
  this._subscriptionArray.push(subscription);
}

  onCustomerSelectionChange() {
    if (this.selectedCustomer) {
        this.selectedCustomerC3Id = this.selectedCustomer;
    } else {
        this.selectedCustomerC3Id = null;
    }
    this.getRecentComments();
    this.ReloadComments();
    
}
getSiteDepartment(): void {
  this.departments = [];
  this.SelectedSiteDepartmentC3ID = ''; 

  const selectedSite = this.sites.find(site => site.C3SiteID === this.selectedSiteC3ID);

  if (selectedSite) {
    this.departments = selectedSite.Departments || [];
  }

  this.onCustomerSelectionChange();
}


 
  getActiveCustomers() {
    this.businessCommentsService.getActiveCustomers( this.entityName ,this.recordId ).subscribe( (response: any) => {
       this.customers = response.Data;
    }, error => {
      console.error('Error fetching active customers:', error);
    });
  }

  reloadRecentComments() {
    this.recentCommentsTable.reload();
  }

  filterByCategory(categoryName: string) {
    this.FilterBy = categoryName;
    this.getRecentComments();
    this.ReloadComments();
    
  }
 
  

  createComment() {
    this.saveModel.CreateBy = this._commonService.userInfo[0].UserEmail;
    this.saveModel.EntityName = this.currentContextEntityName;
    this.saveModel.RecordId = this.currentContextRecordId;
    this.saveModel.Content = this.replyToComment;

    if(!this.saveModel?.Content || this.saveModel.Content.trim() === '') {

      this._toastService.error(this.translate.instant('TRANSLATE.ERROR_EMPTY_COMMENTS_SUBMITTED'));

    } else {
      this.businessCommentsService.createComment(this.saveModel).subscribe(success => {
        this.getComments(this.currentContextEntityName, this.currentContextRecordId);
        this.saveModel = {};
        this.ReloadComments();
        this.replyToComment = null;
      }, error => {
        console.error('Error creating comment:', error);
      });
    }
  }

  getComments(entityName:string,recordId:number) {
    this.isUserDataLoading = true;
    this.shouldShowRightSide = false;

    this.currentContextEntityName = entityName;
    this.currentContextRecordId = recordId;
    
    let reqBody = {
      EntityName: entityName,
      RecordId: recordId,
      StartInd: 1,
      PageSize: 50,
      StartDate: moment.utc((this.StartDate === null || this.StartDate === undefined) ? new Date() :this.StartDate).format('LL'),
    EndDate: moment.utc((this.EndDate === null || this.EndDate === undefined) ? new Date() : this.EndDate).format('LL')
    };
    this.businessCommentsService.getComments(reqBody).subscribe((response: any) => {
      this.isUserDataLoading = false;
      this.shouldShowRightSide = true;
      this.userData = response.Data;
      setTimeout(() => {
        this.cdRef.detectChanges();
          }, 1000);
      
    }, error => {
      console.error('Error getting comments:', error);
    });
  }

  getRecentComments() {
    
    this.isRecentCommentsLoading = false;
    //In the recent comment we are getting the user details on the left side
    let reqBody = {
      StartInd: 1,
      PageSize: 50,
      // StartDate: 'June 11, 2024',
      // EndDate:'July 12, 2024',
      StartDate: moment.utc((this.StartDate === null || this.StartDate === undefined) ? new Date() :this.StartDate).format('LL'),
      EndDate: moment.utc((this.EndDate === null || this.EndDate === undefined) ? new Date() : this.EndDate).format('LL'),
      FilterBy: this.FilterBy,
      SelectedCustomerC3Id: this.selectedCustomerC3Id,
      SelectedSiteC3ID: this.selectedSiteC3ID,
      SelectedSiteDepartmentC3ID: this.SelectedSiteDepartmentC3ID  
    };
    this.businessCommentsService.getRecentComments(reqBody).subscribe((response: any) => {
      this.isRecentCommentsLoading = false;
      if(response.Data.length >  this.chatData.length &&this.chatData.length>0){
        this.newCommentsCame = true;
      }
      else{
        this.newCommentsCame = false;
      }
      this.chatData = response.Data;
      this.ReloadComments(); 
      setTimeout(() => {
        this.cdRef.detectChanges();
          }, 1000);
      
    }, error => {
      console.error('Error getting recent comments:', error);
    });
  }

  private ReloadComments() {
    setTimeout(() => {
      if (this.chatData.length > 0) {
        const firstItem = this.chatData[0];
        this.getComments(firstItem.EntityName, firstItem.RecordId);
      } else {
        this.userData = [];
      }
      this.cdRef.detectChanges();
    }, 1000);
  }
  ngOnDestroy(): void {
    if(this.timerHandle){
      this.timerHandle.unsubscribe();
    }
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
