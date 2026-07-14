import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import { FormBuilder, FormGroup} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ProductMappingService } from '../services/productmapping.service';
import { PurchasedProductMappingModel } from '../Models/purchasedProductMappingModel';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import _ from 'lodash';
import { ToastService } from 'src/app/services/toast.service';
import { EntityMappingService } from '../services/entitymapping.service';
import { EntityMappingPSACustomerPopupComponent } from 'src/app/modules/standalones/product-mapping-popups/new-entity-mapping-popup/entity-mapping-psa-customer-popup/entity-mapping-psa-customer-popup.component';
import { EntityMappingContractPopupComponent } from 'src/app/modules/standalones/product-mapping-popups/new-entity-mapping-popup/entity-mapping-contract-popup/entity-mapping-contract-popup.component';
import { EntityMappingCustomerNamePopUPComponent } from 'src/app/modules/standalones/product-mapping-popups/new-entity-mapping-popup/entity-mapping-customer-name-pop-up/entity-mapping-customer-name-pop-up.component';
import { Subject, takeUntil} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { ThemeModeService } from 'src/app/_c3-lib/partials/layout/theme-mode-switcher/theme-mode.service';


@Component({
  selector: 'app-entitymapping',
  templateUrl: './entitymapping.component.html',
  styleUrl: './entitymapping.component.scss'
})
export class EntitymappingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  providerName: string;
  providerDetails: any[];
  purchasedProductMappingForm: FormGroup;
  ServiceProviderCustomers: any[];
  CustomerConsentModel: any = [];
  specialQualificationDetails: any = [];
  categories: any = [];
  categoryName: any = [];
  isGridDataLoading: boolean = false;
  cpvApplicationID: string = '';
  reservedInstancesCategory = false;
  currentIndex: any = null;
  CustomerName: any = null;
  purchasedProductMapping = new PurchasedProductMappingModel();
  existingMapping: any = [];
  activeServiceDetail: any = [];
  externalMappedCustomer: any = [];
  unMappedExternalCustomers: any = [];
  activeExternalCustomers: any = [];
  activeExternalProducts: any = [];
  activeBillingCycles: any = [];
  mappedEntity: any = [];
  mappedProducts: any = [];
  providerTenants: any = [];
  defaultCategorySelection: { Description: '--All categories--', ID: null };
  defaultTenantSelection: { CustomerName: '--All tenants--', ServiceProviderCustomerId: null };
  selectedContract: any;
  selectedContractBillingCycle: any = [];
  c3ProductsList: any = [];
  showCategoryIsMandatory: boolean = false;
  activeProductsDatatableConfig: ADTSettings;
  @ViewChild('textBox') textBox: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('actionHeader') actionHeader: TemplateRef<any>;
  @ViewChild('specialQualificationsModal') specialQualificationsModal: TemplateRef<any>; 


  constructor(private _translateService: TranslateService,
    private _commonService: CommonService,
    public _permissionService: PermissionService,
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    private _fb: FormBuilder,
    private _appService:AppSettingsService,
    public _route: ActivatedRoute,
    public _dynamicTemplateService: DynamicTemplateService,
    private _modalService: NgbModal,
    private notifierService: NotifierService,
    private toastService: ToastService,
    private _productMappingService: ProductMappingService,
    private _entityMappingService: EntityMappingService,
    private _unsavedChangesService: UnsavedChangesService,
    private _pageInfo: PageInfoService,
    public themeMode:ThemeModeService

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    _route.params.subscribe((params: any) => {
      this.providerName = params['providerName']
    })

    this.purchasedProductMappingForm = this._fb.group({
      customerName: [''],
      psaCustomerName: [''],
      contractServiceId: [''],
      contractServiceName: [''],
      mappedExternalProductId: [''],
    });


  }

  ngOnInit(): void {
    this.getActiveServiceDetails();
    this.getBillingCycle();
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'])
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"), true);
  }

  getActiveServiceDetails() {
    const subscription = this._entityMappingService.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.activeServiceDetail = response.Data;
    })
    this._subscriptionArray.push(subscription);
  }

  getActiveC3Customers() {
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };
    const modalRef = this._modalService.open(EntityMappingCustomerNamePopUPComponent, {size: 'xl'});
    modalRef.componentInstance.purchasedProductMapping = this.purchasedProductMapping;
    modalRef.result.then(
      (result) => {
        if (result) {
          
          let c3Customer = result[0];
          this.purchasedProductMapping.C3Id = c3Customer.C3Id;
          this.purchasedProductMapping.EntityId = c3Customer.EntityId;
          this.purchasedProductMapping.RecordId = c3Customer.ID;
          this.unMappedExternalCustomers = [];
          this.unMappedExternalCustomers = _.filter(this.activeExternalCustomers, function (td) {
              return td.IsMapped === false;
          });
          this.mappedEntity.ExternalCustomerId = null;
          this.mappedEntity.AgreementId = null;
          this.purchasedProductMapping.ExternalCustomerId = null;
          this.purchasedProductMapping.ExternalCustomerName = null;
          this.purchasedProductMapping.AgreementId = null;
          this.purchasedProductMapping.AgreementName = null;
          this.purchasedProductMapping.AgreementStartDate = null;
          this.purchasedProductMapping.AgreementEndDate = null;
          this.purchasedProductMapping.BillingCycleId = null;
          this.purchasedProductMapping.BillingCycleName = null;
          this.purchasedProductMapping.IsDefault = false;
          this.purchasedProductMapping.CategoryId = null;
          this.purchasedProductMapping.ServiceProviderCustomerId = null;
          this.purchasedProductMapping.CustomerName = c3Customer.Name;
          this.purchasedProductMapping.C3Id = c3Customer.C3Id
          this.purchasedProductMapping.CustomerId = c3Customer.ID;

          this.getActiveExternalMappedCustomer();
          this.getProviderTenants();

        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  getProviderTenants() {
    if (this.purchasedProductMapping.C3Id && this.purchasedProductMapping.C3Id !== null) {
      const subscription = this._productMappingService.getProviderTenants(this.purchasedProductMapping.C3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Data && response.Data.length > 1) {
          this.providerTenants = [this.defaultTenantSelection]
          this.providerTenants = this.providerTenants.concat(response.Data);
        }
      })
      this._subscriptionArray.push(subscription);
    }

  }

  getCategories() {
    let postReq = {
      ExternalServiceName: this.activeServiceDetail.Name,
      EntityId: this.purchasedProductMapping.EntityId,
      RecordId: this.purchasedProductMapping.RecordId,
      ExternalCustomerId: this.purchasedProductMapping.ExternalCustomerId,
      AgreementId: this.purchasedProductMapping.AgreementId
    };
    const subscription = this._entityMappingService.getCategories(postReq).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.categories = response.Data;
      
      this.categoryName = _.filter(this.categories, function (td) {
        return td.ID === this.purchasedProductMapping.CategoryId;
      });
      this.purchasedProductMapping.CategoryId = this.categoryName[0].ID
    })
    this._subscriptionArray.push(subscription);
  }

  getActiveEntites() {
    const moduleName = 'partner.plan';
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };
    const modalRef = this._modalService.open(EntityMappingPSACustomerPopupComponent, {size: 'xl'});
    modalRef.componentInstance.purchasedProductMapping = this.purchasedProductMapping;
    modalRef.result.then(
      (result) => {
        if (result) {
          
          let psaCustomer = result[0];
          //this.selectedPSACustomer = c3Customer.Name;
          this.purchasedProductMappingForm.get('psaCustomerName').setValue(result.Name);
          this.unMappedExternalCustomers = [];
          this.unMappedExternalCustomers = _.filter(this.activeExternalCustomers, function (td) {
            return td.IsMapped === false;
          });

          this.purchasedProductMapping.AgreementId = null;
          this.purchasedProductMapping.AgreementName = null;
          this.purchasedProductMapping.AgreementStartDate = null;
          this.purchasedProductMapping.AgreementEndDate = null;
          this.purchasedProductMapping.BillingCycleId = null;
          this.purchasedProductMapping.BillingCycleName = null;
          this.purchasedProductMapping.IsDefault = false;
          this.purchasedProductMapping.CategoryId = null;
          this.purchasedProductMapping.ServiceProviderCustomerId = null;

          this.mappedEntity.ExternalCustomerId = null;
          this.mappedEntity.AgreementId = null;

          this.purchasedProductMapping.ExternalCustomerName = psaCustomer.Name;
          this.purchasedProductMapping.ExternalCustomerId = psaCustomer.Id;
          //this.GetActiveAgreements();

        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }


  getActiveContracts() {
    const moduleName = 'partner.plan';
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };
    const modalRef = this._modalService.open(EntityMappingContractPopupComponent, {size: 'xl'});
    modalRef.componentInstance.purchasedProductMapping = this.purchasedProductMapping;
    modalRef.componentInstance.activeServiceDetail = this.activeServiceDetail.Name;

    modalRef.result.then(
      (result) => {
        if (result) {
          
          let selectedAgreement = result[0];
          this.selectedContract = selectedAgreement.Name;
          this.purchasedProductMapping.AgreementId = selectedAgreement.Id
          this.selectedContractBillingCycle = selectedAgreement.BillingCycle;
          this.purchasedProductMapping.AgreementName = selectedAgreement.Name;
          this.purchasedProductMapping.AgreementStartDate = selectedAgreement.StartDate;
          this.purchasedProductMapping.AgreementEndDate = selectedAgreement.EndDate;
          this.purchasedProductMapping.IsDefault = null;
          this.purchasedProductMapping.CategoryId = null;
          this.purchasedProductMapping.ServiceProviderCustomerId = null;

          if (selectedAgreement.BillingCycle !== undefined && selectedAgreement.BillingCycle !== null) {
            var billingCycle = _.filter(this.activeBillingCycles, function (td) {
              return td.Name.toLowerCase() == selectedAgreement.BillingCycle.toLowerCase();
            });
            this.purchasedProductMapping.BillingCycleId = billingCycle[0].ID;
            this.purchasedProductMapping.BillingCycleName = billingCycle[0].Name;
            this.purchasedProductMapping.BillingCycleDescriptionKey = billingCycle[0].Description;
          }
          
          this.getMapping();
          this.getCategories();
        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  getBillingCycle() {
    const subscription = this._commonService.getBillingCycles().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.activeBillingCycles = response;
      
    })
    this._subscriptionArray.push(subscription);
  }

  getMapping() {
    let postReq = {
      ExternalServiceName: this.activeServiceDetail.Name,
      EntityId: this.purchasedProductMapping.EntityId,
      RecordId: this.purchasedProductMapping.RecordId,
      ExternalCustomerId: this.purchasedProductMapping.ExternalCustomerId,
      AgreementId: this.purchasedProductMapping.AgreementId
    };

    const subscription = this._productMappingService.getMapping(postReq).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.existingMapping = response.Data;
      
      if (this.existingMapping.EntityMappings) {
        this.purchasedProductMapping.IsDefault = this.existingMapping.EntityMappings.IsDefault;
        this.purchasedProductMapping.CategoryId = this.existingMapping.EntityMappings.CategoryId;
        this.purchasedProductMapping.ServiceProviderCustomerId = this.existingMapping.EntityMappings.ServiceProviderCustomerId;
      } else {
        this.purchasedProductMapping.IsDefault = false;
      }
      if (this.existingMapping !== undefined && this.existingMapping !== null && this.existingMapping.EntityMappings !== undefined && this.existingMapping.EntityMappings !== null) {
        this.mappedEntity.ExternalCustomerId = this.existingMapping.EntityMappings.ExternalCustomerId;
        this.mappedEntity.AgreementId = this.existingMapping.EntityMappings.ContractId;
      }
      else {
        this.mappedEntity.ExternalCustomerId = null;
        this.mappedEntity.AgreementId = null;
        this.getActiveExternalMappedCustomer();
      }
    });
    this._subscriptionArray.push(subscription);

  }

  getActiveExternalMappedCustomer() {
    let customerC3Id = this.purchasedProductMapping.C3Id
    const subscription = this._productMappingService.getActiveExternalMappedCustomer(customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.externalMappedCustomer = response.Data;
      
      this.PushMappedExternalCustomerForUISelect();

      if (this.externalMappedCustomer !== undefined && this.externalMappedCustomer !== null) {
        if (this.externalMappedCustomer.Id !== undefined && this.externalMappedCustomer.Id !== null) {
          this.mappedEntity.ExternalCustomerId = this.externalMappedCustomer.Id;
          this.purchasedProductMapping.ExternalCustomerId = this.externalMappedCustomer.Id;
          this.purchasedProductMapping.ExternalCustomerName = this.externalMappedCustomer.Name;
          //this.GetActiveAgreements();
        }
      }

    });
    this._subscriptionArray.push(subscription);
  }

  PushMappedExternalCustomerForUISelect() {
    if (this.externalMappedCustomer && this.externalMappedCustomer.Id) {
      let matchingExternalCustomer = this.activeExternalCustomers.find((map: any) => {
        return map.Id == this.externalMappedCustomer.Id;
      });

      if (matchingExternalCustomer && matchingExternalCustomer.Id) {
        this.unMappedExternalCustomers.push(matchingExternalCustomer);
      } else {
        //If this.activeExternalCustomers has not been loaded yet
        this.unMappedExternalCustomers.push({
          Id: this.externalMappedCustomer.Id,
          Name: this.externalMappedCustomer.Name
        });
      }
    }
  }


  onCaptureEvent(event: Event) { }

  OnCategoryBlur(){
    this.showCategoryIsMandatory = true;
  }

  SaveMapping() {
    if(this.purchasedProductMapping.CategoryId !== null){
      this.showCategoryIsMandatory = false;
      const confirmationMessage = this._translateService.instant('TRANSLATE.ENTITY_MAPPING_MAPPING_CONFIRM_TEXT_SAVE_MAPPING', { customerName: this.purchasedProductMapping.CustomerName });
      this.notifierService.confirm({ title: confirmationMessage,confirmButtonColor:'green' }).then((result) => {
        if (result.isConfirmed) {
          let data = this.purchasedProductMapping;
  
          let postReq = {
            ExternalServiceId: this.activeServiceDetail.Id,
            ExternalServiceName: this.activeServiceDetail.Name,
            EntityId: this.purchasedProductMapping.EntityId,
            RecordId: this.purchasedProductMapping.RecordId,
            CustomerName: this.purchasedProductMapping.CustomerName,
            CustomerId: this.purchasedProductMapping.CustomerId,
            CustomerC3Id: this.purchasedProductMapping.C3Id,
            ExternalCustomerId: this.purchasedProductMapping.ExternalCustomerId,
            ExternalCustomerName: this.purchasedProductMapping.ExternalCustomerName,
            ContractId: this.purchasedProductMapping.AgreementId,
            ContractName: this.purchasedProductMapping.AgreementName,
            ContractStartDate: this.purchasedProductMapping.AgreementStartDate,
            ContractEndDate: this.purchasedProductMapping.AgreementEndDate,
            BillingCycleId: this.purchasedProductMapping.BillingCycleId,
            BillingCycleName: this.purchasedProductMapping.BillingCycleName,
            IsDefault: this.purchasedProductMapping.IsDefault,
            CategoryId: this.purchasedProductMapping.CategoryId,
            ServiceProviderCustomerId: this.purchasedProductMapping.ServiceProviderCustomerId
          };
          
          const subscription = this._entityMappingService.saveEntityMapping(postReq).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
  
            let mappingResult = response.Data;
            if (mappingResult && mappingResult.MessageKey) {
              this.toastService.success(
                this._translateService.instant('TRANSLATE.' + mappingResult.MessageKey)
              );
            } else {
              if (mappingResult && mappingResult.DefaultDisabledContracts) {
                this.toastService.success(
                  this._translateService.instant('TRANSLATE.ENTITY_MAPPING_NOTIFIER_TEXT_DISABLED_DEFAULT_CONTRACTS', { ContractNames: mappingResult.DefaultDisabledContracts })
                );
              }
              this.toastService.success(
                this._translateService.instant('TRANSLATE.ENTITY_MAPPING_NOTIFIER_TEXT_MAPPING_SAVED_SUCCESSFULLY')
              );
              this._router.navigate(['partner/business/subscriptionhistory'])
            }
          })
          this._subscriptionArray.push(subscription);
        }
      });
    }
    else{
      this.showCategoryIsMandatory = true;
    }
  }

  unMappExternalService(externalCustomerId: any, agreementId: any, externalProductId: any, subscriptionId: any) {
    const confirmationMessage = this._translateService.instant('TRANSLATE.ENTITY_MAPPING_MAPPING_CONFIRM_TEXT_RELEASE_MAPPING');
    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        let postReq = {
          ExternalCustomerId: externalCustomerId,
          AgreeementId: agreementId,
          ExternalProductId: externalProductId,
          SubscriptionId: subscriptionId
        };
        const subscription = this._productMappingService.UnMappExternalService(postReq).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          this.existingMapping = response.Data;
          if (externalProductId === undefined || externalProductId === null || externalProductId === "") {
            this.runOnCustomerAndAgreementMappingRelease(agreementId);
          } else {
            this.getMapping();
          }
        })
        this._subscriptionArray.push(subscription);
      }
    });
  }

  runOnCustomerAndAgreementMappingRelease(agreementId: any) {

    this.purchasedProductMapping.AgreementId = null;
    this.purchasedProductMapping.AgreementName = null;
    this.purchasedProductMapping.AgreementStartDate = null;
    this.purchasedProductMapping.AgreementEndDate = null;
    this.purchasedProductMapping.BillingCycleId = null;
    this.purchasedProductMapping.BillingCycleName = null;
    this.purchasedProductMapping.IsDefault = false;
    this.purchasedProductMapping.CategoryId = null;
    this.purchasedProductMapping.ServiceProviderCustomerId = null;

    this.mappedEntity.AgreementId = null;
    this.mappedEntity.ExternalCustomerId = null;

    if (agreementId === undefined || agreementId === null || agreementId === "") {
      this.purchasedProductMapping.ExternalCustomerId = null;
      this.purchasedProductMapping.ExternalCustomerName = null;
      this.getActiveExternalMappedCustomer();
    }
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  back(){
    let callback = ()=>{
      this._router.navigate(['partner/business/subscriptionhistory']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.purchasedProductMappingForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

}
