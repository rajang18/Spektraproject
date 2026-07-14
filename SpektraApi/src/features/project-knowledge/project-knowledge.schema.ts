import { z } from 'zod';

export const chatRequestSchema = z.object({
  body: z.object({
    question: z.string().trim().min(2).max(8000),
    conversationId: z.string().trim().min(2).max(120).default('default-conversation')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const projectSearchRequestSchema = z.object({
  body: z.object({
    query: z.string().trim().min(2).max(8000),
    mode: z.enum(['semantic', 'keyword', 'hybrid', 'exhaustive']).optional().default('hybrid'),
    limit: z.number().int().min(1).max(50).optional().default(12)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const projectExplainRequestSchema = z.object({
  body: z.object({
    query: z.string().trim().min(2).max(8000),
    conversationId: z.string().trim().min(2).max(120).default('default-conversation')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const projectCodeRequestSchema = z.object({
  body: z.object({
    filePath: z.string().trim().min(2).max(1000)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const conversationListQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).optional().default(50)
  })
});

export const conversationHistoryParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    conversationId: z.string().trim().min(2).max(120)
  }),
  query: z.object({}).optional()
});

export const selectZipRequestSchema = z.object({
  body: z.object({
    zipFileName: z.string().trim().min(3).max(260).refine((value) => value.toLowerCase().endsWith('.zip'), {
      message: 'zipFileName must end with .zip'
    })
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export type ChatRequest = z.infer<typeof chatRequestSchema>['body'];
export type ProjectSearchRequest = z.infer<typeof projectSearchRequestSchema>['body'];
export type ProjectExplainRequest = z.infer<typeof projectExplainRequestSchema>['body'];
export type ProjectCodeRequest = z.infer<typeof projectCodeRequestSchema>['body'];
export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>['query'];
export type ConversationHistoryParams = z.infer<typeof conversationHistoryParamsSchema>['params'];
export type SelectZipRequest = z.infer<typeof selectZipRequestSchema>['body'];
