import { prisma } from "../prisma";
import { json } from "../http";
import { ApiError } from "../errors";
import { Validator } from "../validate";
import { serializeInquiry, serializeReply } from "../serialize";
import { clientIp, rateLimit } from "../rate-limit";
import { renderInquiryReplyEmail, renderNewInquiryEmail, sendMail } from "../mail";
import type { RouteDefinition } from "../router";
import type { Ctx } from "../types";

async function store(ctx: Ctx): Promise<Response> {
  await rateLimit(`contact:${clientIp(ctx.req.headers)}`, 10, 60);

  const validated = await new Validator(ctx.body)
    .required("name")
    .string("name", { max: 255 })
    .required("email")
    .email("email", { max: 255 })
    .string("subject", { max: 255, nullable: true })
    .string("category", { max: 255, nullable: true })
    .required("message")
    .string("message")
    .validate();

  const subject = (validated.subject as string | undefined) || "Website Inquiry";
  const category = (validated.category as string | undefined) || "General";

  const inquiry = await prisma.inquiry.create({
    data: {
      name: String(validated.name),
      email: String(validated.email),
      subject,
      category,
      message: String(validated.message),
    },
  });

  // Notify the site owner (best effort — a mail failure must not break the form).
  const settings = await prisma.setting.findFirst({ orderBy: { id: "asc" } });
  if (settings?.email) {
    try {
      await sendMail({
        to: settings.email,
        subject: `New inquiry: ${subject}`,
        html: renderNewInquiryEmail({
          name: inquiry.name,
          email: inquiry.email,
          subject: inquiry.subject,
          message: inquiry.message,
          siteName: settings.name ?? settings.siteName,
        }),
      });
    } catch (error) {
      console.error("Failed to send new inquiry notification:", error);
    }
  }

  return json(
    {
      message: "Your message has been sent successfully. We will get back to you soon!",
      data: serializeInquiry(inquiry),
    },
    201,
  );
}

async function index(): Promise<Response> {
  const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });
  return json({ data: inquiries.map((inquiry) => serializeInquiry(inquiry)) });
}

async function show(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const inquiry = Number.isInteger(id) ? await prisma.inquiry.findUnique({ where: { id } }) : null;

  if (!inquiry) {
    throw ApiError.notFound();
  }

  if (!inquiry.isRead) {
    await prisma.inquiry.update({ where: { id: inquiry.id }, data: { isRead: true } });
  }

  return json({ data: serializeInquiry({ ...inquiry, isRead: true }) });
}

async function update(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const inquiry = Number.isInteger(id) ? await prisma.inquiry.findUnique({ where: { id } }) : null;

  if (!inquiry) {
    throw ApiError.notFound();
  }

  const validated = await new Validator(ctx.body)
    .boolean("is_read", { nullable: true })
    .boolean("is_replied", { nullable: true })
    .validate();

  const updated = await prisma.inquiry.update({
    where: { id: inquiry.id },
    data: {
      ...(validated.is_read !== undefined ? { isRead: Boolean(validated.is_read) } : {}),
      ...(validated.is_replied !== undefined ? { isReplied: Boolean(validated.is_replied) } : {}),
    },
  });

  return json({ message: "Inquiry updated successfully", data: serializeInquiry(updated) });
}

async function destroy(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const inquiry = Number.isInteger(id) ? await prisma.inquiry.findUnique({ where: { id } }) : null;

  if (!inquiry) {
    throw ApiError.notFound();
  }

  await prisma.inquiry.delete({ where: { id: inquiry.id } });

  return json({ message: "Inquiry deleted successfully" });
}

async function replies(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const inquiry = Number.isInteger(id) ? await prisma.inquiry.findUnique({ where: { id } }) : null;

  if (!inquiry) {
    throw ApiError.notFound();
  }

  const list = await prisma.reply.findMany({
    where: { inquiryId: inquiry.id },
    orderBy: { createdAt: "desc" },
  });

  return json({ data: list.map((reply) => serializeReply(reply)) });
}

async function sendReply(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const inquiry = Number.isInteger(id) ? await prisma.inquiry.findUnique({ where: { id } }) : null;

  if (!inquiry) {
    throw ApiError.notFound();
  }

  const validated = await new Validator(ctx.body).required("message").string("message").validate();

  const reply = await prisma.reply.create({
    data: {
      inquiryId: inquiry.id,
      message: String(validated.message),
      sentAt: new Date(),
    },
  });

  await prisma.inquiry.update({ where: { id: inquiry.id }, data: { isReplied: true } });

  try {
    const settings = await prisma.setting.findFirst({ orderBy: { id: "asc" } });

    await sendMail({
      to: inquiry.email,
      subject: `Reply to your inquiry: ${inquiry.subject}`,
      html: renderInquiryReplyEmail({
        name: inquiry.name,
        subject: inquiry.subject,
        originalMessage: inquiry.message,
        replyMessage: String(validated.message),
        siteName: settings?.name ?? settings?.siteName ?? "Portofolio",
      }),
    });
  } catch (error) {
    // A mail failure must not lose the reply.
    console.error("Failed to send reply email:", error);
  }

  return json({ message: "Reply sent successfully", data: serializeReply(reply) }, 201);
}

export const inquiryRoutes: RouteDefinition[] = [
  { method: "POST", pattern: "contact", handler: store },
  { method: "GET", pattern: "admin/inquiries", handler: index, auth: true },
  { method: "GET", pattern: "admin/inquiries/:id", handler: show, auth: true },
  { method: "PUT", pattern: "admin/inquiries/:id", handler: update, auth: true },
  { method: "PATCH", pattern: "admin/inquiries/:id", handler: update, auth: true },
  { method: "DELETE", pattern: "admin/inquiries/:id", handler: destroy, auth: true },
  { method: "GET", pattern: "admin/inquiries/:id/replies", handler: replies, auth: true },
  { method: "POST", pattern: "admin/inquiries/:id/replies", handler: sendReply, auth: true },
];
