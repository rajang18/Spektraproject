import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BaseInvoiceDetailComponent } from '../base-invoice-detail';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { InvoiceDetailService } from 'src/app/services/invoice-detail.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrderByPipe } from 'src/app/shared/pipes/order-by.pipe';
import { InvoicesService } from 'src/app/services/invoices.service';
import { ToastService } from 'src/app/services/toast.service';
import { CurrencyPipe } from 'src/app/shared/pipes/currency.pipe';
import { FilterPipe } from "../../../../shared/pipes/filter.pipe";
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-aztek-invoice-detail',
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
  templateUrl: './aztek-invoice-detail.component.html',
  styleUrl: './aztek-invoice-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AztekInvoiceDetailComponent extends BaseInvoiceDetailComponent implements OnInit {
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
}