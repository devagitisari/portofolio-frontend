/**
 * Error type mirroring Laravel's HTTP error responses so the existing
 * frontend error handling (`toErrorMessage` in services/backendApi.ts) keeps
 * working unchanged.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  static badRequest(message = "Bad request.", errors?: Record<string, string[]>) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthenticated.") {
    return new ApiError(401, message);
  }

  static forbidden(message = "This action is unauthorized.") {
    return new ApiError(403, message);
  }

  static notFound(message = "Not found.") {
    return new ApiError(404, message);
  }

  static tooManyRequests(message = "Too many requests.") {
    return new ApiError(429, message);
  }

  /** Laravel returns 422 for validation failures. */
  static validation(message: string, errors: Record<string, string[]>) {
    return new ApiError(422, message, errors);
  }
}
