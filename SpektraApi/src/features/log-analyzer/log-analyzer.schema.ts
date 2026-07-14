import { z } from 'zod';

export const logAnalyzerRequestSchema = z.object({
  body: z.object({
    logContent: z.string().trim().min(20).max(20000),
    environment: z.string().trim().max(80).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export type LogAnalyzerRequest = z.infer<typeof logAnalyzerRequestSchema>['body'];
