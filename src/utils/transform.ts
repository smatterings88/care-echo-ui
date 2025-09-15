/*
  Transform utilities for single-matrix image transforms.
  Coordinate systems:
  - Image space: pixels of the source image before any transform
  - Viewport (crop) space: CSS pixels inside the crop box (origin at top-left)

  Canonical transform from image -> viewport:
    M = T(tx, ty) • R(theta) • S(scale)
  where tx, ty are in image pixels (pre-scale, pre-rotation)
*/

export type Transform = {
  scale: number; // zoom scalar
  rotation: number; // radians
  tx: number; // pan x in image pixels
  ty: number; // pan y in image pixels
};

export type Size = { width: number; height: number };

// Matrix is [a, b, c, d, e, f] representing:
// [ a c e ]
// [ b d f ]
// [ 0 0 1 ]
export type Mat2D = [number, number, number, number, number, number];

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function nearlyEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

export function multiply(A: Mat2D, B: Mat2D): Mat2D {
  const [a1, b1, c1, d1, e1, f1] = A;
  const [a2, b2, c2, d2, e2, f2] = B;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

export function apply(M: Mat2D, x: number, y: number): { x: number; y: number } {
  const [a, b, c, d, e, f] = M;
  return { x: a * x + c * y + e, y: b * x + d * y + f };
}

export function inverse(M: Mat2D): Mat2D {
  const [a, b, c, d, e, f] = M;
  const det = a * d - b * c;
  if (nearlyEqual(det, 0)) throw new Error('Non-invertible matrix');
  const invDet = 1 / det;
  const ia = d * invDet;
  const ib = -b * invDet;
  const ic = -c * invDet;
  const id = a * invDet;
  const ie = -(ia * e + ic * f);
  const if_ = -(ib * e + id * f);
  return [ia, ib, ic, id, ie, if_];
}

export function matScale(s: number): Mat2D {
  return [s, 0, 0, s, 0, 0];
}

export function matRotate(theta: number): Mat2D {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [c, s, -s, c, 0, 0];
}

export function matTranslate(tx: number, ty: number): Mat2D {
  return [1, 0, 0, 1, tx, ty];
}

export function buildMatrix(t: Transform): Mat2D {
  // M = T(tx, ty) • R(theta) • S(scale)
  return multiply(multiply(matTranslate(t.tx, t.ty), matRotate(t.rotation)), matScale(t.scale));
}

export function rotatedExtents({ width, height }: Size, theta: number): Size {
  const cw = Math.abs(Math.cos(theta));
  const sw = Math.abs(Math.sin(theta));
  return {
    width: width * cw + height * sw,
    height: width * sw + height * cw,
  };
}

export function minCoverScale(image: Size, crop: Size, theta: number): number {
  const r = rotatedExtents(image, theta);
  const sx = crop.width / r.width;
  const sy = crop.height / r.height;
  return Math.max(sx, sy);
}

export function clampPanToCover(
  t: Transform,
  image: Size,
  crop: Size,
  allowPadding: boolean,
  paddingPx = 0
): Transform {
  if (allowPadding) return t; // no clamping
  // Compute visible bounds of the image in viewport after transform.
  // We need to ensure image fully covers crop box, i.e., its AABB in viewport contains [0,Cw]x[0,Ch].
  const M = buildMatrix(t);
  const corners = [
    apply(M, 0, 0),
    apply(M, image.width, 0),
    apply(M, image.width, image.height),
    apply(M, 0, image.height),
  ];
  const minX = Math.min(...corners.map((p) => p.x));
  const maxX = Math.max(...corners.map((p) => p.x));
  const minY = Math.min(...corners.map((p) => p.y));
  const maxY = Math.max(...corners.map((p) => p.y));

  let dx = 0;
  let dy = 0;
  if (minX > 0) dx = -minX - paddingPx; // shift left
  if (maxX < crop.width) dx = crop.width - maxX + paddingPx; // shift right
  if (minY > 0) dy = -minY - paddingPx;
  if (maxY < crop.height) dy = crop.height - maxY + paddingPx;

  // Convert the desired viewport delta back to image-space translation using inverse of R•S (not affecting tx/ty scale)
  const cos = Math.cos(t.rotation);
  const sin = Math.sin(t.rotation);
  const invScale = 1 / t.scale;
  const itx = invScale * (cos * dx - sin * dy);
  const ity = invScale * (sin * dx + cos * dy);

  return { ...t, tx: t.tx + itx, ty: t.ty + ity };
}

export function fitToCrop(
  image: Size,
  crop: Size,
  theta: number
): { scale: number; tx: number; ty: number } {
  const scale = minCoverScale(image, crop, theta);
  // center image in crop after rotation at this scale
  const iw = image.width;
  const ih = image.height;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const cx = (iw * c - ih * s) / 2;
  const cy = (iw * s + ih * c) / 2;
  // position the image center at crop center: M * (iw/2, ih/2) = (crop.width/2, crop.height/2)
  // Solve for translation in image space: T * R * S * p
  const px = iw / 2;
  const py = ih / 2;
  const vx = (crop.width / 2) - scale * (c * px - s * py);
  const vy = (crop.height / 2) - scale * (s * px + c * py);
  const tx = vx; // since translation is in image space, not scaled yet
  const ty = vy;
  return { scale, tx, ty };
}


