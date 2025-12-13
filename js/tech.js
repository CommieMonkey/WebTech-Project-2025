"use strict";

/* -------------------------
   Helpers
------------------------- */
function el(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Element #${id} not found`);
    return node;
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* -------------------------
   1) GitHub Projects
------------------------- */
async function loadGitHubRepos(username) {
    const status = el("ghStatus");
    const list = el("ghList");
    list.innerHTML = "";
    status.textContent = "Laden...";

    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=6`;
    const res = await fetch(url, { headers: { "Accept": "application/vnd.github+json" } });

    if (!res.ok) {
        status.textContent = `GitHub API error (${res.status})`;
        return;
    }

    const repos = await res.json();
    if (!Array.isArray(repos) || repos.length === 0) {
        status.textContent = "Geen repositories gevonden.";
        return;
    }

    status.textContent = "";
    for (const r of repos) {
        const name = escapeHtml(r.name || "repo");
        const desc = escapeHtml(r.description || "Geen beschrijving.");
        const stars = Number(r.stargazers_count || 0);
        const lang = escapeHtml(r.language || "—");
        const href = r.html_url;

        const li = document.createElement("li");
        li.className = "mb-2";

        li.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <a href="${href}" target="_blank" rel="noopener" class="fw-semibold">${name}</a>
          <div class="text-muted small">${desc}</div>
          <div class="text-muted small">Language: ${lang}</div>
        </div>
        <span class="badge text-bg-secondary">${stars} ★</span>
      </div>
    `;

        list.appendChild(li);
    }
}

/* -------------------------
   2) Cybersecurity News (Hacker News Algolia API)
------------------------- */
async function loadNews(topic) {
    const status = el("newsStatus");
    const list = el("newsList");
    list.innerHTML = "";
    status.textContent = "Laden...";

    // Publieke endpoint, geen key nodig
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=7`;
    const res = await fetch(url);

    if (!res.ok) {
        status.textContent = `News API error (${res.status})`;
        return;
    }

    const data = await res.json();
    const hits = Array.isArray(data.hits) ? data.hits : [];

    if (hits.length === 0) {
        status.textContent = "Geen nieuws gevonden.";
        return;
    }

    status.textContent = "";
    for (const h of hits) {
        const title = escapeHtml(h.title || "Untitled");
        const link = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
        const points = Number(h.points || 0);
        const author = escapeHtml(h.author || "—");

        const li = document.createElement("li");
        li.className = "mb-2";
        li.innerHTML = `
      <a href="${link}" target="_blank" rel="noopener" class="fw-semibold">${title}</a>
      <div class="text-muted small">by ${author} · ${points} points</div>
    `;
        list.appendChild(li);
    }
}

/* -------------------------
   3) Network Tools API (Netlify Functions)
------------------------- */
function normalizeHost(input) {
    const host = String(input || "").trim();
    // simpele, strikte validatie (domein/host)
    // laat letters, cijfers, punt en streep toe
    if (!host || host.length > 253) return null;
    if (!/^[a-zA-Z0-9.-]+$/.test(host)) return null;
    if (host.startsWith(".") || host.endsWith(".")) return null;
    return host;
}

async function dnsLookup(host) {
    const status = el("netStatus");
    const out = el("netOutput");
    out.textContent = "";
    status.textContent = "DNS lookup...";

    const res = await fetch(`/.netlify/functions/dns?host=${encodeURIComponent(host)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        status.textContent = "Fout bij DNS lookup.";
        out.textContent = JSON.stringify(data, null, 2);
        return;
    }

    status.textContent = "OK";
    out.textContent = JSON.stringify(data, null, 2);
}

async function tlsCheck(host) {
    const status = el("netStatus");
    const out = el("netOutput");
    out.textContent = "";
    status.textContent = "TLS check...";

    const res = await fetch(`/.netlify/functions/tls?host=${encodeURIComponent(host)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        status.textContent = "Fout bij TLS check.";
        out.textContent = JSON.stringify(data, null, 2);
        return;
    }

    status.textContent = "OK";
    out.textContent = JSON.stringify(data, null, 2);
}

/* -------------------------
   Wire up UI
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    // GitHub
    el("ghLoad").addEventListener("click", () => {
        const u = el("ghUser").value.trim();
        if (!u) return;
        loadGitHubRepos(u);
    });

    // News
    el("newsLoad").addEventListener("click", () => {
        const topic = el("newsTopic").value;
        loadNews(topic);
    });

    // Network tools
    el("dnsBtn").addEventListener("click", () => {
        const host = normalizeHost(el("hostInput").value);
        if (!host) {
            el("netStatus").textContent = "Geef een geldig domein/host in (letters/cijfers/punt/streep).";
            return;
        }
        dnsLookup(host);
    });

    el("tlsBtn").addEventListener("click", () => {
        const host = normalizeHost(el("hostInput").value);
        if (!host) {
            el("netStatus").textContent = "Geef een geldig domein/host in (letters/cijfers/punt/streep).";
            return;
        }
        tlsCheck(host);
    });

    // Start met iets leuks ingevuld
    loadNews("cybersecurity");
});
