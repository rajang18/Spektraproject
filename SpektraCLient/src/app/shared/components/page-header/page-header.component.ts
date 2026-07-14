import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <header class="page-header">
      <mat-icon *ngIf="icon()">{{ icon() }}</mat-icon>
      <div>
        <h1>{{ title() }}</h1>
        <p *ngIf="description()">{{ description() }}</p>
      </div>
    </header>
  `,
  styles: [
    '.page-header { display: flex; align-items: center; gap: 16px; }',
    'h1 { margin: 0; font-size: 28px; font-weight: 700; }',
    'p { margin: 4px 0 0; color: #6b7280; }'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly icon = input<string>();
}
