import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'minutesToTimepassed',
  standalone: true
})
export class MinutesToTimepassedPipe implements PipeTransform {
  constructor(private _translateService: TranslateService) {} 

  transform(val: any): string {
    let totalMinutes = parseInt(val, 10);
    let days = Math.floor(totalMinutes / (24 * 60));
    let hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    let minutes = Math.floor(totalMinutes % 60);

    let formattedString = '';

    if (days > 0) {
      formattedString += `${days} ${this._translateService.instant('TRANSLATE.DAYS')}`;
    }
    if (hours > 0) {
      formattedString += `${hours} ${this._translateService.instant('TRANSLATE.HOURS')}`;
    }
    if (minutes >= 0) {
      formattedString += `${minutes} ${this._translateService.instant('TRANSLATE.MINUTES')}`;
    }

    formattedString += `${this._translateService.instant('TRANSLATE.AGO')}`;
    return formattedString;
  }

}
