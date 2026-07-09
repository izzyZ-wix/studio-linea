import { items } from "@wix/data";
import { auth } from "@wix/essentials";
import { media } from "@wix/sdk";

const COLLECTION_ID = "About";

export interface AboutContent {
  _id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  manifesto: string;
  image?: string;
  imageUrl?: string;
}

function resolveImage(wixImageUrl: string | undefined): string | undefined {
  if (!wixImageUrl) return undefined;
  if (wixImageUrl.startsWith("http")) return wixImageUrl;
  return media.getScaledToFillImageUrl(wixImageUrl, 1200, 900, {});
}

function mapAboutItem(item: Record<string, unknown>): AboutContent {
  const image = item.image as string | undefined;
  return {
    _id: item._id as string,
    title: (item.title as string) ?? "",
    subtitle: (item.subtitle as string) ?? "",
    excerpt: (item.excerpt as string) ?? "",
    manifesto: (item.manifesto as string) ?? "",
    image,
    imageUrl: resolveImage(image),
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
