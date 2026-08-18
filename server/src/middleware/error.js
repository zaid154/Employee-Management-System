import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let error = err;

  // Normalise common Mongoose/Mongo errors into ApiError responses.
  if (error.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`A record with that ${field} already exists`);
  } else if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.badRequest('Validation failed', details);
  }

  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.isOperational ? error.message : 'Something went wrong on our end',
  };
  if (error.details) payload.details = error.details;
  if (!env.isProd && statusCode === 500) {
    payload.stack = err.stack;
    payload.message = err.message;
  }

  if (statusCode === 500) console.error('💥 Unhandled error:', err);

  res.status(statusCode).json(payload);
};
