import { ApiError } from "./errors";

type Data = Record<string, unknown>;

const label = (field: string) => field.replace(/_/g, " ");

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

/**
 * A tiny Laravel-flavoured validator. It intentionally mirrors Laravel's
 * messages so the frontend keeps showing the same error copy.
 */
export class Validator {
  private readonly data: Data;
  private readonly errors: Record<string, string[]> = {};
  private readonly validated: Data = {};
  private pendingUnique: Array<() => Promise<void>> = [];

  constructor(data: Data) {
    this.data = data ?? {};
  }

  private fail(field: string, message: string) {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field]!.push(message);
  }

  private raw(field: string): unknown {
    return this.data[field];
  }

  required(field: string): this {
    if (isEmpty(this.raw(field))) {
      this.fail(field, `The ${label(field)} field is required.`);
    } else {
      this.validated[field] = this.raw(field);
    }
    return this;
  }

  string(field: string, opts: { max?: number; min?: number; nullable?: boolean } = {}): this {
    const value = this.raw(field);
    if (isEmpty(value)) {
      if (opts.nullable) {
        this.validated[field] = null;
      }
      return this;
    }
    if (typeof value !== "string") {
      this.fail(field, `The ${label(field)} must be a string.`);
      return this;
    }
    if (opts.max !== undefined && value.length > opts.max) {
      this.fail(field, `The ${label(field)} must not be greater than ${opts.max} characters.`);
      return this;
    }
    if (opts.min !== undefined && value.length < opts.min) {
      this.fail(field, `The ${label(field)} must be at least ${opts.min} characters.`);
      return this;
    }
    this.validated[field] = value;
    return this;
  }

  email(field: string, opts: { max?: number; nullable?: boolean } = {}): this {
    const value = this.raw(field);
    if (isEmpty(value)) {
      if (opts.nullable) {
        this.validated[field] = null;
      }
      return this;
    }
    if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this.fail(field, `The ${label(field)} must be a valid email address.`);
      return this;
    }
    if (opts.max !== undefined && value.length > opts.max) {
      this.fail(field, `The ${label(field)} must not be greater than ${opts.max} characters.`);
      return this;
    }
    this.validated[field] = value;
    return this;
  }

  integer(field: string, opts: { min?: number; max?: number; nullable?: boolean } = {}): this {
    const value = this.raw(field);
    if (isEmpty(value)) {
      if (opts.nullable) {
        this.validated[field] = null;
      }
      return this;
    }
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      this.fail(field, `The ${label(field)} must be an integer.`);
      return this;
    }
    if (opts.min !== undefined && parsed < opts.min) {
      this.fail(field, `The ${label(field)} must be at least ${opts.min}.`);
      return this;
    }
    if (opts.max !== undefined && parsed > opts.max) {
      this.fail(field, `The ${label(field)} must not be greater than ${opts.max}.`);
      return this;
    }
    this.validated[field] = parsed;
    return this;
  }

  boolean(field: string, opts: { nullable?: boolean } = {}): this {
    const value = this.raw(field);
    if (isEmpty(value)) {
      if (opts.nullable) {
        this.validated[field] = null;
      }
      return this;
    }
    this.validated[field] = toBoolean(value);
    return this;
  }

  array(field: string, opts: { nullable?: boolean } = {}): this {
    const value = this.raw(field);
    if (isEmpty(value)) {
      if (opts.nullable) {
        this.validated[field] = [];
      }
      return this;
    }
    if (!Array.isArray(value)) {
      this.fail(field, `The ${label(field)} must be an array.`);
      return this;
    }
    this.validated[field] = value;
    return this;
  }

  url(field: string, opts: { max?: number; nullable?: boolean } = {}): this {
    const value = this.raw(field);
    if (isEmpty(value)) {
      if (opts.nullable) {
        this.validated[field] = null;
      }
      return this;
    }
    if (typeof value !== "string" || !isValidUrl(value)) {
      this.fail(field, `The ${label(field)} must be a valid URL.`);
      return this;
    }
    if (opts.max !== undefined && value.length > opts.max) {
      this.fail(field, `The ${label(field)} must not be greater than ${opts.max} characters.`);
      return this;
    }
    this.validated[field] = value;
    return this;
  }

  date(field: string, opts: { nullable?: boolean } = {}): this {
    const value = this.raw(field);
    if (isEmpty(value)) {
      if (opts.nullable) {
        this.validated[field] = null;
      }
      return this;
    }
    if (typeof value !== "string" && !(value instanceof Date)) {
      this.fail(field, `The ${label(field)} must be a valid date.`);
      return this;
    }
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      this.fail(field, `The ${label(field)} must be a valid date.`);
      return this;
    }
    this.validated[field] = parsed;
    return this;
  }

  in(field: string, allowed: string[], opts: { nullable?: boolean } = {}): this {
    const value = this.raw(field);
    if (isEmpty(value)) {
      if (opts.nullable) {
        this.validated[field] = null;
      }
      return this;
    }
    if (typeof value !== "string" || !allowed.includes(value)) {
      this.fail(field, `The selected ${label(field)} is invalid.`);
      return this;
    }
    this.validated[field] = value;
    return this;
  }

  /** Field must be present in the payload (used for optional-but-keyed fields). */
  present(field: string): this {
    if (field in this.data) {
      this.validated[field] = this.data[field];
    }
    return this;
  }

  unique(field: string, check: (value: unknown) => Promise<boolean>): this {
    const value = this.raw(field);
    if (isEmpty(value)) {
      return this;
    }
    this.pendingUnique.push(async () => {
      const taken = await check(value);
      if (taken) {
        this.fail(field, `The ${label(field)} has already been taken.`);
      } else {
        this.validated[field] = value;
      }
    });
    return this;
  }

  get values(): Data {
    return this.validated;
  }

  get errorMap(): Record<string, string[]> {
    return this.errors;
  }

  get hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  /** Runs the async checks (uniqueness) and throws a Laravel-style 422. */
  async validate(): Promise<Data> {
    for (const check of this.pendingUnique) {
      await check();
    }
    this.pendingUnique = [];

    if (this.hasErrors) {
      const first = Object.values(this.errors)[0]?.[0] ?? "The given data was invalid.";
      throw ApiError.validation(first, this.errors);
    }

    return this.validated;
  }
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Laravel's boolean casting: "1", "true", "on", "yes" are truthy. */
export function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return ["1", "true", "on", "yes"].includes(value.toLowerCase());
  }
  return false;
}
