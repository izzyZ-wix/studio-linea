import { media } from "@wix/sdk";

export type WixImage = {
  url: string;
  altText?: string;
  width?: number;
  height?: number;
};

export type ImageTransformOptions = {
  quality?: number;
};

export type ResponsiveImage = {
  src: string;
  srcset: string;
  sizes: string;
  width: number;
  height: number;
};

const DEFAULT_QUALITY = 90;

type ImageInput = string | { id?: string; url?: string; image?: string | { id?: string; url?: string } } | undefined;

function mediaIdFromInput(image: ImageInput, resolvedUrl: string): string | null {
  if (typeof image === "string" && image.startsWith("wix:image://")) {
    const match = image.match(/wix:image:\/\/v1\/([^/#]+)/);
    if (match?.[1]) return match[1];
  }
  if (typeof image === "object" && image?.id) return image.id;
  const fromUrl = resolvedUrl.match(/\/media\/([^/]+)/);
  return fromUrl?.[1] ?? null;
}

function fillUrl(
  mediaId: string,
  width: number,
  height: number,
  quality = DEFAULT_QUALITY,
): string {
  return `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${width},h_${height},al_c,q_${quality},usm_0.66_1.00_0.01,enc_auto/${mediaId}`;
}

function normalizeImageInput(image: ImageInput): string | { id?: string; url?: string } | undefined {
  if (!image) return undefined;
  if (typeof image === "string") return image;
  if (image.image) {
    return typeof image.image === "string" ? image.image : image.image;
  }
  return image;
}

export function resolveWixImage(
  image: ImageInput,
): WixImage | null {
  const normalized = normalizeImageInput(image);
  if (!normalized) return null;

  if (typeof normalized === "string") {
    if (normalized.startsWith("wix:image://")) {
      const resolved = media.getImageUrl(normalized);
      return { url: resolved.url, width: resolved.width, height: resolved.height };
    }
    return { url: normalized };
  }

  if (normalized.url) {
    return { url: normalized.url };
  }

  if (normalized.id) {
    const resolved = media.getImageUrl(normalized.id);
    return { url: resolved.url, width: resolved.width, height: resolved.height };
  }

  return null;
}

function transformOptions(quality = DEFAULT_QUALITY): ImageTransformOptions {
  return { quality };
}

export function scaledSrc(img: WixImage, width: number, height?: number): string {
  if (height != null) {
    return resolveWixImageUrl(img.url, width, height) ?? img.url;
  }
  const url = new URL(img.url);
  url.searchParams.set("w", String(width));
  return url.toString();
}

export function srcSet(
  image: ImageInput,
  widths: number[],
  baseWidth: number,
  baseHeight: number,
  options?: ImageTransformOptions,
): string {
  if (!image) return "";
  const aspect = baseWidth / baseHeight;
  return widths
    .map((w) => {
      const h = Math.round(w / aspect);
      const url = resolveWixImageUrl(image, w, h, options);
      return url ? `${url} ${w}w` : null;
    })
    .filter(Boolean)
    .join(", ");
}

// Consumed by every vertical that renders a Wix image at a specific size
// (stores ProductCard + detail page, blog post hero, cms list thumbnails).
// Kept alongside resolveWixImage so verticals do not ship their own copy.
export function resolveWixImageUrl(
  image: ImageInput,
  width?: number,
  height?: number,
  options?: ImageTransformOptions,
): string | null {
  const normalized = normalizeImageInput(image);
  if (!normalized) return null;

  const quality = options?.quality ?? DEFAULT_QUALITY;

  if (
    typeof normalized === "string" &&
    normalized.startsWith("wix:image://") &&
    width != null &&
    height != null
  ) {
    return media.getScaledToFillImageUrl(normalized, width, height, transformOptions(quality));
  }

  const resolved = resolveWixImage(normalized);
  if (!resolved) return null;
  if (width == null && height == null) return resolved.url;

  const mediaId = mediaIdFromInput(normalized, resolved.url);
  if (mediaId && width != null && height != null) {
    return fillUrl(mediaId, width, height, quality);
  }

  const url = new URL(resolved.url);
  if (width != null) url.searchParams.set("w", String(width));
  if (height != null) url.searchParams.set("h", String(height));
  return url.toString();
}

/** Build src + srcset + sizes for a fixed-aspect responsive image. */
export function resolveResponsiveImage(
  image: ImageInput,
  width: number,
  height: number,
  options?: ImageTransformOptions & { widths?: number[]; sizes?: string },
): ResponsiveImage | null {
  if (!image) return null;

  const widths = options?.widths ?? [width, Math.round(width * 1.5), width * 2];
  const src = resolveWixImageUrl(image, width, height, options);
  if (!src) return null;

  const srcset = srcSet(image, widths, width, height, options);

  return {
    src,
    srcset,
    sizes: options?.sizes ?? `(max-width: 768px) 100vw, ${width}px`,
    width,
    height,
  };
}
