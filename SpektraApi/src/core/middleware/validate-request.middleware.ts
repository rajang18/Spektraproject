import { RequestHandler } from 'express';
import { AnyZodObject } from 'zod';

export function validateRequest(schema: AnyZodObject): RequestHandler {
  return (request, _response, next) => {
    const parsed = schema.parse({
      body: request.body,
      params: request.params,
      query: request.query
    });

    request.body = parsed.body;
    request.params = parsed.params;
    request.query = parsed.query;
    next();
  };
}
