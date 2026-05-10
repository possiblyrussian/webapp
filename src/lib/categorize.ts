import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const CATEGORIES = [
  'Breakfast & Brunch',
  'Appetizers & Snacks',
  'Soups & Stews',
  'Salads',
  'Pasta & Noodles',
  'Pizza',
  'Sandwiches & Wraps',
  'Seafood',
  'Chicken & Poultry',
  'Beef & Pork',
  'Vegetarian & Vegan',
  'Side Dishes',
  'Baking & Bread',
  'Desserts & Sweets',
  'Drinks & Cocktails',
  'Other',
];

export async function categorizeRecipe(title: string, description: string | null): Promise<string> {
  const text = [title, description].filter(Boolean).join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 32,
    messages: [
      {
        role: 'user',
        content: `Categorize this recipe into exactly one of the following categories. Reply with only the category name, nothing else.\n\nCategories:\n${CATEGORIES.join('\n')}\n\nRecipe:\n${text}`,
      },
    ],
  });

  const reply = (message.content[0] as { text: string }).text.trim();
  return CATEGORIES.includes(reply) ? reply : 'Other';
}
