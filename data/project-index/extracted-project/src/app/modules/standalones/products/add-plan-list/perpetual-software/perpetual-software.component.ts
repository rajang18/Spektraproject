import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductBaseComponent } from '../../models/product-base-component';
import { ProductService } from 'src/app/services/product.service';

import { PlansListingService } from 'src/app/modules/partner/plans/services/plans-listing.service';
import { CommonService } from 'src/app/services/common.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { CurrencyPipe } from '../../../../../shared/pipes/currency.pipe';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-perpetual-software',
  standalone: true,
  imports: [NgbModule,TranslateModule,CurrencyPipe,C3CommonModule,CommonModule],
  templateUrl: './perpetual-software.component.html',
  styleUrl: './perpetual-software.component.scss'
})
export class PerpetualSoftwareComponent extends ProductBaseComponent implements OnInit{
  
  constructor(private cdRef: ChangeDetectorRef,
    public _modalService: NgbModal,
    public productService:ProductService,
    public _notifierService: NotifierService,
    public _commonService:CommonService,
    public _translateService:TranslateService,
    public plansListingService: PlansListingService     
  ){
    super(productService,_modalService,_notifierService,_commonService,_translateService,plansListingService);
  }
  ngOnInit(): void {
    this.product
    this.cdRef.detectChanges(); 
  }
}
