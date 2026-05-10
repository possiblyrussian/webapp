import * as cheerio from 'cheerio';

export interface ScrapedRecipe {
  title: string;
  description: string | null;
  image: string | null;
  site_name: string | null;
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // Try JSON-LD schema.org/Recipe first
  let title: string | null = null;
  let description: string | null = null;
  let image: string | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const entries = Array.isArray(data) ? data : [data];
      for (const entry of entries) {
        const recipe = entry['@type'] === 'Recipe' ? entry
          : entry['@graph']?.find((n: { '@type': string }) => n['@type'] === 'Recipe');
        if (recipe) {
          title = title ?? (typeof recipe.name === 'string' ? recipe.name : null);
          description = description ?? (typeof recipe.description === 'string' ? recipe.description : null);
          if (!image) {
            const img = recipe.image;
            if (typeof img === 'string') image = img;
            else if (Array.isArray(img)) image = img[0]?.url ?? img[0] ?? null;
            else if (img?.url) image = img.url;
          }
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  });

  // Fall back to Open Graph / meta tags
  const og = (prop: string) =>
    $(`meta[property="${prop}"]`).attr('content') ||
    $(`meta[name="${prop}"]`).attr('content') ||
    null;

  title = title ?? og('og:title') ?? ($('title').text().trim() || 'Untitled Recipe');
  description = description ?? og('og:description') ?? og('description');
  image = image ?? og('og:image');
  const site_name = og('og:site_name') ?? new URL(url).hostname.replace(/^www\./, '');

  return {
    title: title.trim(),
    description: description?.trim() ?? null,
    image,
    site_name,
  };
}
