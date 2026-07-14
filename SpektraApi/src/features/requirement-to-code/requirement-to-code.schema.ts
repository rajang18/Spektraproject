import { z } from 'zod';

export const requirementToCodeRequestSchema = z.object({
  body: z.object({
    requirement: z.string().trim().min(20).max(4000),
    targetFramework: z.string().trim().min(2).max(80).default('Angular 18'),
    codingStandards: z.string().trim().max(1000).optional(),
    clarificationAnswers: z.array(z.string().trim().min(1).max(600)).max(12).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export type RequirementToCodeRequest = z.infer<typeof requirementToCodeRequestSchema>['body'];
