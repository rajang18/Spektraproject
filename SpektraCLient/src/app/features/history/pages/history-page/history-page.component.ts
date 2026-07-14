import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [MatCardModule, MatIconModule, PageHeaderComponent],
  template: `
    <section class="page history-page">
      <app-page-header icon="history" title="History" description="Review your recent AI workflows and activity." />
      <mat-card>
        <p>History is not available yet. This page will show recent workflow activity once implemented.</p>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .history-page {
        display: grid;
        gap: 20px;
        padding: 0;
      }

      mat-card {
        padding: 24px;
        border-radius: 22px;
        background: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
      }

      p {
        margin: 0;
        color: #475569;
        font-size: 0.98rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryPageComponent {}
