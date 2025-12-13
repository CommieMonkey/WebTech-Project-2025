"use strict";

function byId(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: #${id}`);
    return el;
}

function euroRange(min, max) {
    return `€${min}–€${max}`;
}

// Basisprijzen per pakket (range)
const BASE = {
    starter: { min: 250, max: 400, pagesIncluded: 1 },
    business: { min: 450, max: 700, pagesIncluded: 5 },
    pro: { min: 750, max: 1100, pagesIncluded: 8 },
};

// Add-on ranges (min/max)
const ADDONS = {
    seo: { min: 50, max: 120, label: "Basis SEO-check" },
    deploy: { min: 50, max: 150, label: "Deploy + domein-koppeling" },
    api: { min: 75, max: 250, label: "Kleine API-integratie" },
    // form zit al in base, maar we laten het staan als feature
};

function calcEstimate(pkgKey, pages, features, deadlineKey) {
    const base = BASE[pkgKey];
    let min = base.min;
    let max = base.max;

    // Extra pagina’s boven pakket-inclusief
    const extraPages = Math.max(0, pages - base.pagesIncluded);

    // Extra pagina prijs (range)
    // licht afhankelijk van pakket (complexiteit)
    const pageMin = pkgKey === "starter" ? 75 : 90;
    const pageMax = pkgKey === "pro" ? 150 : 130;

    min += extraPages * pageMin;
    max += extraPages * pageMax;

    // Add-ons
    const addonsUsed = [];
    for (const k of ["seo", "deploy", "api"]) {
        if (features.includes(k)) {
            min += ADDONS[k].min;
            max += ADDONS[k].max;
            addonsUsed.push(ADDONS[k].label);
        }
    }

    // Deadline factor (sneller = iets hoger)
    // (blijft netjes en realistisch)
    let deadlineNote = "Normale planning.";
    if (deadlineKey === "1w") {
        min = Math.round(min * 1.15);
        max = Math.round(max * 1.25);
        deadlineNote = "Snelle deadline: extra planning/urgentie.";
    } else if (deadlineKey === "2w") {
        min = Math.round(min * 1.05);
        max = Math.round(max * 1.10);
        deadlineNote = "Korte deadline: beperkte extra marge.";
    }

    return { min, max, extraPages, addonsUsed, deadlineNote };
}

function buildMailto(summaryText) {
    const subject = encodeURIComponent("Website aanvraag – intake samenvatting");
    const body = encodeURIComponent(summaryText);
    return `mailto:?subject=${subject}&body=${body}`;
}

document.addEventListener("DOMContentLoaded", () => {
    // Alleen activeren als intake bestaat op deze pagina
    const form = document.getElementById("intakeForm");
    if (!form) return;

    const type = byId("intakeType");
    const pages = byId("intakePages");
    const deadline = byId("intakeDeadline");
    const notes = byId("intakeNotes");

    const calcBtn = byId("intakeCalc");
    const mailBtn = byId("intakeMail");

    const summaryEl = byId("intakeSummary");
    const priceEl = byId("intakePrice");
    const priceNoteEl = byId("intakePriceNote");

    calcBtn.addEventListener("click", () => {
        const pkgKey = type.value;
        const pagesVal = Number(pages.value);

        if (!pkgKey || Number.isNaN(pagesVal)) {
            summaryEl.textContent = "Kies eerst een pakket en aantal pagina’s.";
            priceEl.textContent = "—";
            return;
        }

        const features = [];
        if (byId("featForm").checked) features.push("form");
        if (byId("featSeo").checked) features.push("seo");
        if (byId("featDeploy").checked) features.push("deploy");
        if (byId("featApi").checked) features.push("api");

        const deadlineKey = deadline.value;

        const est = calcEstimate(pkgKey, pagesVal, features, deadlineKey);

        const pkgLabel =
            pkgKey === "starter" ? "Starter (one-page)" :
                pkgKey === "business" ? "Business (3–5 pagina’s)" :
                    "Pro (5–8 pagina’s)";

        const featLabels = features
            .filter(f => f !== "form")
            .map(f => ADDONS[f]?.label)
            .filter(Boolean);

        const summaryLines = [
            `Pakket: ${pkgLabel}`,
            `Pagina’s (schatting): ${pagesVal} (extra pagina’s: ${est.extraPages})`,
            `Contactformulier: ${features.includes("form") ? "ja" : "nee"}`,
            `Extra’s: ${featLabels.length ? featLabels.join(", ") : "geen"}`,
            `Deadline: ${deadline.options[deadline.selectedIndex].text}`,
            notes.value.trim() ? `Extra info: ${notes.value.trim()}` : null,
            "",
            `Prijsindicatie: ${euroRange(est.min, est.max)}`,
            `Opmerking: ${est.deadlineNote}`,
        ].filter(Boolean);

        const summaryText = summaryLines.join("\n");

        summaryEl.innerHTML = `
      <ul class="mb-0">
        <li><strong>Pakket:</strong> ${pkgLabel}</li>
        <li><strong>Pagina’s:</strong> ${pagesVal} (extra: ${est.extraPages})</li>
        <li><strong>Contactformulier:</strong> ${features.includes("form") ? "ja" : "nee"}</li>
        <li><strong>Extra’s:</strong> ${featLabels.length ? featLabels.join(", ") : "geen"}</li>
        <li><strong>Deadline:</strong> ${deadline.options[deadline.selectedIndex].text}</li>
      </ul>
      ${notes.value.trim() ? `<div class="mt-2"><strong>Extra info:</strong><br>${notes.value.trim()}</div>` : ""}
    `;

        priceEl.textContent = euroRange(est.min, est.max);
        priceNoteEl.textContent = est.deadlineNote;

        // Mail knop activeren: gebruiker kan dit sturen naar zichzelf of naar jou
        mailBtn.classList.remove("disabled");
        mailBtn.setAttribute("href", buildMailto(summaryText));
    });
});
