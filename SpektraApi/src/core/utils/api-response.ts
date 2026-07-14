export function ok<T>(data: T, correlationId?: string) {
  return {
    succeeded: true,
    correlationId,
    data
  };
}
