/**
 * Central site metadata used for SEO, Open Graph / Twitter cards,
 * the sitemap, and the llms.txt AEO file.
 *
 * `url` is the canonical production origin — update it to your
 * actual deployed domain.
 */
export const siteConfig = {
  name: "Micro Finance Software | Dorii Software",

  // Canonical production URL — change this to your deployed domain.
  url: "https://your-domain.com",

  description:
    "Micro finance management software developed by Dorii Software for managing branches, groups, members, loans, collections, accounts, and daily microfinance operations.",

  // Path relative to the site root.
  ogImage: "/og-image.png",

  keywords: [
    "micro finance software",
    "microfinance software",
    "micro finance management software",
    "microfinance management system",
    "microfinance ERP",
    "microfinance loan management",
    "loan management software",
    "group management software",
    "member management",
    "collection management",
    "branch management",
    "microfinance accounting",
    "microfinance MIS",
    "microfinance ERP software",
    "Dorii Software",
    "Dorii micro finance software",
  ],

  links: {
    github: "https://github.com/your-account/your-repository",
    demo: "https://your-domain.com",
  },
} as const;

export type SiteConfig = typeof siteConfig;
