/** Small HTTP helpers shared by every API handler. */

/** Builds a JSON response (the Laravel API only ever returns JSON). */
export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(headers ?? {}),
    },
  });
}

/**
 * Flattens a FormData into a plain object, understanding PHP-style
 * `field[]` array notation.
 */
export function formToObject(form: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of form.entries()) {
    if (key.endsWith("[]")) {
      const base = key.slice(0, -2);
      const existing = Array.isArray(result[base]) ? (result[base] as unknown[]) : [];
      existing.push(value);
      result[base] = existing;
      continue;
    }

    if (key in result) {
      const existing = result[key];
      result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      continue;
    }

    result[key] = value;
  }

  return result;
}

/** Normalises a value that may arrive as a JSON string or a real array. */
export function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  }
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

/** Reads a value from the parsed body, falling back to the FormData entry. */
export function field(ctx: { body: Record<string, unknown>; form: FormData | null }, name: string): unknown {
  if (name in ctx.body) return ctx.body[name];
  const fromForm = ctx.form?.get(name);
  if (fromForm === null) return undefined;
  return fromForm;
}

/**
 * Returns every file attached to a form field.
 * Accepts both `images` and PHP-style `images[]` keys.
 */
export function files(ctx: { form: FormData | null }, name: string): File[] {
  if (!ctx.form) return [];
  const entries = [...ctx.form.getAll(name), ...ctx.form.getAll(`${name}[]`)];
  return entries.filter((entry): entry is File => entry instanceof File);
}

/** Returns the first file attached to a form field. */
export function file(ctx: { form: FormData | null }, name: string): File | null {
  const found = files(ctx, name)[0];
  return found ?? null;
}
