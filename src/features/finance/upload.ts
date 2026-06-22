import { supabase } from "@/lib/supabase";

export const RECEIPTS_BUCKET = "receipts";
const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];
const MAX_DIMENSION = 1600;
const MAX_BYTES = 10 * 1024 * 1024;

export function validateReceipt(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return "Only JPG, PNG or PDF files are allowed.";
  if (file.size > MAX_BYTES) return "File must be smaller than 10MB.";
  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/** Downscale + re-encode large images before upload (performance requirement). */
async function compressImage(file: File): Promise<{ blob: Blob; ext: string }> {
  if (!file.type.startsWith("image/")) {
    return { blob: file, ext: file.name.split(".").pop() || "pdf" };
  }
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    if (scale === 1 && file.size < 1_000_000) {
      return { blob: file, ext: file.type === "image/png" ? "png" : "jpg" };
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.82),
    );
    return blob ? { blob, ext: "jpg" } : { blob: file, ext: "jpg" };
  } catch {
    return { blob: file, ext: file.type === "image/png" ? "png" : "jpg" };
  }
}

/** Uploads a receipt and returns the storage path (not a public URL). */
export async function uploadReceipt(file: File, userId: string): Promise<string> {
  const { blob, ext } = await compressImage(file);
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, blob, {
    contentType: blob.type || file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function removeReceipt(path: string): Promise<void> {
  await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
}

/** Creates a short-lived signed URL so private receipts can be viewed. */
export async function getReceiptUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
