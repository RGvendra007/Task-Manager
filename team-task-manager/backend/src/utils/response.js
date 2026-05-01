/**
 * Standardised API response helpers
 */

const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const created = (res, data = {}, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

const error = (res, message = 'An error occurred', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden - Insufficient permissions') => {
  return error(res, message, 403);
};

const badRequest = (res, message = 'Bad request') => {
  return error(res, message, 400);
};

const validationError = (res, errors) => {
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
};

module.exports = {
  success,
  created,
  error,
  notFound,
  unauthorized,
  forbidden,
  badRequest,
  validationError,
};
