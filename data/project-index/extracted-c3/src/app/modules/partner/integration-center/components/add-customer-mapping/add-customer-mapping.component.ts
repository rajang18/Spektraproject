import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { ThemeModeService } from 'src/app/_c3-lib/partials/layout/theme-mode-switcher/theme-mode.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { IntegrationCustomerMappingPopupComponent} from '../customer-mapping-popup/integration-customer-mapping-popup.component';
import { IntegrationCompanyMappingPopupComponent } from '../customer-mapping-popup/company-mapping-popup/company-mapping-popup.component';
import { IntegrationBusinessCentralCustomerMappingPopupComponent } from '../customer-mapping-popup/business-central/ibc-customer-mapping-popup.component';
import { BusinessCentralcustomerMappingModel } from '../../models/Business-Central-customer-mappingModel';
import { IntegrationCenterService } from '../../integration-center.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { takeUntil } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';
@Component({
  selector: 'app-add-customer-mapping',
  templateUrl: './add-customer-mapping.component.html',
  styleUrl: './add-customer-mapping.component.scss',
})
export class AddCustomerMappingComponent
  extends C3BaseComponent
  implements OnInit
{
  offerType: string = 'add';
  isEditMode: boolean = false;
  offerId: number | null = null;
  entityName: string = '';
  externalCustomerMapping: any = {};
  BusinessCentralEntityMapping= new BusinessCentralcustomerMappingModel();
  BusinessCentralcustomerMappingform: FormGroup;
  
  constructor(
    public router: Router,
    public permissionService: PermissionService,
    public dynamicTemplateService: DynamicTemplateService,
    private appsettings: AppSettingsService,
    private cdRef: ChangeDetectorRef,
    private commonService: CommonService,
    private integrationCenterService: IntegrationCenterService,
    private _notifierService: NotifierService,
    private toasterService: ToastService,
    private _translateService: TranslateService,
    private location: Location,
    private pageInfo: PageInfoService,
    public themeMode: ThemeModeService,
    public _modalService: NgbModal,
    private _fb: FormBuilder
  ) {
    super(permissionService, dynamicTemplateService, router, appsettings);
    this.hasPermission();    
    this.navigation = this._router.getCurrentNavigation();
    this.offerId = this.navigation?.extras.state?.['offerId'];
    this.offerType = this.navigation?.extras.state?.['offerType']
      ? this.navigation?.extras.state?.['offerType']
      : 'add';
    if (this.offerId && this.offerType == 'edit') {
      this.isEditMode = true;
    }

    if (this.offerId == undefined || this.offerId == null) {
      this._router.navigate([`partner/integrationcenter/customer-mapping`]);
    }
 this.BusinessCentralcustomerMappingform = this._fb.group({
      Name: [''],
      CompanyName: [''],
      BusinessCentralCustomer: [''],
    });
  }
  permissions = {
        HasGetBusinessCentralEntityMappingDetails: "Denied",
        HasAddBusinessCentralEntityMapping: "Denied",
    };

    hasPermission() {
        this.permissions.HasGetBusinessCentralEntityMappingDetails = this._permissionService.hasPermission(this.cloudHubConstants.GET_BUSINESS_CENTRAL_ENTITY_MAPPING_DETAILS);
        this.permissions.HasAddBusinessCentralEntityMapping = this._permissionService.hasPermission(this.cloudHubConstants.ADD_BUSINESS_CENTRAL_ENTITY_MAPPING);
    }
  ngOnInit(): void {
        this.pageInfo.updateTitle(this._translateService.instant("BUSINESS_CENTRAL_INTEGRATION_CENTER"), true);
    this.pageInfo.updateBreadcrumbs(['BUSINESS_CENTRAL_INTEGRATION', 'BUSINESS_CENTRAL_ADD_ENTITY_MAPPING']); 
  }

  back() {
    this.location.back();
  }

  resetForm() {
  this.BusinessCentralEntityMapping = new BusinessCentralcustomerMappingModel();
  this.BusinessCentralcustomerMappingform.reset();
  this.cdRef.detectChanges();
}

  getActiveC3Customers() {
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };
    const modalRef = this._modalService.open(IntegrationCustomerMappingPopupComponent, { size: 'xl' });
    modalRef.componentInstance.purchasedProductMapping =this.BusinessCentralEntityMapping;
    modalRef.result.then(
      (result) => {
        if (result) {

        


     
          this.BusinessCentralEntityMapping.RecordEntityName = result[0].EntityName;
          this.BusinessCentralEntityMapping.RecordName = result[0].RecordName;
          this.BusinessCentralEntityMapping.RecordC3Id = result[0].RecordC3Id
       
        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      },
    );
  }

   getActiveCompanies() {
      /* selecting Size of popup based on condition */
      const modalRef = this._modalService.open(IntegrationCompanyMappingPopupComponent, {size:'xl'});
      modalRef.componentInstance.purchasedProductMapping = this.BusinessCentralEntityMapping;
      // modalRef.componentInstance.activeServiceDetail = this.activeServiceDetail.Name;
      modalRef.result.then(
        (result) => {
          if (result) {
  
            let company = result[0];
            this.BusinessCentralEntityMapping.BusinessCentralCompanyId = company.BusinessCentralCompanyId;
            this.BusinessCentralEntityMapping.BusinessCentralCompanyName = company.BusinessCentralCompanyName;
         
    
          }
        },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        }
      );
    }

  getActiveBusinessCentralCustomers() {
      /* selecting Size of popup based on condition */
      const modalRef = this._modalService.open(IntegrationBusinessCentralCustomerMappingPopupComponent, {size:'xl'});
      modalRef.componentInstance.purchasedProductMapping = this.BusinessCentralEntityMapping;
      // modalRef.componentInstance.activeServiceDetail = this.activeServiceDetail.Name;
      modalRef.result.then(
        (result) => {
          if (result) {
  
            let businessCentralCustomer = result[0];
            //this.selectedPSACustomer = c3Customer.Name;
            // this.unMappedExternalCustomers = [];
            // this.unMappedExternalCustomers = _.filter(this.activeExternalCustomers, function (td) {
            //   return td.IsMapped === false;
            // });
  
     
  
            this.BusinessCentralEntityMapping.BusinessCentralCustomerName = businessCentralCustomer.BusinessCentralCustomerName;
            this.BusinessCentralEntityMapping.BusinessCentralCustomerId = businessCentralCustomer.BusinessCentralCustomerId;
            //this.GetActiveAgreements();
          }
        },
        (reason) => {
          /* Closing modal reference if cancelled or clicked outside of the popup*/
          modalRef.close();
        }
      );
    }
    
    SaveMappingcustomer(){

      const model = {
    RecordName : this.BusinessCentralEntityMapping.RecordName,
    RecordEntityName : this.BusinessCentralEntityMapping.RecordEntityName,
    RecordC3Id : this.BusinessCentralEntityMapping.RecordC3Id,
    BusinessCentralCompanyName :  this.BusinessCentralEntityMapping.BusinessCentralCompanyName,
    BusinessCentralCompanyId :  this.BusinessCentralEntityMapping.BusinessCentralCompanyId,
    BusinessCentralCustomerName : this.BusinessCentralEntityMapping.BusinessCentralCustomerName,
    BusinessCentralCustomerId : this.BusinessCentralEntityMapping.BusinessCentralCustomerId 
      };
      const subscription = this.integrationCenterService.MapBusinessCentralCustomers(model).pipe(takeUntil(this.destroy$))
      .subscribe((response :any) =>{
          if (response.Status === 'Success') {
                  const successMessage = this._translateService.instant('TRANSLATE.INTEGRATION_CENTER_TOASTER_SUCESSFUL_CUSTOMER_MAPPING');
                  this.toasterService.success(successMessage); 
                   setTimeout(() => {
                    this.back();
                  }, 100);
                 } 
          else{
            const errorMessage = this._translateService.instant('TRANSLATE.INTEGRATION_CENTER_TOASTER_CUSTOMER_MAPPING_ERROR_MESSAGE');
            this.toasterService.success(errorMessage);
          }   
        });
        this._subscriptionArray.push(subscription);
    }

   ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
