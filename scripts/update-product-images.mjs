#!/usr/bin/env node
/**
 * Imports high-resolution editorial images into Wix Media Manager
 * and updates Studio Linea product galleries.
 *
 * Usage: node scripts/update-product-images.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const { siteId } = JSON.parse(readFileSync(join(root, "wix.config.json"), "utf8"));

const TOKEN = execSync(`npx @wix/cli@latest token --site "${siteId}"`, {
  cwd: root,
  encoding: "utf8",
}).trim();

async function wixFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`https://www.wixapis.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "wix-site-id": siteId,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return json;
}

/** Curated Unsplash images — quiet luxury editorial, 2400px wide. */
const PRODUCT_IMAGES = {
  "walnut-writing-desk": {
    displayName: "Walnut Writing Desk",
    images: [
      {
        url: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=2400&q=90&auto=format",
        altText: "Walnut writing desk in a calm, considered workspace",
      },
      {
        url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=2400&q=90&auto=format",
        altText: "Editorial home office with walnut desk and natural light",
      },
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=90&auto=format",
        altText: "Warm minimalist interior with solid wood desk",
      },
    ],
  },
  "cable-organizer-laptop-stand-set": {
    displayName: "Cable Organizer & Laptop Stand Set",
    images: [
      {
        url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=2400&q=90&auto=format",
        altText: "Organized desk with monitor stand and cable management",
      },
      {
        url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=2400&q=90&auto=format",
        altText: "Minimal workspace with laptop stand and clean cable routing",
      },
      {
        url: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=2400&q=90&auto=format",
        altText: "Composed desk accessories on a warm wood surface",
      },
    ],
  },
  "limestone-acoustic-panel-trio": {
    displayName: "Limestone Acoustic Panel Trio",
    images: [
      {
        url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=2400&q=90&auto=format",
        altText: "Limestone-toned interior with acoustic wall panels",
      },
      {
        url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=2400&q=90&auto=format",
        altText: "Neutral editorial room with textured acoustic panels",
      },
      {
        url: "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=2400&q=90&auto=format",
        altText: "Calm workspace with limestone acoustic treatment",
      },
    ],
  },
};

const ABOUT_IMAGE = {
  url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=2400&q=90&auto=format",
  displayName: "studio-linea-about.jpg",
};

async function importImage({ url, displayName }) {
  const { file } = await wixFetch("/site-media/v1/files/import", {
    method: "POST",
    body: {
      url,
      mediaType: "IMAGE",
      displayName,
    },
  });
  if (!file?.url) {
    throw new Error(`Import failed for ${displayName}`);
  }
  return file.url;
}

async function updateProductMedia(product, mediaItems) {
  const id = product.id ?? product._id;
  await wixFetch(`/stores/v3/products/${id}`, {
    method: "PATCH",
    body: {
      product: {
        id,
        revision: product.revision,
        media: {
          main: {
            url: mediaItems[0].url,
            altText: mediaItems[0].altText,
          },
          itemsInfo: {
            items: mediaItems.map((item) => ({
              url: item.url,
              altText: item.altText,
            })),
          },
        },
      },
    },
  });
}

async function updateAboutImage(wixUrl) {
  const { dataItems = [] } = await wixFetch("/wix-data/v2/items/query", {
    method: "POST",
    body: {
      dataCollectionId: "About",
      query: { paging: { limit: 1 } },
    },
  });
  const item = dataItems[0];
  if (!item) {
    console.log("· skipped About collection (no items)");
    return;
  }
  await wixFetch(`/wix-data/v2/items/${item.id}`, {
    method: "PATCH",
    body: {
      dataCollectionId: "About",
      patch: {
        fieldModifications: [
          {
            fieldPath: "image",
            action: "SET_FIELD",
            setFieldOptions: { value: wixUrl },
          },
        ],
      },
    },
  });
  console.log("✓ About collection image updated");
}

async function main() {
  console.log(`Updating product images for site ${siteId}…\n`);

  const { products = [] } = await wixFetch("/stores/v3/products/query", {
    method: "POST",
    body: { query: { filter: {}, paging: { limit: 20 } } },
  });

  for (const product of products) {
    if (product.ribbon?.name === "Gift Card") continue;
    const config = PRODUCT_IMAGES[product.slug];
    if (!config) {
      console.log(`· skipped ${product.slug} (no image map)`);
      continue;
    }

    console.log(`→ ${config.displayName}`);
    const mediaItems = [];
    for (let i = 0; i < config.images.length; i++) {
      const img = config.images[i];
      const displayName = `${product.slug}-${i + 1}.jpg`;
      const url = await importImage({ url: img.url, displayName });
      mediaItems.push({ url, altText: img.altText });
      console.log(`  ✓ imported ${displayName}`);
    }

    await updateProductMedia(product, mediaItems);
    console.log(`  ✓ product media updated: ${product.slug}\n`);
  }

  console.log("→ About section image");
  const aboutUrl = await importImage(ABOUT_IMAGE);
  await updateAboutImage(aboutUrl);

  console.log("\nDone. Run `wix release` to publish the sharper images live.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
