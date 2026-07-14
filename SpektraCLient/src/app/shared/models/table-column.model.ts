export interface TableColumn<TItem> {
  key: keyof TItem | string;
  header: string;
  isSortable?: boolean;
}
