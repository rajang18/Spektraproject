import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, Subscription, takeUntil} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { BuisnessService } from 'src/app/services/buisness.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-report-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    InfiniteScrollModule
  ],
  templateUrl: './report-popup.component.html',
  styleUrl: './report-popup.component.scss'
})
export class ReportPopupComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  formSubmitted: boolean = false;
  _subscription: Subscription;
  fileType: any = 'csv';
  email: string = '';
  public _subscriptionArray: Subscription[] = []; 

  ShowTextArea = false;
  isMailClicked = false;
  isEmailValid = true;
  SelectAllColumn = false;
  showFavoriteButton: boolean = false;
  @Input() viewFavouriteBtn?: boolean = false;
  private destroy$ = new Subject<void>;
  @Input() public reportConfig: ReportPopupConfig;
  constructor(private _modalService: NgbModal, public activeModal: NgbActiveModal, private _fb: FormBuilder,
     private _unsavedChangesService:UnsavedChangesService,
     private _buisnessService: BuisnessService,
     private _toastService: ToastService,
     private _translateService: TranslateService,
  ) {
    this.formGroup = this._fb.group({
      email: ['', [Validators.required, Validators.pattern(/^(([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,}|\d+)(\]?)(\s*(;|,)\s*|\s*$))+/)]],
      method: ['download']
    });
  }

  ngOnInit(): void {
    // this.reportConfig.EmailInstructionText = "SEND_EMAIL_FOR_PRODUCT_CATALOGUE_TEXTAREA_TEXT";
    // this.reportConfig.EmailInstructionText = this.reportConfig.EmailInstructionText;
    // this.reportConfig.isSubmitButton = true;
    // this.reportConfig.actionTooltipText = this.reportConfig.actionTooltipText;
    if (this.reportConfig.Columns !== null && this.reportConfig.Columns !== undefined && this.reportConfig.Columns.length > 0) {
      this.reportConfig.Columns.forEach((item: any) => {
        if (item.IsMandatory || item.FavouriteColumns==1) {
          item.IsChecked = true;
        } else {
          item.IsChecked = false;
        }
      });
    }
  }

  saveOrUpdatefavourateColumn(){
    var moduleName = "partner.business.revenue.invoicelineitemscustomreport";
    let columns = this.reportConfig.Columns?.filter((item:any)=> item.IsChecked && !item.IsMandatory).map((item:any)=> item.ColumnName);
    let req = {
        columnsList: columns.join(','),
        moduleName: moduleName
    }
    const subscription = this._buisnessService.saveOrUpdateFavouriteColumns(req).pipe(takeUntil(this.destroy$)).subscribe((res:any)=>{
      this._toastService.success(this._translateService.instant("SAVE_FAVOURITE_COLUMN_NOTIFIER"));
    },((error:any)=>{
    }))
    this._subscriptionArray.push(subscription);
  }

  onSubmit() {
    this.formSubmitted = true;
    if (this.reportConfig.IsSubHeaderAvailable && this.formGroup.get('method')?.value === 'email') {
      if (this.formGroup.valid) {
        var data = {
          FileType: this.fileType,
          Email: this.email,
          Columns: this.reportConfig.Columns
        }
        this.activeModal.close(data);
        //this.submit();
      } else {
        return;
      }
    } else {
      var data = {
        FileType: this.fileType,
        Email: this.email,
        Columns: this.reportConfig.Columns
      }
      this.activeModal.close(data);
    }


  }

  toggletextArea(value: boolean) {
    if (!value) {
      // if chosen download init email ng-model to null
      this.email = '';
      this.isEmailValid = true;
      this.isMailClicked = false;
    } else {
      this.isEmailValid = false;
    }
    this.ShowTextArea = value;
  }


  closeModalPopup() {
    this.activeModal.close();
    this._modalService.dismissAll();
  }

  selectAllColumnFunction() {

    this.reportConfig.Columns.map((e: any) => {
      if (this.SelectAllColumn == true && e.IsMandatory == false) {
        e.IsChecked = true;
      }
      else if (this.SelectAllColumn == false && e.IsMandatory == false) {
        e.IsChecked = false;
      }
    });
  }

  optionToggled() {
    this.showFavoriteButton = true;
    this.SelectAllColumn = this.reportConfig.Columns.every((item: any) => {
      return item.IsChecked;
    });

  }
  checkboxValueChanged(): void {
    this.showFavoriteButton = true;
  }

  validateEmail() {
    var validRegex = /^(([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,}|\d+)(\]?)(\s*(;|,)\s*|\s*$))+/;
    if (this.email.match(validRegex)) {
      this.isEmailValid = true;
      // cc.DownloadPartnerOffersReportByFileType();
    } else {
      this.isEmailValid = false;
    }
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
    this._subscription?.unsubscribe()
  }
}
