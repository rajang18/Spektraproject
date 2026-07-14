import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { takeUntil } from 'rxjs';
import { NotifierService } from 'src/app/services/notifier.service';
import { Categories, CommonProviders } from 'src/app/shared/models/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-add-subcategory',
  templateUrl: './add-subcategories.component.html',
  styleUrls: ['./add-subcategories.component.scss']
})
export class AddSubcategoriesComponent extends C3BaseComponent implements OnInit, OnDestroy {
  subCategoryRegisterForm: FormGroup;
  isEditing: boolean;
  subCategoryId: string | null = null;
  selectedCategory: Categories[] = [];
  subcategoryOptions: any[] = [];
  subcategorybyId: number | null = null;
  entityName: any;
  offerType: any;
  currencyDetails: any = []
  currencySymbol: any;
  providers: CommonProviders[] = [];
  providerCategories: Categories[] = [];
  isCategoryLicenseSupported = false;
  categories: Categories[] = [];
  isDistributorOffer: boolean = false;
  CategoryName: any;
  ListData: any = [];
  duplicateName: boolean = false;
  formSubmit: boolean = false;
  renderWithCard: boolean = false;
  IsActive: boolean;

  constructor(
    private _formBuilder: FormBuilder,
    public router: Router,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private _unsavedChangesService: UnsavedChangesService,
    public _permissionService: PermissionService,           // <-- public here
    public _dynamicTemplateService: DynamicTemplateService, // <-- public here
    private _appService: AppSettingsService,
    private c3RouterService: C3RouterService,
    private _cdref: ChangeDetectorRef,
    private _commonService: CommonService,
    private pageInfo: PageInfoService,
    private _notifierService: NotifierService,
    private _location: Location
  ) {
    super(_permissionService, _dynamicTemplateService, router, _appService);

    const navigation = this._router.getCurrentNavigation() || this._unsavedChangesService.c3RouterData;
    this.navigation = navigation;
    this.subCategoryId = navigation?.extras?.state?.['subCategoryId'] || null;
    this.CategoryName = navigation?.extras?.state?.['CategoryName'] || null;
    this.offerType = navigation?.extras?.state?.['offerType'] || null;
    this.ListData = navigation?.extras?.state?.['ListData'] || [];
    this.isDistributorOffer = navigation?.extras?.state?.['isDistributorOffer'] || null;
    this.isEditing = navigation?.extras?.state?.['isEditing'] || false;
    this.keyForData = this.navigation?.extras.state?.['keyForData'];
    this.IsActive = this.navigation?.extras.state?.['IsActive']
    let IsRefresh = this.navigation?.extras.state?.['IsRefresh']
    if (this.keyForData) {
      this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
    }

    if(!IsRefresh) {
      this._location.back();
    }

    this.subCategoryRegisterForm = this._formBuilder.group({
      Id: [this.searchParams?.Id || null],
      provider: [''],
      CategoryIds: [''],
      SubCategoryName: [
        this.searchParams?.SubCategoryName || '',
        [this.requiredTrimmed(), Validators.maxLength(25)]
      ],
      Description: [this.searchParams?.Description || '']
    });
    if (this.offerType == 'edit') {
      this.subCategoryRegisterForm.get('provider')?.disable();
      this.subCategoryRegisterForm.get('CategoryIds')?.disable();
    }
    this.subcategorybyId = this.navigation?.extras.state?.['subcategorybyId'];
    this.isEditing = this.navigation?.extras.state?.['isEditing'];
    if (!!this.isEditing) {
      this.subCategoryRegisterForm.get('Id').disable();
      if (this.subcategorybyId == undefined || this.subcategorybyId == null) {
        this._router.navigate([`partner/customoffer/manage-subcategories`]);
      }
    }
  }

  requiredTrimmed(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      var controlValue = (control.value ?? '').toString();
      if (controlValue.trim().length == 0) {
        return { required: true }
      }
      return null;
    }

  }

  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    if (window.location.pathname.indexOf("customoffer") != -1) {
      if (this.offerType == "edit" && this._commonService.entityName === 'Partner') {
        //this.IsActive ? 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY' : 'SUBCATEGORY_VIEW_SUBCATEGORY_BREAD_CRUMB'
        this.pageInfo.updateTitle(this._translateService.instant(this.IsActive ? 'TRANSLATE.SUBCATEGORY_EDIT_SUBCATEGORY_BREAD_CRUMB' : 'TRANSLATE.SUBCATEGORY_VIEW_SUBCATEGORY_BREAD_CRUMB'), true);
        this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY']);
      }
      else if (this.offerType == "edit" && this._commonService.entityName === 'Reseller') {
        this.pageInfo.updateTitle(this._translateService.instant(this.IsActive ? 'TRANSLATE.SUBCATEGORY_EDIT_SUBCATEGORY_BREAD_CRUMB' : 'TRANSLATE.SUBCATEGORY_VIEW_SUBCATEGORY_BREAD_CRUMB'), true);
        this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY']);
      }

      if (this.offerType == "add" && this._commonService.entityName === 'Partner') {
        this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.ADD_SUBCATEGORY_CAPTION_TEXT_SUBCATEGORY"), true);
        this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY']);
      }
      else if (this.offerType == "add" && this._commonService.entityName === 'Reseller') {
        this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.ADD_SUBCATEGORY_CAPTION_TEXT_SUBCATEGORY"), true);
        this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY']);
      }
    }
    if (window.location.pathname.indexOf("customoffer") == -1) {
      if (this.offerType == "edit" && this._commonService.entityName === 'Partner') {
        this.pageInfo.updateTitle(this._translateService.instant(this.IsActive ? 'TRANSLATE.SUBCATEGORY_EDIT_SUBCATEGORY_BREAD_CRUMB' : 'TRANSLATE.SUBCATEGORY_VIEW_SUBCATEGORY_BREAD_CRUMB'), true);
        this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY']);
      }
      else if (this.offerType == "edit" && this._commonService.entityName === 'Reseller') {
        this.pageInfo.updateTitle(this._translateService.instant(this.IsActive ? 'TRANSLATE.SUBCATEGORY_EDIT_SUBCATEGORY_BREAD_CRUMB' : 'TRANSLATE.SUBCATEGORY_VIEW_SUBCATEGORY_BREAD_CRUMB'), true);
        this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY']);
      }

      if (this.offerType == "add" && this._commonService.entityName === 'Partner') {
        this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.ADD_SUBCATEGORY_CAPTION_TEXT_SUBCATEGORY"), true);
        this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY']);
      }
      else if (this.offerType == "add" && this._commonService.entityName === 'Reseller') {
        this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.ADD_SUBCATEGORY_CAPTION_TEXT_SUBCATEGORY"), true);
        this.pageInfo.updateBreadcrumbs(['MENUS_SELLER_INDIRECT', 'MENU_BREADCRUMB_MANAGE_SUBCATEGORY']);
      }

    }
    this.providerChange(),
      this.categoryChange();

    if (this.isEditing && this.subCategoryId) {
      this.getSubCategoryDetails(this.subCategoryId);
    }
    if (window.location.pathname.indexOf("customoffer") > -1) {
      this.renderWithCard = false;
    }
    else {
      this.renderWithCard = true;
    }
  }

  backToManageSubcategories() {
    let callback = () => {
      this.c3RouterService.backToHistory(this.keyForData, this.isDistributorOffer ? `partner/distributoroffers/addsubcategories` : `partner/customoffer/manage-subcategories`);
      this._unsavedChangesService.setIsRedirect(true);
    }
    this.formBuilderGroupName = 'subCategoryRegisterForm'
    this.isDirtyCheck();
    this._unsavedChangesService.setUnsavedChanges(this.subCategoryRegisterForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }


  providerChange() {
    const subscriptionarray = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.providers = <CommonProviders[]>response.filter((each: any) => {
        return each.IsManagedByPartner === true;
      });
      this.fetchProvider()
    })
    this._subscriptionArray.push(subscriptionarray);
  }

  fetchProvider() {
    this.subCategoryRegisterForm.controls['provider'].setValue(this.providers[0].ID);
    this.subCategoryRegisterForm.controls['provider'].disable();
    let selectedProvider = this.providers.filter((p: any) => {
      return p.ID === this.subCategoryRegisterForm.get("provider")?.value;
    })
    const subscription = this.currencyDetails = this._commonService.getCurrencySymbols(selectedProvider[0].Currency).pipe(takeUntil(this.destroy$)).subscribe(
      (response: any) => {
        this.currencyDetails = response;
        this.currencySymbol = this.currencyDetails.CurrencySymbol;
      },
    )
    this._subscriptionArray.push(subscription);
  }

  categoryChange() {
    if (this.isDistributorOffer) {
      const subscriptionarray = this._commonService.getCatagoriesWithoutScreen().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.providerCategories = <Categories[]>response;
        let defaultCategory: any[] = <Categories[]>this.providerCategories.filter((e: any) => {
          return e.Name === "DistributorOffers"
        });
        this.categories = this.providerCategories;
        this.subCategoryRegisterForm.controls['CategoryIds'].setValue(defaultCategory[0].ID, { onlySelf: true });
        this.subCategoryRegisterForm.get('CategoryIds')?.disable();
      })
      this._subscriptionArray.push(subscriptionarray);
      this.selectedCategory = this.providerCategories.filter((e: any) => {
        return e.ID === +this.subCategoryRegisterForm.get("CategoryIds")?.value;
      });
      if (!!this.selectedCategory?.length && this.selectedCategory[0].Name === 'LicenseSupported') {
        this.isCategoryLicenseSupported = true;
      }
      else {
        this.isCategoryLicenseSupported = false;
      }
    }
    else {
      const subscriptionarray = this._commonService.getCategories('partnerOffers').pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.providerCategories = <Categories[]>response;
        this.categories = this.providerCategories.filter((each: any) => {
          return each.IsManagedByPartner === true;
        })
        if (this.CategoryName) {
          let CategoryIdIndex = this.categories.findIndex((item: any) => item.Name == this.CategoryName)
          console.log(CategoryIdIndex)
          if (CategoryIdIndex != -1) {
            this.subCategoryRegisterForm.controls['CategoryIds'].setValue(this.categories[CategoryIdIndex]?.ID, { onlySelf: true });
            this.subCategoryRegisterForm.get('CategoryIds')?.disable();
          }
        }
        else {
          if (!this.subCategoryRegisterForm?.value?.CategoryIds) this.subCategoryRegisterForm.controls['CategoryIds'].setValue(this.categories[0].ID, { onlySelf: true });
          if (this.offerType == 'edit') {
            this.subCategoryRegisterForm.get('CategoryIds')?.disable();
          }
        }
        this.selectedCategory = this.providerCategories.filter((e: any) => {
          return e.ID === +this.subCategoryRegisterForm.get("CategoryIds")?.value;
        });
        if (!!this.selectedCategory?.length && this.selectedCategory[0].Name === 'LicenseSupported') {
          this.isCategoryLicenseSupported = true;
        }
        else {
          this.isCategoryLicenseSupported = false;
        }
      })
      this._subscriptionArray.push(subscriptionarray);
    }
  }

  getSubCategoryDetails(id: string): void {
    this._commonService.getSubCategories(id, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        const data = res?.[0];
        if (data) {
          this.subCategoryRegisterForm.patchValue({
            provider: data.ProviderId,
            category: data.CategoryIds,
            subcategory: data.Name,
            description: data.Description
          });
          this.subcategoryOptions = res?.map((item: any) => {
            let obj = { name: item.Name }
            return obj
          })
          // this.subcategoryOptions = [{ name: data.Name }];
          this._cdref.detectChanges();
        }
      });
  }

  saveSubCategory(): void {
    this.formSubmit = true;
    this.subCategoryRegisterForm.markAllAsTouched();

    // stop immediately if invalid (covers required + whitespace)
    if (this.subCategoryRegisterForm.invalid) return;

    this.subCategoryRegisterForm.get('CategoryIds')?.enable();

    const payload = {
      ...this.subCategoryRegisterForm.value,
      SubCategoryId: this.subCategoryRegisterForm.value.Id,
      SubCategoryName: this.subCategoryRegisterForm.value.SubCategoryName.trim()
    };
    this.subCategoryRegisterForm.get('CategoryIds')?.disable();

    const isEdit = !!this.subCategoryRegisterForm.value.Id;

    this._unsavedChangesService.setUnsavedChanges(false);

    //case-insensitive + trimmed duplicate check
    let isSubcategoryExists = this.ListData.findIndex(
      (item: any) => item.IsActive && item.Name.trim().toLowerCase() === payload.SubCategoryName.toLowerCase() && item.Id !== payload.SubCategoryId
        && item.CategoryName === this.categories.filter(items => items.ID == this.subCategoryRegisterForm.get('CategoryIds').value)[0].Name
    );

    if (isSubcategoryExists !== -1) {
      this.duplicateName = true;
      return;
    }
    this.duplicateName = false;

    this._commonService.saveSubCategories(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        if (res.Status === 'Success') {
          const subCategoryName = payload.SubCategoryName;
          const msgKey = isEdit
            ? 'TRANSLATE.SUBCATEGORY_CREATION_SUCCESS'
            : 'TRANSLATE.SUBCATEGORY_UPDATE_SUCCESS';

          this._toastService.success(
            this._translateService.instant(msgKey, { subCategoryName })
          );

          if (this.isDistributorOffer) {
            this._router.navigate(['partner/distributoroffers'], { state: { isFromSubCategoriesPage: true } });
            this._unsavedChangesService.setIsRedirect(true);
          } else {
            this._router.navigate(['partner/customoffer/manage-subcategories']);
          }
        }
      });
  }

  backToList() {
    this.c3RouterService.backToHistory(this.keyForData, 'partner/customoffer/manage-subcategories');
  }

  hideNav(): any {
    return window.location.pathname.indexOf('distributoroffers') == -1;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
