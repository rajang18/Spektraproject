import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'innerTranslate',
  standalone: true
})
export class InnerTranslatePipe implements PipeTransform {

  constructor(private translateService: TranslateService) {}

  transform(value: string): string {
    if (!value) {
      return '';
    }
    const words = value.split(' ');
    let translatedString = '';
    words.forEach((word, index) => {
      // Remove non-alphanumeric characters for translation
      const cleanWord = word.replace(/[^\w\s]/gi, '');
      this.translateService.get(cleanWord).subscribe((translation: string) => {
        if (index === 0) {
          translatedString = value.replace(word, translation);
        } else {
          translatedString = translatedString.replace(word, translation);
        }
      });
    });
    return translatedString;
  }
}
