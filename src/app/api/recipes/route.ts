import { NextRequest, NextResponse } from 'next/server';
import { getAllRecipes, insertRecipe, recipeExists } from '@/lib/db';
import { scrapeRecipe } from '@/lib/scraper';
import { categorizeRecipe } from '@/lib/categorize';

export async function GET() {
  try {
    return NextResponse.json(getAllRecipes());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
    }

    if (recipeExists(url)) {
      return NextResponse.json({ error: 'Recipe already saved' }, { status: 409 });
    }

    const scraped = await scrapeRecipe(url);
    const category = await categorizeRecipe(scraped.title, scraped.description);
    const recipe = insertRecipe({ url, ...scraped, category });

    return NextResponse.json(recipe, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
