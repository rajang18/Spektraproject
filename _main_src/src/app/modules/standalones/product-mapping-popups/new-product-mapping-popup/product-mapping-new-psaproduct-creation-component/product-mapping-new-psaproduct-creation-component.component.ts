import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { combineLatest, takeUntil} from 'rxjs';
import { NewPSAProductCreationService } from 'src/app/modules/partner/prod-mapping/services/newPSAProductCreation.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-product-mapping-new-psaproduct-creation-component',
  standalone: true,
  imports: [
    TranslateModule,
    C3CommonModule,
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule
  ],
  templateUrl: './product-mapping-new-psaproduct-creation-component.component.html',
  styleUrl: './product-mapping-new-psaproduct-creation-component.component.scss'
})
export class ProductMappingNewPSAProductCreationComponentComponent extends C3BaseComponent implements OnInit, OnDestroy {
  
  newPSAProductCreationForm: FormGroup;
  entityName: string | null = '';
  recordId: string | null = '';
  pSACategories: any = [];
  selectedCategory: any = [];
  selectedPSACategory: any = [];
  defaultSelectedPSACategories: any = [];
  pSASubCategories: any = [];
  completeCategories: any = [];
  selectedPSASubCategory: any = [];
  defaultSelectedPSASubCategories: any = [];
  defaultSelectedPSAProductClass: any = [];
  pSASLAs: any = [];
  selectedPSASLAs: any = [];
  defaultSelectedPSASLAs: any = [];
  pSAUOMS: any = [];
  selectedPSAUOMS: any = [];
  defaultSelectedPSAUOMS: any = [];
  productTypes: any = [];
  selectedPSAProductTypes: any = [];
  defaultSelectedPSAProductTypes: any = [];
  selectedProductClass: any = [];
  isCreatingPSAProduct: boolean = false; 
  productClass: any = [{
    Id: "1", Name: "Agreement", Value: "Agreement"
    },
    {
      Id: "2", Name: "Bundle", Value: "Bundle"
    },
    {
      Id: "3", Name: "Inventory", Value: "Inventory"
    },
    {
      Id: "4", Name: "Non-Inventory", Value: "NonInventory"
    },
    {
      Id: "5", Name: "Service", Value: "Service"
    }
  ];
  //private _subscription: Subscription;

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _commonService: CommonService,
    public _router: Router,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public newPSAProductCreationService: NewPSAProductCreationService,
    private _modalService: NgbModal,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.newPSAProductCreationForm = this._formBuilder.group({
      identifier: ['', Validators.required],
      integrationCrossReference: [''],
      description: ['', Validators.required],
      psaSLAs: [''],
      category: ['', Validators.required],
      customerDescription: ['',  Validators.required],
      subCategories: ['', Validators.required],
      productType: ['', Validators.required],
      productLabel: [''],
      uom: ['', Validators.required],
      productClass: [''],
      price: ['0', Validators.required],
      dropShipFlag: [''],
      costPrice: ['0', Validators.required],
      specialOrderFlag: [''],
      notes: [''],
      taxableFlag: ['']
    });
  }

  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.getPSADetails();

  }

  getPSADetails() {
    const subscription = combineLatest([
      this.newPSAProductCreationService.getPSACategories(),
      this.newPSAProductCreationService.getPSASubCategories(),
      this.newPSAProductCreationService.getPSASLAs(),
      this.newPSAProductCreationService.getPSAUOMS(),
      this.newPSAProductCreationService.getPSAProductTypes()
    ]).pipe(takeUntil(this.destroy$)).subscribe(([pSACategories, pSASubCategories, pSASLAs, pSAUOMS, productTypes]) => {

      this.pSACategories = pSACategories;
      this.defaultSelectedPSACategories = _.filter(this.pSACategories, (td: any) => {
        return td.DefaultFlag == true;
      });
      if (this.defaultSelectedPSACategories === undefined || this.defaultSelectedPSACategories === null || this.defaultSelectedPSACategories.length === 0) {
        this.selectedPSACategory = this.pSACategories[0];
      }
      else {
        this.selectedPSACategory = this.defaultSelectedPSACategories[0];
      }
      if (!!this.selectedPSACategory) {
        this.newPSAProductCreationForm.controls['category'].setValue(this.selectedPSACategory.Id);
      }
      this.pSASubCategories = pSASubCategories;
      this.completeCategories = pSASubCategories;
      this.defaultSelectedPSASubCategories = _.filter(this.pSASubCategories, (td: any) => {
        return td.DefaultFlag == true;
      });
      if (this.defaultSelectedPSASubCategories === undefined || this.defaultSelectedPSASubCategories === null || this.defaultSelectedPSASubCategories.length === 0) {
        this.selectedPSASubCategory = this.pSASubCategories[0];
      }
      else {
        this.selectedPSASubCategory = this.defaultSelectedPSASubCategories[0];
      }
      if (!!this.selectedPSASubCategory) {
        this.newPSAProductCreationForm.controls['subCategories'].setValue(this.selectedPSASubCategory.Id);
      }
      this.pSASLAs = pSASLAs;
      this.defaultSelectedPSASLAs = _.filter(this.pSASLAs, (td: any) => {
        return td.DefaultFlag == true;
      });
      this.selectedPSASLAs = this.defaultSelectedPSASLAs[0];
      if (!!this.selectedPSASLAs) {
        this.newPSAProductCreationForm.controls['psaSLAs'].setValue(this.selectedPSASLAs.Id);
      }
      this.pSAUOMS = pSAUOMS;
      this.defaultSelectedPSAUOMS = _.filter(this.pSAUOMS, (td: any) => {
        return td.DefaultFlag == true;
      });
      this.selectedPSAUOMS = this.defaultSelectedPSAUOMS[0];
      if (!!this.selectedPSAUOMS) {
        this.newPSAProductCreationForm.controls['uom'].setValue(this.selectedPSAUOMS.Id);
      }
      this.productTypes = productTypes;
      this.defaultSelectedPSAProductTypes = _.filter(this.productTypes, (td: any) => {
        return td.DefaultFlag == true;
      });
      this.selectedPSAProductTypes = this.defaultSelectedPSAProductTypes[0];
      if (!!this.selectedPSAProductTypes) {
        this.newPSAProductCreationForm.controls['productType'].setValue(this.selectedPSAProductTypes.Id);
      }

      this.defaultSelectedPSAProductClass = _.filter(this.productClass, (td: any) => {
        return td.Name == 'Non-Inventory';
      });
      this.selectedProductClass = this.defaultSelectedPSAProductClass
      this.newPSAProductCreationForm.controls['productClass'].setValue(this.defaultSelectedPSAProductClass[0].Id);
      this.onCategoryChange();
      this._cdref.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }


  onProductClassChange() {
    let selectedProductClass = _.filter(this.productClass, (td: any) => {
      return td.Id == +this.newPSAProductCreationForm.get("productClass")?.value;
    });
    this.selectedProductClass = selectedProductClass;
  }

  onCategoryChange() {

    this.selectedPSACategory = _.filter(this.pSACategories, (td: any) => {
      return td.Id == +this.newPSAProductCreationForm.get("category")?.value;
    });
    this.pSASubCategories = [];
    this.selectedPSASubCategory = [];
    this._cdref.detectChanges();
    this.pSASubCategories = _.filter(this.completeCategories, (td: any) => {
      return td.CategoryId == this.selectedPSACategory[0].Id;
    });
    this.defaultSelectedPSASubCategories = _.filter(this.pSASubCategories, (td: any) => {
      return td.DefaultFlag == true;
    });

    if (this.defaultSelectedPSASubCategories === undefined || this.defaultSelectedPSASubCategories === null || this.defaultSelectedPSASubCategories.length === 0) {
      this.selectedPSASubCategory = this.pSASubCategories;
    }
    else {
      this.selectedPSASubCategory = this.defaultSelectedPSASubCategories;
    }
    this.newPSAProductCreationForm.controls['subCategories'].setValue(this.selectedPSASubCategory[0].Id);
    this.newPSAProductCreationForm.get('subCategories').updateValueAndValidity();
    this._cdref.detectChanges();
  }


  onSubCategoryChange() {
    this.selectedPSASubCategory = _.filter(this.pSASubCategories, (td: any) => {
      return td.Id == +this.newPSAProductCreationForm.get("subCategories")?.value;
    });
  }

  onUOMChange() {
    this.selectedPSAUOMS = [];
    this.selectedPSAUOMS = _.filter(this.pSAUOMS, (td: any) => {
      return td.Id == +this.newPSAProductCreationForm.get("uom")?.value;
    });
    this.selectedPSAUOMS =  this.selectedPSAUOMS[0];
  }

  onSLAChange() {
    this.selectedPSASLAs = _.filter(this.pSASLAs, (td: any) => {
      return td.Id == +this.newPSAProductCreationForm.get("psaSLAs")?.value;
    });
  }

  onProductTypeChange() {
    this.selectedPSAProductTypes = _.filter(this.productTypes, (td: any) => {
      return td.Id == +this.newPSAProductCreationForm.get("productType")?.value;
    });
  }

  saveNewPSAProduct() {
    this.newPSAProductCreationForm.markAllAsTouched();
    if (this.newPSAProductCreationForm.valid) {
      this.isCreatingPSAProduct = true;
      let reqBody = {
        Identifier: this.newPSAProductCreationForm.get("identifier")?.value,
        Description: this.newPSAProductCreationForm.get("description")?.value,
        Category: this.selectedPSACategory[0],
        Subcategory: this.selectedPSASubCategory[0],
        UOM: this.selectedPSAUOMS,
        UnitPrice: this.newPSAProductCreationForm.get("price")?.value,
        UnitCost: this.newPSAProductCreationForm.get("costPrice")?.value,
        SalesTax: this.newPSAProductCreationForm.get("taxableFlag")?.value,
        IntegrationXRef: this.newPSAProductCreationForm.get("integrationCrossReference")?.value,
        SLA: this.selectedPSASLAs,
        CustomerDescription: this.newPSAProductCreationForm.get("customerDescription")?.value,
        ProductType: this.selectedPSAProductTypes[0],
        ProductClass: this.selectedProductClass[0].Value,
        Notes: this.newPSAProductCreationForm.get("notes")?.value,
        DropShipFlag: this.newPSAProductCreationForm.get("dropShipFlag")?.value,
        SpecialOrderFlag: this.newPSAProductCreationForm.get("specialOrderFlag")?.value,
      };
      const subscription = this.newPSAProductCreationService.createPSAProduct(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.isCreatingPSAProduct = false;
        this._modalService.dismissAll();
        if (response.Status === "Success") {
          this._modalService.dismissAll();
          this._toastService.success(
            this._translateService.instant('TRANSLATE.PARTNER_PURCHASED_PRODUCT_MAPPING_NOTIFICATION_SUCCESSFULLY_CREATED_NEW_PSA_PRODUCT')
          );
        }
      })
      this._subscriptionArray.push(subscription);
    }
  }

  closeModalPopup() {
    //this.activeModal.close();
    this._modalService.dismissAll();
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
    this._subscription?.unsubscribe();
  }
}
