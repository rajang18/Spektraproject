import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, interval, switchMap, takeUntil } from 'rxjs';
import { BusinessCommentsService } from '../customers/services/comments.service'; 
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { CommonModule, NgClass,DatePipe  } from '@angular/common';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Select2Module } from 'ng-select2-component';
import { TranslationModule } from '../../i18n';
import {NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NameSymbolPipe } from 'src/app/shared/pipes/name-symbol.pipe';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import * as moment from 'moment';
import { ToastService } from 'src/app/services/toast.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DateTimeFilterPipe } from "../../../shared/pipes/dateTimeFilter.pipe";
import { CommonNoRecordComponent } from '../../standalones/common-no-record/common-no-record.component';
@Component({
  selector: 'app-comments',
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
    DateTimeFilterPipe,
    CommonNoRecordComponent
],
providers: [DatePipe],  
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss']
})
export class CommentsComponent implements OnInit, OnDestroy {
  commentsTable: any;
  recentCommentsTable: any;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];
  StartDate = moment(new Date().setMonth(new Date().getMonth() - 1)).format('LL');
EndDate = moment(new Date()).format('LL');
  EffectiveTo: Date;
   EffectiveFrom: Date
  selectedCustomerC3Id: string | null;
  hideRightSideComments: boolean = false;
  newCommentsCame: boolean = false;
  polling: any;
  entityName: string;
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
    month: new Date().getMonth() , 
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
  timerHandle: Subscription;
  globalDateFormat: any;
  isRecentCommentsLoading:boolean = false;
  isUserDataLoading:boolean = false;
  shouldShowRightSide:boolean = false;

  constructor(
    private businessCommentsService: BusinessCommentsService,
    private translate: TranslateService,
    public _toastService: ToastService,
    private _commonService:CommonService,
    private cdRef: ChangeDetectorRef,
    private _appService: AppSettingsService,
    private _pageInfo: PageInfoService,


  ) {
   
   this.selectedCustomerC3Id = null;
  
  }

  ngOnInit() {
    this._pageInfo.updateTitle(this.translate.instant("ALL_COMMENTS"),true);
    this._pageInfo.updateBreadcrumbs(['partner','ALL_COMMENTS']);
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.globalDateFormat = this._appService.$rootScope.oldDateTimeFormat;
    if (this.NgbStartDate.month <= 0) {
      this.NgbStartDate.month = 12;  // December
      this.NgbStartDate.year -= 1;   // Previous year
    }
    this.getActiveCustomers();
    this.getRecentComments();   
    this.filterByCategory(this.FilterBy);
    this.pollComments();
    this._pageInfo.updateTitle(this.translate.instant("SIDEBAR_TITLE_ALL_COMMENTS"),true);
    this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_ALL_COMMENTS']);
  }

  updateStartDate(event: any) {
    this.NgbStartDate= event;
    this.StartDate = moment(event).subtract(1, 'months').format('LL');
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


  updateEndDate(event: any) {
    this.NgbEndDate = event;
    this.EndDate = moment(event).subtract(1, 'months').format('LL');
    this.maxDate =   this.NgbEndDate;
    this.getRecentComments();
    this.ReloadComments();
  }


//Not implemented yet need to be completed after customer said comment
pollComments(){
  this.timerHandle = interval(15000).pipe(takeUntil(this.destroy$),
    switchMap(() => {
      this.getRecentComments();
      if (this.newCommentsCame) {
        //this.notifier.notifySuccess(this.translate.instant('NEW_COMMENTS_RECIEVED'));
        this._toastService.success(this.translate.instant('TRANSLATE.NEW_COMMENTS_RECIEVED')); // Example message

      }
      return [];
    })
  ).subscribe();
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


 
  getActiveCustomers() {
    const subscription =  this.businessCommentsService.getActiveCustomers( this.entityName ,this.recordId ).subscribe( (response: any) => {
       this.customers = response.Data;
    }, error => {
      console.error('Error fetching active customers:', error);
    });
    this._subscriptionArray.push(subscription);
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
      const subscription =  this.businessCommentsService.createComment(this.saveModel).pipe(takeUntil(this.destroy$)).subscribe(success => {
        this.getComments(this.currentContextEntityName, this.currentContextRecordId);
        this.saveModel = {};
        this.ReloadComments();
        this.replyToComment = null;
      }, error => {
        console.error('Error creating comment:', error);
      });
      this._subscriptionArray.push(subscription);
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
      // StartDate: '2024-06-11T12:38:47.289Z'  ,
      // EndDate: '2024-07-12T12:58:57.923Z'
      StartDate: moment.utc((this.StartDate === null || this.StartDate === undefined) ? new Date() :this.StartDate).format('LL'),
    EndDate: moment.utc((this.EndDate === null || this.EndDate === undefined) ? new Date() : this.EndDate).format('LL')
    };
    const subscription =  this.businessCommentsService.getComments(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.isUserDataLoading = false;
      this.shouldShowRightSide = true;
      this.userData = response.Data;
      setTimeout(() => {
        this.cdRef.detectChanges();
          }, 1000);
      
    }, error => {
      console.error('Error getting comments:', error);
    });
    this._subscriptionArray.push(subscription);
  }

  getRecentComments() {
    this.isRecentCommentsLoading = true;
    //In the recent comment we are getting the user details on the left side
    let reqBody = {
      StartInd: 1,
      PageSize: 50,
      StartDate:moment.utc((this.StartDate === null || this.StartDate === undefined) ? new Date() :this.StartDate).format('LL'),
      EndDate:moment.utc((this.EndDate === null || this.EndDate === undefined) ? new Date() : this.EndDate).format('LL'),
      FilterBy: this.FilterBy,
      SelectedCustomerC3Id: this.selectedCustomerC3Id 
    };
    const subscription =  this.businessCommentsService.getRecentComments(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
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
    
    this._subscriptionArray.push(subscription);
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
    this.destroy$.next();
    this.destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
