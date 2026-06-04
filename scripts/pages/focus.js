// thread.js - focus story e commenti

import { createStoryCard } from "../components/story-card.js";
import { renderCommentsTree } from "../components/thread-comments.js";
import { showEmpty, showError, showLoading, stripHtml } from "../core/errors.js";
import { mountFooter } from "../core/footer.js";
import { mountHeader } from "../core/header.js";
import { getItemById, getCommentChildren } from "../services/api.js";
import { isReadLater, toggleReadLater } from "../services/storage.js";

const threadInput = document.querySelector("#thread-id-input");
const loadThreadButton = document.querySelector("#load-thread-button");
const threadSummary = document.querySelector("#thread-summary");
const threadRoot = document.querySelector("#thread-root");

function updateSavedButton(story, button) {
    const isSaved = toggleReadLater(story.id);
    console.log("non funziona")

    if (button) {
        button.textContent = isSaved ? "Salvata" : "Salva";
        button.classList.toggle("is-saved", isSaved);
    }
}

function renderThreadSummary(story) {
    if (!threadSummary) {
        return;
    }

    const storyCard = createStoryCard({
        story,
        showActions: true,
        showThreadButton: false,
        feedVariant: "focus",
        isSaved: isReadLater(story.id),
        onToggleSave: updateSavedButton,
    });

    const infoPanel = document.createElement("aside");
    infoPanel.className = "thread-panel";

    const source = story.url
        ? `<a href="${encodeURI(story.url)}" target="_blank" rel="noreferrer">Apri fonte</a>`
        : "Origine non disponibile";

    infoPanel.innerHTML = `
        <h4>Dettagli rapidi</h4>
        <p><strong>Autore:</strong> ${story.by || "anon"}</p>
        <p><strong>Score:</strong> ${story.score}</p>
        <p><strong>Commenti:</strong> ${story.descendants}</p>
        <p><strong>Data:</strong> ${story.timeLabel}</p>
        <p><strong>Fonte:</strong> ${source}</p>
    `;

    threadSummary.innerHTML = "";
    threadSummary.appendChild(storyCard);
    threadSummary.appendChild(infoPanel);
}

function renderThreadDiscussion(story) {
    if (!threadRoot) {
        return;
    }

    threadRoot.innerHTML = `<div id="thread-comments-root"></div>`;
    const commentsContainer = threadRoot.querySelector("#thread-comments-root");

    if (!commentsContainer) {
        return;
    }

    if (!Array.isArray(story.kids) || story.kids.length === 0) {
        showEmpty(commentsContainer, "Nessun commento disponibile per questa story.");
        return;
    }

    commentsContainer.className = "thread-container";
}

async function loadThread() {
    const storyId = threadInput?.value.trim();

    if (!storyId) {
        showError(threadRoot, "Input mancante", "Inserisci uno story ID valido.");
        return;
    }

    showLoading(threadSummary, "Carico il focus...");
    showLoading(threadRoot, "Carico la discussione...");

    try {
        const story = await getItemById(storyId);

        if (!story || story.type !== "story") {
            showError(threadRoot, "Tipo non valido", "L'ID indicato non corrisponde a una story.");
            showEmpty(threadSummary, "Inserisci un altro ID per leggere un thread.");
            return;
        }

        renderThreadSummary(story);
        renderThreadDiscussion(story);

        const commentsContainer = threadRoot.querySelector("#thread-comments-root");
        if (!commentsContainer) {
            return;
        }

        if (!Array.isArray(story.kids) || story.kids.length === 0) {
            showEmpty(commentsContainer, "Nessun commento disponibile per questa story.");
            return;
        }

        const firstLevelComments = await getCommentChildren(story);

        if (!Array.isArray(firstLevelComments) || firstLevelComments.length === 0) {
            showEmpty(commentsContainer, "Nessun commento recuperabile per questa story.");
            return;
        }

        renderCommentsTree(commentsContainer, firstLevelComments, 0);
    } catch (error) {
        showError(threadSummary, "Errore", error.message || "Impossibile caricare il focus.");
        showError(threadRoot, "Errore", error.message || "Impossibile caricare il focus.");
    }
}

function init() {
    mountHeader("focus");
    mountFooter();

    loadThreadButton?.addEventListener("click", loadThread);
    threadInput?.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            loadThread();
        }
    });

    const params = new URLSearchParams(window.location.search);
    const initialId = params.get("id");

    if (initialId) {
        threadInput.value = initialId;
        loadThread();
        return;
    }

    showEmpty(threadSummary, "Inserisci un ID per aprire il focus della story.");
    showEmpty(threadRoot, "La discussione apparirà qui dopo il caricamento.");
}

init();
