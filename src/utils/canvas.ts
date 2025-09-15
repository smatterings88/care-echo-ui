import { Mat2D, apply, inverse, buildMatrix, Transform } from './transform';

export type ExportOptions = {
  cropWidth: number; // viewport width in CSS px
  cropHeight: number; // viewport height in CSS px
  outputWidth?: number;
  outputHeight?: number;
  outputMax?: number;
  allowPadding: boolean;
  background: string | 'transparent';
  epsilon?: number; // small expansion to avoid seams
};

export async function exportCroppedBitmap(
  imageBitmap: ImageBitmap,
  transform: Transform,
  options: ExportOptions
): Promise<{ canvas: HTMLCanvasElement; sx: number; sy: number; sw: number; sh: number } > {
  const { cropWidth: Cw, cropHeight: Ch, allowPadding, background, epsilon = 0.01 } = options;

  // 1) Define crop corners in viewport space
  const P = [
    { x: 0, y: 0 },
    { x: Cw, y: 0 },
    { x: Cw, y: Ch },
    { x: 0, y: Ch },
  ];

  // 2) Compute inverse matrix and map to image space
  const M = buildMatrix(transform);
  const Minv = inverse(M as Mat2D);
  const Q = P.map((p) => apply(Minv, p.x, p.y));

  // 3) Axis-aligned bounding box in image space
  const minX = Math.min(...Q.map((q) => q.x));
  const minY = Math.min(...Q.map((q) => q.y));
  const maxX = Math.max(...Q.map((q) => q.x));
  const maxY = Math.max(...Q.map((q) => q.y));
  const sx = Math.floor(minX);
  const sy = Math.floor(minY);
  const sw = Math.ceil(maxX - minX + epsilon);
  const sh = Math.ceil(maxY - minY + epsilon);

  // 4) Determine output size
  const { outputWidth, outputHeight, outputMax } = options;
  let Ew = outputWidth ?? 0;
  let Eh = outputHeight ?? 0;
  if (!Ew && !Eh) {
    if (outputMax) {
      const aspect = Cw / Ch;
      if (Cw >= Ch) {
        Ew = outputMax; Eh = Math.round(outputMax / aspect);
      } else {
        Eh = outputMax; Ew = Math.round(outputMax * aspect);
      }
    } else {
      Ew = Cw; Eh = Ch;
    }
  } else if (!Ew) {
    Ew = Math.round(Eh * (Cw / Ch));
  } else if (!Eh) {
    Eh = Math.round(Ew * (Ch / Cw));
  }

  // 5) Create canvas
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(Ew * dpr);
  canvas.height = Math.round(Eh * dpr);
  const ctx = canvas.getContext('2d', { colorSpace: 'display-p3' as unknown as CanvasRenderingContext2DSettings }) || canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 6) Optional padding
  if (allowPadding) {
    if (background !== 'transparent') {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, Ew, Eh);
    } else {
      ctx.clearRect(0, 0, Ew, Eh);
    }
  }

  // 7) Draw
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    imageBitmap,
    sx, sy, Math.max(1, sw), Math.max(1, sh),
    0, 0, Ew, Eh
  );

  return { canvas, sx, sy, sw, sh };
}


