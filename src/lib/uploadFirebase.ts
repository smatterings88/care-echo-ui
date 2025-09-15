import { storage, ensureSignedIn } from '@/firebase';
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';

export type UploadArgs = {
  blob: Blob;
  contentType: string;
  path: string; // full storage path where to upload
  metadata?: Record<string, string>;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
};

export async function uploadBlobToFirebase({ blob, contentType, path, onProgress, signal, metadata }: UploadArgs): Promise<{ downloadURL: string; fullPath: string }>{
  await ensureSignedIn();
  const ref = storageRef(storage, path);
  const task = uploadBytesResumable(ref, blob, { contentType, customMetadata: metadata });

  return new Promise((resolve, reject) => {
    const unsub = task.on('state_changed', (snap) => {
      if (onProgress && snap.totalBytes) onProgress(snap.bytesTransferred / snap.totalBytes);
    }, (err) => {
      unsub();
      reject(err);
    }, async () => {
      unsub();
      try {
        const downloadURL = await getDownloadURL(ref);
        resolve({ downloadURL, fullPath: ref.fullPath });
      } catch (e) {
        reject(e);
      }
    });

    if (signal) {
      const abort = () => { try { task.cancel(); } catch {} };
      if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
    }
  });
}


