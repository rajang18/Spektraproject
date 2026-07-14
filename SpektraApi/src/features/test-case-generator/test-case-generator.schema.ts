import { z } from 'zod';

export const testCaseGeneratorRequestSchema = z.object({
  body: z.object({
    requirement: z.string().trim().min(20).max(4000),
    testLevel: z.enum(['unit', 'integration', 'e2e']).default('unit')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export type TestCaseGeneratorRequest = z.infer<typeof testCaseGeneratorRequestSchema>['body'];
