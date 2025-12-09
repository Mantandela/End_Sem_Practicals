import {
    generateId,
    parseTags,
    formatDate,
    pluralize,
    loadNotesFromStorage,
    saveNotesToStorage
} from "./utilities.js";

const STORAGE_KEY = "ist4035-notes-app-v1";
let notes = [];

// UI
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const tagsInput = document.getElementById("tagsInput");
const priorityInput = document.getElementById("priorityInput");

const clearFormBtn = document.getElementById("clearFormBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");

const editorTitle = document.getElementById("editorTitle");
const editorStatus = document.getElementById("editorStatus");

const searchInput = document.getElementById("searchInput");
const filterPriority = document.getElementById("filterPriority");

const notesList = document.getElementById("notesList");
const notesCount = document.getElementById("notesCount");

let currentSearchText = "";
let currentPriorityFilter = "all";
let currentEditingId = null;
let draggedNoteId = null;

// Rendering
function renderNotes() {
    const search = currentSearchText.toLowerCase();
    const filtered = notes.filter((note) => {
        if (currentPriorityFilter !== "all" && note.priority !== currentPriorityFilter) return false;

        const haystack = (note.title + " " + note.content + " " + note.tags.join(" ")).toLowerCase();
        return haystack.includes(search);
    });

    notesList.innerHTML = "";

    if (filtered.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No notes match the current filter.";
        empty.style.fontSize = "0.9rem";
        empty.style.color = "#6b7280";
        notesList.appendChild(empty);
    } else {
        filtered.forEach((note) => notesList.appendChild(createNoteCard(note)));
    }

    notesCount.textContent = `${filtered.length} ${pluralize(filtered.length, "note", "notes")}`;
}

function createNoteCard(note) {
    const card = document.createElement("article");
    card.className = "note-card";
    card.draggable = true;
    card.dataset.id = note.id;

    const header = document.createElement("div");
    header.className = "note-header";

    const title = document.createElement("div");
    title.className = "note-title";
    title.textContent = note.title;

    const meta = document.createElement("div");
    meta.className = "note-meta";

    const prioritySpan = document.createElement("span");
    prioritySpan.className = "priority-pill priority-" + (note.priority || "low");
    prioritySpan.textContent = `Priority: ${note.priority}`;

    const dateSpan = document.createElement("span");
    dateSpan.textContent = `Updated: ${formatDate(note.updatedAt)}`;

    meta.appendChild(prioritySpan);
    meta.appendChild(dateSpan);

    header.appendChild(title);
    header.appendChild(meta);

    const body = document.createElement("div");
    body.className = "note-body";

    const contentP = document.createElement("p");
    contentP.textContent = note.content;
    body.appendChild(contentP);

    if (note.tags.length > 0) {
        const tagsRow = document.createElement("div");
        tagsRow.className = "tags-row";
        note.tags.forEach((tag) => {
            const t = document.createElement("span");
            t.className = "tag-pill";
            t.textContent = tag;
            tagsRow.appendChild(t);
        });
        body.appendChild(tagsRow);
    }

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn";
    editBtn.textContent = "Edit";
    editBtn.dataset.action = "edit";
    editBtn.dataset.id = note.id;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.dataset.action = "delete";
    deleteBtn.dataset.id = note.id;

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);

    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragover", handleDragOver);
    card.addEventListener("drop", handleDrop);
    card.addEventListener("dragend", handleDragEnd);

    return card;
}

// Form helpers
function resetForm() {
    noteForm.reset();
    priorityInput.value = "medium";
    currentEditingId = null;
    editorTitle.textContent = "New Note";
    editorStatus.textContent = "Creating a new note.";
}

function loadNoteIntoForm(note) {
    titleInput.value = note.title;
    contentInput.value = note.content;
    tagsInput.value = note.tags.join(", ");
    priorityInput.value = note.priority;
    currentEditingId = note.id;

    editorTitle.textContent = "Edit Note";
    editorStatus.textContent = `Last updated ${formatDate(note.updatedAt)}`;
}

// Events
noteForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) return alert("Title and content are required.");

    const tags = parseTags(tagsInput.value);
    const priority = priorityInput.value;
    const now = new Date().toISOString();

    if (currentEditingId === null) {
        notes.unshift({
            id: generateId(),
            title,
            content,
            tags,
            priority,
            createdAt: now,
            updatedAt: now,
        });
    } else {
        const idx = notes.findIndex((n) => n.id === currentEditingId);
        if (idx !== -1) {
            notes[idx] = {
                ...notes[idx],
                title,
                content,
                tags,
                priority,
                updatedAt: now,
            };
        }
    }

    saveNotesToStorage(STORAGE_KEY, notes);
    renderNotes();
    resetForm();
});

clearFormBtn.addEventListener("click", resetForm);

deleteAllBtn.addEventListener("click", () => {
    if (!notes.length) return;
    if (!confirm("Delete ALL notes?")) return;
    notes = [];
    saveNotesToStorage(STORAGE_KEY, notes);
    renderNotes();
    resetForm();
});

notesList.addEventListener("click", (e) => {
    const btn = e.target;
    const id = btn.dataset?.id;
    const action = btn.dataset?.action;
    if (!id || !action) return;

    const note = notes.find((n) => n.id === id);
    if (!note) return;

    if (action === "edit") {
        loadNoteIntoForm(note);
    } else if (action === "delete") {
        if (!confirm("Delete this note?")) return;
        notes = notes.filter((n) => n.id !== id);
        saveNotesToStorage(STORAGE_KEY, notes);
        renderNotes();
        if (currentEditingId === id) resetForm();
    }
});

searchInput.addEventListener("input", () => {
    currentSearchText = searchInput.value;
    renderNotes();
});

filterPriority.addEventListener("change", () => {
    currentPriorityFilter = filterPriority.value;
    renderNotes();
});

// Drag + drop
function handleDragStart(e) {
    draggedNoteId = e.currentTarget.dataset.id;
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedNoteId);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
    e.preventDefault();
    const targetId = e.currentTarget.dataset.id;
    if (!draggedNoteId || draggedNoteId === targetId) return;

    const s = notes.findIndex((n) => n.id === draggedNoteId);
    const t = notes.findIndex((n) => n.id === targetId);
    if (s === -1 || t === -1) return;

    const [moved] = notes.splice(s, 1);
    notes.splice(t, 0, moved);

    saveNotesToStorage(STORAGE_KEY, notes);
    renderNotes();
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove("dragging");
    draggedNoteId = null;
}

// Init
window.addEventListener("DOMContentLoaded", () => {
    notes = loadNotesFromStorage(STORAGE_KEY);
    renderNotes();
});
