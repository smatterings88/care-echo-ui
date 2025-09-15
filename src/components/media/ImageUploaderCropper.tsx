import { useEffect, useMemo, useRef, useState } from 'react';
import { Aspect, aspectToNumber } from './AspectPicker';
import { useCropper } from '@/hooks/useCropper';
import { loadNormalizedBitmap } from '@/utils/exif';
import { exportCroppedBitmap } from '@/utils/canvas';

export type CropperMeta = {
  width: number;
  height: number;
  type: string;
  quality: number;
  aspect: Aspect;
  transform: { scale: number; rotation: number; tx: number; ty: number };
};

type Props = {
  value: File | Blob | string | null;
  onChange?: (blob: Blob, meta: CropperMeta) => void;
  aspect?: Aspect;
  allowPadding?: boolean;
  background?: string;
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
  outputWidth?: number;
  outputHeight?: number;
  outputMax?: number;
  minZoomPaddingPx?: number;
  maxZoom?: number;
  initialRotation?: number;
  onUploadProgress?: (p: number) => void;
  onUploadComplete?: (url: string) => void;
};

export default function ImageUploaderCropper({ value, onChange, aspect = '1:1', allowPadding = false, background = 'transparent', outputType = 'image/jpeg', quality = 0.92, outputWidth, outputHeight, outputMax, minZoomPaddingPx = 0.5, maxZoom = 8, initialRotation = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgBitmap, setImgBitmap] = useState<ImageBitmap | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  // Load bitmap from value
  useEffect(() => {
    async function run() {
      if (!value) { setImgBitmap(null); setNatural(null); return; }
      try {
        let blob: Blob;
        if (typeof value === 'string') {
          const res = await fetch(value); blob = await res.blob();
        } else { blob = value; }
        const bmp = await loadNormalizedBitmap(blob);
        setImgBitmap(bmp);
        setNatural({ w: bmp.width, h: bmp.height });
      } catch (e) { console.error('Failed to load image', e); }
    }
    run();
  }, [value]);

  const cropSize = useMemo(() => {
    const cw = containerRef.current?.clientWidth ?? 320;
    const ch = containerRef.current?.clientHeight ?? 320;
    const a = natural ? aspectToNumber(aspect, { w: natural.w, h: natural.h }) : 1;
    const width = Math.min(cw, ch * a);
    const height = width / a;
    return { width, height };
  }, [aspect, natural]);

  const cropper = useCropper({
    imageWidth: natural?.w ?? 1,
    imageHeight: natural?.h ?? 1,
    cropWidth: cropSize.width,
    cropHeight: cropSize.height,
    allowPadding,
    maxZoom,
    initialRotation,
    minZoomPaddingPx,
  });

  // Fit when image or crop changes
  useEffect(() => {
    if (natural) cropper.fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural, cropSize.width, cropSize.height, cropper.transform.scale, cropper.transform.rotation]);

  const doExport = async () => {
    if (!imgBitmap) return;
    const { canvas } = await exportCroppedBitmap(imgBitmap, cropper.transform, {
      cropWidth: cropSize.width,
      cropHeight: cropSize.height,
      outputWidth,
      outputHeight,
      outputMax,
      allowPadding,
      background,
    });
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, outputType, quality));
    if (!blob) return;
    onChange?.(blob, {
      width: canvas.width,
      height: canvas.height,
      type: outputType,
      quality,
      aspect,
      transform: cropper.transform,
    });
  };

  return (
    <div className="w-full">
      <div ref={containerRef} className="relative w-full h-[360px] bg-neutral-100 overflow-hidden rounded-md">
        {/* Image preview canvas via CSS transform for speed; math mirrors M */}
        {imgBitmap && (
          <canvas
            ref={(node) => {
              if (!node || !imgBitmap) return;
              const dpr = window.devicePixelRatio || 1;
              node.width = Math.round(cropSize.width * dpr);
              node.height = Math.round(cropSize.height * dpr);
              node.style.width = `${cropSize.width}px`;
              node.style.height = `${cropSize.height}px`;
              const ctx = node.getContext('2d');
              if (!ctx) return;
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
              ctx.clearRect(0, 0, cropSize.width, cropSize.height);
              // Preview draw mirrors export math: draw the transformed image into the viewport
              ctx.save();
              ctx.translate(cropper.transform.tx, cropper.transform.ty);
              ctx.rotate(cropper.transform.rotation);
              ctx.scale(cropper.transform.scale, cropper.transform.scale);
              ctx.drawImage(imgBitmap, 0, 0, natural!.w, natural!.h);
              ctx.restore();
              // Overlay border is drawn by separate div below
            }}
            className="absolute left-0 top-0"
          />
        )}
        {/* Crop overlay */}
        <div className="absolute inset-0 pointer-events-none border-2 border-white/90" />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" className="px-3 py-2 rounded border" onClick={() => cropper.setScale(cropper.transform.scale * 0.9)}>-</button>
        <button type="button" className="px-3 py-2 rounded border" onClick={() => cropper.setScale(cropper.transform.scale * 1.1)}>+</button>
        <button type="button" className="px-3 py-2 rounded border" onClick={() => cropper.rotateBy(Math.PI / 2)}>Rotate 90°</button>
        <button type="button" className="px-3 py-2 rounded border" onClick={cropper.fit}>Fit</button>
        <button type="button" className="px-3 py-2 rounded border" onClick={doExport}>Export</button>
      </div>
    </div>
  );
}


