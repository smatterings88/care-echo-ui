import { useState } from 'react';
import ImageUploaderCropper from '@/components/media/ImageUploaderCropper';
import { uploadBlobToFirebase } from '@/lib/uploadFirebase';

export default function MediaDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4">
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <ImageUploaderCropper
        value={file}
        onChange={(b) => setBlob(b)}
        aspect="1:1"
        outputWidth={512}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded border"
          disabled={!blob}
          onClick={async () => {
            if (!blob) return;
            const ext = 'jpg';
            const path = `demo/${Date.now()}.${ext}`;
            const { downloadURL } = await uploadBlobToFirebase({ blob, contentType: 'image/jpeg', path, onProgress: setProgress, metadata: { component: 'demo' } });
            setUrl(downloadURL);
          }}
        >Upload</button>
        <div>Progress: {Math.round(progress * 100)}%</div>
      </div>
      {url && (<div>URL: <a className="text-blue-600 underline" href={url} target="_blank" rel="noreferrer">open</a></div>)}
    </div>
  );
}


