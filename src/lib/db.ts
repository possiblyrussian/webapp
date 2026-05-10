import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'recipes.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        image TEXT,
        category TEXT NOT NULL,
        site_name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS recipes_fts USING fts5(
        title,
        description,
        category,
        site_name,
        content='recipes',
        content_rowid='id'
      );

      CREATE TRIGGER IF NOT EXISTS recipes_ai AFTER INSERT ON recipes BEGIN
        INSERT INTO recipes_fts(rowid, title, description, category, site_name)
        VALUES (new.id, new.title, new.description, new.category, new.site_name);
      END;

      CREATE TRIGGER IF NOT EXISTS recipes_ad AFTER DELETE ON recipes BEGIN
        INSERT INTO recipes_fts(recipes_fts, rowid, title, description, category, site_name)
        VALUES ('delete', old.id, old.title, old.description, old.category, old.site_name);
      END;
    `);
  }
  return db;
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

export function insertRecipe(data: Omit<Recipe, 'id' | 'created_at'>): Recipe {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO recipes (url, title, description, image, category, site_name)
    VALUES (@url, @title, @description, @image, @category, @site_name)
  `);
  const result = stmt.run(data);
  return db.prepare('SELECT * FROM recipes WHERE id = ?').get(result.lastInsertRowid) as Recipe;
}

export function getAllRecipes(): Recipe[] {
  return getDb().prepare('SELECT * FROM recipes ORDER BY created_at DESC').all() as Recipe[];
}

export function searchRecipes(query: string): Recipe[] {
  const db = getDb();
  return db.prepare(`
    SELECT r.* FROM recipes r
    JOIN recipes_fts fts ON fts.rowid = r.id
    WHERE recipes_fts MATCH ?
    ORDER BY rank
  `).all(query) as Recipe[];
}

export function deleteRecipe(id: number): void {
  getDb().prepare('DELETE FROM recipes WHERE id = ?').run(id);
}

export function recipeExists(url: string): boolean {
  const row = getDb().prepare('SELECT 1 FROM recipes WHERE url = ?').get(url);
  return !!row;
}
