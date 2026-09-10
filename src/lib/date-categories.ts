// ============================================================================
// Source: src/lib/date-categories.ts
// Version: 0.1.0 — 2026-09-10
// Why: The thirteen kinds of personal date: what each is called, what belongs
//      in it, which icon and colour carry it, how often it comes round, and
//      what sentence its age makes. Split out of lib/dates so the arithmetic
//      there never has to know about wording or colour.
// Env / Deps: Colours are CSS custom properties defined in globals.css, one
//      pair per category per theme — never hex here; only day-card.tsx may hold
//      a hex, because a canvas cannot read a variable.
// ============================================================================

// How often an entry comes round. 'yearly' is the only rhythm the list knew
// before 0.9.25; the other two arrived with the categories that need them.
export type Repeat = 'yearly' | 'monthly' | 'once';

// 'age' → «۳۵ ساله می‌شود», only ever true of a person's birthday.
// 'ordinal' → «۳۵مین سال», for a date that is being marked rather than aged.
// 'none' → an instalment has no age, and saying it has one reads as a bug.
export type AgeSentence = 'age' | 'ordinal' | 'none';

export type CategoryId =
  | 'birthday' | 'love' | 'anniversary' | 'memorial' | 'joy'
  | 'period' | 'instalment'
  | 'shopping' | 'work' | 'travel' | 'health' | 'study' | 'sport' | 'home';

export type Category = {
  id: CategoryId;
  label: string;
  // Shown under the label when choosing. Says what belongs here — not why it matters.
  hint: string;
  repeat: Repeat;
  age: AgeSentence;
};

export const CATEGORIES: Category[] = [
  { id: 'birthday', label: 'تولد', hint: 'تولد آدم‌ها؛ سن هم حساب می‌شود', repeat: 'yearly', age: 'age' },
  { id: 'love', label: 'عاشقانه‌ها', hint: 'روزی که شروع شد، و هر سالی که از آن گذشت', repeat: 'yearly', age: 'ordinal' },
  { id: 'anniversary', label: 'سالگرد', hint: 'هر سالگردی که جای دیگری نمی‌گنجد — کاری، خانوادگی، هرچه', repeat: 'yearly', age: 'ordinal' },
  { id: 'memorial', label: 'جاویدنامان', hint: 'فرزندان ایران و جان‌فدایان میهن؛ روزی که رفتند و هر سال پس از آن', repeat: 'yearly', age: 'ordinal' },
  { id: 'joy', label: 'خوشحالی', hint: 'هر روزی که دلت می‌خواهد دوباره بیاید', repeat: 'yearly', age: 'ordinal' },
  { id: 'period', label: 'پریود', hint: 'شروع دوره، با یادآوری چند روز قبلش', repeat: 'monthly', age: 'none' },
  { id: 'instalment', label: 'قسط', hint: 'وام، اجاره، اشتراک — هر چیزی که سررسید دارد', repeat: 'monthly', age: 'none' },
  { id: 'shopping', label: 'خرید', hint: 'چیزی که باید بخری، تا روزش یادت بماند', repeat: 'once', age: 'none' },
  { id: 'work', label: 'قرار کاری', hint: 'جلسه، مصاحبه، تحویل پروژه', repeat: 'once', age: 'none' },
  { id: 'travel', label: 'سفر', hint: 'پرواز، قطار، روزی که راه می‌افتی', repeat: 'once', age: 'none' },
  { id: 'health', label: 'سلامت', hint: 'نوبت دکتر، دارو، آزمایش', repeat: 'once', age: 'none' },
  { id: 'study', label: 'درس و آزمون', hint: 'امتحان، ددلاین، ثبت‌نام', repeat: 'once', age: 'none' },
  { id: 'sport', label: 'ورزش', hint: 'تمرین، مسابقه، روزی که نباید بپیچانی', repeat: 'once', age: 'none' },
  { id: 'home', label: 'خانه', hint: 'تعمیر، قبض، کارهایی که همیشه عقب می‌افتند', repeat: 'once', age: 'none' },
];

export const CATEGORY_IDS = CATEGORIES.map((category) => category.id);

export const DEFAULT_CATEGORY: CategoryId = 'birthday';

const BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

/** The category, or the default when a stored id is unknown — a bad id must not blank a row. */
export function categoryOf(id: string): Category {
  return BY_ID.get(id as CategoryId) ?? BY_ID.get(DEFAULT_CATEGORY)!;
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && BY_ID.has(value as CategoryId);
}

export function isRepeat(value: unknown): value is Repeat {
  return value === 'yearly' || value === 'monthly' || value === 'once';
}

export const REPEATS: { value: Repeat; label: string; hint: string }[] = [
  { value: 'yearly', label: 'هر سال', hint: 'همان روز و ماه، هر سال' },
  { value: 'monthly', label: 'هر ماه', hint: 'همان روز، هر ماه' },
  { value: 'once', label: 'یک‌بار', hint: 'یک تاریخ مشخص، فقط همان یک بار' },
];

/** The CSS variables globals.css defines for a category. */
export function categoryInk(id: CategoryId): string { return `var(--color-cat-${id})`; }
export function categoryTint(id: CategoryId): string { return `var(--color-cat-${id}-tint)`; }
