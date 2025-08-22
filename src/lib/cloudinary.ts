// Placeholder Cloudinary helpers. Replace/extend when enabling signed uploads.
export type CloudTransform = {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'limit';
  quality?: number | 'auto';
  format?: 'jpg' | 'png' | 'webp' | 'auto';
};

// Build a delivery URL from a base Cloudinary URL and simple transforms
export function buildCloudinaryUrl(baseUrl: string, t: CloudTransform = {}) {
  try {
    // If baseUrl is already a full Cloudinary URL, we insert transformations
    // e.g. https://res.cloudinary.com/<cloud>/image/upload/<transforms>/v123/abc.jpg
    const u = new URL(baseUrl);
    if (!u.hostname.includes('res.cloudinary.com')) return baseUrl;

    const parts = u.pathname.split('/');
    const uploadIdx = parts.findIndex((p) => p === 'upload');
    if (uploadIdx === -1) return baseUrl;

    const transforms: string[] = [];
    if (t.width) transforms.push(`w_${t.width}`);
    if (t.height) transforms.push(`h_${t.height}`);
    if (t.crop) transforms.push(`c_${t.crop}`);
    if (t.quality) transforms.push(`q_${t.quality}`);
    if (t.format && t.format !== 'auto') transforms.push(`f_${t.format}`);
    if (t.format === 'auto') transforms.push('f_auto');

    // Inject transforms right after 'upload'
    const before = parts.slice(0, uploadIdx + 1);
    const after = parts.slice(uploadIdx + 1);
    u.pathname = [...before, transforms.join(','), ...after].filter(Boolean).join('/');
    return u.toString();
  } catch {
    return baseUrl;
  }
}

// Env configuration
// Prefer server-only var to avoid requiring NEXT_PUBLIC in client when not needed.
export const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Only used for unsigned uploads from client (optional)
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;
