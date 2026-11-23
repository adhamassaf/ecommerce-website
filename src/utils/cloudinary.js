const CLOUD_NAME = (process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || '').trim();
const UPLOAD_PRESET = (process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || '').trim();

export const isCloudinaryConfigured = () =>
  Boolean(CLOUD_NAME && UPLOAD_PRESET);

/**
 * Upload image file to Cloudinary (unsigned preset).
 * Returns secure HTTPS URL.
 */
export async function uploadImageToCloudinary(file, { folder = 'crwn' } = {}) {
  if (!file) throw new Error('No file selected');
  if (!isCloudinaryConfigured()) {
    throw new Error('cloudinary-not-configured');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', UPLOAD_PRESET);
  if (folder) body.append('folder', folder);

  const res = await fetch(url, { method: 'POST', body });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.error?.message || data?.message || `Upload failed (${res.status})`;
    throw new Error(msg);
  }

  if (!data.secure_url) {
    throw new Error('Upload succeeded but no URL returned');
  }

  return data.secure_url;
}
