const CATEGORY_ALIASES: Record<string, string> = {
  appetizers: "Appetizer",
  appetizer: "Appetizer",
  starters: "Appetizer",
  starter: "Appetizer",
  smallplates: "Appetizer",
  smallplate: "Appetizer",
  breakfast: "Breakfast",
  brunch: "Brunch",
  lunch: "Lunch",
  salad: "Salad",
  salads: "Salad",
  soup: "Soup",
  soups: "Soup",
  sandwich: "Sandwich",
  sandwiches: "Sandwich",
  entree: "Entree",
  entrees: "Entree",
  main: "Entree",
  mains: "Entree",
  dinner: "Dinner",
  side: "Side",
  sides: "Side",
  snack: "Snack",
  snacks: "Snack",
  dessert: "Dessert",
  desserts: "Dessert",
  drinks: "Drinks",
  drink: "Drinks",
  beverages: "Drinks",
  beverage: "Drinks",
  cocktails: "Drinks",
  wine: "Drinks",
  wines: "Drinks",
  beer: "Drinks",
  beers: "Drinks",
};

export interface MenuDraftDish {
  id: string;
  name: string;
  category: string;
  price: number | null;
  sourceLine: string;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function extractCategory(line: string): string | null {
  const normalized = normalizeHeader(line);
  return CATEGORY_ALIASES[normalized] || null;
}

function cleanupLine(line: string): string {
  return line
    .replace(/[|•·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeDescription(line: string): boolean {
  if (line.length < 18) return false;
  const lower = line.toLowerCase();
  return (
    lower.includes("served with") ||
    lower.includes("topped with") ||
    lower.includes("choice of") ||
    lower.includes("includes") ||
    lower.includes("with ") ||
    lower.includes("and ")
  );
}

function looksLikeMenuItemName(line: string): boolean {
  if (line.length < 2 || line.length > 70) return false;
  if (/^\$?\d+(?:\.\d{2})?$/.test(line)) return false;
  if (looksLikeDescription(line)) return false;
  if (/\badd\b/i.test(line) && /\$\d/.test(line)) return false;
  const words = line.split(/\s+/);
  return words.length <= 8;
}

export function parseMenuText(text: string): MenuDraftDish[] {
  const lines = text
    .split(/\r?\n/)
    .map(cleanupLine)
    .filter(Boolean);

  const drafts: MenuDraftDish[] = [];
  let currentCategory = "Entree";

  for (const line of lines) {
    const category = extractCategory(line);
    if (category) {
      currentCategory = category;
      continue;
    }

    if (!looksLikeMenuItemName(line)) continue;

    const priceMatch = line.match(/\$?\s?(\d{1,3}(?:\.\d{2})?)(?!.*\d)/);
    const price = priceMatch ? Number(priceMatch[1]) : null;
    const name = cleanupLine(
      line
        .replace(/\$?\s?\d{1,3}(?:\.\d{2})?(?!.*\d)/, "")
        .replace(/\.+/g, " ")
    );

    if (!name || name.length < 2) continue;
    if (!/[a-z]/i.test(name)) continue;

    drafts.push({
      id: `${currentCategory}-${name}-${drafts.length}`,
      name,
      category: currentCategory,
      price,
      sourceLine: line,
    });
  }

  return drafts.slice(0, 40);
}
