import { items } from "@wix/data";
import { auth } from "@wix/essentials";

const COLLECTION_ID = "FAQ";

export interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

function mapFaqItem(item: Record<string, unknown>): FaqItem {
  return {
    _id: item._id as string,
    question: (item.question as string) ?? "",
    answer: (item.answer as string) ?? "",
    sortOrder: (item.sortOrder as number) ?? 0,
  };
}

export async function queryFaqItems(): Promise<FaqItem[]> {
  try {
    const elevatedQuery = auth.elevate(items.query);
    const { items: results } = await elevatedQuery(COLLECTION_ID)
      .ascending("sortOrder")
      .limit(200)
      .find();

    return results.map((item) => mapFaqItem(item as Record<string, unknown>));
  } catch (err) {
    console.error(`[cms:${COLLECTION_ID}] query failed:`, err);
    return [];
  }
}
