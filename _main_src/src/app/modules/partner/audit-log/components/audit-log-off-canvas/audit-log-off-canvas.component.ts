import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbActiveOffcanvas, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { ADTColumns, ADTSettings } from 'angular-datatables/src/models/settings';
import { AuditLogService } from '../../services/audit-log.service';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service'; 
import { C3TranslatePipe } from 'src/app/shared/pipes/c3-translate.pipe';

@Component({
  selector: 'app-audit-log-off-canvas',
  templateUrl: './audit-log-off-canvas.component.html',
  styleUrl: './audit-log-off-canvas.component.scss',
  providers: [AuditLogService]
})
export class AuditLogOffCanvasComponent implements OnInit, OnDestroy {

  @Input() auditDetails: any;
  datatableConfig: ADTSettings;
  auditLogDetails: any = [];
  isMoreDetails: boolean = false
  showMoreDetails: boolean = true;
  isKeyExist: boolean = false;
  translatedItems: any[] = [];
  constructor(
    private offcanvas: NgbOffcanvas, 
    private _cdRef: ChangeDetectorRef, 
    private _logService: AuditLogService, 
    public _translateService: TranslateService,
    private _activeCanvas: NgbActiveOffcanvas,
    private _appService: AppSettingsService,  
    private c3Translate:C3TranslatePipe,
    
  ) {


  }

  ngOnInit(): void {
    if (this.auditDetails?.Data?.length > 0) {
      this.translatedItems = this.auditDetails.Data.map((element: any) => {

        if (element?.Name === 'EVENT_DATA_HAS_ADDITIONAL_DETAIL') {
          this.isMoreDetails = true;
        }
        // Calculate the translated key
        const translatedKey = this._translateService.instant('TRANSLATE.' + element?.Name);
        const isKeyExist = translatedKey !== ('TRANSLATE.' + element?.Name);
        return {
          ...element,
          translatedKey: isKeyExist ? translatedKey : element?.Name,
          isKeyExist
        };
      });
    }
    this._cdRef.detectChanges();
  }

  showDetails(eventLogId: any) {
    let reqBody = {
      StartInd: 1,
      PageSize: 100000,
      EventLogId: eventLogId
    };
    this._logService.getMoreDetails(eventLogId, reqBody).subscribe((response: any) => {
      let data = JSON.parse(response.Data.JsonResult);
      this.auditLogDetails = data; 
      this.handleTableConfig();
    });

  }

  handleTableConfig() {
    this.datatableConfig;
    this.showMoreDetails = false;
    setTimeout(() => {
      const self = this;
      const [headers, ...data] = this.auditLogDetails;
      this.datatableConfig = {
        serverSide: false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        data:data,
        columns: this.buildColumns(headers)
      };
      this._cdRef.detectChanges();
    });
  }

  buildColumns(data: any) {
    let columns: ADTColumns[] = [];
    for (let i in data) { 
      let col: ADTColumns = {
        orderable:false,
        title: this._translateService.instant('TRANSLATE.' + data[i]),
        data: i || '',
        render: (val: any) => {
          let html = '';
          if (i?.toLowerCase()?.indexOf('error') !== -1) {
            if (val?.length > 0) {
              val = val?.split(',');
              val.forEach(error=>{
                if (error != '' && error != null) {
                  let tansError =  !!error ? (this._translateService.instant('TRANSLATE.' + error)).toString().replace('TRANSLATE.', '') : (error || ''); 
                  html = html + ` <ul>
                      <li><span>${tansError}</span></li>
                  </ul>`
                }
              })
            }
            
            return html;
          } else { 
            return !!val ? this.c3Translate.transform(val, true) : (val || '');
          }

        }
      }


      columns.push(col);
    }
    return columns;
  }

  setHeaderStyle(action) {
    let status = true;
    if (action !== null && action.toLowerCase().includes("fail")) {
      status = false;
    }
    return status;
  }

  hideDetails(){
    this.showMoreDetails = true;
    this._cdRef.detectChanges();
  }

  close(){
    this._activeCanvas.dismiss();
  }

  isString(value: any): boolean {
    return typeof value === 'string';
  }

  checkLetterFrequency(value: string, letter: string, threshold: number): boolean {
    if (typeof value !== 'string') {
      return false;
    }
  
    // Ensure that the letter is a single character string
    if (typeof letter !== 'string' || letter.length !== 1) {
      return false;
    }
  
    const regex = new RegExp(letter, 'g');
    const matchCount = (value.match(regex) || []).length;
  
    return matchCount > threshold;
  }
  
  getFormattedValues(name: string, value: any): string[] {
    if (typeof value === 'number' || typeof value === 'boolean') {
      return [value.toString()];
    }
  
    if (typeof value === 'boolean' && 
        ['EVENT_CAN_PRICE_LAG', 'EVENT_CAN_PRICE_LEAD', 'CanPriceLead', 'CanPriceLag',
         'EVENT_OLD_CAN_PRICE_LAG', 'EVENT_NEW_CAN_PRICE_LEAD', 
         'EVENT_OLD_CAN_PRICE_LEAD', 'EVENT_NEW_CAN_PRICE_LAG'].includes(name)) {
      
      let keyName = (name === 'CanPriceLag') 
        ? this._translateService.instant('EVENT_CAN_PRICE_LAG') 
        : (name === 'CanPriceLead') 
          ? this._translateService.instant('EVENT_CAN_PRICE_LEAD') 
          : this._translateService.instant(name);
  
      return [keyName + ': ' + (value ? this._translateService.instant('AUDIT_LOG_TEXT_YES') 
                                       : this._translateService.instant('AUDIT_LOG_TEXT_NO'))];
    }
  
    if (typeof value === 'string') {
      return value.split(',').map(v => this.titleCase(v));
    }
  
    return [];
  }

  titleCase(value: string): string{

    if(!value) return value;

    const titleCaseValue = value
    .replace(/_/g, ' ')  // replace if we have any underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // adding space before capital letter
    .toLowerCase()  // converting to lowerCase
    .trim();

    /* here we are converting the first letter to uppercase And in the next step we are taking the rest of the value 
    except the first one and combining it and returing the value */
    return titleCaseValue.charAt(0).toUpperCase() + titleCaseValue.slice(1);  
  }
  
  // AT-20250327 This method attempts to fetch the translation for the given item's name.
  // If a valid translation is unavailable (i.e., the key doesn't exist),
  // it defaults to returning the original database value (item?.Name) as a fallback.
  // keyName(item: any): string {
  //   const translatedKey = this._translateService.instant('TRANSLATE.' + item?.Name);
  //   return translatedKey && translatedKey !== ('TRANSLATE.' + item?.Name) ? translatedKey : item?.Name;
  // }
  

  ngOnDestroy(): void {
    this.auditLogDetails = [];
    this.isMoreDetails= false
    this.showMoreDetails = true;
  }
}
