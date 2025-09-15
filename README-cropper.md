Image Uploader + Cropper (Inverse Mapping)

This module implements a single-transform cropper that guarantees exported pixels match the on-screen preview for any pan/zoom/rotation, with or without padding.

Key pieces:
- src/utils/transform.ts: Single matrix M = T • R • S, inverse, min cover scale, clamping.
- src/utils/canvas.ts: Inverse mapping export; maps crop corners through M⁻¹ to compute exact source rect.
- src/hooks/useCropper.ts: Transform state + handlers.
- src/components/media/ImageUploaderCropper.tsx: Reusable component.
- src/lib/uploadFirebase.ts: Resumable upload to Firebase Storage.

Algorithm (export):
1. Crop viewport corners P = {(0,0),(Cw,0),(Cw,Ch),(0,Ch)}.
2. Compute inverse transform M⁻¹ and map P → Q in image space.
3. AABB over Q gives (sx, sy, sw, sh) in image pixels.
4. Choose output dimensions, create high-DPI canvas, optional padding.
5. drawImage(image, floor(sx), floor(sy), ceil(sw+ε), ceil(sh+ε), 0, 0, Ew, Eh).

Demo: visit /media-demo after starting dev server. Drag an image, crop, export and upload.


