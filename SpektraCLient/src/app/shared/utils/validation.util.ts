export function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}
