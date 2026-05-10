'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Recipe {
  id: number;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string;
  site_name: string | null;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Breakfast & Brunch': 'bg-yellow-100 text-yellow-800',
  'Appetizers & Snacks': 'bg-green-100 text-green-800',
  'Soups & Stews': 'bg-orange-100 text-orange-800',
  'Salads': 'bg-lime-100 text-lime-800',
  'Pasta & Noodles': 'bg-amber-100 text-amber-800',
  'Pizza': 'bg-red-100 text-red-800',
  'Sandwiches & Wraps': 'bg-cyan-100 text-cyan-800',
  'Seafood': 'bg-blue-100 text-blue-800',
  'Chicken & Poultry': 'bg-orange-100 text-orange-900',
  'Beef & Pork': 'bg-rose-100 text-rose-800',
  'Vegetarian & Vegan': 'bg-emerald-100 text-emerald-800',
  'Side Dishes': 'bg-teal-100 text-teal-800',
  'Baking & Bread': 'bg-amber-100 text-amber-900',
  'Desserts & Sweets': 'bg-pink-100 text-pink-800',
  'Drinks & Cocktails': 'bg-purple-100 text-purple-800',
  'Other': 'bg-gray-100 text-gray-700',
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-700';
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  const loadRecipes = useCallback(async (q?: string) => {
    setFetching(true);
    try {
      const endpoint = q ? `/api/search?q=${encodeURIComponent(q)}` : '/api/recipes';
      const res = await fetch(endpoint);
      const data = await res.json();
      setRecipes(Array.isArray(data) ? data : []);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  useEffect(() => {
    const t = setTimeout(() => {
      setActiveCategory(null);
      loadRecipes(query || undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [query, loadRecipes]);

  async function addRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
      } else {
        setUrl('');
        await loadRecipes(query || undefined);
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecipe(id: number) {
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    setRecipes(r => r.filter(x => x.id !== id));
  }

  const categories = Array.from(new Set(recipes.map(r => r.category))).sort();
  const displayed = activeCategory
    ? recipes.filter(r => r.category === activeCategory)
    : recipes;

  return (
    <div className="space-y-8">
      {/* Add recipe form */}
      <form onSubmit={addRecipe} className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 space-y-4">
        <h2 className="font-semibold text-amber-900 text-lg">Add a recipe</h2>
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="Paste a recipe URL…"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="flex-1 border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50 placeholder-amber-300"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
        {loading && (
          <p className="text-sm text-amber-600 animate-pulse">
            Fetching recipe and categorizing with AI…
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {/* Search bar */}
      <div className="flex gap-3 items-center">
        <input
          type="search"
          placeholder="Search recipes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white placeholder-amber-300"
        />
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${activeCategory === null ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${activeCategory === cat ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Recipe grid */}
      {fetching ? (
        <div className="text-center py-16 text-amber-400 text-sm">Loading…</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-amber-300 text-sm">
          {recipes.length === 0 ? 'No recipes yet. Paste a URL above to get started!' : 'No recipes match your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onDelete={deleteRecipe} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, onDelete }: { recipe: Recipe; onDelete: (id: number) => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={recipe.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 bg-amber-50 shrink-0">
        {recipe.image && !imgError ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">🍽️</div>
        )}
        {/* Delete button */}
        <button
          onClick={e => { e.preventDefault(); onDelete(recipe.id); }}
          className="absolute top-2 right-2 bg-white/80 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold shadow"
          title="Remove"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor(recipe.category)}`}>
          {recipe.category}
        </span>
        <h3 className="font-semibold text-amber-900 text-sm leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{recipe.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-amber-400">
          <span>{recipe.site_name}</span>
          <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </a>
  );
}
