import { ImageResponse } from "next/og";
import { appIconMark } from "@/lib/app-icon-image";

const size = { width: 512, height: 512 };

export async function GET() {
  return new ImageResponse(appIconMark(512), size);
}
