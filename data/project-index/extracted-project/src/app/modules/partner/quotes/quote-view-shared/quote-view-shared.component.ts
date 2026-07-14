import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { QuoteService } from '../quotes.service';
import * as html2pdf from 'html2pdf.js';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { MenuService } from 'src/app/services/menu.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModule, NgbCollapseModule, NgbOffcanvasModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { Select2Module } from 'ng-select2-component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { TranslationModule } from 'src/app/modules/i18n';
import { EditColumnComponent } from 'src/app/modules/standalones/c3-table/edit-column/edit-column.component';
import { PermissionDirective } from 'src/app/shared/directives/permission.directive';
import { NgxSummernoteModule } from 'src/app/shared/directives/summernote/ngx-summernote.module';
import { LimitLengthPipe } from 'src/app/shared/pipes/limitLength.pipe';
import { QuotesRoutingModule } from '../quotes-routing.module';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { waitForUIReady } from 'src/app/services/ui-ready.util';
import { AppReadyService } from 'src/app/services/app-ready.service';
import { LoaderService } from 'src/app/services/loader.service';


@Component({
  selector: 'app-quote-view-shared',
  standalone:true,
  imports: [
    CommonModule,
    EditColumnComponent,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbDropdownModule,
    SweetAlert2Module,
    NgSelectModule,
    NgbModule,
    Select2Module,
    QuotesRoutingModule,
    RouterModule,
    LimitLengthPipe,
    CurrencyPipe,
    NgbCollapseModule,
    NgbOffcanvasModule,
    PermissionDirective,
    NgSelectModule,
    NgbDatepickerModule,
    NgxSummernoteModule,
    InfiniteScrollModule,
    
  ],
  templateUrl: './quote-view-shared.component.html',
  styleUrls: ['./quote-view-shared.component.scss']
})
export class QuoteViewSharedComponent implements OnInit,OnDestroy {
  public pagemode: string | null = null;
  public Htmltemplate: string = '';
  public QuotesDatafromDB: any = null;
  public quoteURL: string = '';
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();


  constructor(
    private route: ActivatedRoute,
    private quoteService: QuoteService,
    private menuService:MenuService,
    private appReadyService: AppReadyService,
    private loader: LoaderService


  ) {
    setTimeout(()=>{
      menuService.setIsPublicAccess(true)
    },10)
  }

  ngOnInit(): void {
    console.log("LayoutComponent ngAfterViewInit started.");
    waitForUIReady().then(()=>{
        console.log("LayoutComponent ngAfterViewInit started2.");
        this.appReadyService.markReady(); // removes splash + shows app
        this.loader.isLayoutLoaded = true;
        const subscription = this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
          const envID = params['envID'] || '';
          const quoteID = params['quoteID'] || '';
    
          if (envID) {
            localStorage.setItem('currentSiteId', envID);
          }
    
          if (quoteID) {
            this.quoteURL = `${quoteID}`;
          }
    
          this.ExportQuotePDF();
        });
    });
  }

  ExportQuotePDF(): void {
    const subscription = this.quoteService.exportQuotePDF(this.quoteURL).pipe(takeUntil(this.destroy$)).subscribe(response => {
      this.QuotesDatafromDB = response.Data;
      if (!this.QuotesDatafromDB || this.QuotesDatafromDB.length === 0) {
        this.pagemode = 'notFound';
      } else {
        this.fun1();
      }
    });
    this._subscriptionArray.push(subscription);
  }

  fun1(): void {
    if (this.QuotesDatafromDB) {
      this.Htmltemplate = this.QuotesDatafromDB[0].HtmlTemplate;
      const targetElement = document.getElementById('sample-target-for-pdf');
      if (targetElement) {
        targetElement.innerHTML = this.Htmltemplate;
      }
    }
  }

  ExportPDF(orientation: 'portrait' | 'landscape' = 'portrait'): void {
    const date = new Date();

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    };
    
    const dateString = date.toLocaleDateString('en-US', options);
    const filename = `Quote ${dateString}`;
    const opt = {
      margin: 0.2,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, dpi: 192, letterRendering: true, y: 0, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: orientation === 'landscape' ? 'l' : 'p' }
    };

    html2pdf().set(opt).from(this.Htmltemplate).save();
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
  
}
