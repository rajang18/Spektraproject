import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { QuoteService } from '../../partner/quotes/quotes.service';
import { takeUntil } from 'rxjs';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../home/profile/services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';

@Component({
  selector: 'app-partner-address-details-popup',
  standalone: true,
  imports: [CommonModule,
      TranslateModule,
      FormsModule,
    PermissionDirective],
  templateUrl: './partner-address-details-popup.component.html',
  styleUrl: './partner-address-details-popup.component.scss'
})
export class PartnerAddressDetailsPopupComponent extends C3BaseComponent implements OnInit {


  @Input() entityName: any;
  @Input() recordId: any;
  @Input() isMarkAsDefault: Boolean;
  @Input() CustomerName : string;
  @Input() IsSelectedAddressId : number;
  @Input() IsCurrentAddress : any;
  isaddressChanged: boolean;
  addressDetails:any;
  selectedAddressId:number;
  IsAddressDeleted:any;


  constructor(public activeModal: NgbActiveModal,
    private _quoteService: QuoteService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    private _appService: AppSettingsService,
    private translateService: TranslateService,
    private _profileService: ProfileService,
    private _toastService: ToastrService
    
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
  }
  ngOnInit(): void {
    this.getPartnerBillFromDetails();
  }

  getPartnerBillFromDetails() {
    const subscription = this._quoteService.getPartnerAddress(this.entityName, this.recordId).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      if (response.Status === 'Success') {
        this.addressDetails = response.Data;
        let  customerDefaultAddress = this.addressDetails.find(address => address.BillFromAddressId === true);
        let  PartnerAddressDetails = this.addressDetails.find(address => address.IsDefault === true);
        let IsDeleted = this.addressDetails.find(address => address.ShouldDisable === true)
        this.IsAddressDeleted = this.addressDetails.find(address => address.AddressId === this.IsSelectedAddressId)
        if(IsDeleted != undefined){
          this.selectedAddressId = IsDeleted.AddressId;
        }
        else if(this.IsSelectedAddressId){
          if(this.IsAddressDeleted === undefined){
            this.addressDetails.push(this.IsCurrentAddress)
          }
          this.selectedAddressId = this.IsSelectedAddressId;
        }
        else if (customerDefaultAddress) {
          this.selectedAddressId = customerDefaultAddress.AddressId;
        }
        else{
          this.selectedAddressId = PartnerAddressDetails.AddressId;
        }
      }
    })
  }

  markDefault(){
    
  }

  onChange(data:any){
    this.isaddressChanged = true;
    this.selectedAddressId = data.AddressId;
  }



  Save() {
    let reqBody = {
      BillFromAddressId : this.selectedAddressId,
      EntityName : this.entityName,
      RecordId : this.recordId
    };
    const subscription = this._profileService.savePartnerBillFromId(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === 'Success') {
            this._toastService.success(this.translateService.instant('TRANSLATE.PARTNER_BILL_FROM_ADDRESS_UPDATED_SUCCESSFUL_MESSAGE'),'',{positionClass: 'toast-bottom-right' });
            this.activeModal.close(reqBody);
          }
        });
  }

  tempSave(){
    let reqBody = {
      BillFromAddressId : this.selectedAddressId,
      EntityName : this.entityName,
      RecordId : this.recordId
    };
    this.activeModal.close(reqBody);
  }


  cancel() {
    this.selectedAddressId = null;
    this.activeModal.dismiss()
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
