import { describe, it, expect } from 'vitest';
import { buildMatrix, inverse, apply, minCoverScale, rotatedExtents } from '@/utils/transform';

describe('transform math', () => {
  it('inverse(matrix) * matrix ~= identity', () => {
    const M = buildMatrix({ scale: 2.5, rotation: Math.PI / 6, tx: 123.4, ty: -56.7 });
    const Minv = inverse(M);
    const p = { x: 40, y: 25 };
    const v = apply(M, p.x, p.y);
    const back = apply(Minv, v.x, v.y);
    expect(back.x).toBeCloseTo(p.x, 6);
    expect(back.y).toBeCloseTo(p.y, 6);
  });

  it('min cover scale with rotation matches rotated extents', () => {
    const image = { width: 1000, height: 500 };
    const crop = { width: 400, height: 400 };
    const theta = Math.PI / 4; // 45°
    const smin = minCoverScale(image, crop, theta);
    const r = rotatedExtents(image, theta);
    expect(smin).toBeCloseTo(Math.max(crop.width / r.width, crop.height / r.height), 6);
  });

  it('mapping viewport corners via Minv yields stable AABB', () => {
    const t = { scale: 3, rotation: 0.2, tx: 20, ty: 30 };
    const M = buildMatrix(t);
    const Minv = inverse(M);
    const corners = [
      { x: 0, y: 0 },
      { x: 512, y: 0 },
      { x: 512, y: 512 },
      { x: 0, y: 512 },
    ];
    const mapped = corners.map((p) => apply(Minv, p.x, p.y));
    const minX = Math.min(...mapped.map((q) => q.x));
    const maxX = Math.max(...mapped.map((q) => q.x));
    const minY = Math.min(...mapped.map((q) => q.y));
    const maxY = Math.max(...mapped.map((q) => q.y));
    expect(maxX - minX).toBeGreaterThan(0);
    expect(maxY - minY).toBeGreaterThan(0);
  });
});


