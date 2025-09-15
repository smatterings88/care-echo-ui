// Minimal EXIF orientation detector + normalization helper

export async function getExifOrientation(arrayBuffer: ArrayBuffer): Promise<number | null> {
  // Parse JPEG EXIF orientation (0x0112). PNG/WebP return null.
  const view = new DataView(arrayBuffer);
  if (view.getUint16(0, false) !== 0xffd8) return null; // not JPEG
  let offset = 2;
  const length = view.byteLength;
  while (offset < length) {
    const marker = view.getUint16(offset, false); offset += 2;
    if (marker === 0xffe1) { // APP1
      const size = view.getUint16(offset, false); offset += 2;
      const tiff = offset + 6;
      if (view.getUint32(offset, false) !== 0x45786966) return null; // 'Exif'
      const little = view.getUint16(tiff, false) === 0x4949;
      const firstIFD = view.getUint32(tiff + 4, little);
      const entries = view.getUint16(tiff + firstIFD, little);
      for (let i = 0; i < entries; i++) {
        const entryOffset = tiff + firstIFD + 2 + i * 12;
        const tag = view.getUint16(entryOffset, little);
        if (tag === 0x0112) {
          const val = view.getUint16(entryOffset + 8, little);
          return val;
        }
      }
      return null;
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      offset += view.getUint16(offset, false);
    }
  }
  return null;
}

export async function loadNormalizedBitmap(file: File | Blob): Promise<ImageBitmap> {
  const buf = await file.arrayBuffer();
  // createImageBitmap applies EXIF orientation automatically in modern browsers for blob types; to be safe, we pass imageOrientation if supported
  const opts = { imageOrientation: 'from-image' } as unknown as ImageBitmapOptions;
  return await createImageBitmap(file, opts);
}


