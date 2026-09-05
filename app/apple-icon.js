import { ImageResponse } from "next/og";
import { appIconMark } from "@/lib/app-icon-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(appIconMark(180), size);
}
