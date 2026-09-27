/** Call with a public ID for an approved, uploaded asset. No upload secrets reach clients. */
export function cloudinaryImage(publicId: string, width = 1200) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud || !/^[a-zA-Z0-9_-]+$/.test(cloud))
    throw new Error("Configure the Cloudinary cloud name.");
  if (!/^[a-zA-Z0-9_/-]+$/.test(publicId) || publicId.includes(".."))
    throw new Error("Invalid image public ID.");
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${Math.min(2400, Math.max(100, Math.round(width)))}/${publicId}`;
}
