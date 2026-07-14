import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatforinitials',
  standalone: true
})
export class FormatforInitialsPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) return '';

    const words = value.split(' ');
    if (words.length === 1) {
      return (words[0].charAt(0) + words[0].charAt(1)).toUpperCase();
    } else {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
  }
}
