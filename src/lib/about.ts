import { items } from "@wix/data";
import { auth } from "@wix/essentials";
import { resolveResponsiveImage } from "../utils/wix-image";

const COLLECTION_ID = "About";

export interface AboutContent {
  _id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  manifesto: string;
  image?: string;
  imageUrl?: string;
  responsiveImage?: ReturnType<typeof resolveResponsiveImage>;
}

function toWixImageRef(value: string): string {
  if (value.startsWith("wix:image://")) return value;
  const id = value.match(/\/media\/([^/]+)/)?.[1] ?? value.match(/^([a-f0-9]+_[^/?#]+~mv2\.[^/?#]+)/i)?.[1];
  if (id) return `wix:image://v1/${id}/${id}`;
  return value;
}

function resolveImage(wixImageUrl: string | undefined) {
  if (!wixImageUrl) return undefined;
  return resolveResponsiveImage(toWixImageRef(wixImageUrl), 960, 720, {
    widths: [640, 960, 1440],
    sizes: "(max-width: 768px) 100vw, 480px",
  });
}

function mapAboutItem(item: Record<string, unknown>): AboutContent {
  const image = item.image as string | undefined;
  const responsiveImage = resolveImage(image);
  return {
    _id: item._id as string,
    title: (item.title as string) ?? "",
    subtitle: (item.subtitle as string) ?? "",
    excerpt: (item.excerpt as string) ?? "",
    manifesto: (item.manifesto as string) ?? "",
    image,
    imageUrl: responsiveImage?.src,
    responsiveImage,
  };
}

export async function queryAboutContent(): Promise<AboutContent | null> {
  try {
    const elevatedQuery = auth.elevate(items.query);
    const { items: results } = await elevatedQuery(COLLECTION_ID).limit(1).find();
    const item = results[0];
    if (!item) return null;
    return mapAboutItem(item as Record<string, unknown>);
  } catch (err) {
    console.error(`[cms:${COLLECTION_ID}] query failed:`, err);
    return null;
  }
}
