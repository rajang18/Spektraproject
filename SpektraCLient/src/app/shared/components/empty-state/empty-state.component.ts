import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="empty-state">
      <mat-icon>{{ icon() }}</mat-icon>
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
    </section>
  `,
  styles: [
    '.empty-state { display: grid; justify-items: center; gap: 8px; padding: 40px; color: #6b7280; text-align: center; }',
    'mat-icon { width: 40px; height: 40px; font-size: 40px; }',
    'h2 { margin: 0; color: #1f2937; font-size: 20px; }',
    'p { margin: 0; }'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  readonly icon = input('auto_awesome');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}
