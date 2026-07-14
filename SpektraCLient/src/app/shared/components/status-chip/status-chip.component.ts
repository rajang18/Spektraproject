import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [MatChipsModule],
  template: '<mat-chip [class]="toneClass()">{{ label() }}</mat-chip>',
  styles: [
    '.status-chip--success { background: #dcfce7; color: #166534; }',
    '.status-chip--warning { background: #fef3c7; color: #92400e; }',
    '.status-chip--danger { background: #fee2e2; color: #991b1b; }',
    '.status-chip--neutral { background: #e5e7eb; color: #374151; }'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusChipComponent {
  readonly label = input.required<string>();
  readonly tone = input<StatusTone>('neutral');
  readonly toneClass = computed(() => `status-chip--${this.tone()}`);
}
