import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";

let configured = false;

function configure() {
  if (configured) return;

  const url = process.env.CLOUDINARY_URL;
  if (!url) {
    throw new Error("CLOUDINARY_URL is not configured.");
  }

  // cloudinary://<api_key>:<api_secret>@<cloud_name>
  const parsed = new URL(url.replace(/^cloudinary:\/\//, "https://"));
  const apiKey = decodeURIComponent(parsed.username);
  const apiSecret = decodeURIComponent(parsed.password);
  const cloudName = parsed.hostname;

  if (!apiKey || !apiSecret || !cloudName) {
    throw new Error("CLOUDINARY_URL is malformed.");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  configured = true;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_URL);
}

/** Uploads a buffer through the streaming API. */
function uploadBuffer(
  buffer: Buffer,
  folder: string,
  resourceType: "auto" | "image" | "raw",
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result?.secure_url ?? null);
      },
    );

    Readable.from(buffer).pipe(stream);
  });
}

/** Uploads a file to Cloudinary and returns its secure URL. */
export async function uploadToCloudinary(file: File, folder = "uploads"): Promise<string | null> {
  configure();

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    return await uploadBuffer(buffer, folder, "auto");
  } catch (error) {
    // Non media files (e.g. .docx) are rejected as "image" — retry as raw.
    try {
      return await uploadBuffer(buffer, folder, "raw");
    } catch {
      throw error;
    }
  }
}

/**
 * Extracts the public id out of a Cloudinary delivery URL.
 * Ported from the Laravel CloudinaryService so both backends delete the same
 * assets.
 */
export function publicIdFromUrl(url: string): { publicId: string; resourceType: "image" | "raw" } | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const typeIndex = segments.findIndex((segment) => ["upload", "raw", "authenticated"].includes(segment));
  if (typeIndex === -1) return null;

  // The resource type sits right before the delivery type: /image/upload/... or /raw/upload/...
  const isRaw = segments[typeIndex - 1] === "raw";
  // segments[typeIndex + 1] is the version, the public id starts right after.
  const publicIdWithExt = segments.slice(typeIndex + 2).join("/");
  if (!publicIdWithExt) return null;

  if (isRaw) {
    return { publicId: publicIdWithExt, resourceType: "raw" };
  }

  const dotIndex = publicIdWithExt.lastIndexOf(".");
  const publicId = dotIndex === -1 ? publicIdWithExt : publicIdWithExt.slice(0, dotIndex);

  return { publicId, resourceType: "image" };
}

/** Deletes a Cloudinary asset. Returns true when the asset was removed. */
export async function deleteFromCloudinary(url: string | null | undefined): Promise<boolean> {
  if (!url || !url.includes("res.cloudinary.com")) return false;

  const parsed = publicIdFromUrl(url);
  if (!parsed) return false;

  configure();

  try {
    await cloudinary.uploader.destroy(parsed.publicId, { resource_type: parsed.resourceType });
    return true;
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
    return false;
  }
}
