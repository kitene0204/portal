/**
 * Image helper utilities for client-side resizing, compression, and handling
 */

/**
 * Compresses an image file down to a lightweight thumbnail (~10KB - 30KB)
 */
export const compressImageFile = (
  file: File,
  maxWidth = 200,
  maxHeight = 200,
  quality = 0.65
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        try {
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl || !dataUrl.startsWith('data:image/webp') || dataUrl.length < 50) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        } catch {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.onerror = () => {
        resolve(readerEvent.target?.result as string);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Utility to compress an existing base64 string if it exceeds max allowed size
 */
export const compressBase64String = (
  base64Str: string,
  maxWidth = 200,
  maxHeight = 200,
  quality = 0.65
): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      try {
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl || !dataUrl.startsWith('data:image/webp') || dataUrl.length < 50) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      } catch {
        resolve(canvas.toDataURL('image/jpeg', quality));
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
};

/**
 * Automatically cleans up existing large base64 thumbnails in an apps array
 */
export const purgeLargeThumbnails = async (apps: any[]): Promise<{ apps: any[]; purgedCount: number }> => {
  let purgedCount = 0;
  const processedApps = await Promise.all(
    apps.map(async (app) => {
      if (!app.thumbnail) return app;
      
      // If it's a web URL (http/https), it takes zero storage, so keep it!
      if (app.thumbnail.startsWith('http://') || app.thumbnail.startsWith('https://')) {
        return app;
      }

      // If it's a data: URL
      if (app.thumbnail.startsWith('data:')) {
        // If string length > 25,000 (roughly >18KB), recompress
        if (app.thumbnail.length > 25000) {
          purgedCount++;
          try {
            const recompressed = await compressBase64String(app.thumbnail, 200, 200, 0.60);
            return { ...app, thumbnail: recompressed };
          } catch {
            return { ...app, thumbnail: '' };
          }
        }
      }

      return app;
    })
  );

  return { apps: processedApps, purgedCount };
};
