import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function GET(request) {
  await clearSession();
  const redirect = request.nextUrl.searchParams.get("redirect") || "/login";
  return NextResponse.redirect(new URL(redirect, request.url));
}
