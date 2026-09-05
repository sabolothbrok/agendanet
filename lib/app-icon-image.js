// Renders the AppIcon mark (components/AppIcon.js) as ImageResponse-compatible
// JSX for code-generated icon/manifest/OG routes, which can't use raw <svg>.
//
// The checkmark is drawn as two rotated bars (not a "✓" glyph) because Satori
// resolves text through Google's dynamic font API, which the sandboxed build
// environment can't reach — the glyph would silently render blank.
function checkBar(px1, py1, px2, py2, scale, strokeWidth) {
  const dx = px2 - px1;
  const dy = py2 - py1;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return {
    position: "absolute",
    left: px1 * scale,
    top: py1 * scale - (strokeWidth * scale) / 2,
    width: length * scale,
    height: strokeWidth * scale,
    background: "#0f766e",
    borderRadius: (strokeWidth * scale) / 2,
    transform: `rotate(${angle}deg)`,
    transformOrigin: "0 50%",
    display: "flex",
  };
}

export function appIconMark(px) {
  const scale = px / 56;
  const square = (x, y) => ({
    position: "absolute",
    left: x * scale,
    top: y * scale,
    width: 9 * scale,
    height: 9 * scale,
    borderRadius: 2.5 * scale,
    background: "rgba(94, 234, 212, 0.45)",
    display: "flex",
  });

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: px,
        height: px,
        background: "#0f766e",
        borderRadius: 14 * scale,
      }}
    >
      <div style={square(13, 13)} />
      <div style={square(23.5, 13)} />
      <div style={square(34, 13)} />
      <div style={square(13, 23.5)} />
      <div style={square(23.5, 23.5)} />
      <div
        style={{
          position: "absolute",
          left: 29 * scale,
          top: 29 * scale,
          width: 19 * scale,
          height: 19 * scale,
          borderRadius: "50%",
          background: "#ffffff",
          display: "flex",
        }}
      >
        <div style={checkBar(34.7 - 29, 38.5 - 29, 37.3 - 29, 41.1 - 29, scale, 3)} />
        <div style={checkBar(37.3 - 29, 41.1 - 29, 42.3 - 29, 35.9 - 29, scale, 3)} />
      </div>
    </div>
  );
}
