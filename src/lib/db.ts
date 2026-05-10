import { neon } from '@neondatabase/serverless';

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  return neon(process.env.DATABASE_URL);
}

export interface Recipe {
  id: number;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string;
  site_name: string | null;
  created_at: string;
}

export async function initDb(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS recipes (
      id        SERIAL PRIMARY KEY,
      url       TEXT NOT NULL UNIQUE,
      title     TEXT NOT NULL,
      description TEXT,
      image     TEXT,
      category  TEXT NOT NULL,
      site_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE recipes ADD COLUMN IF NOT EXISTS search_vector tsvector`;
  await sql`CREATE INDEX IF NOT EXISTS idx_recipes_search ON recipes USING GIN(search_vector)`;
  await sql`
    CREATE OR REPLACE FUNCTION recipes_search_update_fn() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector = to_tsvector('english',
        coalesce(NEW.title, '') || ' ' ||
        coalesce(NEW.description, '') || ' ' ||
        coalesce(NEW.category, '') || ' ' ||
        coalesce(NEW.site_name, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `;
  await sql`
    CREATE OR REPLACE TRIGGER recipes_search_update
    BEFORE INSERT OR UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION recipes_search_update_fn()
  `;
}

export async function insertRecipe(data: Omit<Recipe, 'id' | 'created_at'>): Promise<Recipe> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO recipes (url, title, description, image, category, site_name)
    VALUES (${data.url}, ${data.title}, ${data.description}, ${data.image}, ${data.category}, ${data.site_name})
    RETURNING id, url, title, description, image, category, site_name, created_at::text
  `;
  return rows[0] as Recipe;
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, url, title, description, image, category, site_name, created_at::text
    FROM recipes ORDER BY created_at DESC
  `;
  return rows as Recipe[];
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, url, title, description, image, category, site_name, created_at::text
    FROM recipes
    WHERE search_vector @@ plainto_tsquery('english', ${query})
    ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${query})) DESC
  `;
  return rows as Recipe[];
}

export async function deleteRecipe(id: number): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM recipes WHERE id = ${id}`;
}

export async function recipeExists(url: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`SELECT 1 FROM recipes WHERE url = ${url} LIMIT 1`;
  return rows.length > 0;
}
