# Studio Linea

A Wix headless site built with the `wix-headless` skill. Luxury high-quality office equipment — desks, cable organizers, acoustic panels, laptop stands — with a quiet luxury editorial aesthetic inspired by curated workspace environments.

## Live site
- **Site:** https://studio-lin-9b69d2db-izzyz1.wix-site-host.com
- **Dashboard:** https://manage.wix.com/dashboard/e3703e88-7b42-4ad6-8509-fd2c10dd386e
- **Site URL in config:** `astro.config.mjs` → `site` (update when a custom domain is connected)

## Frontend
astro (Wix-hosted). Run: `wix dev`. Build + publish: `wix build` then `wix release`.

## Features
- Product catalog with curated spaces, add-to-setup accessories, and gallery-style product pages
- Cart and checkout via Wix hosted checkout
- About and FAQ content collections editable from the dashboard

## Pages
`/`, `/about`, `/faq`, `/products`, `/products/[slug]`, `/category/[slug]`, `/cart`, `/thank-you`

## Seeded content
3 products across 2 curated spaces (The Walnut Suite, The Limestone Nook) · About + FAQ collections (1 manifesto, 5 FAQ items).

## Extending
Built with the `wix-headless` skill; re-run it to add features or restyle.

---

## SEO — required on every code change

**Every change that touches pages, layout, routing, products, or platform config must follow Wix Headless SEO standards.** SEO is not a one-time task — treat it as part of the definition of done for any frontend or content work.

### Architecture (do not break)

| Piece | Purpose | Location |
|-------|---------|----------|
| `wixPages()` integration | Registers dynamic routes with Wix (sitemap, SEO editor, deep links) | `astro.config.mjs` |
| `wixMetadata` export | **Required** on product detail — without it, products are invisible to Wix sitemap | `src/pages/products/[slug].astro` |
| `SeoTags` component | Renders merchant-edited product SEO from dashboard (`product.seoData.tags`) | `src/components/SeoTags.astro` |
| `PageSeo` component | Canonical, OG, Twitter, robots, hreflang for static/non-Wix-SEO pages | `src/components/PageSeo.astro` |
| `JsonLd` + `src/utils/seo.ts` | Structured data builders (Product, FAQ, CollectionPage, BreadcrumbList, etc.) | `src/components/JsonLd.astro`, `src/utils/seo.ts` |
| `Breadcrumbs` component | Visual + JSON-LD breadcrumb trails | `src/components/Breadcrumbs.astro` |
| `npm run seo:configure` | Pushes `robots.txt`, `llms.txt`, and product `seoData` via Wix REST API | `scripts/configure-seo.mjs` |

### Checklist — new or changed pages

When adding or modifying any `.astro` page:

1. **Pass SEO props to `Layout`:** `title`, `description`, and `image` / `imageAlt` where relevant.
2. **Add JSON-LD** via `<JsonLd slot="head" data={...} />` using helpers from `src/utils/seo.ts`.
3. **Add visual breadcrumbs** (`<Breadcrumbs />`) on inner pages when appropriate.
4. **Set `noindex`** on non-indexable routes (cart, thank-you, 404, paginated `?cursor=` listings — handled automatically in `Layout` for cursor pages).
5. **Use real routes for filtered content** — never client-side hide/show for catalog filtering; use `/category/[slug]` server-side routes.
6. **One `<h1>` per page** — product cards use `<h3>`, page headers use `<h1>`.

### Checklist — product pages (Wix Stores)

1. **Keep `export const wixMetadata`** with Stores appDefId `1380b703-ce81-ff05-f115-39571d94dfcd` and `pageIdentifier: "wix.stores.sub_pages.product"`.
2. **Use `getProductBySlug()`** — not `queryProducts()` on detail pages.
3. **Pipe `product.seoData.tags` through `SeoTags`** in the `head` slot when tags exist; fall back to `Layout` + `PageSeo` when empty.
4. **Always add `productPageJsonLd()`** in addition to Wix `SeoTags` (JSON-LD is our responsibility).
5. **Do not add `fields: ["SEO_DATA"]`** — `seoData` is returned by default; that enum value does not exist.
6. After adding products or changing slugs, run **`npm run seo:configure`** to sync dashboard SEO tags and re-run after **custom domain** changes.

### Checklist — platform / reserved paths

Wix intercepts these at the edge — **do not** add competing files in `public/`:

| Path | Configure via |
|------|----------------|
| `/robots.txt` | `npm run seo:configure` (Wix SEO REST API) |
| `/llms.txt` | `npm run seo:configure` |
| `/favicon.svg` | Embed in `Layout.astro` `<head>` (data URI) — Wix may intercept `/favicon.svg` |

Default OG image: `public/og-image.png` (referenced by `DEFAULT_OG_IMAGE` in `src/utils/seo.ts`).

### Checklist — release

SEO code changes are **not live until published**:

```bash
wix build   # optional locally
wix release # required — pushes to *.wix-site-host.com
```

After changing `site` in `astro.config.mjs` or adding products, run `npm run seo:configure` then `wix release`.

### Google Search Console

- Verification meta tag lives in `src/components/PageSeo.astro` (and `Layout.astro`).
- HTML-file fallback route: `src/pages/googlea3867c5819e17499.html.ts`.
- Submit `sitemap.xml` in Search Console after verification.
- `*.wix-site-host.com` URLs may trigger false **Deceptive pages** flags — request review in Search Console if Sample URLs show N/A.

### Anti-patterns (never do)

| Wrong | Correct |
|-------|---------|
| `public/robots.txt` | `npm run seo:configure` |
| Client-side product filtering for SEO pages | Server-side `/category/[slug]` routes |
| Omit `wixMetadata` on product detail | Always export — sitemap breaks silently |
| Hardcode product `<title>` when `seoData.tags` exist | Use `SeoTags` + dashboard SEO editor |
| `export const prerender = true` on product `[slug]` | SSR only — `productsV3` needs request context |
| Skip `wix release` after SEO/meta changes | Always release to update live site |

### Reference

- Wix headless skill: `references/astro/stores/PRODUCT_PAGES.md`, `references/shared/PRODUCTION_SHARP_EDGES.md`
- SEO utilities: `src/utils/seo.ts` — use existing helpers before inventing new meta/JSON-LD patterns
