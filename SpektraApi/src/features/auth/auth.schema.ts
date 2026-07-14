import { z } from 'zod';

export const authLoginRequestSchema = z.object({
  body: z.object({
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export type AuthLoginRequest = z.infer<typeof authLoginRequestSchema>['body'];
