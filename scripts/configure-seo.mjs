#!/usr/bin/env node
/**
 * Configures Wix platform SEO settings for Studio Linea:
 * - robots.txt (via Wix SEO API — do not use public/robots.txt)
 * - llms.txt for AI crawlers
 * - Product seoData tags in the Wix dashboard
 *
 * Usage: node scripts/configure-seo.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const { siteId } = JSON.parse(readFileSync(join(root, "wix.config.json"), "utf8"));
const astroConfig = readFileSync(join(root, "astro.config.mjs"), "utf8");
const siteUrlMatch = astroConfig.match(/site:\s*["']([^"']+)["']/);
const SITE_URL = (siteUrlMatch?.[1] ?? "").replace(/\/$/, "");

if (!SITE_URL) {
  console.error("Could not read site URL from astro.config.mjs");
  process.exit(1);
}

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

function productSeoTags({ title, description, canonical }) {
  const ogImage = `${SITE_URL}/og-image.png`;
  return {
    tags: [
      { type: "title", children: title },
      { type: "meta", props: { name: "description", content: description } },
      { type: "link", props: { rel: "canonical", href: canonical } },
      { type: "meta", props: { property: "og:title", content: title } },
      { type: "meta", props: { property: "og:description", content: description } },
      { type: "meta", props: { property: "og:url", content: canonical } },
      { type: "meta", props: { property: "og:type", content: "product" } },
      { type: "meta", props: { property: "og:image", content: ogImage } },
      { type: "meta", props: { name: "twitter:card", content: "summary_large_image" } },
      { type: "meta", props: { name: "twitter:title", content: title } },
      { type: "meta", props: { name: "twitter:description", content: description } },
      { type: "meta", props: { name: "twitter:image", content: ogImage } },
    ],
  };
}

const PRODUCT_SEO = {
  "walnut-writing-desk": {
    title: "Walnut Writing Desk · Studio Linea",
    description:
      "Solid walnut writing desk with quiet lines and integrated cable routing. A centerpiece for the considered workspace — handcrafted for calm, focused work.",
  },
  "cable-organizer-laptop-stand-set": {
    title: "Cable Organizer & Laptop Stand Set · Studio Linea",
    description:
      "Cable organizer and laptop stand set that keeps your desk composed. Designed to pair with Studio Linea desks for a clean, elevated workspace.",
  },
  "limestone-acoustic-panel-trio": {
    title: "Limestone Acoustic Panel Trio · Studio Linea",
    description:
      "Three limestone-toned acoustic panels that soften sound without visual noise. Editorial workspace acoustics for home offices and studios.",
  },
};

const ROBOTS_TXT = `User-agent: *
Allow: /

Disallow: /cart
Disallow: /thank-you
Disallow: /*?cursor=

Sitemap: ${SITE_URL}/sitemap.xml
`;

const LLMS_TXT = `Quiet luxury office equipment — desks, cable organizers, and acoustic panels curated as coherent workspace environments.

## Pages
- ${SITE_URL}/ — Home
- ${SITE_URL}/products — Product collection
- ${SITE_URL}/about — Brand story
- ${SITE_URL}/faq — Shipping, care, and returns
`;

async function main() {
  console.log(`Configuring SEO for ${SITE_URL} (site ${siteId})…`);

  await wixFetch("/promote-seo-robots-server/v2/robots", {
    method: "PUT",
    body: {
      robotsTxt: {
        content: ROBOTS_TXT,
        default: false,
        subdomain: "www",
      },
    },
  });
  console.log("✓ robots.txt updated");

  await wixFetch("/promote-seo-robots-server/v2/llms", {
    method: "PUT",
    body: {
      llmsTxt: {
        content: LLMS_TXT,
        default: false,
        subdomain: "www",
      },
    },
  });
  console.log("✓ llms.txt updated");

  const { products = [] } = await wixFetch("/stores/v3/products/query", {
    method: "POST",
    body: { query: { filter: {}, paging: { limit: 20 } } },
  });

  for (const product of products) {
    if (product.ribbon?.name === "Gift Card") continue;
    const copy = PRODUCT_SEO[product.slug];
    if (!copy) {
      console.log(`· skipped ${product.slug} (no SEO copy defined)`);
      continue;
    }
    const canonical = `${SITE_URL}/products/${product.slug}`;
    const id = product.id ?? product._id;
    await wixFetch(`/stores/v3/products/${id}`, {
      method: "PATCH",
      body: {
        product: {
          revision: product.revision,
          seoData: productSeoTags({ ...copy, canonical }),
        },
      },
    });
    console.log(`✓ product SEO: ${product.slug}`);
  }

  console.log("\nDone. Verify after release:");
  console.log(`  ${SITE_URL}/robots.txt`);
  console.log(`  ${SITE_URL}/llms.txt`);
  console.log(`  ${SITE_URL}/sitemap.xml`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
