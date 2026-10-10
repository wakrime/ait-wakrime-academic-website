const SCHOLAR_DATA_URL = "data/scholar.json";
let allPublications = [];

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[ch]));

function renderPublications() {
  const list = document.getElementById("publications-list");
  const search = document.getElementById("publication-search")?.value.trim().toLowerCase() || "";
  const year = document.getElementById("publication-year")?.value || "all";
  if (!list) return;

  const filtered = allPublications.filter(p => {
    const haystack = [
      p.title, p.authors, p.venue, p.year, p.type
    ].join(" ").toLowerCase();
    return (!search || haystack.includes(search)) &&
           (year === "all" || String(p.year) === year);
  });

  const count = document.getElementById("publication-count");
  if (count) count.textContent = `${filtered.length} publication${filtered.length !== 1 ? "s" : ""}`;

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No publications match the selected criteria.</div>`;
    return;
  }

  list.innerHTML = filtered.map(p => `
    <article class="publication-card">
      <div class="publication-meta">
        <span class="publication-year">${esc(p.year || "â€”")}</span>
</div>
      <h3 class="publication-title">${esc(p.title)}</h3>
      ${p.authors ? `<p class="publication-authors">${esc(p.authors)}</p>` : ""}
      ${p.venue ? `<p class="publication-venue">${esc(p.venue)}</p>` : ""}
      ${p.url ? `<a class="pub-link" href="${esc(p.url)}" target="_blank" rel="noopener">View publication ➔</a>` : ""}
    </article>
  `).join("");
}

function populateYears() {
  const select = document.getElementById("publication-year");
  if (!select) return;
  [...new Set(allPublications.map(p => p.year).filter(Boolean))]
    .sort((a,b) => Number(b)-Number(a))
    .forEach(year => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      select.appendChild(option);
    });
}

async function loadScholarData() {
  const list = document.getElementById("publications-list");
  try {
    const response = await fetch(`${SCHOLAR_DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allPublications = Array.isArray(data.publications) ? data.publications : [];
    populateYears();
    renderPublications();

    const stats = data.profile || {};
    const statMap = {
      "scholar-citations": stats.citations,
      "scholar-hindex": stats.hIndex,
      "scholar-i10": stats.i10Index
    };
    Object.entries(statMap).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && value != null) el.textContent = value;
    });
  } catch (error) {
    console.error("Scholar data loading error:", error);
    if (list) list.innerHTML = `
      <div class="empty-state">
        <strong>Publications could not be loaded.</strong><br>
        Check that the site is opened through a local web server (for example Live Server), not directly with file://.
      </div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("publication-search")?.addEventListener("input", renderPublications);
  document.getElementById("publication-year")?.addEventListener("change", renderPublications);
  loadScholarData();
});

