/**
 * Image Auto-Resizer Utility
 * Automatically resizes, crops, and optimizes images for logos and hero banners
 * directly in the browser using HTML5 Canvas.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  mode?: 'cover' | 'contain' | 'auto'; // cover: center-crop; contain: fit within; auto: scale proportionally
}

export interface ResizeResult {
  file: File;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  resizedWidth: number;
  resizedHeight: number;
  originalSizeKb: number;
  resizedSizeKb: number;
}

export function autoResizeImage(file: File, options: ResizeOptions = {}): Promise<ResizeResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.88,
    format = 'image/webp',
    mode = 'auto',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));

      img.onload = () => {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        let targetW = origW;
        let targetH = origH;

        if (mode === 'cover' || mode === 'contain') {
          targetW = maxWidth;
          targetH = maxHeight;
        } else {
          // 'auto' mode: maintain aspect ratio while keeping inside max bounds
          const ratio = Math.min(maxWidth / origW, maxHeight / origH, 1.0);
          targetW = Math.round(origW * ratio);
          targetH = Math.round(origH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get 2D canvas context'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (mode === 'cover') {
          // Center crop to fill target dimensions
          const scale = Math.max(targetW / origW, targetH / origH);
          const scaledW = origW * scale;
          const scaledH = origH * scale;
          const offsetX = (targetW - scaledW) / 2;
          const offsetY = (targetH - scaledH) / 2;
          ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
        } else if (mode === 'contain') {
          // Letterbox contain with transparent or neutral background
          const scale = Math.min(targetW / origW, targetH / origH);
          const scaledW = origW * scale;
          const scaledH = origH * scale;
          const offsetX = (targetW - scaledW) / 2;
          const offsetY = (targetH - scaledH) / 2;
          ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
        } else {
          // Standard proportional draw
          ctx.drawImage(img, 0, 0, targetW, targetH);
        }

        const dataUrl = canvas.toDataURL(format, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert canvas to blob'));
              return;
            }

            const extension = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
            const cleanBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newFileName = `${cleanBase}_resized.${extension}`;
            const resizedFile = new File([blob], newFileName, { type: format });

            resolve({
              file: resizedFile,
              dataUrl,
              originalWidth: origW,
              originalHeight: origH,
              resizedWidth: targetW,
              resizedHeight: targetH,
              originalSizeKb: Math.round(file.size / 1024),
              resizedSizeKb: Math.round(blob.size / 1024),
            });
          },
          format,
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
