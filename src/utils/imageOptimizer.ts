/**
 * imageOptimizer.ts
 * -----------------
 * Client-side image pre-processing for multimodal AI analysis.
 * Downscales oversized screenshots (e.g., Retina displays, 4K grabs)
 * to an optimal forensic resolution (max 1600px dimension) and compresses
 * to efficient JPEG/PNG base64 format.
 *
 * This dramatically reduces network roundtrip and Gemini tokenization latency
 * without sacrificing readable text or visual indicator clarity.
 */

export interface OptimizedImageResult {
  base64: string;
  mimeType: string;
  originalSize: number;
  optimizedSize: number;
}

export async function optimizeImageForAnalysis(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.88
): Promise<OptimizedImageResult> {
  const originalSize = file.size;

  // If already under 400KB and a standard format, read directly to avoid unnecessary re-compression
  if (originalSize <= 400 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
    const b64 = await readFileAsDataUrl(file);
    return {
      base64: b64,
      mimeType: file.type,
      originalSize,
      optimizedSize: originalSize
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (!width || !height) {
        // Fallback to raw file reading
        readFileAsDataUrl(file).then((b64) => {
          resolve({
            base64: b64,
            mimeType: file.type || 'image/png',
            originalSize,
            optimizedSize: originalSize
          });
        }).catch(reject);
        return;
      }

      // Calculate scale ratio
      let scale = 1;
      if (width > maxDimension || height > maxDimension) {
        scale = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        readFileAsDataUrl(file).then((b64) => {
          resolve({
            base64: b64,
            mimeType: file.type || 'image/png',
            originalSize,
            optimizedSize: originalSize
          });
        }).catch(reject);
        return;
      }

      // Enable high quality image downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Export as image/jpeg if photo/screenshot without alpha, or image/png
      // JPEG with 0.88 quality preserves sharp text while reducing 8MB PNGs to ~250KB
      const outMime = file.type === 'image/png' ? 'image/jpeg' : (file.type || 'image/jpeg');
      const dataUrl = canvas.toDataURL(outMime, quality);
      
      // Calculate estimated byte size from base64 string
      const base64Data = dataUrl.split(',')[1] || '';
      const estimatedBytes = Math.round((base64Data.length * 3) / 4);

      resolve({
        base64: dataUrl,
        mimeType: outMime,
        originalSize,
        optimizedSize: estimatedBytes
      });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.warn('[imageOptimizer] Canvas downscale failed, falling back to raw reader:', err);
      readFileAsDataUrl(file).then((b64) => {
        resolve({
          base64: b64,
          mimeType: file.type || 'image/png',
          originalSize,
          optimizedSize: originalSize
        });
      }).catch(reject);
    };

    img.src = objectUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
