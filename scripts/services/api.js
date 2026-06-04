// api.js - accesso alla Hacker News API

const API_BASE = "https://hacker-news.firebaseio.com/v0";

/**
 * Converte un timestamp UNIX in una stringa localizzata.
 *
 * @param {number} timestampSeconds - Timestamp in secondi
 * @returns {string}
 */
function formatUnixDate(timestampSeconds) {
    if (!Number.isFinite(timestampSeconds) || timestampSeconds <= 0) {
        return "N/D";
    }

    return new Date(timestampSeconds * 1000).toLocaleString("it-IT");
}

/**
 * Normalizza un item della API in una forma coerente per l'interfaccia.
 *
 * @param {object} item - Dato raw della API
 * @returns {object|null}
 */
function mapItem(item) {
    if (!item) {
        return null;
    }

    return {
        id: item.id,
        type: item.type || "unknown",
        by: item.by || "anon",
        title: item.title || "",
        text: item.text || "",
        url: item.url || "",
        score: Number(item.score) || 0,
        descendants: Number(item.descendants) || 0,
        kids: Array.isArray(item.kids) ? item.kids : [],
        parent: item.parent || null,
        time: Number(item.time) || 0,
        timeLabel: formatUnixDate(Number(item.time) || 0),
    };
}

/**
 * Esegue una fetch JSON con controllo dello status HTTP.
 *
 * @param {string} url - URL da richiamare
 * @param {string} errorPrefix - Prefisso del messaggio d'errore
 * @returns {Promise<any>}
 */
async function requestJson(url, errorPrefix) {
    // TODO 1: Implementare la fetch e restituire il JSON parsato
    try{
        // Il parametro url contiene un già un endpoint completo e bisogna solo fare la chiamata
const response = await fetch (url)
// Poi in caso di errore rella risposta, mandare un messaggio di errore che contenga il prefisso errorPrefix e l'eventuale messaggio di errore restituito dalla fetch
if(!response.ok){
    throw new Error(`${errorPrefix}: errore di richiamo della fetch`)
}
// Infine restituisci i dati parsati come oggetto, senza manipolarli o trasformarli
const dati= await response.json()
console.log("ciao")
    }
    catch(error){
console.error(error)
    }
    // Controlla sempre anche errori di rete o altri errori imprevisti con un catch e restituisci un messaggio di errore coerente con il prefisso
}

/**
 * Recupera gli ID delle top stories.
 *
 * @returns {Promise<Array<number>>}
 */
export async function getTopStoryIds() {
    const data = await requestJson(`${API_BASE}/topstories.json`, "Errore recupero top stories");

    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0);
}

/**
 * Recupera un item per ID e lo normalizza.
 *
 * @param {number|string} id - ID dell'item
 * @returns {Promise<object>}
 */
export async function getItemById(id) {
    const itemId = Number(id);

    if (!Number.isFinite(itemId) || itemId <= 0) {
        throw new Error("ID item non valido");
    }

    const data = await requestJson(`${API_BASE}/item/${itemId}.json`, "Errore recupero item");
    return mapItem(data);
}

/**
 * Recupera più item in parallelo.
 *
 * @param {Array<number|string>} ids - Array di ID
 * @returns {Promise<Array<object>>}
 */
export async function getItemsByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
        return [];
    }

    const settled = await Promise.allSettled(ids.map((id) => getItemById(id)));

    return settled
        .filter((result) => result.status === "fulfilled" && result.value)
        .map((result) => result.value);
}

/**
 * Recupera le top stories dettagliate con batching.
 *
 * @param {object} options - Opzioni di caricamento
 * @param {number} [options.total=30] - Numero massimo di story
 * @param {number} [options.batchSize=15] - Dimensione batch
 * @returns {Promise<Array<object>>}
 */
export async function getTopStoriesDetailed({
    total = 30,
    batchSize = 15,
} = {}) {
    const ids = await getTopStoryIds();
    const selected = ids.slice(0, total);
    const stories = [];

    for (let index = 0; index < selected.length; index += batchSize) {
        const batchIds = selected.slice(index, index + batchSize);
        const batchItems = await getItemsByIds(batchIds);

        batchItems
            .filter((item) => item && item.type === "story")
            .forEach((item) => {
                stories.push(item);
            });
    }

    return stories;
}

/**
 * Recupera i dati di un utente.
 *
 * @param {string} userId - Username Hacker News
 * @returns {Promise<object>}
 */
export async function getUserById(userId) {
    const id = String(userId || "").trim();

    if (!id) {
        throw new Error("Username non valido");
    }

    const data = await requestJson(`${API_BASE}/user/${encodeURIComponent(id)}.json`, "Errore recupero utente");

    if (!data) {
        throw new Error("Utente non trovato");
    }

    return {
        id: data.id,
        karma: Number(data.karma) || 0,
        about: data.about || "",
        created: Number(data.created) || 0,
        createdLabel: formatUnixDate(Number(data.created) || 0),
        submitted: Array.isArray(data.submitted) ? data.submitted : [],
    };
}

/**
 * Recupera l'utente e i suoi ultimi item inviati.
 *
 * @param {string} userId - Username Hacker News
 * @param {number} [limit=20] - Numero massimo di item
 * @returns {Promise<{user: object, items: Array<object>}>}
 */
export async function getUserSubmittedItems(userId, limit = 20) {
    const user = await getUserById(userId);
    const ids = user.submitted.slice(0, limit);
    const items = [];

    const settled = await Promise.allSettled(ids.map((id) => getItemById(id)));

    settled.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
            items.push(result.value);
        }
    });

    return {
        user,
        items,
    };
}

/**
 * Recupera i figli di un commento.
 *
 * @param {object} comment - Commento con kids
 * @returns {Promise<Array<object>>}
 */
export async function getCommentChildren(comment) {
    if (!comment || !Array.isArray(comment.kids) || comment.kids.length === 0) {
        return [];
    }

    return getItemsByIds(comment.kids);
}
