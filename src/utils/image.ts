/**
 * Utility to process, resize, and compress user-uploaded photos
 * Ensures photos taken by smartphones (often 10MB-25MB) are optimized to ~300KB-700KB
 * with high resolution (max 1600px) so Gemini can read text with maximum clarity and speed.
 */

export async function processImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<{ base64: string; mimeType: string; name: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف المرفق ليس صورة صالحة. يرجى اختيار ملف JPG أو PNG أو WebP.'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('تعذر قراءة ملف الصورة. يرجى المحاولة مرة أخرى.'));
    };

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => {
        // Fallback to original data if Image fails to load directly
        const rawBase64 = reader.result as string;
        resolve({
          base64: rawBase64,
          mimeType: file.type || 'image/jpeg',
          name: file.name,
        });
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if larger than maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas context unavailable');
          }

          // Fill white background for transparent PNGs
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG (supported by Gemini without any issues)
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

          resolve({
            base64: compressedBase64,
            mimeType: 'image/jpeg',
            name: file.name,
          });
        } catch {
          // If canvas processing fails, fallback to original dataUrl
          const rawBase64 = reader.result as string;
          resolve({
            base64: rawBase64,
            mimeType: file.type || 'image/jpeg',
            name: file.name,
          });
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
