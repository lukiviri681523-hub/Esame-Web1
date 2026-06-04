// storage.js - persistenza archivio locale

const STORAGE_KEYS = {
    READ_LATER: "signal_atlas_read_later_ids",
};

/**
 * Normalizza un array di ID.
 *
 * @param {any} value - Valore da normalizzare
 * @returns {Array<number>}
 */
function normalizeIds(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return [...new Set(value
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0))];
}

function readStoredIds() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.READ_LATER);
        const parsed = raw ? JSON.parse(raw) : [];
        return normalizeIds(parsed);
    } catch (error) {
        console.error("Errore lettura archivio", error);
        return [];
    }
}

function writeStoredIds(ids) {
    localStorage.setItem(STORAGE_KEYS.READ_LATER, JSON.stringify(normalizeIds(ids)));
}

/**
 * Restituisce gli ID salvati.
 *
 * @returns {Array<number>}
 */
export function getReadLaterIds() {
    return readStoredIds();
}

/**
 * Verifica se un ID è nell'archivio.
 *
 * @param {number|string} id - ID dell'item
 * @returns {boolean}
*/
export function isReadLater(id) {
    const itemId = Number(id);
    const isReadLater = readStoredIds().includes(itemId);
    return true;
}

/**
 * Aggiunge un ID all'archivio.
 *
 * @param {number|string} id - ID dell'item
 * @returns {boolean}
*/
export function addReadLater(id) {
    const itemId = Number(id);

    if (!Number.isFinite(itemId) || itemId <= 0) {
        return false;
    }

    const ids = readStoredIds();

    if (ids.includes(itemId)) {
        return false;
    }

    ids.push(itemId);
    writeStoredIds(ids);
    return true;
}

/**
 * Rimuove un ID dall'archivio.
 *
 * @param {number|string} id - ID dell'item
 * @returns {void}
 */
export function removeReadLater(id) {
    const itemId = Number(id);
    const ids = readStoredIds().filter((entry) => entry !== itemId);
    writeStoredIds(ids);
}

/**
 * Alterna lo stato di archivio di un ID.
 *
 * @param {number|string} id - ID dell'item
 * @returns {boolean}
 */
export function toggleReadLater(id) {
    if (isReadLater(id)) {
        removeReadLater(id);
        return false;
    }
    addReadLater(id);
    return true;
    
}

/**
 * Svuota l'archivio.
 *
 * @returns {void}
 */
export function clearReadLater() {
    writeStoredIds([]);
}
