import { HttpParams } from '@angular/common/http';

export function toHttpParams(source: Record<string, string | number | boolean | null | undefined>): HttpParams {
  return Object.entries(source).reduce((params, [key, value]) => {
    return value === null || value === undefined ? params : params.set(key, String(value));
  }, new HttpParams());
}
