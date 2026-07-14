import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { find, indexOf } from 'lodash';
import { Select2Data, Select2Module } from 'ng-select2-component';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { TranslationModule } from '../../i18n';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';

@Component({
  selector: 'app-offer-change-mapped-product-popup',
  standalone: true,
  imports: [CommonModule, NgSelectModule, FormsModule, ReactiveFormsModule, TranslationModule, NgbModule, Select2Module],
  templateUrl: './offer-change-mapped-product-popup.component.html',
  styleUrl: './offer-change-mapped-product-popup.component.scss'
})
export class OfferChangeMappedProductPopupComponent extends C3BaseComponent implements OnInit {
  @Input() subscriptionsList: any;

  isEditMode = false;
  isAllProductSelected = false;
  mappingC3PlanProductsDataset: Select2Data = [];
  mappingC3PlanProductsDatasetDict: { [key: string]: Select2Data } = {}; 

  constructor(
    private _activeModal: NgbActiveModal,
    private _modalService: NgbModal,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
    private _unsavedChangesService: UnsavedChangesService
  ) { super(_permissionService, _dynamicTemplateService, _router, _appService) }

  ngOnInit(): void {
    this.subscriptionsList.forEach((value: any) => {
      this.mappingC3PlanProductsDataset = [];
      value.MappingC3PlanProducts.forEach((planProduct: any) => {
        this.mappingC3PlanProductsDataset.push({
          value: planProduct,
          label: planProduct.PlanOfferQualifiedOfferName,
          disabled: this.isEditMode,
          data: { PlanOfferQualifiedOfferName: planProduct.PlanOfferQualifiedOfferName, BillingTypeName: planProduct.BillingTypeName, PlanName: planProduct.PlanName, CurrencySymbol: planProduct.CurrencySymbol, FinalSalePrice: planProduct.FinalSalePrice }
        });
      })
      this.mappingC3PlanProductsDatasetDict[value.ProviderSubscriptionOfferId] = this.mappingC3PlanProductsDataset
    })
  }

  selectPlanProductId(row: any, planProduct: any) {
    row.MappedC3PlanProduct = planProduct.value;
    let planProductSelectedValue = planProduct.value;
    var index = indexOf(this.subscriptionsList, row);
    this.subscriptionsList[index].MappedC3PlanProductId = planProductSelectedValue.PlanProductId;
    this.subscriptionsList[index].CategoryName = planProductSelectedValue.CategoryName;
    this.checkSelectedProductCount();
  }

  checkSelectedProductCount() {
    var PendingProduct = find(this.subscriptionsList, row => {
      return (row.MappedC3PlanProduct === undefined || row.MappedC3PlanProduct === null);
    });
    if (PendingProduct === undefined || PendingProduct === null || PendingProduct.lemgth < 1) {
      this.isAllProductSelected = true;
    }
  }

  proceed(offer: any) {
    this._activeModal.close(offer);
  }

  closeModalPopup() {
    this._modalService.dismissAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);
   }

}
