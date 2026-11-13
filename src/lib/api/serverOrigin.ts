import { headers } from "next/headers";
import { BACKEND_API_URL } from "@/services/backendApi";

/**
 * Base URL API untuk request yang sedang berjalan (server-side).
 *
 * Dengan memakai origin dari request, aplikasi tetap benar di domain
 * sendiri, di URL preview, maupun di `.vercel.app` — tanpa perlu mengubah
 * env var setiap kali domain berubah.
 */
export async function currentApiBase(): Promise<string> {
  const headerList = await headers();

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return BACKEND_API_URL;

  const forwardedProto = headerList.get("x-forwarded-proto");
  const proto = forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${proto}://${host}/api`;
}
