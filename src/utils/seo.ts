export const SITE_NAME = "Studio Linea";

export const SITE_DESCRIPTION =
  "Desks, organizers, and acoustic pieces — curated as one calm, coherent workspace environment by Studio Linea.";

/** Default social share image (1200×630). Served from /public. */
export const DEFAULT_OG_IMAGE = "/og-image.png";

export const DEFAULT_OG_IMAGE_ALT =
  "Studio Linea — quiet luxury workspace equipment for the considered office";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function truncateDescription(text: string | undefined, max = 160): string | undefined {
  if (!text) return undefined;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function pageTitle(title: string | undefined, siteName = SITE_NAME): string {
  return title ? `${title} · ${siteName}` : siteName;
}

export function canonicalUrl(pathname: string, site: URL | string | undefined): URL | undefined {
  if (!site) return undefined;
  return new URL(pathname, site);
}

export function absoluteHref(pathname: string, site: URL | string | undefined): string | undefined {
  return canonicalUrl(pathname, site)?.href;
}

export function isPaginatedListing(url: URL): boolean {
  return url.searchParams.has("cursor");
}

function siteId(site: URL | string): string {
  const href = typeof site === "string" ? site : site.href;
  return href.replace(/\/$/, "");
}

export function breadcrumbListJsonLd(
  items: BreadcrumbItem[],
  site: URL | string | undefined,
  pagePathname?: string,
): Record<string, unknown> | null {
  if (!site || items.length === 0) return null;
  const pageHref = absoluteHref(pagePathname ?? items[items.length - 1].href ?? "/", site);

  return {
    "@type": "BreadcrumbList",
    "@id": `${pageHref}#breadcrumb`,
    itemListElement: items.map((item, index) => {
      const entry: Record<string, unknown> = {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
      };
      if (item.href) {
        entry.item = absoluteHref(item.href, site);
      }
      return entry;
    }),
  };
}

export function itemListJsonLd(
  products: Array<{ name?: string; slug?: string }>,
  site: URL | string | undefined,
  listName: string,
): Record<string, unknown> | null {
  if (!site || products.length === 0) return null;

  return {
    "@type": "ItemList",
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: product.slug ? absoluteHref(`/products/${product.slug}`, site) : undefined,
      name: product.name,
    })),
  };
}

export function collectionPageJsonLd(params: {
  site: URL | string;
  pathname: string;
  name: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  itemList?: Record<string, unknown> | null;
}): Record<string, unknown> {
  const pageUrl = absoluteHref(params.pathname, params.site);
  const graph: Record<string, unknown>[] = [];
  if (params.breadcrumbs) {
    const breadcrumb = breadcrumbListJsonLd(params.breadcrumbs, params.site, params.pathname);
    if (breadcrumb) graph.push(breadcrumb);
  }
  graph.push({
    "@type": "CollectionPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: params.name,
    description: truncateDescription(params.description, 5000),
    isPartOf: { "@id": `${siteId(params.site)}#website` },
  });
  if (params.itemList) {
    graph.push(params.itemList);
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function webPageJsonLd(params: {
  site: URL | string;
  pathname: string;
  name: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  type?: string;
}): Record<string, unknown> {
  const pageUrl = absoluteHref(params.pathname, params.site);
  const graph: Record<string, unknown>[] = [
    {
      "@type": params.type ?? "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: params.name,
      description: params.description ? truncateDescription(params.description, 5000) : undefined,
      isPartOf: { "@id": `${siteId(params.site)}#website` },
    },
  ];
  const breadcrumb = params.breadcrumbs
    ? breadcrumbListJsonLd(params.breadcrumbs, params.site)
    : null;
  if (breadcrumb) graph.unshift(breadcrumb);
  return { "@context": "https://schema.org", "@graph": graph };
}

export function homePageJsonLd(
  site: URL,
  description: string,
  featured: Array<{ name?: string; slug?: string }>,
): Record<string, unknown> {
  const base = siteId(site);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": `${base}#organization`,
      name: SITE_NAME,
      url: base,
      description: truncateDescription(description, 5000),
      logo: `${base}${DEFAULT_OG_IMAGE}`,
    },
    {
      "@type": "WebSite",
      "@id": `${base}#website`,
      url: base,
      name: SITE_NAME,
      description: truncateDescription(description, 5000),
      publisher: { "@id": `${base}#organization` },
    },
    {
      "@type": "OnlineStore",
      "@id": `${base}#store`,
      name: SITE_NAME,
      url: base,
      parentOrganization: { "@id": `${base}#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${base}#webpage`,
      url: base,
      name: pageTitle("Quiet luxury workspace equipment"),
      description: truncateDescription(description, 5000),
      isPartOf: { "@id": `${base}#website` },
    },
  ];
  const featuredList = itemListJsonLd(featured, site, `${SITE_NAME} — Featured pieces`);
  if (featuredList) graph.push(featuredList);
  return { "@context": "https://schema.org", "@graph": graph };
}

export function faqPageJsonLd(
  items: Array<{ question: string; answer: string }>,
  site: URL | string,
  pageUrl: string,
): Record<string, unknown> | null {
  if (items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        url: pageUrl,
        isPartOf: { "@id": `${siteId(site)}#website` },
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: stripHtml(item.answer),
          },
        })),
      },
      breadcrumbListJsonLd(
        [
          { label: "Home", href: "/" },
          { label: "FAQ" },
        ],
        site,
        "/faq",
      )!,
    ],
  };
}

export function productPageJsonLd(params: {
  site: URL | string;
  slug: string;
  name: string;
  description?: string;
  images: string[];
  sku?: string;
  price: number;
  currency?: string;
  inStock: boolean;
  categoryName?: string;
  categorySlug?: string;
}): Record<string, unknown> | null {
  const productUrl = absoluteHref(`/products/${params.slug}`, params.site);
  if (!productUrl || params.price <= 0) return null;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "The Collection", href: "/products" },
  ];
  if (params.categoryName && params.categorySlug) {
    breadcrumbs.push({
      label: params.categoryName,
      href: `/category/${params.categorySlug}`,
    });
  }
  breadcrumbs.push({ label: params.name });

  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  const graph: Record<string, unknown>[] = [
    breadcrumbListJsonLd(breadcrumbs, params.site, `/products/${params.slug}`)!,
    {
      "@type": "Product",
      "@id": `${productUrl}#product`,
      name: params.name,
      description: params.description ? truncateDescription(params.description, 5000) : undefined,
      image: params.images.filter(Boolean),
      sku: params.sku,
      brand: {
        "@type": "Brand",
        name: SITE_NAME,
      },
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: params.currency ?? "USD",
        price: params.price,
        priceValidUntil: priceValidUntil.toISOString().split("T")[0],
        itemCondition: "https://schema.org/NewCondition",
        availability: params.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: {
          "@type": "Organization",
          name: SITE_NAME,
        },
      },
    },
    {
      "@type": "WebPage",
      "@id": `${productUrl}#webpage`,
      url: productUrl,
      name: pageTitle(params.name),
      description: truncateDescription(params.description, 5000),
      isPartOf: { "@id": `${siteId(params.site)}#website` },
      primaryImageOfPage: params.images[0]
        ? { "@type": "ImageObject", url: params.images[0] }
        : undefined,
    },
  ];

  return { "@context": "https://schema.org", "@graph": graph };
}
