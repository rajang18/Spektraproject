import { Component, Input, OnInit,OnDestroy, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { QuoteService } from '../../partner/quotes/quotes.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../home/profile/services/profile.service';
import { ToastService } from 'src/app/services/toast.service';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { CommonService } from 'src/app/services/common.service';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-clone-quote-customer',
  standalone: true,
  imports: [CommonModule,
        TranslateModule,
        FormsModule,
      PermissionDirective,C3CommonModule,NgbModule],
  templateUrl: './clone-quote-customer.component.html',
  styleUrl: './clone-quote-customer.component.scss'
})
export class CloneQuoteCustomerComponent implements OnInit, OnDestroy{
  currentC3CustomerId: null;
  allCustomers: any;
  customers = [];
  selectedCustomerId!: number;
  addressDetailsData: any;
  _subscription: Subscription;
   public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();

  @Input() currentQuoteId: number;
  @Input() currentCustomerId: string; 
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  constructor(public activeModal: NgbActiveModal,
    private _quoteService: QuoteService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _router: Router,
    private _appService: AppSettingsService,
    private translateService: TranslateService,
    private _profileService: ProfileService,
    private _toastService: ToastService,
    private _common: CommonService,
    

  ) {
  }
    
    customerList: any[] = [];
    addressDetails = [];


    ngOnInit() {
    this.selectedCustomerId = Number(this.currentCustomerId);
     this.getCustomerForQuotes();
     
}

  getCustomerForQuotes() {
    const subscription = this._quoteService.getCustomerForQuotes().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.customers = (response.Data || []).map((c: any) => ({ ...c, CustomerId: Number(c.CustomerId) }));
      const selectedCustomerId = Number(this.currentCustomerId);

      this.selectedCustomerId = selectedCustomerId;
      const selectedCustomer = this.customers.find((customer: any) => customer.CustomerId === selectedCustomerId);
      const otherCustomers = this.customers.filter((customer: any) => customer.CustomerId !== selectedCustomerId);

      this.customers = selectedCustomer ? [selectedCustomer, ...otherCustomers] : this.customers; 
      if (selectedCustomer) {
        this.onCustomerChange(selectedCustomer);
      }
    });
    this._subscriptionArray.push(subscription);
  }

  onCustomerChange(customer: any) {
    this.selectedCustomerId = customer.CustomerId;
    this._quoteService.getCustomerAdminUsers(customer.C3Id).pipe(takeUntil(this.destroy$)).subscribe((adminResponse: any) => {
      if (adminResponse.Data && adminResponse.Data.length > 0) {
        const recordId = adminResponse.Data[0].RecordId;
        this._quoteService.getAddress(CloudHubConstants.ENTITY_CUSTOMER, recordId).pipe(takeUntil(this.destroy$)).subscribe((addressResponse: any) => {
          this.addressDetailsData = addressResponse.Data;
          this.addressDetails = this.addressDetailsData.filter((address: any) => address.IsDefault === true && address.ContactType === 'Billing');
          if (!this.addressDetails.length) {
            this.addressDetails = this.addressDetailsData.filter((address: any) => address.ContactType === 'Billing');
          }
          console.log(this.addressDetails);
        });
      }
    });
  }

  cancel() {
    this.activeModal.dismiss();
  }
   

  cloneQuote() {
    if (!this.selectedCustomerId) {
      return;
    }

    const payload = {
      quoteId: this.currentQuoteId,
      customerId: this.selectedCustomerId,
      LoggedInUser: this._common.loggedInUserName
    };

    this._quoteService.cloneQuote(payload).subscribe({
      next: (res: any) => {
      this.activeModal.close(res.data);
      this._toastService.success(this.translateService.instant('TRANSLATE.CLONE_QUOTE_CREATED_SUCCESS'));
      },
      error: (err) => {
        console.error('Clone failed', err);
        this._toastService.error(this.translateService.instant('TRANSLATE.FAILED_TO_CLONE_QUOTE_'));
      }
    });
  }

   ngOnDestroy(): void {
    this._subscription?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
        this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
