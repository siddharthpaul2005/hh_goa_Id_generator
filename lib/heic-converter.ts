/**
 * Converts a HEIC/HEIF File to a standard JPEG Blob client-side.
 */
export async function convertHeicToJpeg(file: File): Promise<Blob> {
  const isHeic = 
    file.type.toLowerCase().includes("heic") || 
    file.type.toLowerCase().includes("heif") || 
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  if (!isHeic) {
    return file;
  }

  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });
    
    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  } catch (error) {
    console.error("HEIC conversion error:", error);
    // If conversion fails, return original file
    return file;
  }
}
