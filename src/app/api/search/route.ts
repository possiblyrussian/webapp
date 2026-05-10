import { NextRequest, NextResponse } from 'next/server';
import { searchRecipes, getAllRecipes } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q) return NextResponse.json(await getAllRecipes());
    return NextResponse.json(await searchRecipes(q));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
