
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bibtexParse from "bibtex-parse-js";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const bibPath = path.join(rootDir, "publications.bib");
const outputPath = path.join(
  rootDir,
  "data",
  "additional-publications.json"
);

if (!fs.existsSync(bibPath)) {
  throw new Error("publications.bib introuvable.");
}

const bibContent = fs.readFileSync(bibPath, "utf8");
const parsed = bibtexParse.toJSON(bibContent);

function field(entry, name) {
  const value = entry[name];
  return value == null ? "" : String(value).trim().replace(/[{}]/g, "");
}

const publications = parsed.map((item) => {
  const entry = item.entryTags ?? {};

  return {
    id: item.citationKey || item.citationkey || "",
    type: item.entryType || item.entrytype || "article",
    title: field(entry, "title"),
    authors: field(entry, "author"),
    journal: field(entry, "journal"),
    booktitle: field(entry, "booktitle"),
    year: field(entry, "year"),
    volume: field(entry, "volume"),
    number: field(entry, "number"),
    pages: field(entry, "pages"),
    publisher: field(entry, "publisher"),
    doi: field(entry, "doi"),
    url: field(entry, "url")
  };
}).filter((publication) => publication.title);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  JSON.stringify(publications, null, 2) + "\n",
  "utf8"
);

console.log(
  `${publications.length} publication(s) générée(s) depuis publications.bib.`
);
