import { useEffect, useRef } from "react";
import emblem from "@/assets/sudoku-drop-emblem.png";

type Rgb = { r: number; g: number; b: number };

function readThemeColor(): Rgb | null {
  const probe = document.createElement("span");
  probe.className = "bg-primary";
  probe.hidden = true;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).backgroundColor;
  probe.remove();

  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length < 3) return null;
  return { r: channels[0], g: channels[1], b: channels[2] };
}

function isFallingPiece(x: number, y: number, size: number) {
  const px = x / size;
  const py = y / size;
  return (
    (px > 0.28 && px < 0.49 && py > 0.11 && py < 0.37) ||
    (px > 0.44 && px < 0.63 && py > 0.06 && py < 0.34) ||
    (px > 0.6 && px < 0.86 && py > 0.14 && py < 0.38) ||
    (px > 0.43 && px < 0.62 && py > 0.39 && py < 0.69)
  );
}

function recolorBluePixels(data: ImageData, theme: Rgb) {
  const size = data.width;
  const pixels = data.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % size;
    const y = Math.floor(pixel / size);
    if (isFallingPiece(x, y, size)) continue;

    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const blueStrength = (b - r) / 255;
    const cyanStrength = (g - r) / 255;
    const saturation = max === 0 ? 0 : (max - min) / max;

    if (saturation < 0.12 || blueStrength < 0.035 || cyanStrength < 0.015) continue;

    const luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
    const intensity = Math.min(1, Math.max(0.18, luminance * 1.35));
    const mix = Math.min(0.94, 0.48 + saturation * 0.48);
    const targetR = theme.r * intensity;
    const targetG = theme.g * intensity;
    const targetB = theme.b * intensity;

    pixels[index] = Math.round(r * (1 - mix) + targetR * mix);
    pixels[index + 1] = Math.round(g * (1 - mix) + targetG * mix);
    pixels[index + 2] = Math.round(b * (1 - mix) + targetB * mix);
  }
}

export function ThemedEmblem({ theme }: { theme: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();
    image.decoding = "async";
    image.src = emblem;
    image.onload = () => {
      const size = Math.min(image.naturalWidth, image.naturalHeight);
      canvas.width = size;
      canvas.height = size;
      context.clearRect(0, 0, size, size);
      context.drawImage(image, 0, 0, size, size);

      const themeColor = readThemeColor();
      if (!themeColor) return;
      const imageData = context.getImageData(0, 0, size, size);
      recolorBluePixels(imageData, themeColor);
      context.putImageData(imageData, 0, 0);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Emblema rotundă Sudoku Drop cu piese numerotate care cad"
      className="h-full w-full object-contain drop-shadow-xl"
    />
  );
}