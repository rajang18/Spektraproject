import { Pipe, PipeTransform } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

@Pipe({
    name: 'c3Translate',
    standalone: true
  })
export class C3TranslatePipe implements PipeTransform {
    
    constructor( 
        private _translateService: TranslateService
    ) {

      }

    transform(value: string, isMultipleTranslate: boolean = false): string {
      const words = value.split(" ").filter(Boolean);
      if (isMultipleTranslate && words && words.length > 0) {
        const translatedWords = words.map(word => {
          const translated = this._translateService.instant('TRANSLATE.' + word.trim());
          return translated.replace('TRANSLATE.', '');
        });
        return translatedWords.join(" ");
      }
   
      if (value) {
        const translated = this._translateService.instant('TRANSLATE.' + value.trim());
        return translated.replace('TRANSLATE.', '');
      }
   
      return value || '';
    }

  }