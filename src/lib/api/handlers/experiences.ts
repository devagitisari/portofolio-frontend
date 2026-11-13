import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import { file, json } from "../http";
import { ApiError } from "../errors";
import { Validator } from "../validate";
import { serializeExperience } from "../serialize";
import { deleteFromCloudinary, uploadToCloudinary } from "../cloudinary";
import { assertUploadSize } from "../upload";
import type { RouteDefinition } from "../router";
import type { Ctx } from "../types";

async function index(): Promise<Response> {
  const experiences = await prisma.experience.findMany({
    orderBy: { startDate: "desc" },
  });

  return json({ data: experiences.map((experience) => serializeExperience(experience)) });
}

async function show(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const experience = Number.isInteger(id) ? await prisma.experience.findUnique({ where: { id } }) : null;

  if (!experience) {
    throw ApiError.notFound();
  }

  return json({ data: serializeExperience(experience) });
}

async function store(ctx: Ctx): Promise<Response> {
  const validated = await new Validator(ctx.body)
    .required("company")
    .string("company", { max: 255 })
    .required("position")
    .string("position", { max: 255 })
    .required("description")
    .string("description")
    .required("start_date")
    .date("start_date")
    .date("end_date", { nullable: true })
    .boolean("is_current", { nullable: true })
    .validate();

  const isCurrent = Boolean(validated.is_current ?? false);

  const certificateFile = file(ctx, "certificate");
  let certificate: string | null = null;

  if (certificateFile) {
    assertUploadSize(certificateFile, "certificate");
    certificate = await uploadToCloudinary(certificateFile, "experiences/certificates");
  }

  const experience = await prisma.experience.create({
    data: {
      company: String(validated.company),
      position: String(validated.position),
      description: String(validated.description),
      startDate: validated.start_date as Date,
      endDate: isCurrent ? null : ((validated.end_date as Date | null) ?? null),
      isCurrent,
      certificate,
    },
  });

  return json({ message: "Experience created successfully", data: serializeExperience(experience) }, 201);
}

async function update(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const experience = Number.isInteger(id) ? await prisma.experience.findUnique({ where: { id } }) : null;

  if (!experience) {
    throw ApiError.notFound();
  }

  const validated = await new Validator(ctx.body)
    .required("company")
    .string("company", { max: 255 })
    .required("position")
    .string("position", { max: 255 })
    .required("description")
    .string("description")
    .required("start_date")
    .date("start_date")
    .date("end_date", { nullable: true })
    .boolean("is_current", { nullable: true })
    .validate();

  const isCurrent = Boolean(validated.is_current ?? false);

  const data: Prisma.ExperienceUpdateInput = {
    company: String(validated.company),
    position: String(validated.position),
    description: String(validated.description),
    startDate: validated.start_date as Date,
    endDate: isCurrent ? null : ((validated.end_date as Date | null) ?? null),
    isCurrent,
  };

  const certificateFile = file(ctx, "certificate");
  if (certificateFile) {
    assertUploadSize(certificateFile, "certificate");
    if (experience.certificate) {
      await deleteFromCloudinary(experience.certificate);
    }
    data.certificate = await uploadToCloudinary(certificateFile, "experiences/certificates");
  }

  const updated = await prisma.experience.update({ where: { id: experience.id }, data });

  return json({ message: "Experience updated successfully", data: serializeExperience(updated) });
}

async function destroy(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const experience = Number.isInteger(id) ? await prisma.experience.findUnique({ where: { id } }) : null;

  if (!experience) {
    throw ApiError.notFound();
  }

  if (experience.certificate) {
    await deleteFromCloudinary(experience.certificate);
  }

  await prisma.experience.delete({ where: { id: experience.id } });

  return json({ message: "Experience deleted successfully" });
}

export const experienceRoutes: RouteDefinition[] = [
  { method: "GET", pattern: "experiences", handler: index },
  { method: "GET", pattern: "admin/experiences", handler: index, auth: true },
  { method: "GET", pattern: "admin/experiences/:id", handler: show, auth: true },
  { method: "POST", pattern: "admin/experiences", handler: store, auth: true },
  { method: "PUT", pattern: "admin/experiences/:id", handler: update, auth: true },
  { method: "PATCH", pattern: "admin/experiences/:id", handler: update, auth: true },
  { method: "DELETE", pattern: "admin/experiences/:id", handler: destroy, auth: true },
];
