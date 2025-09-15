import { useCallback, useMemo, useRef, useState } from 'react';
import { Transform, clamp, minCoverScale, clampPanToCover } from '@/utils/transform';

export type UseCropperArgs = {
  imageWidth: number;
  imageHeight: number;
  cropWidth: number;
  cropHeight: number;
  allowPadding: boolean;
  maxZoom?: number;
  initialRotation?: number;
  minZoomPaddingPx?: number;
};

export function useCropper({ imageWidth, imageHeight, cropWidth, cropHeight, allowPadding, maxZoom = 8, initialRotation = 0, minZoomPaddingPx = 0.5 }: UseCropperArgs) {
  const [t, setT] = useState<Transform>({ scale: 1, rotation: initialRotation, tx: 0, ty: 0 });

  // Fit once helpers
  const fit = useCallback(() => {
    const smin = minCoverScale({ width: imageWidth, height: imageHeight }, { width: cropWidth, height: cropHeight }, t.rotation);
    setT((prev) => ({ ...prev, scale: Math.max(prev.scale, smin) }));
  }, [imageWidth, imageHeight, cropWidth, cropHeight, t.rotation]);

  const setScale = useCallback((next: number) => {
    const smin = minCoverScale({ width: imageWidth, height: imageHeight }, { width: cropWidth, height: cropHeight }, t.rotation);
    setT((prev) => ({ ...prev, scale: clamp(next, smin, maxZoom) }));
  }, [imageWidth, imageHeight, cropWidth, cropHeight, t.rotation, maxZoom]);

  const wheelZoom = useCallback((delta: number) => {
    setScale(t.scale * (delta < 0 ? 1.05 : 0.95));
  }, [t.scale, setScale]);

  const panBy = useCallback((dx: number, dy: number) => {
    setT((prev) => ({ ...prev, tx: prev.tx + dx, ty: prev.ty + dy }));
  }, []);

  const rotateBy = useCallback((dTheta: number) => {
    setT((prev) => ({ ...prev, rotation: prev.rotation + dTheta }));
  }, []);

  const clampPan = useCallback(() => {
    setT((prev) => clampPanToCover(prev, { width: imageWidth, height: imageHeight }, { width: cropWidth, height: cropHeight }, allowPadding, minZoomPaddingPx));
  }, [imageWidth, imageHeight, cropWidth, cropHeight, allowPadding, minZoomPaddingPx]);

  return {
    transform: t,
    setTransform: setT,
    setScale,
    wheelZoom,
    panBy,
    rotateBy,
    fit,
    clampPan,
  };
}


