import { ImageResponse } from "next/og";
import { appIconMark } from "@/lib/app-icon-image";

export const alt = "AgendaNet — Citas online para tu negocio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          backgroundImage:
            "linear-gradient(135deg, #f0fdfa 0%, #f8fafc 55%, #f0fdfa 100%)",
        }}
      >
        <div style={{ display: "flex", marginBottom: 40 }}>{appIconMark(140)}</div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: -1,
          }}
        >
          AgendaNet
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 32,
            color: "#475569",
          }}
        >
          Citas online para tu negocio
        </div>
      </div>
    ),
    size
  );
}
