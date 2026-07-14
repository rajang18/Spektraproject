import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { TableColumn } from '../../models/table-column.model';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [MatTableModule],
  template: `
    <table mat-table [dataSource]="data()" class="data-table">
      @for (column of columns(); track column.key) {
        <ng-container [matColumnDef]="column.key.toString()">
          <th mat-header-cell *matHeaderCellDef>{{ column.header }}</th>
          <td mat-cell *matCellDef="let row">{{ row[column.key] }}</td>
        </ng-container>
      }

      <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
    </table>
  `,
  styles: ['.data-table { width: 100%; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<TItem extends Record<string, unknown>> {
  readonly columns = input<TableColumn<TItem>[]>([]);
  readonly data = input<TItem[]>([]);

  displayedColumns(): string[] {
    return this.columns().map((column) => column.key.toString());
  }
}
