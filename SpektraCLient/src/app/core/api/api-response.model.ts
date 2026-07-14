export interface ApiResponse<T> {
  data: T;
  correlationId: string;
  message?: string;
  succeeded: boolean;
}
