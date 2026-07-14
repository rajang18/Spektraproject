import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ToastService } from 'src/app/services/toast.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Router} from '@angular/router';
import { ResellersListingService } from '../services/resellers-listing.service';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { resellerDetails, resellerNameUpdateResponse, resellersNameUpdateResponse } from 'src/app/modules/partner/resellers/models/resellers.model'; 
import { ResellerImpersonationComponent } from 'src/app/modules/standalones/reseller-impersonation/reseller-impersonation.component';
import { UserContextService } from 'src/app/services/user-context.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { MatDialog} from '@angular/material/dialog';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3DatePipe } from 'src/app/shared/pipes/dateTimeFilter.pipe';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';
import { PartnerAddressDetailsPopupComponent } from 'src/app/modules/standalones/partner-address-details-popup/partner-address-details-popup.component';
import { CommonService } from 'src/app/services/common.service';



@Component({
  selector: 'app-resellers-listing',
  templateUrl: './resellers-listing.component.html',
  styleUrl: './resellers-listing.component.scss'
})
export class ResellersListingComponent extends C3BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  datatableConfig: ADTSettings;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('accountmanager') accountmanager: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  accountManagerDetails: any;
  accountManagerName: any;
  accountManagerModalContent: any;
  //getting the flag to determine whether the support for resellers with MPN ID is there or not
  hasSupportForResellersWithMPNID: string;
  name: string = "";
  HasChangeNameAccess:string;
  HasDownloadAccess:string;
  Name:string
  StartInd:number;
  SortColumn:any;
  SortOrder:any;
  PageSize:number;

  Msg: string;
  // Permissions = {
  //   HasUpdateResellerName : this._permissionService.hasPermission('BTN_RESELLER_NAME_CHANGE') === 'Allowed',
  // };

  constructor(
    private dialog: MatDialog,
    private toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private resellersListingService:ResellersListingService,
    private router: Router,
    private _modalService: NgbModal,
    private userContext: UserContextService,
    private _notifierService: NotifierService,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private _pageInfo: PageInfoService,
    private appSettings: AppSettingsService,
    private c3RouterService:C3RouterService,
    private _commonService:CommonService
  ) {
    super(permissionService, dynamicTemplateService, router, appSettings);
    this.navigation = this._router.getCurrentNavigation();
    this.keyForData = this.navigation?.extras.state?.['keyForData']; 
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
      this.persistPropertySet();
    }
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
  ngOnInit(): void {
   this.handleTableConfig();
   this.HasPermissions();
   const subscription = this.appSettings.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
    this.hasSupportForResellersWithMPNID = response.Data.HasSupportForResellersWithMPNID;
   });
   this._subscriptionArray.push(subscription);
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._pageInfo.updateTitle(this.translateService.instant('TRANSLATE.RESELLER_BREADCRUMB_BUTTON_TEXT_RESELLER'), true);
    this._pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'RESELLER_BREADCRUMB_BUTTON_TEXT_RESELLER']);
  }
  permissions =
    {
      HasChangeNameAccess: "Denied",
      HasDownloadAccess: "Denied",
    };

     HasPermissions() {
    this.permissions.HasChangeNameAccess = this._permissionService.hasPermission(this.cloudHubConstants.BTN_RESELLER_NAME_CHANGE);
    this.permissions.HasDownloadAccess = this._permissionService.hasPermission('BTN_RESELLER_LIST_VIEW');
  }


  handleTableConfig() {
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this.appSettings.$rootScope.DefaultPageCount || 10),
        order:[1,'desc'],
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, length} = mapParamsWithApi(dataTablesParameters);
          let C3Input = this.c3RouterService.getC3Input();
          if(!C3Input && this.keyForData && this.Name){
            this.c3RouterService.setC3Input(this.Name)
          }else{
            this.Name = C3Input || ''
          }
          this.Name = this.keyForData && (Name === null || Name === undefined || Name === '')? this.Name : Name;
          this.StartInd = this.keyForData && StartInd == 1? this.StartInd : StartInd;
          this.SortColumn = this.keyForData? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData? this.SortOrder : SortOrder;
          this.keyForData = null;
          let nameFilter = Name;
          if (nameFilter === null || nameFilter === undefined || nameFilter === '') {
            nameFilter = this.Name;
          }
          this.StartInd = Number.isInteger(Number(this.StartInd)) && Number(this.StartInd) > 0 ? Number(this.StartInd) : 1;
          this.StartInd = ((this.StartInd - 1) * Number(PageSize)) + 1;
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this.resellersListingService
            .getResellers({ StartInd:this.StartInd, Name:this.Name, SortColumn:this.SortColumn, SortOrder:this.SortOrder, PageSize:PageSize, length})
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal:number =0 ;
              if(Data.length >0){
                 [{ TotalRows: recordsTotal }] = Data;
              }
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        columns: [
          {
            title: this.translateService.instant('TRANSLATE.RESELLER_TABLE_HEADER_TEXT_NAME'),
            data: 'Name',
            className: 'col-md-4',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.nameTemplate,
              context: {
                userData: {
                  field: 'Name',
                },
                // needed for capturing events inside <ng-template>
                captureEvents: self.enableEditField.bind(self),
              },
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.RESELLER_TABLE_SIGNUP_DATE'),
            data: 'SignupDate',
            className: 'col-md-4',
            render: (data: string) => {
              var datePipe = new C3DatePipe(this.appSettings);
              return datePipe.transform(data);
            },
          },
          {
            title: this.translateService.instant('TRANSLATE.RESELLER_TABLE_HEADER_TEXT_ACTIONS'),
            defaultContent: '',
            className: 'col-md-4 text-end column-title-pe-5',
            type:"string",
            orderable:false,
            ngTemplateRef: {
              ref: this.actions,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
           },
        ],
      };
      this.cdRef.detectChanges();
    });
  }
  onCaptureEvent(event: Event) {}
  
  enableEditField(data: resellerDetails) {
    const c3Id = data.C3Id;
    const subscription = this.resellersListingService
      .upDateResellerName(data, c3Id)
      .pipe(takeUntil(this.destroy$)).subscribe((response: Partial<resellerNameUpdateResponse>) => {
        if (response.Status == resellersNameUpdateResponse.success) {
          this.toastService.success(this.translateService.instant('TRANSLATE.RESELLER_NAME_UPDATE_SUCCESS')); 
        }
        else{
          this.toastService.error(this.translateService.instant('TRANSLATE.RESELLER_NAME_UPDATE_FAILURE'))
        }
      });
      this._subscriptionArray.push(subscription);
  }

  openImpersonationModal(data:any) {
    const modalRef = this._modalService.open(ResellerImpersonationComponent, {size:'lg'});
    modalRef.componentInstance.c3Id = data.C3Id;
    modalRef.result.then((response) => {
      this.proccedToImpersonate(response.recordId, response.userEmailId, response.c3UserId, response.value, response.roleName);
    }).catch((reason) => {
      console.log('Dismissed: ', reason);
    }); 
  }

  proccedToImpersonate(recordId:string, username:string, c3UserId:string, inheritRole:number, roleName:string) { 
    localStorage.setItem("EntityName", "Reseller");
    localStorage.setItem("RecordId", recordId);
    localStorage.setItem("resellerImpersonationContext", JSON.stringify({ RecordId: recordId, Username: username, InheritRole: (inheritRole === null || inheritRole === 0) ? false : true, EntityName: "Reseller", C3UserId: c3UserId, ImpersonatedFrom: "partner.resellers" }));
    this.userContext.setUserContext(null,true);
  }


  managePlans(data: any) {
    const c3Id = data.C3Id;
    this.Name=''
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/resellers/manageplans`];
    c3Router.extras = {state: { ResellerC3Id: c3Id}};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
   
    // this._router.navigate([`partner/resellers/manageplans`], {
    //   state: { ResellerC3Id: c3Id}
    // });
  }

  redirectToLinkReseller(reseller: any): void {
    const c3Id = reseller.C3Id;
    this.router.navigate(['partner/resellers/linkreseller'], { state: { reseller: reseller } });
  }

  getAccountManagerDetailsOfReseller(row: any) {
    const subscription = this.resellersListingService.getAccountManagerDetailsOfReseller(row)
    .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.accountManagerDetails = response.Data;
        if (
          this.accountManagerDetails !== null &&
          this.accountManagerDetails !== undefined &&
          this.accountManagerDetails !== ''
        ) {
          if (
            this.accountManagerDetails.FirstName !== null &&
            this.accountManagerDetails.FirstName !== undefined &&
            this.accountManagerDetails.FirstName !== ''
          ) {
            this.accountManagerName = this.accountManagerDetails.FirstName;
          }
          if (
            this.accountManagerDetails.LastName !== null &&
            this.accountManagerDetails.LastName !== undefined &&
            this.accountManagerDetails.LastName !== ''
          ) {
            this.accountManagerName =
              this.accountManagerName +
              ' ' +
              this.accountManagerDetails.LastName;
          }
          this.proceedToShowAccountManagerDetails(row.Name);
        } else {
          const confirmationText = this.translateService.instant(
            'TRANSLATE.PARTNER_CUSTOMER_IS_NOT_ASSIGNED_TO_ANY_ACCOUNT_MANAGER',
            { customer: row.Name }
          );
          this._notifierService.alert({
            title: confirmationText,
            icon: 'info',
            confirmButtonColor: '#50C878',
          });
        }
      });
      this._subscriptionArray.push(subscription);
  }

  proceedToShowAccountManagerDetails(name: string) {
    this.accountManagerModalContent = {
      Name: this.accountManagerName,
      Email: this.accountManagerDetails.Email,
      PhoneNumber: this.accountManagerDetails.PhoneNumber,
      CustomerName: name,
    };
    const modalRef = this._modalService.open(this.accountmanager);
  }

  closeModalPopup() {
    this._modalService.dismissAll();
  }

  redirectToResellerConfiguration(data:any) {
    let c3Router = new C3Router();
    c3Router.keepHistory = true;
    c3Router.commands = [`partner/resellers/resellerconfiguration`];
    c3Router.extras = {state: { reseller: data }};
    c3Router.data = this.setData()
    this.c3RouterService.navigate(c3Router);
    // this._router.navigate(['partner/resellers/resellerconfiguration'], { state: { reseller: data } });
  }

  setData(){
    return{
      Name: this.Name,
      StartInd: this.StartInd,
      SortColumn: this.SortColumn,
      SortOrder: this.SortOrder,
    }
  }

  PartnerAddressPopUp(data){
              const modalRef = this._modalService.open(PartnerAddressDetailsPopupComponent, {
                  ariaLabelledBy: 'modal-title',
                  ariaDescribedBy: 'modal-body',
                  size: 'lg',
                  backdrop: 'static',
              });
              modalRef.componentInstance.entityName = this._commonService.entityName; // Bind fetched data to the modal
              modalRef.componentInstance.recordId = data.C3Id;
              modalRef.componentInstance.isMarkAsDefault = false;
              modalRef.componentInstance.CustomerName = data.Name;
              modalRef.componentInstance.IsSelectedAddressId = data.BillFromAddressId;
              modalRef.result.then((result) => {
                  
              },
                  (reason) => {
                      /* Closing modal reference if cancelled or clicked outside of the popup*/
                      modalRef.close();
                  });
          }
    downloadPORReport() {
    const providerName = 'Microsoft';
    this.resellersListingService.downloadPORReport(providerName).subscribe({
    next: (response: Blob) => {
      const file = new Blob([response], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(file);
      link.download = `POR_Validation_Results.csv`;
      link.click();
    },
     });
    }
  reloadTable(){
    this.reloadEvent.emit(true);
  }
}
