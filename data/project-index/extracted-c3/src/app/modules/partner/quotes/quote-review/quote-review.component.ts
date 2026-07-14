import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'src/app/services/notifier.service';
import { QuoteService } from '../quotes.service';
import { TranslateService } from '@ngx-translate/core';
import { EmailTemplateComponent } from '../email-template/email-template.component';
import { Subject, Subscription, takeUntil } from 'rxjs';


@Component({
  selector: 'app-quote-review',
  templateUrl: './quote-review.component.html',
  styleUrls: ['./quote-review.component.scss']
})
export class QuoteReviewComponent implements OnInit,OnDestroy {
  @ViewChild('emailModal') emailModal: TemplateRef<any>;  // Reference to the email modal template
  @Input() quoteId : any;
  @Input() saveQuoteUrl : any;
  shareableUrl: string;
  SaveQuote: string;
  quoteEmailDetailsRequestMessage: string;
  EncodedQuoteEmailRequestMessage: string;
  QuoteEmailDetails: any;
  popup: boolean;
  isBusy: boolean = false;
  showEmailTemplate: boolean = false;
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();


  constructor(
    private router: Router,
    private notifier: NotifierService,
    private quoteService: QuoteService,
    private translate: TranslateService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
     let env :any =localStorage.getItem('AvailableEnvironments');
     env=JSON.parse(env);
     let envid =env[0]?.Id;
    this.shareableUrl = `${window.location.protocol}//${window.location.host}/quote/${envid}/${this.saveQuoteUrl}`;
      this.GetQuoteEmailDetails();
  }

  GetQuoteEmailDetails(): void {
    const quoteId = this.quoteId;
    const subscription = this.quoteService.getEmailData(quoteId).pipe(takeUntil(this.destroy$)).subscribe(response => {
      this.QuoteEmailDetails = response.Data;
      this.BuildMessage();
    });
    this._subscriptionArray.push(subscription);
  }

  BuildMessage(): void {
    const regex = /<br\s*[\/]?>/gi;
    if (this.QuoteEmailDetails) {
      let env :any =localStorage.getItem('AvailableEnvironments');
      env=JSON.parse(env);
      let envid =env[0]?.Id;
      const shareableUrl = `${window.location.protocol}//${window.location.host}/quote/${envid}/${this.saveQuoteUrl}`;
      const tempDate = new Date(this.QuoteEmailDetails[0].ExpirationDate);
      const formattedDate = [tempDate.getDate(), tempDate.getMonth() + 1, tempDate.getFullYear()].join('-');
      const htmlText = this.translate.instant('TRANSLATE.QUOTE_TEXT_EMAIL_DETAILS', {
        quoteName: this.QuoteEmailDetails[0].QuoteName,
        expirationDate: formattedDate,
        quoteURL: shareableUrl
      });

      this.quoteEmailDetailsRequestMessage = htmlText.replace(regex, '\n');
      this.EncodedQuoteEmailRequestMessage = encodeURIComponent(this.quoteEmailDetailsRequestMessage);
    } else {
      this.notifier.alert({
        title: this.translate.instant('TRANSLATE.QUOTE_EMAIL_ERROR')
      });
    }
  }

  OnQuoteEmailRequestMessageChange(): void {
    this.EncodedQuoteEmailRequestMessage = encodeURIComponent(this.quoteEmailDetailsRequestMessage);
  }

  EmailQuote(): void {
    const modalRef = this.modalService.open(EmailTemplateComponent, { size: 'lg' });
    modalRef.componentInstance.quoteEmailDetailsRequestMessage = this.quoteEmailDetailsRequestMessage;

    const subscription = modalRef.componentInstance.quoteEmailDetailsRequestMessageChange.pipe(takeUntil(this.destroy$)).subscribe((updatedMessage: string) => {
      this.quoteEmailDetailsRequestMessage = updatedMessage;
    });
    this._subscriptionArray.push(subscription);
  }

  Cancel(): void {
    this.router.navigate(['partner', 'quotelist']);
    this.modalService.dismissAll();
  }

  copyToClipboard(): void {
    const copyText = (document.getElementById('myInputField') as HTMLInputElement).value;

    navigator.clipboard.writeText(copyText).then(() => {
      this.notifier.success({
        title: this.translate.instant('TRANSLATE.QUOTE_COPY_CONFIRMATION_SUCCESS_MESSAGE')
      });
    }).catch(() => {
      this.notifier.alert({
        title: this.translate.instant('TRANSLATE.QUOTE_COPY_CONFIRMATION_ERROR_MESSAGE')
      });
    });
  }

  ngOnDestroy(): void {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
