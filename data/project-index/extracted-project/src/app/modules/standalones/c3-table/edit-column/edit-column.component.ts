import { Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
@Component({
  selector: 'app-edit-column',
  standalone: true,
  imports: [
    FormsModule,
    NgbTooltipModule,
    TranslateModule
  ],
  templateUrl: './edit-column.component.html',
  styleUrl: './edit-column.component.scss'
})

export class EditColumnComponent implements OnInit {
  @Input() data: any;

  @Input() field: string;

  @Output() reloadTable: EventEmitter<any> = new EventEmitter<any>();

  isEditing: boolean = false;

  @Output() enableEdit: EventEmitter<any> = new EventEmitter<any>();
  originalName : any = '';

  constructor(
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private router:Router,

  ) {

  }
  ngOnInit(): void {
    this.data[this.field] = this.unescapeHtml(this.data[this.field])
    if(this.router.url.toLowerCase().includes("partner/customer")){
      this.data.OriginalName =this.data.Name;
    }
    if(this.router.url.toLowerCase().includes("partner/resellers")){
      this.data.OriginalName =this.data.Name;
    }
  }

  unescapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, `'`)
      .replace(/&amp;/g, '&');
  }
  
  toggleEditField() {
    this.isEditing = !this.isEditing;
  }

  onClickSave() {
    if(this.router.url.toLowerCase().includes("partner/customer")){
    const confirmationText = this._translateService.instant('TRANSLATE.POPUP_UPDATE_CUSTOMER_NAME_CONFIRMATION_TEXT');
    this._notifierService.confirm({title:confirmationText , confirmButtonColor: 'green'}).then((result) => {
      if (result.value) {
        this.triggerUpdate();
      }
    });
  }else if(this.router.url.toLowerCase().includes("partner/resellers")){
    const confirmationText = this._translateService.instant('TRANSLATE.POPUP_UPDATE_RESELLER_NAME_CONFIRMATION_TEXT');
    this._notifierService.confirm({title:confirmationText , confirmButtonColor: 'green'}).then((result) => {
      if (result.value) {
        this.triggerUpdate();
      }
    });
  }
  }

  onClickCancel() {
    if(this.router.url.toLowerCase().includes("partner/customer")){
      this.data.Name = this.data.OriginalName;
    }
    if(this.router.url.toLowerCase().includes("partner/resellers")){
      this.data.Name = this.data.OriginalName;
    }
    this.toggleEditField();
    this.reloadTable.emit();
  }

  triggerUpdate() {
    this.toggleEditField();
    this.enableEdit.emit(this.data);
  }
}
