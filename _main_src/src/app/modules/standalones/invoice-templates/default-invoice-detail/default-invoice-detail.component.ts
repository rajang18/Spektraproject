import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { OrderByPipe } from 'src/app/shared/pipes/order-by.pipe';
import {  BaseInvoiceDetailComponent } from '../base-invoice-detail';
import { CommonService } from 'src/app/services/common.service';
import { InvoiceDetailService } from 'src/app/services/invoice-detail.service';
import { ToastService } from 'src/app/services/toast.service';
import { InvoicesService } from 'src/app/services/invoices.service';
import { FilterPipe } from "../../../../shared/pipes/filter.pipe";
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';


@Component({
  selector: 'app-default-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    OrderByPipe,
    NgbTooltipModule,
    CurrencyPipe,
    FilterPipe,
    C3CommonModule,

],
  templateUrl: './default-invoice-detail.component.html',
  styleUrl: './default-invoice-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefaultInvoiceDetailComponent extends BaseInvoiceDetailComponent implements OnInit,OnDestroy {
  globalDateFormat: any = '';

  constructor(
    public _invoiceDetailService: InvoiceDetailService,
    public _commonService: CommonService,
    public _modalService: NgbModal,
    public _invoiceService: InvoicesService,
    public _toastService: ToastService,
    public _translateService: TranslateService,
    public _cdRef:ChangeDetectorRef,
    public _appService: AppSettingsService,
  ) {
    super(_invoiceDetailService, _commonService, _modalService, _invoiceService, _toastService, _translateService, _cdRef,_appService);
  }
   ngOnInit(): void {
    this.globalDateFormat = this._appService.$rootScope.dateFormat;
    super.ngOnInit();
    
   }

   ngOnDestroy(): void {
     
   }
}
