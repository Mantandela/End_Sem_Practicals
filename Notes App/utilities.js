export function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return (
        "note-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(16).slice(2)
    );
}

export function parseTags(input) {
    if (!input.trim()) return [];
    return input
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
}

export function formatDate(isoString) {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "Unknown";
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
}

export function loadNotesFromStorage(STORAGE_KEY) {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveNotesToStorage(STORAGE_KEY, notes) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {}
}
