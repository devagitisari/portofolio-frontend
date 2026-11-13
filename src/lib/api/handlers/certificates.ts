import { prisma } from "../prisma";
import { file, json } from "../http";
import { ApiError } from "../errors";
import { Validator } from "../validate";
import { serializeCertificate } from "../serialize";
import { deleteFromCloudinary, uploadToCloudinary } from "../cloudinary";
import { assertUploadMime, assertUploadSize, LARAVEL_IMAGE_LIMIT_BYTES } from "../upload";
import type { RouteDefinition } from "../router";
import type { Ctx } from "../types";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];

async function index(): Promise<Response> {
  const certificates = await prisma.certificate.findMany({
    orderBy: { date: "desc" },
  });

  return json({ data: certificates.map((certificate) => serializeCertificate(certificate)) });
}

async function show(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const certificate = Number.isInteger(id) ? await prisma.certificate.findUnique({ where: { id } }) : null;

  if (!certificate) {
    throw ApiError.notFound();
  }

  return json({ data: serializeCertificate(certificate) });
}

/**
 * Returns the first page of a PDF certificate as an image.
 * Cloudinary renders PDFs for us, so the URL only needs its extension swapped.
 */
async function thumbnail(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const certificate = Number.isInteger(id) ? await prisma.certificate.findUnique({ where: { id } }) : null;

  if (!certificate) {
    throw ApiError.notFound();
  }

  if (!certificate.image || !certificate.image.toLowerCase().endsWith(".pdf")) {
    return json({ error: "Not a PDF" }, 400);
  }

  if (certificate.image.includes("res.cloudinary.com")) {
    return json({ thumbnail: certificate.image.replace(/\.pdf$/i, ".jpg") });
  }

  // Locally stored PDFs cannot be rasterised on a serverless runtime.
  return json({ error: "PDF not found" }, 404);
}

async function store(ctx: Ctx): Promise<Response> {
  const validated = await new Validator(ctx.body)
    .required("title")
    .string("title", { max: 255 })
    .required("issuer")
    .string("issuer", { max: 255 })
    .string("description", { nullable: true })
    .date("date", { nullable: true })
    .date("expires_date", { nullable: true })
    .url("credential_url", { max: 2048, nullable: true })
    .validate();

  const imageFile = file(ctx, "image");
  let image: string | null = null;

  if (imageFile) {
    assertUploadSize(imageFile, "image", LARAVEL_IMAGE_LIMIT_BYTES);
    assertUploadMime(imageFile, "image", ALLOWED_MIME);
    image = await uploadToCloudinary(imageFile, "certificates");
  }

  const certificate = await prisma.certificate.create({
    data: {
      title: String(validated.title),
      issuer: String(validated.issuer),
      description: (validated.description as string | null) ?? null,
      date: (validated.date as Date | null) ?? null,
      expiresDate: (validated.expires_date as Date | null) ?? null,
      credentialUrl: (validated.credential_url as string | null) ?? null,
      image,
    },
  });

  return json({ message: "Certificate created successfully", data: serializeCertificate(certificate) }, 201);
}

async function update(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const certificate = Number.isInteger(id) ? await prisma.certificate.findUnique({ where: { id } }) : null;

  if (!certificate) {
    throw ApiError.notFound();
  }

  const validated = await new Validator(ctx.body)
    .required("title")
    .string("title", { max: 255 })
    .required("issuer")
    .string("issuer", { max: 255 })
    .string("description", { nullable: true })
    .date("date", { nullable: true })
    .date("expires_date", { nullable: true })
    .url("credential_url", { max: 2048, nullable: true })
    .validate();

  const imageFile = file(ctx, "image");
  let image: string | undefined;

  if (imageFile) {
    assertUploadSize(imageFile, "image", LARAVEL_IMAGE_LIMIT_BYTES);
    assertUploadMime(imageFile, "image", ALLOWED_MIME);
    if (certificate.image) {
      await deleteFromCloudinary(certificate.image);
    }
    image = (await uploadToCloudinary(imageFile, "certificates")) ?? undefined;
  }

  const updated = await prisma.certificate.update({
    where: { id: certificate.id },
    data: {
      title: String(validated.title),
      issuer: String(validated.issuer),
      description: (validated.description as string | null) ?? null,
      date: (validated.date as Date | null) ?? null,
      expiresDate: (validated.expires_date as Date | null) ?? null,
      credentialUrl: (validated.credential_url as string | null) ?? null,
      ...(image !== undefined ? { image } : {}),
    },
  });

  return json({ message: "Certificate updated successfully", data: serializeCertificate(updated) });
}

async function destroy(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const certificate = Number.isInteger(id) ? await prisma.certificate.findUnique({ where: { id } }) : null;

  if (!certificate) {
    throw ApiError.notFound();
  }

  if (certificate.image) {
    await deleteFromCloudinary(certificate.image);
  }

  await prisma.certificate.delete({ where: { id: certificate.id } });

  return json({ message: "Certificate deleted successfully" });
}

export const certificateRoutes: RouteDefinition[] = [
  { method: "GET", pattern: "certificates", handler: index },
  { method: "GET", pattern: "certificates/:id", handler: show },
  { method: "GET", pattern: "certificates/:id/thumbnail", handler: thumbnail },
  { method: "GET", pattern: "admin/certificates", handler: index, auth: true },
  { method: "GET", pattern: "admin/certificates/:id", handler: show, auth: true },
  { method: "POST", pattern: "admin/certificates", handler: store, auth: true },
  { method: "PUT", pattern: "admin/certificates/:id", handler: update, auth: true },
  { method: "PATCH", pattern: "admin/certificates/:id", handler: update, auth: true },
  { method: "DELETE", pattern: "admin/certificates/:id", handler: destroy, auth: true },
];
