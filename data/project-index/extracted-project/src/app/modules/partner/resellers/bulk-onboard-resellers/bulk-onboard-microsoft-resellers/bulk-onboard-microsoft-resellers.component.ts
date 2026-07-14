import { ChangeDetectorRef, Component, ElementRef, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ResellersListingService } from '../../services/resellers-listing.service';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { TranslateService } from '@ngx-translate/core';
import { uniq } from 'lodash';
import { BulkOnboardExistingResellersViewModel } from '../../models/resellers.model';
import { NotifierService } from 'src/app/services/notifier.service';
import { ToastService } from 'src/app/services/toast.service';
import { FileService } from 'src/app/services/file.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';
@Component({
  selector: 'app-bulk-onboard-microsoft-resellers',
  templateUrl: './bulk-onboard-microsoft-resellers.component.html',
  styleUrl: './bulk-onboard-microsoft-resellers.component.scss'
})
export class BulkOnboardMicrosoftResellersComponent extends C3BaseComponent implements OnDestroy{
  nonOnboardedResellersDummy = [
    {
      "ResellerName": "Reseller 1",
      "ResellerId": "RS100000",
      "ResellerMPNID": "MPN100000",
      "Country": "USA",
      "BillingEmail": "contact1@example.com",
      "IsSelectedForOnboarding": false,
      "UniqueKey": "y0rse655a7hh7ab3a2pfyv85q0pf9n7g"
    },
    {
      "ResellerName": "Reseller 2",
      "ResellerId": "RS100001",
      "ResellerMPNID": "MPN100001",
      "Country": "India",
      "BillingEmail": "contact2@example.com",
      "IsSelectedForOnboarding": false,
      "UniqueKey": "ii4jhu11i4eiwaqvri81ifrk986q399k"
    },
    {
      "ResellerName": "Reseller 3",
      "ResellerId": "RS100002",
      "ResellerMPNID": "MPN100002",
      "Country": "Australia",
      "BillingEmail": "contact3@example.com",
      "IsSelectedForOnboarding": false,
      "UniqueKey": "p0keasaevcpd6gpghpxpvuh6yy3b1duy"
    },
    {
      "ResellerName": "Reseller 4",
      "ResellerId": "RS100003",
      "ResellerMPNID": "MPN100003",
      "Country": "France",
      "BillingEmail": "contact4@example.com",
      "IsSelectedForOnboarding": false,
      "UniqueKey": "q7vxctl4jh4lmyfe8pe0c4twfmqx3uyz"
    },
    {
      "ResellerName": "Reseller 5",
      "ResellerId": "RS100004",
      "ResellerMPNID": "MPN100004",
      "Country": "Australia",
      "BillingEmail": "contact5@example.com",
      "IsSelectedForOnboarding": false,
      "UniqueKey": "82z1tx7beudkicx4vf3sfnphgqdpds8o"
    },
    {
      "ResellerName": "Reseller 6",
      "ResellerId": "RS100005",
      "ResellerMPNID": "MPN100005",
      "Country": "India",
      "BillingEmail": "contact6@example.com",
      "IsSelectedForOnboarding": false,
      "UniqueKey": "3f6ofzc5e3imv32aq2oolg8gf4wekc4v"
    }
]

  pageMode: any;
  selectedResellersList: any[] = [];
  providerId: any;
  providerName: any;
  nonOnboardedResellers: any;
  datatableConfig: ADTSettings;
  billingEmailList: any = {};
  bulkOnboardExistingResellersViewModel: BulkOnboardExistingResellersViewModel;
  formData: FormData = new FormData();
  isuploading = false;
  isFileUploaded : boolean = false;

  @ViewChild('billingEmailColumnTemplate') billingEmailColumnTemplate: TemplateRef<any>;
  @ViewChild('fileUpload') fileUpload: ElementRef<any>;
  constructor(private _resellerService: ResellersListingService,
    public _router: Router,
    private _cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _toastService: ToastService,
    private _fileService : FileService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService, 
  ) { super(_permissionService, _dynamicTemplateService, _router, _appService);}

  ngOnInit(): void {
    if (localStorage.getItem("providerIdForResellerOnboard") === undefined || localStorage.getItem("providerIdForResellerOnboard") === null && localStorage.getItem("providerIdForResellerOnboard") !== '') {
      this._router.navigate(['partner/resellers/bulkonboardreseller']);
    }

    if (localStorage.getItem("providerIdForResellerOnboard") !== undefined && localStorage.getItem("providerIdForResellerOnboard") !== null && localStorage.getItem("providerIdForResellerOnboard") !== '') {
      this.providerId = localStorage.getItem("providerIdForResellerOnboard");
    }

    if (localStorage.getItem("providerNameForResellerOnboard") !== undefined && localStorage.getItem("providerNameForResellerOnboard") !== null && localStorage.getItem("providerNameForResellerOnboard") !== '') {
      this.providerName = localStorage.getItem("providerNameForResellerOnboard");
    }
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.BULK_ONBOARDING_RESELLERS_CAPTION_TEXT"),true);
    this.pageInfo.updateBreadcrumbs(['MENUS_SELL_INDIRECT', 'ONBOARDING_ANALYTICS_SEARCH_LABEL_RESELLERS']);
  }

  selectedOption(optionType) {
    this.pageMode = optionType;
    if (this.pageMode === 'list') {
      this.getNonOnboardedResellers();
    }
    else {
      this.selectedResellersList = [];
    }
  }

  getNonOnboardedResellers() {
    /*Start :: Original Data*/
    const subscription = this._resellerService.getNonOnboardedResellers(this.providerName).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.nonOnboardedResellers = response.Data;
      this._cdRef.detectChanges();
      this.handleTableConfig();
    },
      err => {
        if (err.error.Status === 'Error') {
          let errmsg: string = `${this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage)}\n`;
          this._toastService.error(errmsg);
        }
      }
    )
    this._subscriptionArray.push(subscription);
    /*End :: Original Data*/

    /*Start :: Dummy Data*/
    // this.nonOnboardedResellers = this.nonOnboardedResellersDummy;
    // this._cdRef.detectChanges();
    // this.handleTableConfig();
    /*End :: Dummy Data*/
  }

  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        data: this.nonOnboardedResellers,
        columns: [
          {
            searchable: true,
            title: this._translateService.instant('TRANSLATE.RESELLER_ONBOARDING_TABLE_HEADER_TEXT_RESELLER_NAME'),
            data: 'ResellerName',
            className: 'col-md-3',
            
            defaultContent: ''
          },
          {
            searchable: true,
            title: this._translateService.instant('TRANSLATE.RESELLER_ONBOARDING_TABLE_HEADER_TEXT_RESELLER_ID'),
            data: 'ResellerId',
            className: 'col-md-3',
            defaultContent: ''
          },
          {
            searchable: true,
            title: this._translateService.instant('TRANSLATE.RESELLER_ONBOARDING_TABLE_HEADER_TEXT_RESELLER_MPNID'),
            data: 'ResellerMPNID',
            className: 'col-md-2',
            defaultContent: '',
            type : 'string'
          },
          {
            title: this._translateService.instant('TRANSLATE.RESELLER_ONBOARDING_TABLE_HEADER_TEXT_RESELLER_COUNTRY'),
            data: 'Country',
            className: 'col-md-2',
            defaultContent: ''
          },
          {
            title: this._translateService.instant('TRANSLATE.RESELLER_ONBOARDING_TABLE_HEADER_TEXT_RESELLER_BILLING_EMAIL'),
            defaultContent: '',
            className: 'col-md-2',
            ngTemplateRef: {
              ref: this.billingEmailColumnTemplate,
            }
          }
        ]
      };
      this._cdRef.detectChanges();
    })
  }

  onEmailUpdate(item: any) {
    let regex = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    if (item.Email !== null && item.Email !== undefined && item.Email !== '') {
      if (regex.test(item.Email)) {
        this.billingEmailList[item.Id] = {
          value: true,
          Id: 'bulkOnboardResellers_Billing_Email_' + item.UniqueKey,
          Email: item.Email
        }
      } else {
        this.billingEmailList[item.Id] = {
          value: false,
          Id: 'bulkOnboardResellers_Billing_Email_' + item.UniqueKey,
          Email: item.Email
        }
      }
    } else {
      this.billingEmailList[item.Id] = {
        value: true,
        Id: 'bulkOnboardResellers_Billing_Email_' + item.UniqueKey,
        Email: item.Email
      }
    }
    this.nonOnboardedResellers.forEach((obj: any) => {
      if (item.ResellerId === obj.ResellerId) {
        obj.Email = item.Email;
      }
    });
  }

  checkIsAllEmailValid() {
    let isAllEmailValid = true;
    for (let i of Object.keys(this.billingEmailList)) {
      if (this.billingEmailList[i].value) {
        this.selectedResellersList.forEach((obj: any) => {
          if (obj.ResellerId === i) {
            obj.Email = this.billingEmailList[i].Email;
          }
        });
        document.getElementById(this.billingEmailList[i].Id).style.display = 'none'
      } else {
        isAllEmailValid = false;
        document.getElementById(this.billingEmailList[i].Id).style.display = 'block'
      }
    }
    return isAllEmailValid;
  }

  handleSelection(event: any) {
    this.selectedResellersList = [];
    let selectedResellersIdList: any[] = [];
    event.forEach(selectedItem => {
      selectedItem.IsSelectedForOnboarding = true;
      this.selectedResellersList.push(selectedItem);
      selectedResellersIdList.push(selectedItem.ResellerId);
    })
    //logic for removing the email input if they uncheck the Reseller
    const selectedIds = new Set(selectedResellersIdList);
    this.nonOnboardedResellers.forEach(reseller => {
      reseller.IsSelectedForOnboarding = selectedIds.has(reseller.ResellerId);
      reseller["isCheckBoxChecked"]=reseller.IsSelectedForOnboarding;
    })
    this.selectedResellersList = uniq(this.selectedResellersList);
    this._cdRef.detectChanges();
  }

  bulkOnboardResellers() {
    if (this.pageMode == "list") {
      if (!this.checkIsAllEmailValid()) {
        this._toastService.error(this._translateService.instant('TRANSLATE.BULK_ONBOARD_PLEASE_PROVIDE_VALID_EMAIL_ERROR'));
        return;
      }
      this.submit();
    }
    if (this.pageMode == "upload") {
       this.uploadResellersDetails();
    }
  }

  submit() {
    if (this.pageMode == "list") {
      if (this.selectedResellersList.length > 0) {
        this.isuploading = true;
        const keyToRemove = "isCheckBoxChecked";
        this.selectedResellersList.forEach((reseller) => {
          if (reseller.hasOwnProperty(keyToRemove)) {
            delete reseller[keyToRemove];
          }
        });
        let reqBody = {
          InputData: this.selectedResellersList,
          ProviderName: this.providerName,
          LoggedInUserName: null
        }
        const subscription =  this._resellerService.bulkOnboardResellers(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          this.isuploading = false;
          if (response.Status == "Success") {
            let title = this._translateService.instant('TRANSLATE.BULK_ONBOARD_RESELLERS_REQUEST_IS_ENQUEUED');
            this._notifierService.success({ title: title, icon: 'success', 
              customClass:{
                confirmButton:'bg-success'
              },
            }).then(() => {
              this._router.navigate(['partner/resellers/bulkonboardreseller']);
            });
          }
        })
        this._subscriptionArray.push(subscription);
      }
      else {
        this._toastService.error(this._translateService.instant('TRANSLATE.BULK_ONBOARD_RESELLERS_REQUEST_IS_ENQUEUED'));
      }
    }
  }

  downloadTemplate(){
    this._fileService.getFile(`resellers/downloadTemplate?v=${(new Date()).getTime()}`,true);
  }

  fileChange(event: any) {
    this.formData = new FormData();
    let fileList: FileList = event.target.files;
    if (fileList.length < 1) {
      return;
    }
    let file: File = fileList[0];
    //formData.append('uploadFile', file, file.name)
    this.formData.append('file', new Blob([file], { type: 'text/csv' }), file.name);
    this.isFileUploaded = true;
  }

  uploadResellersDetails(){
    if(!this.isFileUploaded){
      this._toastService.error(this._translateService.instant('TRANSLATE.BULK_UPLOAD_RESELLERS_DETAILS_FILE_NOT_PROVIDED_PROMPT'));
      return;
    }
    this.isuploading = true;
    if (this.formData != undefined && this.formData != null) {
      this.formData.append('ProviderName',this.providerName);
      const subscription =this._fileService.fileUpload('resellers/queueforonboardwithfile',true,this.formData).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.fileUpload.nativeElement.value = '';
        this.formData = null;
        this.isuploading = false;
        if (response.Status === 'Error') {
          let message = this._translateService.instant('TRANSLATE.ERROR_DESC_MISSING_OR_INVALID_TEMPLATE_FOR_BULK_UPLOAD_RESELLERS_DETAILS');
          this._toastService.error(message);
        }
        else{
          this._router.navigate(['partner/resellers/bulkonboardreseller']);
        }
      })
      this._subscriptionArray.push(subscription);
    }
  }

  backToResellers() {
      this._router.navigate(['partner/resellers']);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
