import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "data", "scholar.json");
const ENV_FILE = path.join(ROOT, ".env");

async function loadDotEnv() {
  try {
    const text = await fs.readFile(ENV_FILE, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && !process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env is optional when variables are already present in the environment.
  }
}

await loadDotEnv();

const SCHOLAR_ID = process.env.SCHOLAR_ID || "r0OoVlQAAAAJ";
const API_KEY = process.env.SERPAPI_KEY;

if (!API_KEY) {
  console.error("Missing SERPAPI_KEY.");
  console.error("Create a .env file in the project root with:");
  console.error("SERPAPI_KEY=YOUR_SERPAPI_KEY");
  process.exit(1);
}

const baseUrl = new URL("https://serpapi.com/search.json");
baseUrl.searchParams.set("engine", "google_scholar_author");
baseUrl.searchParams.set("author_id", SCHOLAR_ID);
baseUrl.searchParams.set("hl", "en");
baseUrl.searchParams.set("num", "100");
baseUrl.searchParams.set("api_key", API_KEY);

async function fetchJson(target) {
  const response = await fetch(target, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Academic Website Synchronizer)"
    }
  });

  const body = await response.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(`Invalid JSON response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  if (data.error) throw new Error(data.error);
  return data;
}

function firstMetric(table, keys) {
  for (const row of table || []) {
    for (const key of keys) {
      if (row?.[key]?.all != null) return Number(row[key].all);
    }
  }
  return null;
}

function normalizePublication(item) {
  const publication = String(item.publication || "");
  const yearMatch = publication.match(/\b(19|20)\d{2}\b/);

  return {
    citation_id: item.citation_id || null,
    title: item.title || "",
    authors: item.authors || "",
    publication,
    year: item.year ? Number(item.year) : (yearMatch ? Number(yearMatch[0]) : null),
    citations: item.cited_by?.value ?? 0,
    url: item.link || null,
    cited_by_url: item.cited_by?.link || null
  };
}

try {
  const first = await fetchJson(baseUrl);
  const articles = [];
  let page = first;
  let pageCount = 0;
  const seenPages = new Set();

  while (page) {
    pageCount += 1;
    if (pageCount > 100) throw new Error("Safety limit reached while paginating Google Scholar results.");

    for (const item of page.articles || []) articles.push(item);

    const next = page.serpapi_pagination?.next;
    if (!next || seenPages.has(next)) break;
    seenPages.add(next);
    page = await fetchJson(next);
  }

  const unique = new Map();
  for (const item of articles) {
    const normalized = normalizePublication(item);
    const key = normalized.citation_id || normalized.title.trim().toLowerCase();
    if (key) unique.set(key, normalized);
  }

  const citedBy = first.cited_by || {};
  const table = citedBy.table || [];

  const result = {
    source: "Google Scholar",
    profile_url: `https://scholar.google.com/citations?user=${SCHOLAR_ID}&hl=en&oi=ao`,
    scholar_id: SCHOLAR_ID,
    last_sync: new Date().toISOString(),
    profile: {
      name: first.author?.name || "Abderrahim AIT WAKRIME",
      affiliation: first.author?.affiliations || "Faculty of Sciences, Mohammed V University in Rabat, Morocco",
      email: first.author?.email || null,
      interests: first.author?.interests || [],
      thumbnail: first.author?.thumbnail || null,
      citations: firstMetric(table, ["citations"]),
      hIndex: firstMetric(table, ["h_index", "indice_h"]),
      i10Index: firstMetric(table, ["i10_index", "indice_i10"]),
      citationsSince: firstMetric(table, ["citations", "citations_since_2016"])
    },
    citations_per_year: (citedBy.graph || []).map(item => ({
      year: Number(item.year),
      citations: Number(item.citations || 0)
    })),
    public_access: first.public_access || null,
    co_authors: first.co_authors || [],
    publications: [...unique.values()]
  };

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(`Google Scholar synchronization completed.`);
  console.log(`Publications retrieved: ${result.publications.length}`);
  console.log(`Citations: ${result.profile.citations ?? "N/A"}`);
  console.log(`h-index: ${result.profile.hIndex ?? "N/A"}`);
  console.log(`i10-index: ${result.profile.i10Index ?? "N/A"}`);
  console.log(`Updated: ${OUTPUT}`);
} catch (error) {
  console.error("Google Scholar synchronization failed:", error.message);
  process.exit(1);
}
