"use client";

const MAX_UPLOAD_BYTES = 3_200_000; // Keep comfortably under Vercel 4.5 MB limit

/**
 * Compresses large camera/gallery images (e.g. 5-12 MB iPhone/Android photos)
 * into a crisp <= 1600px JPEG before uploading so mobile uploads never hit
 * serverless payload limits. Leaves valid small images and PDFs intact.
 */
export async function prepareKycFileForUpload(file: File): Promise<File> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("O arquivo PDF deve ter no máximo 3 MB.");
    }
    return file;
  }

  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);

  if (!isImage) {
    throw new Error("Formato inválido. Envie uma imagem (JPG, PNG, WebP) ou PDF.");
  }

  const safeStandardImage =
    (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp") &&
    file.size <= 1_200_000;

  if (safeStandardImage) {
    return file;
  }

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Formato de imagem não suportado pelo navegador. Converta para JPG ou PNG."));
      image.src = dataUrl;
    });

    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const targetW = Math.max(1, Math.round(img.width * scale));
    const targetH = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Falha ao otimizar imagem."))),
        "image/jpeg",
        0.84,
      );
    });

    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error("Imagem ainda muito grande após compressão. Escolha uma foto menor.");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "kyc-document";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch (err) {
    if (file.size <= MAX_UPLOAD_BYTES && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp")) {
      return file;
    }
    throw err instanceof Error
      ? err
      : new Error("Não foi possível preparar a imagem. Tente enviar JPG, PNG ou PDF.");
  }
}
