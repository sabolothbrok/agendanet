import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function GET(request) {
  await clearSession();
  const redirectPath = safeRedirectPath(
    request.nextUrl.searchParams.get("redirect"),
    "/login"
  );
  return NextResponse.redirect(new URL(redirectPath, request.url));
}
