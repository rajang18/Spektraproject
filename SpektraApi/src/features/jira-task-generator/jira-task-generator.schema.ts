import { z } from 'zod';

export const jiraTaskGeneratorRequestSchema = z.object({
  body: z.object({
    requirement: z.string().trim().min(20).max(4000),
    projectKey: z.string().trim().min(2).max(20).optional(),
    includeAcceptanceCriteria: z.boolean().default(true)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export type JiraTaskGeneratorRequest = z.infer<typeof jiraTaskGeneratorRequestSchema>['body'];
