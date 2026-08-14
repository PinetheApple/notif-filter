#!/usr/bin/env bash
# Regenerates every launcher/splash/web asset from one vector source, so the mark can
# never drift between layers the way hand-exported PNGs do.
set -euo pipefail

EXIT_MISSING_TOOL=1

cd "$(dirname "$0")/.."

SVG_DIR="assets/icon"
PNG_DIR="assets/images"

ACCENT='#f59e0b'
SURFACE='#18181b'

# Adaptive icons are cropped to a circle, squircle or teardrop, so only the centre
# 66/108 of the canvas is guaranteed visible. MASKED_VIEWBOX keeps the mark inside it.
# Widened past the 512 design grid so the mark scales down to 94%, which pulls its
# corners inside the safe circle rather than merely inside a safe square.
MASKED_VIEWBOX='-16.3 -16.3 544.7 544.7'
# Unmasked targets (web favicon, splash) waste that margin, so they crop to the mark.
TIGHT_VIEWBOX='91 87 330 330'

STROKE_WIDTH=22

# A funnel fed by three stacked bars: notifications sorted, not merely blocked.
mark() {
  local fill="$1"
  cat <<EOF
  <g fill="none" stroke="$fill" stroke-width="$STROKE_WIDTH" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 211 112 H 301" />
    <path d="M 186 152 H 326" />
    <path d="M 161 192 H 351" />
    <path d="M 143 232 H 369 L 280 340 V 392 H 232 V 340 Z" />
  </g>
EOF
}

svg() {
  local viewbox="$1" background="$2" fill="$3"
  echo "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"$viewbox\">"
  if [ "$background" != "none" ]; then
    echo "  <rect x=\"-512\" y=\"-512\" width=\"2048\" height=\"2048\" fill=\"$background\" />"
  fi
  mark "$fill"
  echo '</svg>'
}

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert not found (Arch: pacman -S librsvg)" >&2
  exit "$EXIT_MISSING_TOOL"
fi

mkdir -p "$SVG_DIR"

svg "$MASKED_VIEWBOX" none "$ACCENT" >"$SVG_DIR/foreground.svg"
svg "$MASKED_VIEWBOX" "$SURFACE" none >"$SVG_DIR/background.svg"
# Android tints the monochrome layer itself and reads only its alpha, so the colour
# here is arbitrary.
svg "$MASKED_VIEWBOX" none '#ffffff' >"$SVG_DIR/monochrome.svg"
svg "$MASKED_VIEWBOX" "$SURFACE" "$ACCENT" >"$SVG_DIR/app-icon.svg"
svg "$TIGHT_VIEWBOX" none "$ACCENT" >"$SVG_DIR/splash.svg"
svg "$TIGHT_VIEWBOX" "$SURFACE" "$ACCENT" >"$SVG_DIR/favicon.svg"

render() {
  local src="$1" out="$2" size="$3"
  rsvg-convert --width "$size" --height "$size" "$SVG_DIR/$src" --output "$PNG_DIR/$out"
  echo "  $out  ${size}x${size}"
}

echo "rendering:"
render foreground.svg android-icon-foreground.png 512
render background.svg android-icon-background.png 512
render monochrome.svg android-icon-monochrome.png 432
render app-icon.svg icon.png 1024
render splash.svg splash-icon.png 512
render favicon.svg favicon.png 48

echo "done"
