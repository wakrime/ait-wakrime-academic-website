# Dr. Abderrahim Ait Wakrime — Academic Website

Static academic website prepared from the professor's supplied **Academic Website Content** PDF.

## Language
The public website is in English.

## Google Scholar automatic synchronization

Google Scholar profile:
- Scholar ID: `r0OoVlQAAAAJ`
- Profile: https://scholar.google.com/citations?user=r0OoVlQAAAAJ&hl=en&oi=ao

The browser does **not** scrape Google Scholar directly. Instead, a server-side/local synchronization script retrieves the complete author article list and profile metrics through a Google Scholar data provider (SerpApi), then writes the result to:

`data/scholar.json`

The website reads that JSON automatically. Therefore `recherche.html` does not contain hard-coded publications.

### First local setup

1. Install Node.js 20+.
2. Open a terminal in the project root.
3. Copy `.env.example` to `.env`.
4. Put your private SerpApi key in `.env`:

```text
SERPAPI_KEY=YOUR_SERPAPI_KEY
SCHOLAR_ID=r0OoVlQAAAAJ
```

5. Run:

```text
npm run sync-scholar
```

Or on Windows, double-click:

`scripts/sync-scholar.bat`

After a successful synchronization, refresh `recherche.html` in Live Server. The publication list and Scholar metrics will be populated from `data/scholar.json`.

### Complete publication retrieval

The synchronizer requests up to 100 articles per page and follows the provider's `serpapi_pagination.next` URL until no next page remains. Publications are de-duplicated by Google Scholar citation ID.

It also stores:
- profile name and affiliation;
- verified email when available;
- research interests;
- profile photo URL when available;
- total citations;
- h-index;
- i10-index;
- yearly citation graph;
- public-access information;
- co-authors;
- every retrieved publication with title, authors, venue/publication string, year, citation count and Scholar link.

### Automatic recurring synchronization

For local Windows development, use Windows Task Scheduler to run:

```text
scripts\\sync-scholar.bat
```

for example once per day. The website will then read the updated JSON automatically after the next page refresh.

For final deployment to a static host, the synchronization job must run on a server/CI scheduler. GitHub Actions can be added later when the site is ready for GitHub; it is intentionally not required for the current local phase.

## Security

**Never put `SERPAPI_KEY` in frontend JavaScript, HTML, or `data/scholar.json`.** Keep it in `.env` locally and in a secret/secure environment variable in production.

`.env` should never be committed to Git.

## Photo

The Home page contains a placeholder until the professor provides the official photo.
