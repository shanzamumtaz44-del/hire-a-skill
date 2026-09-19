export const CATEGORIES = [
  "Web Development",
  "Mobile Apps",
  "Software & Scripting",
  "Data & AI",
  "Design",
  "Writing",
  "Marketing",
  "Video & Audio",
  "Photography",
  "Business & Finance",
  "Engineering & CAD",
  "Academic Support",
  "Translation",
  "Events & Admin",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_BLURBS: Record<string, string> = {
  "Web Development": "Landing pages, apps and fixes built by CS students.",
  "Mobile Apps": "iOS, Android and Flutter builds from student developers.",
  "Software & Scripting": "Automations, scripts and small tools that save hours.",
  "Data & AI": "Dashboards, models and analysis from data students.",
  Design: "Logos, decks and interfaces from design majors.",
  Writing: "Blogs, docs and editing from humanities students.",
  Marketing: "Campaigns, SEO and social from business students.",
  "Video & Audio": "Edits, reels and podcasts from media students.",
  Photography: "Shoots, retouching and product photos on campus rates.",
  "Business & Finance": "Models, research and reports from finance students.",
  "Engineering & CAD": "Drawings, 3D models and prototypes from engineers.",
  "Academic Support": "Tutoring and research help, peer to peer.",
  Translation: "Subtitles and localisation from language students.",
  "Events & Admin": "Event help, coordination and data work.",
  General: "Everything else students can help with.",
};

export const TIMELINES = ["Less than 1 week", "1-2 weeks", "2-4 weeks", "1-3 months", "Flexible"];

export function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function timeAgo(date: string | null | undefined) {
  if (!date) return "recently";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}
