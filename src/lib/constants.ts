export const CATEGORIES = [
  "Web Development",
  "Design",
  "Data & AI",
  "Writing",
  "Marketing",
  "Video & Audio",
  "Academic Support",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_BLURBS: Record<string, string> = {
  "Web Development": "Landing pages, apps and fixes built by CS students.",
  Design: "Logos, decks and interfaces from design majors.",
  "Data & AI": "Dashboards, models and analysis from data students.",
  Writing: "Blogs, docs and editing from humanities students.",
  Marketing: "Campaigns, SEO and social from business students.",
  "Video & Audio": "Edits, reels and podcasts from media students.",
  "Academic Support": "Tutoring and research help, peer to peer.",
  General: "Everything else students can help with.",
};

export const TIMELINES = ["Less than 1 week", "1-2 weeks", "2-4 weeks", "1-3 months", "Flexible"];

export function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
