/**
 * Image helper utilities for client-side resizing, compression, and handling
 */
import { getSupabase } from './supabase';

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
 * 그림을 적당한 크기(긴 변 최대 960px)의 고화질 WebP로 바꿔서 Blob으로 돌려줌
 */
const fileToHighQualityBlob = (file: File, maxSide = 960, quality = 0.9): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => {
        if (b && b.type === 'image/webp') return resolve(b);
        canvas.toBlob(j => (j ? resolve(j) : reject(new Error('blob'))), 'image/jpeg', quality);
      }, 'image/webp', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    img.src = url;
  });

export const THUMBNAIL_BUCKET = 'portal-thumbs';

/**
 * 썸네일 그림을 고화질로 Supabase 파일 보관함(portal-thumbs)에 올리고 그 주소(https)를 돌려줌.
 * 보관함을 쓸 수 없으면 예전처럼 data: 형태로(조금 더 좋은 화질로) 돌려줌.
 */
export const uploadThumbnailFile = async (file: File): Promise<string> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const blob = await fileToHighQualityBlob(file);
      const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(THUMBNAIL_BUCKET).upload(path, blob, {
        contentType: blob.type,
        cacheControl: '31536000',
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    } catch (err) {
      console.warn('Thumbnail upload to storage failed, falling back to inline image:', err);
    }
  }
  return compressImageFile(file, 480, 360, 0.85);
};

/**
 * 링크 주소의 사이트에서 아이콘 그림을 찾아 가장 큰 것의 주소를 돌려줌 (없으면 '')
 */
export const findSiteIcon = async (link: string): Promise<string> => {
  let origin = '';
  try {
    origin = new URL(/^https?:\/\//i.test(link) ? link : 'https://' + link).origin;
  } catch {
    return '';
  }
  const paths = [
    '/icon-512.png', '/android-chrome-512x512.png', '/apple-touch-icon.png', '/icon-192.png',
    '/android-chrome-192x192.png', '/icon.svg', '/favicon.svg', '/logo.png', '/icon.png',
    '/favicon.png', '/favicon.ico',
  ];
  const probe = (url: string) =>
    new Promise<{ url: string; size: number } | null>(resolve => {
      const img = new Image();
      const timer = setTimeout(() => { img.src = ''; resolve(null); }, 6000);
      img.onload = () => {
        clearTimeout(timer);
        const isSvg = url.endsWith('.svg');
        const size = isSvg ? 1024 : Math.min(img.naturalWidth, img.naturalHeight);
        resolve(size > 0 ? { url, size } : null);
      };
      img.onerror = () => { clearTimeout(timer); resolve(null); };
      img.src = url;
    });
  const found = (await Promise.all(paths.map(p => probe(origin + p)))).filter(
    (x): x is { url: string; size: number } => !!x && x.size >= 32
  );
  if (!found.length) return '';
  found.sort((a, b) => b.size - a.size);
  return found[0].url;
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
        // 아주 큰 그림(약 150KB 이상)만 화질을 크게 해치지 않게 줄임
        if (app.thumbnail.length > 200000) {
          purgedCount++;
          try {
            const recompressed = await compressBase64String(app.thumbnail, 640, 480, 0.85);
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
