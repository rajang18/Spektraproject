# Datatables Guide — C3 Main Project

C3 renders data grids with **angular-datatables** (a wrapper over datatables.net).
It does NOT use Angular Material `mat-table`, `ngx-datatable`, or plain HTML tables for data grids.

## Building Blocks
- `angular-datatables`: `DataTablesModule`, `DataTableDirective`, `ADTSettings`.
- Shared wrapper component: `app-c3-table`
  (`src/app/modules/standalones/c3-table/c3-table.component.ts`, standalone).
- Params mapper: `mapParamsWithApi`
  (`src/app/modules/standalones/c3-table/c3-table-utils.ts`).
- Column helpers: `checkboxColumn`, `defaultCheckboxProps`; `edit-column` component for show/hide columns.

## Standard Pattern (server-side)
A feature component declares a config and builds it, usually in `handleTableConfig()`:

```ts
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';

datatableConfig: ADTSettings;
@ViewChild('createCol') createCol: TemplateRef<any>;

handleTableConfig() {
  setTimeout(() => {
    this.datatableConfig = {
      serverSide: true,
      pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
      order: [0, 'desc'],
      ajax: (dataTablesParameters: any, callback: any) => {
        const { StartInd, SortColumn, SortOrder, length } = mapParamsWithApi(dataTablesParameters);
        const reqBody = { StartInd, PageSize: length, SortColumn, SortOrder /* + filters */ };
        this._service.getData(reqBody)
          .pipe(takeUntil(this.destroy$))
          .subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            if (Data.length > 0) { [{ TotalRecords: recordsTotal }] = Data; }
            callback({ data: Data, recordsTotal, recordsFiltered: recordsTotal });
          });
      },
      columns: [
        {
          data: 'CreatedDate',
          className: 'col-md-2',
          title: this._translateService.instant('TRANSLATE.AUDITLOG_TEXT_TABLE_HEADER_DATE'),
          defaultContent: '',
          ngTemplateRef: { ref: this.createCol }   // custom cell template
        }
        // ...more columns
      ]
    };
  });
}
```

## Template
Either use the shared wrapper:

```html
<app-c3-table [datatableConfig]="datatableConfig" [tableId]="'auditLogTable'"></app-c3-table>
```

Or the raw directive (as inside c3-table.component.html):

```html
<table datatable [dtOptions]="dtOptions" [dtTrigger]="dtTrigger"
       class="table align-middle table-row-dashed dataTable no-footer">
  <thead>
    <tr>
      <th *ngFor="let column of dtOptions.columns">{{ column?.title }}</th>
    </tr>
  </thead>
  <tbody></tbody>
</table>
```

## Key Conventions
- Server-side pagination/sorting/search is the default (`serverSide: true`).
- Column titles come from ngx-translate keys (`TRANSLATE.*`), never hardcoded.
- Custom cell UI uses `@ViewChild` `TemplateRef` + `column.ngTemplateRef.ref`.
- `mapParamsWithApi` converts DataTables params (start, length, order, search) into the
  C3 API body (StartInd, PageSize, SortColumn, SortOrder, per-column search).
- `callback({ data, recordsTotal, recordsFiltered })` feeds rows + total back to the grid.
- Row selection uses `checkboxColumn`; column visibility uses the `edit-column` component.

## Real Examples In Codebase
- `modules/partner/audit-log/components/audit-log/audit-log.component.ts`
- `modules/partner/accountmanger/accountmanagers/accountmanagers.component.ts`
- ~169 components import `ADTSettings` — this is the standard grid across C3.

## When Adding A New Grid
1. Import `ADTSettings` and `mapParamsWithApi`.
2. Add a feature service method returning `{ Data }` with `TotalRecords`.
3. Build `datatableConfig` (serverSide, ajax, columns with translate titles).
4. Add `TemplateRef` columns for action/status/custom cells.
5. Render via `app-c3-table` (or `datatable [dtOptions] [dtTrigger]`).
