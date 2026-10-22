// Phone photos are often 3-8MB, but the server rejects anything over 3MB and
// only ever keeps a ~640px copy anyway. Shrinking here, before the upload,
// means a big camera photo goes up as a few hundred KB instead of being
// rejected after a slow upload. 2000px is more than 3x what the server keeps,
// so the stored photo (and the scan, which reads small printed text) is just
// as sharp. If the browser can't decode the file (e.g. some HEIC photos), or
// shrinking wouldn't help, the original is returned untouched and the server
// decides.

const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.85;

// Anything beyond this is not a card photo; refuse before reading it into
// memory.
export const MAX_PICKED_BYTES = 30 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}

export async function shrinkPhoto(file: File): Promise<File> {
  try {
    // An <img> applies the photo's EXIF rotation, so the pixels drawn below
    // are already upright and the re-encoded JPEG needs no orientation tag.
    const img = await loadImage(file);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (!longest) return file;

    const scale = Math.min(1, MAX_SIDE / longest);
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
