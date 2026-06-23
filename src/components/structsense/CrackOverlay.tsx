import { useEffect, useRef, useState } from "react";
import { AnalysisResult, BoundingBox, severityColor } from "@/lib/structsense";

interface Props {
  imageUrl: string;
  result: AnalysisResult | null;
}

/**
 * Overlay red highlights for detected cracks. Uses bounding boxes from the API
 * when available, otherwise auto-detects high-contrast dark regions on the image.
 */
export function CrackOverlay({ imageUrl, result }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [rect, setRect] = useState<{ w: number; h: number } | null>(null);
  const [autoBoxes, setAutoBoxes] = useState<BoundingBox[]>([]);

  const apiBoxes: { box: BoundingBox; severity: string; label: string }[] = [];
  result?.distressTypes.forEach((d) => {
    d.boundingBoxes?.forEach((b) => apiBoxes.push({ box: b, severity: d.severity, label: d.name }));
  });

  useEffect(() => {
    if (apiBoxes.length > 0 || !result || !imgRef.current) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = 80;
      const h = Math.round((img.height / img.width) * w);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      let data: ImageData;
      try { data = ctx.getImageData(0, 0, w, h); } catch { return; }
      // Detect "dark + high local contrast" pixels (cracks)
      const grid = 6;
      const cw = Math.floor(w / grid);
      const ch = Math.floor(h / grid);
      const boxes: BoundingBox[] = [];
      for (let gy = 0; gy < grid; gy++) {
        for (let gx = 0; gx < grid; gx++) {
          let dark = 0;
          let total = 0;
          for (let y = gy * ch; y < (gy + 1) * ch; y++) {
            for (let x = gx * cw; x < (gx + 1) * cw; x++) {
              const i = (y * w + x) * 4;
              const lum = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
              if (lum < 70) dark++;
              total++;
            }
          }
          if (dark / total > 0.18 && dark / total < 0.6) {
            boxes.push([gx / grid, gy / grid, 1 / grid, 1 / grid]);
          }
        }
      }
      setAutoBoxes(boxes.slice(0, 4));
    };
    img.src = imageUrl;
  }, [imageUrl, result, apiBoxes.length]);

  useEffect(() => {
    const update = () => {
      if (imgRef.current) setRect({ w: imgRef.current.clientWidth, h: imgRef.current.clientHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [imageUrl]);

  const boxes = apiBoxes.length > 0
    ? apiBoxes
    : autoBoxes.map((b) => ({ box: b, severity: "Medium", label: "Detected region" }));

  return (
    <div className="relative h-full w-full">
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Uploaded structure"
        className="h-full w-full object-contain"
        onLoad={(e) => setRect({ w: e.currentTarget.clientWidth, h: e.currentTarget.clientHeight })}
      />
      {result && rect && boxes.map((b, i) => {
        const c = severityColor(b.severity as "Low" | "Medium" | "High");
        const [x, y, w, h] = b.box;
        const imgW = imgRef.current?.naturalWidth ?? 1;
        const imgH = imgRef.current?.naturalHeight ?? 1;
        const rendered = computeContain(imgW, imgH, rect.w, rect.h);
        return (
          <div
            key={i}
            className="pointer-events-none absolute animate-pulse"
            style={{
              left: rendered.x + x * rendered.w,
              top: rendered.y + y * rendered.h,
              width: w * rendered.w,
              height: h * rendered.h,
              background: `${c}33`,
              border: `2px solid ${c}`,
              borderRadius: 4,
              boxShadow: `0 0 12px ${c}88`,
            }}
          >
            <div
              className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold"
              style={{ background: c, color: "#0D1117" }}
            >
              {b.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function computeContain(iw: number, ih: number, cw: number, ch: number) {
  const s = Math.min(cw / iw, ch / ih);
  const w = iw * s;
  const h = ih * s;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}
