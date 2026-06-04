// story-card.js - card news riusabile

import { sanitizeHTML } from "../core/errors.js";

function getHostname(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch (_error) {
        return "";
    }
}

/**
 * Crea una card DOM per una story.
 *
 * @param {object} options - Opzioni di rendering
 * @param {object} options.story - Story normalizzata
 * @param {boolean} [options.showActions=false] - Mostra azioni
 * @param {boolean} [options.showThreadButton=true] - Mostra pulsante thread
 * @param {string} [options.feedVariant="default"] - Variante visiva
 * @param {boolean} [options.isSaved=false] - Indica se salvata
 * @param {Function} [options.onToggleSave] - Callback toggle archivio
 * @returns {HTMLElement}
 */
export function createStoryCard({
    story,
    showActions = false,
    showThreadButton = true,
    feedVariant = "default",
    isSaved = false,
    onToggleSave,
}) {
    const card = document.createElement("article");
    card.className = "story-card";
    card.dataset.threadHref = `focus.html?id=${encodeURIComponent(story.id)}`;

    if (feedVariant !== "default") {
        card.classList.add(`story-card--${feedVariant}`);
    }

    if (feedVariant === "list") {
        card.classList.add("story-card--interactive-list");
    }

    const title = sanitizeHTML(story.title || "Senza titolo");
    const author = sanitizeHTML(story.by || "anon");
    const threadHref = `focus.html?id=${encodeURIComponent(story.id)}`;
    const scoreLabel = sanitizeHTML(`${story.score} punti`);
    const commentsLabel = sanitizeHTML(`${story.descendants} commenti`);
    const timeLabel = sanitizeHTML(story.timeLabel || "N/D");
    const domain = story.url ? getHostname(story.url) : "";
    const sourceLink = story.url
        ? `<a class="story-source-link" href="${sanitizeHTML(story.url)}" target="_blank" rel="noreferrer">Apri fonte${domain ? ` · ${sanitizeHTML(domain)}` : ""}</a>`
        : `<span class="story-source-link story-source-link--disabled">Origine non disponibile</span>`;
    const authorLink = author !== "anon"
        ? `<a href="profile.html?user=${encodeURIComponent(story.by)}">${author}</a>`
        : author;
    const excerpt = sanitizeHTML((story.text || domain || "Story in evidenza").replace(/\s+/g, " ").trim().slice(0, 160));

    const actions = showActions
        ? `
            <div class="story-actions">
                ${showThreadButton ? `<a class="btn btn-secondary btn-thread" href="${threadHref}">Apri focus</a>` : ""}
                <button type="button" class="btn btn-secondary btn-save${isSaved ? " is-saved" : ""}" aria-label="${isSaved ? "Rimuovi dall'archivio" : "Salva nell'archivio"}">${isSaved ? "Salvata" : "Salva"}</button>
            </div>
        `
        : (showThreadButton ? `<a class="btn btn-secondary btn-thread" href="${threadHref}">Apri focus</a>` : "");


    // TODO 1: Completare la card con i dati mancanti che vengonbo costruiti qui sopra.
    // Nel h3 story-card__title manca il 'title' della storia che deve essere un link che contiene il valore di 'threadHref'.
    // Mancano tutti i meta dati nel div story-card__meta, ognuno dovrà esser contenutno in uno span con classe chip e una classe specifica
    // per il tipo di dato (es. scoreLabel -> chip--score, commentsLabel -> chip--comments, timeLabel -> chip--time, authorLink -> chip--author).
    // Infine manca il link alla fonte (sourceLink) da inserire dentro il div story-card__footer, prima del footnote con l'ID della storia.
    card.innerHTML = `
    <div class="story-card__top">
    <div class="story-card__heading">
    <p class="story-card__eyebrow">#${sanitizeHTML(story.id)}</p>
    <h3 class="story-card__title"><a href="${threadHref}">${title}</a></h3>
    </div>
            ${actions}
        </div>

        <div class="story-card__meta">

        </div>

        <p class="story-card__excerpt">${excerpt}</p>
        <div class="story-card__footer">

            <span class="story-card__footnote">ID ${sanitizeHTML(story.id)}</span>
        </div>
    `;

    if (showActions && typeof onToggleSave === "function") {
        const button = card.querySelector(".btn-save");
        button?.addEventListener("click", () => {
            onToggleSave(story, button);
        });
    }

    return card;
}

/**
 * Renderizza un elenco di story come card.
 *
 * @param {object} options - Opzioni di rendering
 * @param {HTMLElement} options.container - Container DOM
 * @param {Array<object>} options.stories - Story da renderizzare
 * @param {boolean} [options.showActions=false] - Mostra azioni
 * @param {boolean} [options.showThreadButton=true] - Mostra pulsante focus
 * @param {string} [options.feedVariant="default"] - Variante visiva
 * @param {Function} [options.isSaved] - Funzione di check archivio
 * @param {Function} [options.onToggleSave] - Callback toggle archivio
 * @returns {void}
 */
export function renderStoryCards({
    container,
    stories,
    showActions = false,
    showThreadButton = true,
    feedVariant = "default",
    isSaved,
    onToggleSave,
}) {
    if (!container) {
        return;
    }

    container.innerHTML = "";

    stories.forEach((story) => {
        const card = createStoryCard({
            story,
            showActions,
            showThreadButton,
            feedVariant,
            isSaved: typeof isSaved === "function" ? isSaved(story) : false,
            onToggleSave,
        });

        container.appendChild(card);
    });
}
