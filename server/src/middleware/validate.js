import { ApiError } from '../utils/apiError.js';

/**
 * Validates `req[source]` against a Zod schema and replaces it with the parsed
 * (and coerced) value. Aggregates all field errors into one 400 response.
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  req[source] = result.data;
  next();
};
