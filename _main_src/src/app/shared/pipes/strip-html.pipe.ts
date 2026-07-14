import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripHtml'
})
export class StripHtmlPipe implements PipeTransform {

  transform(value: string, limit: number = 100): string {
    if (!value) {
      return '';
    }

    // Strip HTML tags
    const strippedText = value.replace(/<\/?[^>]+(>|$)/g, '');

    // Truncate text
    return strippedText.length > limit ? strippedText.substring(0, limit) + '...' : strippedText;
  }

}
