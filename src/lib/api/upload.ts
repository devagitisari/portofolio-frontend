import { ApiError } from "./errors";

/**
 * Vercel Serverless Functions reject request bodies larger than 4.5 MB, so
 * every upload is validated before it reaches the function.
 */
export const VERCEL_BODY_LIMIT_BYTES = 4 * 1024 * 1024;

/** Laravel's `max:2048` rule, used for project images and certificates. */
export const LARAVEL_IMAGE_LIMIT_BYTES = 2048 * 1024;

/** Throws a Laravel-style validation error when the file is too large. */
export function assertUploadSize(upload: File, fieldName: string, maxBytes = VERCEL_BODY_LIMIT_BYTES): void {
  if (upload.size <= maxBytes) return;

  const megabytes = Math.floor(maxBytes / 1024 / 1024);
  const message = `The ${fieldName} field must not be greater than ${megabytes} kilobytes.`;

  throw ApiError.validation(message, { [fieldName]: [message] });
}

/** Rejects uploads whose mime type is not allowed (Laravel's `mimes:` rule). */
export function assertUploadMime(upload: File, fieldName: string, allowed: string[]): void {
  if (allowed.includes(upload.type)) return;

  const message = `The ${fieldName} must be a file of type: ${allowed.map((mime) => mime.split("/")[1]).join(", ")}.`;

  throw ApiError.validation(message, { [fieldName]: [message] });
}
