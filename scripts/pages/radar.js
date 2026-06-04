// top-stories.js - radar delle top stories

import { renderStoryCards } from "../components/story-card.js";
import { showEmpty, showError, showLoading } from "../core/errors.js";
import { mountFooter } from "../core/footer.js";
import { mountHeader } from "../core/header.js";
import { getTopStoriesDetailed } from "../services/api.js";
import { isReadLater, toggleReadLater } from "../services/storage.js";

const summaryContainer = document.querySelector("#top-summary");
const feedContainer = document.querySelector("#top-feed-root");
const feedSection = document.querySelector("#top-feed-section");
const limitSelect = document.querySelector("#top-limit-select");
const refreshButton = document.querySelector("#top-refresh-button");

function renderSummary(stories) {
    if (!summaryContainer) {
        return;
    }

    const totalScore = stories.reduce((sum, story) => sum + (story.score || 0), 0);
    const totalComments = stories.reduce((sum, story) => sum + (story.descendants || 0), 0);
    const hottest = [...stories].sort((left, right) => (right.score || 0) - (left.score || 0))[0];
    const mostDiscussed = [...stories].sort((left, right) => (right.descendants || 0) - (left.descendants || 0))[0];

    summaryContainer.innerHTML = `
        <div class="stat-card">
            <span class="stat-label">Story nel feed</span>
            <strong class="stat-value">${stories.length}</strong>
            <p class="stat-note">Volume selezionato dal radar.</p>
        </div>
        <div class="stat-card">
            <span class="stat-label">Score totale</span>
            <strong class="stat-value">${totalScore}</strong>
            <p class="stat-note">Concentrazione del feed.</p>
        </div>
        <div class="stat-card">
            <span class="stat-label">Commenti totali</span>
            <strong class="stat-value">${totalComments}</strong>
            <p class="stat-note">Indice della conversazione.</p>
        </div>
        <div class="stat-card">
            <span class="stat-label">Più calda</span>
            <strong class="stat-value">${hottest ? hottest.score : 0}</strong>
            <p class="stat-note">${hottest ? hottest.title : "N/D"}</p>
        </div>
        <div class="stat-card">
            <span class="stat-label">Più discussa</span>
            <strong class="stat-value">${mostDiscussed ? mostDiscussed.descendants : 0}</strong>
            <p class="stat-note">${mostDiscussed ? mostDiscussed.title : "N/D"}</p>
        </div>
    `;
}

function updateArchiveButton(story, button) {
    const isSaved = toggleReadLater(story.id);

    if (button) {
        button.textContent = isSaved ? "Salvata" : "Salva";
        button.classList.toggle("is-saved",isSaved );
    }
}

function attachListNavigation() {
    feedContainer?.querySelectorAll(".story-card").forEach((card) => {
        const href = card.dataset.threadHref;

        if (!href) {
            return;
        }

        card.tabIndex = 0;
        card.setAttribute("role", "link");

        const navigate = () => {
            window.location.href = href;
        };

        card.addEventListener("click", (event) => {
            if (event.target.closest("a, button")) {
                return;
            }

            navigate();
        });

        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate();
            }
        });
    });
}

async function loadTopStories() {
    const total = Number(limitSelect?.value) || 24;

    showLoading(summaryContainer, "Compongo il radar...");
    showLoading(feedContainer, "Carico la galleria...");

    try {
        const stories = await getTopStoriesDetailed({ total, batchSize: 12 });

        if (!stories.length) {
            showEmpty(summaryContainer, "Nessuna story disponibile al momento.");
            showEmpty(feedContainer, "Nessuna story disponibile al momento.");
            return;
        }

        renderSummary(stories);
        renderStoryCards({
            container: feedContainer,
            stories,
            showActions: true,
            showThreadButton: false,
            feedVariant: "list",
            isSaved: (story) => isReadLater(story.id),
            onToggleSave: updateArchiveButton,
        });
        attachListNavigation();
    } catch (error) {
        showError(summaryContainer, "Errore", error.message || "Impossibile caricare il radar.");
        showError(feedContainer, "Errore", error.message || "Impossibile caricare il radar.");
    }
}

function init() {
    mountHeader("radar");
    mountFooter();

    refreshButton?.addEventListener("click", loadTopStories);
    limitSelect?.addEventListener("change", loadTopStories);

    loadTopStories();
}

init();
