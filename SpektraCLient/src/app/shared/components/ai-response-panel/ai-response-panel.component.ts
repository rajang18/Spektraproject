import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ai-response-panel',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (isLoading()) {
          <mat-spinner diameter="32" />
        } @else {
          <pre>{{ content() || 'No generated content yet.' }}</pre>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: ['pre { white-space: pre-wrap; font-family: "Roboto Mono", Consolas, monospace; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiResponsePanelComponent {
  readonly title = input('AI Response');
  readonly content = input<string | null>(null);
  readonly isLoading = input(false);
}
