import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-email-template',
  templateUrl: './email-template.component.html',
  styleUrls: ['./email-template.component.scss']
})
export class EmailTemplateComponent {
  @Input() quoteEmailDetailsRequestMessage: string;
  @Output() quoteEmailDetailsRequestMessageChange = new EventEmitter<string>();

  EncodedQuoteEmailRequestMessage: string;

  constructor(
    public activeModal: NgbActiveModal,
    private translate: TranslateService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.OnQuoteEmailRequestMessageChange();
  }

  OnQuoteEmailRequestMessageChange(): void {
    this.EncodedQuoteEmailRequestMessage = encodeURIComponent(this.quoteEmailDetailsRequestMessage);
    this.quoteEmailDetailsRequestMessageChange.emit(this.quoteEmailDetailsRequestMessage);
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }
}
