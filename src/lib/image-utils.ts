/**
 * Compresses an image file or data URL on the client side using HTML5 Canvas.
 * Returns a base64 string (JPEG) that is optimized for server upload.
 */
export async function compressImage(
  source: string | File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Get base64 string
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = (err) => {
      reject(new Error('Failed to load image for compression'));
    };

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(source);
    } else {
      img.src = source;
    }
  });
}

/**
 * Helper to check if a string is a base64 image data URL
 */
export function isImageDataUrl(url: string): boolean {
  return url.startsWith('data:image/');
}
