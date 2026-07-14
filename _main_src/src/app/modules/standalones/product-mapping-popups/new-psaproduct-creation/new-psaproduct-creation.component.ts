import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { combineLatest, takeUntil } from 'rxjs';
import { NewPSAProductCreationService } from 'src/app/modules/partner/prod-mapping/services/newPSAProductCreation.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AppSettingsService } from 'src/app/services/app-settings.service';
@Component({
  selector: 'new-psaproduct-creation-component',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './new-psaproduct-creation.component.html',
  styleUrl: './new-psaproduct-creation.component.scss'
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
  selectedPSASubCategory: any = [];
  defaultSelectedPSASubCategories: any = [];
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
  productClass: any = [{ 
    Id: "1", Name: "Agreement"

  }, {

    Id: "2", Name: "Bundle"

  },
  {

    Id: "3", Name: "Inventory"

  },
  {

    Id: "4", Name: "NonInventory"

  },
  {

    Id: "5", Name: "Service"

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
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.newPSAProductCreationForm = this._formBuilder.group({
      identifier: ['', Validators.required],
      integrationCrossReference: [''],
      description: ['', Validators.required],
      psaSLAs: [''],
      category: ['', Validators.required],
      customerDescription: ['', Validators.required],
      subCategories: ['', Validators.required],
      productType: ['', Validators.required],
      productLabel: [''],
      uom: [''],
      productClass: ['', Validators.required],
      price: ['', Validators.required],
      dropShipFlag: [''],
      costPrice: ['', Validators.required],
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
      this.selectedPSACategory = this.defaultSelectedPSACategories[0];
      if (!!this.selectedPSACategory) {
        this.newPSAProductCreationForm.controls['category'].setValue(this.selectedPSACategory.Id);
      }
      this.pSASubCategories = pSASubCategories;
      this.defaultSelectedPSASubCategories = _.filter(this.pSASubCategories, (td: any) => {
        return td.DefaultFlag == true;
      });
      this.selectedPSASubCategory = this.defaultSelectedPSASubCategories[0];
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
      this.defaultSelectedPSAProductTypes = _.filter(this.productTypes, function (td) {
        return td.DefaultFlag == true;
      });
      this.selectedPSAProductTypes = this.defaultSelectedPSAProductTypes[0];
      if (!!this.selectedPSAProductTypes) {
        this.newPSAProductCreationForm.controls['productType'].setValue(this.selectedPSAProductTypes.Id);
      }
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
    this.selectedCategory = _.filter(this.pSACategories, (td: any) => {
      return td.Id == +this.newPSAProductCreationForm.get("category")?.value;
    });
  }


  onSubCategoryChange() {
    this.selectedPSASubCategory = _.filter(this.pSASubCategories, (td: any) => {
      return td.Id == +this.newPSAProductCreationForm.get("subCategories")?.value;
    });
  }

  onUOMChange() {
    this.selectedPSAUOMS = _.filter(this.pSAUOMS, (td: any) => {
      return td.Id == +this.newPSAProductCreationForm.get("uom")?.value;
    });
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
    let reqBody = {
      Identifier: this.newPSAProductCreationForm.get("identifier")?.value,
      Description: this.newPSAProductCreationForm.get("description")?.value,
      Category: this.selectedCategory[0],
      Subcategory: this.selectedPSASubCategory[0],
      UOM: this.selectedPSAUOMS,
      UnitPrice: this.newPSAProductCreationForm.get("price")?.value,
      UnitCost: this.newPSAProductCreationForm.get("costPrice")?.value,
      SalesTax: this.newPSAProductCreationForm.get("taxableFlag")?.value,
      IntegrationXRef: this.newPSAProductCreationForm.get("integrationCrossReference")?.value,
      SLA: this.selectedPSASLAs,
      CustomerDescription: this.newPSAProductCreationForm.get("customerDescription")?.value,
      ProductType: this.selectedPSAProductTypes[0],
      ProductClass: this.selectedProductClass[0].Name,
      Notes: this.newPSAProductCreationForm.get("notes")?.value
    };
    const subscription = this.newPSAProductCreationService.createPSAProduct(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any)=>{

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

  closeModalPopup() {
    //this.activeModal.close();
    this._modalService.dismissAll();
  }

  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
