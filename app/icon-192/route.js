import { ImageResponse } from "next/og";
import { appIconMark } from "@/lib/app-icon-image";

const size = { width: 192, height: 192 };

export async function GET() {
  return new ImageResponse(appIconMark(192), size);
}
